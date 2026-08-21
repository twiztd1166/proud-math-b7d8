import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WEB_MAX_TRACKED_GAP_SECONDS,
  WEB_ROUTE_MAX_ACCURACY_METERS,
  formatShiftDuration,
  qualifiedRoutePoints,
  renderWebRouteTrace,
  splitTrackedSegments,
  summarizeWebRoute,
} from '../client/performance-web-summary.mjs';

function point({ id, capturedAt, latitude, longitude, accuracyMeters = 5, mocked = false }) {
  return { clientPointId: id, capturedAt, latitude, longitude, accuracyMeters, precise: accuracyMeters <= 100, mocked, source: 'web-foreground-watch' };
}

test('duration renders exact HH:MM:SS', () => {
  assert.equal(formatShiftDuration('2026-08-21T16:57:35.000Z', '2026-08-21T17:22:54.000Z'), '00:25:19');
  assert.equal(formatShiftDuration('2026-08-21T00:00:00.000Z', '2026-08-22T01:02:03.000Z'), '25:02:03');
});

test('coarse and mocked fixes are excluded from route distance and step estimate', () => {
  const points = [
    point({ id: 'coarse', capturedAt: '2026-08-21T17:00:00.000Z', latitude: 26.0, longitude: -80.0, accuracyMeters: 1414 }),
    point({ id: 'mocked', capturedAt: '2026-08-21T17:00:30.000Z', latitude: 26.05, longitude: -80.05, mocked: true }),
    point({ id: 'a', capturedAt: '2026-08-21T17:01:00.000Z', latitude: 26.1000, longitude: -80.1000, accuracyMeters: 8 }),
    point({ id: 'b', capturedAt: '2026-08-21T17:01:20.000Z', latitude: 26.1005, longitude: -80.1000, accuracyMeters: 6 }),
  ];
  const summary = summarizeWebRoute(points);
  assert.equal(summary.qualifiedPointCount, 2);
  assert.equal(summary.maxAccuracyMeters, WEB_ROUTE_MAX_ACCURACY_METERS);
  assert.ok(summary.distanceMeters > 50 && summary.distanceMeters < 60);
  assert.ok(summary.pedestrianDistanceMeters > 50 && summary.pedestrianDistanceMeters < 60);
  assert.ok(summary.miles > 0.03 && summary.miles < 0.04);
  assert.ok(summary.estimatedSteps > 60 && summary.estimatedSteps < 90);
});

test('vehicle-speed travel contributes to GPS miles but not estimated steps', () => {
  const points = [
    point({ id: 'a', capturedAt: '2026-08-21T17:01:00.000Z', latitude: 26.1000, longitude: -80.1000 }),
    point({ id: 'b', capturedAt: '2026-08-21T17:01:10.000Z', latitude: 26.1010, longitude: -80.1000 }),
  ];
  const summary = summarizeWebRoute(points);
  assert.ok(summary.distanceMeters > 100);
  assert.equal(summary.pedestrianDistanceMeters, 0);
  assert.equal(summary.estimatedSteps, 0);
  assert.ok(summary.miles > 0);
});

test('long hidden or locked interval is not bridged into tracked miles or steps', () => {
  const points = [
    point({ id: 'a', capturedAt: '2026-08-21T17:01:00.000Z', latitude: 26.1000, longitude: -80.1000 }),
    point({ id: 'b', capturedAt: '2026-08-21T17:01:10.000Z', latitude: 26.1002, longitude: -80.1000 }),
    point({ id: 'after-lock', capturedAt: '2026-08-21T17:02:20.000Z', latitude: 26.1012, longitude: -80.1000 }),
  ];
  const summary = summarizeWebRoute(points);
  assert.equal(summary.maxTrackedGapSeconds, WEB_MAX_TRACKED_GAP_SECONDS);
  assert.equal(summary.acceptedSegmentCount, 1);
  assert.equal(summary.skippedGapCount, 1);
  assert.ok(summary.distanceMeters > 20 && summary.distanceMeters < 25);
});

test('route segments split across hidden or locked gaps', () => {
  const qualified = qualifiedRoutePoints([
    point({ id: 'a', capturedAt: '2026-08-21T17:01:00.000Z', latitude: 26.1000, longitude: -80.1000 }),
    point({ id: 'b', capturedAt: '2026-08-21T17:01:10.000Z', latitude: 26.1002, longitude: -80.1000 }),
    point({ id: 'c', capturedAt: '2026-08-21T17:02:20.000Z', latitude: 26.1012, longitude: -80.1000 }),
    point({ id: 'd', capturedAt: '2026-08-21T17:02:30.000Z', latitude: 26.1014, longitude: -80.1000 }),
  ]);
  const segments = splitTrackedSegments(qualified);
  assert.equal(segments.length, 2);
  assert.deepEqual(segments.map(segment => segment.map(item => item.clientPointId)), [['a', 'b'], ['c', 'd']]);
  const html = renderWebRouteTrace(qualified);
  assert.equal((html.match(/data-route-segment=/g) || []).length, 2);
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
