import { calculatePerformance, finiteNonNegative } from '../shared/performance-math.mjs';
import { deriveKnockClock } from './performance-web-knock-clock.mjs';

export const PERFORMANCE_WEB_NEUTRAL_KPI_VERSION = '2026.08.21-web-neutral-kpis-v3';
export const PERFORMANCE_WEB_PACE_VERSION = '2026.08.21-web-pace-v1';

function field(record, ...keys) {
  for (const key of keys) {
    if (record && Object.prototype.hasOwnProperty.call(record, key)) return record[key];
  }
  return undefined;
}

function nonNegativeInteger(value, fallback = 0) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : fallback;
}

function asInstant(value) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function normalizedScope(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text.toLowerCase() : '';
}

function scopeMatches(constraint, actual) {
  if (constraint === null || constraint === undefined) return true;
  const expected = normalizedScope(constraint);
  if (!expected) return false;
  return normalizedScope(actual) === expected;
}

export function workedHoursForShift(shift = {}, now = Date.now()) {
  const started = asInstant(field(shift, 'started_at', 'startedAt'));
  if (!started) return null;

  const finishedRaw = field(shift, 'finished_at', 'finishedAt');
  const status = String(field(shift, 'status') ?? '').toLowerCase();
  let ended = finishedRaw ? asInstant(finishedRaw) : null;
  if (!ended && ['active', 'paused', 'finishing'].includes(status)) ended = asInstant(now);
  if (!ended || ended < started) return null;

  const elapsedSeconds = (ended.getTime() - started.getTime()) / 1000;
  const breakSeconds = finiteNonNegative(field(shift, 'break_seconds', 'breakSeconds')) ?? 0;
  if (breakSeconds > elapsedSeconds) return null;
  return (elapsedSeconds - breakSeconds) / 3600;
}

export function visibleShiftCounts(shift = {}, draft = null) {
  const authoritative = {
    doors: nonNegativeInteger(field(shift, 'doors')),
    conversations: nonNegativeInteger(field(shift, 'conversations')),
  };
  if (!draft || typeof draft !== 'object') return authoritative;
  return {
    doors: nonNegativeInteger(draft.doors, authoritative.doors),
    conversations: nonNegativeInteger(draft.conversations, authoritative.conversations),
  };
}

export function appointmentCountForShift({ serverRows = [], pendingWrites = [], shiftId } = {}) {
  const rows = new Map();
  for (const row of serverRows) {
    if (String(field(row, 'status') ?? 'open') === 'void') continue;
    const originShiftId = String(field(row, 'origin_shift_id', 'originShiftId') ?? '');
    if (shiftId && originShiftId !== String(shiftId)) continue;
    const id = String(field(row, 'client_set_id', 'clientSetId', 'id') ?? '');
    if (id) rows.set(id, { pending: false });
  }

  let pendingSyncCount = 0;
  for (const write of pendingWrites) {
    if (write?.kind !== 'SET') continue;
    if (shiftId && String(write?.payload?.originShiftId ?? '') !== String(shiftId)) continue;
    if (String(write?.payload?.status ?? 'open') === 'void') continue;
    const id = String(write?.id ?? '');
    if (!id || rows.has(id)) continue;
    rows.set(id, { pending: true });
    pendingSyncCount += 1;
  }

  return Object.freeze({ count: rows.size, pendingSyncCount });
}

export function calculateNeutralWebKpis({
  shift = {},
  appointmentCount = 0,
  countDraft = null,
  knockEvents = [],
  now = Date.now(),
} = {}) {
  const counts = visibleShiftCounts(shift, countDraft);
  const workedHours = workedHoursForShift(shift, now);
  const knockClock = deriveKnockClock({ shift, events: knockEvents, now });
  const sets = nonNegativeInteger(appointmentCount);
  const performance = calculatePerformance({
    hours: knockClock.hours ?? 0,
    doors: counts.doors,
    conversations: counts.conversations,
    sets,
  });

  return Object.freeze({
    hours: knockClock.hours,
    knockHours: knockClock.hours,
    knockSeconds: knockClock.totalSeconds,
    knockActive: knockClock.active,
    workedHours,
    doors: counts.doors,
    conversations: counts.conversations,
    appointments: sets,
    doorsPerHour: performance.knocksPerHour,
    conversationsPerHour: performance.conversationsPerHour,
    appointmentsPerHour: performance.setsPerHour,
    conversationRate: performance.conversationRate,
    appointmentRate: performance.setRate,
  });
}

export function resolveRatePaceStandard({ standards, metricKey, employee = {}, shift = {} } = {}) {
  if (!Array.isArray(standards)) {
    return Object.freeze({ status: 'GOAL_CONTEXT_UNAVAILABLE', metricKey, minimum: null, versionLabel: null });
  }
  const shiftStart = asInstant(field(shift, 'started_at', 'startedAt'));
  if (!shiftStart || !metricKey) {
    return Object.freeze({ status: 'GOAL_CONTEXT_UNAVAILABLE', metricKey, minimum: null, versionLabel: null });
  }

  const applicable = standards.filter(row => {
    if (String(field(row, 'metric_key', 'metricKey') ?? '') !== String(metricKey)) return false;
    const effectiveFrom = asInstant(field(row, 'effective_from', 'effectiveFrom'));
    if (!effectiveFrom || effectiveFrom > shiftStart) return false;
    const effectiveToRaw = field(row, 'effective_to', 'effectiveTo');
    if (effectiveToRaw !== null && effectiveToRaw !== undefined && effectiveToRaw !== '') {
      const effectiveTo = asInstant(effectiveToRaw);
      if (!effectiveTo || shiftStart >= effectiveTo) return false;
    }
    if (!scopeMatches(field(row, 'applies_to_role', 'appliesToRole'), field(employee, 'role'))) return false;
    if (!scopeMatches(field(row, 'applies_to_office', 'appliesToOffice'), field(employee, 'office'))) return false;
    if (!scopeMatches(field(row, 'applies_to_team', 'appliesToTeam'), field(employee, 'team'))) return false;
    return true;
  });

  if (applicable.length === 0) {
    return Object.freeze({ status: 'GOAL_NOT_CONFIGURED', metricKey, minimum: null, versionLabel: null });
  }
  if (applicable.length !== 1) {
    return Object.freeze({ status: 'GOAL_CONFIGURATION_AMBIGUOUS', metricKey, minimum: null, versionLabel: null });
  }

  const row = applicable[0];
  const minimum = finiteNonNegative(field(row, 'minimum'));
  if (minimum === null) {
    return Object.freeze({
      status: 'GOAL_NOT_CONFIGURED',
      metricKey,
      minimum: null,
      versionLabel: String(field(row, 'version_label', 'versionLabel') ?? '') || null,
    });
  }
  return Object.freeze({
    status: 'CONFIGURED',
    metricKey,
    minimum,
    versionLabel: String(field(row, 'version_label', 'versionLabel') ?? '') || null,
  });
}

export function classifyRatePace(value, standardResolution = {}, mode = 'ACTIVE') {
  const metricKey = standardResolution.metricKey ?? null;
  if (standardResolution.status !== 'CONFIGURED') {
    return Object.freeze({
      status: standardResolution.status || 'GOAL_CONTEXT_UNAVAILABLE',
      metricKey,
      value: finiteNonNegative(value),
      minimum: null,
      variance: null,
      attainment: null,
      versionLabel: standardResolution.versionLabel ?? null,
    });
  }

  const actual = finiteNonNegative(value);
  const minimum = finiteNonNegative(standardResolution.minimum);
  if (actual === null || minimum === null) {
    return Object.freeze({
      status: actual === null ? 'NO_MEASURED_RATE_YET' : 'GOAL_CONTEXT_UNAVAILABLE',
      metricKey,
      value: actual,
      minimum,
      variance: null,
      attainment: null,
      versionLabel: standardResolution.versionLabel ?? null,
    });
  }

  const finalMode = String(mode).toUpperCase() !== 'ACTIVE';
  const meets = actual >= minimum;
  return Object.freeze({
    status: finalMode ? (meets ? 'AT_OR_ABOVE_GOAL' : 'BELOW_GOAL') : (meets ? 'ON_PACE' : 'OFF_PACE'),
    metricKey,
    value: actual,
    minimum,
    variance: actual - minimum,
    attainment: minimum > 0 ? actual / minimum : null,
    versionLabel: standardResolution.versionLabel ?? null,
  });
}

export function buildRatePaceSummary({ kpis = {}, standards = null, employee = {}, shift = {}, mode = 'ACTIVE' } = {}) {
  const doorsStandard = resolveRatePaceStandard({ standards, metricKey: 'knocks_per_hour', employee, shift });
  const appointmentsStandard = resolveRatePaceStandard({ standards, metricKey: 'sets_per_hour', employee, shift });
  return Object.freeze({
    doors: classifyRatePace(kpis.doorsPerHour, doorsStandard, mode),
    appointments: classifyRatePace(kpis.appointmentsPerHour, appointmentsStandard, mode),
  });
}

export function calculateVolumePace({ actual, dailyGoal, workedHours, plannedWorkHours, mode = 'ACTIVE' } = {}) {
  const value = finiteNonNegative(actual);
  const goal = finiteNonNegative(dailyGoal);
  if (value === null || goal === null) {
    return Object.freeze({ status: 'GOAL_NOT_CONFIGURED', value, goal, expectedByNow: null, projectedFinish: null, attainment: null });
  }

  const finalMode = String(mode).toUpperCase() !== 'ACTIVE';
  if (finalMode) {
    return Object.freeze({
      status: value >= goal ? 'AT_OR_ABOVE_GOAL' : 'BELOW_GOAL',
      value,
      goal,
      expectedByNow: goal,
      projectedFinish: null,
      attainment: goal > 0 ? value / goal : null,
    });
  }

  const worked = finiteNonNegative(workedHours);
  const planned = finiteNonNegative(plannedWorkHours);
  if (worked === null || worked <= 0 || planned === null || planned <= 0) {
    return Object.freeze({ status: 'PLANNED_HOURS_NOT_CONFIGURED', value, goal, expectedByNow: null, projectedFinish: null, attainment: null });
  }
  const elapsedFraction = Math.min(worked / planned, 1);
  const expectedByNow = goal * elapsedFraction;
  const projectedFinish = elapsedFraction > 0 ? value / elapsedFraction : null;
  return Object.freeze({
    status: value >= expectedByNow ? 'ON_PACE' : 'OFF_PACE',
    value,
    goal,
    expectedByNow,
    projectedFinish,
    attainment: goal > 0 ? value / goal : null,
  });
}

export function formatPaceStatus(status) {
  const labels = {
    ON_PACE: 'ON PACE',
    OFF_PACE: 'OFF PACE',
    AT_OR_ABOVE_GOAL: 'AT / ABOVE GOAL',
    BELOW_GOAL: 'BELOW GOAL',
    GOAL_NOT_CONFIGURED: 'GOAL NOT CONFIGURED',
    GOAL_CONFIGURATION_AMBIGUOUS: 'GOAL CONFIG AMBIGUOUS',
    GOAL_CONTEXT_UNAVAILABLE: 'GOAL STATUS UNAVAILABLE',
    NO_MEASURED_RATE_YET: 'NO RATE YET',
    PLANNED_HOURS_NOT_CONFIGURED: 'PLANNED HOURS NOT CONFIGURED',
  };
  return labels[String(status ?? '')] ?? 'GOAL STATUS UNAVAILABLE';
}

export function formatKpiRate(value) {
  return Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : '—';
}

export function formatKpiPace(value) {
  return Number.isFinite(value) ? value.toFixed(1) : '—';
}

export const ParadisePerformanceWebNeutralKpiInvariants = Object.freeze([
  'measured KPI values remain descriptive; the separate pace layer may compare only against one unambiguous approved effective minimum',
  'Doors/hour, Conversations/hour, and Appointments/hour use explicit productive Knock Clock time rather than total Day Clock duration',
  'historical shifts with no Knock Clock evidence render per-hour activity as unavailable rather than silently substituting Day Clock time',
  'worked Day Clock hours remain separately available for future downstream metrics whose approved denominator is worked hours',
  'zero or unavailable denominators render as unavailable rather than a misleading zero-percent or zero-per-hour result',
  'doors and conversations may use the local unsynced count draft so live feedback does not regress during a transient network failure',
  'appointment counts deduplicate server rows and idempotent pending SET writes by client set id',
  'pace never invents a target, tolerance band, scope precedence, planned work duration, or above-standard meaning',
  'multiple applicable standards fail closed as ambiguous rather than selecting a winner by invented precedence',
  'volume pace requires both an explicit daily goal and explicit planned work hours; neither is assumed by this web slice',
  'no leaderboard rank, compensation, commission, bonus, above-standard grade, or pay decision is produced here',
]);
