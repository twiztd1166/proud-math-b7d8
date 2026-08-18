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
const readSession = read('supabase/migrations/20260818091500_paradise_performance_v1_read_session_hardening.sql');
const config = read('supabase/config.toml');
const math = read('performance/shared/performance-math.mjs');
const events = read('performance/shared/performance-events.mjs');
const location = read('performance/native/performance-location-contract.mjs');
const session = read('performance/client/performance-session.mjs');
const sync = read('performance/client/performance-sync.mjs');
const nativeAdapter = read('performance/native/capacitor-location-bridge.mjs');
const edgeAuth = read('supabase/functions/_shared/performance-auth.ts');
const mint = read('supabase/functions/performance-enrollment-mint/index.ts');
const redeem = read('supabase/functions/performance-enrollment-redeem/index.ts');
const revoke = read('supabase/functions/performance-device-revoke/index.ts');

requireText(spec, /START MY DAY → WORK → QUICK SET \/ \+ SET → FINISH DAY/, 'Primary employee loop drifted');
requireText(spec, /78 jurisdictions \/ 76 GO \/ 2 NO-GO/, 'Field baseline control missing');
requireText(spec, /live Paradise Lookup remains authoritative/i, 'Lookup authority boundary missing');
requireText(audit, /PROCEED TO ISOLATED IMPLEMENTATION FOUNDATION/, 'Deep-audit disposition missing');

for (const table of [
  'performance_employees','performance_actor_identities','performance_devices',
  'performance_kpi_standard_versions','performance_pay_plan_versions','performance_territories',
  'performance_shifts','performance_events','performance_location_points','performance_sets',
  'performance_set_outcomes','performance_commissions','performance_correction_requests',
  'performance_audit_corrections','performance_period_snapshots'
]) {
  requireText(sql, new RegExp(`create table if not exists public\\.${table}\\b`, 'i'), `Missing schema table ${table}`);
  requireText(sql, new RegExp(`alter table public\\.${table} enable row level security`, 'i'), `RLS missing on ${table}`);
}

for (const key of ['client_shift_id','client_event_id','client_point_id','client_set_id']) {
  requireText(sql, new RegExp(`${key} uuid not null unique`, 'i'), `Idempotency key missing: ${key}`);
}
requireText(sql, /performance_one_open_shift_per_employee/i, 'One-open-shift invariant missing');
requireText(sql, /captured_at timestamptz not null/i, 'Captured timestamp missing');
requireText(sql, /received_at timestamptz not null default now\(\)/i, 'Receive timestamp missing');

requireText(hardening, /performance_events_type_check/i, 'Event-type hardening missing');
requireText(hardening, /performance_events_insert_own[\s\S]*performance_shifts[\s\S]*employee_id = public\.performance_current_employee_id\(\)/i, 'Event/shift ownership gate missing');
requireText(hardening, /performance_location_insert_own[\s\S]*performance_shifts[\s\S]*s\.employee_id = public\.performance_current_employee_id\(\)/i, 'Location/shift ownership gate missing');
requireText(hardening, /performance_sets_insert_own[\s\S]*origin_shift_id[\s\S]*s\.employee_id = public\.performance_current_employee_id\(\)/i, 'Set/origin ownership gate missing');
for (const table of ['performance_commissions','performance_period_snapshots','performance_kpi_standard_versions','performance_pay_plan_versions']) {
  requireText(hardening, new RegExp(`revoke insert, update, delete on public\\.${table} from authenticated`, 'i'), `Privileged client mutation not revoked: ${table}`);
}
requireText(hardening, /visibility parity is SELECT parity, never mutation parity/i, 'Visibility/mutation boundary missing');

for (const fn of ['performance_current_employee_id','performance_current_role','performance_is_manager','performance_is_admin']) {
  requireText(security, new RegExp(`revoke execute on function public\\.${fn}\\(\\) from public, anon`, 'i'), `Public/anon helper EXECUTE not revoked: ${fn}`);
  requireText(advisor, new RegExp(`alter function public\\.${fn}\\(\\) security invoker`, 'i'), `SECURITY INVOKER missing: ${fn}`);
}
requireText(security, /resolved_by = public\.performance_current_employee_id\(\)/i, 'Correction resolver attribution gate missing');
requireText(security, /revoke create on schema public from anon/i, 'Anon public CREATE revoke missing');
requireText(security, /revoke create on schema public from authenticated/i, 'Authenticated public CREATE revoke missing');
requireText(advisor, /captured_at >= s\.started_at[\s\S]*captured_at <= s\.finished_at/i, 'Event/location temporal boundary missing');
requireText(advisor, /set_captured_at >= s\.started_at[\s\S]*set_captured_at <= s\.finished_at/i, 'Set temporal boundary missing');

requireText(indexes, /auth_user_id = \(select auth\.uid\(\)\)/i, 'auth.uid init-plan hardening missing');
for (const name of ['performance_events_employee_time_idx','performance_location_device_id_idx','performance_sets_created_device_id_idx','performance_shifts_device_id_idx','performance_shifts_territory_id_idx']) {
  requireText(indexes, new RegExp(`create index if not exists ${name}`, 'i'), `Advisor index missing: ${name}`);
}

requireText(enrollment, /create table if not exists public\.performance_enrollment_tokens/i, 'Enrollment-token table missing');
requireText(enrollment, /token_hash text primary key/i, 'Enrollment hash primary key missing');
requireText(enrollment, /check \(length\(token_hash\) = 64\)/i, 'SHA-256 enrollment hash constraint missing');
if (/\btoken\s+text\b/i.test(enrollment)) fail('Plaintext enrollment token column detected');
requireText(enrollment, /revoke all on table public\.performance_enrollment_tokens from public, anon, authenticated/i, 'Enrollment table client access not revoked');
requireText(enrollment, /performance_finalize_device_enrollment[\s\S]*security definer/i, 'Atomic enrollment finalizer missing');
requireText(enrollment, /revoke execute on function public\.performance_finalize_device_enrollment[\s\S]*from public, anon, authenticated/i, 'Enrollment finalizer exposed to clients');
requireText(enrollment, /grant execute on function public\.performance_finalize_device_enrollment[\s\S]*to service_role/i, 'Enrollment finalizer service grant missing');
requireText(enrollment, /performance_revoke_device[\s\S]*update public\.performance_actor_identities[\s\S]*revoked_at/i, 'Immediate actor revocation missing');
requireText(enrollment, /select e\.role[\s\S]*join public\.performance_employees/i, 'Current role must derive from authoritative employee row');
requireText(enrollmentAdvisor, /performance_enrollment_tokens_deny_client/i, 'Enrollment deny policy missing');
requireText(enrollmentAdvisor, /performance_enrollment_tokens_revoked_by_idx/i, 'Enrollment revoked_by index missing');
requireText(enrollmentAdvisor, /performance_enrollment_tokens_used_auth_user_idx/i, 'Enrollment auth-user index missing');

requireText(readSession, /performance_employees_read_all[\s\S]*performance_actor_identities[\s\S]*revoked_at is null/i, 'Employee read does not require live enrollment');
for (const policy of [
  'performance_devices_read_all','performance_kpi_read_all','performance_payplan_read_all','performance_territory_read_all',
  'performance_shifts_read_all','performance_events_read_all','performance_location_read_all','performance_sets_read_all',
  'performance_outcomes_read_all','performance_commissions_read_all','performance_correction_requests_read_all',
  'performance_audit_read_all','performance_snapshots_read_all'
]) {
  requireText(readSession, new RegExp(`${policy}[\\s\\S]{0,180}performance_current_employee_id\\(\\) is not null`, 'i'), `Revocation-aware shared read missing: ${policy}`);
}
requireText(readSession, /revoked device JWT must not retain team reads/i, 'Stale-JWT read invariant missing');

const migrations = [sql,hardening,security,advisor,indexes,enrollment,enrollmentAdvisor,readSession].join('\n');
if (/insert\s+into\s+public\.performance_kpi_standard_versions/i.test(migrations)) fail('Invented KPI standards seeded');
if (/insert\s+into\s+public\.performance_pay_plan_versions/i.test(migrations)) fail('Invented pay rules seeded');

requireText(math, /STANDARD_NOT_CONFIGURED/, 'Unconfigured KPI state missing');
requireText(math, /MEETS_OR_EXCEEDS_MINIMUM/, 'Minimum KPI semantics missing');
requireText(events, /stable UUID reused for retries/, 'Stable retry identity missing');
requireText(location, /Finish Day stops background\/live tracking/, 'Tracking stop invariant missing');
requireText(location, /GPS never authorizes or overrides field Lookup/, 'GPS/Lookup authority boundary missing');
requireText(location, /off-shift Performance location is not collected/, 'Off-shift GPS prohibition missing');
requireText(session, /OS-protected secure storage/i, 'Native secure-session storage invariant missing');
requireText(session, /REVOKED_OR_UNENROLLED/i, 'Revoked-session client state missing');
requireText(session, /supabase\.auth\.setSession/i, 'Trusted-device session handoff missing');
requireText(sync, /PERFORMANCE_SYNC_VERSION = '2026\.08\.18-performance-sync-v2'/i, 'Current sync contract missing');
requireText(sync, /DUPLICATE_ACK/i, 'Duplicate replay acknowledgment missing');
requireText(sync, /AUTH_BLOCKED/i, 'Auth-blocked queue state missing');
requireText(sync, /row\.state \?\? 'PENDING'\) === 'PENDING'/i, 'Terminal queue states may auto-retry');
requireText(sync, /capturedAt never changes to server retry time/i, 'Captured-time replay invariant missing');
requireText(sync, /Lookup remains usable even if the Performance queue is blocked or offline/i, 'Lookup outage isolation missing');
requireText(nativeAdapter, /initiatedByUser !== true/i, 'Native tracking explicit-start gate missing');
requireText(nativeAdapter, /attachToAlreadyActiveShift/i, 'Native active-shift reattach path missing');
requireText(nativeAdapter, /ensureStoppedWhenNoActiveShift/i, 'Orphan native tracking stop path missing');
requireText(nativeAdapter, /createQueuedWrite/i, 'Native GPS is not wired into idempotent queue');

requireText(edgeAuth, /PERFORMANCE_EDGE_VERSION = '2026\.08\.18-performance-edge-v2'/i, 'Current Edge auth version missing');
requireText(edgeAuth, /npm:@supabase\/supabase-js@2\.111\.0/, 'Supabase Edge dependency not pinned');
requireText(edgeAuth, /SUPABASE_PUBLISHABLE_KEYS/, 'Publishable-key environment support missing');
requireText(edgeAuth, /SUPABASE_SECRET_KEYS/, 'Secret-key environment support missing');
requireText(edgeAuth, /auth\.getUser\(token\)/i, 'Mint/revoke user JWT not validated in handler');
requireText(edgeAuth, /PERFORMANCE_DEVICE_REVOKED_OR_UNENROLLED/i, 'Revoked Edge actor state missing');
requireText(mint, /\['manager', 'admin'\]\.includes\(actor\.role\)/, 'Mint manager/admin gate missing');
requireText(mint, /sha256Hex\(token\)/, 'Mint token hashing missing');
requireText(redeem, /auth\.admin\.createUser/i, 'Hidden device Auth creation missing');
requireText(redeem, /performance_finalize_device_enrollment/i, 'Redeem atomic finalizer missing');
requireText(redeem, /signInWithPassword/i, 'Device session issuance missing');
const sessionStart = redeem.indexOf('session: {');
if (sessionStart < 0) fail('Device session response missing');
if (/hiddenPassword|hiddenEmail/.test(redeem.slice(sessionStart, sessionStart + 650))) fail('Hidden device credential appears in response body');
requireText(redeem, /accessToken:\s*signedIn\.session\.access_token/i, 'Access token response missing');
requireText(redeem, /refreshToken:\s*signedIn\.session\.refresh_token/i, 'Refresh token response missing');
requireText(revoke, /performance_revoke_device/i, 'Device revoke RPC missing');
requireText(revoke, /ban_duration/i, 'Auth user ban after revoke missing');

for (const name of ['performance-enrollment-mint','performance-enrollment-redeem','performance-device-revoke']) {
  requireText(config, new RegExp(`\\[functions\\.${name}\\][\\s\\S]{0,160}verify_jwt\\s*=\\s*false`, 'i'), `verify_jwt=false config missing for ${name}`);
}

const secretScanFiles = [
  'performance/shared/performance-math.mjs','performance/shared/performance-events.mjs',
  'performance/native/performance-location-contract.mjs','performance/native/capacitor-location-bridge.mjs',
  'performance/client/performance-session.mjs','performance/client/performance-sync.mjs',
  'supabase/functions/_shared/performance-auth.ts','supabase/functions/performance-enrollment-mint/index.ts',
  'supabase/functions/performance-enrollment-redeem/index.ts','supabase/functions/performance-device-revoke/index.ts',
  'supabase/config.toml'
];
const forbiddenSecrets = [
  /sb_secret_[A-Za-z0-9_-]+/i,
  /service[_-]?role\s*[:=]\s*['"][A-Za-z0-9._-]{12,}/i,
  /SUPABASE_SERVICE_ROLE_KEY\s*=\s*[^\s$]/i
];
for (const file of secretScanFiles) {
  const text = read(file);
  for (const pattern of forbiddenSecrets) if (pattern.test(text)) fail(`Privileged backend secret pattern found in ${file}`);
}

console.log('Paradise Performance v1 foundation static validation: PASS');
