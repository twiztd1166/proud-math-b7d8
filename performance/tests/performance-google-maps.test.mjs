import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { qualifiedRoutePoints, stabilizeRoutePoints } from '../client/performance-web-summary.mjs';

const provider = await readFile(new URL('../client/performance-google-maps.mjs', import.meta.url), 'utf8');
const index = await readFile(new URL('../../index.html', import.meta.url), 'utf8');
const sw = await readFile(new URL('../../sw.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../../performance-web.css', import.meta.url), 'utf8');

test('Google Maps browser key is configuration-only and not committed', () => {
  assert.match(index, /<meta name="paradise-google-maps-api-key" content="">/);
  assert.doesNotMatch(index, /AIza[0-9A-Za-z_-]{20,}/);
  assert.doesNotMatch(provider, /AIza[0-9A-Za-z_-]{20,}/);
});

test('Google Maps integration is explicitly wired and cached', () => {
  assert.match(index, /performance\/client\/performance-google-maps\.mjs/);
  assert.match(sw, /performance\/client\/performance-google-maps\.mjs/);
  assert.match(sw, /gmaps1/);
  assert.match(css, /performance-google-map-canvas/);
});

test('provider uses Google hybrid map and Paradise RLS route reads', () => {
  assert.match(provider, /maps\.googleapis\.com/);
  assert.match(provider, /MapTypeId\.HYBRID/);
  assert.match(provider, /performance_current_employee_id/);
  assert.match(provider, /performance_location_points/);
  assert.match(provider, /autoRefreshToken:\s*false/);
  assert.match(provider, /stabilizedProviderPoints/);
  assert.match(provider, /raw GPS remains in Paradise/);
  assert.doesNotMatch(provider, /mapbox|openstreetmap|leaflet/i);
});

test('stationary wobble is collapsed before coordinates can be sent to map provider', () => {
  const raw = qualifiedRoutePoints([
    { clientPointId: 'a', capturedAt: '2026-08-22T09:30:00.000Z', latitude: 26.3285948, longitude: -80.1209120, accuracyMeters: 3, mocked: false },
    { clientPointId: 'b', capturedAt: '2026-08-22T09:30:10.000Z', latitude: 26.3285960, longitude: -80.1209178, accuracyMeters: 3, mocked: false },
    { clientPointId: 'c', capturedAt: '2026-08-22T09:30:20.000Z', latitude: 26.3285942, longitude: -80.1209120, accuracyMeters: 2.5, mocked: false },
  ]);
  const stable = stabilizeRoutePoints(raw);
  assert.equal(stable.length, 1);
});

test('real movement remains available to Google Maps after stabilization', () => {
  const raw = qualifiedRoutePoints([
    { clientPointId: 'a', capturedAt: '2026-08-22T09:30:00.000Z', latitude: 26.3285948, longitude: -80.1209120, accuracyMeters: 3, mocked: false },
    { clientPointId: 'b', capturedAt: '2026-08-22T09:30:10.000Z', latitude: 26.3290948, longitude: -80.1209120, accuracyMeters: 3, mocked: false },
  ]);
  const stable = stabilizeRoutePoints(raw);
  assert.equal(stable.length, 2);
});
