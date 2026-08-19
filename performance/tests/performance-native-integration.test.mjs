import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createSupabaseOperationalSyncTransport } from '../client/performance-operational-sync.mjs';

const root = new URL('../../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

function fakeSupabase() {
  const calls = [];
  return {
    calls,
    client: {
      from(table) {
        return {
          async insert(row) {
            calls.push({ table, row });
            return { error: null };
          },
        };
      },
    },
  };
}

test('native operational transport sends EVENT and LOCATION only', async () => {
  const fake = fakeSupabase();
  const transport = createSupabaseOperationalSyncTransport(fake.client);
  await transport.send({
    id: '11111111-1111-4111-8111-111111111111',
    kind: 'EVENT',
    capturedAt: '2026-08-19T12:00:00.000Z',
    payload: {
      employeeId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      deviceId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
      shiftId: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
      type: 'SHIFT_STARTED',
      schemaVersion: 'v1',
      payload: {},
    },
  });
  await transport.send({
    id: '22222222-2222-4222-8222-222222222222',
    kind: 'LOCATION',
    capturedAt: '2026-08-19T12:00:01.000Z',
    payload: {
      employeeId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      deviceId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
      shiftId: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
      latitude: 26.35,
      longitude: -80.09,
      accuracyMeters: 8,
    },
  });
  assert.deepEqual(fake.calls.map(call => call.table), ['performance_events', 'performance_location_points']);
  await assert.rejects(
    () => transport.send({ id: '33333333-3333-4333-8333-333333333333', kind: 'SET', capturedAt: '2026-08-19T12:00:02.000Z', payload: {} }),
    /does not enable SET writes/,
  );
  assert.equal(fake.calls.length, 2);
});

test('native Performance bundle is separate from public Canvass bundle by construction', async () => {
  const config = JSON.parse(await read('capacitor.config.json'));
  const builder = await read('scripts/build-performance-native-site.mjs');
  const sourceIndex = await read('index.html');
  const entry = await read('performance/client/performance-native-app.mjs');
  assert.equal(config.webDir, 'performance-dist');
  assert.match(builder, /canvass-dist/);
  assert.match(builder, /performance-dist/);
  assert.match(builder, /id=\\"nPerf\\"/);
  assert.match(builder, /performance-native-app\.js/);
  assert.doesNotMatch(sourceIndex, /performance-native-app\.js|id="nPerf"/);
  assert.match(entry, /validateNativePerformanceSession/);
  assert.match(entry, /redeemTrustedDevice/);
  assert.match(entry, /PerformanceTodayController/);
  assert.match(entry, /mountPerformanceToday/);
  assert.match(entry, /createSupabaseOperationalSyncTransport/);
  assert.doesNotMatch(entry, /createSupabaseSyncTransport/);
  assert.doesNotMatch(entry, /customerName|confirmedCustomerAddress|quickSet/);
});

test('native shell preserves Lookup as an independent field authority', async () => {
  const entry = await read('performance/client/performance-native-app.mjs');
  assert.match(entry, /Lookup remains/);
  assert.match(entry, /Performance data never authorizes canvassing/);
  assert.doesNotMatch(entry, /ON PACE|BELOW STANDARD|ABOVE STANDARD/);
});
