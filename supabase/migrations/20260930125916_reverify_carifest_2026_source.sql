-- Reverify Carifest / Treasure Coast Caribbean Food & Music Festival against current first-party event evidence.
-- Current event/date/time/venue/vendor presence are verified; current Paradise-compatible commercial vendor terms remain to confirm.

update public.shows_app_research_calendar_controls
set
  research_status='CURRENT_REVERIFIED',
  notes='Current MIDFLORIDA Event Center source verifies the Nov. 7, 2026 Treasure Coast Caribbean Food & Music Festival, exact time/venue and vendor presence. A current 2026 Paradise-compatible commercial/home-service application, price and deadline are not publicly verified; confirm directly with CACG before commitment.',
  source_basis='MIDFLORIDA Event Center official 2026 event page plus Caribbean American Cultural Group current contact — checked Sep. 30, 2026',
  source_refs=jsonb_build_array(
    jsonb_build_object('title','chatgpt_chunk_0171.md','drive_file_id','1FugMZQBYfn3W5I-68ntz41LOhah5exFr'),
    jsonb_build_object('url','https://www.midfloridaeventcenter.com/Events/Caribbean-Food-Music-Festival','title','MIDFLORIDA Event Center — Caribbean Food & Music Festival 2026','checked_at','2026-09-30'),
    jsonb_build_object('url','https://www.cacgpsl.org/members','title','Caribbean American Cultural Group — current organizer contact','checked_at','2026-09-30')
  ),
  detail_data=jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(
                  jsonb_set(
                    jsonb_set(
                      detail_data,
                      '{official_source_url}',to_jsonb('https://www.midfloridaeventcenter.com/Events/Caribbean-Food-Music-Festival'::text),true
                    ),
                    '{source_label}',to_jsonb('MIDFLORIDA Event Center — Caribbean Food & Music Festival 2026'::text),true
                  ),
                  '{schedule_text}',to_jsonb('Nov. 7, 2026 · 2:00–10:00 PM'::text),true
                ),
                '{schedule_status}',to_jsonb('CURRENT VERIFIED'::text),true
              ),
              '{venue_text}',to_jsonb('MIDFLORIDA Credit Union Event Center · 9221 S.E. Event Center Place, Port St. Lucie, FL 34952'::text),true
            ),
            '{venue_status}',to_jsonb('CURRENT OFFICIAL'::text),true
          ),
          '{booking_status}',to_jsonb('2026 EVENT / VENDORS VERIFIED · CURRENT COMMERCIAL APPLICATION TERMS TO CONFIRM'::text),true
        ),
        '{eligibility_text}',to_jsonb('Official 2026 event page confirms vendors; current Paradise-compatible commercial/home-service eligibility must be confirmed with CACG before commitment.'::text),true
      ),
      '{next_action}',to_jsonb('Email or call CACG and confirm a home-improvement/service-business vendor route, current 2026 price, remaining inventory, application deadline, booth footprint and commitment terms before booking.'::text),true
    ),
    '{current_source_checked_at}',to_jsonb('2026-09-30'::text),true
  ),
  audit_checked_at=now(),
  updated_at=now()
where control_id='R2026-054-CARIFEST';

update public.shows_app_research_calendar_controls
set detail_data=jsonb_set(
  detail_data,
  '{research_summary}',
  to_jsonb('Current MIDFLORIDA Event Center source verifies the Nov. 7, 2026 Treasure Coast Caribbean Food & Music Festival at the MIDFLORIDA Credit Union Event Center from 2:00–10:00 PM and confirms vendors are part of the event. CACG remains the organizer/contact. Current Paradise-compatible commercial-service application terms, price and deadline are not publicly verified and must be confirmed directly before commitment.'::text),
  true
)
where control_id='R2026-054-CARIFEST';

do $$
declare
  missing_count integer;
  missing_ids text[];
begin
  if not exists (
    select 1 from public.shows_app_research_calendar_controls
    where control_id='R2026-054-CARIFEST'
      and research_status='CURRENT_REVERIFIED'
      and detail_data->>'official_source_url'='https://www.midfloridaeventcenter.com/Events/Caribbean-Food-Music-Festival'
      and detail_data->>'schedule_status'='CURRENT VERIFIED'
      and detail_data->>'venue_status'='CURRENT OFFICIAL'
      and detail_data->>'booking_status' not like '%APPLICATION LIVE%'
  ) then raise exception 'Carifest current-source repair failed'; end if;

  select count(*),array_agg(control_id order by control_id)
  into missing_count,missing_ids
  from public.shows_app_research_calendar_controls
  where active and calendar_visibility and plan_year=2026
    and nullif(trim(detail_data->>'official_source_url'),'') is null;

  if missing_count<>1 then raise exception 'Expected 1 remaining canonical official-source gap; found %',missing_count; end if;
  if missing_ids<>array['R2026-098-MELBOURNE-HOLIDAY-ART']::text[] then
    raise exception 'Unexpected remaining official-source gap: %',missing_ids;
  end if;
end $$;
