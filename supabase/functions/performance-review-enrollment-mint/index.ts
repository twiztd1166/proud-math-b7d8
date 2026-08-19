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

const REVIEW_FLAG = 'paradise_store_review';
const REVIEW_EMPLOYEE_ID = 'performance_review_employee_id';
const REVIEW_ISSUER_ID = 'performance_review_issuer_employee_id';
const REVIEW_TOKEN_MINUTES = 10;

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
    const reviewUser = userData?.user ?? null;
    if (userError || !reviewUser) return responseJson({ error: 'UNAUTHORIZED' }, 401);

    const metadata = reviewUser.app_metadata ?? {};
    if (metadata[REVIEW_FLAG] !== true) return responseJson({ error: 'STORE_REVIEW_ACCESS_REQUIRED' }, 403);

    const employeeId = metadata[REVIEW_EMPLOYEE_ID];
    const issuerId = metadata[REVIEW_ISSUER_ID];
    if (!isUuid(employeeId) || !isUuid(issuerId) || employeeId === issuerId) {
      return responseJson({ error: 'STORE_REVIEW_CONFIGURATION_INVALID' }, 403);
    }

    const admin = adminClient();
    const { data: employees, error: employeeError } = await admin
      .from('performance_employees')
      .select('id, display_name, role, active')
      .in('id', [employeeId, issuerId]);
    if (employeeError) throw employeeError;

    const reviewEmployee = employees?.find(employee => employee.id === employeeId) ?? null;
    const issuer = employees?.find(employee => employee.id === issuerId) ?? null;
    if (!reviewEmployee || reviewEmployee.active !== true || reviewEmployee.role !== 'canvasser') {
      return responseJson({ error: 'ACTIVE_SYNTHETIC_REVIEW_EMPLOYEE_NOT_FOUND' }, 403);
    }
    if (!issuer || issuer.active !== true || !['manager', 'admin'].includes(issuer.role)) {
      return responseJson({ error: 'ACTIVE_SYNTHETIC_REVIEW_ISSUER_NOT_FOUND' }, 403);
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const expiresAt = new Date(now.valueOf() + REVIEW_TOKEN_MINUTES * 60_000).toISOString();

    // Keep the ordinary trusted-device contract: only the newest unconsumed review enrollment remains valid.
    const { error: revokeError } = await admin
      .from('performance_enrollment_tokens')
      .update({ revoked_at: nowIso, revoked_by: issuerId })
      .eq('employee_id', employeeId)
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
      employee_id: employeeId,
      expires_at: expiresAt,
      created_by: issuerId,
    });
    if (insertError) throw insertError;

    return responseJson({
      version: PERFORMANCE_EDGE_VERSION,
      reviewAccess: true,
      token,
      tokenPrefix,
      expiresAt,
      employee: {
        id: reviewEmployee.id,
        displayName: reviewEmployee.display_name,
        role: reviewEmployee.role,
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('performance-review-enrollment-mint failed', error instanceof Error ? error.message : 'unknown');
    return responseJson({ error: 'STORE_REVIEW_ENROLLMENT_MINT_FAILED' }, 500);
  }
});
