import test from 'node:test';
import assert from 'node:assert/strict';
import { BrowserForegroundLocationBridge } from '../client/performance-web-location.mjs';

const SHIFT_ID = '11111111-1111-4111-8111-111111111111';
const EMPLOYEE_ID = '22222222-2222-4222-8222-222222222222';
const DEVICE_ID = '33333333-3333-4333-8333-333333333333';
let pointCounter = 0;
const uuid = () => `44444444-4444-4444-8444-${String(++pointCounter).padStart(12, '0')}`;

function fakeDocument() {
  const listeners = new Map();
  return {
    visibilityState: 'visible',
    addEventListener(type, fn) { listeners.set(type, fn); },
    removeEventListener(type) { listeners.delete(type); },
    async setVisibility(value) {
      this.visibilityState = value;
      listeners.get('visibilitychange')?.();
      await new Promise(resolve => setTimeout(resolve, 0));
    },
  };
}

function navigatorWithPosition({ deny = false, wakeLock = true, permissions = true } = {}) {
  let currentCalls = 0;
  let watchCalls = 0;
  let clearCalls = 0;
  let wakeRequests = 0;
  let watchSuccess = null;
  let watchError = null;
  const sentinel = {
    released: false,
    addEventListener() {},
    async release() { this.released = true; },
  };
  const navigatorRef = {
    ...(permissions ? { permissions: { query: async () => ({ state: deny ? 'denied' : 'granted' }) } } : {}),
    geolocation: {
      getCurrentPosition(success, error) {
        currentCalls += 1;
        if (deny) return error({ code: 1, message: 'denied' });
        success({ timestamp: Date.parse('2026-08-21T08:00:00Z'), coords: { latitude: 26.35, longitude: -80.09, accuracy: 12, altitude: null, speed: null, heading: null } });
      },
      watchPosition(success, error) {
        watchCalls += 1;
        watchSuccess = success;
        watchError = error;
        return watchCalls;
      },
      clearWatch() { clearCalls += 1; },
    },
    ...(wakeLock ? { wakeLock: { async request() { wakeRequests += 1; sentinel.released = false; return sentinel; } } } : {}),
  };
  return {
    navigatorRef,
    calls: () => ({ currentCalls, watchCalls, clearCalls, wakeRequests }),
    emitWatch({ timestamp = Date.parse('2026-08-21T08:00:12Z'), latitude = 26.3502, longitude = -80.0902 } = {}) {
      watchSuccess?.({ timestamp, coords: { latitude, longitude, accuracy: 9, altitude: null, speed: 1.4, heading: 90 } });
    },
    denyWatch() { watchError?.({ code: 1, message: 'denied' }); },
  };
}

test('explicit Start My Day captures a sample, starts continuous foreground watch, and requests wake lock', async () => {
  const writes = [];
  const fake = navigatorWithPosition();
  const documentRef = fakeDocument();
  const bridge = new BrowserForegroundLocationBridge({ navigatorRef: fake.navigatorRef, documentRef, uuid, onQueuedLocation: async write => writes.push(write) });
  const state = await bridge.startShift({ shiftId: SHIFT_ID, employeeId: EMPLOYEE_ID, deviceId: DEVICE_ID, initiatedByUser: true });
  assert.equal(state.state, 'WEB_FOREGROUND_CONTINUOUS');
  assert.equal(state.continuousForegroundTracking, true);
  assert.equal(state.continuousBackgroundTracking, false);
  assert.equal(state.screenWakeLock, 'ACTIVE');
  assert.deepEqual(fake.calls(), { currentCalls: 1, watchCalls: 1, clearCalls: 0, wakeRequests: 1 });
  assert.equal(writes[0].payload.source, 'web-foreground-sample');
});

test('watchPosition samples are queued as foreground-watch evidence', async () => {
  const writes = [];
  const fake = navigatorWithPosition();
  const bridge = new BrowserForegroundLocationBridge({ navigatorRef: fake.navigatorRef, documentRef: fakeDocument(), uuid, onQueuedLocation: async write => writes.push(write) });
  await bridge.startShift({ shiftId: SHIFT_ID, employeeId: EMPLOYEE_ID, deviceId: DEVICE_ID, initiatedByUser: true });
  fake.emitWatch();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(writes.length, 2);
  assert.equal(writes[1].payload.source, 'web-foreground-watch');
  assert.equal(writes[1].payload.shiftId, SHIFT_ID);
});

test('visibility loss stops the watcher and visibility return auto-resumes after granted permission', async () => {
  const fake = navigatorWithPosition();
  const documentRef = fakeDocument();
  const bridge = new BrowserForegroundLocationBridge({ navigatorRef: fake.navigatorRef, documentRef, uuid, onQueuedLocation: async () => undefined });
  await bridge.startShift({ shiftId: SHIFT_ID, employeeId: EMPLOYEE_ID, deviceId: DEVICE_ID, initiatedByUser: true });
  await documentRef.setVisibility('hidden');
  assert.equal(bridge.getState().continuousForegroundTracking, false);
  assert.equal(bridge.getState().continuousBackgroundTracking, false);
  assert.equal(bridge.getState().screenWakeLock, 'PAUSED_HIDDEN');
  assert.equal(fake.calls().clearCalls, 1);
  await documentRef.setVisibility('visible');
  assert.equal(bridge.getState().continuousForegroundTracking, true);
  assert.equal(bridge.getState().screenWakeLock, 'ACTIVE');
  assert.equal(fake.calls().watchCalls, 2);
});

test('reattaching an active shift auto-resumes only when permission is already granted', async () => {
  const granted = navigatorWithPosition();
  const grantedBridge = new BrowserForegroundLocationBridge({ navigatorRef: granted.navigatorRef, documentRef: fakeDocument(), uuid, onQueuedLocation: async () => undefined });
  const grantedState = await grantedBridge.attachToAlreadyActiveShift({ shiftId: SHIFT_ID, employeeId: EMPLOYEE_ID, deviceId: DEVICE_ID });
  assert.equal(grantedState.continuousForegroundTracking, true);
  assert.equal(granted.calls().currentCalls, 0);

  const unknown = navigatorWithPosition({ permissions: false });
  const unknownBridge = new BrowserForegroundLocationBridge({ navigatorRef: unknown.navigatorRef, documentRef: fakeDocument(), uuid, onQueuedLocation: async () => undefined });
  const unknownState = await unknownBridge.attachToAlreadyActiveShift({ shiftId: SHIFT_ID, employeeId: EMPLOYEE_ID, deviceId: DEVICE_ID });
  assert.equal(unknownState.state, 'WEB_FOREGROUND_PAUSED');
  assert.equal(unknownState.continuousForegroundTracking, false);
  assert.equal(unknown.calls().currentCalls, 0);
});

test('manual resume can establish permission and start live foreground GPS without native background claims', async () => {
  const fake = navigatorWithPosition({ permissions: false });
  const bridge = new BrowserForegroundLocationBridge({ navigatorRef: fake.navigatorRef, documentRef: fakeDocument(), uuid, onQueuedLocation: async () => undefined });
  await bridge.attachToAlreadyActiveShift({ shiftId: SHIFT_ID, employeeId: EMPLOYEE_ID, deviceId: DEVICE_ID });
  const state = await bridge.resumeForegroundTracking({ initiatedByUser: true });
  assert.equal(state.permission, 'GRANTED');
  assert.equal(state.continuousForegroundTracking, true);
  assert.equal(state.continuousBackgroundTracking, false);
});

test('denied browser location remains visible without starting a watcher or blocking the shift', async () => {
  const fake = navigatorWithPosition({ deny: true });
  const bridge = new BrowserForegroundLocationBridge({ navigatorRef: fake.navigatorRef, documentRef: fakeDocument(), uuid, onQueuedLocation: async () => undefined });
  const state = await bridge.startShift({ shiftId: SHIFT_ID, employeeId: EMPLOYEE_ID, deviceId: DEVICE_ID, initiatedByUser: true });
  assert.equal(state.state, 'PERMISSION_REQUIRED');
  assert.equal(state.continuousForegroundTracking, false);
  assert.equal(state.continuousBackgroundTracking, false);
  assert.equal(fake.calls().watchCalls, 0);
});

test('wake lock unavailability degrades safely while foreground watch remains active', async () => {
  const fake = navigatorWithPosition({ wakeLock: false });
  const bridge = new BrowserForegroundLocationBridge({ navigatorRef: fake.navigatorRef, documentRef: fakeDocument(), uuid, onQueuedLocation: async () => undefined });
  const state = await bridge.startShift({ shiftId: SHIFT_ID, employeeId: EMPLOYEE_ID, deviceId: DEVICE_ID, initiatedByUser: true });
  assert.equal(state.continuousForegroundTracking, true);
  assert.equal(state.screenWakeLock, 'UNAVAILABLE');
});

test('web location cannot start without explicit Start My Day user action', async () => {
  const fake = navigatorWithPosition();
  const bridge = new BrowserForegroundLocationBridge({ navigatorRef: fake.navigatorRef, documentRef: fakeDocument(), uuid, onQueuedLocation: async () => undefined });
  await assert.rejects(bridge.startShift({ shiftId: SHIFT_ID, employeeId: EMPLOYEE_ID, deviceId: DEVICE_ID, initiatedByUser: false }), /visible Start My Day/);
  assert.equal(fake.calls().currentCalls, 0);
  assert.equal(fake.calls().watchCalls, 0);
});