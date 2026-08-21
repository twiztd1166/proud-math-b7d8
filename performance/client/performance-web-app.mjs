import { createClient } from '@supabase/supabase-js';
import { createPerformanceSupabaseOptions, redeemTrustedDevice, validateTrustedDeviceSession } from './performance-session.mjs';
import { createJsonStorageQueueStore, PerformanceSyncQueue } from './performance-sync.mjs';
import { createSupabaseOperationalSyncTransport } from './performance-operational-sync.mjs';
import { createSupabaseShiftTransport, PerformanceTodayController } from './performance-today.mjs';
import { BrowserForegroundLocationBridge } from './performance-web-location.mjs';
import { isUuid } from '../shared/performance-events.mjs';

export const PARADISE_PERFORMANCE_WEB_INTERIM_VERSION = '2026.08.21-web-interim-v2';
const STORE_VERSION = 'web-interim-v1';
const SUPABASE_URL = 'https://taxlrlfsobtnbasjcnuf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_3e755MdDisPBQzzGrBVBIA_gy4uqNqr';
const DEVICE_PUBLIC_ID_KEY = 'paradise-performance-web-device-public-id-v1';
const DEVICE_ID_KEY = 'paradise-performance-web-device-id-v1';
const EMPLOYEE_ID_KEY = 'paradise-performance-web-employee-id-v1';
const QUEUE_KEY = 'paradise-performance-web-offline-v1';
const BINDING_KEYS = [DEVICE_PUBLIC_ID_KEY, DEVICE_ID_KEY, EMPLOYEE_ID_KEY];

const runtime = {
  phase: 'BOOTING',
  error: null,
  supabase: null,
  queue: null,
  locationBridge: null,
  controller: null,
  session: null,
};

const main = document.getElementById('main');
const performanceNav = document.getElementById('nPerf');
const otherNav = ['nLook', 'nTrain', 'nRel', 'nHist'].map(id => document.getElementById(id)).filter(Boolean);

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeMessage(error) {
  return String(error?.message || error || 'Unknown error').slice(0, 240);
}

function setPerformanceNavActive(active) {
  performanceNav?.classList.toggle('on', active);
  if (active) otherNav.forEach(button => button.classList.remove('on'));
}

function shell(inner) {
  return `<section class="performance-web-shell">
    <div class="performance-web-banner" role="note">
      <b>WEB INTERIM · LIVE FOREGROUND GPS</b>
      <span>During an active shift Paradise uses continuous high-accuracy GPS while this page is visible and requests Screen Wake Lock where supported. Switching apps, hiding the page, or locking the phone pauses browser GPS. True locked-screen/background tracking remains native-app only.</span>
    </div>
    <div class="performance-web-heading">
      <p class="performance-eyebrow">PARADISE PERFORMANCE</p>
      <h2>Today</h2>
      <p>Lookup and Paradise University remain available from the navigation below.</p>
    </div>
    ${inner}
  </section>`;
}

function enrollmentMarkup(message = '') {
  const alert = message ? `<p class="performance-warning" role="status">${esc(message)}</p>` : '';
  return shell(`<div class="performance-web-card">
    <p class="performance-eyebrow">TRUST THIS BROWSER</p>
    <h3>Enter your one-time manager code</h3>
    <p>This interim browser uses the same revocable Paradise trusted-device backend. Do not enroll a shared or public browser.</p>
    ${alert}
    <form id="performanceWebEnrollForm" autocomplete="off">
      <label for="performanceWebEnrollToken">Enrollment code</label>
      <input id="performanceWebEnrollToken" class="input" type="text" autocapitalize="off" autocomplete="off" spellcheck="false" required>
      <button class="btn primary" type="submit">ENROLL THIS BROWSER</button>
    </form>
  </div>`);
}

function locationLabel(location = {}) {
  if (location.state === 'PERMISSION_REQUIRED') return 'Location permission needed';
  if (location.state === 'WEB_FOREGROUND_CONTINUOUS') return 'Live foreground GPS active';
  if (location.state === 'WEB_FOREGROUND_PAUSED') return 'Live GPS paused — keep Paradise visible';
  if (location.state === 'WEB_FOREGROUND_SAMPLE_ONLY') return 'Foreground GPS available — continuous watch unsupported';
  if (location.state === 'WEB_FOREGROUND') return 'Foreground GPS available';
  if (location.state === 'ERROR' || location.state === 'STOP_ERROR') return 'Location needs attention';
  return 'GPS starts with your workday';
}

function wakeLockLabel(location = {}) {
  if (location.screenWakeLock === 'ACTIVE') return 'Screen keep-awake: active';
  if (location.screenWakeLock === 'PAUSED_HIDDEN') return 'Screen keep-awake: paused while hidden';
  if (location.screenWakeLock === 'UNAVAILABLE' || location.screenWakeLock === 'UNAVAILABLE_OR_DENIED') return 'Screen keep-awake unavailable — keep the phone awake manually';
  return 'Screen keep-awake starts best-effort with live GPS';
}

function elapsed(startedAt) {
  const start = new Date(startedAt);
  if (Number.isNaN(start.valueOf())) return '';
  const minutes = Math.max(0, Math.floor((Date.now() - start.valueOf()) / 60000));
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours ? `${hours} hr ${mins} min` : `${mins} min`;
}

function todayMarkup(state) {
  const warning = state?.warning ? `<p class="performance-warning" role="status">${esc(state.warning)}</p>` : '';
  const disabled = state?.busy ? ' disabled aria-disabled="true"' : '';
  if (!state || state.mode === 'IDLE') {
    return `<div class="performance-web-card" data-performance-web-state="idle">
      <p class="performance-eyebrow">READY FOR THE FIELD?</p>
      <h3>${esc(locationLabel(state?.location))}</h3>
      <p>Start My Day creates the authoritative workday, requests location permission, starts continuous foreground GPS, and asks the browser to keep the screen awake where supported.</p>
      ${warning}
      <button class="btn primary" data-performance-web-action="start" type="button"${disabled}>START MY DAY</button>
    </div>`;
  }
  if (state.mode === 'ACTIVE' || state.mode === 'FINISHING') {
    const shift = state.shift || {};
    const gpsAction = state.location?.continuousForegroundTracking ? 'CAPTURE GPS NOW' : 'RESUME LIVE GPS';
    return `<div class="performance-web-card" data-performance-web-state="active">
      <p class="performance-eyebrow">SHIFT ACTIVE · ${esc(elapsed(shift.started_at))}</p>
      <h3>${esc(locationLabel(state.location))}</h3>
      <p>${esc(wakeLockLabel(state.location))}</p>
      <p>${esc(shift.doors ?? 0)} Doors · ${esc(shift.conversations ?? 0)} Conversations</p>
      <p class="performance-web-boundary">Keep Paradise visible for continuous web GPS. Switching apps or locking the phone pauses browser tracking; returning to Paradise automatically resumes when location permission is already granted. Native apps are still required for true background/locked-screen GPS.</p>
      ${warning}
      <button class="btn primary" data-performance-web-action="sample" type="button"${disabled}>${gpsAction}</button>
      <button class="btn secondary" data-performance-web-action="finish" type="button"${disabled}>FINISH DAY</button>
    </div>`;
  }
  if (state.mode === 'COMPLETE') {
    const shift = state.shift || {};
    return `<div class="performance-web-card" data-performance-web-state="complete">
      <p class="performance-eyebrow">DAY COMPLETE ✓</p>
      <h3>${esc(shift.doors ?? 0)} Doors · ${esc(shift.conversations ?? 0)} Conversations</h3>
      ${warning}
    </div>`;
  }
  return `<div class="performance-web-card"><h3>Performance needs attention</h3>${warning}</div>`;
}

async function clearBindings() {
  for (const key of BINDING_KEYS) window.localStorage.removeItem(key);
}

async function clearWebAccess() {
  await runtime.locationBridge?.ensureStoppedWhenNoActiveShift?.().catch(() => undefined);
  await runtime.supabase?.auth?.signOut({ scope: 'local' }).catch(() => undefined);
  await clearBindings();
  runtime.controller = null;
  runtime.session = null;
  runtime.phase = 'ENROLL';
  runtime.error = 'This browser was cleared. Ask a manager for a new one-time enrollment code.';
}

async function verifyStoredDevice(employeeId, deviceId) {
  if (!isUuid(employeeId) || !isUuid(deviceId)) return false;
  const { data, error } = await runtime.supabase
    .from('performance_devices')
    .select('id,employee_id,platform,revoked_at')
    .eq('id', deviceId)
    .eq('employee_id', employeeId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data && data.revoked_at == null && data.platform === 'web-test');
}

async function createController(employeeId, deviceId) {
  const controller = new PerformanceTodayController({
    shiftTransport: createSupabaseShiftTransport(runtime.supabase),
    employeeId,
    deviceId,
    locationBridge: runtime.locationBridge,
    syncQueue: runtime.queue,
  });
  await controller.load();
  return controller;
}

async function resolveSession() {
  runtime.controller = null;
  runtime.error = null;
  const state = await validateTrustedDeviceSession({ supabase: runtime.supabase, signOutWhenInvalid: true });
  runtime.session = state;
  if (state.status === 'NO_SESSION' || state.status === 'REVOKED_OR_UNENROLLED') {
    await runtime.locationBridge?.ensureStoppedWhenNoActiveShift?.().catch(() => undefined);
    await clearBindings();
    runtime.phase = 'ENROLL';
    if (state.status === 'REVOKED_OR_UNENROLLED') runtime.error = 'This web trusted-device session is no longer active. Ask a manager for a new code.';
    return;
  }
  if (state.status !== 'READY') {
    runtime.phase = 'UNVERIFIED_TRANSIENT';
    runtime.error = 'The trusted-device session could not be verified right now. Retry when the network is available.';
    return;
  }

  const storedEmployeeId = window.localStorage.getItem(EMPLOYEE_ID_KEY);
  const deviceId = window.localStorage.getItem(DEVICE_ID_KEY);
  if (storedEmployeeId !== state.employeeId || !await verifyStoredDevice(state.employeeId, deviceId)) {
    await runtime.locationBridge?.ensureStoppedWhenNoActiveShift?.().catch(() => undefined);
    await runtime.supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
    await clearBindings();
    runtime.phase = 'ENROLL';
    runtime.error = 'This browser binding is incomplete or no longer valid. Ask a manager for a new code.';
    return;
  }

  await runtime.queue.releaseAuthBlocked();
  await runtime.queue.flush().catch(() => undefined);
  runtime.controller = await createController(state.employeeId, deviceId);
  runtime.phase = 'READY';
}

async function enrollBrowser(token) {
  const value = String(token || '').trim();
  if (!value) throw new Error('Enter the one-time enrollment code');
  let devicePublicId = window.localStorage.getItem(DEVICE_PUBLIC_ID_KEY);
  if (!isUuid(devicePublicId)) devicePublicId = crypto.randomUUID();

  try {
    const result = await redeemTrustedDevice({
      supabase: runtime.supabase,
      token: value,
      devicePublicId,
      platform: 'web-test',
      deviceLabel: 'Paradise Performance Web Interim',
      appVersion: STORE_VERSION,
    });
    if (!isUuid(result?.employee?.id) || !isUuid(result?.device?.id)) throw new Error('Enrollment response is missing the employee/device binding');
    window.localStorage.setItem(DEVICE_PUBLIC_ID_KEY, devicePublicId);
    window.localStorage.setItem(DEVICE_ID_KEY, result.device.id);
    window.localStorage.setItem(EMPLOYEE_ID_KEY, result.employee.id);
    await resolveSession();
  } catch (error) {
    await runtime.supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
    await clearBindings();
    throw error;
  }
}

async function renderPerformance() {
  if (!main) return;
  setPerformanceNavActive(true);

  if (runtime.phase === 'BOOTING') {
    main.innerHTML = shell('<div class="performance-web-card"><p>Preparing secure web access…</p></div>');
    return;
  }
  if (runtime.phase === 'ENROLL') {
    main.innerHTML = enrollmentMarkup(runtime.error || '');
    document.getElementById('performanceWebEnrollForm')?.addEventListener('submit', async event => {
      event.preventDefault();
      const input = document.getElementById('performanceWebEnrollToken');
      const token = input?.value || '';
      if (input) input.value = '';
      runtime.phase = 'ENROLLING';
      runtime.error = null;
      await renderPerformance();
      try { await enrollBrowser(token); }
      catch (error) {
        runtime.phase = 'ENROLL';
        runtime.error = `Enrollment did not complete. ${safeMessage(error)} If the code was consumed, ask a manager for a new code.`;
      }
      await renderPerformance();
    }, { once: true });
    return;
  }
  if (runtime.phase === 'ENROLLING') {
    main.innerHTML = shell('<div class="performance-web-card"><p>Enrolling this browser…</p></div>');
    return;
  }
  if (runtime.phase === 'UNVERIFIED_TRANSIENT' || runtime.phase === 'ERROR') {
    main.innerHTML = shell(`<div class="performance-web-card"><h3>Performance temporarily unavailable</h3><p>${esc(runtime.error || '')}</p><button id="performanceWebRetry" class="btn secondary" type="button">TRY AGAIN</button></div>`);
    document.getElementById('performanceWebRetry')?.addEventListener('click', async () => {
      runtime.phase = 'BOOTING';
      await renderPerformance();
      try { await resolveSession(); } catch (error) { runtime.phase = 'ERROR'; runtime.error = safeMessage(error); }
      await renderPerformance();
    }, { once: true });
    return;
  }
  if (runtime.phase === 'READY' && runtime.controller) {
    main.innerHTML = shell(`${todayMarkup(runtime.controller.getState())}<div class="performance-web-card performance-web-security"><h3>Web interim security</h3><p>This browser holds a revocable trusted-device session in same-origin browser storage. Use only a private company-controlled device.</p><button id="performanceWebClear" class="btn secondary" type="button">CLEAR WEB ACCESS</button></div>`);
    main.querySelectorAll('[data-performance-web-action]').forEach(button => button.addEventListener('click', async () => {
      const action = button.dataset.performanceWebAction;
      button.disabled = true;
      try {
        if (action === 'start') await runtime.controller.startMyDay();
        if (action === 'sample') {
          const liveState = runtime.locationBridge.getState();
          if (liveState.continuousForegroundTracking) await runtime.locationBridge.captureNow();
          else await runtime.locationBridge.resumeForegroundTracking({ initiatedByUser: true });
          await runtime.controller.load();
        }
        if (action === 'finish') await runtime.controller.finishDay();
        await runtime.queue.flush().catch(() => undefined);
      } catch (error) {
        runtime.error = safeMessage(error);
      }
      await renderPerformance();
    }, { once: true }));
    document.getElementById('performanceWebClear')?.addEventListener('click', async () => {
      await clearWebAccess();
      await renderPerformance();
    }, { once: true });
  }
}

async function bootWebPerformance() {
  if (!performanceNav || !main) return;
  performanceNav.hidden = false;
  performanceNav.addEventListener('click', () => { void renderPerformance(); });
  otherNav.forEach(button => button.addEventListener('click', () => setPerformanceNavActive(false)));

  try {
    runtime.supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, createPerformanceSupabaseOptions(window.localStorage));
    runtime.queue = new PerformanceSyncQueue({
      store: createJsonStorageQueueStore(window.localStorage, QUEUE_KEY),
      transport: createSupabaseOperationalSyncTransport(runtime.supabase),
    });
    runtime.locationBridge = new BrowserForegroundLocationBridge({
      onQueuedLocation: async write => {
        await runtime.queue.enqueue(write);
        await runtime.queue.flush().catch(() => undefined);
      },
    });
    await resolveSession();
  } catch (error) {
    runtime.phase = 'ERROR';
    runtime.error = safeMessage(error);
  }
  await renderPerformance();
}

void bootWebPerformance();

export const ParadisePerformanceWebInterimInvariants = Object.freeze([
  'the validated Lookup and Paradise University bundle remains the base web application',
  'web trusted-device enrollment uses the existing one-time manager enrollment flow with platform web-test',
  'the browser never receives a service-role or secret Supabase key',
  'web refresh-token persistence is explicitly interim browser storage and is not represented as native secure storage',
  'web location uses continuous high-accuracy watchPosition only while the page is visible and the authoritative shift is active',
  'Screen Wake Lock is best-effort foreground assistance and is never represented as native background execution',
  'visibility loss pauses browser GPS; returning visible auto-resumes only when location permission is already granted',
  'true locked-screen and background GPS remain native-app capabilities',
  'Start My Day creates or recovers the authoritative Performance shift before browser GPS begins',
  'Finish Day remains available when browser location permission, signal, or wake lock is unavailable',
  'Performance evidence never authorizes or changes field Lookup',
  'customer SET writes, KPI/pay values, territory rules, and retention values are not invented by the web interim shell',
]);