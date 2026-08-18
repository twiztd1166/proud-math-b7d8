import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCapacitorPerformanceLocationPlugin } from '../native/capacitor-performance-plugin.mjs';

const root = new URL('../native/', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('Capacitor listener/spool adapter satisfies callback, drain, ack, and remove semantics without inventing tracking', async () => {
  const calls = { removed: 0, drain: 0, ack: 0 };
  const native = {
    async getPermissionState() {},
    async requestShiftLocationPermission() {},
    async startShiftTracking() {},
    async reattachShiftTracking() {},
    async stopShiftTracking() {},
    async getTrackingStatus() {},
    async getCurrentLocation() {},
    async drainPendingLocations() { calls.drain += 1; return { samples: [], remaining: 0 }; },
    async ackPendingLocations() { calls.ack += 1; return { acknowledged: 0, pending: 0 }; },
    async addListener(name) {
      assert.equal(name, 'location');
      return { remove: async () => { calls.removed += 1; } };
    },
  };
  const plugin = createCapacitorPerformanceLocationPlugin(native);
  await plugin.drainPendingLocations({ limit: 50 });
  await plugin.ackPendingLocations({ clientPointIds: [] });
  const handle = await plugin.addLocationListener(() => undefined);
  await plugin.removeLocationListener(handle);
  assert.equal(calls.drain, 1);
  assert.equal(calls.ack, 1);
  assert.equal(calls.removed, 1);
});

test('iOS runtime is shift-bound, background-capable, durably spooled, and does not auto-start on plugin load', async () => {
  const swift = await read('ios/PerformanceLocationPlugin.swift');
  const spool = await read('ios/PerformanceLocationSpool.swift');
  const plist = await read('ios/Info.plist.performance-location.xml');
  const loadBody = swift.match(/override public func load\(\) \{([\s\S]*?)\n    \}/)?.[1] ?? '';
  assert.doesNotMatch(loadBody, /startUpdatingLocation/);
  assert.match(swift, /call\.getBool\("initiatedByUser"\) == true/);
  assert.match(swift, /employeeId.*deviceId/s);
  assert.match(swift, /No persisted matching shift\/device context may be reattached/);
  assert.match(swift, /manager\.allowsBackgroundLocationUpdates = true/);
  assert.match(swift, /manager\.pausesLocationUpdatesAutomatically = false/);
  assert.match(swift, /manager\.startUpdatingLocation\(\)/);
  assert.match(swift, /manager\.stopUpdatingLocation\(\)/);
  assert.match(swift, /drainPendingLocations/);
  assert.match(swift, /ackPendingLocations/);
  assert.match(swift, /try spool\.append\(record\)/);
  assert.match(swift, /Persist before listener delivery|persist before listener delivery/i);
  assert.match(spool, /clientPointId/);
  assert.match(spool, /employeeId/);
  assert.match(spool, /deviceId/);
  assert.match(spool, /shiftId/);
  assert.match(spool, /Data\.write|data\.write/);
  assert.match(spool, /\.atomic/);
  assert.match(spool, /refusing to discard pending GPS/);
  assert.match(plist, /NSLocationWhenInUseUsageDescription/);
  assert.match(plist, /NSLocationAlwaysAndWhenInUseUsageDescription/);
  assert.match(plist, /<string>location<\/string>/);
});

test('Android runtime uses a location foreground service with persist-before-deliver spool and exact restart context', async () => {
  const plugin = await read('android/PerformanceLocationPlugin.kt');
  const service = await read('android/PerformanceLocationService.kt');
  const spool = await read('android/PerformanceLocationSpool.kt');
  const manifest = await read('android/AndroidManifest.performance-location.xml');
  const loadBody = plugin.match(/override fun load\(\) \{([\s\S]*?)\n    \}/)?.[1] ?? '';
  assert.doesNotMatch(loadBody, /startForegroundShiftService/);
  assert.match(plugin, /initiatedByUser/);
  assert.match(plugin, /activeEmployeeId/);
  assert.match(plugin, /activeDeviceId/);
  assert.match(plugin, /No persisted matching shift\/device context may be reattached/);
  assert.match(plugin, /drainPendingLocations/);
  assert.match(plugin, /ackPendingLocations/);
  assert.match(plugin, /ContextCompat\.startForegroundService/);
  assert.match(service, /FOREGROUND_SERVICE_TYPE_LOCATION/);
  assert.match(service, /startForeground\(/);
  assert.match(service, /setOngoing\(true\)/);
  assert.match(service, /START_STICKY/);
  assert.match(service, /ACTION_STOP/);
  assert.match(service, /EXTRA_EMPLOYEE_ID/);
  assert.match(service, /EXTRA_DEVICE_ID/);
  assert.match(service, /spool\.append\(record\)[\s\S]*sampleListener\?\.invoke\(record\)/);
  assert.match(spool, /clientPointId/);
  assert.match(spool, /output\.fd\.sync\(\)/);
  assert.match(spool, /refusing to discard pending GPS/);
  assert.match(manifest, /android\.permission\.FOREGROUND_SERVICE_LOCATION/);
  assert.match(manifest, /android:foregroundServiceType="location"/);
  assert.match(manifest, /android:exported="false"/);
});

test('native durable spool is evidence transport only and never changes field authority', async () => {
  const androidSpool = await read('android/PerformanceLocationSpool.kt');
  const iosSpool = await read('ios/PerformanceLocationSpool.swift');
  assert.match(androidSpool, /never.*authorization source.*Lookup/i);
  assert.match(iosSpool, /never grants authorization.*Lookup authority/i);
});

test('Android technical sample interval is explicitly not a KPI or compensation standard', async () => {
  const service = await read('android/PerformanceLocationService.kt');
  assert.match(service, /not KPI, productivity, territory, or compensation standards/);
});
