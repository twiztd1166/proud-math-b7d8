-- Paradise Performance controlled live pace standard activation.
-- Management authorization: 2026-08-22 05:07 America/New_York (09:07 UTC).
-- Activates only the two approved live rate minimums. No tolerance bands, rank,
-- pay, bonus, commission, leaderboard, downstream-quality or employee-consequence logic.

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
    '2026.08.22-canvass-live-v1',
    null,
    null,
    null,
    '2026-08-22 09:07:00+00',
    null,
    'knocks_per_hour',
    10.0,
    null,
    'origin_cohort',
    null,
    null,
    null
  ),
  (
    '2026.08.22-canvass-live-v1',
    null,
    null,
    null,
    '2026-08-22 09:07:00+00',
    null,
    'sets_per_hour',
    0.50,
    null,
    'origin_cohort',
    null,
    null,
    null
  );

create or replace function public.performance_pin_kpi_standard_version()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_version_label text;
  v_version_count integer;
begin
  if new.kpi_standard_version_label is not null then
    return new;
  end if;

  select min(s.version_label), count(distinct s.version_label)
    into v_version_label, v_version_count
  from public.performance_kpi_standard_versions s
  join public.performance_employees e on e.id = new.employee_id
  where s.effective_from <= new.started_at
    and (s.effective_to is null or new.started_at < s.effective_to)
    and (
      s.applies_to_role is null
      or lower(btrim(s.applies_to_role)) = lower(btrim(coalesce(e.role, '')))
    )
    and (
      s.applies_to_office is null
      or lower(btrim(s.applies_to_office)) = lower(btrim(coalesce(e.office, '')))
    )
    and (
      s.applies_to_team is null
      or lower(btrim(s.applies_to_team)) = lower(btrim(coalesce(e.team, '')))
    );

  if v_version_count = 1 then
    new.kpi_standard_version_label := v_version_label;
  end if;

  return new;
end;
$$;

revoke all on function public.performance_pin_kpi_standard_version() from public;
revoke all on function public.performance_pin_kpi_standard_version() from anon;
revoke all on function public.performance_pin_kpi_standard_version() from authenticated;

drop trigger if exists performance_shifts_pin_kpi_standard_version on public.performance_shifts;
create trigger performance_shifts_pin_kpi_standard_version
before insert on public.performance_shifts
for each row
execute function public.performance_pin_kpi_standard_version();

comment on function public.performance_pin_kpi_standard_version() is
'Pins one unambiguous effective employee-scoped KPI standard version at shift creation; zero or overlapping versions fail closed with no pin.';
