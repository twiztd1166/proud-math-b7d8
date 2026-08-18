export const PERFORMANCE_SESSION_VERSION = '2026.08.18-performance-session-v2';

export const PerformanceSessionStorageContract = Object.freeze({
  requiredMethods: Object.freeze(['getItem', 'setItem', 'removeItem']),
  invariants: Object.freeze([
    'native builds persist refresh tokens only in OS-protected secure storage',
    'browser/localStorage is not an acceptable production-native refresh-token store',
    'no Supabase secret/service-role key is ever present in the client',
    'device revocation must make the next authorized database call fail closed',
    'a cleared device session requires a new manager enrollment QR rather than a password reset flow',
    'transient network or Supabase service failure never masquerades as device revocation',
  ]),
});

function assertSupabase(supabase) {
  if (!supabase?.functions?.invoke || !supabase?.auth?.setSession || !supabase?.auth?.getSession || !supabase?.auth?.getUser || !supabase?.rpc) {
    throw new Error('A Supabase client with Functions/Auth/RPC support is required');
  }
}

function text(value) {
  return String(value ?? '').toLowerCase();
}

function numericStatus(error) {
  const status = Number(error?.status ?? error?.statusCode ?? 0);
  return Number.isFinite(status) ? status : 0;
}

function isDefinitiveAuthRejection(error) {
  if (!error) return false;
  const status = numericStatus(error);
  const code = text(error.code);
  const name = text(error.name);
  if (['user_banned', 'session_not_found', 'refresh_token_not_found', 'refresh_token_already_used', 'bad_jwt', 'invalid_credentials', 'user_not_found'].includes(code)) return true;
  if (name.includes('authsessionmissing')) return true;
  return status >= 400 && status < 500 && status !== 408 && status !== 429;
}

function isDefinitiveDatabaseAuthRejection(error) {
  if (!error) return false;
  const status = numericStatus(error);
  const code = String(error.code ?? '').toUpperCase();
  return status === 401 || status === 403 || code === '42501' || code.startsWith('28') || ['PGRST301', 'PGRST302', 'PGRST303'].includes(code);
}

function unverified(localSession, stage, error = null) {
  return Object.freeze({
    status: 'UNVERIFIED_TRANSIENT',
    authUserId: localSession?.user?.id ?? null,
    employeeId: null,
    role: null,
    stage,
    errorCode: error?.code ? String(error.code).slice(0, 80) : null,
  });
}

async function signOutLocalWhenRequested(supabase, signOutWhenInvalid) {
  if (signOutWhenInvalid && typeof supabase.auth.signOut === 'function') {
    await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
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

  let localSession;
  try {
    const { data, error } = await supabase.auth.getSession();
    localSession = data?.session ?? null;
    if (!localSession) return Object.freeze({ status: 'NO_SESSION', employeeId: null, role: null });
    if (error) return unverified(localSession, 'LOCAL_SESSION', error);
  } catch (error) {
    return Object.freeze({ status: 'NO_SESSION', employeeId: null, role: null });
  }

  let userData;
  let userError;
  try {
    ({ data: userData, error: userError } = await supabase.auth.getUser());
  } catch (error) {
    return unverified(localSession, 'AUTH_USER', error);
  }

  if (userError) {
    if (!isDefinitiveAuthRejection(userError)) return unverified(localSession, 'AUTH_USER', userError);
    await signOutLocalWhenRequested(supabase, signOutWhenInvalid);
    return Object.freeze({ status: 'REVOKED_OR_UNENROLLED', employeeId: null, role: null });
  }
  if (!userData?.user) {
    await signOutLocalWhenRequested(supabase, signOutWhenInvalid);
    return Object.freeze({ status: 'REVOKED_OR_UNENROLLED', employeeId: null, role: null });
  }

  let employeeResult;
  let roleResult;
  try {
    [employeeResult, roleResult] = await Promise.all([
      supabase.rpc('performance_current_employee_id'),
      supabase.rpc('performance_current_role'),
    ]);
  } catch (error) {
    return unverified(localSession, 'PERFORMANCE_MAPPING', error);
  }

  const employeeError = employeeResult?.error;
  const roleError = roleResult?.error;
  if (employeeError || roleError) {
    const error = employeeError || roleError;
    if (!isDefinitiveDatabaseAuthRejection(error)) return unverified(localSession, 'PERFORMANCE_MAPPING', error);
    await signOutLocalWhenRequested(supabase, signOutWhenInvalid);
    return Object.freeze({ status: 'REVOKED_OR_UNENROLLED', employeeId: null, role: null });
  }

  const employeeId = employeeResult?.data;
  const role = roleResult?.data;
  if (!employeeId || !role) {
    await signOutLocalWhenRequested(supabase, signOutWhenInvalid);
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
