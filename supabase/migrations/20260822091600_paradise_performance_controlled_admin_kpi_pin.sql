-- Paradise Performance controlled admin KPI pinning.
-- This is intentionally scoped to role=admin for the Anthony/Josh controlled test cohort only.
-- It does not activate canvasser/manager employee rollout, leaderboard, pay, bonus, commission, or discipline logic.

create or replace function public.performance_pin_kpi_standard_version_on_shift_insert()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role text;
  v_office text;
  v_team text;
  v_versions text[];
  v_count integer;
begin
  if new.kpi_standard_version_label is not null then
    return new;
  end if;

  select e.role, e.office, e.team
    into v_role, v_office, v_team
  from public.performance_employees e
  where e.id = new.employee_id
    and e.active = true;

  if not found then
    return new;
  end if;

  select array_agg(distinct s.version_label order by s.version_label)
    into v_versions
  from public.performance_kpi_standard_versions s
  where s.effective_from <= new.started_at
    and (s.effective_to is null or new.started_at < s.effective_to)
    and (s.applies_to_role is null or lower(s.applies_to_role) = lower(v_role))
    and (s.applies_to_office is null or lower(s.applies_to_office) = lower(coalesce(v_office, '')))
    and (s.applies_to_team is null or lower(s.applies_to_team) = lower(coalesce(v_team, '')));

  v_count := coalesce(array_length(v_versions, 1), 0);
  if v_count = 1 then
    new.kpi_standard_version_label := v_versions[1];
  elsif v_count > 1 then
    raise exception 'Multiple KPI standard versions apply to employee % at shift start %: %',
      new.employee_id, new.started_at, array_to_string(v_versions, ', ')
      using errcode = '22023';
  end if;

  return new;
end;
$$;

revoke all on function public.performance_pin_kpi_standard_version_on_shift_insert() from public;

drop trigger if exists performance_shifts_pin_kpi_standard_version on public.performance_shifts;
create trigger performance_shifts_pin_kpi_standard_version
before insert on public.performance_shifts
for each row
execute function public.performance_pin_kpi_standard_version_on_shift_insert();

insert into public.performance_kpi_standard_versions (
  version_label,
  applies_to_role,
  applies_to_office,
  applies_to_team,
  effective_from,
  effective_to,
  metric_key,
  minimum,
  above_standard,
  attribution_model,
  minimum_hours,
  minimum_opportunities,
  configured_by
)
values
  (
    '2026.08.22-canvass-kpi-admin-test-v1',
    'admin', null, null,
    timestamptz '2026-08-22 09:16:00+00', null,
    'knocks_per_hour', 10, null,
    'origin_cohort', null, null, null
  ),
  (
    '2026.08.22-canvass-kpi-admin-test-v1',
    'admin', null, null,
    timestamptz '2026-08-22 09:16:00+00', null,
    'sets_per_hour', 0.50, null,
    'origin_cohort', null, null, null
  )
on conflict (version_label, metric_key) do update
set applies_to_role = excluded.applies_to_role,
    applies_to_office = excluded.applies_to_office,
    applies_to_team = excluded.applies_to_team,
    effective_from = excluded.effective_from,
    effective_to = excluded.effective_to,
    minimum = excluded.minimum,
    above_standard = excluded.above_standard,
    attribution_model = excluded.attribution_model,
    minimum_hours = excluded.minimum_hours,
    minimum_opportunities = excluded.minimum_opportunities;
