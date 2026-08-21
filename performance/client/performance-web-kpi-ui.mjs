import { createClient } from '@supabase/supabase-js';
import { isUuid } from '../shared/performance-events.mjs';
import {
  appointmentCountForShift,
  calculateNeutralWebKpis,
  formatKpiPace,
  formatKpiRate,
} from './performance-web-kpis.mjs';

export const PERFORMANCE_WEB_NEUTRAL_KPI_UI_VERSION = '2026.08.21-web-neutral-kpi-ui-v1';

const SUPABASE_URL = 'https://taxlrlfsobtnbasjcnuf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_3e755MdDisPBQzzGrBVBIA_gy4uqNqr';
const DEVICE_ID_KEY = 'paradise-performance-web-device-id-v1';
const COUNT_DRAFT_PREFIX = 'paradise-performance-web-counts-v1:';
const APPOINTMENT_QUEUE_KEY = 'paradise-performance-web-appointments-offline-v1';
const CARD_ID = 'performanceWebNeutralKpis';
const ACTIVE_STATUSES = ['active', 'paused', 'finishing'];

const runtime = {
  supabase: null,
  employeeId: null,
  refreshing: false,
  scheduled: null,
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

async function trustedEmployeeId() {
  const deviceId = window.localStorage.getItem(DEVICE_ID_KEY);
  if (!isUuid(deviceId)) return null;
  const { data: sessionData } = await runtime.supabase.auth.getSession();
  if (!sessionData?.session) return null;
  const { data: employeeId, error } = await runtime.supabase.rpc('performance_current_employee_id');
  if (error || !isUuid(employeeId)) return null;
  runtime.employeeId = employeeId;
  return employeeId;
}

async function fetchShift(mode) {
  let query = runtime.supabase
    .from('performance_shifts')
    .select('id,employee_id,status,started_at,finished_at,doors,conversations,break_seconds')
    .eq('employee_id', runtime.employeeId);
  if (mode === 'ACTIVE') query = query.in('status', ACTIVE_STATUSES).order('started_at', { ascending: false });
  else query = query.eq('status', 'finished').not('finished_at', 'is', null).order('finished_at', { ascending: false });
  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw error;
  return data ?? null;
}

async function fetchServerSets(shiftId) {
  const { data, error } = await runtime.supabase
    .from('performance_sets')
    .select('id,client_set_id,origin_shift_id,status')
    .eq('employee_id', runtime.employeeId)
    .eq('origin_shift_id', shiftId);
  if (error) throw error;
  return data ?? [];
}

function countDraft(shiftId) {
  if (!isUuid(shiftId)) return null;
  return readJson(`${COUNT_DRAFT_PREFIX}${shiftId}`, null);
}

function pendingAppointmentWrites() {
  const rows = readJson(APPOINTMENT_QUEUE_KEY, []);
  return Array.isArray(rows) ? rows : [];
}

function metric(label, value, detail = '') {
  return `<div class="performance-kpi-metric"><span>${esc(label)}</span><strong>${esc(value)}</strong>${detail ? `<small>${esc(detail)}</small>` : ''}</div>`;
}

function cardMarkup(mode, kpis, appointmentMeta) {
  const heading = mode === 'ACTIVE' ? 'LIVE KPI SNAPSHOT' : mode === 'COMPLETE' ? 'DAY COMPLETE KPI SNAPSHOT' : 'LAST COMPLETED DAY KPI SNAPSHOT';
  const pending = appointmentMeta.pendingSyncCount > 0
    ? `<p class="performance-kpi-sync-note">Includes ${appointmentMeta.pendingSyncCount} appointment${appointmentMeta.pendingSyncCount === 1 ? '' : 's'} pending browser sync.</p>`
    : '';
  return `<section id="${CARD_ID}" class="performance-kpi-card" data-mode="${mode.toLowerCase()}">
    <div class="performance-kpi-head">
      <div><span>${heading}</span><strong>Measured performance</strong></div>
      <b>${kpis.appointments} appt${kpis.appointments === 1 ? '' : 's'}</b>
    </div>
    <div class="performance-kpi-grid" aria-label="Measured KPI snapshot">
      ${metric('DOORS / HR', formatKpiPace(kpis.doorsPerHour), `${kpis.doors} doors`)}
      ${metric('CONVERSATIONS / HR', formatKpiPace(kpis.conversationsPerHour), `${kpis.conversations} conversations`)}
      ${metric('APPOINTMENTS / HR', formatKpiPace(kpis.appointmentsPerHour), `${kpis.appointments} appointments`)}
      ${metric('CONVERSATION RATE', formatKpiRate(kpis.conversationRate), 'conversations ÷ doors')}
      ${metric('APPOINTMENT RATE', formatKpiRate(kpis.appointmentRate), 'appointments ÷ conversations')}
      ${metric('APPOINTMENTS', String(kpis.appointments), 'captured this shift')}
    </div>
    ${pending}
    <p class="performance-kpi-boundary">Measured only. No Paradise standard, grade, rank, bonus, commission, or pay rule is applied.</p>
  </section>`;
}

function mount(surface, markup) {
  document.getElementById(CARD_ID)?.remove();
  if (!surface?.host) return;
  const appointmentPanel = surface.host.querySelector('#performanceWebAppointments');
  if (appointmentPanel) {
    appointmentPanel.insertAdjacentHTML('afterend', markup);
    return;
  }
  const counters = surface.host.querySelector('.performance-web-counters');
  if (counters) {
    counters.insertAdjacentHTML('afterend', markup);
    return;
  }
  const metrics = surface.host.querySelector('.performance-web-metrics');
  if (metrics) metrics.insertAdjacentHTML('afterend', markup);
  else surface.host.insertAdjacentHTML('beforeend', markup);
}

async function refresh() {
  if (runtime.refreshing) return;
  const surface = currentSurface();
  if (!surface) {
    document.getElementById(CARD_ID)?.remove();
    return;
  }
  runtime.refreshing = true;
  try {
    if (!runtime.employeeId && !await trustedEmployeeId()) return;
    const shift = await fetchShift(surface.mode === 'ACTIVE' ? 'ACTIVE' : 'FINISHED');
    if (!shift || !isUuid(shift.id)) {
      document.getElementById(CARD_ID)?.remove();
      return;
    }
    const serverSets = await fetchServerSets(shift.id);
    const appointmentMeta = appointmentCountForShift({
      serverRows: serverSets,
      pendingWrites: pendingAppointmentWrites(),
      shiftId: shift.id,
    });
    const kpis = calculateNeutralWebKpis({
      shift,
      appointmentCount: appointmentMeta.count,
      countDraft: countDraft(shift.id),
      now: Date.now(),
    });
    mount(surface, cardMarkup(surface.mode, kpis, appointmentMeta));
  } catch {
    // This card is additive, read-only context. Core shift/GPS/appointment controls remain usable on KPI read failure.
  } finally {
    runtime.refreshing = false;
  }
}

function scheduleRefresh(delay = 200) {
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

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('#nPerf,[data-performance-web-action],[data-performance-count],[data-performance-appointment-action]')) scheduleRefresh(750);
    if (target?.closest('#nLook,#nTrain,#nRel,#nHist')) scheduleRefresh(100);
  }, true);
  window.addEventListener('online', () => scheduleRefresh(500));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') scheduleRefresh(250);
  });
  window.setInterval(() => { void refresh(); }, 2500);
  scheduleRefresh(700);
}

void boot();

export const ParadisePerformanceWebNeutralKpiUiInvariants = Object.freeze([
  'the neutral KPI card is read-only and cannot change a shift, appointment, KPI standard, leaderboard, or compensation record',
  'active, Day Complete, and Last Completed Day reuse the same neutral KPI formulas',
  'pending offline appointment writes may be included in live descriptive counts and are explicitly disclosed as pending sync',
  'the helper disables a second refresh-token loop and reuses the same-origin trusted browser session only for RLS-protected reads',
  'KPI rendering failure never disables the core shift, GPS, count, or appointment controls',
]);
