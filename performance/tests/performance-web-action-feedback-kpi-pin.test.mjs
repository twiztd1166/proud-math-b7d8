import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const knockUi = readFileSync(new URL('../client/performance-web-knock-clock-ui.mjs', import.meta.url), 'utf8');
const migration = readFileSync(new URL('../../supabase/migrations/20260822091600_paradise_performance_controlled_admin_kpi_pin.sql', import.meta.url), 'utf8');

test('field actions expose immediate progress feedback instead of looking dead', () => {
  assert.match(knockUi, /STARTING…/);
  assert.match(knockUi, /STOPPING…/);
  assert.match(knockUi, /FINISHING DAY…/);
  assert.match(knockUi, /Working… please wait\./);
  assert.match(knockUi, /Still working — do not tap again\./);
  assert.match(knockUi, /aria-busy/);
});

test('Knock Clock enqueue updates local state before network flush completes', () => {
  const recordStart = knockUi.indexOf('async function recordKnockEvent');
  const recordEnd = knockUi.indexOf('\nfunction queueStopForFinishSynchronously', recordStart);
  assert.ok(recordStart >= 0 && recordEnd > recordStart);
  const section = knockUi.slice(recordStart, recordEnd);
  assert.match(section, /await runtime\.queue\.enqueue\(write\)/);
  assert.match(section, /scheduleRefresh\(0\)/);
  assert.match(section, /void runtime\.queue\.flush\(\)/);
  assert.doesNotMatch(section, /await runtime\.queue\.flush\(\)/);
});

test('Knock Clock action does not block on a second server read before durable browser enqueue', () => {
  const handlerStart = knockUi.indexOf("document.querySelector('[data-performance-knock-action]')");
  const handlerEnd = knockUi.indexOf('\n  } catch {', handlerStart);
  assert.ok(handlerStart >= 0 && handlerEnd > handlerStart);
  const section = knockUi.slice(handlerStart, handlerEnd);
  assert.doesNotMatch(section, /await clockForShift/);
  assert.match(section, /recordKnockEvent\('KNOCK_STARTED'/);
  assert.match(section, /recordKnockEvent\('KNOCK_STOPPED'/);
});

test('controlled KPI version is admin-test-only and pins the two approved live pace minimums', () => {
  assert.match(migration, /2026\.08\.22-canvass-kpi-admin-test-v1/);
  assert.match(migration, /'admin', null, null/);
  assert.match(migration, /'knocks_per_hour', 10/);
  assert.match(migration, /'sets_per_hour', 0\.50/);
  assert.match(migration, /before insert on public\.performance_shifts/);
  assert.match(migration, /new\.kpi_standard_version_label := v_versions\[1\]/);
  assert.match(migration, /Multiple KPI standard versions apply/);
  assert.doesNotMatch(migration, /'canvasser'\s*,\s*null\s*,\s*null/);
  assert.doesNotMatch(migration, /'manager'\s*,\s*null\s*,\s*null/);
  assert.doesNotMatch(migration, /above_standard[^\n]*[1-9]/i);
});
