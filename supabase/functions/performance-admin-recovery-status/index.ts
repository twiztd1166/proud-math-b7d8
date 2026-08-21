import {
  adminClient,
  isUuid,
  preflight,
  requirePost,
  responseJson,
  sha256Hex,
} from '../_shared/performance-auth.ts';

const REFERENCE_RE = /^[A-Za-z0-9_-]{10,24}$/;
const SECRET_RE = /^[A-Za-z0-9_-]{40,64}$/;

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
      return responseJson({ error: 'INVALID_RECOVERY_STATUS_REQUEST' }, 400);
    }

    const secretHash = await sha256Hex(recoverySecret);
    const admin = adminClient();
    const { data: recovery, error } = await admin
      .from('performance_admin_recovery_requests')
      .select('request_reference,secret_hash,requested_device_public_id,expires_at,approved_at,consumed_at,finalized_at,revoked_at')
      .eq('request_reference', requestReference)
      .maybeSingle();
    if (error) throw error;
    if (!recovery || recovery.secret_hash !== secretHash || recovery.requested_device_public_id !== devicePublicId) {
      return responseJson({ error: 'RECOVERY_REQUEST_NOT_FOUND' }, 404);
    }
    if (recovery.revoked_at || recovery.expires_at <= new Date().toISOString()) {
      return responseJson({ status: 'EXPIRED', expiresAt: recovery.expires_at }, 410);
    }

    let status = 'PENDING_OPERATOR_APPROVAL';
    if (recovery.finalized_at) status = 'FINALIZED';
    else if (recovery.consumed_at) status = 'CONSUMED';
    else if (recovery.approved_at) status = 'APPROVED';

    return responseJson({
      version: '2026.08.21-admin-recovery-status-v1',
      status,
      expiresAt: recovery.expires_at,
    });
  } catch (error) {
    console.error('performance-admin-recovery-status failed', error instanceof Error ? error.message : 'unknown');
    return responseJson({ error: 'ADMIN_RECOVERY_STATUS_FAILED' }, 500);
  }
});
