import { createClient } from '@supabase/supabase-js';
import {
  WEB_ROUTE_MAX_ACCURACY_METERS,
  formatShiftClock,
  formatShiftDuration,
  renderWebRouteTrace,
  summarizeWebRoute,
} from './performance-web-summary.mjs';
import { isUuid } from '../shared/performance-events.mjs';

export const PERFORMANCE_WEB_LAST_COMPLETED_VERSION = '2026.08.22-web-last-completed-v3';

const SUPABASE_URL = 'https://taxlrlfsobtnbasjcnuf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_3e755MdDisPBQzzGrBVBIA_gy4uqNqr';
const DEVICE_ID_KEY = 'paradise-performance-web-device-id-v1';
const CARD_ID = 'performanceWebLastCompleted';

let supabase = null;
let loading = false;
let lastRenderedSignature = '';

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function count(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : 0;
}

function metric(label, value) {
  return `<div class="performance-web-metric"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
}

async function trustedEmployeeId() {
  const deviceId = window.localStorage.getItem(DEVICE_ID_KEY);
  if (!isUuid(deviceId)) return null;
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session) return null;
  const { data: employeeId, error } = await supabase.rpc('performance_current_employee_id');
  if (error || !isUuid(employeeId)) return null;
  return employeeId;
}

async function latestFinishedShift(employeeId) {
  const { data, error } = await supabase
    .from('performance_shifts')
    .select('id,status,started_at,finished_at,doors,conversations,updated_at')
    .eq('employee_id', employeeId)
    .eq('status', 'finished')
    .not('finished_at', 'is', null)
    .order('finished_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

async function routePoints(employeeId, shiftId) {
  const { data, error } = await supabase
    .from('performance_location_points')
    .select('client_point_id,captured_at,latitude,longitude,accuracy_meters,precise,mocked,source')
    .eq('employee_id', employeeId)
    .eq('shift_id', shiftId)
    .order('captured_at', { ascending: true })
    .limit(5000);
  if (error) throw error;
  return data ?? [];
}

function cardMarkup(shift, points) {
  const summary = summarizeWebRoute(points);
  return `<div id="${CARD_ID}" class="performance-web-card performance-web-complete performance-web-last-completed">
    <p class="performance-eyebrow">LAST COMPLETED DAY</p>
    <h3>${count(shift.doors)} Doors · ${count(shift.conversations)} Conversations</h3>
    <div class="performance-web-metrics" aria-label="Last completed shift summary">
      ${metric('START', formatShiftClock(shift.started_at))}
      ${metric('END', formatShiftClock(shift.finished_at))}
      ${metric('DURATION', formatShiftDuration(shift.started_at, shift.finished_at))}
      ${metric('GPS MILES', summary.miles.toFixed(2))}
      ${metric('EST. STEPS', summary.estimatedSteps.toLocaleString())}
    </div>
    <div class="performance-web-route-card">
      <div class="performance-web-route-heading">
        <div><span>COMPLETED ROUTE TRACE</span><strong>${summary.qualifiedPointCount} qualified GPS points</strong></div>
        <small>Uses fixes ≤ ${WEB_ROUTE_MAX_ACCURACY_METERS} m. Coarse, mocked, and long-gap segments are excluded from tracked metrics.</small>
      </div>
      ${renderWebRouteTrace(points)}
      <p class="performance-web-route-note">Route trace only — no third-party street-map provider is loaded in this controlled web interim.</p>
    </div>
    <p class="performance-web-step-note">Estimated steps use pedestrian-speed GPS segments only. They are not Apple Health or iPhone pedometer steps.</p>
  </div>`;
}

function renderSignature(shift, points) {
  const lastPoint = points.at(-1);
  return [shift.id, shift.updated_at || shift.finished_at || '', points.length, lastPoint?.captured_at || ''].join(':');
}

async function refreshLastCompleted() {
  const idle = document.querySelector('[data-performance-web-state="idle"]');
  if (!idle) {
    document.getElementById(CARD_ID)?.remove();
    return;
  }
  if (loading) return;
  loading = true;
  try {
    const employeeId = await trustedEmployeeId();
    if (!employeeId) return;
    const shift = await latestFinishedShift(employeeId);
    if (!shift || !isUuid(shift.id)) {
      document.getElementById(CARD_ID)?.remove();
      lastRenderedSignature = '';
      return;
    }
    const points = await routePoints(employeeId, shift.id);
    const signature = renderSignature(shift, points);
    if (signature === lastRenderedSignature && document.getElementById(CARD_ID)) return;
    document.getElementById(CARD_ID)?.remove();
    idle.insertAdjacentHTML('afterend', cardMarkup(shift, points));
    lastRenderedSignature = signature;
  } catch {
    // Last-completed summary is read-only additive context; core Performance stays usable on failure.
  } finally {
    loading = false;
  }
}

async function boot() {
  supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: window.localStorage,
    },
  });
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target.closest('#nPerf,[data-performance-web-action]') : null;
    if (!target) return;
    window.setTimeout(() => { void refreshLastCompleted(); }, 900);
  }, true);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') window.setTimeout(() => { void refreshLastCompleted(); }, 250);
  });
  window.setInterval(() => { void refreshLastCompleted(); }, 5000);
  window.setTimeout(() => { void refreshLastCompleted(); }, 500);
}

void boot();

export const ParadisePerformanceLastCompletedInvariants = Object.freeze([
  'the idle Performance screen may show the most recent authoritative finished shift without reopening or mutating it',
  'last completed start, end, duration, doors, and conversations come from the finished performance_shifts row',
  'last completed miles, estimated steps, and route trace reuse the same controlled web-summary filters as live Day Complete',
  'an unchanged completed shift keeps its existing DOM surface so an interactive map can preserve pan, zoom, and provider state',
  'the read-only helper does not run a second refresh-token loop for the shared browser session',
  'this read-only helper adds no schema, privilege, background location capability, or provider credential',
]);
