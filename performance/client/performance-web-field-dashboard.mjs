import { createClient } from '@supabase/supabase-js';
import { createPerformanceSupabaseOptions } from './performance-session.mjs';
import { createJsonStorageQueueStore, createQueuedWrite, PerformanceSyncQueue } from './performance-sync.mjs';
import { createSupabaseOperationalSyncTransport } from './performance-operational-sync.mjs';
import { buildEventEnvelope, createClientEventId, isUuid } from '../shared/performance-events.mjs';
import {
  calculateRouteMetrics,
  durationSeconds,
  formatDurationHms,
  formatLocalClock,
  mergeRoutePoints,
  normalizeRouteForSvg,
} from './performance-web-field-metrics.mjs';

export const PERFORMANCE_WEB_FIELD_DASHBOARD_VERSION = '2026.08.21-web-field-dashboard-v2';

const SUPABASE_URL = 'https://taxlrlfsobtnbasjcnuf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_3e755MdDisPBQzzGrBVBIA_gy4uqNqr';
const DEVICE_ID_KEY = 'paradise-performance-web-device-id-v1';
const QUEUE_KEY = 'paradise-performance-web-offline-v1';
const COUNT_KEY_PREFIX = 'paradise-performance-web-counts-v1:';
const ACTIVE_STATUSES = ['active', 'paused', 'finishing'];
const COUNT_EVENT_TYPES = ['DOOR_COUNT_SET', 'CONVERSATION_COUNT_SET'];
const REFRESH_MS = 5000;

const runtime = {
  supabase: null,
  queue: null,
  employeeId: null,
  deviceId: null,
  snapshot: null,
  refreshTimer: null,
  clockTimer: null,
  refreshing: false,
  actionChain: Promise.resolve(),
  lastWarning: null,
};

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function countKey(shiftId) {
  return `${COUNT_KEY_PREFIX}${shiftId}`;
}

function nonNegativeInt(value, fallback = 0) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : fallback;
}

function safeJsonParse(value, fallback = null) {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}

function readLocalCountEvidence(shiftId) {
  if (!isUuid(shiftId)) return {};
  const parsed = safeJsonParse(window.localStorage.getItem(countKey(shiftId)), {});
  return parsed && typeof parsed === 'object' ? parsed : {};
}

function writeLocalCountEvidence(shiftId, field, value, at = new Date().toISOString()) {
  const current = readLocalCountEvidence(shiftId);
  const next = { ...current, [field]: { value: nonNegativeInt(value), at } };
  window.localStorage.setItem(countKey(shiftId), JSON.stringify(next));
  return next;
}

function clearLocalCountEvidence(shiftId) {
  if (isUuid(shiftId)) window.localStorage.removeItem(countKey(shiftId));
}

function candidate(value, at, source) {
  const n = Number(value);
  const t = new Date(at).valueOf();
  if (!Number.isInteger(n) || n < 0 || !Number.isFinite(t)) return null;
  return { value: n, at: new Date(t).toISOString(), source };
}

function latestCandidate(candidates, fallbackValue, fallbackAt) {
  const valid = candidates.filter(Boolean).sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  return valid[0] ?? candidate(nonNegativeInt(fallbackValue), fallbackAt, 'shift-row');
}

function latestServerEventCandidate(events, eventType) {
  for (const event of events) {
    if (event?.event_type !== eventType) continue;
    const c = candidate(event?.payload?.value, event?.captured_at, 'server-event');
    if (c) return c;
  }
  return null;
}

function latestPendingEventCandidate(rows, eventType) {
  const matches = rows
    .filter(row => row?.kind === 'EVENT' && row?.payload?.type === eventType)
    .map(row => candidate(row?.payload?.payload?.value, row?.capturedAt, 'pending-event'))
    .filter(Boolean)
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  return matches[0] ?? null;
}

function resolveCounts(shift, serverEvents, queueRows) {
  const local = readLocalCountEvidence(shift.id);
  const fallbackAt = shift.updated_at || shift.started_at;
  const doors = latestCandidate([
    latestServerEventCandidate(serverEvents, 'DOOR_COUNT_SET'),
    latestPendingEventCandidate(queueRows, 'DOOR_COUNT_SET'),
    candidate(local?.doors?.value, local?.doors?.at, 'local'),
  ], shift.doors, fallbackAt);
  const conversations = latestCandidate([
    latestServerEventCandidate(serverEvents, 'CONVERSATION_COUNT_SET'),
    latestPendingEventCandidate(queueRows, 'CONVERSATION_COUNT_SET'),
    candidate(local?.conversations?.value, local?.conversations?.at, 'local'),
  ], shift.conversations, fallbackAt);
  return Object.freeze({
    doors: doors?.value ?? nonNegativeInt(shift.doors),
    conversations: conversations?.value ?? nonNegativeInt(shift.conversations),
    evidence: Object.freeze({ doors, conversations }),
  });
}

async function identifyTrustedSession() {
  const deviceId = window.localStorage.getItem(DEVICE_ID_KEY);
  if (!isUuid(deviceId)) return false;
  const { data: sessionData } = await runtime.supabase.auth.getSession();
  if (!sessionData?.session) return false;
  const { data: employeeId, error } = await runtime.supabase.rpc('performance_current_employee_id');
  if (error || !isUuid(employeeId)) return false;
  runtime.employeeId = employeeId;
  runtime.deviceId = deviceId;
  return true;
}

async function fetchShift(mode) {
  if (!runtime.employeeId) return null;
  let query = runtime.supabase
    .from('performance_shifts')
    .select('id,employee_id,device_id,status,started_at,finished_at,doors,conversations,updated_at')
    .eq('employee_id', runtime.employeeId);
  if (mode === 'ACTIVE') {
    query = query.in('status', ACTIVE_STATUSES).order('started_at', { ascending: false });
  } else {
    query = query.eq('status', 'finished').order('finished_at', { ascending: false });
  }
  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw error;
  return data ?? null;
}

async function fetchCountEvents(shiftId) {
  const { data, error } = await runtime.supabase
    .from('performance_events')
    .select('client_event_id,event_type,captured_at,payload')
    .eq('employee_id', runtime.employeeId)
    .eq('shift_id', shiftId)
    .in('event_type', COUNT_EVENT_TYPES)
    .order('captured_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return data ?? [];
}

async function fetchRoutePoints(shiftId) {
  const { data, error } = await runtime.supabase
    .from('performance_location_points')
    .select('client_point_id,captured_at,latitude,longitude,accuracy_meters,precise,mocked,source')
    .eq('employee_id', runtime.employeeId)
    .eq('shift_id', shiftId)
    .order('captured_at', { ascending: true })
    .limit(5000);
  if (error) throw error;
  return data ?? [];
}

async function queueRowsForShift(shiftId) {
  const rows = await runtime.queue.store.list();
  return rows.filter(row => row?.payload?.shiftId === shiftId);
}

async function persistShiftCounts(shift, counts) {
  const doors = nonNegativeInt(counts.doors);
  const conversations = nonNegativeInt(counts.conversations);
  if (nonNegativeInt(shift.doors) === doors && nonNegativeInt(shift.conversations) === conversations) return shift;
  const now = new Date().toISOString();
  const { data, error } = await runtime.supabase
    .from('performance_shifts')
    .update({ doors, conversations, updated_at: now })
    .eq('id', shift.id)
    .eq('employee_id', runtime.employeeId)
    .select('id,employee_id,device_id,status,started_at,finished_at,doors,conversations,updated_at')
    .single();
  if (error) throw error;
  return data;
}

function routeMapMarkup(metrics, complete) {
  const route = normalizeRouteForSvg(metrics.eligiblePoints, 320, 180, 18);
  if (route.length < 2) {
    return `<div class="performance-route-empty"><b>Route map</b><span>Waiting for at least two precise GPS points.</span></div>`;
  }
  const polyline = route.map(point => `${point.svgX.toFixed(1)},${point.svgY.toFixed(1)}`).join(' ');
  const start = route[0];
  const end = route[route.length - 1];
  return `<div class="performance-route-map" role="img" aria-label="${complete ? 'Completed' : 'Live'} GPS route map without street tiles">
    <div class="performance-route-map-head"><b>${complete ? 'DAY ROUTE' : 'LIVE ROUTE'}</b><span>${metrics.precisePointCount} precise GPS points</span></div>
    <svg viewBox="0 0 320 180" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
      <path class="performance-route-grid" d="M18 45H302M18 90H302M18 135H302M80 18V162M160 18V162M240 18V162"/>
      <polyline class="performance-route-line" points="${polyline}"/>
      <circle class="performance-route-start" cx="${start.svgX.toFixed(1)}" cy="${start.svgY.toFixed(1)}" r="5"/>
      <circle class="performance-route-current" cx="${end.svgX.toFixed(1)}" cy="${end.svgY.toFixed(1)}" r="6"/>
      <text class="performance-route-north" x="294" y="20">N</text>
    </svg>
    <div class="performance-route-legend"><span><i class="start"></i>Start</span><span><i class="current"></i>${complete ? 'End' : 'Current'}</span></div>
  </div>`;
}

function timingMarkup(shift, complete) {
  const endedAt = complete ? shift.finished_at : Date.now();
  const seconds = durationSeconds(shift.started_at, endedAt);
  return `<div class="performance-shift-timing">
    <div><span>Started</span><strong>${esc(formatLocalClock(shift.started_at))}</strong></div>
    ${complete ? `<div><span>Ended</span><strong>${esc(formatLocalClock(shift.finished_at))}</strong></div>` : ''}
    <div><span>${complete ? 'Total time' : 'Elapsed'}</span><strong data-performance-live-duration>${esc(formatDurationHms(seconds))}</strong></div>
  </div>`;
}

function metricCard(label, value, detail = '') {
  return `<div class="performance-field-stat"><span>${esc(label)}</span><strong>${esc(value)}</strong>${detail ? `<small>${esc(detail)}</small>` : ''}</div>`;
}

function controlsMarkup(counts) {
  return `<div class="performance-count-controls" aria-label="Field activity counts">
    <div class="performance-count-block">
      <div><span>Doors knocked</span><strong data-performance-count-value="doors">${counts.doors}</strong></div>
      <div class="performance-count-actions"><button type="button" data-performance-count="doors" data-delta="-1" aria-label="Remove one door">−</button><button type="button" data-performance-count="doors" data-delta="1">+1 DOOR</button></div>
    </div>
    <div class="performance-count-block">
      <div><span>Conversations</span><strong data-performance-count-value="conversations">${counts.conversations}</strong></div>
      <div class="performance-count-actions"><button type="button" data-performance-count="conversations" data-delta="-1" aria-label="Remove one conversation">−</button><button type="button" data-performance-count="conversations" data-delta="1">+1 CONVERSATION</button></div>
    </div>
  </div>`;
}

function syncCoreCountText(anchor, counts) {
  if (!anchor) return;
  for (const node of anchor.querySelectorAll('p,h3')) {
    if (/\bDoors\b.*\bConversations\b/i.test(node.textContent || '')) {
      node.textContent = `${counts.doors} Doors · ${counts.conversations} Conversations`;
      break;
    }
  }
}

function renderDashboard(snapshot, domMode) {
  const main = document.getElementById('main');
  const anchor = main?.querySelector('[data-performance-web-state]');
  if (!main || !anchor || !snapshot?.shift) return;
  const complete = snapshot.shift.status === 'finished' || domMode === 'COMPLETE' || domMode === 'IDLE_LAST';
  const metrics = snapshot.routeMetrics;
  const countControls = complete ? '' : controlsMarkup(snapshot.counts);
  const title = complete ? (domMode === 'IDLE_LAST' ? 'LAST COMPLETED DAY' : 'DAY COMPLETE') : 'FIELD ACTIVITY';
  const warning = runtime.lastWarning ? `<p class="performance-field-warning" role="status">${esc(runtime.lastWarning)}</p>` : '';
  const html = `<section id="performanceWebFieldDashboard" class="performance-field-dashboard" data-mode="${complete ? 'complete' : 'active'}">
    <div class="performance-field-title"><p class="performance-eyebrow">${title}</p>${complete ? '<b>Shift summary</b>' : '<b>Live shift summary</b>'}</div>
    ${timingMarkup(snapshot.shift, complete)}
    ${countControls}
    <div class="performance-field-stats">
      ${metricCard('Doors', snapshot.counts.doors)}
      ${metricCard('Conversations', snapshot.counts.conversations)}
      ${metricCard('Tracked miles', metrics.miles.toFixed(2), 'GPS route')}
      ${metricCard('Est. steps', metrics.estimatedSteps.toLocaleString(), 'Web estimate')}
    </div>
    ${routeMapMarkup(metrics, complete)}
    <p class="performance-field-note">Estimated steps use tracked GPS distance (2,000 steps/mile). True iPhone pedometer steps require the native app. This privacy-safe web route map uses Paradise GPS points only and does not send the route to a third-party street-map tile provider.</p>
    ${warning}
  </section>`;

  syncCoreCountText(anchor, snapshot.counts);
  document.getElementById('performanceWebFieldDashboard')?.remove();
  anchor.insertAdjacentHTML('afterend', html);
  document.querySelectorAll('[data-performance-count]').forEach(button => {
    button.addEventListener('click', () => {
      const field = button.dataset.performanceCount;
      const delta = Number(button.dataset.delta || 0);
      runtime.actionChain = runtime.actionChain.then(() => changeCount(field, delta)).catch(error => {
        runtime.lastWarning = `Count needs attention: ${String(error?.message || error).slice(0, 180)}`;
        void refreshDashboard();
      });
    });
  });
}

async function changeCount(field, delta) {
  const snapshot = runtime.snapshot;
  if (!snapshot?.shift || snapshot.shift.status === 'finished') return;
  if (!['doors', 'conversations'].includes(field)) return;
  const current = nonNegativeInt(snapshot.counts[field]);
  const next = Math.max(0, current + (delta > 0 ? 1 : -1));
  if (next === current) return;
  const capturedAt = new Date().toISOString();
  writeLocalCountEvidence(snapshot.shift.id, field, next, capturedAt);

  const type = field === 'doors' ? 'DOOR_COUNT_SET' : 'CONVERSATION_COUNT_SET';
  const envelope = buildEventEnvelope({
    clientEventId: createClientEventId(),
    employeeId: runtime.employeeId,
    deviceId: runtime.deviceId,
    shiftId: snapshot.shift.id,
    type,
    capturedAt,
    payload: { value: next },
  });
  await runtime.queue.enqueue(createQueuedWrite({
    id: envelope.clientEventId,
    kind: 'EVENT',
    capturedAt: envelope.capturedAt,
    payload: {
      employeeId: envelope.employeeId,
      deviceId: envelope.deviceId,
      shiftId: envelope.shiftId,
      type: envelope.type,
      schemaVersion: envelope.schemaVersion,
      payload: envelope.payload,
    },
  }));

  const optimistic = {
    ...snapshot,
    counts: { ...snapshot.counts, [field]: next },
  };
  runtime.snapshot = optimistic;
  runtime.lastWarning = null;
  renderDashboard(optimistic, 'ACTIVE');

  const result = await runtime.queue.flush().catch(() => null);
  if (result?.blockedAuth) runtime.lastWarning = 'Count saved locally; trusted-device authorization must recover before sync.';
  try {
    const updatedShift = await persistShiftCounts(optimistic.shift, optimistic.counts);
    runtime.snapshot = { ...optimistic, shift: updatedShift };
    runtime.lastWarning = null;
  } catch {
    runtime.lastWarning = 'Count saved locally and queued. It will reconcile when the network is available.';
  }
  await refreshDashboard();
}

function updateClockOnly() {
  const snapshot = runtime.snapshot;
  const node = document.querySelector('[data-performance-live-duration]');
  if (!snapshot?.shift || !node) return;
  const end = snapshot.shift.status === 'finished' ? snapshot.shift.finished_at : Date.now();
  node.textContent = formatDurationHms(durationSeconds(snapshot.shift.started_at, end));
}

function detectDomMode() {
  const state = document.querySelector('[data-performance-web-state]')?.dataset?.performanceWebState;
  if (state === 'active' || state === 'finishing') return 'ACTIVE';
  if (state === 'complete') return 'COMPLETE';
  if (state === 'idle') return 'IDLE';
  return null;
}

async function refreshDashboard() {
  if (runtime.refreshing) return;
  const domMode = detectDomMode();
  if (!domMode) return;
  runtime.refreshing = true;
  try {
    if (!runtime.employeeId && !await identifyTrustedSession()) return;
    const lookupMode = domMode === 'ACTIVE' ? 'ACTIVE' : 'FINISHED';
    const shift = await fetchShift(lookupMode);
    if (!shift) {
      document.getElementById('performanceWebFieldDashboard')?.remove();
      runtime.snapshot = null;
      return;
    }

    const [serverEvents, serverPoints, queueRows] = await Promise.all([
      fetchCountEvents(shift.id),
      fetchRoutePoints(shift.id),
      queueRowsForShift(shift.id),
    ]);
    const counts = resolveCounts(shift, serverEvents, queueRows);
    const pendingLocations = queueRows.filter(row => row?.kind === 'LOCATION');
    const mergedPoints = mergeRoutePoints(serverPoints, pendingLocations);
    const routeMetrics = calculateRouteMetrics(mergedPoints);
    let reconciledShift = shift;
    try {
      reconciledShift = await persistShiftCounts(shift, counts);
      if (reconciledShift.status === 'finished') clearLocalCountEvidence(reconciledShift.id);
      runtime.lastWarning = null;
    } catch {
      if (shift.status !== 'finished') runtime.lastWarning = 'Counts include local/offline evidence; server reconciliation is pending.';
    }

    runtime.snapshot = Object.freeze({
      shift: Object.freeze({ ...reconciledShift }),
      counts: Object.freeze({ doors: counts.doors, conversations: counts.conversations }),
      routeMetrics,
    });
    renderDashboard(runtime.snapshot, domMode === 'IDLE' ? 'IDLE_LAST' : domMode);
  } catch (error) {
    runtime.lastWarning = `Shift summary temporarily unavailable: ${String(error?.message || error).slice(0, 180)}`;
  } finally {
    runtime.refreshing = false;
  }
}

function scheduleRefresh(delay = 50) {
  window.setTimeout(() => { void refreshDashboard(); }, delay);
}

async function bootFieldDashboard() {
  try {
    runtime.supabase = createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      createPerformanceSupabaseOptions(window.localStorage),
    );
    runtime.queue = new PerformanceSyncQueue({
      store: createJsonStorageQueueStore(window.localStorage, QUEUE_KEY),
      transport: createSupabaseOperationalSyncTransport(runtime.supabase),
    });
    runtime.refreshTimer = window.setInterval(() => { void refreshDashboard(); }, REFRESH_MS);
    runtime.clockTimer = window.setInterval(updateClockOnly, 1000);
    document.addEventListener('click', event => {
      const target = event.target instanceof Element ? event.target.closest('#nPerf,[data-performance-web-action]') : null;
      if (!target) return;
      scheduleRefresh(target.id === 'nPerf' ? 100 : 800);
      if (target.matches('[data-performance-web-action]')) scheduleRefresh(2500);
    }, true);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') scheduleRefresh(250);
    });
    await refreshDashboard();
  } catch {
    // Enhancement is additive only. The core Performance web app remains usable if this dashboard cannot initialize.
  }
}

void bootFieldDashboard();

export const ParadisePerformanceWebFieldDashboardInvariants = Object.freeze([
  'shift start/end and elapsed duration are derived from authoritative performance_shifts timestamps',
  'door and conversation controls use existing count-set event types and the existing offline event queue',
  'shift rows are reconciled under existing authenticated RLS without a new privilege or schema',
  'tracked miles use only non-mocked location points with 100-meter-or-better accuracy and bounded segments',
  'web steps are visibly labeled estimated and are never represented as iPhone Health or pedometer data',
  'live and completed route maps render locally from Paradise GPS points without automatic third-party street-tile requests',
  'this additive dashboard never changes municipality Lookup authority, KPI/pay rules, or native background-GPS boundaries',
]);
