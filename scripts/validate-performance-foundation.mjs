import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const fail = message => { throw new Error(message); };
const requireText = (text, pattern, message) => { if (!pattern.test(text)) fail(message); };

const spec = read('docs/PARADISE_PERFORMANCE_V1_SPEC.md');
const audit = read('docs/PARADISE_PERFORMANCE_V1_DEEP_AUDIT_2026-08-18.md');
const sql = read('supabase/migrations/20260818072700_paradise_performance_v1_foundation.sql');
const hardening = read('supabase/migrations/20260818074500_paradise_performance_v1_rls_hardening.sql');
const security = read('supabase/migrations/20260818080000_paradise_performance_v1_security_hardening.sql');
const advisor = read('supabase/migrations/20260818081500_paradise_performance_v1_advisor_hardening.sql');
const indexes = read('supabase/migrations/20260818083000_paradise_performance_v1_index_hardening.sql');
const enrollment = read('supabase/migrations/20260818084500_paradise_performance_v1_device_enrollment.sql');
const enrollmentAdvisor = read('supabase/migrations/20260818090000_paradise_performance_v1_enrollment_advisor_hardening.sql');
const supabaseConfig = read('supabase/config.toml');
const math = read('performance/shared/performance-math.mjs');
const events = read('performance/shared/performance-events.mjs');
const location = read('performance/native/performance-location-contract.mjs');
const session = read('performance/client/performance-session.mjs');
const sync = read('performance/client/performance-sync.mjs');
const edgeAuth = read('supabase/functions/_shared/performance-auth.ts');
const enrollmentMint = read('supabase/functions/performance-enrollment-mint/index.ts');
const enrollmentRedeem = read('supabase/functions/performance-enrollment-redeem/index.ts');
const deviceRevoke = read('supabase/functions/performance-device-revoke/index.ts');

requireText(spec, /START MY DAY → WORK → QUICK SET \/ \+ SET → FINISH DAY/, 'Primary employee loop drifted');
requireText(spec, /78 jurisdictions \/ 76 GO \/ 2 NO-GO/, 'Field baseline control missing from Performance spec');
requireText(spec, /live Paradise Lookup remains authoritative/i, 'Lookup authority boundary missing');
requireText(audit, /PROCEED TO ISOLATED IMPLEMENTATION FOUNDATION/, 'Deep-audit disposition missing');

for (const table of [
  'performance_employees', 'performance_actor_identities', 'performance_devices',
  'performance_kpi_standard_versions', 'performance_pay_plan_versions', 'performance_territories',
  'performance_shifts', 'performance_events', 'performance_location_points', 'performance_sets',
  'performance_set_outcomes', 'performance_commissions', 'performance_correction_requests',
  'performance_audit_corrections', 'performance_period_snapshots'
]) {
  requireText(sql, new RegExp(`create table if not exists public\\.${table}\\b`, 'i'), `Missing schema table ${table}`);
  requireText(sql, new RegExp(`alter table public\\.${table} enable row level security`, 'i'), `RLS is not enabled on ${table}`);
}

requireText(sql, /client_event_id uuid not null unique/i, 'Event idempotency key missing');
requireText(sql, /client_point_id uuid not null unique/i, 'Location idempotency key missing');
requireText(sql, /client_set_id uuid not null unique/i, 'Set idempotency key missing');
requireText(sql, /client_shift_id uuid not null unique/i, 'Shift idempotency key missing');
requireText(sql, /performance_one_open_shift_per_employee/i, 'One-open-shift invariant missing');
requireText(sql, /captured_at timestamptz not null/i, 'Captured timestamp missing');
requireText(sql, /received_at timestamptz not null default now\(\)/i, 'Receive timestamp missing');
requireText(sql, /performance_location_read_all/i, 'Team GPS visibility policy missing');
requireText(sql, /performance_sets_read_all/i, 'Team Set visibility policy missing');
requireText(sql, /performance_commissions_read_all/i, 'Compensation visibility policy missing');
requireText(sql, /No database secret|secret credentials|Service-role\/secret/i, 'Secret-key client prohibition missing');
requireText(sql, /GPS is operational evidence only/i, 'GPS legal-authority boundary missing from migration');

requireText(hardening, /performance_events_type_check/i, 'Event-type constraint hardening missing');
requireText(hardening, /shift_id is null or exists[\s\S]*performance_shifts[\s\S]*employee_id = public\.performance_current_employee_id\(\)/i, 'Event-to-own-shift relationship hardening missing');
requireText(hardening, /performance_location_insert_own[\s\S]*performance_shifts[\s\S]*s\.employee_id = public\.performance_current_employee_id\(\)/i, 'Location-to-own-shift hardening missing');
requireText(hardening, /performance_sets_insert_own[\s\S]*origin_shift_id[\s\S]*s\.employee_id = public\.performance_current_employee_id\(\)/i, 'Set-to-own-shift hardening missing');
requireText(hardening, /revoke insert, update, delete on public\.performance_commissions from authenticated/i, 'Commission client-mutation prohibition missing');
requireText(hardening, /revoke insert, update, delete on public\.performance_period_snapshots from authenticated/i, 'Final standings client-mutation prohibition missing');
requireText(hardening, /visibility parity is SELECT parity, never mutation parity/i, 'Visibility/mutation boundary missing');

for (const fn of ['performance_current_employee_id', 'performance_current_role', 'performance_is_manager', 'performance_is_admin']) {
  requireText(security, new RegExp(`revoke execute on function public\\.${fn}\\(\\) from public, anon`, 'i'), `Default PUBLIC/anon EXECUTE not revoked for ${fn}`);
  requireText(security, new RegExp(`grant execute on function public\\.${fn}\\(\\) to authenticated`, 'i'), `Authenticated EXECUTE grant missing for ${fn}`);
  requireText(advisor, new RegExp(`alter function public\\.${fn}\\(\\) security invoker`, 'i'), `SECURITY INVOKER hardening missing for ${fn}`);
}
requireText(security, /performance_correction_requests_update_authorized[\s\S]*resolved_by = public\.performance_current_employee_id\(\)[\s\S]*resolved_at is not null/i, 'Correction resolution must bind resolved_by to actual manager actor');
requireText(security, /revoke create on schema public from anon/i, 'Anon public-schema CREATE revoke missing');
requireText(security, /revoke create on schema public from authenticated/i, 'Authenticated public-schema CREATE revoke missing');

requireText(advisor, /captured_at >= s\.started_at[\s\S]*captured_at <= s\.finished_at/i, 'Event/location shift-time boundary missing');
requireText(advisor, /set_captured_at >= s\.started_at[\s\S]*set_captured_at <= s\.finished_at/i, 'Set shift-time boundary missing');
requireText(advisor, /Off-shift location cannot be attached later/i, 'Off-shift backend-attribution invariant missing');

requireText(indexes, /auth_user_id = \(select auth\.uid\(\)\)/i, 'RLS auth.uid() init-plan hardening missing');
for (const indexName of [
  'performance_audit_corrections_changed_by_idx', 'performance_commissions_employee_id_idx',
  'performance_correction_requests_employee_id_idx', 'performance_devices_employee_id_idx',
  'performance_events_employee_time_idx', 'performance_location_device_id_idx',
  'performance_sets_created_device_id_idx', 'performance_shifts_device_id_idx',
  'performance_shifts_territory_id_idx'
]) requireText(indexes, new RegExp(`create index if not exists ${indexName}`, 'i'), `Advisor index missing: ${indexName}`);

requireText(enrollment, /create table if not exists public\.performance_enrollment_tokens/i, 'Enrollment-token table missing');
requireText(enrollment, /token_hash text primary key/i, 'Enrollment token hash key missing');
requireText(enrollment, /check \(length\(token_hash\) = 64\)/i, 'SHA-256 enrollment-token hash constraint missing');
if (/\btoken\s+text\b/i.test(enrollment)) fail('Plaintext enrollment token column must not exist');
requireText(enrollment, /alter table public\.performance_enrollment_tokens enable row level security/i, 'Enrollment-token RLS missing');
requireText(enrollment, /revoke all on table public\.performance_enrollment_tokens from public, anon, authenticated/i, 'Enrollment-token client access must be revoked');
requireText(enrollment, /performance_finalize_device_enrollment[\s\S]*security definer/i, 'Atomic enrollment finalizer missing');
requireText(enrollment, /revoke execute on function public\.performance_finalize_device_enrollment[\s\S]*from public, anon, authenticated/i, 'Enrollment finalizer must not be client executable');
requireText(enrollment, /grant execute on function public\.performance_finalize_device_enrollment[\s\S]*to service_role/i, 'Enrollment finalizer server grant missing');
requireText(enrollment, /performance_revoke_device[\s\S]*update public\.performance_actor_identities[\s\S]*revoked_at/i, 'Immediate RLS device revocation missing');
requireText(enrollment, /select e\.role[\s\S]*join public\.performance_employees/i, 'Current role must derive from authoritative employee row');
requireText(enrollment, /Trusted-device identity authorizes Performance data only[\s\S]*field Lookup/i, 'Enrollment/Lookup authority boundary missing');

requireText(enrollmentAdvisor, /performance_enrollment_tokens_deny_client/i, 'Enrollment-token explicit deny policy missing');
requireText(enrollmentAdvisor, /performance_enrollment_tokens_revoked_by_idx/i, 'Enrollment revoked-by FK index missing');
requireText(enrollmentAdvisor, /performance_enrollment_tokens_used_auth_user_idx/i, 'Enrollment auth-user FK index missing');

const migrations = [sql, hardening, security, advisor, indexes, enrollment, enrollmentAdvisor].join('\n');
if (/insert\s+into\s+public\.performance_kpi_standard_versions/i.test(migrations)) fail('Migrations must not seed invented KPI standards');
if (/insert\s+into\s+public\.performance_pay_plan_versions/i.test(migrations)) fail('Migrations must not seed invented pay rules');

requireText(math, /STANDARD_NOT_CONFIGURED/, 'KPI engine must represent unconfigured standards explicitly');
requireText(math, /MEETS_OR_EXCEEDS_MINIMUM/, 'Single-minimum KPI semantics missing');
requireText(events, /stable UUID reused for retries/, 'Retry identity contract missing');
requireText(location, /Finish Day stops background\/live tracking/, 'Tracking-stop invariant missing');
requireText(location, /GPS never authorizes or overrides field Lookup/, 'Native GPS authority boundary missing');
requireText(location, /off-shift Performance location is not collected/, 'Off-shift GPS prohibition missing');
requireText(session, /OS-protected secure storage/i, 'Native secure-session-storage invariant missing');
requireText(session, /REVOKED_OR_UNENROLLED/i, 'Revoked-device client state missing');
requireText(session, /supabase\.auth\.setSession/i, 'Supabase trusted-device session handoff missing');
requireText(sync, /PERFORMANCE_SYNC_VERSION = '2026\.08\.18-performance-sync-v2'/i, 'Current offline-sync version missing');
requireText(sync, /DUPLICATE_ACK/i, 'Duplicate replay acknowledgment missing');
requireText(sync, /AUTH_BLOCKED/i, 'Authorization-blocked queue state missing');
requireText(sync, /row\.state \?\? 'PENDING'\) === 'PENDING'/i, 'Terminal queue states must not auto-retry');
requireText(sync, /capturedAt never changes to server retry time/i, 'Original captured-time replay invariant missing');
requireText(sync, /Lookup remains usable even if the Performance queue is blocked or offline/i, 'Performance/Lookup outage isolation missing');

requireText(edgeAuth, /PERFORMANCE_EDGE_VERSION = '2026\.08\.18-performance-edge-v2'/i, 'Current Edge auth version missing');
requireText(edgeAuth, /npm:@supabase\/supabase-js@2\.111\.0/, 'Supabase Edge dependency must remain pinned');
requireText(edgeAuth, /SUPABASE_PUBLISHABLE_KEYS/, 'Current publishable-key environment support missing');
requireText(edgeAuth, /SUPABASE_SECRET_KEYS/, 'Current secret-key environment support missing');
requireText(edgeAuth, /auth\.getUser\(token\)/i, 'Edge handlers must validate user JWT in code');
requireText(edgeAuth, /PERFORMANCE_DEVICE_REVOKED_OR_UNENROLLED/i, 'Structured revoked-device Edge response missing');
requireText(enrollmentMint, /\['manager', 'admin'\]\.includes\(actor\.role\)/, 'Enrollment mint must be manager/admin only');
requireText(enrollmentMint, /sha256Hex\(token\)/, 'Enrollment mint must hash token before storage');
requireText(enrollmentRedeem, /auth\.admin\.createUser/i, 'Hidden device Auth user creation missing');
requireText(enrollmentRedeem, /performance_finalize_device_enrollment/i, 'Enrollment redeem must use atomic finalizer');
requireText(enrollmentRedeem, /signInWithPassword/i, 'Enrollment redeem session issuance missing');
const hiddenPasswordRefs = enrollmentRedeem.match(/\bhiddenPassword\b/g) ?? [];
if (hiddenPasswordRefs.length !== 3) fail('Hidden device password source references changed; inspect for accidental output');
const sessionOutputStart = enrollmentRedeem.indexOf('session: {');
if (sessionOutputStart < 0) fail('Enrollment redeem session response missing');
if (enrollmentRedeem.slice(sessionOutputStart, sessionOutputStart + 600).includes('hiddenPassword')) fail('Hidden device password must never be returned');
requireText(enrollmentRedeem, /session:\s*\{[\s\S]{0,300}accessToken:\s*signedIn\.session\.access_token[\s\S]{0,300}refreshToken:\s*signedIn\.session\.refresh_token/i, 'Enrollment redeem must return only the Supabase session tokens needed by the device');
requireText(deviceRevoke, /performance_revoke_device/i, 'Device revocation RPC missing');
requireText(deviceRevoke, /ban_duration/i, 'Auth refresh/sign-in ban missing after device revoke');

const expectedJwtModes = {
  'performance-enrollment-mint': true,
  'performance-enrollment-redeem': false,
  'performance-device-revoke': true,
};
for (const [name, expected] of Object.entries(expectedJwtModes)) {
  requireText(supabaseConfig, new RegExp(`\\[functions\\.${name}\\][\\s\\S]{0,160}verify_jwt\\s*=\\s*${expected}`, 'i'), `verify_jwt=${expected} config missing for ${name}`);
}

const secretScanFiles = [
  'performance/shared/performance-math.mjs', 'performance/shared/performance-events.mjs',
  'performance/native/performance-location-contract.mjs', 'performance/client/performance-session.mjs',
  'performance/client/performance-sync.mjs', 'supabase/functions/_shared/performance-auth.ts',
  'supabase/functions/performance-enrollment-mint/index.ts', 'supabase/functions/performance-enrollment-redeem/index.ts',
  'supabase/functions/performance-device-revoke/index.ts', 'supabase/config.toml',
  'supabase/migrations/20260818072700_paradise_performance_v1_foundation.sql',
  'supabase/migrations/20260818074500_paradise_performance_v1_rls_hardening.sql',
  'supabase/migrations/20260818080000_paradise_performance_v1_security_hardening.sql',
  'supabase/migrations/20260818081500_paradise_performance_v1_advisor_hardening.sql',
  'supabase/migrations/20260818083000_paradise_performance_v1_index_hardening.sql',
  'supabase/migrations/20260818084500_paradise_performance_v1_device_enrollment.sql',
  'supabase/migrations/20260818090000_paradise_performance_v1_enrollment_advisor_hardening.sql'
];
const forbiddenSecretPatterns = [
  /service[_-]?role\s*[:=]\s*['"][A-Za-z0-9._-]{12,}/i,
  /sb_secret_[A-Za-z0-9_-]+/i,
  /SUPABASE_SERVICE_ROLE_KEY\s*=\s*[^\s$]/i
];
for (const file of secretScanFiles) {
  const text = read(file);
  for (const pattern of forbiddenSecretPatterns) if (pattern.test(text)) fail(`Privileged backend secret pattern found in ${file}`);
}

console.log('Paradise Performance v1 foundation static validation: PASS');