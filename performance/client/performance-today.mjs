import { buildEventEnvelope, createClientEventId, isUuid } from '../shared/performance-events.mjs';
import { createQueuedWrite } from './performance-sync.mjs';

export const PERFORMANCE_TODAY_VERSION = '2026.08.18-performance-today-v1';
export const PERFORMANCE_ACTIVE_SHIFT_STATUSES = Object.freeze(['active', 'paused', 'finishing']);

const SHIFT_SELECT = [
  'id',
  'client_shift_id',
  'employee_id',
  'device_id',
  'territory_id',
  'status',
  'started_at',
  'finished_at',
  'doors',
  'conversations',
  'break_seconds',
].join(',');

function safeMessage(error) {
  return String(error?.message || error || 'Unknown error').slice(0, 240);
}

function normalizeOptionalCount(value, fallback = null) {
  if (value === undefined) return fallback;
  if (value === null || value === '') return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) throw new Error('Daily counts must be non-negative whole numbers');
  return n;
}

function assertDependencies({ shiftTransport, employeeId, deviceId, locationBridge, syncQueue, uuid }) {
  for (const method of ['findActiveShift', 'startShift', 'finishShift']) {
    if (typeof shiftTransport?.[method] !== 'function') throw new Error(`shiftTransport.${method} is required`);
  }
  if (!isUuid(employeeId)) throw new Error('employeeId must be a UUID');
  if (!isUuid(deviceId)) throw new Error('deviceId must be a UUID');
  for (const method of ['startShift', 'attachToAlreadyActiveShift', 'captureNow', 'stopShift', 'ensureStoppedWhenNoActiveShift']) {
    if (typeof locationBridge?.[method] !== 'function') throw new Error(`locationBridge.${method} is required`);
  }
  if (typeof syncQueue?.enqueue !== 'function') throw new Error('syncQueue.enqueue is required');
  if (typeof uuid !== 'function') throw new Error('uuid generator is required');
}

function frozenShift(shift) {
  return shift ? Object.freeze({ ...shift }) : null;
}

export function createSupabaseShiftTransport(supabase) {
  if (!supabase?.from) throw new Error('Supabase client is required');

  async function readByClientShiftId(clientShiftId, employeeId) {
    const { data, error } = await supabase
      .from('performance_shifts')
      .select(SHIFT_SELECT)
      .eq('client_shift_id', clientShiftId)
      .eq('employee_id', employeeId)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  }

  return Object.freeze({
    async findActiveShift(employeeId) {
      const { data, error } = await supabase
        .from('performance_shifts')
        .select(SHIFT_SELECT)
        .eq('employee_id', employeeId)
        .in('status', PERFORMANCE_ACTIVE_SHIFT_STATUSES)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },

    async startShift({ clientShiftId, employeeId, deviceId, territoryId = null, startedAt }) {
      const row = {
        client_shift_id: clientShiftId,
        employee_id: employeeId,
        device_id: deviceId,
        territory_id: territoryId,
        started_at: startedAt,
        doors: 0,
        conversations: 0,
        break_seconds: 0,
      };
      const { data, error } = await supabase
        .from('performance_shifts')
        .insert(row)
        .select(SHIFT_SELECT)
        .single();
      if (!error) return data;
      if (String(error.code || '') === '23505' || /duplicate key/i.test(String(error.message || ''))) {
        const existing = await readByClientShiftId(clientShiftId, employeeId);
        if (existing) return existing;
      }
      throw error;
    },

    async finishShift({ shiftId, employeeId, finishedAt, doors, conversations, endLocation = null }) {
      const patch = {
        status: 'finished',
        finished_at: finishedAt,
        updated_at: finishedAt,
      };
      if (doors !== undefined) patch.doors = normalizeOptionalCount(doors, null);
      if (conversations !== undefined) patch.conversations = normalizeOptionalCount(conversations, null);
      if (endLocation) {
        patch.end_latitude = endLocation.latitude;
        patch.end_longitude = endLocation.longitude;
        patch.end_accuracy_meters = endLocation.accuracyMeters;
      }
      const { data, error } = await supabase
        .from('performance_shifts')
        .update(patch)
        .eq('id', shiftId)
        .eq('employee_id', employeeId)
        .select(SHIFT_SELECT)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export class PerformanceTodayController {
  constructor({
    shiftTransport,
    employeeId,
    deviceId,
    locationBridge,
    syncQueue,
    now = () => new Date(),
    uuid = () => createClientEventId(),
  }) {
    assertDependencies({ shiftTransport, employeeId, deviceId, locationBridge, syncQueue, uuid });
    this.shiftTransport = shiftTransport;
    this.employeeId = employeeId;
    this.deviceId = deviceId;
    this.locationBridge = locationBridge;
    this.syncQueue = syncQueue;
    this.now = now;
    this.uuid = uuid;
    this.mode = 'IDLE';
    this.shift = null;
    this.location = Object.freeze({ state: 'STOPPED', permission: null });
    this.warning = null;
    this.busy = false;
  }

  getState() {
    return Object.freeze({
      version: PERFORMANCE_TODAY_VERSION,
      mode: this.mode,
      busy: this.busy,
      shift: frozenShift(this.shift),
      location: Object.freeze({ ...this.location }),
      warning: this.warning,
    });
  }

  async load() {
    if (this.busy) return this.getState();
    this.busy = true;
    this.warning = null;
    try {
      const active = await this.shiftTransport.findActiveShift(this.employeeId);
      if (!active) {
        this.shift = null;
        this.mode = 'IDLE';
        try {
          this.location = await this.locationBridge.ensureStoppedWhenNoActiveShift();
        } catch (error) {
          this.location = Object.freeze({ state: 'STOP_ERROR', permission: null });
          this.warning = `Location cleanup needs attention: ${safeMessage(error)}`;
        }
        return this.getState();
      }

      this.shift = active;
      this.mode = active.status === 'finishing' ? 'FINISHING' : 'ACTIVE';
      try {
        this.location = await this.locationBridge.attachToAlreadyActiveShift({
          shiftId: active.id,
          employeeId: this.employeeId,
          deviceId: this.deviceId,
        });
        if (this.location.state === 'STOPPED') {
          this.warning = 'Shift is active, but native GPS is not running. Tracking was not silently restarted.';
        }
      } catch (error) {
        this.location = Object.freeze({ state: 'ERROR', permission: null });
        this.warning = `Shift is active, but GPS needs attention: ${safeMessage(error)}`;
      }
      return this.getState();
    } finally {
      this.busy = false;
    }
  }

  async startMyDay({ territoryId = null } = {}) {
    if (this.busy) throw new Error('Performance Today is busy');
    this.busy = true;
    this.warning = null;
    try {
      const existing = await this.shiftTransport.findActiveShift(this.employeeId);
      if (existing) {
        this.shift = existing;
        this.mode = existing.status === 'finishing' ? 'FINISHING' : 'ACTIVE';
        try {
          this.location = await this.locationBridge.attachToAlreadyActiveShift({
            shiftId: existing.id,
            employeeId: this.employeeId,
            deviceId: this.deviceId,
          });
          if (this.location.state === 'STOPPED') {
            this.warning = 'Existing shift recovered, but native GPS is not running. Tracking was not silently restarted.';
          }
        } catch (error) {
          this.location = Object.freeze({ state: 'ERROR', permission: null });
          this.warning = `Existing shift recovered; GPS needs attention: ${safeMessage(error)}`;
        }
        return this.getState();
      }

      const startedAt = this.now().toISOString();
      const clientShiftId = this.uuid();
      if (!isUuid(clientShiftId)) throw new Error('client shift ID must be a UUID');
      const shift = await this.shiftTransport.startShift({
        clientShiftId,
        employeeId: this.employeeId,
        deviceId: this.deviceId,
        territoryId,
        startedAt,
      });
      if (!isUuid(shift?.id)) throw new Error('Authoritative shift did not return a valid id');

      this.shift = shift;
      this.mode = 'ACTIVE';
      await this.#queueEvent('SHIFT_STARTED', startedAt, {
        clientShiftId,
        territoryId,
      });

      try {
        this.location = await this.locationBridge.startShift({
          shiftId: shift.id,
          employeeId: this.employeeId,
          deviceId: this.deviceId,
          initiatedByUser: true,
        });
        if (this.location.state === 'PERMISSION_REQUIRED') {
          this.warning = 'Shift started. Location permission is required for live shift GPS.';
        }
      } catch (error) {
        // The authoritative shift already exists. Never create a second shift just because native GPS failed.
        this.location = Object.freeze({ state: 'ERROR', permission: null });
        this.warning = `Shift started. GPS needs attention: ${safeMessage(error)}`;
      }
      return this.getState();
    } finally {
      this.busy = false;
    }
  }

  async finishDay({ doors, conversations } = {}) {
    if (this.busy) throw new Error('Performance Today is busy');
    if (!this.shift || !PERFORMANCE_ACTIVE_SHIFT_STATUSES.includes(this.shift.status)) {
      throw new Error('No active shift to finish');
    }

    this.busy = true;
    this.mode = 'FINISHING';
    this.warning = null;
    const shiftId = this.shift.id;
    let endLocation = null;
    try {
      try {
        const queuedLocation = await this.locationBridge.captureNow();
        if (queuedLocation?.payload) {
          endLocation = {
            latitude: queuedLocation.payload.latitude,
            longitude: queuedLocation.payload.longitude,
            accuracyMeters: queuedLocation.payload.accuracyMeters,
          };
        }
      } catch {
        // End GPS is best-effort. Finish remains available when location permission/signal is unavailable.
      }

      const finishedAt = this.now().toISOString();
      const finalDoors = normalizeOptionalCount(doors, this.shift.doors ?? null);
      const finalConversations = normalizeOptionalCount(conversations, this.shift.conversations ?? null);
      const finished = await this.shiftTransport.finishShift({
        shiftId,
        employeeId: this.employeeId,
        finishedAt,
        doors: finalDoors,
        conversations: finalConversations,
        endLocation,
      });

      this.shift = finished;
      this.mode = 'COMPLETE';

      try {
        await this.#queueEvent('SHIFT_FINISHED', finishedAt, {
          doors: finished.doors ?? finalDoors,
          conversations: finished.conversations ?? finalConversations,
        });
      } catch (error) {
        this.warning = `Day finished; finish event remains unsaved locally: ${safeMessage(error)}`;
      }

      try {
        this.location = await this.locationBridge.stopShift({ shiftId });
      } catch (firstError) {
        try {
          this.location = await this.locationBridge.ensureStoppedWhenNoActiveShift();
          this.warning = this.warning || `Day finished; native GPS required forced cleanup: ${safeMessage(firstError)}`;
        } catch (secondError) {
          this.location = Object.freeze({ state: 'STOP_ERROR', permission: null });
          this.warning = `Day finished, but native GPS stop must be retried: ${safeMessage(secondError)}`;
        }
      }
      return this.getState();
    } catch (error) {
      // If the authoritative finish failed, remain active and keep tracking rather than creating off-server gaps.
      this.mode = 'ACTIVE';
      this.warning = `Finish Day did not complete: ${safeMessage(error)}`;
      throw error;
    } finally {
      this.busy = false;
    }
  }

  async #queueEvent(type, capturedAt, payload) {
    const eventId = this.uuid();
    const envelope = buildEventEnvelope({
      clientEventId: eventId,
      employeeId: this.employeeId,
      deviceId: this.deviceId,
      shiftId: this.shift?.id ?? null,
      type,
      capturedAt,
      payload,
    });
    return this.syncQueue.enqueue(createQueuedWrite({
      id: envelope.clientEventId,
      kind: 'EVENT',
      capturedAt: envelope.capturedAt,
      payload: {
        employeeId: envelope.employeeId,
        deviceId: envelope.deviceId,
        shiftId: envelope.shiftId,
        type: envelope.type,
        schemaVersion: envelope.schemaVersion,
        payload: envelope.payload,
      },
    }));
  }
}

export const PerformanceTodayInvariants = Object.freeze([
  'Start My Day creates or recovers one authoritative shift before native GPS begins',
  'native GPS failure never causes a duplicate shift',
  'relaunch reattaches only to the authoritative active shift already known to native runtime',
  'Finish Day stops native GPS only after the authoritative shift finish succeeds',
  'an authoritative finish remains finished even if the append-only finish event needs local recovery',
  'missing end GPS never blocks Finish Day',
  'no KPI target, pace threshold, or compensation value is invented by the Today controller',
  'Performance failures never redefine or authorize field Lookup',
]);
