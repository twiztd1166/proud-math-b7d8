import { createQueuedWrite } from './performance-sync.mjs';
import { isUuid } from '../shared/performance-events.mjs';

export const PERFORMANCE_WEB_LOCATION_VERSION = '2026.08.21-web-foreground-location-v1';

function assertContext({ shiftId, employeeId, deviceId }) {
  if (!isUuid(shiftId)) throw new Error('active shiftId is required');
  if (!isUuid(employeeId)) throw new Error('employeeId is required');
  if (!isUuid(deviceId)) throw new Error('deviceId is required');
}

function permissionFromError(error) {
  const code = Number(error?.code || 0);
  if (code === 1) return 'DENIED';
  if (code === 2) return 'UNAVAILABLE';
  if (code === 3) return 'TIMEOUT';
  return 'UNKNOWN';
}

export class BrowserForegroundLocationBridge {
  constructor({ onQueuedLocation, navigatorRef = globalThis.navigator, uuid = () => crypto.randomUUID() } = {}) {
    if (typeof onQueuedLocation !== 'function') throw new Error('onQueuedLocation callback is required');
    this.onQueuedLocation = onQueuedLocation;
    this.navigatorRef = navigatorRef;
    this.uuid = uuid;
    this.context = null;
    this.state = 'STOPPED';
    this.permission = null;
    this.lastSample = null;
  }

  getState() {
    return Object.freeze({
      version: PERFORMANCE_WEB_LOCATION_VERSION,
      state: this.state,
      permission: this.permission,
      shiftId: this.context?.shiftId ?? null,
      lastSample: this.lastSample,
      continuousBackgroundTracking: false,
    });
  }

  async #readPermissionWithoutPrompt() {
    try {
      const permissions = this.navigatorRef?.permissions;
      if (!permissions?.query) return null;
      const status = await permissions.query({ name: 'geolocation' });
      return String(status?.state || '').toUpperCase() || null;
    } catch {
      return null;
    }
  }

  async #currentPosition() {
    const geolocation = this.navigatorRef?.geolocation;
    if (!geolocation?.getCurrentPosition) throw new Error('Browser geolocation is unavailable');
    return new Promise((resolve, reject) => {
      geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        maximumAge: 15000,
        timeout: 15000,
      });
    });
  }

  async #captureSample() {
    if (!this.context) throw new Error('No active web shift location context');
    let position;
    try {
      position = await this.#currentPosition();
      this.permission = 'GRANTED';
    } catch (error) {
      this.permission = permissionFromError(error);
      throw error;
    }

    const coords = position?.coords || {};
    const capturedAt = new Date(Number(position?.timestamp) || Date.now()).toISOString();
    const sample = Object.freeze({
      capturedAt,
      latitude: Number(coords.latitude),
      longitude: Number(coords.longitude),
      accuracyMeters: Number(coords.accuracy),
      altitudeMeters: Number.isFinite(Number(coords.altitude)) ? Number(coords.altitude) : null,
      speedMetersPerSecond: Number.isFinite(Number(coords.speed)) ? Number(coords.speed) : null,
      headingDegrees: Number.isFinite(Number(coords.heading)) ? Number(coords.heading) : null,
      precise: Number(coords.accuracy) <= 100,
      mocked: null,
      source: 'web-foreground-sample',
      bridgeVersion: PERFORMANCE_WEB_LOCATION_VERSION,
    });
    if (!Number.isFinite(sample.latitude) || !Number.isFinite(sample.longitude) || !Number.isFinite(sample.accuracyMeters)) {
      throw new Error('Browser location sample is incomplete');
    }

    const write = createQueuedWrite({
      id: this.uuid(),
      kind: 'LOCATION',
      capturedAt,
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
    await this.onQueuedLocation(write);
    this.lastSample = sample;
    this.state = 'WEB_FOREGROUND';
    return write;
  }

  async startShift({ shiftId, employeeId, deviceId, initiatedByUser = false }) {
    assertContext({ shiftId, employeeId, deviceId });
    if (initiatedByUser !== true) throw new Error('Web location may only sample from visible Start My Day action');
    this.context = { shiftId, employeeId, deviceId };
    this.permission = await this.#readPermissionWithoutPrompt();
    this.state = 'WEB_FOREGROUND';
    try {
      await this.#captureSample();
    } catch (error) {
      if (this.permission === 'DENIED') return Object.freeze({ ...this.getState(), state: 'PERMISSION_REQUIRED' });
      return Object.freeze({ ...this.getState(), state: 'WEB_FOREGROUND' });
    }
    return this.getState();
  }

  async attachToAlreadyActiveShift({ shiftId, employeeId, deviceId }) {
    assertContext({ shiftId, employeeId, deviceId });
    this.context = { shiftId, employeeId, deviceId };
    this.permission = await this.#readPermissionWithoutPrompt();
    this.state = 'WEB_FOREGROUND';
    return this.getState();
  }

  async captureNow() {
    if (!this.context) throw new Error('No active web shift location context');
    return this.#captureSample();
  }

  async stopShift({ shiftId } = {}) {
    if (shiftId && this.context?.shiftId && shiftId !== this.context.shiftId) throw new Error('Cannot stop a different shift');
    this.context = null;
    this.lastSample = null;
    this.state = 'STOPPED';
    return this.getState();
  }

  async ensureStoppedWhenNoActiveShift() {
    this.context = null;
    this.lastSample = null;
    this.state = 'STOPPED';
    this.permission = await this.#readPermissionWithoutPrompt();
    return this.getState();
  }
}

export const PerformanceWebLocationInvariants = Object.freeze([
  'web location uses getCurrentPosition only and never watchPosition',
  'web location never promises locked-screen or background continuity',
  'Start My Day may collect one explicit foreground sample after user action',
  'Finish Day may collect one best-effort foreground end sample',
  'reopening an active web shift does not silently prompt for or start location',
  'every accepted web location sample is queued before it is returned',
  'web location evidence never authorizes field Lookup',
]);