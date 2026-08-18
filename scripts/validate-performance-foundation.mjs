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
const math = read('performance/shared/performance-math.mjs');
const events = read('performance/shared/performance-events.mjs');
const location = read('performance/native/performance-location-contract.mjs');

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
requireText(hardening, /performance_correction_requests_update_authorized[\s\S]*performance_is_manager\(\)/i, 'Correction resolution must remain manager/admin controlled');
requireText(hardening, /visibility parity is SELECT parity, never mutation parity/i, 'Visibility/mutation boundary missing');

if (/insert\s+into\s+public\.performance_kpi_standard_versions/i.test(sql + hardening)) fail('Migrations must not seed invented KPI standards');
if (/insert\s+into\s+public\.performance_pay_plan_versions/i.test(sql + hardening)) fail('Migrations must not seed invented pay rules');

requireText(math, /STANDARD_NOT_CONFIGURED/, 'KPI engine must represent unconfigured standards explicitly');
requireText(math, /MEETS_OR_EXCEEDS_MINIMUM/, 'Single-minimum KPI semantics missing');
requireText(events, /stable UUID reused for retries/, 'Retry identity contract missing');
requireText(location, /Finish Day stops background\/live tracking/, 'Tracking-stop invariant missing');
requireText(location, /GPS never authorizes or overrides field Lookup/, 'Native GPS authority boundary missing');
requireText(location, /off-shift Performance location is not collected/, 'Off-shift GPS prohibition missing');

const secretScanFiles = [
  'performance/shared/performance-math.mjs',
  'performance/shared/performance-events.mjs',
  'performance/native/performance-location-contract.mjs',
  'supabase/migrations/20260818072700_paradise_performance_v1_foundation.sql',
  'supabase/migrations/20260818074500_paradise_performance_v1_rls_hardening.sql'
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
