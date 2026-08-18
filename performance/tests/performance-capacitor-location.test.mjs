import test from 'node:test';
import assert from 'node:assert/strict';
import { CapacitorPerformanceLocationBridge } from '../native/capacitor-location-bridge.mjs';

const shiftId = '11111111-1111-4111-8111-111111111111';
const otherShiftId = '22222222-2222-4222-8222-222222222222';
const employeeId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
const deviceId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1';
const pointId = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1';

function sample(overrides = {}) {
  return {
    clientPointId: pointId,
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

function pluginMock({ permission = 'GRANTED_PRECISE', status = { active: false, shiftId: null } } = {}) {
  const calls = { request: 0, start: [], reattach: [], stop: [], add: 0, remove: 0, current: 0 };
  let listener = null;
  let trackingStatus = { ...status };
  return {
    calls,
    emit(value) { return listener?.(value); },
    async getPermissionState() { return permission; },
    async requestShiftLocationPermission() { calls.request += 1; return permission; },
    async startShiftTracking(args) { calls.start.push(args); trackingStatus = { active: true, shiftId: args.shiftId }; },
    async reattachShiftTracking(args) {
      calls.reattach.push(args);
      if (!trackingStatus.active || trackingStatus.shiftId !== args.shiftId) throw new Error('no matching persisted shift');
    },
    async stopShiftTracking(args) { calls.stop.push(args); trackingStatus = { active: false, shiftId: null }; },
    async getTrackingStatus() { return { ...trackingStatus }; },
    async getCurrentLocation() { calls.current += 1; return sample(); },
    async addLocationListener(cb) { calls.add += 1; listener = cb; return { id: 'listener-1' }; },
    async removeLocationListener() { calls.remove += 1; listener = null; },
  };
}

function bridge(plugin, writes = []) {
  return new CapacitorPerformanceLocationBridge({
    plugin,
    onQueuedLocation: async write => writes.push(write),
    uuid: () => pointId,
  });
}

test('tracking cannot start without visible Start My Day initiation', async () => {
  const plugin = pluginMock();
  const b = bridge(plugin);
  await assert.rejects(() => b.startShift({ shiftId, employeeId, deviceId }), /visible Start My Day/);
  assert.equal(plugin.calls.start.length, 0);
});

test('explicit start binds one shift and queues normalized native samples', async () => {
  const plugin = pluginMock();
  const writes = [];
  const b = bridge(plugin, writes);
  const state = await b.startShift({ shiftId, employeeId, deviceId, initiatedByUser: true });
  assert.equal(state.state, 'ACTIVE');
  assert.equal(plugin.calls.start.length, 1);
  assert.equal(plugin.calls.start[0].initiatedByUser, true);
  assert.equal(plugin.calls.add, 1);

  await plugin.emit(sample());
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(writes.length, 1);
  assert.equal(writes[0].id, pointId);
  assert.equal(writes[0].kind, 'LOCATION');
  assert.equal(writes[0].capturedAt, '2026-08-18T12:00:00.000Z');
  assert.equal(writes[0].payload.shiftId, shiftId);
  assert.equal(writes[0].payload.employeeId, employeeId);
  assert.equal(writes[0].payload.deviceId, deviceId);
  assert.equal(writes[0].payload.accuracyMeters, 12);
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

test('app relaunch resumes only the existing native shift and never creates a new one', async () => {
  const plugin = pluginMock({ status: { active: true, shiftId } });
  const b = bridge(plugin);
  const state = await b.attachToAlreadyActiveShift({ shiftId, employeeId, deviceId });
  assert.equal(state.state, 'ACTIVE');
  assert.equal(plugin.calls.start.length, 0);
  assert.equal(plugin.calls.reattach.length, 1);
  assert.equal(plugin.calls.reattach[0].shiftId, shiftId);
  assert.equal(plugin.calls.add, 1);
});

test('app relaunch never invents tracking when native shift is not already active', async () => {
  const plugin = pluginMock({ status: { active: false, shiftId: null } });
  const b = bridge(plugin);
  const state = await b.attachToAlreadyActiveShift({ shiftId, employeeId, deviceId });
  assert.equal(state.state, 'STOPPED');
  assert.equal(plugin.calls.start.length, 0);
  assert.equal(plugin.calls.reattach.length, 0);
  assert.equal(plugin.calls.add, 0);
});

test('captureNow uses same queue path and retains native capturedAt', async () => {
  const plugin = pluginMock();
  const writes = [];
  const b = bridge(plugin, writes);
  await b.startShift({ shiftId, employeeId, deviceId, initiatedByUser: true });
  const queued = await b.captureNow();
  assert.equal(plugin.calls.current, 1);
  assert.equal(queued.capturedAt, '2026-08-18T12:00:00.000Z');
  assert.equal(writes.length, 1);
});

test('Finish Day stop removes listener and prevents later samples from being queued', async () => {
  const plugin = pluginMock();
  const writes = [];
  const b = bridge(plugin, writes);
  await b.startShift({ shiftId, employeeId, deviceId, initiatedByUser: true });
  const state = await b.stopShift({ shiftId });
  assert.equal(state.state, 'STOPPED');
  assert.equal(plugin.calls.stop.length, 1);
  assert.equal(plugin.calls.remove, 1);
  await plugin.emit(sample());
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(writes.length, 0);
});

test('no active shift forces orphan native tracking off rather than adopting it', async () => {
  const plugin = pluginMock({ status: { active: true, shiftId } });
  const b = bridge(plugin);
  const state = await b.ensureStoppedWhenNoActiveShift();
  assert.equal(state.state, 'STOPPED');
  assert.equal(plugin.calls.stop.length, 1);
  assert.equal(plugin.calls.stop[0].shiftId, shiftId);
});
