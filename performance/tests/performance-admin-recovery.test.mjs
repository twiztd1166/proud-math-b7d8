import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  createRecoverySecret,
  isRecoveryReference,
  isRecoverySecret,
  isRecoveryUuid,
  sha256Hex,
  statusAllowsExchange,
} from '../client/performance-admin-recovery-core.mjs';

const read = path => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

test('browser recovery proof is high entropy and hashable without becoming a reference', async () => {
  const secret = createRecoverySecret();
  assert.equal(isRecoverySecret(secret), true);
  assert.equal(isRecoveryReference(secret), false);
  const hash = await sha256Hex(secret);
  assert.match(hash, /^[0-9a-f]{64}$/);
});

test('recovery identifiers fail closed', () => {
  assert.equal(isRecoveryReference('short'), false);
  assert.equal(isRecoveryReference('AbCdEf1234_-'), true);
  assert.equal(isRecoveryUuid('00000000-0000-4000-8000-000000000001'), true);
  assert.equal(isRecoveryUuid('not-a-uuid'), false);
  assert.equal(statusAllowsExchange('PENDING_OPERATOR_APPROVAL'), false);
  assert.equal(statusAllowsExchange('CONSUMED'), false);
  assert.equal(statusAllowsExchange('APPROVED'), true);
});

test('migration keeps recovery ledger service-role only and recovery distinct from bootstrap', async () => {
  const sql = await read('supabase/migrations/20260821201500_paradise_performance_admin_recovery.sql');
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /revoke all on table public\.performance_admin_recovery_requests from anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.performance_approve_admin_recovery[\s\S]*to service_role/i);
  assert.match(sql, /ACTIVE_IDENTITY_REQUIRED/);
  assert.match(sql, /ACTIVE_DEVICE_REQUIRED/);
  assert.match(sql, /secret_hash <> p_secret_hash/);
  assert.match(sql, /requested_device_public_id <> p_device_public_id/);
  assert.match(sql, /consumed_at = v_now/);
  assert.match(sql, /admin_recovery_replaced/);
  assert.match(sql, /auth_user_id <> p_new_auth_user_id/);
  assert.doesNotMatch(sql, /grant .*performance_admin_recovery_requests.*\b(?:anon|authenticated)\b/i);
});

test('public request endpoint cannot select an employee or approve itself', async () => {
  const source = await read('supabase/functions/performance-admin-recovery-request/index.ts');
  assert.doesNotMatch(source, /employeeId|employee_id|performance_employees|approved_employee_id/);
  assert.match(source, /secretHash/);
  assert.match(source, /devicePublicId/);
  assert.match(source, /PENDING_OPERATOR_APPROVAL/);
  assert.doesNotMatch(source, /performance_enrollment_tokens/);
});

test('status and redeem require browser proof; finalization requires authenticated admin', async () => {
  const status = await read('supabase/functions/performance-admin-recovery-status/index.ts');
  const redeem = await read('supabase/functions/performance-admin-recovery-redeem/index.ts');
  const finalize = await read('supabase/functions/performance-admin-recovery-finalize/index.ts');
  assert.match(status, /sha256Hex\(recoverySecret\)/);
  assert.match(status, /requested_device_public_id/);
  assert.match(redeem, /sha256Hex\(recoverySecret\)/);
  assert.match(redeem, /performance_exchange_admin_recovery/);
  assert.match(finalize, /authenticatePerformanceActor/);
  assert.match(finalize, /actor\.role !== 'admin'/);
  assert.match(finalize, /performance_finalize_admin_recovery/);
});

test('browser page never displays or persists the recovery or enrollment secret', async () => {
  const html = await read('performance-admin-recovery.html');
  const ui = await read('performance/client/performance-admin-recovery.mjs');
  assert.match(html, /browser-held recovery secret is never displayed/i);
  assert.match(ui, /window\.sessionStorage\.setItem\(RECOVERY_STATE_KEY/);
  assert.match(ui, /referenceEl\.textContent = state\.requestReference/);
  assert.doesNotMatch(ui, /textContent\s*=\s*state\.recoverySecret/);
  assert.doesNotMatch(ui, /localStorage\.setItem\([^\n]*recoverySecret/);
  assert.doesNotMatch(ui, /localStorage\.setItem\([^\n]*enrollmentToken/);
  assert.doesNotMatch(html + ui, /service[_-]?role/i);
});

test('Edge auth configuration preserves pre-session and post-enrollment boundaries', async () => {
  const config = await read('supabase/config.toml');
  assert.match(config, /\[functions\.performance-admin-recovery-request\][\s\S]*?verify_jwt = false/);
  assert.match(config, /\[functions\.performance-admin-recovery-status\][\s\S]*?verify_jwt = false/);
  assert.match(config, /\[functions\.performance-admin-recovery-redeem\][\s\S]*?verify_jwt = false/);
  assert.match(config, /\[functions\.performance-admin-recovery-finalize\][\s\S]*?verify_jwt = true/);
});
