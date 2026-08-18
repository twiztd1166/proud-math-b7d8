import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PERFORMANCE_SECURE_STORAGE_PLUGIN_NAME,
  createCapacitorSecureStorageAdapter,
  registerCapacitorSecureStorage,
} from '../native/capacitor-secure-storage.mjs';

function nativeMock() {
  const values = new Map();
  const calls = [];
  return {
    calls,
    async getItem({ key }) {
      calls.push(['get', key]);
      return { value: values.has(key) ? values.get(key) : null };
    },
    async setItem({ key, value }) {
      calls.push(['set', key, value]);
      values.set(key, value);
    },
    async removeItem({ key }) {
      calls.push(['remove', key]);
      values.delete(key);
    },
  };
}

test('secure adapter namespaces values and round-trips strings', async () => {
  const plugin = nativeMock();
  const storage = createCapacitorSecureStorageAdapter(plugin);
  assert.equal(await storage.getItem('sb-token'), null);
  await storage.setItem('sb-token', 'refresh-secret');
  assert.equal(await storage.getItem('sb-token'), 'refresh-secret');
  assert.deepEqual(plugin.calls[1], ['set', 'paradise-performance:sb-token', 'refresh-secret']);
  await storage.removeItem('sb-token');
  assert.equal(await storage.getItem('sb-token'), null);
});

test('secure adapter rejects empty keys and non-string values', async () => {
  const storage = createCapacitorSecureStorageAdapter(nativeMock());
  await assert.rejects(() => storage.getItem(''), /key is required/);
  await assert.rejects(() => storage.setItem('x', { secret: true }), /must be strings/);
});

test('register helper binds the expected Capacitor plugin name', async () => {
  const plugin = nativeMock();
  let registered = null;
  const storage = registerCapacitorSecureStorage(name => {
    registered = name;
    return plugin;
  });
  assert.equal(registered, PERFORMANCE_SECURE_STORAGE_PLUGIN_NAME);
  await storage.setItem('session', 'value');
  assert.equal(await storage.getItem('session'), 'value');
});

test('adapter contract does not depend on browser localStorage', async () => {
  const prior = globalThis.localStorage;
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() { throw new Error('localStorage must not be touched'); },
  });
  try {
    const storage = createCapacitorSecureStorageAdapter(nativeMock());
    await storage.setItem('session', 'secret');
    assert.equal(await storage.getItem('session'), 'secret');
  } finally {
    if (prior === undefined) delete globalThis.localStorage;
    else Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: prior });
  }
});
