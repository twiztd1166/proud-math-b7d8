
update public.shows_app_research_calendar_controls
set source_basis='City of Hollywood current 2026 ArtsPark Tree Lighting calendar — checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED',
      'schedule_text','Nov. 21, 2026 · festivities begin 5:00 PM · official tree lighting 7:00 PM',
      'venue_text','ArtsPark at Young Circle · 1 Young Circle, Hollywood, FL 33020','venue_status','CURRENT OFFICIAL',
      'booking_status','EVENT CURRENT-VERIFIED · VENDOR BOOTHS PRESENT · SPONSOR/ACTIVATION TERMS TO REQUEST',
      'next_action','Contact City of Hollywood Special Events for current business sponsorship/activation opportunities, pricing, footprint and availability; the event page confirms vendor booths but does not publish a Paradise-specific commercial package.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-078-HOLLYWOOD-TREE';

update public.shows_app_research_calendar_controls
set source_basis='Town of Jupiter current There’s Snow Place Like Jupiter 2026 event page + 2026 sponsorship agreement — checked Sep. 30, 2026',
    price_text='$750 Supporting / $1,000 Sustaining / $2,500 Presenting / $3,500 Winter Village Sponsor',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Dec. 12, 2026 · 4:00 PM–7:00 PM',
      'venue_text','Abacoa Community Park · 1501 Frederick Small Rd, Jupiter, FL','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT 2026 BUSINESS SPONSORSHIP ROUTE ACTIVE · NONPROFIT VENDOR SPACES FILLED',
      'current_cost_text','$750 Supporting · $1,000 Sustaining · $2,500 Presenting · $3,500 Winter Village Sponsor',
      'current_cost_status','CURRENT OFFICIAL',
      'next_action','Use the Town’s 2026 sponsorship agreement if pursuing. Do not use the nonprofit vendor lane; those spaces are filled. Confirm remaining sponsor inventory and activation footprint before payment.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-115-SNOW-PLACE-JUPITER';

update public.shows_app_research_calendar_controls r
set source_refs=coalesce(r.source_refs,'[]'::jsonb) || jsonb_build_array(
      jsonb_build_object(
        'url',r.detail_data->>'official_source_url',
        'title',coalesce(nullif(r.detail_data->>'source_label',''),'Current official source'),
        'checked_at',r.detail_data->>'current_source_checked_at',
        'verification_scope','CURRENT_REVERIFIED'
      )
    ),
    updated_at=now()
where r.active and r.calendar_visibility and r.research_status='CURRENT_REVERIFIED'
  and nullif(r.detail_data->>'official_source_url','') is not null
  and nullif(r.detail_data->>'current_source_checked_at','') is not null
  and not exists (
    select 1 from jsonb_array_elements(coalesce(r.source_refs,'[]'::jsonb)) e
    where e->>'url'=r.detail_data->>'official_source_url'
      and e->>'checked_at'=r.detail_data->>'current_source_checked_at'
  );

create or replace function public.shows_app_research_source_ref_contains_checked(
  p_source_refs jsonb,p_official_url text,p_checked_at text
)
returns boolean
language sql
immutable
set search_path = pg_catalog
as $$
  select nullif(btrim(p_official_url),'') is not null
    and nullif(btrim(p_checked_at),'') is not null
    and exists (
      select 1 from jsonb_array_elements(coalesce(p_source_refs,'[]'::jsonb)) e
      where e->>'url'=p_official_url and e->>'checked_at'=p_checked_at
    );
$$;

alter table public.shows_app_research_calendar_controls
drop constraint if exists shows_app_research_calendar_controls_current_source_alignment_check;

alter table public.shows_app_research_calendar_controls
add constraint shows_app_research_calendar_controls_current_source_alignment_check
check (
  not (active and calendar_visibility and research_status='CURRENT_REVERIFIED')
  or public.shows_app_research_source_ref_contains_checked(
       source_refs,detail_data->>'official_source_url',detail_data->>'current_source_checked_at'
     )
);

do $$
declare missing_checked int; missing_ref int; exception_count int;
begin
  select count(*) into missing_checked
  from public.shows_app_research_calendar_controls
  where active and calendar_visibility and plan_year=2026
    and research_status='CURRENT_REVERIFIED'
    and nullif(detail_data->>'current_source_checked_at','') is null;
  if missing_checked<>0 then raise exception 'current rows missing checked_at: %',missing_checked; end if;

  select count(*) into missing_ref
  from public.shows_app_research_calendar_controls
  where active and calendar_visibility and plan_year=2026
    and research_status='CURRENT_REVERIFIED'
    and not public.shows_app_research_source_ref_contains_checked(
      source_refs,detail_data->>'official_source_url',detail_data->>'current_source_checked_at'
    );
  if missing_ref<>0 then raise exception 'current rows missing aligned source ref: %',missing_ref; end if;

  select count(*) into exception_count
  from public.shows_app_research_calendar_controls
  where active and calendar_visibility and plan_year=2026
    and research_status='RECOVERED_NOT_REVERIFIED';
  if exception_count<>1 then raise exception 'expected one bounded exception, got %',exception_count; end if;
end $$;
