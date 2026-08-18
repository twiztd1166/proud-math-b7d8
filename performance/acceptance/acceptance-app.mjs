import { Capacitor, registerPlugin } from '@capacitor/core';
import { createClient } from '@supabase/supabase-js';
import {
  createPerformanceSupabaseOptions,
  redeemTrustedDevice,
} from '../client/performance-session.mjs';
import {
  ensureNativeInstallEnrollmentBoundary,
  validateNativePerformanceSession,
} from '../client/performance-native-session.mjs';
import {
  PerformanceSyncQueue,
  createJsonStorageQueueStore,
  createSupabaseSyncTransport,
} from '../client/performance-sync.mjs';
import {
  PerformanceTodayController,
  createSupabaseShiftTransport,
} from '../client/performance-today.mjs';
import { mountPerformanceToday } from '../client/performance-today-ui.mjs';
import { CapacitorPerformanceLocationBridge } from '../native/capacitor-location-bridge.mjs';
import { registerCapacitorPerformanceLocation } from '../native/capacitor-performance-plugin.mjs';
import { registerCapacitorSecureStorage } from '../native/capacitor-secure-storage.mjs';

const PROJECT_URL = 'https://taxlrlfsobtnbasjcnuf.supabase.co';
const PUBLISHABLE_KEY = 'sb_publishable_3e755MdDisPBQzzGrBVBIA_gy4uqNqr';
const ACCEPTANCE_VERSION = '2026.08.18-device-acceptance-v4';
const QUEUE_KEY = 'paradise-performance-device-acceptance-queue-v1';
const DEVICE_PUBLIC_ID_KEY = 'acceptance-device-public-id';
const EMPLOYEE_ID_KEY = 'acceptance-employee-id';
const DEVICE_ID_KEY = 'acceptance-device-id';

const $ = selector => document.querySelector(selector);
const refs = {
  enrollmentPanel: $('#enrollment-panel'),
  token: $('#enrollment-token'),
  redeem: $('#redeem-enrollment'),
  today: $('#performance-today-root'),
  session: $('#session-state'),
  native: $('#native-state'),
  queue: $('#queue-state'),
  network: $('#network-state'),
  evidence: $('#evidence-log'),
  validate: $('#validate-session'),
  authRefresh: $('#refresh-auth-session'),
  capture: $('#capture-now'),
  flush: $('#flush-queue'),
  refresh: $('#refresh-diagnostics'),
  copy: $('#copy-evidence'),
  clear: $('#clear-local-state'),
  version: $('#acceptance-version'),
};

const secureStorage = registerCapacitorSecureStorage(registerPlugin);
const supabase = createClient(PROJECT_URL, PUBLISHABLE_KEY, createPerformanceSupabaseOptions(secureStorage));
const nativePlugin = registerCapacitorPerformanceLocation(registerPlugin);
const queueStore = createJsonStorageQueueStore(window.localStorage, QUEUE_KEY);
const syncQueue = new PerformanceSyncQueue({
  store: queueStore,
  transport: createSupabaseSyncTransport(supabase),
});

let controller = null;
let todayMount = null;
let flushPromise = null;
let lastSessionState = null;
const runId = crypto.randomUUID();
const evidenceRows = [];

function safeMessage(error) {
  return String(error?.message || error || 'Unknown error').slice(0, 240);
}

function record(type, detail = {}) {
  const row = Object.freeze({ at: new Date().toISOString(), runId, type, ...detail });
  evidenceRows.push(row);
  if (evidenceRows.length > 250) evidenceRows.shift();
  refs.evidence.textContent = evidenceRows.map(item => JSON.stringify(item)).join('\n');
  refs.evidence.scrollTop = refs.evidence.scrollHeight;
  return row;
}

function nativePlatform() {
  const value = Capacitor.getPlatform();
  if (!['ios', 'android'].includes(value)) throw new Error(`Physical acceptance requires iOS or Android; got ${value}`);
  return value;
}

async function stableDevicePublicId() {
  const existing = await secureStorage.getItem(DEVICE_PUBLIC_ID_KEY);
  if (existing) return existing;
  const created = crypto.randomUUID();
  await secureStorage.setItem(DEVICE_PUBLIC_ID_KEY, created);
  return created;
}

async function queueSnapshot() {
  const rows = await queueStore.list();
  const counts = rows.reduce((out, row) => {
    const state = row.state || 'PENDING';
    out[state] = (out[state] || 0) + 1;
    return out;
  }, {});
  return { total: rows.length, counts };
}

async function renderQueue() {
  const snapshot = await queueSnapshot();
  refs.queue.textContent = JSON.stringify(snapshot);
  return snapshot;
}

async function flushQueue(reason = 'manual') {
  if (flushPromise) return flushPromise;
  flushPromise = (async () => {
    try {
      const result = await syncQueue.flush({ limit: 250 });
      record('SYNC_FLUSH', { reason, result });
      await renderQueue();
      return result;
    } catch (error) {
      record('SYNC_FLUSH_ERROR', { reason, message: safeMessage(error) });
      throw error;
    } finally {
      flushPromise = null;
    }
  })();
  return flushPromise;
}

async function onQueuedLocation(write) {
  await syncQueue.enqueue(write);
  record('LOCATION_QUEUED', {
    id: write.id,
    capturedAt: write.capturedAt,
    shiftId: write.payload.shiftId,
    accuracyMeters: write.payload.accuracyMeters,
    precise: write.payload.precise,
    mocked: write.payload.mocked,
  });
  await renderQueue();
  if (navigator.onLine) void flushQueue('native-location');
}

const locationBridge = new CapacitorPerformanceLocationBridge({ plugin: nativePlugin, onQueuedLocation });

async function clearRuntimeView(message = 'Enrollment required.') {
  controller = null;
  todayMount = null;
  refs.today.innerHTML = `<section class="performance-today"><h2>${message}</h2></section>`;
  refs.enrollmentPanel.hidden = false;
}

function showTransientValidationView() {
  refs.enrollmentPanel.hidden = true;
  if (!controller) {
    refs.today.innerHTML = '<section class="performance-today"><h2>OFFLINE · SESSION NOT REVALIDATED</h2><p>Existing native tracking is preserved. Reconnect to restore the full Today view.</p></section>';
  }
}

async function buildController(employeeId, deviceId) {
  controller = new PerformanceTodayController({
    shiftTransport: createSupabaseShiftTransport(supabase),
    employeeId,
    deviceId,
    locationBridge,
    syncQueue,
  });
  refs.today.innerHTML = '';
  todayMount = await mountPerformanceToday({ root: refs.today, controller });
  refs.enrollmentPanel.hidden = true;
  record('TODAY_MOUNTED', { employeeId, deviceId, state: controller.getState().mode });
}

async function validateAndMount({ signOutWhenInvalid = true } = {}) {
  const state = await validateNativePerformanceSession({ supabase, locationBridge, signOutWhenInvalid });
  lastSessionState = state;
  refs.session.textContent = JSON.stringify(state);
  record('SESSION_VALIDATED', {
    status: state.status,
    employeeId: state.employeeId ?? null,
    role: state.role ?? null,
    stage: state.stage ?? null,
    errorCode: state.errorCode ?? null,
  });

  if (state.status === 'UNVERIFIED_TRANSIENT') {
    record('SESSION_TRANSIENT_PRESERVED', { nativeState: locationBridge.getState().state, stage: state.stage });
    showTransientValidationView();
    return state;
  }

  if (state.status !== 'READY') {
    await secureStorage.removeItem(EMPLOYEE_ID_KEY).catch(() => undefined);
    await secureStorage.removeItem(DEVICE_ID_KEY).catch(() => undefined);
    record('INVALID_SESSION_NATIVE_STOP_CONFIRMED', { status: state.status });
    await clearRuntimeView(state.status === 'NO_SESSION' ? 'Enrollment required.' : 'Trusted device revoked or unenrolled.');
    return state;
  }

  const [storedEmployeeId, deviceId] = await Promise.all([
    secureStorage.getItem(EMPLOYEE_ID_KEY),
    secureStorage.getItem(DEVICE_ID_KEY),
  ]);
  if (!storedEmployeeId || !deviceId || storedEmployeeId !== state.employeeId) {
    await locationBridge.ensureStoppedWhenNoActiveShift();
    record('LOCAL_BINDING_MISSING', { storedEmployeeId, authenticatedEmployeeId: state.employeeId, deviceId: deviceId ?? null });
    await clearRuntimeView('Trusted session exists, but local device binding needs re-enrollment.');
    return state;
  }

  if (!controller) await buildController(state.employeeId, deviceId);
  refs.enrollmentPanel.hidden = true;
  return state;
}

async function refreshDiagnostics() {
  const queue = await renderQueue();
  const nativeStatus = await nativePlugin.getTrackingStatus().catch(error => ({ error: safeMessage(error) }));
  const bridgeStatus = locationBridge.getState();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const session = sessionData?.session;
  const snapshot = {
    version: ACCEPTANCE_VERSION,
    runId,
    platform: Capacitor.getPlatform(),
    online: navigator.onLine,
    sessionPresent: Boolean(session),
    sessionExpiresAt: session?.expires_at ?? null,
    localSessionErrorCode: sessionError?.code ?? null,
    validatedSession: lastSessionState?.status ?? null,
    native: nativeStatus,
    bridge: bridgeStatus,
    queue,
    today: controller?.getState?.() ?? null,
  };
  refs.native.textContent = JSON.stringify({ native: nativeStatus, bridge: bridgeStatus });
  refs.network.textContent = navigator.onLine ? 'ONLINE' : 'OFFLINE';
  return snapshot;
}

async function redeem() {
  const token = refs.token.value.trim();
  if (!token) throw new Error('Enrollment token is required');
  refs.redeem.disabled = true;
  try {
    const devicePublicId = await stableDevicePublicId();
    const result = await redeemTrustedDevice({
      supabase,
      token,
      devicePublicId,
      platform: nativePlatform(),
      deviceLabel: `Physical acceptance ${nativePlatform()}`,
      appVersion: ACCEPTANCE_VERSION,
    });
    await Promise.all([
      secureStorage.setItem(EMPLOYEE_ID_KEY, result.employee.id),
      secureStorage.setItem(DEVICE_ID_KEY, result.device.id),
    ]);
    refs.token.value = '';
    record('ENROLLMENT_REDEEMED', {
      employeeId: result.employee.id,
      role: result.employee.role,
      deviceId: result.device.id,
      devicePublicId,
      platform: nativePlatform(),
    });
    await validateAndMount();
    await refreshDiagnostics();
  } finally {
    refs.redeem.disabled = false;
  }
}

async function refreshAuthSession() {
  const { data, error } = await supabase.auth.refreshSession();
  if (error || !data?.session) throw new Error(error?.message || 'Auth refresh did not return a session');
  record('AUTH_SESSION_REFRESHED', {
    authUserId: data.user?.id ?? data.session.user?.id ?? null,
    expiresAt: data.session.expires_at ?? null,
  });
  await validateAndMount();
}

async function captureNow() {
  if (!controller) throw new Error('No mounted trusted-device runtime');
  const write = await locationBridge.captureNow();
  record('CAPTURE_NOW', {
    id: write?.id ?? null,
    capturedAt: write?.capturedAt ?? null,
    accuracyMeters: write?.payload?.accuracyMeters ?? null,
  });
  await renderQueue();
  if (navigator.onLine) await flushQueue('capture-now');
}

async function clearLocalState() {
  const mode = controller?.getState?.().mode;
  if (mode === 'ACTIVE' || mode === 'FINISHING') throw new Error('Finish the active day before clearing local acceptance state');
  await locationBridge.ensureStoppedWhenNoActiveShift();
  await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
  await Promise.all([
    secureStorage.removeItem(EMPLOYEE_ID_KEY),
    secureStorage.removeItem(DEVICE_ID_KEY),
    secureStorage.removeItem(DEVICE_PUBLIC_ID_KEY),
    queueStore.clear(),
  ]);
  lastSessionState = Object.freeze({ status: 'NO_SESSION', employeeId: null, role: null });
  record('LOCAL_ACCEPTANCE_STATE_CLEARED', { nativeStopped: true });
  await clearRuntimeView('Local acceptance state cleared. A new enrollment is required.');
  await refreshDiagnostics();
}

async function copyEvidence() {
  const diagnostics = await refreshDiagnostics();
  const payload = JSON.stringify({
    acceptanceVersion: ACCEPTANCE_VERSION,
    runId,
    capturedAt: new Date().toISOString(),
    diagnostics,
    evidence: evidenceRows,
  }, null, 2);
  await navigator.clipboard.writeText(payload);
  record('EVIDENCE_COPIED', { bytes: payload.length });
}

async function guarded(label, fn) {
  try {
    await fn();
  } catch (error) {
    record('ACTION_ERROR', { action: label, message: safeMessage(error) });
    alert(`${label}: ${safeMessage(error)}`);
  } finally {
    await refreshDiagnostics().catch(() => undefined);
  }
}

refs.version.textContent = `${ACCEPTANCE_VERSION} · ${Capacitor.getPlatform()}`;
refs.redeem.addEventListener('click', () => guarded('Redeem enrollment', redeem));
refs.validate.addEventListener('click', () => guarded('Validate session', () => validateAndMount()));
refs.authRefresh.addEventListener('click', () => guarded('Refresh Auth session', refreshAuthSession));
refs.capture.addEventListener('click', () => guarded('Capture now', captureNow));
refs.flush.addEventListener('click', () => guarded('Flush queue', () => flushQueue('manual')));
refs.refresh.addEventListener('click', () => guarded('Refresh diagnostics', refreshDiagnostics));
refs.copy.addEventListener('click', () => guarded('Copy evidence', copyEvidence));
refs.clear.addEventListener('click', () => guarded('Clear local state', clearLocalState));

window.addEventListener('online', () => {
  refs.network.textContent = 'ONLINE';
  record('NETWORK_ONLINE');
  void (async () => {
    const state = await validateAndMount();
    if (state.status === 'READY') await flushQueue('network-online');
  })().catch(error => record('NETWORK_RECOVERY_ERROR', { message: safeMessage(error) }));
});
window.addEventListener('offline', () => {
  refs.network.textContent = 'OFFLINE';
  record('NETWORK_OFFLINE', { nativeState: locationBridge.getState().state });
});

let installBoundaryReady = true;
try {
  const installBoundary = await ensureNativeInstallEnrollmentBoundary({
    markerStorage: window.localStorage,
    supabase,
    secureStorage,
    bindingKeys: [EMPLOYEE_ID_KEY, DEVICE_ID_KEY, DEVICE_PUBLIC_ID_KEY],
  });
  record('INSTALL_BOUNDARY_CHECKED', installBoundary);
} catch (error) {
  installBoundaryReady = false;
  record('INSTALL_BOUNDARY_ERROR', { message: safeMessage(error) });
  await locationBridge.ensureStoppedWhenNoActiveShift().catch(stopError => {
    record('INSTALL_BOUNDARY_NATIVE_STOP_ERROR', { message: safeMessage(stopError) });
  });
  await clearRuntimeView('Fresh-install security boundary needs attention before enrollment.');
}

record('ACCEPTANCE_BOOT', { version: ACCEPTANCE_VERSION, platform: Capacitor.getPlatform() });
if (installBoundaryReady) {
  await validateAndMount().catch(error => {
    record('BOOT_SESSION_ERROR', { message: safeMessage(error) });
    return clearRuntimeView('Enrollment or session recovery needs attention.');
  });
}
await refreshDiagnostics();
setInterval(() => void refreshDiagnostics().catch(() => undefined), 5000);
