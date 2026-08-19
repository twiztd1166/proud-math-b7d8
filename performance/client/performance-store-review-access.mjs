export const PARADISE_STORE_REVIEW_ACCESS_VERSION = '2026.08.19-store-review-access-v1';

function text(value) {
  return String(value ?? '').trim();
}

function assertReviewClient(client) {
  if (!client?.auth?.signInWithPassword || !client?.auth?.signOut || !client?.functions?.invoke) {
    throw new Error('A non-persistent Supabase review client is required');
  }
}

export function createStoreReviewSupabaseOptions() {
  return Object.freeze({
    auth: Object.freeze({
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    }),
  });
}

export async function requestStoreReviewEnrollment({ reviewClient, email, password }) {
  assertReviewClient(reviewClient);
  const reviewEmail = text(email).toLowerCase();
  const reviewPassword = String(password ?? '');
  if (!reviewEmail || !reviewEmail.includes('@') || reviewPassword.length < 1) {
    throw new Error('Enter the App Review email and password');
  }

  let signedIn = false;
  try {
    const { data: signInData, error: signInError } = await reviewClient.auth.signInWithPassword({
      email: reviewEmail,
      password: reviewPassword,
    });
    if (signInError || !signInData?.session?.access_token) {
      throw new Error('App Review access was not accepted');
    }
    signedIn = true;

    const { data, error } = await reviewClient.functions.invoke('performance-review-enrollment-mint', { body: {} });
    if (error) throw new Error(error.message || 'Unable to prepare App Review enrollment');
    if (data?.reviewAccess !== true || !data?.token || !data?.employee?.id) {
      throw new Error('App Review enrollment response was incomplete');
    }

    return Object.freeze({
      version: PARADISE_STORE_REVIEW_ACCESS_VERSION,
      token: String(data.token),
      expiresAt: data.expiresAt ?? null,
      employee: Object.freeze({ ...data.employee }),
    });
  } finally {
    if (signedIn) await reviewClient.auth.signOut({ scope: 'local' }).catch(() => undefined);
  }
}

export const ParadiseStoreReviewAccessInvariants = Object.freeze([
  'review credentials use a separate non-persistent Supabase client and are never written to trusted-device secure storage',
  'the reusable store-review account has no Performance actor identity and cannot call ordinary manager/admin Performance APIs',
  'successful review login mints a fresh ordinary short-lived one-time enrollment for one synthetic canvasser only',
  'the temporary review-gate session signs out before trusted-device redemption begins',
  'the resulting ongoing session is the normal hidden device-bound trusted-device session',
  'no production employee/customer data or reusable enrollment token is part of store review access',
]);
