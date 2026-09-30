-- Backfill canonical official-source provenance without changing verification status.
-- Legacy recovered rows keep their original audit date. Cocoa EID 6349 is normalized
-- to a stable current City of Cocoa event URL verified on 2026-09-30.

do $$
declare
  gap_count integer;
begin
  select count(*) into gap_count
  from public.shows_app_research_calendar_controls r
  where active and calendar_visibility and plan_year=2026
    and nullif(trim(detail_data->>'official_source_url'),'') is not null
    and not exists (
      select 1 from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e
      where e->>'url'=detail_data->>'official_source_url'
    );
  if gap_count<>55 then
    raise exception 'Expected 55 pre-repair canonical-source provenance gaps; found %',gap_count;
  end if;

  if not exists (
    select 1 from public.shows_app_research_calendar_controls
    where control_id='R2026-104-COCOA-TREE'
      and detail_data->>'official_source_url' like '%EID=6349%'
  ) then
    raise exception 'Cocoa Tree source precondition failed';
  end if;
end $$;

update public.shows_app_research_calendar_controls
set detail_data=jsonb_set(
      jsonb_set(
        detail_data,
        '{official_source_url}',
        to_jsonb('https://www.cocoafl.gov/Calendar.aspx?EID=6349'::text),
        true
      ),
      '{current_source_checked_at}',
      to_jsonb('2026-09-30'::text),
      true
    ),
    updated_at=now()
where control_id='R2026-104-COCOA-TREE';

update public.shows_app_research_calendar_controls r
set source_refs =
      coalesce(r.source_refs,'[]'::jsonb)
      || jsonb_build_array(
        jsonb_build_object(
          'url',r.detail_data->>'official_source_url',
          'title',coalesce(nullif(trim(r.detail_data->>'source_label'),''),'Canonical official source'),
          'checked_at',coalesce(
            nullif(trim(r.detail_data->>'current_source_checked_at'),''),
            to_char(r.audit_checked_at at time zone 'UTC','YYYY-MM-DD')
          ),
          'verification_scope',case
            when r.research_status='CURRENT_REVERIFIED' then 'CURRENT_REVERIFIED'
            else 'RECOVERED_CANONICAL_SOURCE'
          end
        )
      ),
    updated_at=now()
where r.active
  and r.calendar_visibility
  and r.plan_year=2026
  and nullif(trim(r.detail_data->>'official_source_url'),'') is not null
  and not exists (
    select 1 from jsonb_array_elements(coalesce(r.source_refs,'[]'::jsonb)) e
    where e->>'url'=r.detail_data->>'official_source_url'
  );

do $$
declare
  remaining_gaps integer;
  null_sources integer;
  null_ids text[];
  visible_count integer;
  canonical_count integer;
begin
  select count(*) into remaining_gaps
  from public.shows_app_research_calendar_controls r
  where active and calendar_visibility and plan_year=2026
    and nullif(trim(detail_data->>'official_source_url'),'') is not null
    and not exists (
      select 1 from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e
      where e->>'url'=detail_data->>'official_source_url'
    );
  if remaining_gaps<>0 then
    raise exception 'Canonical source_refs provenance gaps remain: %',remaining_gaps;
  end if;

  select count(*),array_agg(control_id order by control_id)
  into null_sources,null_ids
  from public.shows_app_research_calendar_controls
  where active and calendar_visibility and plan_year=2026
    and nullif(trim(detail_data->>'official_source_url'),'') is null;
  if null_sources<>1 or null_ids<>array['R2026-098-MELBOURNE-HOLIDAY-ART']::text[] then
    raise exception 'Unexpected canonical-source exception set: % / %',null_sources,null_ids;
  end if;

  select count(*) into visible_count
  from public.shows_app_research_calendar_controls
  where active and calendar_visibility and plan_year=2026;
  if visible_count<>115 then raise exception 'Visible research count drifted: %',visible_count; end if;

  select count(*) into canonical_count
  from public.shows_app_research_calendar_controls r
  where active and calendar_visibility and plan_year=2026
    and nullif(trim(detail_data->>'official_source_url'),'') is not null
    and exists (
      select 1 from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e
      where e->>'url'=detail_data->>'official_source_url'
    );
  if canonical_count<>114 then
    raise exception 'Expected 114 provenance-backed canonical sources; found %',canonical_count;
  end if;

  if not exists (
    select 1 from public.shows_app_research_calendar_controls r
    where control_id='R2026-104-COCOA-TREE'
      and detail_data->>'official_source_url'='https://www.cocoafl.gov/Calendar.aspx?EID=6349'
      and exists (
        select 1 from jsonb_array_elements(coalesce(r.source_refs,'[]'::jsonb)) e
        where e->>'url'='https://www.cocoafl.gov/Calendar.aspx?EID=6349'
          and e->>'checked_at'='2026-09-30'
      )
  ) then
    raise exception 'Cocoa Tree canonical-source normalization failed';
  end if;
end $$;
