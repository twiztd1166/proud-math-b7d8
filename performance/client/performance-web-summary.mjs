export const PERFORMANCE_WEB_SUMMARY_VERSION = '2026.08.22-web-day-summary-v5';
export const WEB_ROUTE_MAX_ACCURACY_METERS = 50;
export const WEB_ROUTE_STATIONARY_DEADBAND_METERS = 6;
export const WEB_ROUTE_MAX_UNCERTAINTY_DEADBAND_METERS = 12;
export const WEB_ROUTE_MIN_VIEWPORT_METERS = 100;
export const WEB_ESTIMATED_STRIDE_METERS = 0.762;
export const WEB_MAX_PEDESTRIAN_SPEED_MPS = 3.5;
export const WEB_MAX_TRACKED_GAP_SECONDS = 30;
const METERS_PER_MILE = 1609.344;
const METERS_PER_LATITUDE_DEGREE = 111320;
const EARTH_RADIUS_METERS = 6371000;

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function radians(value) {
  return Number(value) * Math.PI / 180;
}

export function distanceMeters(a, b) {
  if (!a || !b) return 0;
  const lat1 = finite(a.latitude);
  const lon1 = finite(a.longitude);
  const lat2 = finite(b.latitude);
  const lon2 = finite(b.longitude);
  if ([lat1, lon1, lat2, lon2].some(value => value === null)) return 0;
  const dLat = radians(lat2 - lat1);
  const dLon = radians(lon2 - lon1);
  const p1 = radians(lat1);
  const p2 = radians(lat2);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}

function pointKey(point, index) {
  return String(point?.clientPointId ?? point?.client_point_id ?? point?.id ?? `${point?.capturedAt ?? point?.captured_at ?? ''}:${index}`);
}

export function qualifiedRoutePoints(points = [], maxAccuracyMeters = WEB_ROUTE_MAX_ACCURACY_METERS) {
  const seen = new Set();
  return points
    .map((point, index) => ({
      clientPointId: pointKey(point, index),
      capturedAt: String(point?.capturedAt ?? point?.captured_at ?? ''),
      latitude: finite(point?.latitude),
      longitude: finite(point?.longitude),
      accuracyMeters: finite(point?.accuracyMeters ?? point?.accuracy_meters),
      precise: point?.precise !== false,
      mocked: point?.mocked === true,
      source: String(point?.source ?? ''),
    }))
    .filter(point => {
      if (seen.has(point.clientPointId)) return false;
      if (point.mocked) return false;
      if (point.latitude === null || point.longitude === null || point.accuracyMeters === null) return false;
      if (point.accuracyMeters > maxAccuracyMeters) return false;
      if (!Number.isFinite(Date.parse(point.capturedAt))) return false;
      seen.add(point.clientPointId);
      return true;
    })
    .sort((a, b) => Date.parse(a.capturedAt) - Date.parse(b.capturedAt));
}

function movementDeadbandMeters(a, b, {
  deadbandMeters = WEB_ROUTE_STATIONARY_DEADBAND_METERS,
  maxUncertaintyDeadbandMeters = WEB_ROUTE_MAX_UNCERTAINTY_DEADBAND_METERS,
} = {}) {
  const combinedAccuracy = Math.max(0, (Number(a?.accuracyMeters || 0) + Number(b?.accuracyMeters || 0)) / 2);
  return Math.max(deadbandMeters, Math.min(maxUncertaintyDeadbandMeters, combinedAccuracy));
}

export function stabilizeRoutePoints(points = [], {
  deadbandMeters = WEB_ROUTE_STATIONARY_DEADBAND_METERS,
  maxUncertaintyDeadbandMeters = WEB_ROUTE_MAX_UNCERTAINTY_DEADBAND_METERS,
  maxTrackedGapSeconds = WEB_MAX_TRACKED_GAP_SECONDS,
} = {}) {
  if (!points.length) return [];
  const stable = [];
  let anchor = null;
  let previousRaw = null;
  let pendingVisibilityGap = false;

  for (const current of points) {
    if (previousRaw) {
      const rawGapSeconds = (Date.parse(current.capturedAt) - Date.parse(previousRaw.capturedAt)) / 1000;
      if (rawGapSeconds > maxTrackedGapSeconds) pendingVisibilityGap = true;
    }

    if (!anchor) {
      stable.push(current);
      anchor = current;
      previousRaw = current;
      continue;
    }

    const thresholdMeters = movementDeadbandMeters(anchor, current, {
      deadbandMeters,
      maxUncertaintyDeadbandMeters,
    });
    const displacementMeters = distanceMeters(anchor, current);

    if (displacementMeters >= thresholdMeters) {
      stable.push(current);
      anchor = current;
      pendingVisibilityGap = false;
      previousRaw = current;
      continue;
    }

    // While a stationary cluster remains inside the confidence deadband, keep one
    // representative point instead of drawing every normal browser-GPS wobble.
    // Prefer a more accurate fix only when doing so cannot erase a visibility gap.
    if (!pendingVisibilityGap && Number(current.accuracyMeters) < Number(anchor.accuracyMeters)) {
      stable[stable.length - 1] = current;
      anchor = current;
    }
    previousRaw = current;
  }

  return stable;
}

export function splitTrackedSegments(points = [], maxTrackedGapSeconds = WEB_MAX_TRACKED_GAP_SECONDS) {
  if (!points.length) return [];
  const segments = [[points[0]]];
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const elapsedSeconds = (Date.parse(current.capturedAt) - Date.parse(previous.capturedAt)) / 1000;
    if (!(elapsedSeconds > 0) || elapsedSeconds > maxTrackedGapSeconds) segments.push([current]);
    else segments.at(-1).push(current);
  }
  return segments;
}

export function summarizeWebRoute(points = [], {
  maxAccuracyMeters = WEB_ROUTE_MAX_ACCURACY_METERS,
  stationaryDeadbandMeters = WEB_ROUTE_STATIONARY_DEADBAND_METERS,
  maxUncertaintyDeadbandMeters = WEB_ROUTE_MAX_UNCERTAINTY_DEADBAND_METERS,
  strideMeters = WEB_ESTIMATED_STRIDE_METERS,
  maxPedestrianSpeedMps = WEB_MAX_PEDESTRIAN_SPEED_MPS,
  maxTrackedGapSeconds = WEB_MAX_TRACKED_GAP_SECONDS,
} = {}) {
  const rawQualified = qualifiedRoutePoints(points, maxAccuracyMeters);
  const qualified = stabilizeRoutePoints(rawQualified, {
    deadbandMeters: stationaryDeadbandMeters,
    maxUncertaintyDeadbandMeters,
    maxTrackedGapSeconds,
  });
  let meters = 0;
  let pedestrianMeters = 0;
  let acceptedSegmentCount = 0;
  let skippedGapCount = 0;
  for (let index = 1; index < qualified.length; index += 1) {
    const previous = qualified[index - 1];
    const current = qualified[index];
    const elapsedSeconds = (Date.parse(current.capturedAt) - Date.parse(previous.capturedAt)) / 1000;
    if (!(elapsedSeconds > 0) || elapsedSeconds > maxTrackedGapSeconds) {
      skippedGapCount += 1;
      continue;
    }
    const segmentMeters = distanceMeters(previous, current);
    if (!Number.isFinite(segmentMeters) || segmentMeters < 0) continue;
    meters += segmentMeters;
    acceptedSegmentCount += 1;
    const inferredSpeed = segmentMeters / elapsedSeconds;
    if (inferredSpeed <= maxPedestrianSpeedMps) pedestrianMeters += segmentMeters;
  }
  const miles = meters / METERS_PER_MILE;
  const estimatedSteps = strideMeters > 0 ? Math.round(pedestrianMeters / strideMeters) : 0;
  return Object.freeze({
    qualifiedPoints: Object.freeze(qualified),
    qualifiedPointCount: qualified.length,
    rawQualifiedPointCount: rawQualified.length,
    suppressedJitterCount: Math.max(0, rawQualified.length - qualified.length),
    distanceMeters: meters,
    pedestrianDistanceMeters: pedestrianMeters,
    miles,
    estimatedSteps,
    acceptedSegmentCount,
    skippedGapCount,
    maxAccuracyMeters,
    stationaryDeadbandMeters,
    maxUncertaintyDeadbandMeters,
    strideMeters,
    maxPedestrianSpeedMps,
    maxTrackedGapSeconds,
  });
}

export function formatShiftClock(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf())) return '—';
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

export function formatShiftDuration(startedAt, endedAt = Date.now()) {
  const start = new Date(startedAt).valueOf();
  const end = endedAt instanceof Date ? endedAt.valueOf() : new Date(endedAt).valueOf();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return '00:00:00';
  const totalSeconds = Math.max(0, Math.floor((end - start) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map(value => String(value).padStart(2, '0')).join(':');
}

export function renderWebRouteTrace(points = [], {
  width = 320,
  height = 180,
  minViewportMeters = WEB_ROUTE_MIN_VIEWPORT_METERS,
} = {}) {
  const rawQualified = qualifiedRoutePoints(points);
  const qualified = stabilizeRoutePoints(rawQualified);
  if (!qualified.length) {
    return `<div class="performance-route-empty">Route appears after a qualified GPS fix.</div>`;
  }

  const pad = 18;
  const averageLatitude = qualified.reduce((sum, point) => sum + point.latitude, 0) / qualified.length;
  const cosLat = Math.max(0.2, Math.cos(radians(averageLatitude)));
  const projected = qualified.map(point => ({
    ...point,
    x: point.longitude * cosLat,
    y: point.latitude,
  }));
  const xs = projected.map(point => point.x);
  const ys = projected.map(point => point.y);
  const rawMinX = Math.min(...xs);
  const rawMaxX = Math.max(...xs);
  const rawMinY = Math.min(...ys);
  const rawMaxY = Math.max(...ys);
  const minLatitudeSpan = Math.max(1, minViewportMeters) / METERS_PER_LATITUDE_DEGREE;
  const minProjectedLongitudeSpan = minLatitudeSpan * cosLat;
  const spanX = Math.max(rawMaxX - rawMinX, minProjectedLongitudeSpan);
  const spanY = Math.max(rawMaxY - rawMinY, minLatitudeSpan);
  const centerX = (rawMinX + rawMaxX) / 2;
  const centerY = (rawMinY + rawMaxY) / 2;
  const minX = centerX - spanX / 2;
  const minY = centerY - spanY / 2;
  const plotWidth = width - pad * 2;
  const plotHeight = height - pad * 2;
  const scale = Math.min(plotWidth / spanX, plotHeight / spanY);
  const usedWidth = spanX * scale;
  const usedHeight = spanY * scale;
  const offsetX = pad + (plotWidth - usedWidth) / 2;
  const offsetY = pad + (plotHeight - usedHeight) / 2;
  const screen = projected.map(point => ({
    ...point,
    x: offsetX + (point.x - minX) * scale,
    y: height - (offsetY + (point.y - minY) * scale),
  }));
  const segments = splitTrackedSegments(screen);
  const polylines = segments
    .filter(segment => segment.length > 1)
    .map((segment, index) => `<polyline data-route-segment="${index + 1}" points="${segment.map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ')}" class="performance-route-line"></polyline>`)
    .join('');
  const first = screen[0];
  const last = screen.at(-1);
  const pixelsPerMeter = scale / METERS_PER_LATITUDE_DEGREE;
  const accuracyRadius = Math.max(10, Math.min(32, Number(last.accuracyMeters || 0) * pixelsPerMeter));
  const startMarker = screen.length > 1
    ? `<circle cx="${first.x.toFixed(1)}" cy="${first.y.toFixed(1)}" r="5" class="performance-route-start"></circle>`
    : '';
  return `<svg class="performance-route-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="GPS route trace with ${qualified.length} stable points" data-route-stable-points="${qualified.length}" data-route-raw-qualified-points="${rawQualified.length}" data-route-min-viewport-meters="${minViewportMeters}">
    <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="14" class="performance-route-bg"></rect>
    ${polylines}
    ${startMarker}
    <circle cx="${last.x.toFixed(1)}" cy="${last.y.toFixed(1)}" r="${accuracyRadius.toFixed(1)}" class="performance-route-current-halo"></circle>
    <circle cx="${last.x.toFixed(1)}" cy="${last.y.toFixed(1)}" r="6" class="performance-route-current"></circle>
  </svg>`;
}

export const PerformanceWebSummaryInvariants = Object.freeze([
  'raw browser GPS evidence remains stored unchanged while route display and derived miles/steps suppress stationary confidence-radius wobble',
  'web miles are derived only from non-mocked GPS points at or better than the controlled accuracy ceiling',
  'coarse and mocked GPS fixes are excluded from distance, estimated steps, and route trace calculations',
  'stationary GPS drift inside the controlled movement deadband does not create route distance or estimated steps',
  'tracked-distance calculations and route-line rendering never bridge visibility or lock gaps longer than the controlled maximum gap',
  'web estimated steps use only pedestrian-speed qualified GPS segments and exclude faster travel segments',
  'web estimated steps are a transparent GPS-distance estimate and are never represented as Apple Health or pedometer steps',
  'the route trace uses a minimum local viewport so sub-meter and few-meter GPS wobble is not magnified to fill the entire card',
  'the route trace remains self-contained and does not add a third-party map-tile or geocoding provider',
  'start, end, and duration are derived from the authoritative shift timestamps',
]);
