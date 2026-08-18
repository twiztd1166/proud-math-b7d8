-- Paradise Performance v1 query-plan hardening from live Supabase advisors.

-- Avoid per-row auth.uid() reevaluation on the actor self-read policy.
drop policy if exists performance_identity_read_self on public.performance_actor_identities;
create policy performance_identity_read_self on public.performance_actor_identities
for select to authenticated
using (auth_user_id = (select auth.uid()));

-- Cover foreign keys that will participate in joins, deletes, corrections, and reporting.
create index if not exists performance_audit_corrections_changed_by_idx
  on public.performance_audit_corrections(changed_by);
create index if not exists performance_commissions_employee_id_idx
  on public.performance_commissions(employee_id);
create index if not exists performance_correction_requests_employee_id_idx
  on public.performance_correction_requests(employee_id);
create index if not exists performance_correction_requests_resolved_by_idx
  on public.performance_correction_requests(resolved_by)
  where resolved_by is not null;
create index if not exists performance_devices_employee_id_idx
  on public.performance_devices(employee_id);
create index if not exists performance_employees_manager_idx
  on public.performance_employees(manager_employee_id)
  where manager_employee_id is not null;
create index if not exists performance_events_device_id_idx
  on public.performance_events(device_id)
  where device_id is not null;
create index if not exists performance_events_employee_time_idx
  on public.performance_events(employee_id, captured_at desc);
create index if not exists performance_kpi_configured_by_idx
  on public.performance_kpi_standard_versions(configured_by)
  where configured_by is not null;
create index if not exists performance_location_device_id_idx
  on public.performance_location_points(device_id)
  where device_id is not null;
create index if not exists performance_pay_plan_employee_idx
  on public.performance_pay_plan_versions(applies_to_employee_id)
  where applies_to_employee_id is not null;
create index if not exists performance_pay_plan_configured_by_idx
  on public.performance_pay_plan_versions(configured_by)
  where configured_by is not null;
create index if not exists performance_period_snapshots_finalized_by_idx
  on public.performance_period_snapshots(finalized_by)
  where finalized_by is not null;
create index if not exists performance_sets_created_device_id_idx
  on public.performance_sets(created_device_id)
  where created_device_id is not null;
create index if not exists performance_shifts_device_id_idx
  on public.performance_shifts(device_id)
  where device_id is not null;
create index if not exists performance_shifts_territory_id_idx
  on public.performance_shifts(territory_id)
  where territory_id is not null;