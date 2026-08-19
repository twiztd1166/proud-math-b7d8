export const PERFORMANCE_OPERATIONAL_SYNC_VERSION = '2026.08.19-operational-sync-v1';
export const PERFORMANCE_OPERATIONAL_WRITE_KINDS = Object.freeze(['EVENT', 'LOCATION']);

export function createSupabaseOperationalSyncTransport(supabase) {
  if (!supabase?.from) throw new Error('Supabase client is required');
  return Object.freeze({
    async send(record) {
      let query;
      if (record?.kind === 'EVENT') {
        const p = record.payload || {};
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
      } else if (record?.kind === 'LOCATION') {
        const p = record.payload || {};
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
      } else {
        const error = new Error(`Native Performance v1 does not enable ${String(record?.kind || 'unknown')} writes in this integration slice`);
        error.status = 422;
        throw error;
      }
      const { error } = await query;
      if (error) throw error;
      return Object.freeze({ ok: true });
    },
  });
}

export const PerformanceOperationalSyncInvariants = Object.freeze([
  'the current native store runtime sends shift events and shift location only',
  'customer SET writes remain outside the enabled native runtime until the controlled +Set workflow is implemented',
  'the unrestricted future-capability sync transport remains separate and is not imported by the native store entrypoint',
]);
