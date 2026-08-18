export const PERFORMANCE_SECURE_STORAGE_PLUGIN_NAME = 'PerformanceSecureStorage';
export const PERFORMANCE_SECURE_STORAGE_PREFIX = 'paradise-performance:';

function assertNativePlugin(plugin) {
  for (const method of ['getItem', 'setItem', 'removeItem']) {
    if (typeof plugin?.[method] !== 'function') throw new Error(`PerformanceSecureStorage native plugin missing ${method}`);
  }
}

function namespaced(key, prefix) {
  const text = String(key ?? '');
  if (!text) throw new Error('secure-storage key is required');
  return `${prefix}${text}`;
}

export function createCapacitorSecureStorageAdapter(nativePlugin, { prefix = PERFORMANCE_SECURE_STORAGE_PREFIX } = {}) {
  assertNativePlugin(nativePlugin);
  if (typeof prefix !== 'string' || !prefix) throw new Error('secure-storage prefix is required');

  return Object.freeze({
    async getItem(key) {
      const result = await nativePlugin.getItem({ key: namespaced(key, prefix) });
      return typeof result?.value === 'string' ? result.value : null;
    },
    async setItem(key, value) {
      if (typeof value !== 'string') throw new Error('secure-storage values must be strings');
      await nativePlugin.setItem({ key: namespaced(key, prefix), value });
    },
    async removeItem(key) {
      await nativePlugin.removeItem({ key: namespaced(key, prefix) });
    },
  });
}

export function registerCapacitorSecureStorage(registerPlugin, options) {
  if (typeof registerPlugin !== 'function') throw new Error('Capacitor registerPlugin function is required');
  return createCapacitorSecureStorageAdapter(registerPlugin(PERFORMANCE_SECURE_STORAGE_PLUGIN_NAME), options);
}

export const PerformanceSecureStorageInvariants = Object.freeze([
  'native refresh/session secrets are stored only through OS-protected storage',
  'secure-storage keys are namespaced to Paradise Performance',
  'browser localStorage is never used by this adapter',
  'secure-storage values are never logged or returned except to the authenticated client runtime',
  'removing a trusted-device session deletes its protected local value',
]);
