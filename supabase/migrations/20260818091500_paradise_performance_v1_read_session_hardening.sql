-- Paradise Performance v1 read-session hardening.
-- Shared Performance visibility is for currently enrolled Performance actors only.
-- A generic authenticated Supabase user or a revoked device JWT must not retain team reads.

-- performance_employees cannot call performance_current_employee_id() in its own policy
-- because the helper joins this table. Gate it directly through the actor identity instead.
drop policy if exists performance_employees_read_all on public.performance_employees;
create policy performance_employees_read_all on public.performance_employees
for select to authenticated
using (
  exists (
    select 1
    from public.performance_actor_identities ai
    where ai.auth_user_id = (select auth.uid())
      and ai.revoked_at is null
  )
);

-- All other shared-read tables require a current active Performance employee mapping.
drop policy if exists performance_devices_read_all on public.performance_devices;
create policy performance_devices_read_all on public.performance_devices
for select to authenticated
using (public.performance_current_employee_id() is not null);

drop policy if exists performance_kpi_read_all on public.performance_kpi_standard_versions;
create policy performance_kpi_read_all on public.performance_kpi_standard_versions
for select to authenticated
using (public.performance_current_employee_id() is not null);

drop policy if exists performance_payplan_read_all on public.performance_pay_plan_versions;
create policy performance_payplan_read_all on public.performance_pay_plan_versions
for select to authenticated
using (public.performance_current_employee_id() is not null);

drop policy if exists performance_territory_read_all on public.performance_territories;
create policy performance_territory_read_all on public.performance_territories
for select to authenticated
using (public.performance_current_employee_id() is not null);

drop policy if exists performance_shifts_read_all on public.performance_shifts;
create policy performance_shifts_read_all on public.performance_shifts
for select to authenticated
using (public.performance_current_employee_id() is not null);

drop policy if exists performance_events_read_all on public.performance_events;
create policy performance_events_read_all on public.performance_events
for select to authenticated
using (public.performance_current_employee_id() is not null);

drop policy if exists performance_location_read_all on public.performance_location_points;
create policy performance_location_read_all on public.performance_location_points
for select to authenticated
using (public.performance_current_employee_id() is not null);

drop policy if exists performance_sets_read_all on public.performance_sets;
create policy performance_sets_read_all on public.performance_sets
for select to authenticated
using (public.performance_current_employee_id() is not null);

drop policy if exists performance_outcomes_read_all on public.performance_set_outcomes;
create policy performance_outcomes_read_all on public.performance_set_outcomes
for select to authenticated
using (public.performance_current_employee_id() is not null);

drop policy if exists performance_commissions_read_all on public.performance_commissions;
create policy performance_commissions_read_all on public.performance_commissions
for select to authenticated
using (public.performance_current_employee_id() is not null);

drop policy if exists performance_correction_requests_read_all on public.performance_correction_requests;
create policy performance_correction_requests_read_all on public.performance_correction_requests
for select to authenticated
using (public.performance_current_employee_id() is not null);

drop policy if exists performance_audit_read_all on public.performance_audit_corrections;
create policy performance_audit_read_all on public.performance_audit_corrections
for select to authenticated
using (public.performance_current_employee_id() is not null);

drop policy if exists performance_snapshots_read_all on public.performance_period_snapshots;
create policy performance_snapshots_read_all on public.performance_period_snapshots
for select to authenticated
using (public.performance_current_employee_id() is not null);

-- Hard invariant: "everyone sees team Performance" means every currently enrolled
-- Paradise Performance actor, not every account carrying the generic authenticated role.
