import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appointmentCountForShift,
  calculateNeutralWebKpis,
  formatKpiPace,
  formatKpiRate,
  visibleShiftCounts,
  workedHoursForShift,
} from '../client/performance-web-kpis.mjs';

const SHIFT_ID = '11111111-1111-4111-8111-111111111111';

function knock(id, type, capturedAt) {
  return { client_event_id: id, shift_id: SHIFT_ID, event_type: type, captured_at: capturedAt };
}

test('worked hours remain available separately from productive knock time', () => {
  const shift = {
    status: 'active',
    started_at: '2026-08-21T16:00:00.000Z',
    finished_at: null,
    break_seconds: 900,
  };
  assert.equal(workedHoursForShift(shift, '2026-08-21T18:15:00.000Z'), 2);
});

test('finished shift uses authoritative finish and fails closed on impossible breaks', () => {
  assert.equal(workedHoursForShift({
    status: 'finished',
    started_at: '2026-08-21T16:00:00.000Z',
    finished_at: '2026-08-21T17:30:00.000Z',
    break_seconds: 1800,
  }), 1);
  assert.equal(workedHoursForShift({
    status: 'finished',
    started_at: '2026-08-21T16:00:00.000Z',
    finished_at: '2026-08-21T16:10:00.000Z',
    break_seconds: 900,
  }), null);
});

test('local count draft may temporarily supersede server counts for live feedback', () => {
  assert.deepEqual(
    visibleShiftCounts({ doors: 10, conversations: 3 }, { doors: 12, conversations: 4 }),
    { doors: 12, conversations: 4 },
  );
});

test('appointment counting deduplicates server and pending SET ids and excludes void', () => {
  const result = appointmentCountForShift({
    shiftId: SHIFT_ID,
    serverRows: [
      { client_set_id: 'a', origin_shift_id: SHIFT_ID, status: 'open' },
      { client_set_id: 'b', origin_shift_id: SHIFT_ID, status: 'void' },
    ],
    pendingWrites: [
      { id: 'a', kind: 'SET', payload: { originShiftId: SHIFT_ID, status: 'open' } },
      { id: 'c', kind: 'SET', payload: { originShiftId: SHIFT_ID, status: 'open' } },
      { id: 'd', kind: 'SET', payload: { originShiftId: '22222222-2222-4222-8222-222222222222', status: 'open' } },
    ],
  });
  assert.deepEqual(result, { count: 2, pendingSyncCount: 1 });
});

test('neutral KPI per-hour math uses explicit productive knock time', () => {
  const kpis = calculateNeutralWebKpis({
    shift: {
      id: SHIFT_ID,
      status: 'finished',
      started_at: '2026-08-21T16:00:00.000Z',
      finished_at: '2026-08-21T20:00:00.000Z',
      break_seconds: 0,
      doors: 40,
      conversations: 12,
    },
    knockEvents: [
      knock('a', 'KNOCK_STARTED', '2026-08-21T16:30:00.000Z'),
      knock('b', 'KNOCK_STOPPED', '2026-08-21T18:30:00.000Z'),
    ],
    appointmentCount: 3,
  });
  assert.equal(kpis.workedHours, 4);
  assert.equal(kpis.knockHours, 2);
  assert.equal(kpis.doorsPerHour, 20);
  assert.equal(kpis.conversationsPerHour, 6);
  assert.equal(kpis.appointmentsPerHour, 1.5);
  assert.equal(kpis.conversationRate, 0.3);
  assert.equal(kpis.appointmentRate, 0.25);
  assert.equal(formatKpiPace(kpis.appointmentsPerHour), '1.5');
  assert.equal(formatKpiRate(kpis.conversationRate), '30.0%');
});

test('no Knock Clock evidence never falls back to total shift duration', () => {
  const kpis = calculateNeutralWebKpis({
    shift: {
      id: SHIFT_ID,
      status: 'finished',
      started_at: '2026-08-21T16:00:00.000Z',
      finished_at: '2026-08-21T20:00:00.000Z',
      break_seconds: 0,
      doors: 40,
      conversations: 12,
    },
    appointmentCount: 3,
    knockEvents: [],
  });
  assert.equal(kpis.workedHours, 4);
  assert.equal(kpis.knockHours, 0);
  assert.equal(kpis.doorsPerHour, null);
  assert.equal(kpis.conversationsPerHour, null);
  assert.equal(kpis.appointmentsPerHour, null);
  assert.equal(kpis.conversationRate, 0.3);
});

test('zero denominators render unavailable instead of fake zero performance', () => {
  const kpis = calculateNeutralWebKpis({
    shift: {
      id: SHIFT_ID,
      status: 'active',
      started_at: '2026-08-21T18:00:00.000Z',
      doors: 0,
      conversations: 0,
    },
    appointmentCount: 0,
    knockEvents: [],
    now: '2026-08-21T18:00:00.000Z',
  });
  assert.equal(kpis.doorsPerHour, null);
  assert.equal(kpis.conversationRate, null);
  assert.equal(kpis.appointmentRate, null);
  assert.equal(formatKpiPace(kpis.doorsPerHour), '—');
  assert.equal(formatKpiRate(kpis.conversationRate), '—');
});
