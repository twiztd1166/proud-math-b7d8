import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ensureNativeInstallEnrollmentBoundary,
  validateNativePerformanceSession,
} from '../client/performance-native-session.mjs';

const employeeId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
const authUserId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1';

function supabaseMock({
  localSession = true,
  user = { id: authUserId },
  userError = null,
  employee = employeeId,
  role = 'canvasser',
  rpcError = null,
} = {}) {
  const calls = { signOut: 0, rpc: [], getSession: 0 };
  return {
    calls,
    functions: { async invoke() { return { data: null, error: null }; } },
    auth: {
      async getSession() {
        calls.getSession += 1;
        return { data: { session: localSession ? { user: { id: authUserId }, access_token: 'local' } : null }, error: null };
      },
      async getUser() { return { data: { user }, error: userError }; },
      async setSession() { return { error: null }; },
      async signOut() { calls.signOut += 1; return { error: null }; },
    },
    async rpc(name) {
      calls.rpc.push(name);
      if (rpcError) return { data: null, error: rpcError };
      if (name === 'performance_current_employee_id') return { data: employee, error: null };
      if (name === 'performance_current_role') return { data: role, error: null };
      return { data: null, error: { message: 'unexpected rpc' } };
    },
  };
}

function locationBridgeMock({ fail = false } = {}) {
  const calls = { stop: 0 };
  return {
    calls,
    async ensureStoppedWhenNoActiveShift() {
      calls.stop += 1;
      if (fail) throw new Error('native stop failed');
      return { state: 'STOPPED' };
    },
  };
}

function installStorageMock(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    async getItem(key) { return values.get(key) ?? null; },
    async setItem(key, value) { values.set(key, value); },
  };
}

function secureStorageMock() {
  const calls = { remove: [] };
  return {
    calls,
    async removeItem(key) { calls.remove.push(key); },
  };
}

test('READY trusted-device session does not stop active native location', async () => {
  const supabase = supabaseMock();
  const locationBridge = locationBridgeMock();
  const state = await validateNativePerformanceSession({ supabase, locationBridge });
  assert.equal(state.status, 'READY');
  assert.equal(state.employeeId, employeeId);
  assert.equal(locationBridge.calls.stop, 0);
  assert.equal(supabase.calls.signOut, 0);
});

test('NO_SESSION forces orphan native tracking stopped', async () => {
  const supabase = supabaseMock({ localSession: false });
  const locationBridge = locationBridgeMock();
  const state = await validateNativePerformanceSession({ supabase, locationBridge });
  assert.equal(state.status, 'NO_SESSION');
  assert.equal(locationBridge.calls.stop, 1);
});

test('revoked or unenrolled session signs out locally and forces native tracking stopped', async () => {
  const supabase = supabaseMock({ employee: null, role: null });
  const locationBridge = locationBridgeMock();
  const state = await validateNativePerformanceSession({ supabase, locationBridge });
  assert.equal(state.status, 'REVOKED_OR_UNENROLLED');
  assert.equal(supabase.calls.signOut, 1);
  assert.equal(locationBridge.calls.stop, 1);
});

test('transient Auth validation outage preserves active native tracking and local session', async () => {
  const supabase = supabaseMock({
    user: null,
    userError: { name: 'AuthRetryableFetchError', code: 'unexpected_failure', status: 503 },
  });
  const locationBridge = locationBridgeMock();
  const state = await validateNativePerformanceSession({ supabase, locationBridge });
  assert.equal(state.status, 'UNVERIFIED_TRANSIENT');
  assert.equal(locationBridge.calls.stop, 0);
  assert.equal(supabase.calls.signOut, 0);
});

test('transient Data API validation outage preserves active native tracking and local session', async () => {
  const supabase = supabaseMock({ rpcError: { code: 'PGRST000', message: 'connection unavailable' } });
  const locationBridge = locationBridgeMock();
  const state = await validateNativePerformanceSession({ supabase, locationBridge });
  assert.equal(state.status, 'UNVERIFIED_TRANSIENT');
  assert.equal(locationBridge.calls.stop, 0);
  assert.equal(supabase.calls.signOut, 0);
});

test('invalid-session native stop failure is a hard visible error', async () => {
  const supabase = supabaseMock({ employee: null, role: null });
  const locationBridge = locationBridgeMock({ fail: true });
  await assert.rejects(
    () => validateNativePerformanceSession({ supabase, locationBridge }),
    /could not force native location stopped: native stop failed/,
  );
  assert.equal(supabase.calls.signOut, 1);
  assert.equal(locationBridge.calls.stop, 1);
});

test('native session validation requires an explicit location safety bridge', async () => {
  await assert.rejects(
    () => validateNativePerformanceSession({ supabase: supabaseMock(), locationBridge: null }),
    /Native location safety bridge is required/,
  );
});

test('existing install marker leaves protected trusted-device session untouched', async () => {
  const markerStorage = installStorageMock({ 'paradise-performance-native-install-v1': 'installed' });
  const secureStorage = secureStorageMock();
  const supabase = supabaseMock({ localSession: true });
  const result = await ensureNativeInstallEnrollmentBoundary({
    markerStorage,
    secureStorage,
    supabase,
    bindingKeys: ['employee', 'device'],
  });
  assert.equal(result.status, 'EXISTING_INSTALL');
  assert.equal(supabase.calls.getSession, 0);
  assert.equal(supabase.calls.signOut, 0);
  assert.deepEqual(secureStorage.calls.remove, []);
});

test('first install with no protected session establishes marker and clears stale binding keys', async () => {
  const markerStorage = installStorageMock();
  const secureStorage = secureStorageMock();
  const supabase = supabaseMock({ localSession: false });
  const result = await ensureNativeInstallEnrollmentBoundary({
    markerStorage,
    secureStorage,
    supabase,
    bindingKeys: ['employee', 'device', 'public-id'],
  });
  assert.equal(result.status, 'FIRST_INSTALL');
  assert.equal(result.clearedPersistedSession, false);
  assert.equal(supabase.calls.signOut, 0);
  assert.deepEqual(secureStorage.calls.remove, ['employee', 'device', 'public-id']);
  assert.equal(markerStorage.values.get('paradise-performance-native-install-v1'), 'installed');
});

test('fresh app-data boundary clears protected session surviving uninstall and requires re-enrollment', async () => {
  const markerStorage = installStorageMock();
  const secureStorage = secureStorageMock();
  const supabase = supabaseMock({ localSession: true });
  const result = await ensureNativeInstallEnrollmentBoundary({
    markerStorage,
    secureStorage,
    supabase,
    bindingKeys: ['employee', 'device', 'public-id'],
  });
  assert.equal(result.status, 'FRESH_INSTALL_REENROLL_REQUIRED');
  assert.equal(result.clearedPersistedSession, true);
  assert.equal(supabase.calls.signOut, 1);
  assert.deepEqual(secureStorage.calls.remove, ['employee', 'device', 'public-id']);
  assert.equal(markerStorage.values.get('paradise-performance-native-install-v1'), 'installed');
});
