-- Enforce the canonical-source provenance invariant at the database layer.
-- Visible research rows may either have no canonical official URL (bounded unresolved case)
-- or the exact canonical URL must be present in source_refs.

create or replace function public.shows_app_research_source_ref_contains(
  p_source_refs jsonb,
  p_official_url text
)
returns boolean
language sql
immutable
set search_path = pg_catalog
as $$
  select
    nullif(btrim(p_official_url),'') is null
    or exists (
      select 1
      from jsonb_array_elements(coalesce(p_source_refs,'[]'::jsonb)) e
      where e->>'url'=p_official_url
    );
$$;

alter table public.shows_app_research_calendar_controls
  add constraint shows_app_research_calendar_controls_source_provenance_check
  check (
    not (active and calendar_visibility)
    or nullif(trim(detail_data->>'official_source_url'),'') is null
    or public.shows_app_research_source_ref_contains(
      source_refs,
      detail_data->>'official_source_url'
    )
  );

do $$
declare
  violations integer;
begin
  select count(*) into violations
  from public.shows_app_research_calendar_controls r
  where active and calendar_visibility
    and nullif(trim(detail_data->>'official_source_url'),'') is not null
    and not public.shows_app_research_source_ref_contains(
      source_refs,
      detail_data->>'official_source_url'
    );

  if violations<>0 then
    raise exception 'Existing source-provenance violations under new guard: %',violations;
  end if;
end $$;
