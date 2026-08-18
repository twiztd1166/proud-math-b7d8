import test from 'node:test';
import assert from 'node:assert/strict';
import { PerformanceTodayController } from '../client/performance-today.mjs';
import { renderPerformanceTodayMarkup } from '../client/performance-today-ui.mjs';

const employeeId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
const deviceId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1';
const shiftId = '11111111-1111-4111-8111-111111111111';
const clientShiftId = '22222222-2222-4222-8222-222222222222';
const startEventId = '33333333-3333-4333-8333-333333333333';
const finishEventId = '44444444-4444-4444-8444-444444444444';

function shift(overrides = {}) {
  return {
    id: shiftId,
    client_shift_id: clientShiftId,
    employee_id: employeeId,
    device_id: deviceId,
    territory_id: null,
    status: 'active',
    started_at: '2026-08-18T12:00:00.000Z',
    finished_at: null,
    doors: 0,
    conversations: 0,
    break_seconds: 0,
    ...overrides,
  };
}

function harness({ active = null, startLocationState = 'ACTIVE', finishFails = false } = {}) {
  let current = active;
  const calls = { start: [], finish: [], attach: [], locationStart: [], locationStop: [], cleanup: 0, capture: 0 };
  const writes = [];
  const ids = [clientShiftId, startEventId, finishEventId];
  const shiftTransport = {
    async findActiveShift() { return current; },
    async startShift(args) { calls.start.push(args); current = shift({ client_shift_id: args.clientShiftId, started_at: args.startedAt }); return current; },
    async finishShift(args) {
      calls.finish.push(args);
      if (finishFails) throw new Error('network finish failed');
      current = shift({
        ...current,
        status: 'finished',
        finished_at: args.finishedAt,
        doors: args.doors,
        conversations: args.conversations,
      });
      return current;
    },
  };
  const locationBridge = {
    async startShift(args) { calls.locationStart.push(args); return { state: startLocationState, permission: startLocationState === 'LIMITED' ? 'GRANTED_APPROXIMATE' : 'GRANTED_PRECISE' }; },
    async attachToAlreadyActiveShift(args) { calls.attach.push(args); return { state: active ? 'ACTIVE' : 'STOPPED', permission: 'GRANTED_PRECISE' }; },
    async captureNow() {
      calls.capture += 1;
      return { payload: { latitude: 26.3, longitude: -80.1, accuracyMeters: 9 } };
    },
    async stopShift(args) { calls.locationStop.push(args); return { state: 'STOPPED', permission: 'GRANTED_PRECISE' }; },
    async ensureStoppedWhenNoActiveShift() { calls.cleanup += 1; return { state: 'STOPPED', permission: null }; },
  };
  const syncQueue = {
    async enqueue(write) { writes.push(write); return write; },
  };
  const controller = new PerformanceTodayController({
    shiftTransport,
    employeeId,
    deviceId,
    locationBridge,
    syncQueue,
    now: (() => {
      const times = [new Date('2026-08-18T12:00:00.000Z'), new Date('2026-08-18T18:30:00.000Z')];
      return () => times.shift() ?? new Date('2026-08-18T18:30:00.000Z');
    })(),
    uuid: () => ids.shift(),
  });
  return { controller, calls, writes, getCurrent: () => current };
}

test('idle load forces orphan native tracking off and exposes Start My Day', async () => {
  const h = harness();
  await h.controller.load();
  assert.equal(h.calls.cleanup, 1);
  const state = h.controller.getState();
  assert.equal(state.mode, 'IDLE');
  const html = renderPerformanceTodayMarkup(state);
  assert.match(html, /START MY DAY/);
  assert.doesNotMatch(html, /ON PACE|BELOW STANDARD|ABOVE STANDARD/);
});

test('Start My Day creates one authoritative shift before native tracking', async () => {
  const h = harness();
  await h.controller.startMyDay();
  assert.equal(h.calls.start.length, 1);
  assert.equal(h.calls.locationStart.length, 1);
  assert.equal(h.calls.locationStart[0].shiftId, shiftId);
  assert.equal(h.calls.locationStart[0].initiatedByUser, true);
  assert.equal(h.writes.length, 1);
  assert.equal(h.writes[0].kind, 'EVENT');
  assert.equal(h.writes[0].payload.type, 'SHIFT_STARTED');
  assert.equal(h.controller.getState().mode, 'ACTIVE');
});

test('existing authoritative shift is recovered instead of duplicated', async () => {
  const h = harness({ active: shift() });
  await h.controller.startMyDay();
  assert.equal(h.calls.start.length, 0);
  assert.equal(h.calls.attach.length, 1);
  assert.equal(h.calls.locationStart.length, 0);
  assert.equal(h.controller.getState().shift.id, shiftId);
});

test('native GPS failure does not create a second shift or roll back the authoritative day', async () => {
  const h = harness();
  h.controller.locationBridge.startShift = async () => { throw new Error('native start failed'); };
  const state = await h.controller.startMyDay();
  assert.equal(h.calls.start.length, 1);
  assert.equal(h.getCurrent().status, 'active');
  assert.equal(state.mode, 'ACTIVE');
  assert.equal(state.location.state, 'ERROR');
  assert.match(state.warning, /Shift started/);
});

test('Finish Day records best-effort end GPS, queues finish event, then stops native tracking', async () => {
  const h = harness({ active: shift({ doors: 148, conversations: 47 }) });
  await h.controller.load();
  await h.controller.finishDay();
  assert.equal(h.calls.capture, 1);
  assert.equal(h.calls.finish.length, 1);
  assert.deepEqual(h.calls.finish[0].endLocation, { latitude: 26.3, longitude: -80.1, accuracyMeters: 9 });
  assert.equal(h.calls.locationStop.length, 1);
  assert.equal(h.writes.at(-1).payload.type, 'SHIFT_FINISHED');
  assert.equal(h.controller.getState().mode, 'COMPLETE');
  const html = renderPerformanceTodayMarkup(h.controller.getState());
  assert.match(html, /DAY COMPLETE/);
});

test('failed authoritative Finish Day keeps the shift active and does not stop GPS', async () => {
  const h = harness({ active: shift(), finishFails: true });
  await h.controller.load();
  await assert.rejects(() => h.controller.finishDay(), /network finish failed/);
  assert.equal(h.calls.locationStop.length, 0);
  assert.equal(h.controller.getState().mode, 'ACTIVE');
  assert.match(h.controller.getState().warning, /did not complete/);
});
