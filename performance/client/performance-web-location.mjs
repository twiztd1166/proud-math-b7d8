import { createQueuedWrite } from './performance-sync.mjs';
import { isUuid } from '../shared/performance-events.mjs';

export const PERFORMANCE_WEB_LOCATION_VERSION = '2026.08.21-web-foreground-location-v2';
const WATCH_MIN_INTERVAL_MS = 10000;
const WATCH_MOVEMENT_OVERRIDE_METERS = 20;

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

function radians(value) {
  return Number(value) * Math.PI / 180;
}

function distanceMeters(a, b) {
  if (!a || !b) return Number.POSITIVE_INFINITY;
  const earthRadiusMeters = 6371000;
  const dLat = radians(b.latitude - a.latitude);
  const dLon = radians(b.longitude - a.longitude);
  const lat1 = radians(a.latitude);
  const lat2 = radians(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export class BrowserForegroundLocationBridge {
  constructor({
    onQueuedLocation,
    navigatorRef = globalThis.navigator,
    documentRef = globalThis.document,
    uuid = () => crypto.randomUUID(),
  } = {}) {
    if (typeof onQueuedLocation !== 'function') throw new Error('onQueuedLocation callback is required');
    this.onQueuedLocation = onQueuedLocation;
    this.navigatorRef = navigatorRef;
    this.documentRef = documentRef;
    this.uuid = uuid;
    this.context = null;
    this.state = 'STOPPED';
    this.permission = null;
    this.lastSample = null;
    this.lastAcceptedWatchSample = null;
    this.watchId = null;
    this.wakeLockSentinel = null;
    this.wakeLockState = this.navigatorRef?.wakeLock?.request ? 'AVAILABLE' : 'UNAVAILABLE';
    this.lastError = null;
    this.writeChain = Promise.resolve();
    this.visibilityHandler = () => { void this.#handleVisibilityChange(); };
    this.documentRef?.addEventListener?.('visibilitychange', this.visibilityHandler);
  }

  #isVisible() {
    return !this.documentRef || this.documentRef.visibilityState !== 'hidden';
  }

  getState() {
    return Object.freeze({
      version: PERFORMANCE_WEB_LOCATION_VERSION,
      state: this.state,
      permission: this.permission,
      shiftId: this.context?.shiftId ?? null,
      lastSample: this.lastSample,
      continuousForegroundTracking: this.watchId !== null,
      continuousBackgroundTracking: false,
      screenWakeLock: this.wakeLockState,
      visibilityState: this.documentRef?.visibilityState ?? 'visible',
      lastError: this.lastError,
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

  async #requestWakeLock() {
    if (!this.context || !this.#isVisible()) return;
    const wakeLock = this.navigatorRef?.wakeLock;
    if (!wakeLock?.request) {
      this.wakeLockState = 'UNAVAILABLE';
      return;
    }
    if (this.wakeLockSentinel && !this.wakeLockSentinel.released) {
      this.wakeLockState = 'ACTIVE';
      return;
    }
    try {
      const sentinel = await wakeLock.request('screen');
      this.wakeLockSentinel = sentinel;
      this.wakeLockState = 'ACTIVE';
      sentinel?.addEventListener?.('release', () => {
        if (this.wakeLockSentinel === sentinel) this.wakeLockSentinel = null;
        if (this.context) this.wakeLockState = this.#isVisible() ? 'RELEASED' : 'PAUSED_HIDDEN';
        else this.wakeLockState = wakeLock?.request ? 'AVAILABLE' : 'UNAVAILABLE';
      });
    } catch (error) {
      this.wakeLockSentinel = null;
      this.wakeLockState = 'UNAVAILABLE_OR_DENIED';
      this.lastError = String(error?.message || error || 'Wake lock unavailable').slice(0, 180);
    }
  }

  async #releaseWakeLock(nextState = null) {
    const sentinel = this.wakeLockSentinel;
    this.wakeLockSentinel = null;
    if (sentinel && !sentinel.released) {
      try { await sentinel.release(); } catch { /* best effort */ }
    }
    if (nextState) this.wakeLockState = nextState;
    else this.wakeLockState = this.navigatorRef?.wakeLock?.request ? 'AVAILABLE' : 'UNAVAILABLE';
  }

  async #currentPosition() {
    const geolocation = this.navigatorRef?.geolocation;
    if (!geolocation?.getCurrentPosition) throw new Error('Browser geolocation is unavailable');
    return new Promise((resolve, reject) => {
      geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 15000,
      });
    });
  }

  #sampleFromPosition(position, source) {
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
      source,
      bridgeVersion: PERFORMANCE_WEB_LOCATION_VERSION,
    });
    if (!Number.isFinite(sample.latitude) || !Number.isFinite(sample.longitude) || !Number.isFinite(sample.accuracyMeters)) {
      throw new Error('Browser location sample is incomplete');
    }
    return sample;
  }

  async #queueSample(sample) {
    if (!this.context) throw new Error('No active web shift location context');
    const write = createQueuedWrite({
      id: this.uuid(),
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
    await this.onQueuedLocation(write);
    this.lastSample = sample;
    this.permission = 'GRANTED';
    this.state = this.watchId !== null ? 'WEB_FOREGROUND_CONTINUOUS' : 'WEB_FOREGROUND';
    return write;
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
    return this.#queueSample(this.#sampleFromPosition(position, 'web-foreground-sample'));
  }

  #shouldAcceptWatchSample(sample) {
    const previous = this.lastAcceptedWatchSample;
    if (!previous) return true;
    const elapsedMs = Date.parse(sample.capturedAt) - Date.parse(previous.capturedAt);
    if (!Number.isFinite(elapsedMs) || elapsedMs >= WATCH_MIN_INTERVAL_MS) return true;
    return distanceMeters(previous, sample) >= WATCH_MOVEMENT_OVERRIDE_METERS;
  }

  #handleWatchPosition(position) {
    if (!this.context || !this.#isVisible()) return;
    let sample;
    try {
      sample = this.#sampleFromPosition(position, 'web-foreground-watch');
    } catch (error) {
      this.lastError = String(error?.message || error).slice(0, 180);
      return;
    }
    this.permission = 'GRANTED';
    this.state = 'WEB_FOREGROUND_CONTINUOUS';
    if (!this.#shouldAcceptWatchSample(sample)) return;
    this.lastAcceptedWatchSample = sample;
    this.writeChain = this.writeChain
      .catch(() => undefined)
      .then(() => this.#queueSample(sample))
      .catch(error => {
        this.lastError = String(error?.message || error || 'Location queue failed').slice(0, 180);
        if (this.context && this.watchId !== null) this.state = 'WEB_FOREGROUND_CONTINUOUS';
      });
  }

  #handleWatchError(error) {
    this.permission = permissionFromError(error);
    this.lastError = String(error?.message || error || 'Browser location watch error').slice(0, 180);
    if (this.permission === 'DENIED') {
      this.#stopWatch();
      this.state = 'PERMISSION_REQUIRED';
    } else if (this.context) {
      this.state = 'WEB_FOREGROUND_PAUSED';
    }
  }

  #startWatch() {
    if (!this.context || !this.#isVisible() || this.watchId !== null) return;
    const geolocation = this.navigatorRef?.geolocation;
    if (!geolocation?.watchPosition || !geolocation?.clearWatch) {
      this.state = 'WEB_FOREGROUND_SAMPLE_ONLY';
      return;
    }
    try {
      const id = geolocation.watchPosition(
        position => this.#handleWatchPosition(position),
        error => this.#handleWatchError(error),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
      );
      this.watchId = id;
      this.state = 'WEB_FOREGROUND_CONTINUOUS';
    } catch (error) {
      this.watchId = null;
      this.lastError = String(error?.message || error || 'Browser location watch unavailable').slice(0, 180);
      this.state = 'WEB_FOREGROUND_SAMPLE_ONLY';
    }
  }

  #stopWatch() {
    if (this.watchId === null) return;
    try { this.navigatorRef?.geolocation?.clearWatch?.(this.watchId); } catch { /* best effort */ }
    this.watchId = null;
  }

  async #beginVisibleTracking() {
    if (!this.context || !this.#isVisible()) return this.getState();
    this.#startWatch();
    await this.#requestWakeLock();
    return this.getState();
  }

  async #handleVisibilityChange() {
    if (!this.context) return;
    if (!this.#isVisible()) {
      this.#stopWatch();
      this.state = 'WEB_FOREGROUND_PAUSED';
      await this.#releaseWakeLock('PAUSED_HIDDEN');
      return;
    }
    if (this.permission === 'GRANTED') {
      await this.#beginVisibleTracking();
    } else {
      this.state = this.permission === 'DENIED' ? 'PERMISSION_REQUIRED' : 'WEB_FOREGROUND_PAUSED';
    }
  }

  async startShift({ shiftId, employeeId, deviceId, initiatedByUser = false }) {
    assertContext({ shiftId, employeeId, deviceId });
    if (initiatedByUser !== true) throw new Error('Web location may only start from visible Start My Day action');
    this.context = { shiftId, employeeId, deviceId };
    this.permission = await this.#readPermissionWithoutPrompt();
    this.state = 'WEB_FOREGROUND';
    try {
      await this.#captureSample();
    } catch (error) {
      if (this.permission === 'DENIED') return Object.freeze({ ...this.getState(), state: 'PERMISSION_REQUIRED' });
    }
    if (this.permission !== 'DENIED') await this.#beginVisibleTracking();
    return this.getState();
  }

  async attachToAlreadyActiveShift({ shiftId, employeeId, deviceId }) {
    assertContext({ shiftId, employeeId, deviceId });
    this.context = { shiftId, employeeId, deviceId };
    const observed = await this.#readPermissionWithoutPrompt();
    if (observed) this.permission = observed;
    if (this.permission === 'GRANTED' && this.#isVisible()) {
      await this.#beginVisibleTracking();
    } else if (this.permission === 'DENIED') {
      this.state = 'PERMISSION_REQUIRED';
    } else {
      this.state = 'WEB_FOREGROUND_PAUSED';
    }
    return this.getState();
  }

  async resumeForegroundTracking({ initiatedByUser = false } = {}) {
    if (!this.context) throw new Error('No active web shift location context');
    if (initiatedByUser !== true) throw new Error('Foreground GPS resume requires a visible user action');
    if (!this.#isVisible()) return this.getState();
    try {
      await this.#captureSample();
    } catch (error) {
      if (this.permission === 'DENIED') return Object.freeze({ ...this.getState(), state: 'PERMISSION_REQUIRED' });
    }
    if (this.permission !== 'DENIED') await this.#beginVisibleTracking();
    return this.getState();
  }

  async captureNow() {
    if (!this.context) throw new Error('No active web shift location context');
    return this.#captureSample();
  }

  async stopShift({ shiftId } = {}) {
    if (shiftId && this.context?.shiftId && shiftId !== this.context.shiftId) throw new Error('Cannot stop a different shift');
    this.#stopWatch();
    await this.#releaseWakeLock();
    this.context = null;
    this.lastSample = null;
    this.lastAcceptedWatchSample = null;
    this.state = 'STOPPED';
    this.lastError = null;
    return this.getState();
  }

  async ensureStoppedWhenNoActiveShift() {
    this.#stopWatch();
    await this.#releaseWakeLock();
    this.context = null;
    this.lastSample = null;
    this.lastAcceptedWatchSample = null;
    this.state = 'STOPPED';
    this.lastError = null;
    this.permission = await this.#readPermissionWithoutPrompt();
    return this.getState();
  }

  destroy() {
    this.#stopWatch();
    void this.#releaseWakeLock();
    this.documentRef?.removeEventListener?.('visibilitychange', this.visibilityHandler);
  }
}

export const PerformanceWebLocationInvariants = Object.freeze([
  'web location uses high-accuracy watchPosition only while the document is visible and a shift is active',
  'Screen Wake Lock is requested best-effort to keep a foreground shift visible on supported iOS and Android browsers',
  'visibility loss immediately stops the browser watcher and releases wake lock; web never promises locked-screen or background continuity',
  'a visible active shift automatically resumes the watcher after visibility returns when location permission is already granted',
  'reopening an active shift does not silently prompt for new location permission',
  'manual foreground capture remains available as a fallback and resume action',
  'every accepted web location sample is queued before it is treated as recorded',
  'web location evidence never authorizes field Lookup',
]);