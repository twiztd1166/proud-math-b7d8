import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = fs.readFileSync('supabase/functions/performance-first-manager-bootstrap-provision/index.ts', 'utf8');
const migration = fs.readFileSync('supabase/migrations/20260821103500_paradise_performance_v1_first_admin_bootstrap_challenge.sql', 'utf8');
const client = fs.readFileSync('performance/client/performance-first-admin-bootstrap.mjs', 'utf8');
const html = fs.readFileSync('performance/client/performance-first-admin-bootstrap.html', 'utf8');
const config = fs.readFileSync('supabase/config.toml', 'utf8');

const has = (text, pattern) => assert.match(text, pattern);
const lacks = (text, pattern) => assert.doesNotMatch(text, pattern);

test('one-time challenge stores only hashes and is client inaccessible', () => {
  has(migration, /proof_hash text not null unique/i);
  has(migration, /email_hash text not null/i);
  has(migration, /consumed_at timestamptz/i);
  has(migration, /enable row level security/i);
  has(migration, /revoke all on table public\.performance_bootstrap_challenges from public, anon, authenticated/i);
  has(migration, /performance_bootstrap_challenges_deny_client/i);
  lacks(migration, /\bemail\s+text\b|\bproof\s+text\b|\bpassword\s+text\b/i);
});

test('proof-gated provision endpoint uses custom out-of-band authorization and supported Auth Admin createUser', () => {
  assert.match(config, /\[functions\.performance-first-manager-bootstrap-provision\][\s\S]{0,100}verify_jwt\s*=\s*false/i);
  has(source, /sha256Hex\(email\)/i);
  has(source, /sha256Hex\(proof\)/i);
  has(source, /performance_bootstrap_challenges/i);
  has(source, /admin\.auth\.admin\.createUser\(/i);
  has(source, /email_confirm:\s*true/i);
  has(source, /paradise_performance_first_manager_bootstrap/i);
  has(source, /performance_bootstrap_manager_employee_id/i);
  lacks(source, /body\?\.employeeId|body\.employeeId/i);
  lacks(source, /service_role|SUPABASE_SERVICE_ROLE_KEY|sb_secret_/i);
});

test('proof is atomically burned before Auth user creation', () => {
  const consume = source.indexOf(".update({ consumed_at: nowIso })");
  const create = source.indexOf('admin.auth.admin.createUser');
  assert.ok(consume >= 0 && create > consume, 'challenge must be consumed before createUser');
  has(source, /BOOTSTRAP_PROOF_ALREADY_CONSUMED/i);
  has(source, /BOOTSTRAP_AUTH_PROVISIONING_FAILED_PROOF_BURNED/i);
});

test('provisioning still closes after privileged actor lineage and excludes synthetic review identities', () => {
  has(source, /SYNTHETIC_REVIEW_EMPLOYEE_IDS/i);
  has(source, /SYNTHETIC_REVIEW_EMPLOYEE_FORBIDDEN/i);
  has(source, /historicalPrivilegedIdentityCount/i);
  has(source, /FIRST_MANAGER_BOOTSTRAP_ALREADY_USED/i);
  has(source, /\['manager', 'admin'\]\.includes\(manager\.role\)/i);
});

test('browser never stores or displays the temporary password and finishes through ordinary device redemption', () => {
  has(client, /persistSession:\s*false/i);
  has(client, /autoRefreshToken:\s*false/i);
  has(client, /crypto\.getRandomValues/i);
  has(client, /performance-first-manager-bootstrap-provision/i);
  has(client, /signInWithPassword/i);
  has(client, /performance-first-manager-bootstrap-mint/i);
  has(client, /redeemTrustedDevice/i);
  has(client, /platform:\s*'web-test'/i);
  lacks(client, /localStorage\.setItem\([^)]*(password|proof|email)/i);
  lacks(client, /@paradiseexteriors\.com|husseygrowthcollc@gmail\.com/i);
  lacks(html, /@paradiseexteriors\.com|husseygrowthcollc@gmail\.com/i);
  has(html, /noindex,nofollow,noarchive/i);
});
