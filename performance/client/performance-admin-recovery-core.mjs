export const PERFORMANCE_ADMIN_RECOVERY_CORE_VERSION = '2026.08.21-admin-recovery-core-v1';

const REFERENCE_RE = /^[A-Za-z0-9_-]{10,24}$/;
const SECRET_RE = /^[A-Za-z0-9_-]{40,64}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isRecoveryReference(value) {
  return typeof value === 'string' && REFERENCE_RE.test(value);
}

export function isRecoverySecret(value) {
  return typeof value === 'string' && SECRET_RE.test(value);
}

export function isRecoveryUuid(value) {
  return typeof value === 'string' && UUID_RE.test(value);
}

export function bytesToBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function createRecoverySecret(cryptoApi = globalThis.crypto) {
  if (!cryptoApi?.getRandomValues) throw new Error('Secure browser crypto is required');
  const bytes = new Uint8Array(32);
  cryptoApi.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

export async function sha256Hex(value, cryptoApi = globalThis.crypto) {
  if (!isRecoverySecret(value) || !cryptoApi?.subtle?.digest) throw new Error('Valid recovery secret and Web Crypto are required');
  const digest = await cryptoApi.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export function statusAllowsExchange(status) {
  return status === 'APPROVED';
}

export const PerformanceAdminRecoveryInvariants = Object.freeze([
  'the recovery reference is an identifier, not an enrollment credential',
  'the browser recovery secret is high entropy, remains browser-held, and is never displayed',
  'a request cannot approve itself and cannot choose the employee identity to recover',
  'only an operator-approved request can be exchanged for an ordinary short-lived enrollment token',
  'the ordinary trusted-device redemption path creates the replacement credential',
  'successful finalization revokes older device and actor identities for the recovered employee',
]);
