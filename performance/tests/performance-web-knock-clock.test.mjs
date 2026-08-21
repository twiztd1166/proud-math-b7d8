import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveKnockClock,
  formatKnockDuration,
  mergeKnockClockEvents,
} from '../client/performance-web-knock-clock.mjs';

const SHIFT_ID = '11111111-1111-4111-8111-111111111111';

function shift(overrides = {}) {
  return {
    id: SHIFT_ID,
    status: 'active',
    started_at: '2026-08-21T16:00:00.000Z',
    finished_at: null,
    ...overrides,
  };
}

function event(id, type, capturedAt, shiftId = SHIFT_ID) {
  return { client_event_id: id, shift_id: shiftId, event_type: type, captured_at: capturedAt };
}

test('explicit starts and stops accumulate productive intervals only', () => {
  const result = deriveKnockClock({
    shift: shift(),
    events: [
      event('a', 'KNOCK_STARTED', '2026-08-21T16:15:00.000Z'),
      event('b', 'KNOCK_STOPPED', '2026-08-21T17:15:00.000Z'),
      event('c', 'KNOCK_STARTED', '2026-08-21T17:45:00.000Z'),
    ],
    now: '2026-08-21T18:15:00.000Z',
  });
  assert.equal(result.hours, 1.5);
  assert.equal(result.active, true);
  assert.equal(result.intervals.length, 2);
  assert.equal(formatKnockDuration(result.totalSeconds), '01:30:00');
});

test('repeated/out-of-order events do not double count and events outside shift bounds are ignored', () => {
  const result = deriveKnockClock({
    shift: shift(),
    events: [
      event('late-stop', 'KNOCK_STOPPED', '2026-08-21T17:00:00.000Z'),
      event('start-2', 'KNOCK_STARTED', '2026-08-21T16:20:00.000Z'),
      event('start-1', 'KNOCK_STARTED', '2026-08-21T16:10:00.000Z'),
      event('before', 'KNOCK_STARTED', '2026-08-21T15:00:00.000Z'),
      event('after', 'KNOCK_STOPPED', '2026-08-21T19:00:00.000Z'),
    ],
    now: '2026-08-21T18:00:00.000Z',
  });
  assert.equal(result.totalSeconds, 50 * 60);
  assert.equal(result.active, false);
  assert.equal(result.intervals.length, 1);
});

test('finished shift closes an unclosed productive interval at authoritative finish time', () => {
  const result = deriveKnockClock({
    shift: shift({ status: 'finished', finished_at: '2026-08-21T18:00:00.000Z' }),
    events: [event('a', 'KNOCK_STARTED', '2026-08-21T17:15:00.000Z')],
    now: '2026-08-21T20:00:00.000Z',
  });
  assert.equal(result.totalSeconds, 45 * 60);
  assert.equal(result.active, false);
  assert.equal(result.intervals[0].stoppedAt, '2026-08-21T18:00:00.000Z');
});

test('historical shift with no explicit knock events has zero productive time instead of Day Clock substitution', () => {
  const result = deriveKnockClock({
    shift: shift({ status: 'finished', finished_at: '2026-08-21T20:00:00.000Z' }),
    events: [],
  });
  assert.equal(result.hours, 0);
  assert.equal(result.totalSeconds, 0);
  assert.equal(result.active, false);
});

test('server and pending events merge idempotently and rejected writes do not affect timing', () => {
  const merged = mergeKnockClockEvents({
    shiftId: SHIFT_ID,
    serverRows: [event('same', 'KNOCK_STARTED', '2026-08-21T16:00:00.000Z')],
    pendingWrites: [
      { id: 'same', kind: 'EVENT', capturedAt: '2026-08-21T16:00:00.000Z', state: 'PENDING', payload: { type: 'KNOCK_STARTED', shiftId: SHIFT_ID } },
      { id: 'pending', kind: 'EVENT', capturedAt: '2026-08-21T17:00:00.000Z', state: 'PENDING', payload: { type: 'KNOCK_STOPPED', shiftId: SHIFT_ID } },
      { id: 'rejected', kind: 'EVENT', capturedAt: '2026-08-21T17:30:00.000Z', state: 'REJECTED', payload: { type: 'KNOCK_STARTED', shiftId: SHIFT_ID } },
    ],
  });
  assert.equal(merged.events.length, 2);
  assert.equal(merged.pendingSyncCount, 1);
  assert.equal(merged.rejectedCount, 1);
});
