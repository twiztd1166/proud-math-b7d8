export const PERFORMANCE_NATIVE_PLUGIN_NAME = 'PerformanceLocation';
export const PERFORMANCE_NATIVE_LOCATION_EVENT = 'location';

export function createCapacitorPerformanceLocationPlugin(nativePlugin) {
  if (!nativePlugin || typeof nativePlugin !== 'object') throw new Error('Registered Capacitor PerformanceLocation plugin is required');
  for (const method of [
    'getPermissionState',
    'requestShiftLocationPermission',
    'startShiftTracking',
    'reattachShiftTracking',
    'stopShiftTracking',
    'getTrackingStatus',
    'getCurrentLocation',
    'addListener',
  ]) {
    if (typeof nativePlugin[method] !== 'function') throw new Error(`PerformanceLocation native plugin missing ${method}`);
  }

  return Object.freeze({
    getPermissionState: () => nativePlugin.getPermissionState(),
    requestShiftLocationPermission: () => nativePlugin.requestShiftLocationPermission(),
    startShiftTracking: options => nativePlugin.startShiftTracking(options),
    reattachShiftTracking: options => nativePlugin.reattachShiftTracking(options),
    stopShiftTracking: options => nativePlugin.stopShiftTracking(options),
    getTrackingStatus: () => nativePlugin.getTrackingStatus(),
    getCurrentLocation: () => nativePlugin.getCurrentLocation(),
    async addLocationListener(callback) {
      if (typeof callback !== 'function') throw new Error('location callback is required');
      return nativePlugin.addListener(PERFORMANCE_NATIVE_LOCATION_EVENT, callback);
    },
    async removeLocationListener(handle) {
      if (typeof handle?.remove !== 'function') throw new Error('Capacitor listener handle.remove is required');
      await handle.remove();
    },
  });
}

export function registerCapacitorPerformanceLocation(registerPlugin) {
  if (typeof registerPlugin !== 'function') throw new Error('Capacitor registerPlugin function is required');
  return createCapacitorPerformanceLocationPlugin(registerPlugin(PERFORMANCE_NATIVE_PLUGIN_NAME));
}
