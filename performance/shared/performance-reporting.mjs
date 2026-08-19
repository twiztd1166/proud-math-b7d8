import {
  calculatePerformance,
  explainKpi,
  finiteNonNegative,
  leaderboardEligibility,
} from './performance-math.mjs';

export const PERFORMANCE_REPORTING_VERSION = '2026.08.19-origin-cohort-v1';
export const DEFAULT_REPORTING_TIME_ZONE = 'America/New_York';
export const SUPPORTED_PERIOD_TYPES = Object.freeze(['day', 'week', 'month', 'rolling_60d', 'rolling_90d', 'ytd']);

const REPORT_METRICS = Object.freeze(['knocksPerHour', 'setsPerHour', 'demosPerHour', 'salesPerHour']);
const DB_METRIC_KEYS = Object.freeze({
  knocksPerHour: 'knocks_per_hour',
  setsPerHour: 'sets_per_hour',
  demosPerHour: 'demos_per_hour',
  salesPerHour: 'sales_per_hour',
});

function field(record, ...keys) {
  for (const key of keys) {
    if (record && Object.prototype.hasOwnProperty.call(record, key)) return record[key];
  }
  return undefined;
}

function asDate(value, label) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error(`${label} must be a valid instant`);
  return date;
}

function datePartsFromKey(key) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key));
  if (!match) throw new Error(`Invalid local date key: ${key}`);
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function dateKeyFromParts({ year, month, day }) {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function dateOrdinal(key) {
  const { year, month, day } = datePartsFromKey(key);
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

function addLocalDays(key, days) {
  const { year, month, day } = datePartsFromKey(key);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return dateKeyFromParts({ year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() });
}

function compareDateKeys(a, b) {
  return dateOrdinal(a) - dateOrdinal(b);
}

export function localDateKey(instant, timeZone = DEFAULT_REPORTING_TIME_ZONE) {
  const date = asDate(instant, 'instant');
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function reportingWindow({ periodType, asOf, timeZone = DEFAULT_REPORTING_TIME_ZONE, weekStartsOn = 1 }) {
  if (!SUPPORTED_PERIOD_TYPES.includes(periodType)) throw new Error(`Unsupported period type: ${periodType}`);
  if (!Number.isInteger(weekStartsOn) || weekStartsOn < 0 || weekStartsOn > 6) throw new Error('weekStartsOn must be an integer from 0 to 6');

  const asOfInstant = asDate(asOf, 'asOf');
  const asOfDate = localDateKey(asOfInstant, timeZone);
  const parts = datePartsFromKey(asOfDate);
  let startDate = asOfDate;

  if (periodType === 'week') {
    const dow = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
    const delta = (dow - weekStartsOn + 7) % 7;
    startDate = addLocalDays(asOfDate, -delta);
  } else if (periodType === 'month') {
    startDate = dateKeyFromParts({ year: parts.year, month: parts.month, day: 1 });
  } else if (periodType === 'rolling_60d') {
    startDate = addLocalDays(asOfDate, -59);
  } else if (periodType === 'rolling_90d') {
    startDate = addLocalDays(asOfDate, -89);
  } else if (periodType === 'ytd') {
    startDate = `${parts.year}-01-01`;
  }

  // A report is always bounded by its selected/current local as-of day.
  // This prevents future-dated records later in the same week/month from leaking into a current-period result.
  const endDateExclusive = addLocalDays(asOfDate, 1);

  return Object.freeze({
    periodType,
    timeZone,
    weekStartsOn,
    asOf: asOfInstant.toISOString(),
    asOfDate,
    startDate,
    endDateExclusive,
  });
}

export function localDateInWindow(dateKey, window) {
  return compareDateKeys(dateKey, window.startDate) >= 0 && compareDateKeys(dateKey, window.endDateExclusive) < 0;
}

function instantInWindow(instant, window) {
  if (instant === null || instant === undefined) return false;
  return localDateInWindow(localDateKey(instant, window.timeZone), window);
}

function shiftDurationHours(shift, asOfInstant, timeZone, dataIssues) {
  const status = String(field(shift, 'status') ?? '');
  if (status === 'void') return 0;

  const startedRaw = field(shift, 'startedAt', 'started_at');
  if (!startedRaw) {
    dataIssues.push({ code: 'SHIFT_MISSING_START', shiftId: field(shift, 'id') ?? null });
    return 0;
  }

  const started = asDate(startedRaw, 'shift.startedAt');
  const finishedRaw = field(shift, 'finishedAt', 'finished_at');
  let finished;

  if (finishedRaw) {
    finished = asDate(finishedRaw, 'shift.finishedAt');
  } else if (['active', 'paused', 'finishing'].includes(status) && localDateKey(started, timeZone) === localDateKey(asOfInstant, timeZone)) {
    finished = asOfInstant;
  } else {
    dataIssues.push({ code: 'SHIFT_MISSING_FINISH', shiftId: field(shift, 'id') ?? null, status: status || null });
    return 0;
  }

  if (finished < started) {
    dataIssues.push({ code: 'SHIFT_FINISH_BEFORE_START', shiftId: field(shift, 'id') ?? null });
    return 0;
  }

  const breakSeconds = finiteNonNegative(field(shift, 'breakSeconds', 'break_seconds')) ?? 0;
  const elapsedSeconds = (finished.getTime() - started.getTime()) / 1000;
  if (breakSeconds > elapsedSeconds) {
    dataIssues.push({ code: 'SHIFT_BREAK_EXCEEDS_ELAPSED', shiftId: field(shift, 'id') ?? null });
    return 0;
  }

  if (localDateKey(started, timeZone) !== localDateKey(finished, timeZone)) {
    dataIssues.push({ code: 'SHIFT_CROSSES_LOCAL_DATE', shiftId: field(shift, 'id') ?? null });
  }
  return (elapsedSeconds - breakSeconds) / 3600;
}

function normalizeOutcome(outcome = {}) {
  return {
    demoStatus: String(field(outcome, 'demoStatus', 'demo_status') ?? 'pending'),
    saleStatus: String(field(outcome, 'saleStatus', 'sale_status') ?? 'pending'),
    saleAmount: finiteNonNegative(field(outcome, 'saleAmount', 'sale_amount')),
  };
}

function commissionForSet(commission) {
  const status = String(field(commission, 'calculationStatus', 'calculation_status') ?? '');
  if (status === 'void') return { earned: 0, paid: 0 };
  return {
    earned: finiteNonNegative(field(commission, 'calculatedAmount', 'calculated_amount')) ?? 0,
    paid: finiteNonNegative(field(commission, 'paidAmount', 'paid_amount')) ?? 0,
  };
}

export function buildOriginCohortAggregate({
  shifts = [],
  sets = [],
  outcomes = [],
  commissions = [],
  periodType,
  asOf,
  timeZone = DEFAULT_REPORTING_TIME_ZONE,
  weekStartsOn = 1,
} = {}) {
  const window = reportingWindow({ periodType, asOf, timeZone, weekStartsOn });
  const asOfInstant = asDate(asOf, 'asOf');
  const dataIssues = [];

  const cohortShifts = shifts.filter(shift => {
    if (String(field(shift, 'status') ?? '') === 'void') return false;
    const started = field(shift, 'startedAt', 'started_at');
    return started ? instantInWindow(started, window) : false;
  });

  const shiftIds = new Set(cohortShifts.map(shift => field(shift, 'id')).filter(Boolean));
  const employeeIds = new Set(cohortShifts.map(shift => field(shift, 'employeeId', 'employee_id')).filter(Boolean));
  const standardVersionLabels = new Set(cohortShifts.map(shift => field(shift, 'kpiStandardVersionLabel', 'kpi_standard_version_label')).filter(Boolean));

  let hours = 0;
  let doors = 0;
  let conversations = 0;
  for (const shift of cohortShifts) {
    hours += shiftDurationHours(shift, asOfInstant, timeZone, dataIssues);
    doors += finiteNonNegative(field(shift, 'doors')) ?? 0;
    conversations += finiteNonNegative(field(shift, 'conversations')) ?? 0;
  }

  const cohortSets = sets.filter(set => {
    if (String(field(set, 'status') ?? '') === 'void') return false;
    const originShiftId = field(set, 'originShiftId', 'origin_shift_id');
    const captured = field(set, 'setCapturedAt', 'set_captured_at');
    if (originShiftId && shiftIds.has(originShiftId)) return true;
    return captured ? instantInWindow(captured, window) : false;
  });

  const outcomeBySet = new Map(outcomes.map(outcome => [field(outcome, 'setId', 'set_id'), outcome]));
  const commissionBySet = new Map();
  for (const commission of commissions) {
    const setId = field(commission, 'setId', 'set_id');
    if (!setId) continue;
    const current = commissionBySet.get(setId) ?? { earned: 0, paid: 0 };
    const next = commissionForSet(commission);
    current.earned += next.earned;
    current.paid += next.paid;
    commissionBySet.set(setId, current);
  }

  let matureSets = 0;
  let demos = 0;
  let eligibleDemos = 0;
  let sales = 0;
  let revenue = 0;
  let commissionEarned = 0;
  let commissionPaid = 0;
  let pendingOutcomes = 0;
  let excludedDemoOutcomes = 0;
  let excludedSaleOutcomes = 0;
  let duplicateReviewSets = 0;

  for (const set of cohortSets) {
    const setId = field(set, 'id');
    if (String(field(set, 'status') ?? '') === 'duplicate_review') duplicateReviewSets += 1;
    const outcome = normalizeOutcome(outcomeBySet.get(setId));
    let pending = false;

    if (outcome.demoStatus === 'demoed') {
      matureSets += 1;
      demos += 1;
    } else if (outcome.demoStatus === 'no_demo') {
      matureSets += 1;
    } else if (outcome.demoStatus === 'pending') {
      pending = true;
    } else if (['cancelled', 'not_eligible'].includes(outcome.demoStatus)) {
      excludedDemoOutcomes += 1;
    } else {
      dataIssues.push({ code: 'UNKNOWN_DEMO_STATUS', setId: setId ?? null, value: outcome.demoStatus });
    }

    if (outcome.demoStatus === 'demoed') {
      if (['sold', 'not_sold'].includes(outcome.saleStatus)) eligibleDemos += 1;
      else if (outcome.saleStatus === 'pending') pending = true;
      else if (['cancelled', 'not_eligible'].includes(outcome.saleStatus)) excludedSaleOutcomes += 1;
      else dataIssues.push({ code: 'UNKNOWN_SALE_STATUS', setId: setId ?? null, value: outcome.saleStatus });
    } else if (['sold', 'not_sold'].includes(outcome.saleStatus)) {
      dataIssues.push({ code: 'SALE_STATUS_WITHOUT_DEMOED_STATUS', setId: setId ?? null, saleStatus: outcome.saleStatus, demoStatus: outcome.demoStatus });
    }

    if (outcome.saleStatus === 'sold') {
      sales += 1;
      if (outcome.saleAmount === null) {
        dataIssues.push({ code: 'SOLD_SET_MISSING_SALE_AMOUNT', setId: setId ?? null });
      } else {
        revenue += outcome.saleAmount;
      }
    }

    if (pending) pendingOutcomes += 1;

    const commission = commissionBySet.get(setId);
    if (commission) {
      commissionEarned += commission.earned;
      commissionPaid += commission.paid;
    }
  }

  return Object.freeze({
    window,
    attributionModel: 'origin_cohort',
    aggregate: Object.freeze({
      hours,
      doors,
      conversations,
      sets: cohortSets.length,
      matureSets,
      demos,
      eligibleDemos,
      sales,
      revenue,
      commissionEarned,
      commissionPaid,
      pendingOutcomes,
    }),
    evidence: Object.freeze({
      shiftCount: cohortShifts.length,
      setCount: cohortSets.length,
      duplicateReviewSets,
      excludedDemoOutcomes,
      excludedSaleOutcomes,
      employeeIds: Object.freeze([...employeeIds]),
      kpiStandardVersionLabels: Object.freeze([...standardVersionLabels]),
      dataIssues: Object.freeze(dataIssues),
    }),
  });
}

function normalizedStandard(standard) {
  if (!standard) return null;
  return {
    id: field(standard, 'id') ?? null,
    versionLabel: field(standard, 'versionLabel', 'version_label') ?? null,
    metricKey: field(standard, 'metricKey', 'metric_key') ?? null,
    appliesToRole: field(standard, 'appliesToRole', 'applies_to_role') ?? null,
    appliesToOffice: field(standard, 'appliesToOffice', 'applies_to_office') ?? null,
    appliesToTeam: field(standard, 'appliesToTeam', 'applies_to_team') ?? null,
    effectiveFrom: field(standard, 'effectiveFrom', 'effective_from') ?? null,
    effectiveTo: field(standard, 'effectiveTo', 'effective_to') ?? null,
    minimum: field(standard, 'minimum'),
    aboveStandard: field(standard, 'aboveStandard', 'above_standard'),
    minimumHours: field(standard, 'minimumHours', 'minimum_hours'),
    minimumOpportunities: field(standard, 'minimumOpportunities', 'minimum_opportunities'),
    attributionModel: field(standard, 'attributionModel', 'attribution_model') ?? 'origin_cohort',
  };
}

function scopeMatches(standard, scope = {}) {
  if (standard.appliesToRole && standard.appliesToRole !== scope.role) return false;
  if (standard.appliesToOffice && standard.appliesToOffice !== scope.office) return false;
  if (standard.appliesToTeam && standard.appliesToTeam !== scope.team) return false;
  return true;
}

function scopeSpecificity(standard) {
  return Number(Boolean(standard.appliesToRole)) + Number(Boolean(standard.appliesToOffice)) * 2 + Number(Boolean(standard.appliesToTeam)) * 4;
}

export function selectEffectiveKpiStandard({ standards = [], metricKey, at, scope = {} } = {}) {
  if (!metricKey) throw new Error('metricKey is required');
  const instant = asDate(at, 'at');
  const candidates = standards
    .map(normalizedStandard)
    .filter(standard => standard.metricKey === metricKey)
    .filter(standard => scopeMatches(standard, scope))
    .filter(standard => {
      if (!standard.effectiveFrom) return false;
      const from = asDate(standard.effectiveFrom, 'standard.effectiveFrom');
      const to = standard.effectiveTo ? asDate(standard.effectiveTo, 'standard.effectiveTo') : null;
      return from <= instant && (!to || instant < to);
    })
    .sort((a, b) => {
      const specificity = scopeSpecificity(b) - scopeSpecificity(a);
      if (specificity !== 0) return specificity;
      return asDate(b.effectiveFrom, 'standard.effectiveFrom') - asDate(a.effectiveFrom, 'standard.effectiveFrom');
    });

  if (candidates.length === 0) return null;
  const top = candidates[0];
  const ties = candidates.filter(candidate => scopeSpecificity(candidate) === scopeSpecificity(top)
    && asDate(candidate.effectiveFrom, 'standard.effectiveFrom').getTime() === asDate(top.effectiveFrom, 'standard.effectiveFrom').getTime());
  if (ties.length > 1) throw new Error(`Ambiguous KPI standard for ${metricKey}`);
  return Object.freeze(top);
}

export function resolvePinnedKpiStandards({ standards = [], versionLabels = [] } = {}) {
  const labels = [...new Set(versionLabels.filter(Boolean))];
  if (labels.length === 0) return Object.freeze({ status: 'NO_PINNED_STANDARD', versionLabel: null, standards: Object.freeze({}) });
  if (labels.length > 1) return Object.freeze({ status: 'MIXED_PINNED_STANDARDS', versionLabel: null, standards: Object.freeze({}) });

  const versionLabel = labels[0];
  const matched = standards.map(normalizedStandard).filter(standard => standard.versionLabel === versionLabel);
  const byMetric = {};
  for (const standard of matched) {
    if (!standard.metricKey) continue;
    if (byMetric[standard.metricKey]) throw new Error(`Duplicate KPI metric ${standard.metricKey} in version ${versionLabel}`);
    byMetric[standard.metricKey] = standard;
  }
  return Object.freeze({ status: matched.length ? 'READY' : 'PINNED_STANDARD_NOT_FOUND', versionLabel, standards: Object.freeze(byMetric) });
}

export function buildPerformanceReport(input = {}) {
  const cohort = buildOriginCohortAggregate(input);
  const performance = calculatePerformance(cohort.aggregate);
  const pinned = resolvePinnedKpiStandards({
    standards: input.standards ?? [],
    versionLabels: cohort.evidence.kpiStandardVersionLabels,
  });

  const kpis = {};
  for (const metric of REPORT_METRICS) {
    const dbMetricKey = DB_METRIC_KEYS[metric];
    const standard = pinned.status === 'READY' ? pinned.standards[dbMetricKey] : undefined;
    kpis[metric] = explainKpi(metric, performance, standard);
  }

  return Object.freeze({
    reportingVersion: PERFORMANCE_REPORTING_VERSION,
    attributionModel: cohort.attributionModel,
    window: cohort.window,
    performance,
    kpis: Object.freeze(kpis),
    standardResolution: pinned,
    evidence: cohort.evidence,
  });
}

export function buildLeaderboard({ reports = [], metric, eligibilityRule } = {}) {
  if (!metric) throw new Error('metric is required');
  const opportunityMetric = {
    knocksPerHour: 'doors',
    setsPerHour: 'conversations',
    demosPerHour: 'matureSets',
    salesPerHour: 'eligibleDemos',
  }[metric];
  if (!opportunityMetric) throw new Error(`Unsupported leaderboard metric: ${metric}`);

  const rows = reports.map(report => {
    const performance = report.performance ?? {};
    const eligibility = leaderboardEligibility({ hours: performance.hours, opportunities: performance[opportunityMetric] }, eligibilityRule);
    return {
      employeeId: report.employeeId ?? null,
      displayName: report.displayName ?? null,
      value: performance[metric] ?? null,
      eligibility,
      pendingOutcomes: performance.pendingOutcomes ?? 0,
    };
  }).sort((a, b) => {
    if (a.eligibility.eligible !== b.eligibility.eligible) return a.eligibility.eligible ? -1 : 1;
    if (a.value === null && b.value !== null) return 1;
    if (a.value !== null && b.value === null) return -1;
    if (a.value !== b.value) return (b.value ?? -Infinity) - (a.value ?? -Infinity);
    return String(a.displayName ?? a.employeeId ?? '').localeCompare(String(b.displayName ?? b.employeeId ?? ''));
  });

  let rank = 0;
  let priorValue = null;
  let eligibleIndex = 0;
  return Object.freeze(rows.map(row => {
    let rowRank = null;
    if (row.eligibility.eligible && row.value !== null) {
      eligibleIndex += 1;
      if (priorValue === null || row.value !== priorValue) rank = eligibleIndex;
      rowRank = rank;
      priorValue = row.value;
    }
    return Object.freeze({ ...row, rank: rowRank });
  }));
}
