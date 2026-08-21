import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WEB_ROUTE_MAX_ACCURACY_METERS,
  formatShiftDuration,
  qualifiedRoutePoints,
  renderWebRouteTrace,
  summarizeWebRoute,
} from '../client/performance-web-summary.mjs';

function point({ id, capturedAt, latitude, longitude, accuracyMeters = 5 }) {
  return { clientPointId: id, capturedAt, latitude, longitude, accuracyMeters, precise: accuracyMeters <= 100, source: 'web-foreground-watch' };
}

test('duration renders exact HH:MM:SS', () => {
  assert.equal(formatShiftDuration('2026-08-21T16:57:35.000Z', '2026-08-21T17:22:54.000Z'), '00:25:19');
  assert.equal(formatShiftDuration('2026-08-21T00:00:00.000Z', '2026-08-22T01:02:03.000Z'), '25:02:03');
});

test('coarse fixes are excluded from route distance and step estimate', () => {
  const points = [
    point({ id: 'coarse', capturedAt: '2026-08-21T17:00:00.000Z', latitude: 26.0, longitude: -80.0, accuracyMeters: 1414 }),
    point({ id: 'a', capturedAt: '2026-08-21T17:01:00.000Z', latitude: 26.1000, longitude: -80.1000, accuracyMeters: 8 }),
    point({ id: 'b', capturedAt: '2026-08-21T17:01:10.000Z', latitude: 26.1005, longitude: -80.1000, accuracyMeters: 6 }),
  ];
  const summary = summarizeWebRoute(points);
  assert.equal(summary.qualifiedPointCount, 2);
  assert.equal(summary.maxAccuracyMeters, WEB_ROUTE_MAX_ACCURACY_METERS);
  assert.ok(summary.distanceMeters > 50 && summary.distanceMeters < 60);
  assert.ok(summary.miles > 0.03 && summary.miles < 0.04);
  assert.ok(summary.estimatedSteps > 60 && summary.estimatedSteps < 90);
});

test('duplicate client points are counted once', () => {
  const first = point({ id: 'same', capturedAt: '2026-08-21T17:01:00.000Z', latitude: 26.1, longitude: -80.1 });
  const duplicate = { ...first };
  assert.equal(qualifiedRoutePoints([first, duplicate]).length, 1);
});

test('route trace is self-contained and contains no external map source', () => {
  const html = renderWebRouteTrace([
    point({ id: 'a', capturedAt: '2026-08-21T17:01:00.000Z', latitude: 26.1, longitude: -80.1 }),
    point({ id: 'b', capturedAt: '2026-08-21T17:01:10.000Z', latitude: 26.1003, longitude: -80.1002 }),
  ]);
  assert.match(html, /<svg/);
  assert.match(html, /polyline/);
  assert.doesNotMatch(html, /https?:\/\//);
  assert.doesNotMatch(html, /iframe|script/i);
});
