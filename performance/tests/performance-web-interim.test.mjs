import test from 'node:test';
import assert from 'node:assert/strict';
import { BrowserForegroundLocationBridge } from '../client/performance-web-location.mjs';

const SHIFT_ID = '11111111-1111-4111-8111-111111111111';
const EMPLOYEE_ID = '22222222-2222-4222-8222-222222222222';
const DEVICE_ID = '33333333-3333-4333-8333-333333333333';
const POINT_ID = '44444444-4444-4444-8444-444444444444';

function fakeDocument() {
  const listeners = new Map();
  return {
    visibilityState: 'visible',
    addEventListener(name, handler) { listeners.set(name, handler); },
    removeEventListener(name) { listeners.delete(name); },
    async setVisibility(next) {
      this.visibilityState = next;
      await listeners.get('visibilitychange')?.();
      await new Promise(resolve => setTimeout(resolve, 0));
    },
  };
}

function navigatorWithPosition({ deny = false, watch = true, wakeLock = true } = {}) {
  let currentCalls = 0;
  let watchCalls = 0;
  let clearCalls = 0;
  let wakeLockCalls = 0;
  let nextWatchId = 7;
  const navigatorRef = {
    permissions: { query: async () => ({ state: deny ? 'denied' : 'granted' }) },
    geolocation: {
      getCurrentPosition(success, error) {
        currentCalls += 1;
        if (deny) return error({ code: 1, message: 'denied' });
        success({
          timestamp: Date.parse('2026-08-21T08:00:00Z'),
          coords: {
            latitude: 26.35,
            longitude: -80.09,
            accuracy: 12,
            altitude: null,
            speed: null,
            heading: null,
          },
        });
      },
    },
  };
  if (watch) {
    navigatorRef.geolocation.watchPosition = () => {
      watchCalls += 1;
      return nextWatchId++;
    };
    navigatorRef.geolocation.clearWatch = () => { clearCalls += 1; };
  }
  if (wakeLock) {
    navigatorRef.wakeLock = {
      async request() {
        wakeLockCalls += 1;
        return {
          released: false,
          addEventListener() {},
          async release() { this.released = true; },
        };
      },
    };
  }
  return {
    navigatorRef,
    calls: () => ({ currentCalls, watchCalls, clearCalls, wakeLockCalls }),
  };
}

test('explicit Start My Day captures an initial sample then enables visible continuous GPS with wake lock', async () => {
  const writes = [];
  const fake = navigatorWithPosition();
  const documentRef = fakeDocument();
  const bridge = new BrowserForegroundLocationBridge({
    navigatorRef: fake.navigatorRef,
    documentRef,
    uuid: () => POINT_ID,
    onQueuedLocation: async write => writes.push(write),
  });

  const state = await bridge.startShift({
    shiftId: SHIFT_ID,
    employeeId: EMPLOYEE_ID,
    deviceId: DEVICE_ID,
    initiatedByUser: true,
  });

  assert.equal(state.state, 'WEB_FOREGROUND_CONTINUOUS');
  assert.equal(state.continuousForegroundTracking, true);
  assert.equal(state.continuousBackgroundTracking, false);
  assert.equal(state.screenWakeLock, 'ACTIVE');
  assert.deepEqual(fake.calls(), { currentCalls: 1, watchCalls: 1, clearCalls: 0, wakeLockCalls: 1 });
  assert.equal(writes.length, 1);
  assert.equal(writes[0].kind, 'LOCATION');
  assert.equal(writes[0].payload.source, 'web-foreground-sample');
  assert.equal(writes[0].payload.shiftId, SHIFT_ID);
});

test('reattaching an active visible web shift resumes watcher without silently requesting a new GPS sample', async () => {
  const writes = [];
  const fake = navigatorWithPosition();
  const bridge = new BrowserForegroundLocationBridge({
    navigatorRef: fake.navigatorRef,
    documentRef: fakeDocument(),
    uuid: () => POINT_ID,
    onQueuedLocation: async write => writes.push(write),
  });

  const state = await bridge.attachToAlreadyActiveShift({ shiftId: SHIFT_ID, employeeId: EMPLOYEE_ID, deviceId: DEVICE_ID });
  assert.equal(state.state, 'WEB_FOREGROUND_CONTINUOUS');
  assert.equal(state.continuousForegroundTracking, true);
  assert.deepEqual(fake.calls(), { currentCalls: 0, watchCalls: 1, clearCalls: 0, wakeLockCalls: 1 });
  assert.equal(writes.length, 0);
});

test('visibility loss stops watcher and visible return resumes it only when permission is already granted', async () => {
  const fake = navigatorWithPosition();
  const documentRef = fakeDocument();
  const bridge = new BrowserForegroundLocationBridge({
    navigatorRef: fake.navigatorRef,
    documentRef,
    uuid: () => POINT_ID,
    onQueuedLocation: async () => undefined,
  });

  await bridge.startShift({ shiftId: SHIFT_ID, employeeId: EMPLOYEE_ID, deviceId: DEVICE_ID, initiatedByUser: true });
  await documentRef.setVisibility('hidden');
  let state = bridge.getState();
  assert.equal(state.state, 'WEB_FOREGROUND_PAUSED');
  assert.equal(state.continuousForegroundTracking, false);
  assert.equal(state.continuousBackgroundTracking, false);
  assert.equal(state.screenWakeLock, 'PAUSED_HIDDEN');

  await documentRef.setVisibility('visible');
  state = bridge.getState();
  assert.equal(state.state, 'WEB_FOREGROUND_CONTINUOUS');
  assert.equal(state.continuousForegroundTracking, true);
  assert.deepEqual(fake.calls(), { currentCalls: 1, watchCalls: 2, clearCalls: 1, wakeLockCalls: 2 });
});

test('browser without watchPosition remains an explicit foreground sample-only fallback', async () => {
  const fake = navigatorWithPosition({ watch: false });
  const bridge = new BrowserForegroundLocationBridge({
    navigatorRef: fake.navigatorRef,
    documentRef: fakeDocument(),
    uuid: () => POINT_ID,
    onQueuedLocation: async () => undefined,
  });

  const state = await bridge.startShift({ shiftId: SHIFT_ID, employeeId: EMPLOYEE_ID, deviceId: DEVICE_ID, initiatedByUser: true });
  assert.equal(state.state, 'WEB_FOREGROUND_SAMPLE_ONLY');
  assert.equal(state.continuousForegroundTracking, false);
  assert.equal(state.continuousBackgroundTracking, false);
  assert.deepEqual(fake.calls(), { currentCalls: 1, watchCalls: 0, clearCalls: 0, wakeLockCalls: 1 });
});

test('denied browser location remains visible without preventing the authoritative shift flow', async () => {
  const fake = navigatorWithPosition({ deny: true });
  const bridge = new BrowserForegroundLocationBridge({
    navigatorRef: fake.navigatorRef,
    documentRef: fakeDocument(),
    uuid: () => POINT_ID,
    onQueuedLocation: async () => undefined,
  });

  const state = await bridge.startShift({ shiftId: SHIFT_ID, employeeId: EMPLOYEE_ID, deviceId: DEVICE_ID, initiatedByUser: true });
  assert.equal(state.state, 'PERMISSION_REQUIRED');
  assert.equal(state.continuousBackgroundTracking, false);
  assert.equal(fake.calls().currentCalls, 1);
  assert.equal(fake.calls().watchCalls, 0);
});

test('web location cannot start without an explicit user-initiated action', async () => {
  const fake = navigatorWithPosition();
  const bridge = new BrowserForegroundLocationBridge({
    navigatorRef: fake.navigatorRef,
    documentRef: fakeDocument(),
    uuid: () => POINT_ID,
    onQueuedLocation: async () => undefined,
  });

  await assert.rejects(
    bridge.startShift({ shiftId: SHIFT_ID, employeeId: EMPLOYEE_ID, deviceId: DEVICE_ID, initiatedByUser: false }),
    /visible Start My Day/,
  );
  assert.equal(fake.calls().currentCalls, 0);
  assert.equal(fake.calls().watchCalls, 0);
});
