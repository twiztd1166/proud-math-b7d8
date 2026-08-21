import {
  authenticatePerformanceActor,
  isUuid,
  preflight,
  requirePost,
  responseJson,
} from '../_shared/performance-auth.ts';

const REFERENCE_RE = /^[A-Za-z0-9_-]{10,24}$/;
const LONG_BAN_DURATION = '876000h';
const AUTHORIZED_TEST_EMPLOYEE_IDS = new Set([
  'a6eb5ecc-ca82-4b83-94f3-5a0a534e3f64',
  'c10e9f21-e71e-4385-ab8b-855da0a506a3',
]);

Deno.serve(async (req: Request) => {
  const options = preflight(req);
  if (options) return options;
  const wrongMethod = requirePost(req);
  if (wrongMethod) return wrongMethod;

  try {
    const { actor, admin } = await authenticatePerformanceActor(req);
    if (actor.role !== 'admin' || !AUTHORIZED_TEST_EMPLOYEE_IDS.has(actor.employeeId)) {
      return responseJson({ error: 'DESIGNATED_ADMIN_RECOVERY_REQUIRED' }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const requestReference = typeof body?.requestReference === 'string' ? body.requestReference.trim() : '';
    const newDeviceId = body?.newDeviceId;
    if (!REFERENCE_RE.test(requestReference) || !isUuid(newDeviceId)) {
      return responseJson({ error: 'INVALID_RECOVERY_FINALIZE_REQUEST' }, 400);
    }

    const { data, error } = await admin.rpc('performance_finalize_admin_recovery', {
      p_request_reference: requestReference,
      p_employee_id: actor.employeeId,
      p_new_device_id: newDeviceId,
      p_new_auth_user_id: actor.authUserId,
    });
    if (error || !Array.isArray(data) || data.length !== 1) {
      return responseJson({ error: 'RECOVERY_FINALIZE_UNAVAILABLE' }, 409);
    }

    const oldAuthUserIds = Array.isArray(data[0].old_auth_user_ids) ? data[0].old_auth_user_ids : [];
    await Promise.allSettled(
      oldAuthUserIds
        .filter((id: unknown) => isUuid(id) && id !== actor.authUserId)
        .map((id: string) => admin.auth.admin.updateUserById(id, { ban_duration: LONG_BAN_DURATION })),
    );

    return responseJson({
      version: '2026.08.21-admin-recovery-finalize-v1',
      finalized: true,
      deviceId: data[0].finalized_device_id,
      replacedCredentialCount: oldAuthUserIds.length,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('performance-admin-recovery-finalize failed', error instanceof Error ? error.message : 'unknown');
    return responseJson({ error: 'ADMIN_RECOVERY_FINALIZE_FAILED' }, 500);
  }
});
