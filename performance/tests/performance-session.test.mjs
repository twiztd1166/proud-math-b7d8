import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPerformanceSupabaseOptions,
  redeemTrustedDevice,
  validateTrustedDeviceSession,
} from '../client/performance-session.mjs';

const authUserId = '11111111-1111-4111-8111-111111111111';
const employeeId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';

function mockSupabase(overrides = {}) {
  const calls = { invoke: [], setSession: [], signOut: [], rpc: [], getSession: 0, getUser: 0 };
  const mock = {
    functions: {
      async invoke(name, args) {
        calls.invoke.push({ name, args });
        return {
          data: {
            session: { accessToken: 'access', refreshToken: 'refresh', expiresAt: 123 },
            employee: { id: employeeId, displayName: 'Test', role: 'canvasser' },
            device: { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', publicId: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1', platform: 'ios' },
          },
          error: null,
        };
      },
    },
    auth: {
      async setSession(value) { calls.setSession.push(value); return { data: {}, error: null }; },
      async getSession() {
        calls.getSession += 1;
        return { data: { session: { user: { id: authUserId }, access_token: 'local-access' } }, error: null };
      },
      async getUser() {
        calls.getUser += 1;
        return { data: { user: { id: authUserId } }, error: null };
      },
      async signOut(args) { calls.signOut.push(args); return { error: null }; },
    },
    async rpc(name) {
      calls.rpc.push(name);
      return name === 'performance_current_employee_id'
        ? { data: employeeId, error: null }
        : { data: 'canvasser', error: null };
    },
  };
  Object.assign(mock.functions, overrides.functions ?? {});
  Object.assign(mock.auth, overrides.auth ?? {});
  if (overrides.rpc) mock.rpc = overrides.rpc;
  return { mock, calls };
}

test('redeemTrustedDevice exchanges QR for normal Supabase session without exposing hidden credentials', async () => {
  const { mock, calls } = mockSupabase();
  const result = await redeemTrustedDevice({
    supabase: mock,
    token: 'high-entropy-token',
    devicePublicId: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
    platform: 'ios',
    deviceLabel: 'Test iPhone',
    appVersion: 'v1',
  });
  assert.equal(calls.invoke[0].name, 'performance-enrollment-redeem');
  assert.deepEqual(calls.setSession[0], { access_token: 'access', refresh_token: 'refresh' });
  assert.equal(result.employee.role, 'canvasser');
  assert.equal('email' in result, false);
  assert.equal('password' in result, false);
});

test('session validation returns READY only when local session, auth user, and current Performance mapping resolve', async () => {
  const { mock } = mockSupabase();
  const result = await validateTrustedDeviceSession({ supabase: mock });
  assert.equal(result.status, 'READY');
  assert.equal(result.employeeId, employeeId);
  assert.equal(result.role, 'canvasser');
});

test('missing Performance mapping is definitive revoke/unenrolled and signs the local session out', async () => {
  const { mock, calls } = mockSupabase({
    rpc: async () => ({ data: null, error: null }),
  });
  const result = await validateTrustedDeviceSession({ supabase: mock });
  assert.equal(result.status, 'REVOKED_OR_UNENROLLED');
  assert.deepEqual(calls.signOut, [{ scope: 'local' }]);
});

test('explicit invalid Auth response is definitive and signs the local session out', async () => {
  const { mock, calls } = mockSupabase({
    auth: {
      async getUser() {
        calls.getUser += 1;
        return { data: { user: null }, error: { name: 'AuthApiError', code: 'bad_jwt', status: 401 } };
      },
    },
  });
  const result = await validateTrustedDeviceSession({ supabase: mock });
  assert.equal(result.status, 'REVOKED_OR_UNENROLLED');
  assert.deepEqual(calls.signOut, [{ scope: 'local' }]);
});

test('missing local Auth session remains a simple NO_SESSION state without a server call', async () => {
  const { mock, calls } = mockSupabase({
    auth: { async getSession() { calls.getSession += 1; return { data: { session: null }, error: null }; } },
  });
  const result = await validateTrustedDeviceSession({ supabase: mock });
  assert.deepEqual(result, { status: 'NO_SESSION', employeeId: null, role: null });
  assert.equal(calls.getUser, 0);
  assert.equal(calls.signOut.length, 0);
});

test('retryable Auth service or network failure preserves the local trusted session as UNVERIFIED_TRANSIENT', async () => {
  const { mock, calls } = mockSupabase({
    auth: {
      async getUser() {
        calls.getUser += 1;
        return { data: { user: null }, error: { name: 'AuthRetryableFetchError', code: 'unexpected_failure', status: 503 } };
      },
    },
  });
  const result = await validateTrustedDeviceSession({ supabase: mock });
  assert.equal(result.status, 'UNVERIFIED_TRANSIENT');
  assert.equal(result.authUserId, authUserId);
  assert.equal(result.stage, 'AUTH_USER');
  assert.equal(calls.signOut.length, 0);
});

test('transient Data API mapping failure preserves local session instead of fabricating revocation', async () => {
  const { mock, calls } = mockSupabase({
    rpc: async name => {
      calls.rpc.push(name);
      return { data: null, error: { code: 'PGRST000', message: 'database connection unavailable' } };
    },
  });
  const result = await validateTrustedDeviceSession({ supabase: mock });
  assert.equal(result.status, 'UNVERIFIED_TRANSIENT');
  assert.equal(result.stage, 'PERFORMANCE_MAPPING');
  assert.equal(calls.signOut.length, 0);
});

test('definitive Data API authorization rejection signs the local session out', async () => {
  const { mock, calls } = mockSupabase({
    rpc: async name => {
      calls.rpc.push(name);
      return { data: null, error: { code: 'PGRST301', status: 401, message: 'invalid jwt' } };
    },
  });
  const result = await validateTrustedDeviceSession({ supabase: mock });
  assert.equal(result.status, 'REVOKED_OR_UNENROLLED');
  assert.deepEqual(calls.signOut, [{ scope: 'local' }]);
});

test('production session options require explicit persistent storage adapter', () => {
  assert.throws(() => createPerformanceSupabaseOptions(null));
  const storage = {
    async getItem() { return null; },
    async setItem() {},
    async removeItem() {},
  };
  const options = createPerformanceSupabaseOptions(storage);
  assert.equal(options.auth.persistSession, true);
  assert.equal(options.auth.autoRefreshToken, true);
  assert.equal(options.auth.detectSessionInUrl, false);
  assert.equal(options.auth.storage, storage);
});
