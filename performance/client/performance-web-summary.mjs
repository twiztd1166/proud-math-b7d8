export const PERFORMANCE_WEB_SUMMARY_VERSION = '2026.08.21-web-day-summary-v2';
export const WEB_ROUTE_MAX_ACCURACY_METERS = 50;
export const WEB_ESTIMATED_STRIDE_METERS = 0.762;
export const WEB_MAX_PEDESTRIAN_SPEED_MPS = 3.5;
const METERS_PER_MILE = 1609.344;
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
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
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
      source: String(point?.source ?? ''),
    }))
    .filter(point => {
      if (seen.has(point.clientPointId)) return false;
      if (point.latitude === null || point.longitude === null || point.accuracyMeters === null) return false;
      if (point.accuracyMeters > maxAccuracyMeters) return false;
      if (!Number.isFinite(Date.parse(point.capturedAt))) return false;
      seen.add(point.clientPointId);
      return true;
    })
    .sort((a, b) => Date.parse(a.capturedAt) - Date.parse(b.capturedAt));
}

export function summarizeWebRoute(points = [], {
  maxAccuracyMeters = WEB_ROUTE_MAX_ACCURACY_METERS,
  strideMeters = WEB_ESTIMATED_STRIDE_METERS,
  maxPedestrianSpeedMps = WEB_MAX_PEDESTRIAN_SPEED_MPS,
} = {}) {
  const qualified = qualifiedRoutePoints(points, maxAccuracyMeters);
  let meters = 0;
  let pedestrianMeters = 0;
  for (let index = 1; index < qualified.length; index += 1) {
    const previous = qualified[index - 1];
    const current = qualified[index];
    const segmentMeters = distanceMeters(previous, current);
    meters += segmentMeters;
    const elapsedSeconds = (Date.parse(current.capturedAt) - Date.parse(previous.capturedAt)) / 1000;
    const inferredSpeed = elapsedSeconds > 0 ? segmentMeters / elapsedSeconds : Number.POSITIVE_INFINITY;
    if (inferredSpeed <= maxPedestrianSpeedMps) pedestrianMeters += segmentMeters;
  }
  const miles = meters / METERS_PER_MILE;
  const estimatedSteps = strideMeters > 0 ? Math.round(pedestrianMeters / strideMeters) : 0;
  return Object.freeze({
    qualifiedPoints: Object.freeze(qualified),
    qualifiedPointCount: qualified.length,
    distanceMeters: meters,
    pedestrianDistanceMeters: pedestrianMeters,
    miles,
    estimatedSteps,
    maxAccuracyMeters,
    strideMeters,
    maxPedestrianSpeedMps,
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

export function renderWebRouteTrace(points = [], { width = 320, height = 180 } = {}) {
  const qualified = qualifiedRoutePoints(points);
  if (!qualified.length) {
    return `<div class="performance-route-empty">Route appears after a qualified GPS fix.</div>`;
  }

  const pad = 18;
  const averageLatitude = qualified.reduce((sum, point) => sum + point.latitude, 0) / qualified.length;
  const cosLat = Math.max(0.2, Math.cos(radians(averageLatitude)));
  const projected = qualified.map(point => ({
    x: point.longitude * cosLat,
    y: point.latitude,
  }));
  const xs = projected.map(point => point.x);
  const ys = projected.map(point => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = Math.max(maxX - minX, 0.000001);
  const spanY = Math.max(maxY - minY, 0.000001);
  const plotWidth = width - pad * 2;
  const plotHeight = height - pad * 2;
  const scale = Math.min(plotWidth / spanX, plotHeight / spanY);
  const usedWidth = spanX * scale;
  const usedHeight = spanY * scale;
  const offsetX = pad + (plotWidth - usedWidth) / 2;
  const offsetY = pad + (plotHeight - usedHeight) / 2;
  const screen = projected.map(point => ({
    x: offsetX + (point.x - minX) * scale,
    y: height - (offsetY + (point.y - minY) * scale),
  }));
  const polyline = screen.map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
  const first = screen[0];
  const last = screen.at(-1);
  return `<svg class="performance-route-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="GPS route trace with ${qualified.length} qualified points">
    <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="14" class="performance-route-bg"></rect>
    ${qualified.length > 1 ? `<polyline points="${polyline}" class="performance-route-line"></polyline>` : ''}
    <circle cx="${first.x.toFixed(1)}" cy="${first.y.toFixed(1)}" r="5" class="performance-route-start"></circle>
    <circle cx="${last.x.toFixed(1)}" cy="${last.y.toFixed(1)}" r="6" class="performance-route-current"></circle>
  </svg>`;
}

export const PerformanceWebSummaryInvariants = Object.freeze([
  'web miles are derived only from GPS points at or better than the controlled accuracy ceiling',
  'coarse GPS fixes are excluded from distance, estimated steps, and route trace calculations',
  'web estimated steps use only pedestrian-speed qualified GPS segments and exclude faster travel segments',
  'web estimated steps are a transparent GPS-distance estimate and are never represented as Apple Health or pedometer steps',
  'the route trace is self-contained and does not add a third-party map-tile or geocoding provider',
  'start, end, and duration are derived from the authoritative shift timestamps',
]);
