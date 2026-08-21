import { createClient } from '@supabase/supabase-js';
import { isUuid } from '../shared/performance-events.mjs';
import {
  appointmentCountForShift,
  buildRatePaceSummary,
  calculateNeutralWebKpis,
  formatKpiPace,
  formatKpiRate,
  formatPaceStatus,
} from './performance-web-kpis.mjs';
import { mergeKnockClockEvents, KNOCK_EVENT_TYPES } from './performance-web-knock-clock.mjs';

export const PERFORMANCE_WEB_NEUTRAL_KPI_UI_VERSION = '2026.08.21-web-neutral-kpi-ui-v4';

const SUPABASE_URL = 'https://taxlrlfsobtnbasjcnuf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_3e755MdDisPBQzzGrBVBIA_gy4uqNqr';
const DEVICE_ID_KEY = 'paradise-performance-web-device-id-v1';
const COUNT_DRAFT_PREFIX = 'paradise-performance-web-counts-v1:';
const APPOINTMENT_QUEUE_KEY = 'paradise-performance-web-appointments-offline-v1';
const KNOCK_QUEUE_KEY = 'paradise-performance-web-knock-clock-offline-v1';
const CARD_ID = 'performanceWebNeutralKpis';
const ACTIVE_STATUSES = ['active', 'paused', 'finishing'];
const STANDARD_CACHE_MS = 60_000;

const runtime = {
  supabase: null,
  employeeId: null,
  employeeProfile: null,
  standards: null,
  standardsFetchedAt: 0,
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

  const { data: profile, error: profileError } = await runtime.supabase
    .from('performance_employees')
    .select('id,role,office,team')
    .eq('id', employeeId)
    .maybeSingle();
  runtime.employeeProfile = profileError || !profile ? null : profile;
  return employeeId;
}

async function fetchShift(mode) {
  let query = runtime.supabase
    .from('performance_shifts')
    .select('id,employee_id,status,started_at,finished_at,doors,conversations,break_seconds,kpi_standard_version_label')
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

async function fetchKnockEvents(shiftId) {
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

async function fetchPaceStandards() {
  if (Date.now() - runtime.standardsFetchedAt < STANDARD_CACHE_MS) return runtime.standards;
  runtime.standardsFetchedAt = Date.now();
  const { data, error } = await runtime.supabase
    .from('performance_kpi_standard_versions')
    .select('version_label,applies_to_role,applies_to_office,applies_to_team,effective_from,effective_to,metric_key,minimum');
  runtime.standards = error ? null : (data ?? []);
  return runtime.standards;
}

function countDraft(shiftId) {
  if (!isUuid(shiftId)) return null;
  return readJson(`${COUNT_DRAFT_PREFIX}${shiftId}`, null);
}

function pendingAppointmentWrites() {
  const rows = readJson(APPOINTMENT_QUEUE_KEY, []);
  return Array.isArray(rows) ? rows : [];
}

function pendingKnockWrites() {
  const rows = readJson(KNOCK_QUEUE_KEY, []);
  return Array.isArray(rows) ? rows : [];
}

function metric(label, value, detail = '') {
  return `<div class="performance-kpi-metric"><span>${esc(label)}</span><strong>${esc(value)}</strong>${detail ? `<small>${esc(detail)}</small>` : ''}</div>`;
}

function paceDetail(result) {
  if (Number.isFinite(result?.minimum)) {
    const version = result?.versionLabel ? ` · ${result.versionLabel}` : '';
    return `approved minimum ${formatKpiPace(result.minimum)} / knock hr${version}`;
  }
  if (result?.status === 'GOAL_NOT_CONFIGURED') {
    return result?.versionLabel ? `no approved minimum in ${result.versionLabel}` : 'no approved effective minimum';
  }
  if (result?.status === 'GOAL_CONFIGURATION_AMBIGUOUS') return 'multiple applicable standards; no classification';
  if (result?.status === 'PINNED_STANDARD_REQUIRED') return 'completed shift has no pinned KPI version; no historical reclassification';
  if (result?.status === 'PINNED_STANDARD_NOT_FOUND') return `pinned KPI version ${result?.versionLabel ?? 'unknown'} is unavailable`;
  if (result?.status === 'NO_MEASURED_RATE_YET') return 'start Knock Clock to establish a rate';
  return 'approved goal context unavailable';
}

function cardMarkup(mode, kpis, appointmentMeta, knockMeta, paceSummary) {
  const heading = mode === 'ACTIVE' ? 'LIVE KPI SNAPSHOT' : mode === 'COMPLETE' ? 'DAY COMPLETE KPI SNAPSHOT' : 'LAST COMPLETED DAY KPI SNAPSHOT';
  const finalMode = mode !== 'ACTIVE';
  const pendingAppointments = appointmentMeta.pendingSyncCount > 0
    ? `<p class="performance-kpi-sync-note">Includes ${appointmentMeta.pendingSyncCount} appointment${appointmentMeta.pendingSyncCount === 1 ? '' : 's'} pending browser sync.</p>`
    : '';
  const pendingKnock = knockMeta.pendingSyncCount > 0
    ? `<p class="performance-kpi-sync-note">Includes ${knockMeta.pendingSyncCount} Knock Clock event${knockMeta.pendingSyncCount === 1 ? '' : 's'} pending browser sync.</p>`
    : '';
  return `<section id="${CARD_ID}" class="performance-kpi-card" data-mode="${mode.toLowerCase()}">
    <div class="performance-kpi-head">
      <div><span>${heading}</span><strong>Measured performance</strong></div>
      <b>${kpis.appointments} appt${kpis.appointments === 1 ? '' : 's'}</b>
    </div>
    <div class="performance-kpi-grid" aria-label="Measured KPI snapshot">
      ${metric('DOORS / KNOCK HR', formatKpiPace(kpis.doorsPerHour), `${kpis.doors} doors`)}
      ${metric('CONVERSATIONS / KNOCK HR', formatKpiPace(kpis.conversationsPerHour), `${kpis.conversations} conversations`)}
      ${metric('APPOINTMENTS / KNOCK HR', formatKpiPace(kpis.appointmentsPerHour), `${kpis.appointments} appointments`)}
      ${metric('CONVERSATION RATE', formatKpiRate(kpis.conversationRate), 'conversations ÷ doors')}
      ${metric('APPOINTMENT RATE', formatKpiRate(kpis.appointmentRate), 'appointments ÷ conversations')}
      ${metric('APPOINTMENTS', String(kpis.appointments), 'captured this shift')}
      ${metric(finalMode ? 'DOORS GOAL' : 'DOORS PACE', formatPaceStatus(paceSummary.doors.status), paceDetail(paceSummary.doors))}
      ${metric(finalMode ? 'APPOINTMENT GOAL' : 'APPOINTMENT PACE', formatPaceStatus(paceSummary.appointments.status), paceDetail(paceSummary.appointments))}
    </div>
    ${pendingAppointments}
    ${pendingKnock}
    <p class="performance-kpi-boundary">Measured KPIs use explicit Knock Clock time. Live pace compares only to one unambiguous approved minimum. A shift-pinned KPI version is authoritative when present, and completed shifts without one are not reclassified from later standards. No tolerance band, overall pace score, grade, rank, bonus, commission, or pay rule is inferred.</p>
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
    const [serverSets, serverKnockEvents, standards] = await Promise.all([
      fetchServerSets(shift.id),
      fetchKnockEvents(shift.id),
      fetchPaceStandards(),
    ]);
    const appointmentMeta = appointmentCountForShift({
      serverRows: serverSets,
      pendingWrites: pendingAppointmentWrites(),
      shiftId: shift.id,
    });
    const knockMeta = mergeKnockClockEvents({
      serverRows: serverKnockEvents,
      pendingWrites: pendingKnockWrites(),
      shiftId: shift.id,
    });
    const kpis = calculateNeutralWebKpis({
      shift,
      appointmentCount: appointmentMeta.count,
      countDraft: countDraft(shift.id),
      knockEvents: knockMeta.events,
      now: Date.now(),
    });
    const paceSummary = buildRatePaceSummary({
      kpis,
      standards: runtime.employeeProfile ? standards : null,
      employee: runtime.employeeProfile ?? {},
      shift,
      mode: surface.mode,
    });
    mount(surface, cardMarkup(surface.mode, kpis, appointmentMeta, knockMeta, paceSummary));
  } catch {
    // This card is additive, read-only context. Core shift/GPS/appointment/Knock Clock controls remain usable on KPI read failure.
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
    if (target?.closest('#nPerf,[data-performance-web-action],[data-performance-count],[data-performance-appointment-action],[data-performance-knock-action]')) scheduleRefresh(750);
    if (target?.closest('#nLook,#nTrain,#nRel,#nHist')) scheduleRefresh(100);
  }, true);
  window.addEventListener('online', () => {
    runtime.standardsFetchedAt = 0;
    scheduleRefresh(500);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') scheduleRefresh(250);
  });
  window.setInterval(() => { void refresh(); }, 2500);
  scheduleRefresh(700);
}

void boot();

export const ParadisePerformanceWebNeutralKpiUiInvariants = Object.freeze([
  'the KPI card is read-only and cannot change a shift, appointment, KPI standard, leaderboard, or compensation record',
  'active, Day Complete, and Last Completed Day reuse the same neutral KPI formulas',
  'per-hour activity uses explicit productive Knock Clock events and never silently substitutes total Day Clock duration',
  'pace reads standards only and never creates, updates, deletes, or invents a target value',
  'pace uses the exact configured minimum as the binary boundary with no hidden tolerance; multiple applicable standards fail closed',
  'a shift-pinned KPI version controls that shift historical goal classification; completed unpinned shifts fail closed',
  'active shifts use ON PACE or OFF PACE while completed surfaces use final goal language rather than a live projection claim',
  'pending offline appointment and Knock Clock writes may be included in live descriptive measurements and are explicitly disclosed as pending sync',
  'the helper disables a second refresh-token loop and reuses the same-origin trusted browser session only for RLS-protected reads',
  'KPI rendering failure never disables the core shift, GPS, count, appointment, or Knock Clock controls',
]);
