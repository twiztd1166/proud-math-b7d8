import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PerformanceSyncQueue,
  classifySyncError,
  createMemoryQueueStore,
  createQueuedWrite,
  retryDelayMs,
} from '../client/performance-sync.mjs';

const ids = {
  one: '11111111-1111-4111-8111-111111111111',
  two: '22222222-2222-4222-8222-222222222222',
  three: '33333333-3333-4333-8333-333333333333',
};
const capturedAt = '2026-08-18T12:00:00.000Z';
const payload = { employeeId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1' };

function write(id = ids.one, kind = 'EVENT', at = capturedAt) {
  return createQueuedWrite({ id, kind, capturedAt: at, payload });
}

test('queued write requires stable UUID and preserves captured timestamp', () => {
  const row = write();
  assert.equal(row.id, ids.one);
  assert.equal(row.capturedAt, capturedAt);
  assert.throws(() => createQueuedWrite({ id: 'not-a-uuid', kind: 'EVENT', capturedAt, payload }));
});

test('memory store clones rows and duplicate enqueue preserves original record', async () => {
  const store = createMemoryQueueStore();
  const queue = new PerformanceSyncQueue({ store, transport: { async send() {} } });
  const first = await queue.enqueue(write());
  const second = await queue.enqueue(createQueuedWrite({ id: ids.one, kind: 'EVENT', capturedAt: '2026-08-18T13:00:00Z', payload }));
  assert.equal(second.capturedAt, first.capturedAt);
  assert.equal((await store.list()).length, 1);
});

test('successful send removes queued write', async () => {
  const store = createMemoryQueueStore();
  const sent = [];
  const queue = new PerformanceSyncQueue({ store, transport: { async send(row) { sent.push(row); } } });
  await queue.enqueue(write());
  const result = await queue.flush();
  assert.deepEqual(result, { attempted: 1, synced: 1, duplicateAcks: 0, retried: 0, rejected: 0, blockedAuth: false });
  assert.equal(sent[0].id, ids.one);
  assert.equal((await store.list()).length, 0);
});

test('duplicate-key replay is acknowledged and removed', async () => {
  const store = createMemoryQueueStore();
  const queue = new PerformanceSyncQueue({ store, transport: { async send() { throw Object.assign(new Error('duplicate key'), { code: '23505' }); } } });
  await queue.enqueue(write());
  const result = await queue.flush();
  assert.equal(result.duplicateAcks, 1);
  assert.equal((await store.list()).length, 0);
});

test('transient failure keeps same id/capturedAt with bounded retry', async () => {
  const now = new Date('2026-08-18T12:01:00Z');
  const store = createMemoryQueueStore();
  const queue = new PerformanceSyncQueue({
    store,
    now: () => now,
    transport: { async send() { throw new Error('network unavailable'); } },
  });
  await queue.enqueue(write());
  const result = await queue.flush();
  assert.equal(result.retried, 1);
  const [row] = await store.list();
  assert.equal(row.id, ids.one);
  assert.equal(row.capturedAt, capturedAt);
  assert.equal(row.state, 'PENDING');
  assert.equal(row.attempts, 1);
  assert.equal(row.nextAttemptAt, new Date(now.valueOf() + retryDelayMs(1)).toISOString());
});

test('auth failure blocks current and later replay without dropping either', async () => {
  const store = createMemoryQueueStore();
  const attempted = [];
  const queue = new PerformanceSyncQueue({
    store,
    transport: {
      async send(row) {
        attempted.push(row.id);
        if (row.id === ids.one) throw Object.assign(new Error('row-level security'), { code: '42501' });
      },
    },
  });
  await queue.enqueue(write(ids.one, 'EVENT', '2026-08-18T12:00:00Z'));
  await queue.enqueue(write(ids.two, 'EVENT', '2026-08-18T12:00:01Z'));
  const result = await queue.flush();
  assert.equal(result.blockedAuth, true);
  assert.deepEqual(attempted, [ids.one]);
  const rows = await store.list();
  assert.equal(rows.find(row => row.id === ids.one).state, 'AUTH_BLOCKED');
  assert.equal(rows.find(row => row.id === ids.two).state, 'PENDING');

  attempted.length = 0;
  const second = await queue.flush();
  assert.equal(second.synced, 1);
  assert.deepEqual(attempted, [ids.two]);
  assert.equal((await store.list()).find(row => row.id === ids.one).state, 'AUTH_BLOCKED');
});

test('releaseAuthBlocked makes record eligible after enrollment/session recovery', async () => {
  const store = createMemoryQueueStore();
  let authorized = false;
  const queue = new PerformanceSyncQueue({
    store,
    transport: { async send() { if (!authorized) throw Object.assign(new Error('permission denied'), { code: '42501' }); } },
  });
  await queue.enqueue(write());
  await queue.flush();
  authorized = true;
  await queue.releaseAuthBlocked();
  const result = await queue.flush();
  assert.equal(result.synced, 1);
  assert.equal((await store.list()).length, 0);
});

test('rejected 4xx remains visible and does not retry automatically', async () => {
  const store = createMemoryQueueStore();
  let calls = 0;
  const queue = new PerformanceSyncQueue({
    store,
    transport: { async send() { calls += 1; throw Object.assign(new Error('bad payload'), { status: 422 }); } },
  });
  await queue.enqueue(write());
  const first = await queue.flush();
  const second = await queue.flush();
  assert.equal(first.rejected, 1);
  assert.equal(second.attempted, 0);
  assert.equal(calls, 1);
  assert.equal((await store.list())[0].state, 'REJECTED');
});

test('flush sends pending writes in captured-time order', async () => {
  const store = createMemoryQueueStore();
  const order = [];
  const queue = new PerformanceSyncQueue({ store, transport: { async send(row) { order.push(row.id); } } });
  await queue.enqueue(write(ids.one, 'EVENT', '2026-08-18T12:00:03Z'));
  await queue.enqueue(write(ids.two, 'LOCATION', '2026-08-18T12:00:01Z'));
  await queue.enqueue(write(ids.three, 'SET', '2026-08-18T12:00:02Z'));
  await queue.flush();
  assert.deepEqual(order, [ids.two, ids.three, ids.one]);
});

test('sync error classification is explicit', () => {
  assert.equal(classifySyncError({ code: '23505', message: 'x' }), 'DUPLICATE_ACK');
  assert.equal(classifySyncError({ status: 401, message: 'x' }), 'AUTH_BLOCKED');
  assert.equal(classifySyncError({ code: '42501', message: 'x' }), 'AUTH_BLOCKED');
  assert.equal(classifySyncError({ status: 422, message: 'x' }), 'REJECTED');
  assert.equal(classifySyncError(new Error('offline')), 'RETRY');
});
