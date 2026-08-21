import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync('supabase/functions/performance-first-manager-bootstrap-mint/index.ts', 'utf8');
const config = fs.readFileSync('supabase/config.toml', 'utf8');

const has = pattern => assert.match(source, pattern);
const lacks = pattern => assert.doesNotMatch(source, pattern);

test('first-manager bootstrap is JWT gated and administrator-metadata bound', () => {
  assert.match(config, /\[functions\.performance-first-manager-bootstrap-mint\][\s\S]{0,100}verify_jwt\s*=\s*true/i);
  has(/auth\.auth\.getUser\(jwt\)/i);
  has(/paradise_performance_first_manager_bootstrap/i);
  has(/performance_bootstrap_manager_employee_id/i);
  lacks(/body\?\.employeeId|body\.employeeId/i);
});

test('first-manager bootstrap cannot target store-review synthetic identities', () => {
  has(/1f8af617-73ef-4b0d-a741-23c9f062077e/i);
  has(/fd669519-c21a-4d2f-8b98-d1a1eae24893/i);
  has(/SYNTHETIC_REVIEW_EMPLOYEE_FORBIDDEN/i);
  has(/ACTIVE_REAL_MANAGER_OR_ADMIN_NOT_FOUND/i);
});

test('first-manager bootstrap closes permanently after any real privileged lineage exists', () => {
  has(/historicalPrivilegedIdentityCount/i);
  has(/\.in\('role', \['manager', 'admin'\]\)/i);
  has(/performance_actor_identities/i);
  has(/PRIVILEGED_PERFORMANCE_ACTOR_ALREADY_EXISTS/i);
  has(/FIRST_MANAGER_BOOTSTRAP_ALREADY_USED/i);
  has(/revoked_at/i);
});

test('bootstrap returns only an ordinary short-lived one-time enrollment secret', () => {
  has(/BOOTSTRAP_TOKEN_MINUTES = 10/i);
  has(/randomSecret\(32\)/i);
  has(/sha256Hex\(token\)/i);
  has(/performance_enrollment_tokens/i);
  has(/REDEEM_IMMEDIATELY_THROUGH_ORDINARY_TRUSTED_DEVICE_FLOW/i);
  lacks(/service_role|secretKey\(\)|SUPABASE_SERVICE_ROLE_KEY/i);
});

test('temporary bootstrap Auth identity is disabled before token handoff', () => {
  has(/admin\.auth\.admin\.updateUserById\(bootstrapUser\.id/i);
  has(/\[BOOTSTRAP_FLAG\]: false/i);
  has(/\[BOOTSTRAP_MANAGER_ID\]: null/i);
  has(/ban_duration:\s*LONG_BAN_DURATION/i);
  has(/BOOTSTRAP_IDENTITY_DISABLE_FAILED/i);
  has(/\.eq\('token_hash', tokenHash\)/i);
});

test('bootstrap function does not become a password or alternate actor-provisioning service', () => {
  lacks(/authenticatePerformanceActor\(/i);
  lacks(/createUser\(/i);
  lacks(/Deno\.env\.get\([^)]*(PASSWORD|BOOTSTRAP_SECRET|BOOTSTRAP_PASSWORD)/i);
});
