export const PERFORMANCE_LOCATION_BRIDGE_VERSION = '2026.08.18-location-bridge-v1';

export const LOCATION_TRACKING_STATES = Object.freeze([
  'STOPPED',
  'STARTING',
  'ACTIVE',
  'LIMITED',
  'RECONNECTING',
  'STOPPING',
  'ERROR'
]);

function finite(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function normalizeLocationSample(sample = {}) {
  const latitude = finite(sample.latitude);
  const longitude = finite(sample.longitude);
  const accuracyMeters = finite(sample.accuracyMeters);
  const altitudeMeters = sample.altitudeMeters == null ? null : finite(sample.altitudeMeters);
  const speedMetersPerSecond = sample.speedMetersPerSecond == null ? null : finite(sample.speedMetersPerSecond);
  const headingDegrees = sample.headingDegrees == null ? null : finite(sample.headingDegrees);
  const captured = new Date(sample.capturedAt);

  if (latitude === null || latitude < -90 || latitude > 90) throw new Error('Invalid latitude');
  if (longitude === null || longitude < -180 || longitude > 180) throw new Error('Invalid longitude');
  if (accuracyMeters === null || accuracyMeters < 0) throw new Error('Invalid accuracyMeters');
  if (!sample.capturedAt || Number.isNaN(captured.valueOf())) throw new Error('Invalid capturedAt');
  if (!['ios', 'android', 'web-test'].includes(sample.platform)) throw new Error('Unsupported platform');

  return Object.freeze({
    bridgeVersion: PERFORMANCE_LOCATION_BRIDGE_VERSION,
    latitude,
    longitude,
    accuracyMeters,
    altitudeMeters,
    speedMetersPerSecond,
    headingDegrees,
    capturedAt: captured.toISOString(),
    platform: sample.platform,
    precise: sample.precise !== false,
    source: sample.source || 'native',
    mocked: sample.mocked === true
  });
}

export function accuracyFeet(accuracyMeters) {
  const meters = finite(accuracyMeters);
  return meters === null || meters < 0 ? null : meters * 3.280839895;
}

export function locationFreshness(capturedAt, now = new Date()) {
  const captured = new Date(capturedAt);
  const current = new Date(now);
  if (Number.isNaN(captured.valueOf()) || Number.isNaN(current.valueOf())) return { status: 'UNKNOWN', ageSeconds: null };
  const ageSeconds = Math.max(0, Math.floor((current.valueOf() - captured.valueOf()) / 1000));
  if (ageSeconds <= 90) return { status: 'LIVE', ageSeconds };
  if (ageSeconds <= 300) return { status: 'RECENT', ageSeconds };
  return { status: 'STALE', ageSeconds };
}

export const PerformanceLocationBridgeContract = Object.freeze({
  version: PERFORMANCE_LOCATION_BRIDGE_VERSION,
  requiredMethods: Object.freeze([
    'getPermissionState',
    'requestShiftLocationPermission',
    'startShiftTracking',
    'stopShiftTracking',
    'getTrackingStatus',
    'getCurrentLocation',
    'addLocationListener',
    'removeLocationListener'
  ]),
  invariants: Object.freeze([
    'startShiftTracking is initiated from the visible Start My Day flow',
    'tracking is bound to one active shift identity',
    'Finish Day stops background/live tracking',
    'app launch with no active shift does not start tracking',
    'raw capturedAt is retained independently from server receivedAt',
    'accuracy is retained and displayed as estimate',
    'GPS never authorizes or overrides field Lookup',
    'route gaps are not rendered as confirmed travel',
    'off-shift Performance location is not collected'
  ])
});
