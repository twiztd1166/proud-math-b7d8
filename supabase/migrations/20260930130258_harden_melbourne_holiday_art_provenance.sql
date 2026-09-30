-- Preserve the final Melbourne Holiday Art & Craft Fair provenance hardening.
-- Keep the Dec. 5 exact-event canonical source unresolved while replacing ambiguous organizer evidence
-- with explicit official-organizer/contact evidence and clearly labeled secondary event evidence.

update public.shows_app_research_calendar_controls
set
  notes='Exact Dec. 5, 2026 Holiday Art & Craft Fair remains recovered/third-party verified, not current-official event verified. Moose Lodge 1406 official site confirms the organizer, 157 Dayton Blvd venue address, and current lodge contact. The Oct. 24 Fall Art & Craft Fair Eventeny application is retained only as organizer/event-team contact evidence and must not be treated as the Holiday fair application.',
  source_basis='Recovered archive + Melbourne Moose Lodge 1406 official organizer/contact page + third-party Holiday fair listing; exact Dec. 5 official event/application page still not verified as of Sep. 30, 2026',
  source_refs=jsonb_build_array(
    jsonb_build_object('title','chatgpt_chunk_0171.md','drive_file_id','1FugMZQBYfn3W5I-68ntz41LOhah5exFr'),
    jsonb_build_object('url','https://melbournemoose.com/about/','title','Melbourne Moose Lodge 1406 — official organizer/contact/venue address','checked_at','2026-09-30'),
    jsonb_build_object('url','https://www.eventeny.com/events/vendor/?id=53128','title','Moose Lodge 1406 Oct. 24 Fall fair — organizer/event-team contact evidence only; NOT the Dec. 5 Holiday fair','checked_at','2026-09-30'),
    jsonb_build_object('url','https://www.usefestkit.com/events/loyal-order-of-moose/holiday-art-craft-fair','title','Holiday Art & Craft Fair Dec. 5, 2026 — third-party event listing; not accepted as canonical official source','checked_at','2026-09-30')
  ),
  detail_data=jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            detail_data,
            '{venue_text}',to_jsonb('Moose Lodge 1406 · 157 Dayton Blvd, Melbourne, FL 32904 · exact Dec. 5 event use not current-official verified'::text),true
          ),
          '{venue_status}',to_jsonb('CURRENT ORGANIZER VENUE / EVENT-SPECIFIC USE NOT VERIFIED'::text),true
        ),
        '{contact_text}',to_jsonb('Moose Lodge 1406 Events · mooselodge1406events@gmail.com · Lodge: Info@MelbourneMoose.com · 321-724-1480'::text),true
      ),
      '{contact_status}',to_jsonb('CURRENT ORGANIZER CONTACT VERIFIED / EVENT-TEAM EMAIL FROM RELATED 2026 FAIR'::text),true
    ),
    '{next_action}',to_jsonb('Contact Moose Lodge 1406 and confirm the Dec. 5 Holiday Art & Craft Fair is current, the exact vendor/sponsor application, home-improvement/service-business eligibility, price, deadline, booth footprint and availability before booking.'::text),true
  ),
  audit_checked_at=now(),
  updated_at=now()
where control_id='R2026-098-MELBOURNE-HOLIDAY-ART';

do $$
declare
  missing_count integer;
  missing_ids text[];
begin
  if not exists (
    select 1 from public.shows_app_research_calendar_controls
    where control_id='R2026-098-MELBOURNE-HOLIDAY-ART'
      and nullif(trim(detail_data->>'official_source_url'),'') is null
      and detail_data->>'contact_text' like '%Info@MelbourneMoose.com%'
      and detail_data->>'venue_status' like '%EVENT-SPECIFIC USE NOT VERIFIED%'
  ) then raise exception 'Melbourne Holiday provenance hardening failed'; end if;

  select count(*),array_agg(control_id order by control_id)
  into missing_count,missing_ids
  from public.shows_app_research_calendar_controls
  where active and calendar_visibility and plan_year=2026
    and nullif(trim(detail_data->>'official_source_url'),'') is null;

  if missing_count<>1 or missing_ids<>array['R2026-098-MELBOURNE-HOLIDAY-ART']::text[] then
    raise exception 'Canonical official-source gap contract changed unexpectedly: % / %',missing_count,missing_ids;
  end if;
end $$;
