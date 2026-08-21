import { createClient } from '@supabase/supabase-js';
import { createPerformanceSupabaseOptions, redeemTrustedDevice } from './performance-session.mjs';
import { isUuid } from '../shared/performance-events.mjs';

const SUPABASE_URL = 'https://taxlrlfsobtnbasjcnuf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_3e755MdDisPBQzzGrBVBIA_gy4uqNqr';
const DEVICE_PUBLIC_ID_KEY = 'paradise-performance-web-device-public-id-v1';
const DEVICE_ID_KEY = 'paradise-performance-web-device-id-v1';
const EMPLOYEE_ID_KEY = 'paradise-performance-web-employee-id-v1';
const STORE_VERSION = 'web-interim-v1';

function base64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function ephemeralPassword() {
  const bytes = new Uint8Array(48);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

function safeMessage(error) {
  return String(error?.message || error || 'Unknown error').slice(0, 220);
}

const form = document.getElementById('firstAdminBootstrapForm');
const status = document.getElementById('firstAdminBootstrapStatus');
const submit = document.getElementById('firstAdminBootstrapSubmit');

function setStatus(message, kind = 'info') {
  if (!status) return;
  status.textContent = message;
  status.dataset.kind = kind;
}

async function provisionAndEnroll({ email, proof }) {
  const bootstrapClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const password = ephemeralPassword();

  const { data: provisioned, error: provisionError } = await bootstrapClient.functions.invoke(
    'performance-first-manager-bootstrap-provision',
    { body: { email, proof, ephemeralPassword: password } },
  );
  if (provisionError || provisioned?.provisioned !== true) {
    throw new Error(provisionError?.message || provisioned?.error || 'First-admin proof was not accepted');
  }

  const { error: signInError } = await bootstrapClient.auth.signInWithPassword({ email, password });
  if (signInError) throw new Error(signInError.message || 'Temporary bootstrap sign-in failed');

  let enrollment;
  try {
    const { data, error } = await bootstrapClient.functions.invoke('performance-first-manager-bootstrap-mint', { body: {} });
    if (error || !data?.token) throw new Error(error?.message || data?.error || 'First-manager bootstrap mint failed');
    enrollment = data;
  } finally {
    await bootstrapClient.auth.signOut({ scope: 'local' }).catch(() => undefined);
  }

  const trustedClient = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    createPerformanceSupabaseOptions(window.localStorage),
  );
  let devicePublicId = window.localStorage.getItem(DEVICE_PUBLIC_ID_KEY);
  if (!isUuid(devicePublicId)) devicePublicId = crypto.randomUUID();

  const redeemed = await redeemTrustedDevice({
    supabase: trustedClient,
    token: enrollment.token,
    devicePublicId,
    platform: 'web-test',
    deviceLabel: 'Paradise Performance Web Interim — First Admin Test',
    appVersion: STORE_VERSION,
  });
  if (!isUuid(redeemed?.employee?.id) || !isUuid(redeemed?.device?.id) || redeemed?.employee?.role !== 'admin') {
    await trustedClient.auth.signOut({ scope: 'local' }).catch(() => undefined);
    throw new Error('Trusted-device redemption did not return the expected admin binding');
  }

  window.localStorage.setItem(DEVICE_PUBLIC_ID_KEY, devicePublicId);
  window.localStorage.setItem(DEVICE_ID_KEY, redeemed.device.id);
  window.localStorage.setItem(EMPLOYEE_ID_KEY, redeemed.employee.id);
  return redeemed;
}

form?.addEventListener('submit', async event => {
  event.preventDefault();
  const emailInput = document.getElementById('firstAdminEmail');
  const proofInput = document.getElementById('firstAdminProof');
  const email = String(emailInput?.value || '').trim().toLowerCase();
  const proof = String(proofInput?.value || '').trim();
  if (proofInput) proofInput.value = '';

  if (!email || !proof) {
    setStatus('Enter the authorized email and the one-time proof from the separate Paradise email.', 'error');
    return;
  }

  if (submit) submit.disabled = true;
  setStatus('Verifying the one-time proof and creating the first trusted admin browser…');
  try {
    const result = await provisionAndEnroll({ email, proof });
    setStatus(`Trusted admin browser ready for ${result.employee.displayName}. Opening Paradise Performance…`, 'success');
    window.setTimeout(() => window.location.assign('./index.html'), 700);
  } catch (error) {
    setStatus(`Bootstrap did not complete. ${safeMessage(error)} Do not retry an already-consumed proof; issue a fresh proof if required.`, 'error');
    if (submit) submit.disabled = false;
  }
});

export const FirstAdminBootstrapBrowserInvariants = Object.freeze([
  'the plaintext out-of-band proof exists only in the authorized recipient inbox and transient browser memory',
  'the browser generates the temporary Auth password locally and never stores or displays it',
  'temporary bootstrap Auth uses non-persistent Supabase session settings',
  'the proof-gated server creates the temporary Auth user through supported Supabase Auth Admin APIs',
  'the existing bootstrap mint disables the temporary Auth identity before handing off an enrollment token',
  'the final browser session is created only by ordinary trusted-device enrollment redemption',
  'this path is first-admin controlled testing only and does not authorize employee rollout',
]);
