import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEventEnvelope, retryEnvelope } from '../shared/performance-events.mjs';
import {
  accuracyFeet,
  locationFreshness,
  normalizeLocationSample,
  PerformanceLocationBridgeContract
} from '../native/performance-location-contract.mjs';

const EMPLOYEE = '11111111-1111-4111-8111-111111111111';
const DEVICE = '22222222-2222-4222-8222-222222222222';
const SHIFT = '33333333-3333-4333-8333-333333333333';
const EVENT = '44444444-4444-4444-8444-444444444444';

test('offline retries preserve the original idempotency identity', () => {
  const envelope = buildEventEnvelope({
    clientEventId: EVENT,
    employeeId: EMPLOYEE,
    deviceId: DEVICE,
    shiftId: SHIFT,
    type: 'SET_CREATED',
    capturedAt: '2026-08-18T14:43:00-04:00',
    payload: { quickSet: true }
  });
  assert.equal(retryEnvelope(envelope), envelope);
  assert.equal(envelope.clientEventId, EVENT);
});

test('invalid event types and unstable identities are rejected', () => {
  assert.throws(() => buildEventEnvelope({
    clientEventId: 'not-a-uuid', employeeId: EMPLOYEE, deviceId: DEVICE,
    type: 'SET_CREATED', capturedAt: '2026-08-18T14:43:00-04:00'
  }));
  assert.throws(() => buildEventEnvelope({
    clientEventId: EVENT, employeeId: EMPLOYEE, deviceId: DEVICE,
    type: 'GPS_PROVES_KNOCK', capturedAt: '2026-08-18T14:43:00-04:00'
  }));
});

test('location sample preserves accuracy and captured time independent of receipt time', () => {
  const sample = normalizeLocationSample({
    latitude: 26.3683,
    longitude: -80.1289,
    accuracyMeters: 18,
    capturedAt: '2026-08-18T14:43:00-04:00',
    platform: 'ios',
    precise: true
  });
  assert.equal(sample.latitude, 26.3683);
  assert.equal(sample.accuracyMeters, 18);
  assert.equal(sample.capturedAt, '2026-08-18T18:43:00.000Z');
  assert.ok(Math.abs(accuracyFeet(sample.accuracyMeters) - 59.0551) < 0.001);
});

test('location freshness never makes stale points look live', () => {
  assert.deepEqual(locationFreshness('2026-08-18T12:00:00Z', '2026-08-18T12:01:00Z'), { status: 'LIVE', ageSeconds: 60 });
  assert.deepEqual(locationFreshness('2026-08-18T12:00:00Z', '2026-08-18T12:03:00Z'), { status: 'RECENT', ageSeconds: 180 });
  assert.deepEqual(locationFreshness('2026-08-18T12:00:00Z', '2026-08-18T12:10:00Z'), { status: 'STALE', ageSeconds: 600 });
});

test('native bridge contract explicitly requires tracking stop and Lookup isolation', () => {
  assert.ok(PerformanceLocationBridgeContract.requiredMethods.includes('startShiftTracking'));
  assert.ok(PerformanceLocationBridgeContract.requiredMethods.includes('stopShiftTracking'));
  assert.ok(PerformanceLocationBridgeContract.invariants.some(x => /Finish Day stops/i.test(x)));
  assert.ok(PerformanceLocationBridgeContract.invariants.some(x => /GPS never authorizes/i.test(x)));
  assert.ok(PerformanceLocationBridgeContract.invariants.some(x => /off-shift/i.test(x)));
});
