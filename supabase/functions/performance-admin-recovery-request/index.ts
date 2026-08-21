import {
  adminClient,
  isUuid,
  preflight,
  randomSecret,
  requirePost,
  responseJson,
} from '../_shared/performance-auth.ts';

const REQUEST_TTL_MINUTES = 15;
const MAX_PENDING_REQUESTS = 20;
const SECRET_HASH_RE = /^[0-9a-f]{64}$/;

Deno.serve(async (req: Request) => {
  const options = preflight(req);
  if (options) return options;
  const wrongMethod = requirePost(req);
  if (wrongMethod) return wrongMethod;

  try {
    const body = await req.json().catch(() => ({}));
    const secretHash = typeof body?.secretHash === 'string' ? body.secretHash.trim().toLowerCase() : '';
    const devicePublicId = body?.devicePublicId;
    if (!SECRET_HASH_RE.test(secretHash) || !isUuid(devicePublicId)) {
      return responseJson({ error: 'INVALID_RECOVERY_REQUEST' }, 400);
    }

    const admin = adminClient();
    const now = new Date();
    const nowIso = now.toISOString();
    const expiresAt = new Date(now.valueOf() + REQUEST_TTL_MINUTES * 60_000).toISOString();

    // This endpoint deliberately has no employee selector and no approval capability.
    // It only records browser proof-of-possession material for later operator approval.
    const { count: recentSameDevice, error: recentError } = await admin
      .from('performance_admin_recovery_requests')
      .select('id', { count: 'exact', head: true })
      .eq('requested_device_public_id', devicePublicId)
      .is('revoked_at', null)
      .gte('requested_at', new Date(now.valueOf() - 60_000).toISOString());
    if (recentError) throw recentError;
    if ((recentSameDevice ?? 0) > 0) {
      return responseJson({ error: 'RECOVERY_REQUEST_RATE_LIMITED' }, 429);
    }

    const { count: pendingCount, error: countError } = await admin
      .from('performance_admin_recovery_requests')
      .select('id', { count: 'exact', head: true })
      .is('consumed_at', null)
      .is('finalized_at', null)
      .is('revoked_at', null)
      .gt('expires_at', nowIso);
    if (countError) throw countError;
    if ((pendingCount ?? 0) >= MAX_PENDING_REQUESTS) {
      return responseJson({ error: 'RECOVERY_REQUEST_CAPACITY_REACHED' }, 429);
    }

    const requestReference = randomSecret(9);
    const { error: insertError } = await admin
      .from('performance_admin_recovery_requests')
      .insert({
        request_reference: requestReference,
        secret_hash: secretHash,
        requested_device_public_id: devicePublicId,
        expires_at: expiresAt,
      });
    if (insertError) throw insertError;

    return responseJson({
      version: '2026.08.21-admin-recovery-request-v1',
      status: 'PENDING_OPERATOR_APPROVAL',
      requestReference,
      expiresAt,
    });
  } catch (error) {
    console.error('performance-admin-recovery-request failed', error instanceof Error ? error.message : 'unknown');
    return responseJson({ error: 'ADMIN_RECOVERY_REQUEST_FAILED' }, 500);
  }
});
