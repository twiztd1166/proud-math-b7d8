import {
  adminClient,
  isUuid,
  preflight,
  requirePost,
  responseJson,
  sha256Hex,
} from '../_shared/performance-auth.ts';

const BOOTSTRAP_FLAG = 'paradise_performance_first_manager_bootstrap';
const BOOTSTRAP_MANAGER_ID = 'performance_bootstrap_manager_employee_id';
const SYNTHETIC_REVIEW_EMPLOYEE_IDS = new Set([
  '1f8af617-73ef-4b0d-a741-23c9f062077e',
  'fd669519-c21a-4d2f-8b98-d1a1eae24893',
]);

function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function validEphemeralPassword(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 32 && value.length <= 160;
}

Deno.serve(async (req: Request) => {
  const options = preflight(req);
  if (options) return options;
  const wrongMethod = requirePost(req);
  if (wrongMethod) return wrongMethod;

  try {
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body?.email);
    const proof = typeof body?.proof === 'string' ? body.proof.trim() : '';
    const ephemeralPassword = body?.ephemeralPassword;

    if (!email || email.length > 254 || !email.includes('@')) return responseJson({ error: 'INVALID_BOOTSTRAP_EMAIL' }, 400);
    if (proof.length < 24 || proof.length > 256) return responseJson({ error: 'INVALID_BOOTSTRAP_PROOF' }, 400);
    if (!validEphemeralPassword(ephemeralPassword)) return responseJson({ error: 'INVALID_EPHEMERAL_PASSWORD' }, 400);

    const [emailHash, proofHash] = await Promise.all([sha256Hex(email), sha256Hex(proof)]);
    const admin = adminClient();
    const nowIso = new Date().toISOString();

    const { data: challenge, error: challengeError } = await admin
      .from('performance_bootstrap_challenges')
      .select('id, employee_id, expires_at, consumed_at')
      .eq('proof_hash', proofHash)
      .eq('email_hash', emailHash)
      .is('consumed_at', null)
      .gt('expires_at', nowIso)
      .maybeSingle();
    if (challengeError) throw challengeError;
    if (!challenge || !isUuid(challenge.employee_id)) return responseJson({ error: 'BOOTSTRAP_PROOF_INVALID_OR_EXPIRED' }, 403);
    if (SYNTHETIC_REVIEW_EMPLOYEE_IDS.has(challenge.employee_id)) return responseJson({ error: 'SYNTHETIC_REVIEW_EMPLOYEE_FORBIDDEN' }, 403);

    const { data: manager, error: managerError } = await admin
      .from('performance_employees')
      .select('id, display_name, role, active')
      .eq('id', challenge.employee_id)
      .single();
    if (managerError || !manager || manager.active !== true || !['manager', 'admin'].includes(manager.role)) {
      return responseJson({ error: 'ACTIVE_REAL_MANAGER_OR_ADMIN_NOT_FOUND' }, 403);
    }

    const { data: privilegedEmployees, error: privilegedEmployeesError } = await admin
      .from('performance_employees')
      .select('id')
      .in('role', ['manager', 'admin']);
    if (privilegedEmployeesError) throw privilegedEmployeesError;
    const privilegedIds = (privilegedEmployees ?? [])
      .map(employee => employee.id)
      .filter(id => isUuid(id) && !SYNTHETIC_REVIEW_EMPLOYEE_IDS.has(id));

    if (privilegedIds.length) {
      const { count: historicalPrivilegedIdentityCount, error: lineageError } = await admin
        .from('performance_actor_identities')
        .select('auth_user_id', { count: 'exact', head: true })
        .in('employee_id', privilegedIds);
      if (lineageError) throw lineageError;
      if ((historicalPrivilegedIdentityCount ?? 0) > 0) {
        return responseJson({ error: 'FIRST_MANAGER_BOOTSTRAP_ALREADY_USED' }, 409);
      }
    }

    const { data: consumed, error: consumeError } = await admin
      .from('performance_bootstrap_challenges')
      .update({ consumed_at: nowIso })
      .eq('id', challenge.id)
      .is('consumed_at', null)
      .gt('expires_at', nowIso)
      .select('id, employee_id')
      .maybeSingle();
    if (consumeError) throw consumeError;
    if (!consumed) return responseJson({ error: 'BOOTSTRAP_PROOF_ALREADY_CONSUMED' }, 409);

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: ephemeralPassword,
      email_confirm: true,
      app_metadata: {
        [BOOTSTRAP_FLAG]: true,
        [BOOTSTRAP_MANAGER_ID]: manager.id,
      },
    });
    if (createError || !created?.user) {
      console.error('performance-first-manager-bootstrap-provision Auth creation failed after proof consumption');
      return responseJson({ error: 'BOOTSTRAP_AUTH_PROVISIONING_FAILED_PROOF_BURNED' }, 500);
    }

    return responseJson({
      provisioned: true,
      employee: { id: manager.id, displayName: manager.display_name, role: manager.role },
      nextStep: 'SIGN_IN_WITH_EPHEMERAL_PASSWORD_THEN_INVOKE_BOOTSTRAP_MINT',
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('performance-first-manager-bootstrap-provision failed', error instanceof Error ? error.message : 'unknown');
    return responseJson({ error: 'FIRST_MANAGER_BOOTSTRAP_PROVISION_FAILED' }, 500);
  }
});
