import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createStoreReviewSupabaseOptions,
  requestStoreReviewEnrollment,
} from '../client/performance-store-review-access.mjs';

function reviewClient({ signInData = null, signInError = null, invokeData = null, invokeError = null } = {}) {
  const calls = [];
  const client = {
    auth: {
      async signInWithPassword(credentials) {
        calls.push(['signInWithPassword', { ...credentials }]);
        return {
          data: signInData ?? { session: { access_token: 'review-access-jwt' } },
          error: signInError,
        };
      },
      async signOut(options) {
        calls.push(['signOut', { ...options }]);
        return { error: null };
      },
    },
    functions: {
      async invoke(name, options) {
        calls.push(['invoke', name, structuredClone(options)]);
        return {
          data: invokeData ?? {
            reviewAccess: true,
            token: 'one-time-enrollment-token',
            expiresAt: '2026-08-19T23:00:00.000Z',
            employee: { id: '11111111-1111-4111-8111-111111111111', displayName: 'Store Review', role: 'canvasser' },
          },
          error: invokeError,
        };
      },
    },
  };
  return { client, calls };
}

test('review client is non-persistent and does not auto-refresh', () => {
  const options = createStoreReviewSupabaseOptions();
  assert.deepEqual(options, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
});

test('successful review login mints one ordinary enrollment and signs out locally', async () => {
  const { client, calls } = reviewClient();
  const result = await requestStoreReviewEnrollment({
    reviewClient: client,
    email: ' Reviewer@Example.com ',
    password: 'review-password',
  });

  assert.equal(result.token, 'one-time-enrollment-token');
  assert.equal(result.employee.role, 'canvasser');
  assert.deepEqual(calls.map(call => call[0]), ['signInWithPassword', 'invoke', 'signOut']);
  assert.deepEqual(calls[0][1], { email: 'reviewer@example.com', password: 'review-password' });
  assert.equal(calls[1][1], 'performance-review-enrollment-mint');
  assert.deepEqual(calls[1][2], { body: {} });
  assert.deepEqual(calls[2][1], { scope: 'local' });
});

test('invalid reviewer credentials fail without invoking mint', async () => {
  const { client, calls } = reviewClient({ signInError: new Error('bad password'), signInData: { session: null } });
  await assert.rejects(
    () => requestStoreReviewEnrollment({ reviewClient: client, email: 'review@example.com', password: 'wrong' }),
    /App Review access was not accepted/,
  );
  assert.deepEqual(calls.map(call => call[0]), ['signInWithPassword']);
});

test('mint failure still signs the temporary review gate out', async () => {
  const { client, calls } = reviewClient({ invokeError: new Error('mint failed'), invokeData: null });
  await assert.rejects(
    () => requestStoreReviewEnrollment({ reviewClient: client, email: 'review@example.com', password: 'correct' }),
    /mint failed/,
  );
  assert.deepEqual(calls.map(call => call[0]), ['signInWithPassword', 'invoke', 'signOut']);
});

test('incomplete review mint response is rejected and session is discarded', async () => {
  const { client, calls } = reviewClient({ invokeData: { reviewAccess: true, token: null, employee: null } });
  await assert.rejects(
    () => requestStoreReviewEnrollment({ reviewClient: client, email: 'review@example.com', password: 'correct' }),
    /response was incomplete/,
  );
  assert.equal(calls.at(-1)[0], 'signOut');
});

test('empty credentials never reach Supabase', async () => {
  const { client, calls } = reviewClient();
  await assert.rejects(
    () => requestStoreReviewEnrollment({ reviewClient: client, email: '', password: '' }),
    /Enter the App Review email and password/,
  );
  assert.equal(calls.length, 0);
});
