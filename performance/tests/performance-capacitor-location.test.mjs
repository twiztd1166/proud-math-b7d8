import test from 'node:test';
import assert from 'node:assert/strict';
import { CapacitorPerformanceLocationBridge } from '../native/capacitor-location-bridge.mjs';

const shiftId = '11111111-1111-4111-8111-111111111111';
const otherShiftId = '22222222-2222-4222-8222-222222222222';
const employeeId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
const deviceId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1';
const otherDeviceId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2';
const pointId = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1';
const pointId2 = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2';

function sample(overrides = {}) {
  return {
    clientPointId: pointId,
    employeeId,
    deviceId,
    shiftId,
    latitude: 26.3683,
    longitude: -80.1289,
    accuracyMeters: 12,
    capturedAt: '2026-08-18T12:00:00.000Z',
    platform: 'ios',
    precise: true,
    source: 'native',
    ...overrides,
  };
}

function pluginMock({
  permission = 'GRANTED_PRECISE',
  status = { active: false, shiftId: null, employeeId: null, deviceId: null },
  pending = [],
} = {}) {
  const calls = { request: 0, start: [], reattach: [], stop: [], add: 0, remove: 0, current: 0, drain: 0, ack: [], order: [] };
  let listener = null;
  let trackingStatus = { ...status };
  const spool = pending.map(value => structuredClone(value));
  return {
    calls,
    spool,
    async persistAndEmit(value) {
      spool.push(structuredClone(value));
      return listener?.(structuredClone(value));
    },
    persist(value) { spool.push(structuredClone(value)); },
    emit(value) { return listener?.(structuredClone(value)); },
    async getPermissionState() { return permission; },
    async requestShiftLocationPermission() { calls.request += 1; return permission; },
    async startShiftTracking(args) {
      calls.order.push('start');
      calls.start.push(args);
      trackingStatus = { active: true, shiftId: args.shiftId, employeeId: args.employeeId, deviceId: args.deviceId };
    },
    async reattachShiftTracking(args) {
      calls.order.push('reattach');
      calls.reattach.push(args);
      if (!trackingStatus.active || trackingStatus.shiftId !== args.shiftId || trackingStatus.employeeId !== args.employeeId || trackingStatus.deviceId !== args.deviceId) {
        throw new Error('no matching persisted context');
      }
    },
    async stopShiftTracking(args) {
      calls.order.push('stop');
      calls.stop.push(args);
      trackingStatus = { active: false, shiftId: null, employeeId: null, deviceId: null };
    },
    async getTrackingStatus() { return { ...trackingStatus }; },
    async getCurrentLocation() {
      calls.current += 1;
      const value = sample();
      if (!spool.some(row => row.clientPointId === value.clientPointId)) spool.push(structuredClone(value));
      return value;
    },
    async drainPendingLocations({ limit = 250 } = {}) {
      calls.order.push('drain');
      calls.drain += 1;
      const samples = spool.slice(0, limit).map(value => structuredClone(value));
      return { samples, remaining: Math.max(0, spool.length - samples.length) };
    },
    async ackPendingLocations({ clientPointIds }) {
      calls.order.push('ack');
      calls.ack.push([...clientPointIds]);
      const ids = new Set(clientPointIds);
      for (let index = spool.length - 1; index >= 0; index -= 1) {
        if (ids.has(spool[index].clientPointId)) spool.splice(index, 1);
      }
      return { acknowledged: ids.size, pending: spool.length };
    },
    async addLocationListener(cb) { calls.add += 1; listener = cb; return { id: 'listener-1' }; },
    async removeLocationListener() { calls.remove += 1; listener = null; },
  };
}

function bridge(plugin, writes = [], onQueuedLocation = async write => writes.push(write)) {
  return new CapacitorPerformanceLocationBridge({
    plugin,
    onQueuedLocation,
    uuid: () => pointId2,
  });
}

const tick = () => new Promise(resolve => setImmediate(resolve));

test('tracking cannot start without visible Start My Day initiation', async () => {
  const plugin = pluginMock();
  const b = bridge(plugin);
  await assert.rejects(() => b.startShift({ shiftId, employeeId, deviceId }), /visible Start My Day/);
  assert.equal(plugin.calls.start.length, 0);
});

test('explicit start binds employee/device/shift and acknowledges a persisted listener point only after JS queue acceptance', async () => {
  const plugin = pluginMock();
  const writes = [];
  const b = bridge(plugin, writes);
  const state = await b.startShift({ shiftId, employeeId, deviceId, initiatedByUser: true });
  assert.equal(state.state, 'ACTIVE');
  assert.deepEqual(plugin.calls.start[0], {
    shiftId,
    employeeId,
    deviceId,
    accuracyMode: 'precise',
    initiatedByUser: true,
  });

  await plugin.persistAndEmit(sample());
  await tick();
  assert.equal(writes.length, 1);
  assert.equal(writes[0].id, pointId);
  assert.equal(writes[0].kind, 'LOCATION');
  assert.equal(writes[0].capturedAt, '2026-08-18T12:00:00.000Z');
  assert.equal(writes[0].payload.shiftId, shiftId);
  assert.equal(writes[0].payload.employeeId, employeeId);
  assert.equal(writes[0].payload.deviceId, deviceId);
  assert.deepEqual(plugin.calls.ack.at(-1), [pointId]);
  assert.equal(plugin.spool.length, 0);
});

test('native point remains unacknowledged when durable JS queue acceptance fails', async () => {
  const plugin = pluginMock();
  const failure = new Error('local queue unavailable');
  const b = bridge(plugin, [], async () => { throw failure; });
  await b.startShift({ shiftId, employeeId, deviceId, initiatedByUser: true });
  await plugin.persistAndEmit(sample());
  await tick();
  assert.equal(plugin.calls.ack.length, 0);
  assert.equal(plugin.spool.length, 1);
  assert.equal(plugin.spool[0].clientPointId, pointId);
});

test('active bridge is idempotent for same shift and rejects another shift', async () => {
  const plugin = pluginMock();
  const b = bridge(plugin);
  await b.startShift({ shiftId, employeeId, deviceId, initiatedByUser: true });
  await b.startShift({ shiftId, employeeId, deviceId, initiatedByUser: true });
  assert.equal(plugin.calls.start.length, 1);
  await assert.rejects(() => b.startShift({ shiftId: otherShiftId, employeeId, deviceId, initiatedByUser: true }), /Another shift/);
});

test('permission denial never starts native tracking', async () => {
  const plugin = pluginMock({ permission: 'DENIED' });
  const b = bridge(plugin);
  const state = await b.startShift({ shiftId, employeeId, deviceId, initiatedByUser: true });
  assert.equal(state.state, 'PERMISSION_REQUIRED');
  assert.equal(plugin.calls.start.length, 0);
});

test('approximate permission is explicitly LIMITED, not presented as precise', async () => {
  const plugin = pluginMock({ permission: 'GRANTED_APPROXIMATE' });
  const b = bridge(plugin);
  const state = await b.startShift({ shiftId, employeeId, deviceId, initiatedByUser: true });
  assert.equal(state.state, 'LIMITED');
  assert.equal(plugin.calls.start[0].accuracyMode, 'approximate');
});

test('app relaunch resumes exact persisted native context and drains crash-left points into existing idempotent queue', async () => {
  const plugin = pluginMock({
    status: { active: true, shiftId, employeeId, deviceId },
    pending: [sample()],
  });
  const writes = [];
  const b = bridge(plugin, writes);
  const state = await b.attachToAlreadyActiveShift({ shiftId, employeeId, deviceId });
  assert.equal(state.state, 'ACTIVE');
  assert.equal(plugin.calls.start.length, 0);
  assert.equal(plugin.calls.reattach.length, 1);
  assert.deepEqual(plugin.calls.reattach[0], { shiftId, employeeId, deviceId, accuracyMode: 'precise' });
  assert.equal(writes.length, 1);
  assert.equal(writes[0].id, pointId);
  assert.equal(plugin.spool.length, 0);
});

test('app relaunch rejects a native employee/device mismatch instead of adopting it', async () => {
  const plugin = pluginMock({ status: { active: true, shiftId, employeeId, deviceId: otherDeviceId } });
  const b = bridge(plugin);
  await assert.rejects(() => b.attachToAlreadyActiveShift({ shiftId, employeeId, deviceId }), /does not match/);
  assert.equal(plugin.calls.reattach.length, 0);
});

test('app relaunch never invents tracking when native shift is not already active', async () => {
  const plugin = pluginMock();
  const b = bridge(plugin);
  const state = await b.attachToAlreadyActiveShift({ shiftId, employeeId, deviceId });
  assert.equal(state.state, 'STOPPED');
  assert.equal(plugin.calls.start.length, 0);
  assert.equal(plugin.calls.reattach.length, 0);
  assert.equal(plugin.calls.add, 0);
});

test('captureNow uses already-spooled native ID and retains native capturedAt', async () => {
  const plugin = pluginMock();
  const writes = [];
  const b = bridge(plugin, writes);
  await b.startShift({ shiftId, employeeId, deviceId, initiatedByUser: true });
  const queued = await b.captureNow();
  assert.equal(plugin.calls.current, 1);
  assert.equal(queued.id, pointId);
  assert.equal(queued.capturedAt, '2026-08-18T12:00:00.000Z');
  assert.equal(writes.length, 1);
  assert.equal(plugin.spool.length, 0);
});

test('Finish Day stops native production before draining the final spool and detaching listener', async () => {
  const plugin = pluginMock();
  const writes = [];
  const b = bridge(plugin, writes);
  await b.startShift({ shiftId, employeeId, deviceId, initiatedByUser: true });
  plugin.calls.order.length = 0;
  plugin.persist(sample());

  const state = await b.stopShift({ shiftId });
  assert.equal(state.state, 'STOPPED');
  assert.equal(plugin.calls.stop.length, 1);
  assert.equal(plugin.calls.remove, 1);
  assert.equal(writes.length, 1);
  assert.equal(plugin.spool.length, 0);
  assert.equal(plugin.calls.order[0], 'stop');
  assert.ok(plugin.calls.order.indexOf('drain') > plugin.calls.order.indexOf('stop'));
});

test('no-active-shift cleanup recovers historical pending evidence using embedded IDs after forcing native stop', async () => {
  const historical = sample({ clientPointId: pointId2, capturedAt: '2026-08-18T12:05:00.000Z' });
  const plugin = pluginMock({
    status: { active: true, shiftId, employeeId, deviceId },
    pending: [historical],
  });
  const writes = [];
  const b = bridge(plugin, writes);
  const state = await b.ensureStoppedWhenNoActiveShift();
  assert.equal(state.state, 'STOPPED');
  assert.equal(plugin.calls.stop.length, 1);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].id, pointId2);
  assert.equal(writes[0].payload.shiftId, shiftId);
  assert.equal(plugin.spool.length, 0);
});

test('new Start My Day recovers an older crash-left native point before starting the new live context', async () => {
  const historical = sample({ clientPointId: pointId2, shiftId: otherShiftId, capturedAt: '2026-08-17T20:00:00.000Z' });
  const plugin = pluginMock({ pending: [historical] });
  const writes = [];
  const b = bridge(plugin, writes);
  await b.startShift({ shiftId, employeeId, deviceId, initiatedByUser: true });
  assert.equal(writes.length, 1);
  assert.equal(writes[0].id, pointId2);
  assert.equal(writes[0].payload.shiftId, otherShiftId);
  assert.equal(plugin.calls.start.length, 1);
  assert.equal(plugin.spool.length, 0);
});

test('malformed native clientPointId fails closed and is never acknowledged', async () => {
  const bad = sample({ clientPointId: 'not-a-uuid' });
  const plugin = pluginMock({ pending: [bad] });
  const b = bridge(plugin);
  await assert.rejects(() => b.startShift({ shiftId, employeeId, deviceId, initiatedByUser: true }), /clientPointId/);
  assert.equal(plugin.calls.ack.length, 0);
  assert.equal(plugin.spool.length, 1);
});
