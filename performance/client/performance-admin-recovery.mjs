import { createClient } from '@supabase/supabase-js';
import {
  createPerformanceSupabaseOptions,
  redeemTrustedDevice,
  validateTrustedDeviceSession,
} from './performance-session.mjs';
import {
  createRecoverySecret,
  isRecoveryReference,
  isRecoverySecret,
  isRecoveryUuid,
  sha256Hex,
  statusAllowsExchange,
} from './performance-admin-recovery-core.mjs';

export const PERFORMANCE_ADMIN_RECOVERY_VERSION = '2026.08.21-admin-recovery-v1';

const SUPABASE_URL = 'https://taxlrlfsobtnbasjcnuf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_3e755MdDisPBQzzGrBVBIA_gy4uqNqr';
const RECOVERY_STATE_KEY = 'paradise-performance-admin-recovery-v1';
const DEVICE_PUBLIC_ID_KEY = 'paradise-performance-web-device-public-id-v1';
const DEVICE_ID_KEY = 'paradise-performance-web-device-id-v1';
const EMPLOYEE_ID_KEY = 'paradise-performance-web-employee-id-v1';
const POLL_MS = 4000;

const statusEl = document.getElementById('recoveryStatus');
const createButton = document.getElementById('recoveryCreate');
const requestCard = document.getElementById('recoveryRequestCard');
const referenceEl = document.getElementById('recoveryReference');
const expiryEl = document.getElementById('recoveryExpiry');
const approvalStatusEl = document.getElementById('recoveryApprovalStatus');
const completeButton = document.getElementById('recoveryComplete');
const successCard = document.getElementById('recoverySuccess');

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  createPerformanceSupabaseOptions(window.localStorage),
);

let pollTimer = null;
let busy = false;

function setStatus(message, kind = 'info') {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.dataset.kind = kind;
}

function setApprovalStatus(message, kind = 'info') {
  if (!approvalStatusEl) return;
  approvalStatusEl.textContent = message;
  approvalStatusEl.dataset.kind = kind;
}

function readRecoveryState() {
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(RECOVERY_STATE_KEY) || 'null');
    if (!parsed || !isRecoveryReference(parsed.requestReference) || !isRecoverySecret(parsed.recoverySecret) || !isRecoveryUuid(parsed.devicePublicId)) return null;
    if (!parsed.expiresAt || Date.parse(parsed.expiresAt) <= Date.now()) return null;
    if (parsed.replacementDeviceId && !isRecoveryUuid(parsed.replacementDeviceId)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeRecoveryState(state) {
  window.sessionStorage.setItem(RECOVERY_STATE_KEY, JSON.stringify(state));
}

function clearRecoveryState() {
  window.sessionStorage.removeItem(RECOVERY_STATE_KEY);
  if (pollTimer) window.clearTimeout(pollTimer);
  pollTimer = null;
}

function renderRequest(state) {
  if (!requestCard || !referenceEl || !expiryEl) return;
  requestCard.hidden = false;
  referenceEl.textContent = state.requestReference;
  expiryEl.textContent = `Expires ${new Date(state.expiresAt).toLocaleString()}`;
}

async function invoke(name, body) {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw error;
  return data;
}

async function requestStatus(state) {
  return invoke('performance-admin-recovery-status', {
    requestReference: state.requestReference,
    recoverySecret: state.recoverySecret,
    devicePublicId: state.devicePublicId,
  });
}

function schedulePoll(state) {
  if (pollTimer) window.clearTimeout(pollTimer);
  pollTimer = window.setTimeout(() => pollApproval(state).catch(() => undefined), POLL_MS);
}

async function pollApproval(state) {
  if (busy || state.replacementDeviceId) return;
  try {
    const result = await requestStatus(state);
    if (result?.status === 'FINALIZED') {
      clearRecoveryState();
      if (requestCard) requestCard.hidden = true;
      if (successCard) successCard.hidden = false;
      setStatus('Recovery is finalized.', 'success');
      return;
    }
    if (result?.status === 'CONSUMED') {
      setApprovalStatus('Recovery exchange was already consumed. If the replacement browser did not finish, request a fresh operator-approved recovery.', 'error');
      if (completeButton) completeButton.hidden = true;
      return;
    }
    if (statusAllowsExchange(result?.status)) {
      setApprovalStatus('Operator approval received. Complete recovery on this same browser.', 'success');
      if (completeButton) completeButton.hidden = false;
      return;
    }
    setApprovalStatus('Awaiting operator approval. Send the recovery reference above—not a secret or enrollment code.', 'info');
    schedulePoll(state);
  } catch {
    setApprovalStatus('Recovery status could not be verified yet. Keep this page open and try again.', 'error');
    schedulePoll(state);
  }
}

async function createRecoveryRequest() {
  if (busy) return;
  busy = true;
  if (createButton) createButton.disabled = true;
  try {
    const recoverySecret = createRecoverySecret();
    const secretHash = await sha256Hex(recoverySecret);
    const devicePublicId = crypto.randomUUID();
    const result = await invoke('performance-admin-recovery-request', { secretHash, devicePublicId });
    if (!isRecoveryReference(result?.requestReference) || !result?.expiresAt) throw new Error('Incomplete recovery request');

    const state = {
      requestReference: result.requestReference,
      recoverySecret,
      devicePublicId,
      expiresAt: result.expiresAt,
      replacementDeviceId: null,
    };
    writeRecoveryState(state);
    renderRequest(state);
    if (createButton) createButton.hidden = true;
    setStatus('Recovery request created. It has not granted access.', 'info');
    setApprovalStatus('Awaiting operator approval. Send the displayed recovery reference only.', 'info');
    schedulePoll(state);
  } catch {
    setStatus('Recovery request could not be created. No access was granted.', 'error');
    if (createButton) createButton.disabled = false;
  } finally {
    busy = false;
  }
}

async function finalizeReplacement(state) {
  const result = await invoke('performance-admin-recovery-finalize', {
    requestReference: state.requestReference,
    newDeviceId: state.replacementDeviceId,
  });
  if (result?.finalized !== true || result?.deviceId !== state.replacementDeviceId) {
    throw new Error('Recovery finalization incomplete');
  }
  clearRecoveryState();
  if (requestCard) requestCard.hidden = true;
  if (successCard) successCard.hidden = false;
  setStatus('Replacement trusted browser enrolled and prior credential lineage revoked.', 'success');
}

async function completeRecovery() {
  if (busy) return;
  const state = readRecoveryState();
  if (!state) {
    setApprovalStatus('This browser no longer has the recovery proof. Create a fresh request.', 'error');
    return;
  }

  busy = true;
  if (completeButton) completeButton.disabled = true;
  try {
    if (state.replacementDeviceId) {
      setApprovalStatus('Finishing security cleanup…', 'info');
      await finalizeReplacement(state);
      return;
    }

    const status = await requestStatus(state);
    if (!statusAllowsExchange(status?.status)) {
      setApprovalStatus('Operator approval is still required before recovery can complete.', 'error');
      return;
    }

    setApprovalStatus('Creating replacement trusted-device credential…', 'info');
    const exchange = await invoke('performance-admin-recovery-redeem', {
      requestReference: state.requestReference,
      recoverySecret: state.recoverySecret,
      devicePublicId: state.devicePublicId,
    });
    if (!exchange?.enrollmentToken) throw new Error('Recovery exchange did not return enrollment credential');

    const enrolled = await redeemTrustedDevice({
      supabase,
      token: exchange.enrollmentToken,
      devicePublicId: state.devicePublicId,
      platform: 'web-test',
      deviceLabel: 'Paradise Performance Web Interim — Admin Recovery',
      appVersion: 'web-interim-v1-recovery',
    });
    if (!isRecoveryUuid(enrolled?.employee?.id) || !isRecoveryUuid(enrolled?.device?.id) || enrolled?.employee?.role !== 'admin') {
      throw new Error('Replacement enrollment did not resolve a designated admin device');
    }

    window.localStorage.setItem(DEVICE_PUBLIC_ID_KEY, state.devicePublicId);
    window.localStorage.setItem(DEVICE_ID_KEY, enrolled.device.id);
    window.localStorage.setItem(EMPLOYEE_ID_KEY, enrolled.employee.id);

    state.replacementDeviceId = enrolled.device.id;
    writeRecoveryState(state);
    setApprovalStatus('Replacement enrolled. Revoking the older credential lineage…', 'info');
    await finalizeReplacement(state);
  } catch {
    const latest = readRecoveryState();
    if (latest?.replacementDeviceId) {
      setApprovalStatus('Replacement enrollment exists, but old-credential cleanup is incomplete. Keep this page open and tap FINISH SECURITY CLEANUP again.', 'error');
      if (completeButton) completeButton.textContent = 'FINISH SECURITY CLEANUP';
    } else {
      setApprovalStatus('Recovery could not complete. Do not enter or share any token; request a fresh recovery if this request was consumed.', 'error');
    }
  } finally {
    busy = false;
    if (completeButton) completeButton.disabled = false;
  }
}

async function boot() {
  if (!statusEl || !createButton || !completeButton) return;
  const state = readRecoveryState();
  if (state) renderRequest(state);

  let session;
  try {
    session = await validateTrustedDeviceSession({ supabase, signOutWhenInvalid: true });
  } catch {
    setStatus('Unable to verify current browser state. Recovery is unavailable until verification succeeds.', 'error');
    return;
  }

  if (state?.replacementDeviceId) {
    if (session.status !== 'READY') {
      setApprovalStatus('Replacement credential is present but cannot be authenticated for finalization. Create a fresh recovery request.', 'error');
      return;
    }
    setStatus('Replacement trusted device is authenticated; final security cleanup is required.', 'info');
    setApprovalStatus('Tap FINISH SECURITY CLEANUP to revoke the older credential lineage.', 'info');
    completeButton.textContent = 'FINISH SECURITY CLEANUP';
    completeButton.hidden = false;
    return;
  }

  if (session.status === 'READY') {
    clearRecoveryState();
    if (requestCard) requestCard.hidden = true;
    setStatus('This browser already has a valid trusted-device session. Recovery is not needed.', 'success');
    return;
  }
  if (session.status === 'UNVERIFIED_TRANSIENT') {
    setStatus('Browser identity cannot be safely verified because the service is temporarily unavailable. Recovery is not opened during an ambiguous outage.', 'error');
    return;
  }

  setStatus('No usable trusted-device session is present in this browser.', 'info');
  if (state) {
    setApprovalStatus('Checking operator approval…', 'info');
    await pollApproval(state);
  } else {
    createButton.hidden = false;
  }
}

createButton?.addEventListener('click', () => createRecoveryRequest());
completeButton?.addEventListener('click', () => completeRecovery());
window.addEventListener('pagehide', () => {
  if (pollTimer) window.clearTimeout(pollTimer);
  pollTimer = null;
});

void boot();

export const PerformanceAdminRecoveryUiInvariants = Object.freeze([
  'recovery proof is held in sessionStorage only and is never displayed',
  'the recovery reference may be displayed because it cannot authorize recovery without browser proof plus operator approval',
  'no enrollment token is displayed, copied, placed in a URL, or persisted by this recovery page',
  'the existing ordinary enrollment redemption creates the replacement trusted-device Auth session',
  'old credential lineage cleanup must finalize before the page declares recovery complete',
]);
