export const PERFORMANCE_SESSION_VERSION = '2026.08.18-performance-session-v1';

export const PerformanceSessionStorageContract = Object.freeze({
  requiredMethods: Object.freeze(['getItem', 'setItem', 'removeItem']),
  invariants: Object.freeze([
    'native builds persist refresh tokens only in OS-protected secure storage',
    'browser/localStorage is not an acceptable production-native refresh-token store',
    'no Supabase secret/service-role key is ever present in the client',
    'device revocation must make the next authorized database call fail closed',
    'a cleared device session requires a new manager enrollment QR rather than a password reset flow',
  ]),
});

function assertSupabase(supabase) {
  if (!supabase?.functions?.invoke || !supabase?.auth?.setSession || !supabase?.auth?.getUser || !supabase?.rpc) {
    throw new Error('A Supabase client with Functions/Auth/RPC support is required');
  }
}

export async function redeemTrustedDevice({
  supabase,
  token,
  devicePublicId,
  platform,
  deviceLabel = null,
  appVersion = null,
}) {
  assertSupabase(supabase);
  if (!token || !devicePublicId || !platform) throw new Error('token, devicePublicId, and platform are required');

  const { data, error } = await supabase.functions.invoke('performance-enrollment-redeem', {
    body: { token, devicePublicId, platform, deviceLabel, appVersion },
  });
  if (error) throw new Error(error.message || 'Enrollment redemption failed');
  if (!data?.session?.accessToken || !data?.session?.refreshToken) throw new Error('Enrollment response did not include a session');

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: data.session.accessToken,
    refresh_token: data.session.refreshToken,
  });
  if (sessionError) throw new Error(sessionError.message || 'Unable to store trusted-device session');

  return Object.freeze({
    version: PERFORMANCE_SESSION_VERSION,
    employee: Object.freeze({ ...data.employee }),
    device: Object.freeze({ ...data.device }),
  });
}

export async function mintEnrollment({ supabase, employeeId, expiresMinutes = 10 }) {
  assertSupabase(supabase);
  const { data, error } = await supabase.functions.invoke('performance-enrollment-mint', {
    body: { employeeId, expiresMinutes },
  });
  if (error) throw new Error(error.message || 'Unable to create enrollment QR');
  return data;
}

export async function revokeTrustedDevice({ supabase, deviceId, reason = 'revoked' }) {
  assertSupabase(supabase);
  const { data, error } = await supabase.functions.invoke('performance-device-revoke', {
    body: { deviceId, reason },
  });
  if (error) throw new Error(error.message || 'Unable to revoke device');
  return data;
}

export async function validateTrustedDeviceSession({ supabase, signOutWhenInvalid = true }) {
  assertSupabase(supabase);
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return Object.freeze({ status: 'NO_SESSION', employeeId: null, role: null });
  }

  const [{ data: employeeId, error: employeeError }, { data: role, error: roleError }] = await Promise.all([
    supabase.rpc('performance_current_employee_id'),
    supabase.rpc('performance_current_role'),
  ]);

  if (employeeError || roleError || !employeeId || !role) {
    if (signOutWhenInvalid && typeof supabase.auth.signOut === 'function') {
      await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
    }
    return Object.freeze({ status: 'REVOKED_OR_UNENROLLED', employeeId: null, role: null });
  }

  return Object.freeze({
    status: 'READY',
    authUserId: userData.user.id,
    employeeId,
    role,
  });
}

export function createPerformanceSupabaseOptions(storage) {
  if (!storage || !PerformanceSessionStorageContract.requiredMethods.every(method => typeof storage[method] === 'function')) {
    throw new Error('A persistent session storage adapter with getItem/setItem/removeItem is required');
  }
  return Object.freeze({
    auth: Object.freeze({
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storage,
    }),
  });
}
