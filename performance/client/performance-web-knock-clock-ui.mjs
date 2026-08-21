import { createClient } from '@supabase/supabase-js';
import {
  buildEventEnvelope,
  createClientEventId,
  isUuid,
} from '../shared/performance-events.mjs';
import {
  createJsonStorageQueueStore,
  createQueuedWrite,
  PerformanceSyncQueue,
} from './performance-sync.mjs';
import { createSupabaseOperationalSyncTransport } from './performance-operational-sync.mjs';
import {
  deriveKnockClock,
  formatKnockDuration,
  KNOCK_EVENT_TYPES,
  mergeKnockClockEvents,
} from './performance-web-knock-clock.mjs';

export const PERFORMANCE_WEB_KNOCK_CLOCK_UI_VERSION = '2026.08.21-web-knock-clock-ui-v2';

const SUPABASE_URL = 'https://taxlrlfsobtnbasjcnuf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_3e755MdDisPBQzzGrBVBIA_gy4uqNqr';
const DEVICE_ID_KEY = 'paradise-performance-web-device-id-v1';
const QUEUE_KEY = 'paradise-performance-web-knock-clock-offline-v1';
const CARD_ID = 'performanceWebKnockClock';
const ACTIVE_STATUSES = ['active', 'paused', 'finishing'];

const runtime = {
  supabase: null,
  queue: null,
  employeeId: null,
  deviceId: null,
  refreshing: false,
  scheduled: null,
  current: null,
};

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function readJson(key, fallback = null) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function currentSurface() {
  const active = document.querySelector('[data-performance-web-state="active"]');
  if (active) return { mode: 'ACTIVE', host: active };
  const complete = document.querySelector('[data-performance-web-state="complete"]');
  if (complete) return { mode: 'COMPLETE', host: complete };
  const last = document.getElementById('performanceWebLastCompleted');
  if (last) return { mode: 'LAST', host: last };
  return null;
}

async function trustedContext() {
  const deviceId = window.localStorage.getItem(DEVICE_ID_KEY);
  if (!isUuid(deviceId)) return null;
  const { data: sessionData } = await runtime.supabase.auth.getSession();
  if (!sessionData?.session) return null;
  const { data: employeeId, error } = await runtime.supabase.rpc('performance_current_employee_id');
  if (error || !isUuid(employeeId)) return null;
  runtime.employeeId = employeeId;
  runtime.deviceId = deviceId;
  return { employeeId, deviceId };
}

async function fetchShift(mode) {
  let query = runtime.supabase
    .from('performance_shifts')
    .select('id,employee_id,status,started_at,finished_at')
    .eq('employee_id', runtime.employeeId);
  if (mode === 'ACTIVE') query = query.in('status', ACTIVE_STATUSES).order('started_at', { ascending: false });
  else query = query.eq('status', 'finished').not('finished_at', 'is', null).order('finished_at', { ascending: false });
  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw error;
  return data ?? null;
}

async function fetchServerEvents(shiftId) {
  const { data, error } = await runtime.supabase
    .from('performance_events')
    .select('client_event_id,shift_id,event_type,captured_at')
    .eq('employee_id', runtime.employeeId)
    .eq('shift_id', shiftId)
    .in('event_type', KNOCK_EVENT_TYPES)
    .order('captured_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

function pendingWrites() {
  const rows = readJson(QUEUE_KEY, []);
  return Array.isArray(rows) ? rows : [];
}

async function clockForShift(shift, now = Date.now()) {
  const serverRows = await fetchServerEvents(shift.id);
  const merged = mergeKnockClockEvents({
    serverRows,
    pendingWrites: pendingWrites(),
    shiftId: shift.id,
  });
  return Object.freeze({
    merged,
    clock: deriveKnockClock({ shift, events: merged.events, now }),
  });
}

function cardMarkup(surfaceMode, shift, clock, merged) {
  const activeSurface = surfaceMode === 'ACTIVE' && ACTIVE_STATUSES.includes(String(shift.status ?? '').toLowerCase());
  const stateLabel = clock.active ? 'KNOCKING' : activeSurface ? 'NOT KNOCKING' : 'COMPLETED';
  const action = clock.active ? 'stop' : 'start';
  const actionLabel = clock.active ? 'STOP KNOCKING' : 'START KNOCKING';
  const button = activeSurface
    ? `<button class="btn ${clock.active ? 'secondary' : 'primary'} performance-knock-clock-action" data-performance-knock-action="${action}" type="button">${actionLabel}</button>`
    : '';
  const pending = merged.pendingSyncCount > 0
    ? `<p class="performance-knock-sync-note">${merged.pendingSyncCount} Knock Clock event${merged.pendingSyncCount === 1 ? '' : 's'} pending browser sync.</p>`
    : '';
  const rejected = merged.rejectedCount > 0
    ? `<p class="performance-warning" role="status">A Knock Clock event could not sync. Do not rely on its timing until the record is reviewed.</p>`
    : '';
  return `<section id="${CARD_ID}" class="performance-knock-clock-card" data-knock-state="${clock.active ? 'active' : 'inactive'}">
    <div class="performance-knock-clock-head">
      <div><span>KNOCK CLOCK</span><strong>${esc(stateLabel)}</strong></div>
      <b data-performance-knock-duration>${esc(formatKnockDuration(clock.totalSeconds))}</b>
    </div>
    <p>Productive canvassing time is explicit. Day duration remains separate; GPS does not silently start or stop this clock.</p>
    ${button}
    ${pending}
    ${rejected}
  </section>`;
}

function mount(surface, markup) {
  document.getElementById(CARD_ID)?.remove();
  if (!surface?.host) return;
  const metrics = surface.host.querySelector('.performance-web-metrics');
  if (metrics) metrics.insertAdjacentHTML('afterend', markup);
  else surface.host.insertAdjacentHTML('afterbegin', markup);
}

function buildWrite(type, shift, capturedAt = new Date().toISOString()) {
  if (!runtime.employeeId || !runtime.deviceId) throw new Error('Trusted employee/device context is unavailable');
  const envelope = buildEventEnvelope({
    clientEventId: createClientEventId(),
    employeeId: runtime.employeeId,
    deviceId: runtime.deviceId,
    shiftId: shift.id,
    type,
    capturedAt,
    payload: { source: 'web-interim', clock: 'productive-knock' },
  });
  return createQueuedWrite({
    id: envelope.clientEventId,
    kind: 'EVENT',
    capturedAt: envelope.capturedAt,
    payload: {
      schemaVersion: envelope.schemaVersion,
      employeeId: envelope.employeeId,
      deviceId: envelope.deviceId,
      shiftId: envelope.shiftId,
      type: envelope.type,
      payload: envelope.payload,
    },
  });
}

async function recordKnockEvent(type, shift, { flush = true } = {}) {
  const write = buildWrite(type, shift);
  await runtime.queue.enqueue(write);
  if (flush) await runtime.queue.flush().catch(() => undefined);
  if (runtime.current?.shift?.id === shift.id) {
    runtime.current = {
      ...runtime.current,
      clock: { ...runtime.current.clock, active: type === 'KNOCK_STARTED' },
    };
  }
  return write;
}

function queueStopForFinishSynchronously() {
  const current = runtime.current;
  if (!current?.clock?.active || !isUuid(current?.shift?.id) || !runtime.employeeId || !runtime.deviceId) return false;
  try {
    const capturedAt = new Date().toISOString();
    const write = buildWrite('KNOCK_STOPPED', current.shift, capturedAt);
    const rows = pendingWrites();
    if (!rows.some(row => row?.id === write.id)) {
      rows.push({
        ...write,
        payload: { ...write.payload },
        state: 'PENDING',
        attempts: 0,
        nextAttemptAt: null,
        lastError: null,
        enqueuedAt: capturedAt,
      });
      window.localStorage.setItem(QUEUE_KEY, JSON.stringify(rows));
    }
    runtime.current = { ...current, clock: { ...current.clock, active: false } };
    void runtime.queue.flush().catch(() => undefined);
    return true;
  } catch {
    return false;
  }
}

async function refresh() {
  if (runtime.refreshing) return;
  const surface = currentSurface();
  if (!surface) {
    document.getElementById(CARD_ID)?.remove();
    runtime.current = null;
    return;
  }
  runtime.refreshing = true;
  try {
    if (!runtime.employeeId && !await trustedContext()) return;
    const shift = await fetchShift(surface.mode === 'ACTIVE' ? 'ACTIVE' : 'FINISHED');
    if (!shift || !isUuid(shift.id)) {
      document.getElementById(CARD_ID)?.remove();
      runtime.current = null;
      return;
    }
    const result = await clockForShift(shift, Date.now());
    runtime.current = { shift, clock: result.clock, merged: result.merged, mode: surface.mode };
    mount(surface, cardMarkup(surface.mode, shift, result.clock, result.merged));

    document.querySelector('[data-performance-knock-action]')?.addEventListener('click', async event => {
      const button = event.currentTarget;
      button.disabled = true;
      const action = button.dataset.performanceKnockAction;
      try {
        const latest = await clockForShift(shift, Date.now());
        if (action === 'start' && !latest.clock.active) await recordKnockEvent('KNOCK_STARTED', shift);
        if (action === 'stop' && latest.clock.active) await recordKnockEvent('KNOCK_STOPPED', shift);
      } finally {
        scheduleRefresh(50);
      }
    }, { once: true });
  } catch {
    // Knock Clock is additive field evidence. Core shift/GPS/count/appointment controls remain available on read failure.
  } finally {
    runtime.refreshing = false;
  }
}

function scheduleRefresh(delay = 150) {
  window.clearTimeout(runtime.scheduled);
  runtime.scheduled = window.setTimeout(() => { void refresh(); }, delay);
}

async function boot() {
  runtime.supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: window.localStorage,
    },
  });
  runtime.queue = new PerformanceSyncQueue({
    store: createJsonStorageQueueStore(window.localStorage, QUEUE_KEY),
    transport: createSupabaseOperationalSyncTransport(runtime.supabase),
  });

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('[data-performance-web-action="finish"]')) queueStopForFinishSynchronously();
    if (target?.closest('#nPerf,[data-performance-web-action],[data-performance-knock-action]')) scheduleRefresh(500);
    if (target?.closest('#nLook,#nTrain,#nRel,#nHist')) scheduleRefresh(100);
  }, true);
  window.addEventListener('online', () => {
    void runtime.queue.releaseAuthBlocked().then(() => runtime.queue.flush()).catch(() => undefined);
    scheduleRefresh(300);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') scheduleRefresh(200);
  });
  window.setInterval(() => { void refresh(); }, 1000);
  scheduleRefresh(500);
}

void boot();

export const ParadisePerformanceWebKnockClockUiInvariants = Object.freeze([
  'Start My Day never automatically starts productive Knock Clock time',
  'the user explicitly starts and stops productive canvassing time',
  'Knock Clock events reuse authenticated RLS-protected performance_events and stable retry IDs',
  'offline Knock Clock events keep their original captured timestamp and replay idempotently',
  'Finish Day synchronously queues a best-effort stop before the core finish click runs and never depends on network success',
  'a finished shift closes any still-open productive interval at the authoritative finish timestamp',
  'GPS never silently determines productive Knock Clock state',
  'no KPI threshold, pace classification, leaderboard, compensation, or pay rule is introduced by this helper',
]);
