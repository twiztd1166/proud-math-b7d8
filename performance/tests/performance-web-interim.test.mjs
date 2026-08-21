import test from 'node:test';
import assert from 'node:assert/strict';
import { BrowserForegroundLocationBridge } from '../client/performance-web-location.mjs';

const SHIFT_ID = '11111111-1111-4111-8111-111111111111';
const EMPLOYEE_ID = '22222222-2222-4222-8222-222222222222';
const DEVICE_ID = '33333333-3333-4333-8333-333333333333';
const POINT_ID = '44444444-4444-4444-8444-444444444444';

function navigatorWithPosition({ deny = false } = {}) {
  let currentCalls = 0;
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
  return { navigatorRef, calls: () => currentCalls };
}

test('web interim captures one foreground sample on explicit Start My Day and never needs watchPosition', async () => {
  const writes = [];
  const fake = navigatorWithPosition();
  const bridge = new BrowserForegroundLocationBridge({
    navigatorRef: fake.navigatorRef,
    uuid: () => POINT_ID,
    onQueuedLocation: async write => writes.push(write),
  });

  const state = await bridge.startShift({
    shiftId: SHIFT_ID,
    employeeId: EMPLOYEE_ID,
    deviceId: DEVICE_ID,
    initiatedByUser: true,
  });

  assert.equal(state.state, 'WEB_FOREGROUND');
  assert.equal(state.continuousBackgroundTracking, false);
  assert.equal(fake.calls(), 1);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].kind, 'LOCATION');
  assert.equal(writes[0].payload.source, 'web-foreground-sample');
  assert.equal(writes[0].payload.shiftId, SHIFT_ID);
});

test('reattaching an active web shift does not silently request a location sample', async () => {
  const writes = [];
  const fake = navigatorWithPosition();
  const bridge = new BrowserForegroundLocationBridge({
    navigatorRef: fake.navigatorRef,
    uuid: () => POINT_ID,
    onQueuedLocation: async write => writes.push(write),
  });

  const state = await bridge.attachToAlreadyActiveShift({ shiftId: SHIFT_ID, employeeId: EMPLOYEE_ID, deviceId: DEVICE_ID });
  assert.equal(state.state, 'WEB_FOREGROUND');
  assert.equal(fake.calls(), 0);
  assert.equal(writes.length, 0);
});

test('denied browser location remains visible without preventing the authoritative shift flow', async () => {
  const fake = navigatorWithPosition({ deny: true });
  const bridge = new BrowserForegroundLocationBridge({
    navigatorRef: fake.navigatorRef,
    uuid: () => POINT_ID,
    onQueuedLocation: async () => undefined,
  });

  const state = await bridge.startShift({ shiftId: SHIFT_ID, employeeId: EMPLOYEE_ID, deviceId: DEVICE_ID, initiatedByUser: true });
  assert.equal(state.state, 'PERMISSION_REQUIRED');
  assert.equal(state.continuousBackgroundTracking, false);
  assert.equal(fake.calls(), 1);
});

test('web location cannot start without an explicit user-initiated action', async () => {
  const fake = navigatorWithPosition();
  const bridge = new BrowserForegroundLocationBridge({
    navigatorRef: fake.navigatorRef,
    uuid: () => POINT_ID,
    onQueuedLocation: async () => undefined,
  });

  await assert.rejects(
    bridge.startShift({ shiftId: SHIFT_ID, employeeId: EMPLOYEE_ID, deviceId: DEVICE_ID, initiatedByUser: false }),
    /visible Start My Day/,
  );
  assert.equal(fake.calls(), 0);
});