import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCapacitorPerformanceLocationPlugin } from '../native/capacitor-performance-plugin.mjs';

const root = new URL('../native/', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('Capacitor listener adapter satisfies callback/remove semantics without inventing tracking', async () => {
  const calls = { listener: null, removed: 0 };
  const native = {
    async getPermissionState() {},
    async requestShiftLocationPermission() {},
    async startShiftTracking() {},
    async reattachShiftTracking() {},
    async stopShiftTracking() {},
    async getTrackingStatus() {},
    async getCurrentLocation() {},
    async addListener(name, callback) {
      assert.equal(name, 'location');
      calls.listener = callback;
      return { remove: async () => { calls.removed += 1; } };
    },
  };
  const plugin = createCapacitorPerformanceLocationPlugin(native);
  const handle = await plugin.addLocationListener(() => undefined);
  await plugin.removeLocationListener(handle);
  assert.equal(calls.removed, 1);
});

test('iOS runtime is shift-bound, background-capable, and does not auto-start on plugin load', async () => {
  const swift = await read('ios/PerformanceLocationPlugin.swift');
  const plist = await read('ios/Info.plist.performance-location.xml');
  const loadBody = swift.match(/override public func load\(\) \{([\s\S]*?)\n    \}/)?.[1] ?? '';
  assert.doesNotMatch(loadBody, /startUpdatingLocation/);
  assert.match(swift, /call\.getBool\("initiatedByUser"\) == true/);
  assert.match(swift, /No persisted matching shift may be reattached/);
  assert.match(swift, /manager\.allowsBackgroundLocationUpdates = true/);
  assert.match(swift, /manager\.pausesLocationUpdatesAutomatically = false/);
  assert.match(swift, /manager\.startUpdatingLocation\(\)/);
  assert.match(swift, /manager\.stopUpdatingLocation\(\)/);
  assert.match(plist, /NSLocationWhenInUseUsageDescription/);
  assert.match(plist, /NSLocationAlwaysAndWhenInUseUsageDescription/);
  assert.match(plist, /<string>location<\/string>/);
});

test('Android runtime uses a location foreground service with a persistent notification', async () => {
  const plugin = await read('android/PerformanceLocationPlugin.kt');
  const service = await read('android/PerformanceLocationService.kt');
  const manifest = await read('android/AndroidManifest.performance-location.xml');
  const loadBody = plugin.match(/override fun load\(\) \{([\s\S]*?)\n    \}/)?.[1] ?? '';
  assert.doesNotMatch(loadBody, /startForegroundShiftService/);
  assert.match(plugin, /initiatedByUser/);
  assert.match(plugin, /No persisted matching shift may be reattached/);
  assert.match(plugin, /ContextCompat\.startForegroundService/);
  assert.match(service, /FOREGROUND_SERVICE_TYPE_LOCATION/);
  assert.match(service, /startForeground\(/);
  assert.match(service, /setOngoing\(true\)/);
  assert.match(service, /START_STICKY/);
  assert.match(service, /ACTION_STOP/);
  assert.match(manifest, /android\.permission\.FOREGROUND_SERVICE_LOCATION/);
  assert.match(manifest, /android:foregroundServiceType="location"/);
  assert.match(manifest, /android:exported="false"/);
});

test('Android technical sample interval is explicitly not a KPI or compensation standard', async () => {
  const service = await read('android/PerformanceLocationService.kt');
  assert.match(service, /not KPI, productivity, territory, or compensation standards/);
});
