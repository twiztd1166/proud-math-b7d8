import {
  PERFORMANCE_EDGE_VERSION,
  authenticatePerformanceActor,
  isUuid,
  preflight,
  requirePost,
  responseJson,
} from '../_shared/performance-auth.ts';

Deno.serve(async (req: Request) => {
  const options = preflight(req);
  if (options) return options;
  const wrongMethod = requirePost(req);
  if (wrongMethod) return wrongMethod;

  try {
    const { actor, admin } = await authenticatePerformanceActor(req);
    if (!['manager', 'admin'].includes(actor.role)) {
      return responseJson({ error: 'MANAGER_OR_ADMIN_REQUIRED' }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const deviceId = body?.deviceId;
    const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 240) : 'revoked';
    if (!isUuid(deviceId)) return responseJson({ error: 'INVALID_DEVICE_ID' }, 400);

    const { data: authUserId, error: revokeError } = await admin.rpc('performance_revoke_device', {
      p_device_id: deviceId,
      p_revoked_by: actor.employeeId,
      p_reason: reason || 'revoked',
    });
    if (revokeError) {
      if (/device not found/i.test(revokeError.message ?? '')) return responseJson({ error: 'DEVICE_NOT_FOUND' }, 404);
      throw revokeError;
    }

    // RLS is already dead immediately because the actor mapping was revoked in the
    // transaction above. Banning the hidden Auth user prevents refresh/sign-in as well.
    if (typeof authUserId === 'string' && authUserId) {
      const { error: banError } = await admin.auth.admin.updateUserById(authUserId, { ban_duration: '876000h' });
      if (banError) {
        console.error('device revoked but Auth ban failed', banError.message);
        return responseJson({
          version: PERFORMANCE_EDGE_VERSION,
          revoked: true,
          authBanPending: true,
        }, 202);
      }
    }

    return responseJson({ version: PERFORMANCE_EDGE_VERSION, revoked: true, authBanPending: false });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('performance-device-revoke failed', error instanceof Error ? error.message : 'unknown');
    return responseJson({ error: 'DEVICE_REVOKE_FAILED' }, 500);
  }
});
