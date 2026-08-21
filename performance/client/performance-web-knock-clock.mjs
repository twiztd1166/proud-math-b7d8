export const PERFORMANCE_WEB_KNOCK_CLOCK_VERSION = '2026.08.21-web-knock-clock-v2';
export const KNOCK_EVENT_TYPES = Object.freeze(['KNOCK_STARTED', 'KNOCK_STOPPED']);

const ACTIVE_SHIFT_STATUSES = new Set(['active', 'paused', 'finishing']);

function field(record, ...keys) {
  for (const key of keys) {
    if (record && Object.prototype.hasOwnProperty.call(record, key)) return record[key];
  }
  return undefined;
}

function instantMs(value) {
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isFinite(date.getTime()) ? date.getTime() : null;
}

function eventIdentity(record) {
  return String(field(record, 'client_event_id', 'clientEventId', 'id') ?? '');
}

function normalizeKnockEvent(record, shiftId = null) {
  const type = String(field(record, 'event_type', 'eventType', 'type') ?? '');
  if (!KNOCK_EVENT_TYPES.includes(type)) return null;
  const eventShiftId = String(field(record, 'shift_id', 'shiftId') ?? '');
  if (shiftId && eventShiftId !== String(shiftId)) return null;
  const capturedAt = field(record, 'captured_at', 'capturedAt');
  const capturedMs = instantMs(capturedAt);
  if (capturedMs === null) return null;
  const id = eventIdentity(record) || `${type}:${new Date(capturedMs).toISOString()}`;
  return Object.freeze({
    id,
    type,
    shiftId: eventShiftId,
    capturedAt: new Date(capturedMs).toISOString(),
    capturedMs,
  });
}

function pendingWriteAsEvent(write) {
  if (write?.kind !== 'EVENT') return null;
  if (!KNOCK_EVENT_TYPES.includes(String(write?.payload?.type ?? ''))) return null;
  return {
    id: write.id,
    clientEventId: write.id,
    eventType: write.payload.type,
    shiftId: write.payload.shiftId,
    capturedAt: write.capturedAt,
  };
}

export function mergeKnockClockEvents({ serverRows = [], pendingWrites = [], shiftId = null } = {}) {
  const rows = new Map();
  for (const row of serverRows) {
    const event = normalizeKnockEvent(row, shiftId);
    if (event) rows.set(event.id, event);
  }

  let pendingSyncCount = 0;
  let rejectedCount = 0;
  for (const write of pendingWrites) {
    const pending = pendingWriteAsEvent(write);
    if (!pending) continue;
    if (String(write?.state ?? 'PENDING') === 'REJECTED') {
      rejectedCount += 1;
      continue;
    }
    const event = normalizeKnockEvent(pending, shiftId);
    if (!event || rows.has(event.id)) continue;
    rows.set(event.id, event);
    pendingSyncCount += 1;
  }

  const events = Array.from(rows.values()).sort((a, b) => a.capturedMs - b.capturedMs || a.id.localeCompare(b.id));
  return Object.freeze({ events: Object.freeze(events), pendingSyncCount, rejectedCount });
}

export function deriveKnockClock({ shift = {}, events = [], now = Date.now() } = {}) {
  const shiftStartMs = instantMs(field(shift, 'started_at', 'startedAt'));
  if (shiftStartMs === null) {
    return Object.freeze({ totalSeconds: null, hours: null, active: false, currentStartedAt: null, intervals: Object.freeze([]) });
  }

  const status = String(field(shift, 'status') ?? '').toLowerCase();
  const finishedMs = instantMs(field(shift, 'finished_at', 'finishedAt'));
  const nowMs = instantMs(now);
  let endBoundMs = finishedMs;
  if (endBoundMs === null && ACTIVE_SHIFT_STATUSES.has(status)) endBoundMs = nowMs;
  if (endBoundMs === null || endBoundMs < shiftStartMs) endBoundMs = shiftStartMs;

  const normalized = events
    .map(event => normalizeKnockEvent(event, field(shift, 'id') ?? null))
    .filter(Boolean)
    .filter(event => event.capturedMs >= shiftStartMs && event.capturedMs <= endBoundMs)
    .sort((a, b) => a.capturedMs - b.capturedMs || a.id.localeCompare(b.id));

  const intervals = [];
  let openStartMs = null;
  for (const event of normalized) {
    if (event.type === 'KNOCK_STARTED') {
      if (openStartMs === null) openStartMs = event.capturedMs;
      continue;
    }
    if (event.type === 'KNOCK_STOPPED' && openStartMs !== null && event.capturedMs >= openStartMs) {
      intervals.push(Object.freeze({
        startedAt: new Date(openStartMs).toISOString(),
        stoppedAt: new Date(event.capturedMs).toISOString(),
        seconds: (event.capturedMs - openStartMs) / 1000,
      }));
      openStartMs = null;
    }
  }

  const isOpen = openStartMs !== null;
  if (isOpen && endBoundMs >= openStartMs) {
    intervals.push(Object.freeze({
      startedAt: new Date(openStartMs).toISOString(),
      stoppedAt: finishedMs !== null ? new Date(endBoundMs).toISOString() : null,
      seconds: (endBoundMs - openStartMs) / 1000,
    }));
  }

  const totalSeconds = intervals.reduce((sum, interval) => sum + interval.seconds, 0);
  const active = Boolean(isOpen && finishedMs === null && ACTIVE_SHIFT_STATUSES.has(status));
  return Object.freeze({
    totalSeconds,
    hours: totalSeconds / 3600,
    active,
    currentStartedAt: active ? new Date(openStartMs).toISOString() : null,
    intervals: Object.freeze(intervals),
  });
}

export function formatKnockDuration(seconds) {
  if (!Number.isFinite(Number(seconds)) || Number(seconds) < 0) return '—';
  const whole = Math.floor(Number(seconds));
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const secs = whole % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const ParadisePerformanceWebKnockClockInvariants = Object.freeze([
  'absent, null, and blank timestamps are treated as unavailable and never coerced to the Unix epoch',
  'productive Knock Clock time is explicit event evidence and is never inferred solely from GPS',
  'Start My Day does not automatically start productive Knock Clock time',
  'repeated starts and stops cannot double-count productive time',
  'events outside the authoritative shift window do not count toward productive time',
  'an open Knock Clock on a finished shift closes at the authoritative shift finish time',
  'historical shifts with no Knock Clock events do not silently substitute Day Clock duration',
]);
