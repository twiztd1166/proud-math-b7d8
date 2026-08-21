export const PERFORMANCE_WEB_FIELD_METRICS_VERSION = '2026.08.21-web-field-metrics-v1';

const EARTH_RADIUS_METERS = 6371000;
const METERS_PER_MILE = 1609.344;
const DEFAULT_STEPS_PER_MILE = 2000;

function finite(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function timestamp(value) {
  const n = new Date(value).valueOf();
  return Number.isFinite(n) ? n : null;
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
  const rLat1 = radians(lat1);
  const rLat2 = radians(lat2);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}

export function durationSeconds(startedAt, endedAt = Date.now()) {
  const start = timestamp(startedAt);
  const end = timestamp(endedAt);
  if (start === null || end === null) return 0;
  return Math.max(0, Math.floor((end - start) / 1000));
}

export function formatDurationHms(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatLocalClock(value, locale = undefined) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return '—';
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

function normalizePoint(point) {
  const latitude = finite(point?.latitude ?? point?.payload?.latitude);
  const longitude = finite(point?.longitude ?? point?.payload?.longitude);
  const accuracyMeters = finite(point?.accuracy_meters ?? point?.accuracyMeters ?? point?.payload?.accuracyMeters);
  const capturedAt = point?.captured_at ?? point?.capturedAt;
  const capturedMs = timestamp(capturedAt);
  if (latitude === null || longitude === null || accuracyMeters === null || capturedMs === null) return null;
  return Object.freeze({
    id: String(point?.client_point_id ?? point?.id ?? ''),
    capturedAt: new Date(capturedMs).toISOString(),
    latitude,
    longitude,
    accuracyMeters,
    mocked: point?.mocked === true || point?.payload?.mocked === true,
    precise: point?.precise !== false && point?.payload?.precise !== false,
    source: String(point?.source ?? point?.payload?.source ?? ''),
  });
}

export function mergeRoutePoints(serverPoints = [], pendingWrites = []) {
  const byId = new Map();
  for (const point of serverPoints) {
    const normalized = normalizePoint(point);
    if (!normalized) continue;
    const key = normalized.id || `${normalized.capturedAt}:${normalized.latitude}:${normalized.longitude}`;
    byId.set(key, normalized);
  }
  for (const write of pendingWrites) {
    if (write?.kind !== 'LOCATION') continue;
    const normalized = normalizePoint(write);
    if (!normalized) continue;
    const key = normalized.id || `${normalized.capturedAt}:${normalized.latitude}:${normalized.longitude}`;
    if (!byId.has(key)) byId.set(key, normalized);
  }
  return Array.from(byId.values()).sort((a, b) => Date.parse(a.capturedAt) - Date.parse(b.capturedAt));
}

export function calculateRouteMetrics(points = [], {
  maxAccuracyMeters = 100,
  maxSegmentMeters = 250,
  stepsPerMile = DEFAULT_STEPS_PER_MILE,
} = {}) {
  const eligible = points
    .map(normalizePoint)
    .filter(Boolean)
    .filter(point => !point.mocked && point.accuracyMeters <= maxAccuracyMeters)
    .sort((a, b) => Date.parse(a.capturedAt) - Date.parse(b.capturedAt));

  let meters = 0;
  let acceptedSegments = 0;
  for (let i = 1; i < eligible.length; i += 1) {
    const segment = distanceMeters(eligible[i - 1], eligible[i]);
    if (Number.isFinite(segment) && segment >= 0 && segment <= maxSegmentMeters) {
      meters += segment;
      acceptedSegments += 1;
    }
  }
  const miles = meters / METERS_PER_MILE;
  const estimatedSteps = Math.max(0, Math.round(miles * Math.max(0, Number(stepsPerMile) || DEFAULT_STEPS_PER_MILE)));
  return Object.freeze({
    meters,
    miles,
    estimatedSteps,
    eligiblePoints: Object.freeze(eligible),
    precisePointCount: eligible.length,
    acceptedSegments,
    bestAccuracyMeters: eligible.length ? Math.min(...eligible.map(point => point.accuracyMeters)) : null,
  });
}

export function normalizeRouteForSvg(points = [], width = 320, height = 180, padding = 18) {
  const safeWidth = Math.max(120, Number(width) || 320);
  const safeHeight = Math.max(90, Number(height) || 180);
  const safePadding = Math.max(4, Number(padding) || 18);
  const normalized = points.map(normalizePoint).filter(Boolean);
  if (!normalized.length) return Object.freeze([]);

  const meanLat = normalized.reduce((sum, point) => sum + point.latitude, 0) / normalized.length;
  const lonScale = Math.max(0.2, Math.cos(radians(meanLat)));
  const projected = normalized.map(point => ({
    ...point,
    x: point.longitude * lonScale,
    y: point.latitude,
  }));
  const xs = projected.map(point => point.x);
  const ys = projected.map(point => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = Math.max(maxX - minX, 1e-7);
  const spanY = Math.max(maxY - minY, 1e-7);
  const innerWidth = safeWidth - safePadding * 2;
  const innerHeight = safeHeight - safePadding * 2;

  return Object.freeze(projected.map(point => Object.freeze({
    ...point,
    svgX: safePadding + ((point.x - minX) / spanX) * innerWidth,
    svgY: safePadding + (1 - ((point.y - minY) / spanY)) * innerHeight,
  })));
}

export const PerformanceWebFieldMetricsInvariants = Object.freeze([
  'duration is derived from authoritative shift timestamps and displayed to the second',
  'web miles are labeled as tracked GPS distance and exclude mocked or over-100-meter-accuracy points',
  'web steps are an estimate derived from tracked miles rather than represented as iPhone pedometer data',
  'route-map geometry is computed locally from Paradise location points without requiring a third-party map-tile request',
]);
