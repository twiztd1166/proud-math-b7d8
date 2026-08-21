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

const BOOTSTRAP_FLAG = 'paradise_performance_first_manager_bootstrap';
const BOOTSTRAP_MANAGER_ID = 'performance_bootstrap_manager_employee_id';
const BOOTSTRAP_TOKEN_MINUTES = 10;
const LONG_BAN_DURATION = '876000h';
const SYNTHETIC_REVIEW_EMPLOYEE_IDS = new Set([
  '1f8af617-73ef-4b0d-a741-23c9f062077e',
  'fd669519-c21a-4d2f-8b98-d1a1eae24893',
]);

Deno.serve(async (req: Request) => {
  const options = preflight(req);
  if (options) return options;
  const wrongMethod = requirePost(req);
  if (wrongMethod) return wrongMethod;

  try {
    const authorization = req.headers.get('Authorization') ?? '';
    if (!authorization.startsWith('Bearer ')) return responseJson({ error: 'UNAUTHORIZED' }, 401);
    const jwt = authorization.slice(7).trim();
    if (!jwt) return responseJson({ error: 'UNAUTHORIZED' }, 401);

    const auth = publicClient();
    const { data: userData, error: userError } = await auth.auth.getUser(jwt);
    const bootstrapUser = userData?.user ?? null;
    if (userError || !bootstrapUser) return responseJson({ error: 'UNAUTHORIZED' }, 401);

    const metadata = bootstrapUser.app_metadata ?? {};
    if (metadata[BOOTSTRAP_FLAG] !== true) {
      return responseJson({ error: 'FIRST_MANAGER_BOOTSTRAP_REQUIRED' }, 403);
    }

    const managerEmployeeId = metadata[BOOTSTRAP_MANAGER_ID];
    if (!isUuid(managerEmployeeId)) {
      return responseJson({ error: 'FIRST_MANAGER_BOOTSTRAP_CONFIGURATION_INVALID' }, 403);
    }
    if (SYNTHETIC_REVIEW_EMPLOYEE_IDS.has(managerEmployeeId)) {
      return responseJson({ error: 'SYNTHETIC_REVIEW_EMPLOYEE_FORBIDDEN' }, 403);
    }

    const admin = adminClient();
    const { data: manager, error: managerError } = await admin
      .from('performance_employees')
      .select('id, display_name, role, active')
      .eq('id', managerEmployeeId)
      .single();
    if (managerError || !manager || manager.active !== true || !['manager', 'admin'].includes(manager.role)) {
      return responseJson({ error: 'ACTIVE_REAL_MANAGER_OR_ADMIN_NOT_FOUND' }, 403);
    }

    // This path exists only to create the first real privileged trusted-device identity.
    // It must never become a general alternate enrollment path.
    const { data: privilegedEmployees, error: privilegedEmployeeError } = await admin
      .from('performance_employees')
      .select('id')
      .eq('active', true)
      .in('role', ['manager', 'admin']);
    if (privilegedEmployeeError) throw privilegedEmployeeError;

    const privilegedEmployeeIds = (privilegedEmployees ?? []).map(employee => employee.id);
    if (privilegedEmployeeIds.length > 0) {
      const { data: existingPrivilegedIdentities, error: privilegedIdentityError } = await admin
        .from('performance_actor_identities')
        .select('auth_user_id, employee_id')
        .in('employee_id', privilegedEmployeeIds)
        .is('revoked_at', null)
        .limit(1);
      if (privilegedIdentityError) throw privilegedIdentityError;
      if ((existingPrivilegedIdentities ?? []).length > 0) {
        return responseJson({ error: 'PRIVILEGED_PERFORMANCE_ACTOR_ALREADY_EXISTS' }, 409);
      }
    }

    // Even a revoked historical identity for the selected manager proves that initial
    // bootstrap already occurred. Normal manager/admin enrollment must be used after that.
    const { count: historicalManagerIdentityCount, error: historicalIdentityError } = await admin
      .from('performance_actor_identities')
      .select('auth_user_id', { count: 'exact', head: true })
      .eq('employee_id', managerEmployeeId);
    if (historicalIdentityError) throw historicalIdentityError;
    if ((historicalManagerIdentityCount ?? 0) > 0) {
      return responseJson({ error: 'FIRST_MANAGER_BOOTSTRAP_ALREADY_USED' }, 409);
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const expiresAt = new Date(now.valueOf() + BOOTSTRAP_TOKEN_MINUTES * 60_000).toISOString();

    // Keep only the newest unused token for the target manager. This also makes an
    // accidental repeated invocation fail closed rather than widening enrollment access.
    const { error: revokeError } = await admin
      .from('performance_enrollment_tokens')
      .update({ revoked_at: nowIso, revoked_by: managerEmployeeId })
      .eq('employee_id', managerEmployeeId)
      .is('used_at', null)
      .is('revoked_at', null)
      .gt('expires_at', nowIso);
    if (revokeError) throw revokeError;

    const token = randomSecret(32);
    const tokenHash = await sha256Hex(token);
    const tokenPrefix = token.slice(0, 8);

    const { error: insertError } = await admin.from('performance_enrollment_tokens').insert({
      token_hash: tokenHash,
      token_prefix: tokenPrefix,
      employee_id: managerEmployeeId,
      expires_at: expiresAt,
      created_by: managerEmployeeId,
    });
    if (insertError) throw insertError;

    // The temporary Dashboard/Auth-Admin bootstrap identity must not remain reusable.
    // Disable it before returning the enrollment secret. If hardening fails, revoke the
    // newly minted token and return no usable bootstrap result.
    const hardenedMetadata = {
      ...metadata,
      [BOOTSTRAP_FLAG]: false,
      [BOOTSTRAP_MANAGER_ID]: null,
    };
    const { error: hardenError } = await admin.auth.admin.updateUserById(bootstrapUser.id, {
      app_metadata: hardenedMetadata,
      ban_duration: LONG_BAN_DURATION,
    });
    if (hardenError) {
      await admin
        .from('performance_enrollment_tokens')
        .update({ revoked_at: new Date().toISOString(), revoked_by: managerEmployeeId })
        .eq('token_hash', tokenHash)
        .is('used_at', null)
        .is('revoked_at', null);
      return responseJson({ error: 'BOOTSTRAP_IDENTITY_DISABLE_FAILED' }, 500);
    }

    return responseJson({
      version: PERFORMANCE_EDGE_VERSION,
      firstManagerBootstrap: true,
      token,
      tokenPrefix,
      expiresAt,
      employee: {
        id: manager.id,
        displayName: manager.display_name,
        role: manager.role,
      },
      nextStep: 'REDEEM_IMMEDIATELY_THROUGH_ORDINARY_TRUSTED_DEVICE_FLOW',
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('performance-first-manager-bootstrap-mint failed', error instanceof Error ? error.message : 'unknown');
    return responseJson({ error: 'FIRST_MANAGER_BOOTSTRAP_MINT_FAILED' }, 500);
  }
});
