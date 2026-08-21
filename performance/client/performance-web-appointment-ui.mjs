import { createClient } from '@supabase/supabase-js';
import { createPerformanceSupabaseOptions } from './performance-session.mjs';
import {
  createJsonStorageQueueStore,
  createQueuedWrite,
  createSupabaseSyncTransport,
  PerformanceSyncQueue,
} from './performance-sync.mjs';
import { isUuid } from '../shared/performance-events.mjs';
import {
  WEB_APPOINTMENT_PIN_MAX_ACCURACY_METERS,
  buildAppointmentSetPayload,
  formatAppointmentAt,
  mergeAppointments,
  renderPinnedRouteTrace,
} from './performance-web-appointments.mjs';

export const PERFORMANCE_WEB_APPOINTMENT_UI_VERSION = '2026.08.21-web-appointment-ui-v1';

const SUPABASE_URL = 'https://taxlrlfsobtnbasjcnuf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_3e755MdDisPBQzzGrBVBIA_gy4uqNqr';
const DEVICE_ID_KEY = 'paradise-performance-web-device-id-v1';
const CORE_QUEUE_KEY = 'paradise-performance-web-offline-v1';
const APPOINTMENT_QUEUE_KEY = 'paradise-performance-web-appointments-offline-v1';
const ACTIVE_STATUSES = ['active', 'paused', 'finishing'];
const PANEL_ID = 'performanceWebAppointments';
const MAP_ATTR = 'data-performance-appointment-map';

const runtime = {
  supabase: null,
  queue: null,
  employeeId: null,
  deviceId: null,
  shift: null,
  appointments: [],
  routePoints: [],
  formOpen: false,
  saving: false,
  warning: null,
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

function safeMessage(error) {
  return String(error?.message || error || 'Unknown error').slice(0, 220);
}

function readJsonStorage(key) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
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
  if (!isUuid(deviceId)) return false;
  const { data: sessionData } = await runtime.supabase.auth.getSession();
  if (!sessionData?.session) return false;
  const { data: employeeId, error } = await runtime.supabase.rpc('performance_current_employee_id');
  if (error || !isUuid(employeeId)) return false;
  const { data: device, error: deviceError } = await runtime.supabase
    .from('performance_devices')
    .select('id,employee_id,revoked_at,platform')
    .eq('id', deviceId)
    .eq('employee_id', employeeId)
    .maybeSingle();
  if (deviceError || !device || device.revoked_at != null || device.platform !== 'web-test') return false;
  runtime.employeeId = employeeId;
  runtime.deviceId = deviceId;
  return true;
}

async function fetchShift(mode) {
  let query = runtime.supabase
    .from('performance_shifts')
    .select('id,employee_id,device_id,status,started_at,finished_at')
    .eq('employee_id', runtime.employeeId);
  if (mode === 'ACTIVE') query = query.in('status', ACTIVE_STATUSES).order('started_at', { ascending: false });
  else query = query.eq('status', 'finished').not('finished_at', 'is', null).order('finished_at', { ascending: false });
  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw error;
  return data ?? null;
}

async function fetchServerAppointments(shiftId) {
  const { data, error } = await runtime.supabase
    .from('performance_sets')
    .select('id,client_set_id,origin_shift_id,customer_name,customer_phone,confirmed_customer_address,product,appointment_at,set_captured_at,set_latitude,set_longitude,set_accuracy_meters,quick_set,status')
    .eq('employee_id', runtime.employeeId)
    .eq('origin_shift_id', shiftId)
    .neq('status', 'void')
    .order('appointment_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function fetchServerRoute(shiftId) {
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

function pendingCoreRoute(shiftId) {
  return readJsonStorage(CORE_QUEUE_KEY)
    .filter(row => row?.kind === 'LOCATION' && row?.payload?.shiftId === shiftId)
    .map(row => ({
      clientPointId: row.id,
      capturedAt: row.capturedAt,
      latitude: row.payload?.latitude,
      longitude: row.payload?.longitude,
      accuracyMeters: row.payload?.accuracyMeters,
      precise: row.payload?.precise,
      mocked: row.payload?.mocked,
      source: row.payload?.source,
    }));
}

function mergeRoutePoints(serverRows, pendingRows) {
  const rows = new Map();
  for (const row of [...serverRows, ...pendingRows]) {
    const id = String(row?.client_point_id ?? row?.clientPointId ?? '');
    if (id) rows.set(id, row);
  }
  return Array.from(rows.values());
}

async function locationFix() {
  if (!navigator.geolocation) return null;
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      position => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracyMeters: position.coords.accuracy,
      }),
      () => resolve(null),
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 15000 },
    );
  });
}

function formMarkup() {
  if (!runtime.formOpen) return '';
  return `<form id="performanceWebAppointmentForm" class="performance-appointment-form" autocomplete="off">
    <div class="performance-appointment-form-head"><b>New appointment</b><button type="button" data-performance-appointment-action="cancel">CANCEL</button></div>
    <label>Customer name<input class="input" name="customerName" type="text" required maxlength="120"></label>
    <label>Phone<input class="input" name="customerPhone" type="tel" inputmode="tel" maxlength="40"></label>
    <div class="performance-appointment-form-grid">
      <label>Appointment date<input class="input" name="appointmentDate" type="date" required></label>
      <label>Appointment time<input class="input" name="appointmentTime" type="time" required></label>
    </div>
    <label>Product<input class="input" name="product" type="text" maxlength="120" placeholder="Optional"></label>
    <label>Customer address<input class="input" name="confirmedCustomerAddress" type="text" maxlength="240" placeholder="Optional — separate from GPS pin"></label>
    <p class="performance-appointment-form-note">Saving captures the current browser GPS position when available. The GPS pin records where the appointment was set; it does not replace the customer address.</p>
    <button class="btn primary" type="submit" ${runtime.saving ? 'disabled' : ''}>${runtime.saving ? 'CAPTURING GPS…' : 'SAVE APPOINTMENT'}</button>
  </form>`;
}

function appointmentListMarkup(appointments) {
  if (!appointments.length) return '<p class="performance-appointment-empty">No appointments entered on this shift yet.</p>';
  return `<div class="performance-appointment-list">${appointments.map((appointment, index) => {
    const pin = appointment.latitude != null && appointment.longitude != null && Number(appointment.accuracyMeters) <= WEB_APPOINTMENT_PIN_MAX_ACCURACY_METERS;
    const sync = appointment.syncState === 'PENDING' ? ' · Pending sync' : appointment.syncState === 'NEEDS_ATTENTION' ? ' · Needs attention' : '';
    return `<details data-performance-appointment-details="${esc(appointment.clientSetId)}">
      <summary><b>${index + 1}. ${esc(appointment.customerName)}</b><span>${esc(formatAppointmentAt(appointment.appointmentAt))}${sync}</span></summary>
      <div class="performance-appointment-detail">
        ${appointment.product ? `<p><span>Product</span><b>${esc(appointment.product)}</b></p>` : ''}
        ${appointment.confirmedCustomerAddress ? `<p><span>Customer address</span><b>${esc(appointment.confirmedCustomerAddress)}</b></p>` : ''}
        ${appointment.customerPhone ? `<p><span>Phone</span><b>${esc(appointment.customerPhone)}</b></p>` : ''}
        <p><span>Map pin</span><b>${pin ? `Captured · ${Math.round(Number(appointment.accuracyMeters))} m accuracy` : 'Location unavailable or too coarse'}</b></p>
      </div>
    </details>`;
  }).join('')}</div>`;
}

function panelMarkup(mode) {
  const editable = mode === 'ACTIVE';
  const heading = mode === 'ACTIVE' ? 'APPOINTMENTS' : mode === 'COMPLETE' ? 'APPOINTMENTS — DAY COMPLETE' : 'APPOINTMENTS — LAST COMPLETED DAY';
  return `<section id="${PANEL_ID}" class="performance-appointments-panel" data-mode="${mode.toLowerCase()}">
    <div class="performance-appointments-head"><div><span>${heading}</span><strong>${runtime.appointments.length}</strong></div>${editable ? '<button type="button" class="btn primary" data-performance-appointment-action="new">+ APPOINTMENT</button>' : ''}</div>
    ${editable ? formMarkup() : ''}
    ${runtime.warning ? `<p class="performance-appointment-warning" role="status">${esc(runtime.warning)}</p>` : ''}
    ${appointmentListMarkup(runtime.appointments)}
  </section>`;
}

function mountPanel(surface) {
  document.getElementById(PANEL_ID)?.remove();
  const insertion = surface.host.querySelector('.performance-web-counters') || surface.host.querySelector('.performance-web-metrics') || surface.host.querySelector('h3');
  if (insertion) insertion.insertAdjacentHTML('afterend', panelMarkup(surface.mode));
}

function mountCombinedMap(surface) {
  const routeCard = surface.host.querySelector('.performance-web-route-card');
  if (!routeCard) return;
  routeCard.classList.add('performance-appointment-map-active');
  routeCard.querySelector(`[${MAP_ATTR}]`)?.remove();
  const routeSource = routeCard.querySelector('[data-performance-route]') || routeCard.querySelector('.performance-route-svg');
  const html = `<div ${MAP_ATTR} class="performance-appointment-combined-map">
    <div class="performance-appointment-map-caption"><b>ROUTE + APPOINTMENT PINS</b><span>${runtime.appointments.filter(row => row.latitude != null && row.longitude != null && Number(row.accuracyMeters) <= WEB_APPOINTMENT_PIN_MAX_ACCURACY_METERS).length} pinned</span></div>
    ${renderPinnedRouteTrace(runtime.routePoints, runtime.appointments)}
  </div>`;
  if (routeSource) routeSource.insertAdjacentHTML('afterend', html);
  else routeCard.insertAdjacentHTML('beforeend', html);
}

async function refresh({ force = false } = {}) {
  if (runtime.refreshing || (runtime.formOpen && !force)) return;
  const surface = currentSurface();
  if (!surface) {
    document.getElementById(PANEL_ID)?.remove();
    return;
  }
  runtime.refreshing = true;
  try {
    if ((!runtime.employeeId || !runtime.deviceId) && !await trustedContext()) return;
    const shift = await fetchShift(surface.mode === 'ACTIVE' ? 'ACTIVE' : 'FINISHED');
    if (!shift || !isUuid(shift.id)) return;
    runtime.shift = shift;
    const [serverAppointments, serverRoute, appointmentQueueRows] = await Promise.all([
      fetchServerAppointments(shift.id),
      fetchServerRoute(shift.id),
      runtime.queue.store.list(),
    ]);
    const pendingAppointments = appointmentQueueRows.filter(row => row?.kind === 'SET' && row?.payload?.originShiftId === shift.id);
    runtime.appointments = mergeAppointments(serverAppointments, pendingAppointments);
    runtime.routePoints = mergeRoutePoints(serverRoute, pendingCoreRoute(shift.id));
    mountPanel(surface);
    mountCombinedMap(surface);
  } catch (error) {
    runtime.warning = `Appointments need attention: ${safeMessage(error)}`;
    if (runtime.shift) {
      mountPanel(surface);
      mountCombinedMap(surface);
    }
  } finally {
    runtime.refreshing = false;
  }
}

function scheduleRefresh(delay = 250) {
  window.clearTimeout(runtime.scheduled);
  runtime.scheduled = window.setTimeout(() => { void refresh(); }, delay);
}

async function saveAppointment(form) {
  if (runtime.saving || !runtime.shift || !ACTIVE_STATUSES.includes(runtime.shift.status)) throw new Error('No active shift is available for this appointment');
  if (!isUuid(runtime.employeeId) || !isUuid(runtime.deviceId) || !isUuid(runtime.shift.id)) throw new Error('Trusted shift binding is incomplete');
  runtime.saving = true;
  runtime.warning = null;
  mountPanel(currentSurface());
  const formData = new FormData(form);
  const draft = {
    customerName: formData.get('customerName'),
    customerPhone: formData.get('customerPhone'),
    confirmedCustomerAddress: formData.get('confirmedCustomerAddress'),
    product: formData.get('product'),
    appointmentDate: formData.get('appointmentDate'),
    appointmentTime: formData.get('appointmentTime'),
  };
  const capturedAt = new Date().toISOString();
  const location = await locationFix();
  const payload = buildAppointmentSetPayload({
    draft,
    employeeId: runtime.employeeId,
    shiftId: runtime.shift.id,
    deviceId: runtime.deviceId,
    capturedAt,
    location,
  });
  const clientSetId = crypto.randomUUID();
  const write = createQueuedWrite({ id: clientSetId, kind: 'SET', capturedAt, payload });
  await runtime.queue.enqueue(write);
  const result = await runtime.queue.flush();
  if (result.rejected > 0 || result.blockedAuth) {
    runtime.warning = 'Appointment is retained on this browser but needs sync attention.';
  } else if (!location) {
    runtime.warning = 'Appointment saved. GPS was unavailable, so this appointment has no map pin.';
  } else if (Number(location.accuracyMeters) > WEB_APPOINTMENT_PIN_MAX_ACCURACY_METERS) {
    runtime.warning = `Appointment saved. GPS accuracy was ${Math.round(Number(location.accuracyMeters))} m, so the map does not show a misleading precise pin.`;
  }
  runtime.formOpen = false;
  runtime.saving = false;
  await refresh({ force: true });
}

function openAppointmentDetails(clientSetId) {
  const details = document.querySelector(`[data-performance-appointment-details="${CSS.escape(String(clientSetId))}"]`);
  if (details instanceof HTMLDetailsElement) {
    details.open = true;
    details.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

async function boot() {
  runtime.supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, createPerformanceSupabaseOptions(window.localStorage));
  runtime.queue = new PerformanceSyncQueue({
    store: createJsonStorageQueueStore(window.localStorage, APPOINTMENT_QUEUE_KEY),
    transport: createSupabaseSyncTransport(runtime.supabase),
  });

  document.addEventListener('click', event => {
    const action = event.target instanceof Element ? event.target.closest('[data-performance-appointment-action]') : null;
    if (action) {
      const type = action.getAttribute('data-performance-appointment-action');
      if (type === 'new') {
        runtime.formOpen = true;
        runtime.warning = null;
        mountPanel(currentSurface());
      } else if (type === 'cancel') {
        runtime.formOpen = false;
        runtime.warning = null;
        mountPanel(currentSurface());
      }
      return;
    }
    const pin = event.target instanceof Element ? event.target.closest('[data-performance-appointment-pin]') : null;
    if (pin) openAppointmentDetails(pin.getAttribute('data-performance-appointment-pin'));
  }, true);

  document.addEventListener('keydown', event => {
    if (!['Enter', ' '].includes(event.key)) return;
    const pin = event.target instanceof Element ? event.target.closest('[data-performance-appointment-pin]') : null;
    if (!pin) return;
    event.preventDefault();
    openAppointmentDetails(pin.getAttribute('data-performance-appointment-pin'));
  }, true);

  document.addEventListener('submit', event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.id !== 'performanceWebAppointmentForm') return;
    event.preventDefault();
    void saveAppointment(form).catch(error => {
      runtime.saving = false;
      runtime.warning = safeMessage(error);
      mountPanel(currentSurface());
    });
  }, true);

  const main = document.getElementById('main');
  if (main) new MutationObserver(() => scheduleRefresh(300)).observe(main, { childList: true, subtree: true });
  window.addEventListener('online', () => {
    void runtime.queue.flush().finally(() => scheduleRefresh(100));
    window.setTimeout(() => { void runtime.queue.flush().finally(() => scheduleRefresh(100)); }, 2500);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') scheduleRefresh(200);
  });
  window.setInterval(() => {
    if (!runtime.formOpen) void runtime.queue.flush().finally(() => refresh());
  }, 5000);
  scheduleRefresh(500);
}

void boot();

export const ParadisePerformanceWebAppointmentUiInvariants = Object.freeze([
  'appointment entry is available only while an authoritative shift is active',
  'appointment SET writes use a separate idempotent browser queue so the location/event transport cannot reject them',
  'the employee, shift, and trusted web-test device remain bound by existing Performance RLS',
  'GPS capture is best-effort and never blocks saving a valid appointment when location is unavailable',
  'customer address remains separate from the GPS location where the set was captured',
  'phone numbers are omitted from map pin labels and shown only inside appointment details',
  'Day Complete and Last Completed Day are read-only appointment views',
  'no CRM sync, third-party map provider, background GPS, KPI/pay, or field Lookup authority is implied by this web slice',
]);
