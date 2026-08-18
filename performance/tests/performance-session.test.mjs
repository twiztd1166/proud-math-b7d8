import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPerformanceSupabaseOptions,
  redeemTrustedDevice,
  validateTrustedDeviceSession,
} from '../client/performance-session.mjs';

function mockSupabase(overrides = {}) {
  const calls = { invoke: [], setSession: [], signOut: [], rpc: [] };
  const mock = {
    functions: {
      async invoke(name, args) {
        calls.invoke.push({ name, args });
        return {
          data: {
            session: { accessToken: 'access', refreshToken: 'refresh', expiresAt: 123 },
            employee: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', displayName: 'Test', role: 'canvasser' },
            device: { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', publicId: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1', platform: 'ios' },
          },
          error: null,
        };
      },
    },
    auth: {
      async setSession(value) { calls.setSession.push(value); return { data: {}, error: null }; },
      async getUser() { return { data: { user: { id: '11111111-1111-4111-8111-111111111111' } }, error: null }; },
      async signOut(args) { calls.signOut.push(args); return { error: null }; },
    },
    async rpc(name) {
      calls.rpc.push(name);
      return name === 'performance_current_employee_id'
        ? { data: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', error: null }
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

test('session validation returns READY only when auth user and current Performance mapping both resolve', async () => {
  const { mock } = mockSupabase();
  const result = await validateTrustedDeviceSession({ supabase: mock });
  assert.equal(result.status, 'READY');
  assert.equal(result.employeeId, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1');
  assert.equal(result.role, 'canvasser');
});

test('revoked or unenrolled mapping signs the local session out', async () => {
  const { mock, calls } = mockSupabase({
    rpc: async () => ({ data: null, error: { message: 'revoked' } }),
  });
  const result = await validateTrustedDeviceSession({ supabase: mock });
  assert.equal(result.status, 'REVOKED_OR_UNENROLLED');
  assert.deepEqual(calls.signOut, [{ scope: 'local' }]);
});

test('missing Auth session remains a simple NO_SESSION state', async () => {
  const { mock } = mockSupabase({
    auth: { async getUser() { return { data: { user: null }, error: null }; } },
  });
  const result = await validateTrustedDeviceSession({ supabase: mock });
  assert.deepEqual(result, { status: 'NO_SESSION', employeeId: null, role: null });
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
