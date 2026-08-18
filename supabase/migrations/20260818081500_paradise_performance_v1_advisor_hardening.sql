-- Paradise Performance v1 advisor + temporal integrity hardening.
-- Convert authorization helpers to SECURITY INVOKER and bind attributed events to shift time windows.

alter function public.performance_current_employee_id() security invoker;
alter function public.performance_current_role() security invoker;
alter function public.performance_is_manager() security invoker;
alter function public.performance_is_admin() security invoker;

revoke execute on function public.performance_current_employee_id() from anon;
revoke execute on function public.performance_current_role() from anon;
revoke execute on function public.performance_is_manager() from anon;
revoke execute on function public.performance_is_admin() from anon;

grant execute on function public.performance_current_employee_id() to authenticated;
grant execute on function public.performance_current_role() to authenticated;
grant execute on function public.performance_is_manager() to authenticated;
grant execute on function public.performance_is_admin() to authenticated;

-- Events tied to a shift must have been captured inside that shift's time window.
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
        and captured_at >= s.started_at
        and (s.finished_at is null or captured_at <= s.finished_at)
    )
  )
);

-- Location points must be captured during the referenced shift. Late sync remains valid because received_at is independent.
drop policy if exists performance_location_insert_own on public.performance_location_points;
create policy performance_location_insert_own on public.performance_location_points
for insert to authenticated
with check (
  employee_id = public.performance_current_employee_id()
  and exists (
    select 1 from public.performance_shifts s
    where s.id = shift_id
      and s.employee_id = public.performance_current_employee_id()
      and captured_at >= s.started_at
      and (s.finished_at is null or captured_at <= s.finished_at)
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

-- Set attribution must point to the employee's own shift and be temporally inside it.
drop policy if exists performance_sets_insert_own on public.performance_sets;
create policy performance_sets_insert_own on public.performance_sets
for insert to authenticated
with check (
  employee_id = public.performance_current_employee_id()
  and exists (
    select 1 from public.performance_shifts s
    where s.id = origin_shift_id
      and s.employee_id = public.performance_current_employee_id()
      and set_captured_at >= s.started_at
      and (s.finished_at is null or set_captured_at <= s.finished_at)
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

-- Off-shift location cannot be attached later merely because a user owns the historical shift.
-- Historical offline data remains accepted when its captured_at is inside the original shift window.