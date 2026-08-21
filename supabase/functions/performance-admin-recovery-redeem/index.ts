import {
  adminClient,
  isUuid,
  preflight,
  randomSecret,
  requirePost,
  responseJson,
  sha256Hex,
} from '../_shared/performance-auth.ts';

const REFERENCE_RE = /^[A-Za-z0-9_-]{10,24}$/;
const SECRET_RE = /^[A-Za-z0-9_-]{40,64}$/;
const TOKEN_MINUTES = 10;

Deno.serve(async (req: Request) => {
  const options = preflight(req);
  if (options) return options;
  const wrongMethod = requirePost(req);
  if (wrongMethod) return wrongMethod;

  try {
    const body = await req.json().catch(() => ({}));
    const requestReference = typeof body?.requestReference === 'string' ? body.requestReference.trim() : '';
    const recoverySecret = typeof body?.recoverySecret === 'string' ? body.recoverySecret.trim() : '';
    const devicePublicId = body?.devicePublicId;
    if (!REFERENCE_RE.test(requestReference) || !SECRET_RE.test(recoverySecret) || !isUuid(devicePublicId)) {
      return responseJson({ error: 'INVALID_RECOVERY_REDEEM_REQUEST' }, 400);
    }

    const [secretHash, token] = await Promise.all([
      sha256Hex(recoverySecret),
      Promise.resolve(randomSecret(32)),
    ]);
    const tokenHash = await sha256Hex(token);
    const tokenPrefix = token.slice(0, 8);
    const expiresAt = new Date(Date.now() + TOKEN_MINUTES * 60_000).toISOString();

    const admin = adminClient();
    const { data, error } = await admin.rpc('performance_exchange_admin_recovery', {
      p_request_reference: requestReference,
      p_secret_hash: secretHash,
      p_device_public_id: devicePublicId,
      p_token_hash: tokenHash,
      p_token_prefix: tokenPrefix,
      p_token_expires_at: expiresAt,
    });
    if (error || !Array.isArray(data) || data.length !== 1) {
      return responseJson({ error: 'RECOVERY_NOT_APPROVED_OR_UNAVAILABLE' }, 409);
    }

    return responseJson({
      version: '2026.08.21-admin-recovery-redeem-v1',
      enrollmentToken: token,
      enrollmentExpiresAt: expiresAt,
      employee: {
        id: data[0].employee_id,
        displayName: data[0].display_name,
        role: data[0].role,
      },
    });
  } catch (error) {
    console.error('performance-admin-recovery-redeem failed', error instanceof Error ? error.message : 'unknown');
    return responseJson({ error: 'ADMIN_RECOVERY_REDEEM_FAILED' }, 500);
  }
});
