import {
  PERFORMANCE_EDGE_VERSION,
  authenticatePerformanceActor,
  isUuid,
  preflight,
  randomSecret,
  requirePost,
  responseJson,
  sha256Hex,
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
    const employeeId = body?.employeeId;
    if (!isUuid(employeeId)) return responseJson({ error: 'INVALID_EMPLOYEE_ID' }, 400);

    const requestedMinutes = Number(body?.expiresMinutes ?? 10);
    const expiresMinutes = Number.isFinite(requestedMinutes)
      ? Math.min(30, Math.max(5, Math.floor(requestedMinutes)))
      : 10;

    const { data: employee, error: employeeError } = await admin
      .from('performance_employees')
      .select('id, display_name, role, active')
      .eq('id', employeeId)
      .single();
    if (employeeError || !employee || employee.active !== true) {
      return responseJson({ error: 'ACTIVE_EMPLOYEE_NOT_FOUND' }, 404);
    }

    const now = new Date();
    const expiresAt = new Date(now.valueOf() + expiresMinutes * 60_000).toISOString();

    // Revoke older unused tokens for this employee so only the newest QR remains valid.
    await admin
      .from('performance_enrollment_tokens')
      .update({ revoked_at: now.toISOString(), revoked_by: actor.employeeId })
      .eq('employee_id', employeeId)
      .is('used_at', null)
      .is('revoked_at', null)
      .gt('expires_at', now.toISOString());

    const token = randomSecret(32);
    const tokenHash = await sha256Hex(token);
    const tokenPrefix = token.slice(0, 8);

    const { error: insertError } = await admin.from('performance_enrollment_tokens').insert({
      token_hash: tokenHash,
      token_prefix: tokenPrefix,
      employee_id: employeeId,
      expires_at: expiresAt,
      created_by: actor.employeeId,
    });
    if (insertError) throw insertError;

    return responseJson({
      version: PERFORMANCE_EDGE_VERSION,
      token,
      tokenPrefix,
      expiresAt,
      employee: { id: employee.id, displayName: employee.display_name, role: employee.role },
      qrPayload: `paradise-performance://enroll?token=${encodeURIComponent(token)}`,
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('performance-enrollment-mint failed', error instanceof Error ? error.message : 'unknown');
    return responseJson({ error: 'ENROLLMENT_MINT_FAILED' }, 500);
  }
});
