import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WEB_MAX_TRACKED_GAP_SECONDS,
  WEB_ROUTE_MAX_ACCURACY_METERS,
  WEB_ROUTE_MIN_VIEWPORT_METERS,
  WEB_ROUTE_STATIONARY_DEADBAND_METERS,
  formatShiftDuration,
  qualifiedRoutePoints,
  renderWebRouteTrace,
  splitTrackedSegments,
  stabilizeRoutePoints,
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

test('stationary field fixes collapse to one stable point instead of inventing travel', () => {
  const points = [
    point({ id: 'a', capturedAt: '2026-08-22T09:27:15.373Z', latitude: 26.3286202576866, longitude: -80.1209162825913, accuracyMeters: 11.4903844254136 }),
    point({ id: 'b', capturedAt: '2026-08-22T09:27:25.655Z', latitude: 26.3285842490871, longitude: -80.1208985996189, accuracyMeters: 14 }),
    point({ id: 'c', capturedAt: '2026-08-22T09:27:47.998Z', latitude: 26.3285909539886, longitude: -80.1209105085378, accuracyMeters: 3.08543316058922 }),
    point({ id: 'd', capturedAt: '2026-08-22T09:29:16.999Z', latitude: 26.3286074974493, longitude: -80.1209214100217, accuracyMeters: 2 }),
    point({ id: 'e', capturedAt: '2026-08-22T09:33:11.438Z', latitude: 26.3285960108243, longitude: -80.1209274666874, accuracyMeters: 3.795014 }),
    point({ id: 'f', capturedAt: '2026-08-22T09:33:25.046Z', latitude: 26.3285239929588, longitude: -80.1209288183019, accuracyMeters: 26.895014 }),
    point({ id: 'g', capturedAt: '2026-08-22T09:33:30.334Z', latitude: 26.3286054084202, longitude: -80.1209434311585, accuracyMeters: 8.71387310937021 }),
  ];
  const rawQualified = qualifiedRoutePoints(points);
  const stable = stabilizeRoutePoints(rawQualified);
  const summary = summarizeWebRoute(points);
  assert.equal(rawQualified.length, 7);
  assert.equal(stable.length, 1);
  assert.equal(summary.rawQualifiedPointCount, 7);
  assert.equal(summary.qualifiedPointCount, 1);
  assert.equal(summary.suppressedJitterCount, 6);
  assert.equal(summary.stationaryDeadbandMeters, WEB_ROUTE_STATIONARY_DEADBAND_METERS);
  assert.equal(summary.distanceMeters, 0);
  assert.equal(summary.pedestrianDistanceMeters, 0);
  assert.equal(summary.miles, 0);
  assert.equal(summary.estimatedSteps, 0);
  const html = renderWebRouteTrace(points);
  assert.match(html, /data-route-stable-points="1"/);
  assert.match(html, new RegExp(`data-route-min-viewport-meters="${WEB_ROUTE_MIN_VIEWPORT_METERS}"`));
  assert.doesNotMatch(html, /polyline/);
  assert.match(html, /performance-route-current-halo/);
});

test('real walking displacement beyond the stationary deadband remains tracked', () => {
  const points = [
    point({ id: 'a', capturedAt: '2026-08-22T10:00:00.000Z', latitude: 26.328600, longitude: -80.120900, accuracyMeters: 3 }),
    point({ id: 'b', capturedAt: '2026-08-22T10:00:10.000Z', latitude: 26.328675, longitude: -80.120900, accuracyMeters: 3 }),
    point({ id: 'c', capturedAt: '2026-08-22T10:00:20.000Z', latitude: 26.328750, longitude: -80.120900, accuracyMeters: 3 }),
  ];
  const summary = summarizeWebRoute(points);
  assert.equal(summary.qualifiedPointCount, 3);
  assert.equal(summary.suppressedJitterCount, 0);
  assert.ok(summary.distanceMeters > 15 && summary.distanceMeters < 18);
  assert.ok(summary.estimatedSteps > 15);
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
