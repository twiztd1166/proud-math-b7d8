import { normalizeLocationSample, PerformanceLocationBridgeContract } from './performance-location-contract.mjs';
import { createQueuedWrite } from '../client/performance-sync.mjs';
import { isUuid } from '../shared/performance-events.mjs';

export const CAPACITOR_LOCATION_ADAPTER_VERSION = '2026.08.18-capacitor-location-adapter-v3';

export const LOCATION_PERMISSION_STATES = Object.freeze([
  'NOT_DETERMINED',
  'GRANTED_PRECISE',
  'GRANTED_APPROXIMATE',
  'DENIED',
  'RESTRICTED',
]);

function normalizePermission(value) {
  const raw = typeof value === 'string' ? value : value?.state;
  const state = String(raw || 'NOT_DETERMINED').toUpperCase();
  return LOCATION_PERMISSION_STATES.includes(state) ? state : 'NOT_DETERMINED';
}

function assertContext({ shiftId, employeeId, deviceId }) {
  if (!isUuid(shiftId)) throw new Error('active shiftId is required');
  if (!isUuid(employeeId)) throw new Error('employeeId is required');
  if (!isUuid(deviceId)) throw new Error('deviceId is required');
}

function assertPlugin(plugin) {
  for (const method of PerformanceLocationBridgeContract.requiredMethods) {
    if (typeof plugin?.[method] !== 'function') throw new Error(`Native location plugin missing ${method}`);
  }
}

function embeddedContext(rawSample) {
  const values = {
    shiftId: rawSample?.shiftId,
    employeeId: rawSample?.employeeId,
    deviceId: rawSample?.deviceId,
  };
  const present = Object.values(values).some(value => value !== undefined && value !== null);
  if (!present) return null;
  assertContext(values);
  return values;
}

export class CapacitorPerformanceLocationBridge {
  constructor({ plugin, onQueuedLocation, uuid = () => crypto.randomUUID(), nativeDrainLimit = 250 }) {
    assertPlugin(plugin);
    if (typeof onQueuedLocation !== 'function') throw new Error('onQueuedLocation callback is required');
    this.plugin = plugin;
    this.onQueuedLocation = onQueuedLocation;
    this.uuid = uuid;
    this.nativeDrainLimit = Math.max(1, Math.min(1000, Math.floor(Number(nativeDrainLimit) || 250)));
    this.state = 'STOPPED';
    this.context = null;
    this.listenerHandle = null;
    this.lastSample = null;
  }

  getState() {
    return Object.freeze({
      version: CAPACITOR_LOCATION_ADAPTER_VERSION,
      state: this.state,
      shiftId: this.context?.shiftId ?? null,
      permission: this.context?.permission ?? null,
      lastSample: this.lastSample,
    });
  }

  async getPermissionState() {
    return normalizePermission(await this.plugin.getPermissionState());
  }

  async startShift({ shiftId, employeeId, deviceId, initiatedByUser = false }) {
    assertContext({ shiftId, employeeId, deviceId });
    if (initiatedByUser !== true) throw new Error('Shift location may only start from visible Start My Day action');

    if (this.state === 'ACTIVE' || this.state === 'LIMITED') {
      if (this.context?.shiftId !== shiftId) throw new Error('Another shift is already tracking');
      return this.getState();
    }
    if (this.state === 'STARTING' || this.state === 'RECONNECTING' || this.state === 'STOPPING') {
      throw new Error(`Location bridge busy: ${this.state}`);
    }

    this.state = 'STARTING';
    let permission = await this.getPermissionState();
    if (permission === 'NOT_DETERMINED') {
      permission = normalizePermission(await this.plugin.requestShiftLocationPermission());
    }
    if (!['GRANTED_PRECISE', 'GRANTED_APPROXIMATE'].includes(permission)) {
      this.state = 'STOPPED';
      this.context = { shiftId, employeeId, deviceId, permission };
      return Object.freeze({ ...this.getState(), state: 'PERMISSION_REQUIRED' });
    }

    try {
      // Recover any crash-left native evidence before binding a new live context.
      await this.#drainNativePending({ allowEmbeddedContext: true });
      this.context = { shiftId, employeeId, deviceId, permission };
      await this.plugin.startShiftTracking({
        shiftId,
        employeeId,
        deviceId,
        accuracyMode: permission === 'GRANTED_PRECISE' ? 'precise' : 'approximate',
        initiatedByUser: true,
      });
      await this.#attachListener();
      this.state = permission === 'GRANTED_PRECISE' ? 'ACTIVE' : 'LIMITED';
      await this.#drainNativePending({ allowEmbeddedContext: true });
      return this.getState();
    } catch (error) {
      await this.#detachListener().catch(() => undefined);
      await this.plugin.stopShiftTracking({ shiftId }).catch(() => undefined);
      this.context = null;
      this.state = 'ERROR';
      throw error;
    }
  }

  async attachToAlreadyActiveShift({ shiftId, employeeId, deviceId }) {
    assertContext({ shiftId, employeeId, deviceId });
    if (this.state !== 'STOPPED') throw new Error(`Cannot attach while bridge is ${this.state}`);

    const status = await this.plugin.getTrackingStatus();
    if (!status?.active || status?.shiftId !== shiftId) {
      // Critical: app launch must not silently create or adopt native location here.
      return Object.freeze({ ...this.getState(), state: 'STOPPED' });
    }
    if (status.employeeId !== employeeId || status.deviceId !== deviceId) {
      throw new Error('Native tracking context does not match the authoritative employee/device');
    }

    const permission = await this.getPermissionState();
    if (!['GRANTED_PRECISE', 'GRANTED_APPROXIMATE'].includes(permission)) {
      return Object.freeze({ ...this.getState(), state: 'PERMISSION_REQUIRED' });
    }

    this.context = { shiftId, employeeId, deviceId, permission };
    this.state = 'RECONNECTING';
    try {
      await this.plugin.reattachShiftTracking({
        shiftId,
        employeeId,
        deviceId,
        accuracyMode: permission === 'GRANTED_PRECISE' ? 'precise' : 'approximate',
      });
      await this.#attachListener();
      this.state = permission === 'GRANTED_PRECISE' ? 'ACTIVE' : 'LIMITED';
      await this.#drainNativePending({ allowEmbeddedContext: true });
      return this.getState();
    } catch (error) {
      await this.#detachListener().catch(() => undefined);
      this.context = null;
      this.state = 'ERROR';
      throw error;
    }
  }

  async captureNow() {
    if (!this.context || !['ACTIVE', 'LIMITED'].includes(this.state)) throw new Error('No active shift location session');
    const sample = await this.plugin.getCurrentLocation();
    return this.#acceptSample(sample);
  }

  async stopShift({ shiftId }) {
    if (this.state === 'STOPPED') {
      await this.#drainNativePending({ allowEmbeddedContext: true });
      return this.getState();
    }
    if (!this.context) {
      await this.#drainNativePending({ allowEmbeddedContext: true });
      this.state = 'STOPPED';
      return this.getState();
    }
    if (shiftId && shiftId !== this.context.shiftId) throw new Error('Cannot stop a different shift');

    const activeShiftId = this.context.shiftId;
    this.state = 'STOPPING';
    let stopError = null;
    try {
      // Stop native production first, then drain the durable handoff while context is still known.
      try {
        await this.plugin.stopShiftTracking({ shiftId: activeShiftId });
      } catch (error) {
        stopError = error;
      }
      await this.#drainNativePending({ allowEmbeddedContext: true });
      await this.#detachListener();
      // A second drain closes the listener/stop race without inventing any new tracking.
      await this.#drainNativePending({ allowEmbeddedContext: true });
      if (stopError) throw stopError;
    } finally {
      this.context = null;
      this.lastSample = null;
      this.state = 'STOPPED';
    }
    return this.getState();
  }

  async ensureStoppedWhenNoActiveShift() {
    const status = await this.plugin.getTrackingStatus();
    let stopError = null;
    if (status?.active) {
      try {
        await this.plugin.stopShiftTracking({ shiftId: status.shiftId ?? null });
      } catch (error) {
        stopError = error;
      }
    }
    try {
      await this.#drainNativePending({ allowEmbeddedContext: true });
      await this.#detachListener();
      await this.#drainNativePending({ allowEmbeddedContext: true });
      if (stopError) throw stopError;
    } finally {
      this.context = null;
      this.lastSample = null;
      this.state = 'STOPPED';
    }
    return this.getState();
  }

  async #attachListener() {
    if (this.listenerHandle) return;
    this.listenerHandle = await this.plugin.addLocationListener(sample => {
      void this.#acceptSample(sample).catch(() => undefined);
    });
  }

  async #detachListener() {
    if (!this.listenerHandle) return;
    const handle = this.listenerHandle;
    this.listenerHandle = null;
    await this.plugin.removeLocationListener(handle);
  }

  #resolveSampleContext(rawSample, allowEmbeddedContext) {
    const embedded = embeddedContext(rawSample);
    if (this.context) {
      if (embedded && (
        embedded.shiftId !== this.context.shiftId ||
        embedded.employeeId !== this.context.employeeId ||
        embedded.deviceId !== this.context.deviceId
      )) {
        throw new Error('Native location sample context does not match active Performance context');
      }
      return this.context;
    }
    if (allowEmbeddedContext && embedded) return embedded;
    return null;
  }

  async #acceptSample(rawSample, { allowEmbeddedContext = false } = {}) {
    const mayAcceptLive = ['ACTIVE', 'LIMITED', 'STOPPING'].includes(this.state);
    if (!mayAcceptLive && !allowEmbeddedContext) return null;

    const context = this.#resolveSampleContext(rawSample, allowEmbeddedContext);
    if (!context) return null;
    const sample = normalizeLocationSample(rawSample);
    if (rawSample?.clientPointId != null && !isUuid(rawSample.clientPointId)) {
      throw new Error('Native clientPointId must be a stable UUID');
    }
    const hasNativeId = isUuid(rawSample?.clientPointId);
    const id = hasNativeId ? rawSample.clientPointId : this.uuid();
    const write = createQueuedWrite({
      id,
      kind: 'LOCATION',
      capturedAt: sample.capturedAt,
      payload: {
        employeeId: context.employeeId,
        deviceId: context.deviceId,
        shiftId: context.shiftId,
        latitude: sample.latitude,
        longitude: sample.longitude,
        accuracyMeters: sample.accuracyMeters,
        altitudeMeters: sample.altitudeMeters,
        speedMetersPerSecond: sample.speedMetersPerSecond,
        headingDegrees: sample.headingDegrees,
        precise: sample.precise,
        mocked: sample.mocked,
        source: sample.source,
        bridgeVersion: sample.bridgeVersion,
      },
    });

    // This callback is the durable JavaScript queue boundary. Native acknowledgement happens only after it resolves.
    await this.onQueuedLocation(write);
    if (hasNativeId) {
      await this.plugin.ackPendingLocations({ clientPointIds: [id] });
    }
    if (this.context?.shiftId === context.shiftId) this.lastSample = sample;
    return write;
  }

  async #drainNativePending({ allowEmbeddedContext }) {
    let total = 0;
    for (let pass = 0; pass < 1000; pass += 1) {
      const result = await this.plugin.drainPendingLocations({ limit: this.nativeDrainLimit });
      const samples = Array.isArray(result?.samples) ? result.samples : [];
      if (samples.length === 0) return total;
      for (const pending of samples) {
        await this.#acceptSample(pending, { allowEmbeddedContext });
        total += 1;
      }
      const remaining = Number(result?.remaining);
      if (samples.length < this.nativeDrainLimit && (!Number.isFinite(remaining) || remaining <= 0)) return total;
    }
    throw new Error('Native location spool did not drain within safety bound');
  }
}

export const CapacitorLocationAdapterInvariants = Object.freeze([
  'native tracking starts only from an explicit Start My Day action',
  'one bridge instance is bound to one active employee/device/shift context at a time',
  'app relaunch may resume only an already-active matching native context and never invent a new shift',
  'no active shift means native tracking is forced stopped before pending evidence is drained',
  'every native point is persisted before listener delivery with its original device capturedAt timestamp',
  'every native point keeps one stable clientPointId across listener delivery, relaunch drain, and sync retry',
  'native spool acknowledgement occurs only after the JavaScript idempotent queue accepts that same point ID',
  'crash-left pending GPS may be recovered after Finish Day using embedded identities without granting authorization',
  'permission denial creates a visible permission-required state rather than silent tracking',
  'Finish Day stops native tracking before final durable-spool drainage',
  'GPS output remains Performance evidence and never authorizes field Lookup',
]);
