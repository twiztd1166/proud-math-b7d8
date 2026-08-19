import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const foundation = fs.readFileSync('supabase/migrations/20260818072700_paradise_performance_v1_foundation.sql', 'utf8');
const grouping = fs.readFileSync('supabase/migrations/20260819100325_paradise_performance_v1_kpi_version_grouping.sql', 'utf8');

test('KPI version grouping migration replaces one-label-only uniqueness with one metric per pinned version', () => {
  assert.match(foundation, /version_label text not null unique/i);
  assert.match(grouping, /drop constraint if exists performance_kpi_standard_versions_version_label_key/i);
  assert.match(grouping, /unique\s*\(\s*version_label\s*,\s*metric_key\s*\)/i);
});

test('KPI version grouping migration does not seed Paradise thresholds', () => {
  assert.doesNotMatch(grouping, /insert\s+into\s+public\.performance_kpi_standard_versions/i);
  assert.doesNotMatch(grouping, /\bminimum\s*=\s*\d/i);
  assert.doesNotMatch(grouping, /\babove_standard\s*=\s*\d/i);
});
