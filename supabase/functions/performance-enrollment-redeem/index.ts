import {
  PERFORMANCE_EDGE_VERSION,
  adminClient,
  isUuid,
  preflight,
  publicClient,
  randomSecret,
  requirePost,
  responseJson,
  sha256Hex,
} from '../_shared/performance-auth.ts';

const TOKEN_RE = /^[A-Za-z0-9_-]{40,64}$/;
const PLATFORMS = new Set(['ios', 'android', 'web-test', 'shared']);

Deno.serve(async (req: Request) => {
  const options = preflight(req);
  if (options) return options;
  const wrongMethod = requirePost(req);
  if (wrongMethod) return wrongMethod;

  let createdAuthUserId: string | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === 'string' ? body.token.trim() : '';
    const devicePublicId = body?.devicePublicId;
    const platform = typeof body?.platform === 'string' ? body.platform : '';
    const deviceLabel = typeof body?.deviceLabel === 'string' ? body.deviceLabel.trim().slice(0, 120) : null;
    const appVersion = typeof body?.appVersion === 'string' ? body.appVersion.trim().slice(0, 80) : null;

    if (!TOKEN_RE.test(token)) return responseJson({ error: 'INVALID_ENROLLMENT_TOKEN' }, 400);
    if (!isUuid(devicePublicId)) return responseJson({ error: 'INVALID_DEVICE_ID' }, 400);
    if (!PLATFORMS.has(platform)) return responseJson({ error: 'INVALID_PLATFORM' }, 400);

    const admin = adminClient();
    const tokenHash = await sha256Hex(token);
    const now = new Date().toISOString();

    // Cheap preflight. The final RPC repeats every check under a row lock, so this
    // read cannot create a redemption race or weaken one-time-token semantics.
    const { data: enrollment, error: enrollmentError } = await admin
      .from('performance_enrollment_tokens')
      .select('token_hash, employee_id, expires_at, used_at, revoked_at')
      .eq('token_hash', tokenHash)
      .maybeSingle();
    if (enrollmentError) throw enrollmentError;
    if (!enrollment || enrollment.used_at || enrollment.revoked_at || enrollment.expires_at <= now) {
      return responseJson({ error: 'ENROLLMENT_TOKEN_UNAVAILABLE' }, 401);
    }

    const hiddenEmail = `performance-device-${crypto.randomUUID()}@paradise.invalid`;
    const hiddenPassword = randomSecret(48);
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: hiddenEmail,
      password: hiddenPassword,
      email_confirm: true,
      app_metadata: {
        paradise_performance_device: true,
        credential_version: 'device-credential-v1',
      },
    });
    if (createError || !created.user) throw createError ?? new Error('Auth user creation failed');
    createdAuthUserId = created.user.id;

    const { data: finalized, error: finalizeError } = await admin.rpc('performance_finalize_device_enrollment', {
      p_token_hash: tokenHash,
      p_auth_user_id: created.user.id,
      p_device_public_id: devicePublicId,
      p_platform: platform,
      p_device_label: deviceLabel,
    });
    if (finalizeError || !Array.isArray(finalized) || finalized.length !== 1) {
      await admin.auth.admin.deleteUser(created.user.id).catch(() => undefined);
      createdAuthUserId = null;
      return responseJson({ error: 'ENROLLMENT_TOKEN_UNAVAILABLE' }, 409);
    }

    const enrollmentResult = finalized[0];
    if (appVersion) {
      await admin.from('performance_devices').update({ app_version: appVersion }).eq('id', enrollmentResult.device_id);
    }

    const auth = publicClient();
    const { data: signedIn, error: signInError } = await auth.auth.signInWithPassword({
      email: hiddenEmail,
      password: hiddenPassword,
    });
    if (signInError || !signedIn.session) {
      // Mapping is immediately disabled. The consumed QR remains consumed; manager
      // should mint a new QR rather than risking reuse after a partial credential failure.
      await Promise.allSettled([
        admin.from('performance_actor_identities').update({ revoked_at: new Date().toISOString() }).eq('auth_user_id', created.user.id),
        admin.from('performance_devices').update({ revoked_at: new Date().toISOString(), revoked_reason: 'session_issue' }).eq('id', enrollmentResult.device_id),
        admin.auth.admin.updateUserById(created.user.id, { ban_duration: '876000h' }),
      ]);
      return responseJson({ error: 'DEVICE_SESSION_CREATION_FAILED' }, 500);
    }

    createdAuthUserId = null;
    return responseJson({
      version: PERFORMANCE_EDGE_VERSION,
      employee: {
        id: enrollmentResult.employee_id,
        displayName: enrollmentResult.display_name,
        role: enrollmentResult.role,
      },
      device: {
        id: enrollmentResult.device_id,
        publicId: devicePublicId,
        platform,
      },
      session: {
        accessToken: signedIn.session.access_token,
        refreshToken: signedIn.session.refresh_token,
        expiresAt: signedIn.session.expires_at ?? null,
      },
    });
  } catch (error) {
    if (createdAuthUserId) {
      try { await adminClient().auth.admin.deleteUser(createdAuthUserId); } catch { /* best-effort orphan cleanup */ }
    }
    console.error('performance-enrollment-redeem failed', error instanceof Error ? error.message : 'unknown');
    return responseJson({ error: 'ENROLLMENT_REDEEM_FAILED' }, 500);
  }
});
