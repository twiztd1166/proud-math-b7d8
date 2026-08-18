import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const fail = message => { throw new Error(message); };
const requireText = (text, pattern, message) => { if (!pattern.test(text)) fail(message); };

const enrollment = read('supabase/migrations/20260818084500_paradise_performance_v1_device_enrollment.sql');
const enrollmentAdvisor = read('supabase/migrations/20260818090000_paradise_performance_v1_enrollment_advisor_hardening.sql');
const readSession = read('supabase/migrations/20260818091500_paradise_performance_v1_read_session_hardening.sql');
const config = read('supabase/config.toml');
const edgeAuth = read('supabase/functions/_shared/performance-auth.ts');

requireText(enrollment, /token_hash text primary key/i, 'Enrollment token must be stored by hash');
if (/\btoken\s+text\b/i.test(enrollment)) fail('Plaintext enrollment-token storage detected');
requireText(enrollment, /revoke all on table public\.performance_enrollment_tokens from public, anon, authenticated/i, 'Enrollment token table must be client-inaccessible');
requireText(enrollmentAdvisor, /performance_enrollment_tokens_deny_client/i, 'Enrollment token explicit deny policy missing');

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
if (/create policy\s+\w+_read_all[\s\S]{0,120}using\s*\(\s*true\s*\)/i.test(readSession)) {
  fail('Unconditional shared Performance read reintroduced');
}
requireText(readSession, /generic authenticated Supabase user or a revoked device JWT must not retain team reads/i, 'Stale-JWT hardening invariant missing');

requireText(edgeAuth, /PERFORMANCE_EDGE_VERSION = '2026\.08\.18-performance-edge-v2'/i, 'Current Edge auth contract missing');
requireText(edgeAuth, /auth\.getUser\(token\)/i, 'User JWT must be validated inside Edge handler');
requireText(edgeAuth, /performance_current_employee_id/i, 'Edge actor authorization must verify current Performance enrollment');

for (const fn of ['performance-enrollment-mint', 'performance-enrollment-redeem', 'performance-device-revoke']) {
  requireText(config, new RegExp(`\\[functions\\.${fn}\\][\\s\\S]{0,80}verify_jwt\\s*=\\s*false`, 'i'), `verify_jwt=false missing for ${fn}`);
}

console.log('Paradise Performance enrollment/read-session security validation: PASS');
