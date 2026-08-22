import {
  qualifiedRoutePoints,
  renderWebRouteTrace,
  splitTrackedSegments,
  stabilizeRoutePoints,
} from './performance-web-summary.mjs';

export const PERFORMANCE_GOOGLE_MAPS_VERSION = '2026.08.22-google-maps-v1';
export const GOOGLE_MAPS_API_KEY_META = 'paradise-google-maps-api-key';
export const GOOGLE_MAPS_PROVIDER_HOST = 'maps.googleapis.com';
export const GOOGLE_MAPS_DEFAULT_TYPE = 'hybrid';
export const GOOGLE_MAPS_SINGLE_POINT_ZOOM = 19;

const mapStates = new WeakMap();
let loaderPromise = null;

function apiKey() {
  const value = document.querySelector(`meta[name="${GOOGLE_MAPS_API_KEY_META}"]`)?.getAttribute('content')?.trim() || '';
  if (!value || value === 'YOUR_GOOGLE_MAPS_API_KEY') return '';
  return value;
}

export function googleMapsConfigured() {
  return Boolean(apiKey());
}

function stableRoutePoints(points = []) {
  return stabilizeRoutePoints(qualifiedRoutePoints(points)).map(point => ({
    capturedAt: point.capturedAt,
    latitude: Number(point.latitude),
    longitude: Number(point.longitude),
    accuracyMeters: Number(point.accuracyMeters),
  }));
}

function encodePoints(points) {
  return encodeURIComponent(JSON.stringify(points));
}

function decodePoints(value) {
  try {
    const rows = JSON.parse(decodeURIComponent(String(value || '')));
    if (!Array.isArray(rows)) return [];
    return rows.filter(row => Number.isFinite(Number(row?.latitude)) && Number.isFinite(Number(row?.longitude)) && Number.isFinite(Date.parse(row?.capturedAt)));
  } catch {
    return [];
  }
}

export function renderGoogleMapsRoute(points = []) {
  const stable = stableRoutePoints(points);
  const payload = encodePoints(stable);
  const count = stable.length;
  return `<div class="performance-google-map-shell" data-performance-google-map data-performance-google-route-points="${payload}" data-performance-google-route-count="${count}">
    <div class="performance-google-map-canvas" data-performance-google-map-canvas hidden aria-label="Google Maps route view"></div>
    <div class="performance-google-map-fallback" data-performance-google-map-fallback>${renderWebRouteTrace(points)}</div>
    <div class="performance-google-map-provider" data-performance-google-map-provider hidden>Google Maps · Hybrid</div>
    <div class="performance-google-map-status" data-performance-google-map-status hidden></div>
  </div>`;
}

function setStatus(root, message = '') {
  const node = root?.querySelector?.('[data-performance-google-map-status]');
  if (!node) return;
  node.textContent = message;
  node.hidden = !message;
}

async function loadGoogleMaps() {
  if (window.google?.maps?.Map) return window.google.maps;
  if (loaderPromise) return loaderPromise;
  const key = apiKey();
  if (!key) throw new Error('GOOGLE_MAPS_API_KEY_NOT_CONFIGURED');
  loaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://${GOOGLE_MAPS_PROVIDER_HOST}/maps/api/js?key=${encodeURIComponent(key)}&loading=async&v=quarterly`;
    script.async = true;
    script.defer = true;
    script.referrerPolicy = 'strict-origin-when-cross-origin';
    script.dataset.paradiseGoogleMapsLoader = 'true';
    script.onload = () => {
      if (window.google?.maps?.Map) resolve(window.google.maps);
      else reject(new Error('GOOGLE_MAPS_LOAD_FAILED'));
    };
    script.onerror = () => reject(new Error('GOOGLE_MAPS_LOAD_FAILED'));
    document.head.appendChild(script);
  }).catch(error => {
    loaderPromise = null;
    throw error;
  });
  return loaderPromise;
}

function clearOverlays(state) {
  for (const overlay of state.overlays || []) overlay?.setMap?.(null);
  state.overlays = [];
}

function pointLiteral(point) {
  return { lat: Number(point.latitude), lng: Number(point.longitude) };
}

function applyRoute(state, points, { preserveViewport = false } = {}) {
  const maps = window.google?.maps;
  if (!maps || !state?.map) return;
  clearOverlays(state);
  if (!points.length) return;

  const overlays = [];
  const segments = splitTrackedSegments(points);
  for (const segment of segments) {
    if (segment.length < 2) continue;
    const line = new maps.Polyline({
      map: state.map,
      path: segment.map(pointLiteral),
      geodesic: true,
      strokeColor: '#1a73e8',
      strokeOpacity: 0.95,
      strokeWeight: 5,
      clickable: false,
    });
    overlays.push(line);
  }

  const first = points[0];
  const current = points.at(-1);
  if (points.length > 1) {
    overlays.push(new maps.Circle({
      map: state.map,
      center: pointLiteral(first),
      radius: 1.8,
      strokeColor: '#137333',
      strokeOpacity: 1,
      strokeWeight: 2,
      fillColor: '#34a853',
      fillOpacity: 1,
      clickable: false,
    }));
  }

  const accuracy = Math.max(2, Math.min(50, Number(current.accuracyMeters || 0)));
  overlays.push(new maps.Circle({
    map: state.map,
    center: pointLiteral(current),
    radius: accuracy,
    strokeColor: '#1a73e8',
    strokeOpacity: 0.35,
    strokeWeight: 1,
    fillColor: '#4285f4',
    fillOpacity: 0.14,
    clickable: false,
  }));
  overlays.push(new maps.Circle({
    map: state.map,
    center: pointLiteral(current),
    radius: 1.8,
    strokeColor: '#ffffff',
    strokeOpacity: 1,
    strokeWeight: 2,
    fillColor: '#1a73e8',
    fillOpacity: 1,
    clickable: false,
  }));
  state.overlays = overlays;

  if (preserveViewport || state.userInteracted) return;
  if (points.length === 1) {
    state.map.setCenter(pointLiteral(current));
    state.map.setZoom(GOOGLE_MAPS_SINGLE_POINT_ZOOM);
    return;
  }
  const bounds = new maps.LatLngBounds();
  for (const point of points) bounds.extend(pointLiteral(point));
  state.map.fitBounds(bounds, 44);
  maps.event.addListenerOnce(state.map, 'idle', () => {
    if (!state.userInteracted && Number(state.map.getZoom()) > GOOGLE_MAPS_SINGLE_POINT_ZOOM) {
      state.map.setZoom(GOOGLE_MAPS_SINGLE_POINT_ZOOM);
    }
  });
}

async function hydrateRoot(root) {
  if (!(root instanceof HTMLElement)) return;
  const points = decodePoints(root.dataset.performanceGoogleRoutePoints);
  const fallback = root.querySelector('[data-performance-google-map-fallback]');
  const canvas = root.querySelector('[data-performance-google-map-canvas]');
  const provider = root.querySelector('[data-performance-google-map-provider]');
  if (!(canvas instanceof HTMLElement)) return;

  if (!googleMapsConfigured()) {
    root.dataset.performanceGoogleMapState = 'config-required';
    setStatus(root, 'Google Maps setup pending — local route fallback shown.');
    return;
  }

  try {
    const maps = await loadGoogleMaps();
    if (!root.isConnected) return;
    let state = mapStates.get(root);
    if (!state) {
      canvas.hidden = false;
      const initial = points.at(-1) || { latitude: 0, longitude: 0 };
      const map = new maps.Map(canvas, {
        center: pointLiteral(initial),
        zoom: GOOGLE_MAPS_SINGLE_POINT_ZOOM,
        mapTypeId: maps.MapTypeId.HYBRID,
        mapTypeControl: true,
        mapTypeControlOptions: { mapTypeIds: [maps.MapTypeId.ROADMAP, maps.MapTypeId.HYBRID, maps.MapTypeId.SATELLITE] },
        zoomControl: true,
        fullscreenControl: true,
        streetViewControl: false,
        rotateControl: false,
        scaleControl: true,
        clickableIcons: true,
        gestureHandling: 'cooperative',
      });
      state = { map, overlays: [], userInteracted: false };
      mapStates.set(root, state);
      for (const eventName of ['pointerdown', 'touchstart', 'wheel']) {
        canvas.addEventListener(eventName, () => { state.userInteracted = true; }, { passive: true });
      }
      map.addListener('dragstart', () => { state.userInteracted = true; });
    }
    applyRoute(state, points);
    fallback?.setAttribute('hidden', '');
    if (provider) provider.hidden = false;
    root.dataset.performanceGoogleMapState = 'ready';
    setStatus(root, '');
  } catch (error) {
    root.dataset.performanceGoogleMapState = 'fallback';
    setStatus(root, error?.message === 'GOOGLE_MAPS_API_KEY_NOT_CONFIGURED'
      ? 'Google Maps setup pending — local route fallback shown.'
      : 'Google Maps unavailable — local route fallback shown.');
  }
}

export async function updateGoogleMapsRoute(container, points = []) {
  if (!(container instanceof HTMLElement)) return false;
  const root = container.matches('[data-performance-google-map]')
    ? container
    : container.querySelector('[data-performance-google-map]');
  if (!(root instanceof HTMLElement)) return false;
  const stable = stableRoutePoints(points);
  root.dataset.performanceGoogleRoutePoints = encodePoints(stable);
  root.dataset.performanceGoogleRouteCount = String(stable.length);
  const fallback = root.querySelector('[data-performance-google-map-fallback]');
  if (fallback) fallback.innerHTML = renderWebRouteTrace(points);
  const state = mapStates.get(root);
  if (state && window.google?.maps) {
    applyRoute(state, stable, { preserveViewport: state.userInteracted });
    return true;
  }
  await hydrateRoot(root);
  return true;
}

async function hydrateAll() {
  const roots = document.querySelectorAll('[data-performance-google-map]');
  for (const root of roots) {
    if (root.dataset.performanceGoogleMapState === 'ready') continue;
    await hydrateRoot(root);
  }
}

const observer = new MutationObserver(() => { queueMicrotask(() => { void hydrateAll(); }); });
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener('online', () => { void hydrateAll(); });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') void hydrateAll();
});
queueMicrotask(() => { void hydrateAll(); });

export const ParadisePerformanceGoogleMapsInvariants = Object.freeze([
  'Google Maps receives only the stabilized route coordinates that remain after the controlled accuracy and stationary-drift filters',
  'raw browser GPS evidence remains stored in Paradise and is not rewritten to match Google Maps rendering',
  'Google Maps is loaded only when a browser API key is explicitly configured in the controlled page metadata',
  'the default map type is hybrid satellite imagery with road and place labels',
  'the live route retains the current-location accuracy halo and start marker while preserving user pan and zoom interaction',
  'if Google Maps is unavailable or not configured, the existing local self-contained route trace remains visible',
]);
