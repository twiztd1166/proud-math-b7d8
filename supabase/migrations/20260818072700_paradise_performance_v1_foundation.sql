-- Paradise Performance v1 foundation
-- SPECIFICATION ONLY UNTIL APPLIED TO A CONTROLLED SUPABASE PROJECT.
-- No numeric KPI standards or pay rules are seeded by this migration.

create extension if not exists pgcrypto;

create table if not exists public.performance_employees (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  role text not null default 'canvasser' check (role in ('canvasser','manager','admin')),
  office text,
  team text,
  manager_employee_id uuid references public.performance_employees(id),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.performance_actor_identities (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  employee_id uuid not null references public.performance_employees(id) on delete cascade,
  role text not null check (role in ('canvasser','manager','admin')),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  unique(employee_id, auth_user_id)
);

create table if not exists public.performance_devices (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.performance_employees(id) on delete cascade,
  device_label text,
  platform text not null check (platform in ('ios','android','web-test','shared')),
  enrolled_at timestamptz not null default now(),
  revoked_at timestamptz,
  last_seen_at timestamptz,
  app_version text,
  unique(id, employee_id)
);

create table if not exists public.performance_kpi_standard_versions (
  id uuid primary key default gen_random_uuid(),
  version_label text not null unique,
  applies_to_role text,
  applies_to_office text,
  applies_to_team text,
  effective_from timestamptz not null,
  effective_to timestamptz,
  metric_key text not null check (metric_key in ('knocks_per_hour','sets_per_hour','demos_per_hour','sales_per_hour')),
  minimum numeric,
  above_standard numeric,
  attribution_model text not null default 'origin_cohort',
  minimum_hours numeric,
  minimum_opportunities integer,
  configured_by uuid references public.performance_employees(id),
  created_at timestamptz not null default now(),
  check (minimum is null or minimum >= 0),
  check (above_standard is null or above_standard >= 0),
  check (minimum_hours is null or minimum_hours >= 0),
  check (minimum_opportunities is null or minimum_opportunities >= 0),
  check (effective_to is null or effective_to > effective_from)
);

create table if not exists public.performance_pay_plan_versions (
  id uuid primary key default gen_random_uuid(),
  version_label text not null unique,
  applies_to_employee_id uuid references public.performance_employees(id),
  applies_to_role text,
  effective_from timestamptz not null,
  effective_to timestamptz,
  rules jsonb not null default '{}'::jsonb,
  configured_by uuid references public.performance_employees(id),
  created_at timestamptz not null default now(),
  check (effective_to is null or effective_to > effective_from)
);

create table if not exists public.performance_territories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  office text,
  version_label text not null,
  effective_from timestamptz not null,
  effective_to timestamptz,
  geometry_geojson jsonb,
  created_at timestamptz not null default now(),
  unique(name, version_label),
  check (effective_to is null or effective_to > effective_from)
);

create table if not exists public.performance_shifts (
  id uuid primary key default gen_random_uuid(),
  client_shift_id uuid not null unique,
  employee_id uuid not null references public.performance_employees(id),
  device_id uuid references public.performance_devices(id),
  territory_id uuid references public.performance_territories(id),
  kpi_standard_version_label text,
  pay_plan_version_label text,
  status text not null default 'active' check (status in ('active','paused','finishing','finished','corrected','void')),
  started_at timestamptz not null,
  finished_at timestamptz,
  start_latitude double precision,
  start_longitude double precision,
  start_accuracy_meters double precision,
  end_latitude double precision,
  end_longitude double precision,
  end_accuracy_meters double precision,
  doors integer,
  conversations integer,
  break_seconds integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (doors is null or doors >= 0),
  check (conversations is null or conversations >= 0),
  check (break_seconds >= 0),
  check (finished_at is null or finished_at >= started_at)
);

create unique index if not exists performance_one_open_shift_per_employee
  on public.performance_shifts(employee_id)
  where status in ('active','paused','finishing');

create table if not exists public.performance_events (
  id uuid primary key default gen_random_uuid(),
  client_event_id uuid not null unique,
  employee_id uuid not null references public.performance_employees(id),
  device_id uuid references public.performance_devices(id),
  shift_id uuid references public.performance_shifts(id),
  event_type text not null,
  captured_at timestamptz not null,
  received_at timestamptz not null default now(),
  schema_version text not null,
  payload jsonb not null default '{}'::jsonb
);

create index if not exists performance_events_shift_captured_idx
  on public.performance_events(shift_id, captured_at);

create table if not exists public.performance_location_points (
  id uuid primary key default gen_random_uuid(),
  client_point_id uuid not null unique,
  employee_id uuid not null references public.performance_employees(id),
  device_id uuid references public.performance_devices(id),
  shift_id uuid not null references public.performance_shifts(id) on delete cascade,
  captured_at timestamptz not null,
  received_at timestamptz not null default now(),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  accuracy_meters double precision not null check (accuracy_meters >= 0),
  altitude_meters double precision,
  speed_meters_per_second double precision,
  heading_degrees double precision,
  precise boolean not null default true,
  mocked boolean not null default false,
  source text not null default 'native',
  route_quality text not null default 'raw' check (route_quality in ('raw','accepted','limited','gap_boundary','rejected_jitter','rejected_jump'))
);

create index if not exists performance_location_shift_time_idx
  on public.performance_location_points(shift_id, captured_at);
create index if not exists performance_location_employee_time_idx
  on public.performance_location_points(employee_id, captured_at desc);

create table if not exists public.performance_sets (
  id uuid primary key default gen_random_uuid(),
  client_set_id uuid not null unique,
  employee_id uuid not null references public.performance_employees(id),
  origin_shift_id uuid not null references public.performance_shifts(id),
  created_device_id uuid references public.performance_devices(id),
  customer_name text,
  customer_phone text,
  confirmed_customer_address text,
  product text,
  appointment_at timestamptz,
  set_captured_at timestamptz not null,
  set_latitude double precision,
  set_longitude double precision,
  set_accuracy_meters double precision,
  quick_set boolean not null default false,
  status text not null default 'open' check (status in ('open','complete','duplicate_review','void')),
  crm_external_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (set_latitude is null or set_latitude between -90 and 90),
  check (set_longitude is null or set_longitude between -180 and 180),
  check (set_accuracy_meters is null or set_accuracy_meters >= 0)
);

create index if not exists performance_sets_employee_time_idx
  on public.performance_sets(employee_id, set_captured_at desc);
create index if not exists performance_sets_origin_shift_idx
  on public.performance_sets(origin_shift_id);
create unique index if not exists performance_sets_crm_external_unique
  on public.performance_sets(crm_external_id)
  where crm_external_id is not null;

create table if not exists public.performance_set_outcomes (
  set_id uuid primary key references public.performance_sets(id) on delete cascade,
  demo_status text not null default 'pending' check (demo_status in ('pending','demoed','no_demo','cancelled','not_eligible')),
  demo_at timestamptz,
  sale_status text not null default 'pending' check (sale_status in ('pending','sold','not_sold','cancelled','not_eligible')),
  sale_at timestamptz,
  sale_amount numeric check (sale_amount is null or sale_amount >= 0),
  outcome_source text not null default 'manual' check (outcome_source in ('manual','crm','contract_system','manager_correction')),
  source_external_id text,
  verified_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.performance_commissions (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.performance_sets(id),
  employee_id uuid not null references public.performance_employees(id),
  pay_plan_version_label text not null,
  calculation_inputs jsonb not null,
  calculated_amount numeric not null check (calculated_amount >= 0),
  paid_amount numeric not null default 0 check (paid_amount >= 0),
  paid_at timestamptz,
  calculation_status text not null default 'estimated' check (calculation_status in ('estimated','verified','paid','corrected','void')),
  calculated_at timestamptz not null default now(),
  unique(set_id, employee_id, pay_plan_version_label)
);

create table if not exists public.performance_correction_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.performance_employees(id),
  record_type text not null,
  record_id uuid,
  field_name text,
  requested_value jsonb,
  reason text,
  status text not null default 'open' check (status in ('open','approved','rejected','withdrawn')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.performance_employees(id)
);

create table if not exists public.performance_audit_corrections (
  id uuid primary key default gen_random_uuid(),
  record_type text not null,
  record_id uuid not null,
  field_name text not null,
  old_value jsonb,
  new_value jsonb,
  reason text not null,
  changed_by uuid not null references public.performance_employees(id),
  changed_at timestamptz not null default now()
);

create table if not exists public.performance_period_snapshots (
  id uuid primary key default gen_random_uuid(),
  period_type text not null check (period_type in ('day','week','month','rolling_60d','rolling_90d','ytd')),
  period_start timestamptz not null,
  period_end timestamptz not null,
  scope_type text not null check (scope_type in ('company','office','team')),
  scope_key text not null,
  leaderboard_kind text not null,
  calculation_version text not null,
  rule_versions jsonb not null default '{}'::jsonb,
  standings jsonb not null,
  finalized_at timestamptz not null,
  finalized_by uuid references public.performance_employees(id),
  unique(period_type, period_start, period_end, scope_type, scope_key, leaderboard_kind),
  check (period_end > period_start)
);

create or replace function public.performance_current_employee_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select employee_id
  from public.performance_actor_identities
  where auth_user_id = auth.uid()
    and revoked_at is null
  limit 1
$$;

create or replace function public.performance_current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.performance_actor_identities
  where auth_user_id = auth.uid()
    and revoked_at is null
  limit 1
$$;

create or replace function public.performance_is_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.performance_current_role() in ('manager','admin'), false)
$$;

create or replace function public.performance_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.performance_current_role() = 'admin', false)
$$;

grant execute on function public.performance_current_employee_id() to authenticated;
grant execute on function public.performance_current_role() to authenticated;
grant execute on function public.performance_is_manager() to authenticated;
grant execute on function public.performance_is_admin() to authenticated;

alter table public.performance_employees enable row level security;
alter table public.performance_actor_identities enable row level security;
alter table public.performance_devices enable row level security;
alter table public.performance_kpi_standard_versions enable row level security;
alter table public.performance_pay_plan_versions enable row level security;
alter table public.performance_territories enable row level security;
alter table public.performance_shifts enable row level security;
alter table public.performance_events enable row level security;
alter table public.performance_location_points enable row level security;
alter table public.performance_sets enable row level security;
alter table public.performance_set_outcomes enable row level security;
alter table public.performance_commissions enable row level security;
alter table public.performance_correction_requests enable row level security;
alter table public.performance_audit_corrections enable row level security;
alter table public.performance_period_snapshots enable row level security;

grant select on public.performance_employees to authenticated;
grant select on public.performance_kpi_standard_versions to authenticated;
grant select on public.performance_pay_plan_versions to authenticated;
grant select on public.performance_territories to authenticated;
grant select, insert, update on public.performance_shifts to authenticated;
grant select, insert on public.performance_events to authenticated;
grant select, insert on public.performance_location_points to authenticated;
grant select, insert, update on public.performance_sets to authenticated;
grant select, insert, update on public.performance_set_outcomes to authenticated;
grant select on public.performance_commissions to authenticated;
grant select, insert, update on public.performance_correction_requests to authenticated;
grant select on public.performance_audit_corrections to authenticated;
grant select on public.performance_period_snapshots to authenticated;
grant select on public.performance_devices to authenticated;
grant select on public.performance_actor_identities to authenticated;

create policy performance_employees_read_all on public.performance_employees
for select to authenticated using (true);

create policy performance_identity_read_self on public.performance_actor_identities
for select to authenticated using (auth_user_id = auth.uid());

create policy performance_devices_read_all on public.performance_devices
for select to authenticated using (true);

create policy performance_kpi_read_all on public.performance_kpi_standard_versions
for select to authenticated using (true);
create policy performance_kpi_admin_insert on public.performance_kpi_standard_versions
for insert to authenticated with check (public.performance_is_admin());
create policy performance_kpi_admin_update on public.performance_kpi_standard_versions
for update to authenticated using (public.performance_is_admin()) with check (public.performance_is_admin());

create policy performance_payplan_read_all on public.performance_pay_plan_versions
for select to authenticated using (true);
create policy performance_payplan_admin_insert on public.performance_pay_plan_versions
for insert to authenticated with check (public.performance_is_admin());
create policy performance_payplan_admin_update on public.performance_pay_plan_versions
for update to authenticated using (public.performance_is_admin()) with check (public.performance_is_admin());

create policy performance_territory_read_all on public.performance_territories
for select to authenticated using (true);
create policy performance_territory_admin_insert on public.performance_territories
for insert to authenticated with check (public.performance_is_admin());
create policy performance_territory_admin_update on public.performance_territories
for update to authenticated using (public.performance_is_admin()) with check (public.performance_is_admin());

create policy performance_shifts_read_all on public.performance_shifts
for select to authenticated using (true);
create policy performance_shifts_insert_own on public.performance_shifts
for insert to authenticated with check (employee_id = public.performance_current_employee_id());
create policy performance_shifts_update_authorized on public.performance_shifts
for update to authenticated
using (employee_id = public.performance_current_employee_id() or public.performance_is_manager())
with check (employee_id = public.performance_current_employee_id() or public.performance_is_manager());

create policy performance_events_read_all on public.performance_events
for select to authenticated using (true);
create policy performance_events_insert_own on public.performance_events
for insert to authenticated with check (employee_id = public.performance_current_employee_id());

create policy performance_location_read_all on public.performance_location_points
for select to authenticated using (true);
create policy performance_location_insert_own on public.performance_location_points
for insert to authenticated with check (employee_id = public.performance_current_employee_id());

create policy performance_sets_read_all on public.performance_sets
for select to authenticated using (true);
create policy performance_sets_insert_own on public.performance_sets
for insert to authenticated with check (employee_id = public.performance_current_employee_id());
create policy performance_sets_update_authorized on public.performance_sets
for update to authenticated
using (employee_id = public.performance_current_employee_id() or public.performance_is_manager())
with check (employee_id = public.performance_current_employee_id() or public.performance_is_manager());

create policy performance_outcomes_read_all on public.performance_set_outcomes
for select to authenticated using (true);
create policy performance_outcomes_insert_own on public.performance_set_outcomes
for insert to authenticated with check (
  exists (
    select 1 from public.performance_sets s
    where s.id = set_id and s.employee_id = public.performance_current_employee_id()
  ) or public.performance_is_manager()
);
create policy performance_outcomes_update_authorized on public.performance_set_outcomes
for update to authenticated
using (
  exists (
    select 1 from public.performance_sets s
    where s.id = set_id and s.employee_id = public.performance_current_employee_id()
  ) or public.performance_is_manager()
)
with check (
  exists (
    select 1 from public.performance_sets s
    where s.id = set_id and s.employee_id = public.performance_current_employee_id()
  ) or public.performance_is_manager()
);

create policy performance_commissions_read_all on public.performance_commissions
for select to authenticated using (true);

create policy performance_correction_requests_read_all on public.performance_correction_requests
for select to authenticated using (true);
create policy performance_correction_requests_insert_own on public.performance_correction_requests
for insert to authenticated with check (employee_id = public.performance_current_employee_id());
create policy performance_correction_requests_update_authorized on public.performance_correction_requests
for update to authenticated
using (employee_id = public.performance_current_employee_id() or public.performance_is_manager())
with check (employee_id = public.performance_current_employee_id() or public.performance_is_manager());

create policy performance_audit_read_all on public.performance_audit_corrections
for select to authenticated using (true);

create policy performance_snapshots_read_all on public.performance_period_snapshots
for select to authenticated using (true);

-- Client writes intentionally have no DELETE grants or DELETE policies.
-- Service-role/secret credentials must never be present in browser/native bundles.
-- GPS is operational evidence only; it must not authorize or reinterpret live field Lookup results.
