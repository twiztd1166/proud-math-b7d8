import { createPerformanceSupabaseOptions } from './performance-session.mjs';
import { registerCapacitorSecureStorage } from '../native/capacitor-secure-storage.mjs';

export const PERFORMANCE_NATIVE_SESSION_VERSION = '2026.08.18-native-session-v1';

export function createNativePerformanceSupabaseOptions({ registerPlugin, prefix } = {}) {
  const storage = registerCapacitorSecureStorage(registerPlugin, prefix ? { prefix } : undefined);
  return Object.freeze({
    version: PERFORMANCE_NATIVE_SESSION_VERSION,
    storage,
    supabaseOptions: createPerformanceSupabaseOptions(storage),
  });
}

export const PerformanceNativeSessionInvariants = Object.freeze([
  'the production-native Supabase Auth client receives the OS-protected storage adapter',
  'Supabase session persistence and refresh use the same protected adapter',
  'native Auth never falls back to localStorage',
]);
