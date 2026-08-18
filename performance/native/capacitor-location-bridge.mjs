import { normalizeLocationSample, PerformanceLocationBridgeContract } from './performance-location-contract.mjs';
import { createQueuedWrite } from '../client/performance-sync.mjs';
import { isUuid } from '../shared/performance-events.mjs';

export const CAPACITOR_LOCATION_ADAPTER_VERSION = '2026.08.18-capacitor-location-adapter-v1';

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

export class CapacitorPerformanceLocationBridge {
  constructor({ plugin, onQueuedLocation, uuid = () => crypto.randomUUID() }) {
    assertPlugin(plugin);
    if (typeof onQueuedLocation !== 'function') throw new Error('onQueuedLocation callback is required');
    this.plugin = plugin;
    this.onQueuedLocation = onQueuedLocation;
    this.uuid = uuid;
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

    if (this.state === 'ACTIVE') {
      if (this.context?.shiftId !== shiftId) throw new Error('Another shift is already tracking');
      return this.getState();
    }
    if (this.state === 'STARTING' || this.state === 'STOPPING') throw new Error(`Location bridge busy: ${this.state}`);

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

    this.context = { shiftId, employeeId, deviceId, permission };
    try {
      await this.plugin.startShiftTracking({
        shiftId,
        accuracyMode: permission === 'GRANTED_PRECISE' ? 'precise' : 'approximate',
      });
      await this.#attachListener();
      this.state = permission === 'GRANTED_PRECISE' ? 'ACTIVE' : 'LIMITED';
      return this.getState();
    } catch (error) {
      await this.#detachListener().catch(() => undefined);
      await this.plugin.stopShiftTracking({ shiftId }).catch(() => undefined);
      this.state = 'ERROR';
      throw error;
    }
  }

  async attachToAlreadyActiveShift({ shiftId, employeeId, deviceId }) {
    assertContext({ shiftId, employeeId, deviceId });
    if (this.state !== 'STOPPED') throw new Error(`Cannot attach while bridge is ${this.state}`);

    const status = await this.plugin.getTrackingStatus();
    if (!status?.active || status?.shiftId !== shiftId) {
      // Critical: app launch must not silently start native location here.
      return Object.freeze({ ...this.getState(), state: 'STOPPED' });
    }

    const permission = await this.getPermissionState();
    if (!['GRANTED_PRECISE', 'GRANTED_APPROXIMATE'].includes(permission)) {
      return Object.freeze({ ...this.getState(), state: 'PERMISSION_REQUIRED' });
    }

    this.context = { shiftId, employeeId, deviceId, permission };
    await this.#attachListener();
    this.state = permission === 'GRANTED_PRECISE' ? 'ACTIVE' : 'LIMITED';
    return this.getState();
  }

  async captureNow() {
    if (!this.context || !['ACTIVE', 'LIMITED'].includes(this.state)) throw new Error('No active shift location session');
    const sample = await this.plugin.getCurrentLocation();
    return this.#acceptSample(sample);
  }

  async stopShift({ shiftId }) {
    if (this.state === 'STOPPED') return this.getState();
    if (!this.context) {
      this.state = 'STOPPED';
      return this.getState();
    }
    if (shiftId && shiftId !== this.context.shiftId) throw new Error('Cannot stop a different shift');

    const activeShiftId = this.context.shiftId;
    this.state = 'STOPPING';
    try {
      await this.#detachListener();
      await this.plugin.stopShiftTracking({ shiftId: activeShiftId });
    } finally {
      this.context = null;
      this.lastSample = null;
      this.state = 'STOPPED';
    }
    return this.getState();
  }

  async ensureStoppedWhenNoActiveShift() {
    const status = await this.plugin.getTrackingStatus();
    if (status?.active) await this.plugin.stopShiftTracking({ shiftId: status.shiftId ?? null });
    await this.#detachListener();
    this.context = null;
    this.lastSample = null;
    this.state = 'STOPPED';
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

  async #acceptSample(rawSample) {
    if (!this.context || !['ACTIVE', 'LIMITED'].includes(this.state)) return null;
    const sample = normalizeLocationSample(rawSample);
    const id = isUuid(rawSample?.clientPointId) ? rawSample.clientPointId : this.uuid();
    const write = createQueuedWrite({
      id,
      kind: 'LOCATION',
      capturedAt: sample.capturedAt,
      payload: {
        employeeId: this.context.employeeId,
        deviceId: this.context.deviceId,
        shiftId: this.context.shiftId,
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
    this.lastSample = sample;
    await this.onQueuedLocation(write);
    return write;
  }
}

export const CapacitorLocationAdapterInvariants = Object.freeze([
  'native tracking starts only from an explicit Start My Day action',
  'one bridge instance is bound to one active shift at a time',
  'app relaunch may reattach to an already-active native shift but never invent a new shift',
  'no active shift means native tracking is forced stopped',
  'every accepted location keeps the device capturedAt timestamp',
  'every queued GPS write has a stable client UUID for retry idempotency',
  'permission denial creates a visible permission-required state rather than silent tracking',
  'Finish Day detaches listeners and stops native tracking',
  'GPS output remains Performance evidence and never authorizes field Lookup',
]);
