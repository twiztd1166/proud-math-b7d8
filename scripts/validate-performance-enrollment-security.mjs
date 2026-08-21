import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const fail = message => { throw new Error(message); };
const requireText = (text, pattern, message) => { if (!pattern.test(text)) fail(message); };
const forbidText = (text, pattern, message) => { if (pattern.test(text)) fail(message); };

const enrollment = read('supabase/migrations/20260818084500_paradise_performance_v1_device_enrollment.sql');
const enrollmentAdvisor = read('supabase/migrations/20260818090000_paradise_performance_v1_enrollment_advisor_hardening.sql');
const readSession = read('supabase/migrations/20260818091500_paradise_performance_v1_read_session_hardening.sql');
const bootstrapChallenge = read('supabase/migrations/20260821103500_paradise_performance_v1_first_admin_bootstrap_challenge.sql');
const config = read('supabase/config.toml');
const edgeAuth = read('supabase/functions/_shared/performance-auth.ts');
const reviewMint = read('supabase/functions/performance-review-enrollment-mint/index.ts');
const bootstrapProvision = read('supabase/functions/performance-first-manager-bootstrap-provision/index.ts');
const bootstrapMint = read('supabase/functions/performance-first-manager-bootstrap-mint/index.ts');
const reviewClient = read('performance/client/performance-store-review-access.mjs');
const bootstrapClient = read('performance/client/performance-first-admin-bootstrap.mjs');
const nativeApp = read('performance/client/performance-native-app.mjs');

requireText(enrollment, /token_hash text primary key/i, 'Enrollment token must be stored by hash');
if (/\btoken\s+text\b/i.test(enrollment)) fail('Plaintext enrollment-token storage detected');
requireText(enrollment, /revoke all on table public\.performance_enrollment_tokens from public, anon, authenticated/i, 'Enrollment token table must be client-inaccessible');
requireText(enrollmentAdvisor, /performance_enrollment_tokens_deny_client/i, 'Enrollment token explicit deny policy missing');

requireText(bootstrapChallenge, /proof_hash text not null unique/i, 'Bootstrap proof must be stored by hash');
requireText(bootstrapChallenge, /email_hash text not null/i, 'Bootstrap email identity must be stored by hash');
requireText(bootstrapChallenge, /consumed_at timestamptz/i, 'Bootstrap challenge must record one-time consumption');
requireText(bootstrapChallenge, /enable row level security/i, 'Bootstrap challenge RLS missing');
requireText(bootstrapChallenge, /revoke all on table public\.performance_bootstrap_challenges from public, anon, authenticated/i, 'Bootstrap challenge table must be client-inaccessible');
requireText(bootstrapChallenge, /performance_bootstrap_challenges_deny_client/i, 'Bootstrap challenge explicit deny policy missing');
forbidText(bootstrapChallenge, /\bemail\s+text\b|\bproof\s+text\b|\bpassword\s+text\b/i, 'Plaintext bootstrap credential column detected');

requireText(readSession, /performance_employees_read_all[\s\S]*performance_actor_identities[\s\S]*auth_user_id = \(select auth\.uid\(\)\)[\s\S]*revoked_at is null/i, 'Employee shared read must require a live Performance identity');
for (const policy of [
  'performance_devices_read_all', 'performance_kpi_read_all', 'performance_payplan_read_all',
  'performance_territory_read_all', 'performance_shifts_read_all', 'performance_events_read_all',
  'performance_location_read_all', 'performance_sets_read_all', 'performance_outcomes_read_all',
  'performance_commissions_read_all', 'performance_correction_requests_read_all',
  'performance_audit_read_all', 'performance_snapshots_read_all'
]) {
  requireText(readSession, new RegExp(`${policy}[\\s\\S]{0,180}performance_current_employee_id\\(\\) is not null`, 'i'), `Revocation-aware shared-read gate missing: ${policy}`);
}
if (/create policy\s+\w+_read_all[\s\S]{0,120}using\s*\(\s*true\s*\)/i.test(readSession)) fail('Unconditional shared Performance read reintroduced');
requireText(readSession, /generic authenticated Supabase user or a revoked device JWT must not retain team reads/i, 'Stale-JWT hardening invariant missing');

requireText(edgeAuth, /PERFORMANCE_EDGE_VERSION = '2026\.08\.18-performance-edge-v2'/i, 'Current Edge auth contract missing');
requireText(edgeAuth, /auth\.getUser\(token\)/i, 'User JWT must be validated inside protected Edge handlers');
requireText(edgeAuth, /performance_current_employee_id/i, 'Edge actor authorization must verify current Performance enrollment');

for (const required of [
  /auth\.auth\.getUser\(jwt\)/i, /paradise_store_review/i, /performance_review_employee_id/i,
  /performance_review_issuer_employee_id/i, /reviewEmployee\.role !== 'canvasser'/i,
  /\['manager', 'admin'\]\.includes\(issuer\.role\)/i, /randomSecret\(32\)/i,
  /sha256Hex\(token\)/i, /REVIEW_TOKEN_MINUTES = 10/i,
]) requireText(reviewMint, required, `Store-review mint security control missing: ${required}`);
forbidText(reviewMint, /authenticatePerformanceActor\(/i, 'Reusable store-review gate must not be a normal Performance actor');
forbidText(reviewMint, /body\?\.employeeId|body\.employeeId/i, 'Store-review caller must not choose the target employee');
forbidText(reviewMint, /Deno\.env\.get\([^)]*(PASSWORD|REVIEW_PASSWORD)/i, 'Reusable review password must not be an Edge Function environment secret');

for (const required of [
  /sha256Hex\(email\)/i, /sha256Hex\(proof\)/i, /performance_bootstrap_challenges/i,
  /SYNTHETIC_REVIEW_EMPLOYEE_IDS/i, /SYNTHETIC_REVIEW_EMPLOYEE_FORBIDDEN/i,
  /\['manager', 'admin'\]\.includes\(manager\.role\)/i, /historicalPrivilegedIdentityCount/i,
  /FIRST_MANAGER_BOOTSTRAP_ALREADY_USED/i, /\.update\(\{ consumed_at: nowIso \}\)/i,
  /admin\.auth\.admin\.createUser\(/i, /email_confirm:\s*true/i,
  /paradise_performance_first_manager_bootstrap/i, /performance_bootstrap_manager_employee_id/i,
  /BOOTSTRAP_AUTH_PROVISIONING_FAILED_PROOF_BURNED/i,
]) requireText(bootstrapProvision, required, `First-manager provisioning security control missing: ${required}`);
forbidText(bootstrapProvision, /body\?\.employeeId|body\.employeeId/i, 'Proof caller must not choose the manager target in request body');
forbidText(bootstrapProvision, /service_role|SUPABASE_SERVICE_ROLE_KEY|sb_secret_/i, 'Proof provisioning source must not contain a privileged key literal');
if (bootstrapProvision.indexOf('.update({ consumed_at: nowIso })') > bootstrapProvision.indexOf('admin.auth.admin.createUser')) {
  fail('Bootstrap proof must be consumed before Auth user creation');
}

for (const required of [
  /auth\.auth\.getUser\(jwt\)/i, /paradise_performance_first_manager_bootstrap/i,
  /performance_bootstrap_manager_employee_id/i, /SYNTHETIC_REVIEW_EMPLOYEE_IDS/i,
  /SYNTHETIC_REVIEW_EMPLOYEE_FORBIDDEN/i, /\['manager', 'admin'\]\.includes\(manager\.role\)/i,
  /historicalPrivilegedIdentityCount/i, /\.in\('role', \['manager', 'admin'\]\)/i,
  /PRIVILEGED_PERFORMANCE_ACTOR_ALREADY_EXISTS/i, /FIRST_MANAGER_BOOTSTRAP_ALREADY_USED/i,
  /randomSecret\(32\)/i, /sha256Hex\(token\)/i, /BOOTSTRAP_TOKEN_MINUTES = 10/i,
  /admin\.auth\.admin\.updateUserById\(bootstrapUser\.id/i, /ban_duration:\s*LONG_BAN_DURATION/i,
  /BOOTSTRAP_IDENTITY_DISABLE_FAILED/i, /REDEEM_IMMEDIATELY_THROUGH_ORDINARY_TRUSTED_DEVICE_FLOW/i,
]) requireText(bootstrapMint, required, `First-manager bootstrap security control missing: ${required}`);
forbidText(bootstrapMint, /authenticatePerformanceActor\(/i, 'Initial manager bootstrap cannot require an already-enrolled Performance actor');
forbidText(bootstrapMint, /body\?\.employeeId|body\.employeeId/i, 'Bootstrap caller must not choose the manager target in request body');
forbidText(bootstrapMint, /Deno\.env\.get\([^)]*(PASSWORD|BOOTSTRAP_SECRET|BOOTSTRAP_PASSWORD)/i, 'Bootstrap password/secret must not be an Edge Function environment secret');
forbidText(bootstrapMint, /createUser\(/i, 'Bootstrap mint must not create its own Auth user');

for (const required of [
  /persistSession:\s*false/i, /autoRefreshToken:\s*false/i, /crypto\.getRandomValues/i,
  /performance-first-manager-bootstrap-provision/i, /signInWithPassword/i,
  /performance-first-manager-bootstrap-mint/i, /redeemTrustedDevice/i, /platform:\s*'web-test'/i,
]) requireText(bootstrapClient, required, `First-admin browser security control missing: ${required}`);
forbidText(bootstrapClient, /localStorage\.setItem\([^)]*(password|proof|email)/i, 'First-admin proof/password/email must not be persisted');
forbidText(bootstrapClient, /@paradiseexteriors\.com|husseygrowthcollc@gmail\.com/i, 'Authorized bootstrap email must not be hardcoded in the client');

for (const required of [
  /persistSession:\s*false/i, /autoRefreshToken:\s*false/i, /signInWithPassword/i,
  /performance-review-enrollment-mint/i, /signOut\(\{ scope: 'local' \}\)/i,
]) requireText(reviewClient, required, `Store-review client isolation control missing: ${required}`);
forbidText(reviewClient, /localStorage|secureStorage|setItem\(/i, 'Store-review credentials/session must not be written to local or secure storage');

requireText(nativeApp, /createStoreReviewSupabaseOptions/i, 'Native app must use isolated review Supabase options');
requireText(nativeApp, /requestStoreReviewEnrollment/i, 'Native app must invoke the controlled review flow');
requireText(nativeApp, /APP REVIEW ACCESS/i, 'Native app must expose the documented reviewer access path');
requireText(nativeApp, /await enrollDevice\(reviewEnrollment\.token\)/i, 'Review flow must end in the ordinary trusted-device redemption path');
forbidText(nativeApp, /setItem\([^)]*(ReviewEmail|ReviewPassword|review.*password)/i, 'Native app must not persist review credentials');

const expectedJwtModes = {
  'performance-enrollment-mint': true,
  'performance-enrollment-redeem': false,
  'performance-device-revoke': true,
  'performance-review-enrollment-mint': true,
  'performance-first-manager-bootstrap-provision': false,
  'performance-first-manager-bootstrap-mint': true,
};
for (const [fn, expected] of Object.entries(expectedJwtModes)) {
  requireText(config, new RegExp(`\\[functions\\.${fn}\\][\\s\\S]{0,100}verify_jwt\\s*=\\s*${expected}`, 'i'), `verify_jwt=${expected} missing for ${fn}`);
}

console.log('Paradise Performance enrollment/read-session/store-review/first-manager proof-bootstrap security validation: PASS');
