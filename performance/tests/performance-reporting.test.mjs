import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildLeaderboard,
  buildOriginCohortAggregate,
  buildPerformanceReport,
  localDateKey,
  reportingWindow,
  resolvePinnedKpiStandards,
  selectEffectiveKpiStandard,
} from '../shared/performance-reporting.mjs';

const TZ = 'America/New_York';

test('local reporting dates honor Eastern Time rather than UTC calendar date', () => {
  assert.equal(localDateKey('2026-08-19T03:30:00Z', TZ), '2026-08-18');
  assert.equal(localDateKey('2026-08-19T04:30:00Z', TZ), '2026-08-19');
});

test('rolling windows use local calendar days and include the as-of day', () => {
  const sixty = reportingWindow({ periodType: 'rolling_60d', asOf: '2026-08-19T12:00:00Z', timeZone: TZ });
  assert.equal(sixty.startDate, '2026-06-21');
  assert.equal(sixty.endDateExclusive, '2026-08-20');

  const ninety = reportingWindow({ periodType: 'rolling_90d', asOf: '2026-08-19T12:00:00Z', timeZone: TZ });
  assert.equal(ninety.startDate, '2026-05-22');
  assert.equal(ninety.endDateExclusive, '2026-08-20');
});

test('weekly reporting requires an explicit Paradise week-start convention', () => {
  assert.throws(
    () => reportingWindow({ periodType: 'week', asOf: '2026-08-19T12:00:00Z', timeZone: TZ }),
    /weekStartsOn must be explicitly configured/
  );

  const week = reportingWindow({ periodType: 'week', asOf: '2026-08-19T12:00:00Z', timeZone: TZ, weekStartsOn: 1 });
  assert.equal(week.startDate, '2026-08-17');
  assert.equal(week.endDateExclusive, '2026-08-20');

  const month = reportingWindow({ periodType: 'month', asOf: '2026-08-19T12:00:00Z', timeZone: TZ });
  assert.equal(month.startDate, '2026-08-01');
  assert.equal(month.endDateExclusive, '2026-08-20');

  const ytd = reportingWindow({ periodType: 'ytd', asOf: '2026-08-19T12:00:00Z', timeZone: TZ });
  assert.equal(ytd.startDate, '2026-01-01');
  assert.equal(ytd.endDateExclusive, '2026-08-20');
});

test('current week/month windows stop at the as-of day and exclude future-dated records', () => {
  const aggregate = buildOriginCohortAggregate({
    periodType: 'week',
    asOf: '2026-08-19T20:00:00Z',
    timeZone: TZ,
    weekStartsOn: 1,
    sets: [
      { id: 'today', setCapturedAt: '2026-08-19T15:00:00Z', status: 'complete' },
      { id: 'future-this-week', setCapturedAt: '2026-08-21T15:00:00Z', status: 'complete' },
    ],
  });
  assert.equal(aggregate.aggregate.sets, 1);
});

test('origin cohort keeps later demo and sale attributed to the original set/work period', () => {
  const aggregate = buildOriginCohortAggregate({
    periodType: 'day',
    asOf: '2026-08-19T20:00:00Z',
    timeZone: TZ,
    shifts: [{
      id: 'shift-1', employeeId: 'emp-1', status: 'finished',
      startedAt: '2026-08-19T13:00:00Z', finishedAt: '2026-08-19T19:00:00Z',
      doors: 120, conversations: 40, breakSeconds: 1800,
      kpiStandardVersionLabel: 'AUG-2026',
    }],
    sets: [{
      id: 'set-1', originShiftId: 'shift-1', setCapturedAt: '2026-08-19T15:00:00Z', status: 'complete',
    }],
    outcomes: [{
      setId: 'set-1', demoStatus: 'demoed', demoAt: '2026-08-21T15:00:00Z',
      saleStatus: 'sold', saleAt: '2026-08-21T17:00:00Z', saleAmount: 25000,
    }],
  });

  assert.equal(aggregate.aggregate.hours, 5.5);
  assert.equal(aggregate.aggregate.sets, 1);
  assert.equal(aggregate.aggregate.matureSets, 1);
  assert.equal(aggregate.aggregate.demos, 1);
  assert.equal(aggregate.aggregate.eligibleDemos, 1);
  assert.equal(aggregate.aggregate.sales, 1);
  assert.equal(aggregate.aggregate.revenue, 25000);
  assert.deepEqual(aggregate.evidence.kpiStandardVersionLabels, ['AUG-2026']);
});

test('later-period set is not pulled backward just because its sale occurred in the selected period', () => {
  const aggregate = buildOriginCohortAggregate({
    periodType: 'day',
    asOf: '2026-08-19T20:00:00Z',
    timeZone: TZ,
    shifts: [],
    sets: [{ id: 'set-future', setCapturedAt: '2026-08-20T15:00:00Z', status: 'complete' }],
    outcomes: [{ setId: 'set-future', demoStatus: 'demoed', saleStatus: 'sold', saleAmount: 15000 }],
  });
  assert.equal(aggregate.aggregate.sets, 0);
  assert.equal(aggregate.aggregate.sales, 0);
  assert.equal(aggregate.aggregate.revenue, 0);
});

test('pending outcomes are excluded from mature denominators instead of treated as failures', () => {
  const aggregate = buildOriginCohortAggregate({
    periodType: 'day',
    asOf: '2026-08-19T20:00:00Z',
    timeZone: TZ,
    sets: [
      { id: 'pending-demo', setCapturedAt: '2026-08-19T14:00:00Z', status: 'open' },
      { id: 'pending-sale', setCapturedAt: '2026-08-19T15:00:00Z', status: 'open' },
      { id: 'no-demo', setCapturedAt: '2026-08-19T16:00:00Z', status: 'complete' },
    ],
    outcomes: [
      { setId: 'pending-demo', demoStatus: 'pending', saleStatus: 'pending' },
      { setId: 'pending-sale', demoStatus: 'demoed', saleStatus: 'pending' },
      { setId: 'no-demo', demoStatus: 'no_demo', saleStatus: 'not_eligible' },
    ],
  });

  assert.equal(aggregate.aggregate.sets, 3);
  assert.equal(aggregate.aggregate.matureSets, 2);
  assert.equal(aggregate.aggregate.demos, 1);
  assert.equal(aggregate.aggregate.eligibleDemos, 0);
  assert.equal(aggregate.aggregate.pendingOutcomes, 2);
});

test('cancelled and not-eligible outcomes are explicitly excluded rather than silently failed', () => {
  const aggregate = buildOriginCohortAggregate({
    periodType: 'day',
    asOf: '2026-08-19T20:00:00Z',
    sets: [
      { id: 'cancelled', setCapturedAt: '2026-08-19T14:00:00Z', status: 'complete' },
      { id: 'not-eligible', setCapturedAt: '2026-08-19T15:00:00Z', status: 'complete' },
    ],
    outcomes: [
      { setId: 'cancelled', demoStatus: 'cancelled', saleStatus: 'cancelled' },
      { setId: 'not-eligible', demoStatus: 'not_eligible', saleStatus: 'not_eligible' },
    ],
  });
  assert.equal(aggregate.aggregate.matureSets, 0);
  assert.equal(aggregate.evidence.excludedDemoOutcomes, 2);
});

test('inconsistent sold-without-demo state is surfaced as a data issue while preserving raw sale truth', () => {
  const aggregate = buildOriginCohortAggregate({
    periodType: 'day',
    asOf: '2026-08-19T20:00:00Z',
    sets: [{ id: 'set-1', setCapturedAt: '2026-08-19T14:00:00Z', status: 'complete' }],
    outcomes: [{ setId: 'set-1', demoStatus: 'pending', saleStatus: 'sold', saleAmount: 10000 }],
  });
  assert.equal(aggregate.aggregate.sales, 1);
  assert.equal(aggregate.aggregate.eligibleDemos, 0);
  assert.equal(aggregate.aggregate.revenue, 10000);
  assert.ok(aggregate.evidence.dataIssues.some(issue => issue.code === 'SALE_STATUS_WITHOUT_DEMOED_STATUS'));
});

test('active current-day shift may accrue to as-of, but stale unfinished historical shift is not fabricated', () => {
  const current = buildOriginCohortAggregate({
    periodType: 'day', asOf: '2026-08-19T18:00:00Z', timeZone: TZ,
    shifts: [{ id: 'active', status: 'active', startedAt: '2026-08-19T14:00:00Z', breakSeconds: 0 }],
  });
  assert.equal(current.aggregate.hours, 4);

  const stale = buildOriginCohortAggregate({
    periodType: 'week', asOf: '2026-08-19T18:00:00Z', timeZone: TZ, weekStartsOn: 1,
    shifts: [{ id: 'stale', status: 'active', startedAt: '2026-08-18T14:00:00Z', breakSeconds: 0 }],
  });
  assert.equal(stale.aggregate.hours, 0);
  assert.ok(stale.evidence.dataIssues.some(issue => issue.code === 'SHIFT_MISSING_FINISH'));
});

test('DST transition day uses actual elapsed timestamps rather than assuming 24-hour days', () => {
  const aggregate = buildOriginCohortAggregate({
    periodType: 'day',
    asOf: '2026-03-08T20:00:00Z',
    timeZone: TZ,
    shifts: [{
      id: 'dst', status: 'finished',
      startedAt: '2026-03-08T06:30:00Z',
      finishedAt: '2026-03-08T10:30:00Z',
      breakSeconds: 0,
    }],
  });
  assert.equal(aggregate.aggregate.hours, 4);
});

test('effective standard selection accepts one unambiguous active scoped rule', () => {
  const selected = selectEffectiveKpiStandard({
    standards: [
      { versionLabel: 'TEAM', metricKey: 'sets_per_hour', appliesToRole: 'canvasser', appliesToTeam: 'East A', effectiveFrom: '2026-08-01T00:00:00Z', minimum: 0.7 },
    ],
    metricKey: 'sets_per_hour',
    at: '2026-08-19T12:00:00Z',
    scope: { role: 'canvasser', team: 'East A' },
  });
  assert.equal(selected.versionLabel, 'TEAM');
  assert.equal(selected.minimum, 0.7);
});

test('overlapping active KPI scopes fail closed rather than inventing precedence', () => {
  assert.throws(() => selectEffectiveKpiStandard({
    standards: [
      { versionLabel: 'GEN', metricKey: 'sets_per_hour', effectiveFrom: '2026-01-01T00:00:00Z', minimum: 0.5 },
      { versionLabel: 'TEAM', metricKey: 'sets_per_hour', appliesToTeam: 'East A', effectiveFrom: '2026-08-01T00:00:00Z', minimum: 0.7 },
    ],
    metricKey: 'sets_per_hour',
    at: '2026-08-19T12:00:00Z',
    scope: { team: 'East A' },
  }), /Ambiguous KPI standard/);
});

test('no effective standard returns null instead of inventing a threshold', () => {
  const selected = selectEffectiveKpiStandard({
    standards: [], metricKey: 'sets_per_hour', at: '2026-08-19T12:00:00Z', scope: { role: 'canvasser' },
  });
  assert.equal(selected, null);
});

test('historical report uses pinned standard version and never silently substitutes current standard', () => {
  const report = buildPerformanceReport({
    periodType: 'day', asOf: '2026-08-19T20:00:00Z', timeZone: TZ,
    shifts: [{
      id: 'shift-1', status: 'finished', startedAt: '2026-08-19T13:00:00Z', finishedAt: '2026-08-19T18:00:00Z',
      doors: 100, conversations: 30, kpiStandardVersionLabel: 'PINNED-AUG',
    }],
    sets: [{ id: 'set-1', originShiftId: 'shift-1', setCapturedAt: '2026-08-19T15:00:00Z', status: 'complete' }],
    standards: [
      { versionLabel: 'PINNED-AUG', metricKey: 'sets_per_hour', minimum: 0.1, effectiveFrom: '2026-08-01T00:00:00Z' },
      { versionLabel: 'NEWER', metricKey: 'sets_per_hour', minimum: 99, effectiveFrom: '2026-08-18T00:00:00Z' },
    ],
  });
  assert.equal(report.standardResolution.status, 'READY');
  assert.equal(report.standardResolution.versionLabel, 'PINNED-AUG');
  assert.equal(report.kpis.setsPerHour.minimum, 0.1);
});

test('mixed pinned standard versions block a single historical classification', () => {
  const result = resolvePinnedKpiStandards({
    standards: [], versionLabels: ['A', 'B'],
  });
  assert.equal(result.status, 'MIXED_PINNED_STANDARDS');
});

test('leaderboard does not create official ranks until an eligibility rule exists', () => {
  const rows = buildLeaderboard({
    metric: 'setsPerHour',
    reports: [
      { employeeId: 'a', displayName: 'A', performance: { hours: 1, conversations: 10, setsPerHour: 2, pendingOutcomes: 0 } },
      { employeeId: 'b', displayName: 'B', performance: { hours: 10, conversations: 100, setsPerHour: 1, pendingOutcomes: 0 } },
    ],
  });
  assert.equal(rows[0].eligibility.configured, false);
  assert.equal(rows[0].rank, null);
  assert.equal(rows[1].rank, null);
});

test('configured leaderboard eligibility ranks mature samples and leaves short samples provisional', () => {
  const rows = buildLeaderboard({
    metric: 'setsPerHour',
    eligibilityRule: { minimumHours: 5, minimumOpportunities: 20 },
    reports: [
      { employeeId: 'short', displayName: 'Short', performance: { hours: 1, conversations: 10, setsPerHour: 3, pendingOutcomes: 0 } },
      { employeeId: 'good', displayName: 'Good', performance: { hours: 8, conversations: 40, setsPerHour: 1.2, pendingOutcomes: 0 } },
      { employeeId: 'better', displayName: 'Better', performance: { hours: 8, conversations: 40, setsPerHour: 1.5, pendingOutcomes: 0 } },
    ],
  });
  assert.equal(rows[0].employeeId, 'better');
  assert.equal(rows[0].rank, 1);
  assert.equal(rows[1].employeeId, 'good');
  assert.equal(rows[1].rank, 2);
  assert.equal(rows[2].employeeId, 'short');
  assert.equal(rows[2].rank, null);
  assert.equal(rows[2].eligibility.provisional, true);
});
