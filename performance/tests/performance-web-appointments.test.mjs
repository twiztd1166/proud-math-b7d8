import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WEB_APPOINTMENT_PIN_MAX_ACCURACY_METERS,
  appointmentHasPin,
  buildAppointmentSetPayload,
  localAppointmentIso,
  mergeAppointments,
  normalizeAppointmentDraft,
  renderPinnedRouteTrace,
} from '../client/performance-web-appointments.mjs';

const employeeId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
const shiftId = '11111111-1111-4111-8111-111111111111';
const deviceId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1';
const setId = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1';

function draft(overrides = {}) {
  return {
    customerName: 'Test Customer',
    customerPhone: '555-0100',
    confirmedCustomerAddress: '100 Test Ave',
    product: 'Windows',
    appointmentDate: '2026-08-22',
    appointmentTime: '14:30',
    ...overrides,
  };
}

function routePoint(id, capturedAt, latitude, longitude, accuracyMeters = 8) {
  return { clientPointId: id, capturedAt, latitude, longitude, accuracyMeters, precise: true, mocked: false, source: 'web-foreground-watch' };
}

test('appointment date/time is interpreted in browser-local civil time', () => {
  const iso = localAppointmentIso('2026-08-22', '14:30');
  const d = new Date(iso);
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getMonth(), 7);
  assert.equal(d.getDate(), 22);
  assert.equal(d.getHours(), 14);
  assert.equal(d.getMinutes(), 30);
});

test('appointment draft requires customer name, date, and time', () => {
  assert.throws(() => normalizeAppointmentDraft(draft({ customerName: '  ' })), /Customer name/);
  assert.throws(() => normalizeAppointmentDraft(draft({ appointmentDate: '' })), /date/);
  assert.throws(() => normalizeAppointmentDraft(draft({ appointmentTime: '' })), /time/);
});

test('SET payload keeps customer address separate from capture GPS evidence', () => {
  const payload = buildAppointmentSetPayload({
    draft: draft(),
    employeeId,
    shiftId,
    deviceId,
    capturedAt: '2026-08-21T18:00:00.000Z',
    location: { latitude: 26.35, longitude: -80.09, accuracyMeters: 9 },
  });
  assert.equal(payload.confirmedCustomerAddress, '100 Test Ave');
  assert.equal(payload.latitude, 26.35);
  assert.equal(payload.longitude, -80.09);
  assert.equal(payload.accuracyMeters, 9);
  assert.equal(payload.originShiftId, shiftId);
  assert.equal(payload.createdDeviceId, deviceId);
  assert.equal(payload.quickSet, false);
  assert.equal(payload.status, 'open');
});

test('valid appointment can be saved without GPS when browser location is unavailable', () => {
  const payload = buildAppointmentSetPayload({
    draft: draft(), employeeId, shiftId, deviceId,
    capturedAt: '2026-08-21T18:00:00.000Z', location: null,
  });
  assert.equal(payload.latitude, null);
  assert.equal(payload.longitude, null);
  assert.equal(payload.accuracyMeters, null);
});

test('appointment pin requires captured location at or better than the controlled ceiling', () => {
  assert.equal(WEB_APPOINTMENT_PIN_MAX_ACCURACY_METERS, 100);
  assert.equal(appointmentHasPin({ latitude: 26.35, longitude: -80.09, accuracyMeters: 12 }), true);
  assert.equal(appointmentHasPin({ latitude: 26.35, longitude: -80.09, accuracyMeters: 150 }), false);
  assert.equal(appointmentHasPin({ latitude: null, longitude: null, accuracyMeters: null }), false);
});

test('server appointment wins over same-id pending replay and pending-only set remains visible', () => {
  const server = [{
    client_set_id: setId,
    origin_shift_id: shiftId,
    customer_name: 'Server Customer',
    appointment_at: '2026-08-22T18:30:00.000Z',
    set_captured_at: '2026-08-21T18:00:00.000Z',
    set_latitude: 26.35,
    set_longitude: -80.09,
    set_accuracy_meters: 8,
    status: 'open',
  }];
  const pending = [{
    id: setId,
    kind: 'SET',
    state: 'PENDING',
    capturedAt: '2026-08-21T18:00:00.000Z',
    payload: { originShiftId: shiftId, customerName: 'Pending Duplicate', appointmentAt: '2026-08-22T18:30:00.000Z' },
  }, {
    id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
    kind: 'SET',
    state: 'PENDING',
    capturedAt: '2026-08-21T18:01:00.000Z',
    payload: { originShiftId: shiftId, customerName: 'Offline Customer', appointmentAt: '2026-08-22T19:30:00.000Z' },
  }];
  const merged = mergeAppointments(server, pending);
  assert.equal(merged.length, 2);
  assert.equal(merged[0].customerName, 'Server Customer');
  assert.equal(merged[1].customerName, 'Offline Customer');
  assert.equal(merged[1].syncState, 'PENDING');
});

test('pinned route map includes numbered appointment pin without phone or external map source', () => {
  const route = [
    routePoint('p1', '2026-08-21T18:00:00.000Z', 26.3500, -80.0900),
    routePoint('p2', '2026-08-21T18:00:10.000Z', 26.3502, -80.0901),
  ];
  const appointments = [{
    clientSetId: setId,
    customerName: 'Map Customer',
    customerPhone: 'SECRET-PHONE',
    product: 'Roof',
    appointmentAt: '2026-08-22T18:30:00.000Z',
    latitude: 26.3501,
    longitude: -80.09005,
    accuracyMeters: 10,
  }];
  const html = renderPinnedRouteTrace(route, appointments);
  assert.match(html, /data-performance-appointment-pin/);
  assert.match(html, />1<\/text>/);
  assert.match(html, /Map Customer/);
  assert.doesNotMatch(html, /SECRET-PHONE/);
  assert.doesNotMatch(html, /https?:\/\/|iframe|script/i);
});

test('coarse appointment remains in records but is not rendered as a precise map pin', () => {
  const html = renderPinnedRouteTrace([
    routePoint('p1', '2026-08-21T18:00:00.000Z', 26.35, -80.09),
  ], [{
    clientSetId: setId,
    customerName: 'Coarse Customer',
    appointmentAt: '2026-08-22T18:30:00.000Z',
    latitude: 26.36,
    longitude: -80.08,
    accuracyMeters: 500,
  }]);
  assert.doesNotMatch(html, /data-performance-appointment-pin/);
});
