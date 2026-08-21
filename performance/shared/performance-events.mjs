export const PERFORMANCE_EVENT_VERSION = '2026.08.21-performance-events-v2';

export const PERFORMANCE_EVENT_TYPES = Object.freeze([
  'SHIFT_STARTED',
  'SHIFT_PAUSED',
  'SHIFT_RESUMED',
  'SHIFT_FINISHED',
  'KNOCK_STARTED',
  'KNOCK_STOPPED',
  'DOOR_COUNT_SET',
  'CONVERSATION_COUNT_SET',
  'DOOR_INCREMENTED',
  'CONVERSATION_INCREMENTED',
  'SET_CREATED',
  'SET_COMPLETED',
  'LOCATION_CAPTURED',
  'OUTCOME_UPDATED',
  'CORRECTION_REQUESTED'
]);

export function isUuid(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function createClientEventId(cryptoImpl = globalThis.crypto) {
  if (!cryptoImpl || typeof cryptoImpl.randomUUID !== 'function') {
    throw new Error('A cryptographically strong randomUUID implementation is required');
  }
  return cryptoImpl.randomUUID();
}

export function buildEventEnvelope({
  clientEventId,
  employeeId,
  deviceId,
  shiftId,
  type,
  capturedAt,
  payload = {}
}) {
  if (!isUuid(clientEventId)) throw new Error('clientEventId must be a stable UUID reused for retries');
  if (!isUuid(employeeId)) throw new Error('employeeId must be a UUID');
  if (!isUuid(deviceId)) throw new Error('deviceId must be a UUID');
  if (shiftId !== null && shiftId !== undefined && !isUuid(shiftId)) throw new Error('shiftId must be a UUID when provided');
  if (!PERFORMANCE_EVENT_TYPES.includes(type)) throw new Error(`Unsupported event type: ${type}`);
  const captured = new Date(capturedAt);
  if (!capturedAt || Number.isNaN(captured.valueOf())) throw new Error('capturedAt must be an ISO timestamp');
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('payload must be an object');

  return Object.freeze({
    schemaVersion: PERFORMANCE_EVENT_VERSION,
    clientEventId,
    employeeId,
    deviceId,
    shiftId: shiftId ?? null,
    type,
    capturedAt: captured.toISOString(),
    payload: Object.freeze({ ...payload })
  });
}

export function retryEnvelope(envelope) {
  if (!envelope || !isUuid(envelope.clientEventId)) throw new Error('Cannot retry event without original clientEventId');
  return envelope;
}
