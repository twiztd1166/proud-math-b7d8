-- Promote verified application deadlines into structured deadline_date so manager follow-up
-- sorts by the real cutoff instead of by the later event date.
-- Also remove/clarify deadline prose that was stale or was not actually a deadline.

update public.shows_app_research_calendar_controls
set
  deadline_date=date '2026-10-10',
  detail_data=jsonb_set(
    jsonb_set(
      jsonb_set(detail_data,'{deadline_text}',to_jsonb('Sponsor Vendor application deadline Oct. 10, 2026 at 12:00 AM ET · submit by Oct. 9 to avoid the midnight cutoff'::text),true),
      '{next_action}',to_jsonb('Submit the Sponsor Vendor application by Oct. 9 to avoid the Oct. 10 midnight cutoff if space remains; confirm the best commercial tier and category exclusivity.'::text),true
    ),
    '{current_source_checked_at}',to_jsonb('2026-09-30'::text),true
  ),
  source_refs=case when exists (
    select 1 from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e where e->>'url'='https://www.eventeny.com/events/vendor/?id=52095'
  ) then source_refs else coalesce(source_refs,'[]'::jsonb)||jsonb_build_array(jsonb_build_object(
    'url','https://www.eventeny.com/events/vendor/?id=52095',
    'title','Pumpkins & Palms Market — Sponsor Vendor Application',
    'checked_at','2026-09-30'
  )) end,
  audit_checked_at=now(),updated_at=now()
where control_id='R2026-012-PALM-BAY-FARMERS-OCT';

update public.shows_app_research_calendar_controls
set
  deadline_date=date '2026-10-23',
  detail_data=jsonb_set(
    jsonb_set(
      jsonb_set(detail_data,'{deadline_text}',to_jsonb('Business/group Trunk-or-Treat registration due Oct. 23, 2026 at 5:00 PM'::text),true),
      '{next_action}',to_jsonb('Email vendorregistrations@palmbayfl.gov and submit the business Trunk-or-Treat registration by Oct. 23 at 5:00 PM, or confirm the sponsorship route, pricing and remaining space.'::text),true
    ),
    '{current_source_checked_at}',to_jsonb('2026-09-30'::text),true
  ),
  source_refs=case when exists (
    select 1 from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e where e->>'url' like 'https://www.palmbayfl.gov/Home/Components/Calendar/Event/20313/%'
  ) then source_refs else coalesce(source_refs,'[]'::jsonb)||jsonb_build_array(jsonb_build_object(
    'url','https://www.palmbayfl.gov/Home/Components/Calendar/Event/20313/1373',
    'title','City of Palm Bay — 2026 Fall Fest',
    'checked_at','2026-09-30'
  )) end,
  audit_checked_at=now(),updated_at=now()
where control_id='R2026-046-PALM-BAY-FALL-FEST';

update public.shows_app_research_calendar_controls
set
  deadline_date=date '2026-10-09',
  detail_data=jsonb_set(detail_data,'{current_source_checked_at}',to_jsonb('2026-09-30'::text),true),
  source_refs=case when exists (
    select 1 from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e where e->>'url'='https://jerkfestival.com/'
  ) then source_refs else coalesce(source_refs,'[]'::jsonb)||jsonb_build_array(jsonb_build_object(
    'url','https://jerkfestival.com/',
    'title','Grace Jamaican Jerk Festival — official 2026 vendor information',
    'checked_at','2026-09-30'
  )) end,
  audit_checked_at=now(),updated_at=now()
where control_id='R2026-061-GRACE-JERK';

update public.shows_app_research_calendar_controls
set
  deadline_date=date '2026-10-30',
  detail_data=jsonb_set(detail_data,'{current_source_checked_at}',to_jsonb('2026-09-30'::text),true),
  audit_checked_at=now(),updated_at=now()
where control_id='R2026-075-LIGHT-UP-DANIA';

update public.shows_app_research_calendar_controls
set
  deadline_date=date '2026-11-15',
  detail_data=jsonb_set(detail_data,'{current_source_checked_at}',to_jsonb('2026-09-30'::text),true),
  source_refs=case when exists (
    select 1 from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e where e->>'url'='https://form.jotform.com/241377280948163'
  ) then source_refs else coalesce(source_refs,'[]'::jsonb)||jsonb_build_array(jsonb_build_object(
    'url','https://form.jotform.com/241377280948163',
    'title','Rotary Club of Weston — 2026 Run for Tomorrow sponsorship application',
    'checked_at','2026-09-30'
  )) end,
  audit_checked_at=now(),updated_at=now()
where control_id='R2026-100-WESTON-RUN';

update public.shows_app_research_calendar_controls
set
  deadline_date=date '2026-12-03',
  detail_data=jsonb_set(detail_data,'{current_source_checked_at}',to_jsonb('2026-09-30'::text),true),
  source_refs=case when exists (
    select 1 from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e where e->>'url'='https://www.eventeny.com/events/palm-bay-holiday-market-33568/'
  ) then source_refs else coalesce(source_refs,'[]'::jsonb)||jsonb_build_array(jsonb_build_object(
    'url','https://www.eventeny.com/events/palm-bay-holiday-market-33568/',
    'title','Palm Bay Holiday Market — 2026 application deadlines',
    'checked_at','2026-09-30'
  )) end,
  audit_checked_at=now(),updated_at=now()
where control_id in ('R2026-107-PALM-BAY-HOLIDAY-MARKET','R2026-113-PALM-BAY-FARMERS-DEC');

update public.shows_app_research_calendar_controls
set
  detail_data=jsonb_set(
    jsonb_set(detail_data,'{deadline_text}',to_jsonb('Not verified'::text),true),
    '{current_source_checked_at}',to_jsonb('2026-09-30'::text),true
  ),
  source_refs=case when exists (
    select 1 from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e where e->>'url'='https://www.beerwinespiritsfest.com/west-palm-beach'
  ) then source_refs else coalesce(source_refs,'[]'::jsonb)||jsonb_build_array(jsonb_build_object(
    'url','https://www.beerwinespiritsfest.com/west-palm-beach',
    'title','West Palm Beach Beer Wine & Spirits Fest — official 2026 event page',
    'checked_at','2026-09-30'
  )) end,
  audit_checked_at=now(),updated_at=now()
where control_id='R2026-092-WPB-BEER-WINE';

update public.shows_app_research_calendar_controls
set
  detail_data=jsonb_set(
    detail_data,'{deadline_text}',to_jsonb('No application deadline verified · vendor applications available by request beginning Aug. 3, 2026 · space limited'::text),true
  ),
  updated_at=now()
where control_id='R2026-011-DEERFIELD-FALL';

do $$
declare
  bad integer;
begin
  select count(*) into bad
  from (values
    ('R2026-012-PALM-BAY-FARMERS-OCT',date '2026-10-10'),
    ('R2026-046-PALM-BAY-FALL-FEST',date '2026-10-23'),
    ('R2026-061-GRACE-JERK',date '2026-10-09'),
    ('R2026-075-LIGHT-UP-DANIA',date '2026-10-30'),
    ('R2026-100-WESTON-RUN',date '2026-11-15'),
    ('R2026-107-PALM-BAY-HOLIDAY-MARKET',date '2026-12-03'),
    ('R2026-113-PALM-BAY-FARMERS-DEC',date '2026-12-03')
  ) expected(control_id,deadline_date)
  left join public.shows_app_research_calendar_controls r using(control_id)
  where r.deadline_date is distinct from expected.deadline_date;
  if bad<>0 then raise exception 'Structured deadline repair failed for % controls',bad; end if;

  if exists (
    select 1 from public.shows_app_research_calendar_controls
    where control_id='R2026-092-WPB-BEER-WINE'
      and (deadline_date is not null or coalesce(detail_data->>'deadline_text','')<>'Not verified')
  ) then raise exception 'WPB Beer/Wine unsupported deadline remains'; end if;
end $$;
