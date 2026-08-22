import { createClient } from '@supabase/supabase-js';
import { isUuid } from '../shared/performance-events.mjs';
import {
  qualifiedRoutePoints,
  splitTrackedSegments,
  stabilizeRoutePoints,
} from './performance-web-summary.mjs';

export const PERFORMANCE_GOOGLE_MAPS_VERSION = '2026.08.22-google-maps-v2';
export const GOOGLE_MAPS_API_KEY_META = 'paradise-google-maps-api-key';
export const GOOGLE_MAPS_PROVIDER_HOST = 'maps.googleapis.com';
export const GOOGLE_MAPS_DEFAULT_TYPE = 'hybrid';
export const GOOGLE_MAPS_SINGLE_POINT_ZOOM = 19;

const SUPABASE_URL = 'https://taxlrlfsobtnbasjcnuf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_3e755MdDisPBQzzGrBVBIA_gy4uqNqr';
const DEVICE_ID_KEY = 'paradise-performance-web-device-id-v1';
const ACTIVE_STATUSES = ['active', 'paused', 'finishing'];
const REFRESH_MS = 5000;

const runtime = {
  supabase: null,
  employeeId: null,
  refreshing: false,
};

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

export function stabilizedProviderPoints(points = []) {
  return stabilizeRoutePoints(qualifiedRoutePoints(points)).map(point => Object.freeze({
    capturedAt: point.capturedAt,
    latitude: Number(point.latitude),
    longitude: Number(point.longitude),
    accuracyMeters: Number(point.accuracyMeters),
  }));
}

async function loadGoogleMaps() {
  if (window.google?.maps?.Map) return window.google.maps;
  if (loaderPromise) return loaderPromise;
  const key = apiKey();
  if (!key) throw new Error('GOOGLE_MAPS_API_KEY_NOT_CONFIGURED');
  loaderPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-paradise-google-maps-loader="true"]');
    if (existing) {
      existing.addEventListener('load', () => window.google?.maps?.Map ? resolve(window.google.maps) : reject(new Error('GOOGLE_MAPS_LOAD_FAILED')), { once: true });
      existing.addEventListener('error', () => reject(new Error('GOOGLE_MAPS_LOAD_FAILED')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = `https://${GOOGLE_MAPS_PROVIDER_HOST}/maps/api/js?key=${encodeURIComponent(key)}&loading=async&v=quarterly`;
    script.async = true;
    script.defer = true;
    script.referrerPolicy = 'strict-origin-when-cross-origin';
    script.dataset.paradiseGoogleMapsLoader = 'true';
    script.onload = () => window.google?.maps?.Map ? resolve(window.google.maps) : reject(new Error('GOOGLE_MAPS_LOAD_FAILED'));
    script.onerror = () => reject(new Error('GOOGLE_MAPS_LOAD_FAILED'));
    document.head.appendChild(script);
  }).catch(error => {
    loaderPromise = null;
    throw error;
  });
  return loaderPromise;
}

async function trustedEmployeeId() {
  if (isUuid(runtime.employeeId)) return runtime.employeeId;
  const deviceId = window.localStorage.getItem(DEVICE_ID_KEY);
  if (!isUuid(deviceId)) return null;
  const { data: sessionData } = await runtime.supabase.auth.getSession();
  if (!sessionData?.session) return null;
  const { data: employeeId, error } = await runtime.supabase.rpc('performance_current_employee_id');
  if (error || !isUuid(employeeId)) return null;
  runtime.employeeId = employeeId;
  return employeeId;
}

function routeMode(card) {
  if (card.closest('[data-performance-web-state="active"]')) return 'ACTIVE';
  if (card.closest('[data-performance-web-state="complete"]')) return 'FINISHED';
  if (card.closest('#performanceWebLastCompleted')) return 'FINISHED';
  return null;
}

async function displayedShift(employeeId, mode) {
  let query = runtime.supabase
    .from('performance_shifts')
    .select('id,status,started_at,finished_at')
    .eq('employee_id', employeeId);
  if (mode === 'ACTIVE') {
    query = query.in('status', ACTIVE_STATUSES).order('started_at', { ascending: false });
  } else {
    query = query.eq('status', 'finished').not('finished_at', 'is', null).order('finished_at', { ascending: false });
  }
  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw error;
  return data ?? null;
}

async function routePoints(employeeId, shiftId) {
  const { data, error } = await runtime.supabase
    .from('performance_location_points')
    .select('client_point_id,captured_at,latitude,longitude,accuracy_meters,precise,mocked,source')
    .eq('employee_id', employeeId)
    .eq('shift_id', shiftId)
    .order('captured_at', { ascending: true })
    .limit(5000);
  if (error) throw error;
  return data ?? [];
}

function pointLiteral(point) {
  return { lat: Number(point.latitude), lng: Number(point.longitude) };
}

function clearOverlays(state) {
  for (const overlay of state.overlays || []) overlay?.setMap?.(null);
  state.overlays = [];
}

function applyRoute(state, points) {
  const maps = window.google?.maps;
  if (!maps || !state?.map || !points.length) return;
  clearOverlays(state);
  const overlays = [];

  for (const segment of splitTrackedSegments(points)) {
    if (segment.length < 2) continue;
    overlays.push(new maps.Polyline({
      map: state.map,
      path: segment.map(pointLiteral),
      geodesic: true,
      strokeColor: '#1a73e8',
      strokeOpacity: 0.95,
      strokeWeight: 5,
      clickable: false,
    }));
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

  if (state.userInteracted) return;
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

function fallbackElement(card) {
  const liveHost = card.querySelector('[data-performance-route]');
  if (liveHost) return liveHost;
  return card.querySelector('.performance-route-svg');
}

function providerNote(card) {
  return card.querySelector('.performance-web-route-note');
}

function ensureCanvas(card) {
  let canvas = card.querySelector(':scope > [data-performance-google-map-canvas]');
  if (canvas instanceof HTMLElement) return canvas;
  canvas = document.createElement('div');
  canvas.className = 'performance-google-map-canvas';
  canvas.dataset.performanceGoogleMapCanvas = 'true';
  canvas.setAttribute('aria-label', 'Google Maps hybrid route view');
  const note = providerNote(card);
  if (note) card.insertBefore(canvas, note);
  else card.appendChild(canvas);
  return canvas;
}

async function hydrateCard(card, points) {
  if (!(card instanceof HTMLElement) || !points.length) return;
  const maps = await loadGoogleMaps();
  if (!card.isConnected) return;
  const canvas = ensureCanvas(card);
  let state = mapStates.get(card);
  if (!state) {
    const current = points.at(-1);
    const map = new maps.Map(canvas, {
      center: pointLiteral(current),
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
    state = { map, overlays: [], userInteracted: false, shiftId: null, signature: '' };
    mapStates.set(card, state);
    for (const eventName of ['pointerdown', 'touchstart', 'wheel']) {
      canvas.addEventListener(eventName, () => { state.userInteracted = true; }, { passive: true });
    }
    map.addListener('dragstart', () => { state.userInteracted = true; });
  }
  const signature = `${points.length}:${points.at(-1)?.capturedAt || ''}`;
  if (signature !== state.signature) {
    applyRoute(state, points);
    state.signature = signature;
  }
  canvas.hidden = false;
  const fallback = fallbackElement(card);
  if (fallback) fallback.hidden = true;
  const note = providerNote(card);
  if (note) note.textContent = 'Google Maps Hybrid · only stabilized route coordinates are sent to Google for map rendering; raw GPS remains in Paradise.';
  card.dataset.performanceMapProvider = 'google-maps';
}

async function refreshMaps() {
  if (runtime.refreshing || !googleMapsConfigured() || document.visibilityState !== 'visible') return;
  const cards = Array.from(document.querySelectorAll('.performance-web-route-card'));
  if (!cards.length) return;
  runtime.refreshing = true;
  try {
    const employeeId = await trustedEmployeeId();
    if (!employeeId) return;
    for (const card of cards) {
      const mode = routeMode(card);
      if (!mode) continue;
      const shift = await displayedShift(employeeId, mode);
      if (!shift || !isUuid(shift.id)) continue;
      const rows = await routePoints(employeeId, shift.id);
      const points = stabilizedProviderPoints(rows);
      if (!points.length) continue;
      const state = mapStates.get(card);
      if (state && state.shiftId && state.shiftId !== shift.id) {
        state.userInteracted = false;
        state.signature = '';
      }
      if (state) state.shiftId = shift.id;
      await hydrateCard(card, points);
      const hydrated = mapStates.get(card);
      if (hydrated) hydrated.shiftId = shift.id;
    }
  } catch {
    // Provider failure never removes the existing Paradise route fallback.
  } finally {
    runtime.refreshing = false;
  }
}

function boot() {
  runtime.supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: window.localStorage,
    },
  });
  const observer = new MutationObserver(() => { window.setTimeout(() => { void refreshMaps(); }, 100); });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void refreshMaps();
  });
  window.addEventListener('online', () => { void refreshMaps(); });
  window.setInterval(() => { void refreshMaps(); }, REFRESH_MS);
  window.setTimeout(() => { void refreshMaps(); }, 700);
}

boot();

export const ParadisePerformanceGoogleMapsInvariants = Object.freeze([
  'Google Maps receives only stabilized route coordinates after the controlled accuracy and stationary-drift filters',
  'raw browser GPS evidence remains stored unchanged in Paradise and is never rewritten to match Google Maps rendering',
  'Google Maps loads only when an explicitly configured browser API key is present in controlled page metadata',
  'the default map is Google Maps Hybrid satellite imagery with road and place labels',
  'live and completed routes reuse the same Paradise shift and location-point RLS boundary as the existing web summary',
  'the current location uses a blue accuracy halo and route rendering preserves user pan and zoom interaction',
  'if Google Maps is unavailable or not configured, the existing self-contained Paradise route stays visible',
]);
