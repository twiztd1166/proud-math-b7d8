import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRouteMetrics,
  durationSeconds,
  formatDurationHms,
  mergeRoutePoints,
  normalizeRouteForSvg,
} from '../client/performance-web-field-metrics.mjs';

test('formats authoritative shift duration to the second', () => {
  const start = '2026-08-21T16:57:35.029Z';
  const end = '2026-08-21T17:22:54.401Z';
  assert.equal(durationSeconds(start, end), 1519);
  assert.equal(formatDurationHms(1519), '00:25:19');
});

test('merges server and pending location points without duplicate client IDs', () => {
  const server = [{
    client_point_id: '11111111-1111-4111-8111-111111111111',
    captured_at: '2026-08-21T17:00:00Z',
    latitude: 26.35,
    longitude: -80.09,
    accuracy_meters: 5,
    precise: true,
    mocked: false,
  }];
  const pending = [{
    id: '11111111-1111-4111-8111-111111111111',
    kind: 'LOCATION',
    capturedAt: '2026-08-21T17:00:00Z',
    payload: { latitude: 26.35, longitude: -80.09, accuracyMeters: 5, precise: true, mocked: false },
  }, {
    id: '22222222-2222-4222-8222-222222222222',
    kind: 'LOCATION',
    capturedAt: '2026-08-21T17:00:10Z',
    payload: { latitude: 26.3505, longitude: -80.09, accuracyMeters: 7, precise: true, mocked: false },
  }];
  const merged = mergeRoutePoints(server, pending);
  assert.equal(merged.length, 2);
  assert.equal(merged[1].id, '22222222-2222-4222-8222-222222222222');
});

test('tracked miles exclude coarse and mocked points and expose estimated steps', () => {
  const points = [
    { id: 'a', capturedAt: '2026-08-21T17:00:00Z', latitude: 26.35, longitude: -80.09, accuracyMeters: 5, mocked: false },
    { id: 'b', capturedAt: '2026-08-21T17:00:10Z', latitude: 26.3505, longitude: -80.09, accuracyMeters: 5, mocked: false },
    { id: 'c', capturedAt: '2026-08-21T17:00:20Z', latitude: 26.351, longitude: -80.09, accuracyMeters: 5, mocked: false },
    { id: 'coarse', capturedAt: '2026-08-21T17:00:30Z', latitude: 26.40, longitude: -80.09, accuracyMeters: 1400, mocked: false },
    { id: 'mocked', capturedAt: '2026-08-21T17:00:40Z', latitude: 26.50, longitude: -80.09, accuracyMeters: 4, mocked: true },
  ];
  const metrics = calculateRouteMetrics(points);
  assert.equal(metrics.precisePointCount, 3);
  assert.ok(metrics.meters > 100 && metrics.meters < 120);
  assert.ok(metrics.miles > 0.06 && metrics.miles < 0.08);
  assert.ok(metrics.estimatedSteps > 120 && metrics.estimatedSteps < 160);
});

test('route SVG normalization stays inside the requested viewport', () => {
  const route = normalizeRouteForSvg([
    { capturedAt: '2026-08-21T17:00:00Z', latitude: 26.35, longitude: -80.09, accuracyMeters: 5 },
    { capturedAt: '2026-08-21T17:00:10Z', latitude: 26.351, longitude: -80.089, accuracyMeters: 5 },
  ], 320, 180, 18);
  assert.equal(route.length, 2);
  for (const point of route) {
    assert.ok(point.svgX >= 18 && point.svgX <= 302);
    assert.ok(point.svgY >= 18 && point.svgY <= 162);
  }
});
