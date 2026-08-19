import { Capacitor, registerPlugin } from '@capacitor/core';
import { createClient } from '@supabase/supabase-js';
import { createNativePerformanceSupabaseOptions, ensureNativeInstallEnrollmentBoundary, validateNativePerformanceSession } from './performance-native-session.mjs';
import { redeemTrustedDevice } from './performance-session.mjs';
import { createJsonStorageQueueStore, PerformanceSyncQueue } from './performance-sync.mjs';
import { createSupabaseOperationalSyncTransport } from './performance-operational-sync.mjs';
import { createSupabaseShiftTransport, PerformanceTodayController } from './performance-today.mjs';
import { mountPerformanceToday } from './performance-today-ui.mjs';
import { registerCapacitorPerformanceLocation } from '../native/capacitor-performance-plugin.mjs';
import { CapacitorPerformanceLocationBridge } from '../native/capacitor-location-bridge.mjs';
import { isUuid } from '../shared/performance-events.mjs';

export const PARADISE_NATIVE_PERFORMANCE_APP_VERSION = '2026.08.19-native-performance-integration-v1';
const STORE_VERSION = '1.0.0';
const SUPABASE_URL = 'https://taxlrlfsobtnbasjcnuf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_3e755MdDisPBQzzGrBVBIA_gy4uqNqr';
const DEVICE_PUBLIC_ID_KEY = 'device-public-id-v1';
const DEVICE_ID_KEY = 'device-id-v1';
const EMPLOYEE_ID_KEY = 'employee-id-v1';
const BINDING_KEYS = Object.freeze([DEVICE_PUBLIC_ID_KEY, DEVICE_ID_KEY, EMPLOYEE_ID_KEY]);
const QUEUE_KEY = 'paradise-performance-native-offline-v1';

const runtime = {
  phase: 'BOOTING',
  error: null,
  supabase: null,
  secureStorage: null,
  queue: null,
  locationBridge: null,
  controller: null,
  session: null,
  authReady: false,
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

function markerStorage() {
  return {
    getItem: key => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
  };
}

function setPerformanceNavActive(active) {
  performanceNav?.classList.toggle('on', active);
  if (active) otherNav.forEach(button => button.classList.remove('on'));
}

function shell(inner) {
  return `<section class="performance-native-shell">
    <div class="performance-native-heading">
      <p class="performance-eyebrow">PARADISE PERFORMANCE</p>
      <h2>Today</h2>
      <p>Trusted-device workday tracking. Field Lookup remains separately available from the Lookup tab.</p>
    </div>
    ${inner}
  </section>`;
}

function enrollmentMarkup(message = '') {
  const alert = message ? `<p class="performance-warning" role="status">${esc(message)}</p>` : '';
  return shell(`<div class="performance-native-card">
    <p class="performance-eyebrow">DEVICE ENROLLMENT</p>
    <h3>Enter your one-time manager code</h3>
    <p>This device does not use an employee email/password. A manager-issued one-time enrollment code binds the device to the employee.</p>
    ${alert}
    <form id="performanceEnrollForm" autocomplete="off">
      <label for="performanceEnrollToken">Enrollment code</label>
      <input id="performanceEnrollToken" name="token" class="input" type="text" inputmode="text" autocapitalize="off" autocomplete="off" spellcheck="false" required>
      <button class="btn primary" type="submit">ENROLL DEVICE</button>
    </form>
  </div>`);
}

function unavailableMarkup(message, retry = true) {
  return shell(`<div class="performance-native-card">
    <p class="performance-eyebrow">PERFORMANCE TEMPORARILY UNAVAILABLE</p>
    <h3>Lookup is still available</h3>
    <p>${esc(message)}</p>
    ${retry ? '<button id="performanceRetry" class="btn secondary" type="button">TRY AGAIN</button>' : ''}
  </div>`);
}

async function clearBindings() {
  if (!runtime.secureStorage) return;
  for (const key of BINDING_KEYS) await runtime.secureStorage.removeItem(key).catch(() => undefined);
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

async function resolveTrustedDeviceSession() {
  runtime.controller = null;
  runtime.authReady = false;
  runtime.error = null;

  const session = await validateNativePerformanceSession({
    supabase: runtime.supabase,
    locationBridge: runtime.locationBridge,
    signOutWhenInvalid: true,
  });
  runtime.session = session;

  if (session.status === 'READY') {
    const deviceId = await runtime.secureStorage.getItem(DEVICE_ID_KEY);
    const storedEmployeeId = await runtime.secureStorage.getItem(EMPLOYEE_ID_KEY);
    if (!isUuid(deviceId) || !isUuid(storedEmployeeId) || storedEmployeeId !== session.employeeId) {
      await runtime.locationBridge.ensureStoppedWhenNoActiveShift().catch(() => undefined);
      await runtime.supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
      await clearBindings();
      runtime.phase = 'ENROLL';
      runtime.error = 'This protected device binding is incomplete. Ask a manager for a new one-time enrollment code.';
      return;
    }

    runtime.authReady = true;
    await runtime.queue.releaseAuthBlocked();
    await runtime.queue.flush().catch(() => undefined);
    runtime.controller = await createController(session.employeeId, deviceId);
    runtime.phase = 'READY';
    return;
  }

  if (session.status === 'NO_SESSION' || session.status === 'REVOKED_OR_UNENROLLED') {
    await clearBindings();
    runtime.phase = 'ENROLL';
    runtime.error = session.status === 'REVOKED_OR_UNENROLLED'
      ? 'This device enrollment is no longer active. Ask a manager for a new one-time enrollment code.'
      : null;
    return;
  }

  runtime.phase = 'UNVERIFIED_TRANSIENT';
  runtime.error = 'The trusted-device session could not be verified right now. Existing native GPS is not silently restarted or stopped on a transient network failure.';
}

async function enrollDevice(token) {
  const value = String(token || '').trim();
  if (!value) throw new Error('Enter the one-time enrollment code');
  let devicePublicId = await runtime.secureStorage.getItem(DEVICE_PUBLIC_ID_KEY);
  if (!isUuid(devicePublicId)) devicePublicId = crypto.randomUUID();

  const platform = Capacitor.getPlatform();
  if (!['ios', 'android'].includes(platform)) throw new Error('Device enrollment is available only in the native Paradise Performance app');

  try {
    const result = await redeemTrustedDevice({
      supabase: runtime.supabase,
      token: value,
      devicePublicId,
      platform,
      deviceLabel: `Paradise Performance ${platform}`,
      appVersion: STORE_VERSION,
    });
    if (!isUuid(result?.employee?.id) || !isUuid(result?.device?.id)) throw new Error('Enrollment response is missing the employee/device binding');
    await runtime.secureStorage.setItem(DEVICE_PUBLIC_ID_KEY, devicePublicId);
    await runtime.secureStorage.setItem(DEVICE_ID_KEY, result.device.id);
    await runtime.secureStorage.setItem(EMPLOYEE_ID_KEY, result.employee.id);
    await resolveTrustedDeviceSession();
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
    main.innerHTML = shell('<div class="performance-native-card"><p>Preparing trusted device…</p></div>');
    return;
  }

  if (runtime.phase === 'ENROLL') {
    main.innerHTML = enrollmentMarkup(runtime.error || '');
    const form = document.getElementById('performanceEnrollForm');
    form?.addEventListener('submit', async event => {
      event.preventDefault();
      const tokenInput = document.getElementById('performanceEnrollToken');
      const token = tokenInput?.value || '';
      if (tokenInput) tokenInput.value = '';
      runtime.phase = 'ENROLLING';
      runtime.error = null;
      await renderPerformance();
      try {
        await enrollDevice(token);
      } catch (error) {
        runtime.phase = 'ENROLL';
        runtime.error = `Enrollment did not complete. ${safeMessage(error)} If the one-time code was consumed, ask a manager for a new code.`;
      }
      await renderPerformance();
    }, { once: true });
    return;
  }

  if (runtime.phase === 'ENROLLING') {
    main.innerHTML = shell('<div class="performance-native-card"><p>Enrolling this device…</p></div>');
    return;
  }

  if (runtime.phase === 'UNVERIFIED_TRANSIENT' || runtime.phase === 'ERROR') {
    main.innerHTML = unavailableMarkup(runtime.error || 'Performance could not be loaded.');
    document.getElementById('performanceRetry')?.addEventListener('click', async () => {
      runtime.phase = 'BOOTING';
      await renderPerformance();
      try {
        await resolveTrustedDeviceSession();
      } catch (error) {
        runtime.phase = 'ERROR';
        runtime.error = safeMessage(error);
      }
      await renderPerformance();
    }, { once: true });
    return;
  }

  if (runtime.phase === 'READY' && runtime.controller) {
    main.innerHTML = shell('<div id="performanceTodayRoot"></div><p class="performance-native-boundary">Performance data never authorizes canvassing. Use Lookup for field/legal instructions.</p>');
    const root = document.getElementById('performanceTodayRoot');
    try {
      await mountPerformanceToday({ root, controller: runtime.controller });
      await runtime.queue.flush().catch(() => undefined);
    } catch (error) {
      root.innerHTML = `<div class="performance-native-card"><p class="performance-warning">${esc(safeMessage(error))}</p><p>Performance could not refresh. Lookup remains available.</p></div>`;
    }
  }
}

async function bootNativePerformance() {
  if (!performanceNav || !main) return;
  if (!Capacitor.isNativePlatform()) {
    performanceNav.hidden = true;
    return;
  }

  performanceNav.hidden = false;
  performanceNav.addEventListener('click', () => { void renderPerformance(); });
  otherNav.forEach(button => button.addEventListener('click', () => setPerformanceNavActive(false)));

  try {
    const nativeSession = createNativePerformanceSupabaseOptions({ registerPlugin });
    runtime.secureStorage = nativeSession.storage;
    runtime.supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, nativeSession.supabaseOptions);
    runtime.queue = new PerformanceSyncQueue({
      store: createJsonStorageQueueStore(window.localStorage, QUEUE_KEY),
      transport: createSupabaseOperationalSyncTransport(runtime.supabase),
    });

    const plugin = registerCapacitorPerformanceLocation(registerPlugin);
    runtime.locationBridge = new CapacitorPerformanceLocationBridge({
      plugin,
      onQueuedLocation: async write => {
        await runtime.queue.enqueue(write);
        if (runtime.authReady) await runtime.queue.flush().catch(() => undefined);
      },
    });

    await ensureNativeInstallEnrollmentBoundary({
      markerStorage: markerStorage(),
      supabase: runtime.supabase,
      secureStorage: runtime.secureStorage,
      bindingKeys: BINDING_KEYS,
    });
    await resolveTrustedDeviceSession();
  } catch (error) {
    runtime.phase = 'ERROR';
    runtime.error = safeMessage(error);
  }

  await renderPerformance();
}

void bootNativePerformance();

export const ParadiseNativePerformanceIntegrationInvariants = Object.freeze([
  'the public Canvass Manager web bundle remains separate from the native Performance bundle',
  'native startup validates a trusted device before creating the Performance Today controller',
  'native session refresh tokens use the OS-protected PerformanceSecureStorage plugin',
  'Start My Day remains the only path that may begin live native GPS',
  'the store runtime sync transport accepts EVENT and LOCATION only; customer SET writes are not enabled in this integration slice',
  'Performance failures never remove or redefine the existing Lookup tab',
  'no KPI target, pay value, territory assignment, retention duration, or customer record is invented by the native shell',
]);
