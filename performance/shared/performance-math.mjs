export const PERFORMANCE_MATH_VERSION = '2026.08.19-performance-baseline-v2';

export function finiteNonNegative(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function safeDivide(numerator, denominator) {
  const n = finiteNonNegative(numerator);
  const d = finiteNonNegative(denominator);
  if (n === null || d === null || d === 0) return null;
  return n / d;
}

export function perHour(count, hours) {
  return safeDivide(count, hours);
}

export function rate(successes, eligible) {
  return safeDivide(successes, eligible);
}

export function classifyAgainstStandard(value, standard = {}) {
  const v = finiteNonNegative(value);
  const minimum = finiteNonNegative(standard.minimum);
  const above = finiteNonNegative(standard.aboveStandard);
  if (v === null) return { status: 'N/A', value: null, minimum, aboveStandard: above };
  if (minimum === null) return { status: 'STANDARD_NOT_CONFIGURED', value: v, minimum: null, aboveStandard: above };
  if (v < minimum) return { status: 'BELOW_STANDARD', value: v, minimum, aboveStandard: above };
  if (above !== null && above > minimum && v >= above) return { status: 'ABOVE_STANDARD', value: v, minimum, aboveStandard: above };
  if (above !== null && above > minimum) return { status: 'MEETS_STANDARD', value: v, minimum, aboveStandard: above };
  return { status: 'MEETS_OR_EXCEEDS_MINIMUM', value: v, minimum, aboveStandard: null };
}

export function normalizeAggregate(input = {}) {
  const number = key => finiteNonNegative(input[key]) ?? 0;
  return {
    hours: number('hours'),
    doors: number('doors'),
    conversations: number('conversations'),
    sets: number('sets'),
    matureSets: number('matureSets'),
    demos: number('demos'),
    eligibleDemos: number('eligibleDemos'),
    sales: number('sales'),
    revenue: number('revenue'),
    commissionEarned: number('commissionEarned'),
    commissionPaid: number('commissionPaid'),
    pendingOutcomes: number('pendingOutcomes')
  };
}

export function calculatePerformance(input = {}) {
  const a = normalizeAggregate(input);
  return Object.freeze({
    ...a,
    knocksPerHour: perHour(a.doors, a.hours),
    conversationsPerHour: perHour(a.conversations, a.hours),
    setsPerHour: perHour(a.sets, a.hours),
    demosPerHour: perHour(a.demos, a.hours),
    salesPerHour: perHour(a.sales, a.hours),
    conversationRate: rate(a.conversations, a.doors),
    setRate: rate(a.sets, a.conversations),
    demoRate: rate(a.demos, a.matureSets),
    saleRate: rate(a.sales, a.eligibleDemos),
    setToSaleRate: rate(a.sales, a.matureSets),
    revenuePerHour: perHour(a.revenue, a.hours),
    averageSale: rate(a.revenue, a.sales),
    commissionOutstanding: Math.max(0, a.commissionEarned - a.commissionPaid)
  });
}

export function leaderboardEligibility({ hours, opportunities }, rule = {}) {
  const configured = rule.minimumHours !== undefined || rule.minimumOpportunities !== undefined;
  if (!configured) {
    return Object.freeze({
      eligible: false,
      provisional: true,
      configured: false,
      reasons: ['ELIGIBILITY_RULE_NOT_CONFIGURED']
    });
  }

  const h = finiteNonNegative(hours) ?? 0;
  const o = finiteNonNegative(opportunities) ?? 0;
  const minHours = finiteNonNegative(rule.minimumHours) ?? 0;
  const minOpportunities = finiteNonNegative(rule.minimumOpportunities) ?? 0;
  const reasons = [];
  if (h < minHours) reasons.push('MINIMUM_HOURS_NOT_MET');
  if (o < minOpportunities) reasons.push('MINIMUM_OPPORTUNITIES_NOT_MET');
  return Object.freeze({ eligible: reasons.length === 0, provisional: reasons.length > 0, configured: true, reasons });
}

export function explainKpi(metric, performance, standard = {}) {
  if (!(metric in performance)) throw new Error(`Unknown KPI: ${metric}`);
  const value = performance[metric];
  const classification = classifyAgainstStandard(value, standard);
  return Object.freeze({
    metric,
    value,
    status: classification.status,
    minimum: classification.minimum,
    aboveStandard: classification.aboveStandard,
    pendingOutcomes: performance.pendingOutcomes ?? 0,
    mathVersion: PERFORMANCE_MATH_VERSION
  });
}
