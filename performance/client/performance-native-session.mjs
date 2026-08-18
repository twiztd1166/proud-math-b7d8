import { createPerformanceSupabaseOptions, validateTrustedDeviceSession } from './performance-session.mjs';
import { registerCapacitorSecureStorage } from '../native/capacitor-secure-storage.mjs';

export const PERFORMANCE_NATIVE_SESSION_VERSION = '2026.08.18-native-session-v4';
export const PERFORMANCE_INVALID_SESSION_STATES = Object.freeze(['NO_SESSION', 'REVOKED_OR_UNENROLLED']);
export const PERFORMANCE_NATIVE_INSTALL_MARKER_KEY = 'paradise-performance-native-install-v1';

export function createNativePerformanceSupabaseOptions({ registerPlugin, prefix } = {}) {
  const storage = registerCapacitorSecureStorage(registerPlugin, prefix ? { prefix } : undefined);
  return Object.freeze({
    version: PERFORMANCE_NATIVE_SESSION_VERSION,
    storage,
    supabaseOptions: createPerformanceSupabaseOptions(storage),
  });
}

export async function ensureNativeInstallEnrollmentBoundary({
  markerStorage,
  supabase,
  secureStorage,
  bindingKeys = [],
  markerKey = PERFORMANCE_NATIVE_INSTALL_MARKER_KEY,
}) {
  for (const method of ['getItem', 'setItem']) {
    if (typeof markerStorage?.[method] !== 'function') throw new Error(`Install marker storage.${method} is required`);
  }
  if (typeof secureStorage?.removeItem !== 'function') throw new Error('Secure storage removeItem is required');
  if (typeof supabase?.auth?.getSession !== 'function' || typeof supabase?.auth?.signOut !== 'function') {
    throw new Error('Supabase Auth getSession/signOut support is required');
  }
  if (!Array.isArray(bindingKeys)) throw new Error('bindingKeys must be an array');

  const existingMarker = await markerStorage.getItem(markerKey);
  if (existingMarker) {
    return Object.freeze({ status: 'EXISTING_INSTALL', clearedPersistedSession: false });
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(`Unable to inspect protected session at fresh-install boundary: ${error.message || error.code || 'unknown error'}`);
  const hadPersistedSession = Boolean(data?.session);
  if (hadPersistedSession) {
    const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
    if (signOutError) throw new Error(`Unable to clear protected session at fresh-install boundary: ${signOutError.message || signOutError.code || 'unknown error'}`);
  }

  for (const key of bindingKeys) {
    if (typeof key !== 'string' || !key) throw new Error('Fresh-install binding keys must be non-empty strings');
    await secureStorage.removeItem(key);
  }
  await markerStorage.setItem(markerKey, 'installed');

  return Object.freeze({
    status: hadPersistedSession ? 'FRESH_INSTALL_REENROLL_REQUIRED' : 'FIRST_INSTALL',
    clearedPersistedSession: hadPersistedSession,
  });
}

export async function validateNativePerformanceSession({
  supabase,
  locationBridge,
  signOutWhenInvalid = true,
}) {
  if (typeof locationBridge?.ensureStoppedWhenNoActiveShift !== 'function') {
    throw new Error('Native location safety bridge is required');
  }

  const state = await validateTrustedDeviceSession({ supabase, signOutWhenInvalid });
  if (PERFORMANCE_INVALID_SESSION_STATES.includes(state.status)) {
    try {
      await locationBridge.ensureStoppedWhenNoActiveShift();
    } catch (error) {
      const detail = String(error?.message || error || 'unknown error').slice(0, 240);
      throw new Error(`Invalid trusted-device session could not force native location stopped: ${detail}`);
    }
  }
  return state;
}

export const PerformanceNativeSessionInvariants = Object.freeze([
  'the production-native Supabase Auth client receives the OS-protected storage adapter',
  'Supabase session persistence and refresh use the same protected adapter',
  'native Auth never falls back to localStorage',
  'a fresh app-data install boundary clears any protected session that survived uninstall and requires manager re-enrollment',
  'the non-secret install marker may live in ordinary app storage but Auth/session secrets may not',
  'NO_SESSION forces orphan native location tracking stopped before enrollment UI is shown',
  'REVOKED_OR_UNENROLLED forces native location tracking stopped before the invalid session is surfaced',
  'UNVERIFIED_TRANSIENT preserves an already-running native location session while server validation is temporarily unavailable',
  'failure to stop native location after definitive invalid-session detection is a visible hard error, never a silent cleanup failure',
]);
