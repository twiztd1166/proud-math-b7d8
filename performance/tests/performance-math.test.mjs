import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePerformance,
  classifyAgainstStandard,
  leaderboardEligibility,
  safeDivide
} from '../shared/performance-math.mjs';

test('zero denominators are N/A rather than fabricated zero rates', () => {
  assert.equal(safeDivide(0, 0), null);
  const p = calculatePerformance({ hours: 0, doors: 0, conversations: 0, sets: 0, matureSets: 0, demos: 0, eligibleDemos: 0, sales: 0 });
  assert.equal(p.knocksPerHour, null);
  assert.equal(p.conversationRate, null);
  assert.equal(p.setRate, null);
  assert.equal(p.demoRate, null);
  assert.equal(p.saleRate, null);
});

test('requested core KPI math is deterministic', () => {
  const p = calculatePerformance({
    hours: 6.5,
    doors: 148,
    conversations: 47,
    sets: 5,
    matureSets: 4,
    demos: 3,
    eligibleDemos: 3,
    sales: 1,
    revenue: 27500,
    commissionEarned: 800,
    commissionPaid: 500,
    pendingOutcomes: 1
  });
  assert.equal(p.knocksPerHour, 148 / 6.5);
  assert.equal(p.setsPerHour, 5 / 6.5);
  assert.equal(p.demosPerHour, 3 / 6.5);
  assert.equal(p.salesPerHour, 1 / 6.5);
  assert.equal(p.demoRate, 3 / 4);
  assert.equal(p.saleRate, 1 / 3);
  assert.equal(p.revenuePerHour, 27500 / 6.5);
  assert.equal(p.averageSale, 27500);
  assert.equal(p.commissionOutstanding, 300);
  assert.equal(p.pendingOutcomes, 1);
});

test('standards are not fabricated when no minimum exists', () => {
  assert.deepEqual(classifyAgainstStandard(0.7, {}), {
    status: 'STANDARD_NOT_CONFIGURED',
    value: 0.7,
    minimum: null,
    aboveStandard: null
  });
});

test('single-minimum and three-band standard models are distinct', () => {
  assert.equal(classifyAgainstStandard(0.4, { minimum: 0.5 }).status, 'BELOW_STANDARD');
  assert.equal(classifyAgainstStandard(0.5, { minimum: 0.5 }).status, 'MEETS_OR_EXCEEDS_MINIMUM');
  assert.equal(classifyAgainstStandard(0.65, { minimum: 0.5, aboveStandard: 0.75 }).status, 'MEETS_STANDARD');
  assert.equal(classifyAgainstStandard(0.8, { minimum: 0.5, aboveStandard: 0.75 }).status, 'ABOVE_STANDARD');
});

test('leaderboard ratios remain provisional until configured sample requirements are met', () => {
  const short = leaderboardEligibility({ hours: 1, opportunities: 1 }, { minimumHours: 5, minimumOpportunities: 3 });
  assert.equal(short.eligible, false);
  assert.equal(short.provisional, true);
  assert.deepEqual(short.reasons, ['MINIMUM_HOURS_NOT_MET', 'MINIMUM_OPPORTUNITIES_NOT_MET']);

  const mature = leaderboardEligibility({ hours: 8, opportunities: 4 }, { minimumHours: 5, minimumOpportunities: 3 });
  assert.equal(mature.eligible, true);
  assert.equal(mature.provisional, false);
});
