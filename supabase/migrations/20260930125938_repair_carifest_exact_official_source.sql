-- Finalize Carifest exact-source semantics after the current-source re-verification.
-- The exact event/date/venue/vendor presence are current-verified; commercial application terms remain unverified.

update public.shows_app_research_calendar_controls
set
  date_confidence='CURRENT_VERIFIED',
  research_status='CURRENT_REVERIFIED',
  notes='Current MIDFLORIDA Event Center confirms the 7th Annual Treasure Coast Caribbean Food & Music Festival (CarifestPSL) on Nov. 7, 2026, 2:00–10:00 PM, at 9221 S.E. Event Center Place, with exhibits and vendors. CACG remains the organizer. No current 2026 commercial/home-service vendor application, price, or deadline has been independently verified.',
  source_basis='MIDFLORIDA Event Center exact 2026 event page plus current CACG organizer contact — checked Sep. 30, 2026',
  source_refs=jsonb_build_array(
    jsonb_build_object('title','chatgpt_chunk_0171.md','drive_file_id','1FugMZQBYfn3W5I-68ntz41LOhah5exFr'),
    jsonb_build_object('url','https://www.midfloridaeventcenter.com/Events/Caribbean-Food-Music-Festival','title','MIDFLORIDA Event Center — Caribbean Food & Music Festival 2026','checked_at','2026-09-30'),
    jsonb_build_object('url','https://www.cacgpsl.org/','title','Caribbean American Cultural Group — current organizer site','checked_at','2026-09-30')
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
                    detail_data,
                    '{official_source_url}',to_jsonb('https://www.midfloridaeventcenter.com/Events/Caribbean-Food-Music-Festival'::text),true
                  ),
                  '{source_label}',to_jsonb('MIDFLORIDA Event Center — exact 2026 Carifest event page'::text),true
                ),
                '{schedule_text}',to_jsonb('Nov. 7, 2026 · 2:00 PM–10:00 PM'::text),true
              ),
              '{schedule_status}',to_jsonb('CURRENT VERIFIED'::text),true
            ),
            '{venue_text}',to_jsonb('MIDFLORIDA Credit Union Event Center · 9221 S.E. Event Center Place, Port St. Lucie, FL 34952'::text),true
          ),
          '{venue_status}',to_jsonb('CURRENT OFFICIAL'::text),true
        ),
        '{booking_status}',to_jsonb('EVENT / VENDOR PRESENCE VERIFIED · CURRENT COMMERCIAL APPLICATION TO CONFIRM'::text),true
      ),
      '{eligibility_text}',to_jsonb('Event explicitly includes exhibits and vendors. Historical same-organizer evidence includes business/community services; confirm current 2026 home-improvement/service-business eligibility before commitment.'::text),true
    ),
    '{next_action}',to_jsonb('Contact CACG and confirm current 2026 home-improvement/service-business eligibility, vendor or sponsor route, price, remaining inventory, application deadline, booth footprint and commitment terms before booking.'::text),true
  ),
  audit_checked_at=now(),
  updated_at=now()
where control_id='R2026-054-CARIFEST';

do $$
declare
  missing_count integer;
  missing_ids text[];
begin
  if not exists (
    select 1
    from public.shows_app_research_calendar_controls
    where control_id='R2026-054-CARIFEST'
      and date_confidence='CURRENT_VERIFIED'
      and research_status='CURRENT_REVERIFIED'
      and detail_data->>'official_source_url'='https://www.midfloridaeventcenter.com/Events/Caribbean-Food-Music-Festival'
      and detail_data->>'booking_status' not like '%APPLICATION LIVE%'
  ) then
    raise exception 'Carifest exact-source repair failed';
  end if;

  select count(*),array_agg(control_id order by control_id)
  into missing_count,missing_ids
  from public.shows_app_research_calendar_controls
  where active and calendar_visibility and plan_year=2026
    and nullif(trim(detail_data->>'official_source_url'),'') is null;

  if missing_count<>1 then raise exception 'Expected one remaining official-source gap; found %',missing_count; end if;
  if missing_ids<>array['R2026-098-MELBOURNE-HOLIDAY-ART']::text[] then
    raise exception 'Unexpected remaining official-source gap: %',missing_ids;
  end if;
end $$;
