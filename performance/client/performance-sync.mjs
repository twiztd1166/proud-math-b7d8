import { isUuid } from '../shared/performance-events.mjs';

export const PERFORMANCE_SYNC_VERSION = '2026.08.18-performance-sync-v1';
export const PERFORMANCE_WRITE_KINDS = Object.freeze(['EVENT', 'LOCATION', 'SET']);

function iso(value) {
  const d = new Date(value);
  if (!value || Number.isNaN(d.valueOf())) throw new Error('capturedAt must be a valid timestamp');
  return d.toISOString();
}

export function createQueuedWrite({ id, kind, capturedAt, payload }) {
  if (!isUuid(id)) throw new Error('queued write id must be a stable UUID');
  if (!PERFORMANCE_WRITE_KINDS.includes(kind)) throw new Error(`Unsupported queued write kind: ${kind}`);
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('queued write payload must be an object');
  return Object.freeze({
    id,
    kind,
    capturedAt: iso(capturedAt),
    payload: Object.freeze({ ...payload }),
  });
}

export function createMemoryQueueStore(initial = []) {
  const rows = new Map(initial.map(row => [row.id, structuredClone(row)]));
  return {
    async put(row) { rows.set(row.id, structuredClone(row)); },
    async get(id) { return rows.has(id) ? structuredClone(rows.get(id)) : null; },
    async list() { return Array.from(rows.values()).map(structuredClone); },
    async remove(id) { rows.delete(id); },
    async clear() { rows.clear(); },
  };
}

export function createJsonStorageQueueStore(storage, key = 'paradise-performance-offline-v1') {
  for (const method of ['getItem', 'setItem', 'removeItem']) {
    if (typeof storage?.[method] !== 'function') throw new Error(`storage.${method} is required`);
  }
  async function readAll() {
    const raw = await storage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  }
  async function writeAll(rows) {
    if (rows.length === 0) return storage.removeItem(key);
    return storage.setItem(key, JSON.stringify(rows));
  }
  return {
    async put(row) {
      const rows = await readAll();
      const index = rows.findIndex(x => x.id === row.id);
      if (index >= 0) rows[index] = row; else rows.push(row);
      await writeAll(rows);
    },
    async get(id) { return (await readAll()).find(x => x.id === id) ?? null; },
    async list() { return readAll(); },
    async remove(id) { await writeAll((await readAll()).filter(x => x.id !== id)); },
    async clear() { await storage.removeItem(key); },
  };
}

export function retryDelayMs(attempts) {
  const n = Math.max(0, Math.floor(Number(attempts) || 0));
  return Math.min(300_000, 1_000 * (2 ** Math.min(n, 8)));
}

function safeError(error) {
  return {
    code: error?.code ? String(error.code).slice(0, 64) : null,
    message: error?.message ? String(error.message).slice(0, 240) : 'sync failed',
    status: Number.isFinite(Number(error?.status)) ? Number(error.status) : null,
  };
}

export function classifySyncError(error) {
  const code = String(error?.code ?? '');
  const status = Number(error?.status ?? error?.statusCode ?? 0);
  const message = String(error?.message ?? '');
  if (code === '23505' || /duplicate key/i.test(message)) return 'DUPLICATE_ACK';
  if (status === 401 || status === 403 || code === '42501' || /row-level security|permission denied|jwt/i.test(message)) return 'AUTH_BLOCKED';
  if (status >= 400 && status < 500) return 'REJECTED';
  return 'RETRY';
}

export function createSupabaseSyncTransport(supabase) {
  if (!supabase?.from) throw new Error('Supabase client is required');
  return {
    async send(record) {
      let query;
      if (record.kind === 'EVENT') {
        const p = record.payload;
        query = supabase.from('performance_events').insert({
          client_event_id: record.id,
          employee_id: p.employeeId,
          device_id: p.deviceId,
          shift_id: p.shiftId ?? null,
          event_type: p.type,
          captured_at: record.capturedAt,
          schema_version: p.schemaVersion,
          payload: p.payload ?? {},
        });
      } else if (record.kind === 'LOCATION') {
        const p = record.payload;
        query = supabase.from('performance_location_points').insert({
          client_point_id: record.id,
          employee_id: p.employeeId,
          device_id: p.deviceId,
          shift_id: p.shiftId,
          captured_at: record.capturedAt,
          latitude: p.latitude,
          longitude: p.longitude,
          accuracy_meters: p.accuracyMeters,
          altitude_meters: p.altitudeMeters ?? null,
          speed_meters_per_second: p.speedMetersPerSecond ?? null,
          heading_degrees: p.headingDegrees ?? null,
          precise: p.precise !== false,
          mocked: p.mocked === true,
          source: p.source ?? 'native',
        });
      } else if (record.kind === 'SET') {
        const p = record.payload;
        query = supabase.from('performance_sets').insert({
          client_set_id: record.id,
          employee_id: p.employeeId,
          origin_shift_id: p.originShiftId,
          created_device_id: p.createdDeviceId,
          customer_name: p.customerName ?? null,
          customer_phone: p.customerPhone ?? null,
          confirmed_customer_address: p.confirmedCustomerAddress ?? null,
          product: p.product ?? null,
          appointment_at: p.appointmentAt ?? null,
          set_captured_at: record.capturedAt,
          set_latitude: p.latitude ?? null,
          set_longitude: p.longitude ?? null,
          set_accuracy_meters: p.accuracyMeters ?? null,
          quick_set: p.quickSet === true,
          status: p.status ?? 'open',
        });
      } else {
        throw new Error(`Unsupported queued write kind: ${record.kind}`);
      }
      const { error } = await query;
      if (error) throw error;
      return { ok: true };
    },
  };
}

export class PerformanceSyncQueue {
  constructor({ store, transport, now = () => new Date() }) {
    if (!store?.put || !store?.list || !store?.remove) throw new Error('queue store contract is incomplete');
    if (!transport?.send) throw new Error('sync transport is required');
    this.store = store;
    this.transport = transport;
    this.now = now;
  }

  async enqueue(write) {
    const existing = await this.store.get?.(write.id);
    if (existing) return existing;
    const row = {
      ...write,
      state: 'PENDING',
      attempts: 0,
      nextAttemptAt: null,
      lastError: null,
      enqueuedAt: this.now().toISOString(),
    };
    await this.store.put(row);
    return row;
  }

  async flush({ limit = 100 } = {}) {
    const now = this.now();
    const rows = (await this.store.list())
      .filter(row => !row.nextAttemptAt || new Date(row.nextAttemptAt) <= now)
      .sort((a, b) => new Date(a.capturedAt) - new Date(b.capturedAt))
      .slice(0, limit);

    const result = { attempted: 0, synced: 0, duplicateAcks: 0, retried: 0, rejected: 0, blockedAuth: false };
    for (const row of rows) {
      result.attempted += 1;
      try {
        await this.transport.send(row);
        await this.store.remove(row.id);
        result.synced += 1;
      } catch (error) {
        const disposition = classifySyncError(error);
        if (disposition === 'DUPLICATE_ACK') {
          await this.store.remove(row.id);
          result.duplicateAcks += 1;
          continue;
        }
        if (disposition === 'AUTH_BLOCKED') {
          await this.store.put({ ...row, state: 'AUTH_BLOCKED', lastError: safeError(error) });
          result.blockedAuth = true;
          break;
        }
        if (disposition === 'REJECTED') {
          await this.store.put({ ...row, state: 'REJECTED', lastError: safeError(error), nextAttemptAt: null });
          result.rejected += 1;
          continue;
        }
        const attempts = Number(row.attempts || 0) + 1;
        await this.store.put({
          ...row,
          state: 'PENDING',
          attempts,
          lastError: safeError(error),
          nextAttemptAt: new Date(now.valueOf() + retryDelayMs(attempts)).toISOString(),
        });
        result.retried += 1;
      }
    }
    return Object.freeze(result);
  }
}

export const PerformanceSyncInvariants = Object.freeze([
  'a client-generated write ID never changes across retries',
  'capturedAt never changes to server retry time',
  'duplicate-key replay is acknowledged rather than duplicated',
  'authorization failures stop replay instead of silently dropping field work',
  'transient failures remain queued with bounded exponential backoff',
  'Lookup remains usable even if the Performance queue is blocked or offline',
]);
