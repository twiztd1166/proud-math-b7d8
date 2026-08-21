import { calculatePerformance, finiteNonNegative } from '../shared/performance-math.mjs';

export const PERFORMANCE_WEB_NEUTRAL_KPI_VERSION = '2026.08.21-web-neutral-kpis-v1';

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

export function calculateNeutralWebKpis({ shift = {}, appointmentCount = 0, countDraft = null, now = Date.now() } = {}) {
  const counts = visibleShiftCounts(shift, countDraft);
  const hours = workedHoursForShift(shift, now);
  const sets = nonNegativeInteger(appointmentCount);
  const performance = calculatePerformance({
    hours: hours ?? 0,
    doors: counts.doors,
    conversations: counts.conversations,
    sets,
  });

  return Object.freeze({
    hours,
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

export function formatKpiRate(value) {
  return Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : '—';
}

export function formatKpiPace(value) {
  return Number.isFinite(value) ? value.toFixed(1) : '—';
}

export const ParadisePerformanceWebNeutralKpiInvariants = Object.freeze([
  'web KPI values are descriptive measurements only and do not classify performance against a standard',
  'zero or unavailable denominators render as unavailable rather than a misleading zero-percent or zero-per-hour result',
  'active worked hours use elapsed shift time less recorded break seconds; finished shifts use their authoritative finish time',
  'doors and conversations may use the local unsynced count draft so live feedback does not regress during a transient network failure',
  'appointment counts deduplicate server rows and idempotent pending SET writes by client set id',
  'no leaderboard rank, compensation, commission, bonus, minimum target, above-standard target, or pay decision is produced here',
]);
