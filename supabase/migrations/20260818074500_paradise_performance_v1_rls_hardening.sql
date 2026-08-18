-- Paradise Performance v1 relational authorization hardening.
-- This migration intentionally narrows authenticated client mutations.

alter table public.performance_events
  add constraint performance_events_type_check
  check (event_type in (
    'SHIFT_STARTED','SHIFT_PAUSED','SHIFT_RESUMED','SHIFT_FINISHED',
    'DOOR_COUNT_SET','CONVERSATION_COUNT_SET','DOOR_INCREMENTED','CONVERSATION_INCREMENTED',
    'SET_CREATED','SET_COMPLETED','LOCATION_CAPTURED','OUTCOME_UPDATED','CORRECTION_REQUESTED'
  ));

-- Privileged configuration and authoritative calculated records remain server-side.
revoke insert, update, delete on public.performance_kpi_standard_versions from authenticated;
revoke insert, update, delete on public.performance_pay_plan_versions from authenticated;
revoke insert, update, delete on public.performance_territories from authenticated;
revoke insert, update, delete on public.performance_commissions from authenticated;
revoke insert, update, delete on public.performance_audit_corrections from authenticated;
revoke insert, update, delete on public.performance_period_snapshots from authenticated;

-- Shift client writes are narrow. KPI/pay version selection is not client-controlled.
revoke insert, update, delete on public.performance_shifts from authenticated;
grant insert (
  client_shift_id, employee_id, device_id, territory_id,
  started_at, start_latitude, start_longitude, start_accuracy_meters,
  doors, conversations, break_seconds
) on public.performance_shifts to authenticated;
grant update (
  status, finished_at, end_latitude, end_longitude, end_accuracy_meters,
  doors, conversations, break_seconds, updated_at
) on public.performance_shifts to authenticated;

drop policy if exists performance_shifts_insert_own on public.performance_shifts;
create policy performance_shifts_insert_own on public.performance_shifts
for insert to authenticated
with check (
  employee_id = public.performance_current_employee_id()
  and (
    device_id is null or exists (
      select 1 from public.performance_devices d
      where d.id = device_id
        and d.employee_id = public.performance_current_employee_id()
        and d.revoked_at is null
    )
  )
);

drop policy if exists performance_shifts_update_authorized on public.performance_shifts;
create policy performance_shifts_update_authorized on public.performance_shifts
for update to authenticated
using (
  employee_id = public.performance_current_employee_id()
  or public.performance_is_manager()
)
with check (
  public.performance_is_manager()
  or (
    employee_id = public.performance_current_employee_id()
    and status in ('active','paused','finishing','finished')
  )
);

-- Events are append-only and may only reference the actor's own shift/device.
revoke insert, update, delete on public.performance_events from authenticated;
grant insert (
  client_event_id, employee_id, device_id, shift_id,
  event_type, captured_at, schema_version, payload
) on public.performance_events to authenticated;

drop policy if exists performance_events_insert_own on public.performance_events;
create policy performance_events_insert_own on public.performance_events
for insert to authenticated
with check (
  employee_id = public.performance_current_employee_id()
  and (
    device_id is null or exists (
      select 1 from public.performance_devices d
      where d.id = device_id
        and d.employee_id = public.performance_current_employee_id()
        and d.revoked_at is null
    )
  )
  and (
    shift_id is null or exists (
      select 1 from public.performance_shifts s
      where s.id = shift_id
        and s.employee_id = public.performance_current_employee_id()
    )
  )
);

-- Location is append-only and must be bound to the actor's own active/historical shift.
revoke insert, update, delete on public.performance_location_points from authenticated;
grant insert (
  client_point_id, employee_id, device_id, shift_id, captured_at,
  latitude, longitude, accuracy_meters, altitude_meters,
  speed_meters_per_second, heading_degrees, precise, mocked, source
) on public.performance_location_points to authenticated;

drop policy if exists performance_location_insert_own on public.performance_location_points;
create policy performance_location_insert_own on public.performance_location_points
for insert to authenticated
with check (
  employee_id = public.performance_current_employee_id()
  and exists (
    select 1 from public.performance_shifts s
    where s.id = shift_id
      and s.employee_id = public.performance_current_employee_id()
  )
  and (
    device_id is null or exists (
      select 1 from public.performance_devices d
      where d.id = device_id
        and d.employee_id = public.performance_current_employee_id()
        and d.revoked_at is null
    )
  )
);

-- Set attribution cannot be pointed at another employee's shift.
revoke insert, update, delete on public.performance_sets from authenticated;
grant insert (
  client_set_id, employee_id, origin_shift_id, created_device_id,
  customer_name, customer_phone, confirmed_customer_address, product,
  appointment_at, set_captured_at, set_latitude, set_longitude,
  set_accuracy_meters, quick_set, status
) on public.performance_sets to authenticated;
grant update (
  customer_name, customer_phone, confirmed_customer_address, product,
  appointment_at, status, updated_at
) on public.performance_sets to authenticated;

drop policy if exists performance_sets_insert_own on public.performance_sets;
create policy performance_sets_insert_own on public.performance_sets
for insert to authenticated
with check (
  employee_id = public.performance_current_employee_id()
  and exists (
    select 1 from public.performance_shifts s
    where s.id = origin_shift_id
      and s.employee_id = public.performance_current_employee_id()
  )
  and (
    created_device_id is null or exists (
      select 1 from public.performance_devices d
      where d.id = created_device_id
        and d.employee_id = public.performance_current_employee_id()
        and d.revoked_at is null
    )
  )
);

drop policy if exists performance_sets_update_authorized on public.performance_sets;
create policy performance_sets_update_authorized on public.performance_sets
for update to authenticated
using (
  employee_id = public.performance_current_employee_id()
  or public.performance_is_manager()
)
with check (
  public.performance_is_manager()
  or (
    employee_id = public.performance_current_employee_id()
    and status in ('open','complete','duplicate_review')
  )
);

-- Manual outcome fallback may edit only outcome facts for the actor's own Set.
-- CRM verification/source metadata remains server-controlled.
revoke insert, update, delete on public.performance_set_outcomes from authenticated;
grant insert (
  set_id, demo_status, demo_at, sale_status, sale_at, sale_amount, updated_at
) on public.performance_set_outcomes to authenticated;
grant update (
  demo_status, demo_at, sale_status, sale_at, sale_amount, updated_at
) on public.performance_set_outcomes to authenticated;

drop policy if exists performance_outcomes_insert_own on public.performance_set_outcomes;
create policy performance_outcomes_insert_own on public.performance_set_outcomes
for insert to authenticated
with check (
  public.performance_is_manager()
  or exists (
    select 1 from public.performance_sets s
    where s.id = set_id
      and s.employee_id = public.performance_current_employee_id()
  )
);

drop policy if exists performance_outcomes_update_authorized on public.performance_set_outcomes;
create policy performance_outcomes_update_authorized on public.performance_set_outcomes
for update to authenticated
using (
  public.performance_is_manager()
  or exists (
    select 1 from public.performance_sets s
    where s.id = set_id
      and s.employee_id = public.performance_current_employee_id()
  )
)
with check (
  public.performance_is_manager()
  or exists (
    select 1 from public.performance_sets s
    where s.id = set_id
      and s.employee_id = public.performance_current_employee_id()
  )
);

-- Employees may request corrections; only manager/admin actors may resolve them.
revoke insert, update, delete on public.performance_correction_requests from authenticated;
grant insert (
  employee_id, record_type, record_id, field_name, requested_value, reason
) on public.performance_correction_requests to authenticated;
grant update (
  status, resolved_at, resolved_by
) on public.performance_correction_requests to authenticated;

drop policy if exists performance_correction_requests_insert_own on public.performance_correction_requests;
create policy performance_correction_requests_insert_own on public.performance_correction_requests
for insert to authenticated
with check (employee_id = public.performance_current_employee_id());

drop policy if exists performance_correction_requests_update_authorized on public.performance_correction_requests;
create policy performance_correction_requests_update_authorized on public.performance_correction_requests
for update to authenticated
using (public.performance_is_manager())
with check (public.performance_is_manager());

-- Authenticated clients never receive delete rights on Performance source tables.
revoke delete on public.performance_employees from authenticated;
revoke delete on public.performance_actor_identities from authenticated;
revoke delete on public.performance_devices from authenticated;

-- Security invariant: visibility parity is SELECT parity, never mutation parity.
