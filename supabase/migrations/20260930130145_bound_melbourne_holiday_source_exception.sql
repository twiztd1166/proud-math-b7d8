-- Bound the sole remaining canonical-source exception instead of promoting secondary evidence to first-party.
-- Current secondary evidence verifies the Dec. 5 event/venue; same-organizer current application context supports home-service fit,
-- but no first-party Dec. 5 commercial/sponsor application, price, or deadline has been recovered.

update public.shows_app_research_calendar_controls
set
  notes='Current secondary event evidence verifies the Dec. 5, 2026 Holiday Art & Craft Fair at Moose Lodge 1406 / 157 Dayton Blvd in Melbourne. The same organizer’s current October Sponsor Vendor application explicitly accepts home service companies, but no first-party Dec. 5 commercial/sponsor application, price or deadline has been recovered. Keep as a bounded source exception and confirm directly before commitment.',
  source_basis='FestKit current secondary Dec. 5 event listing plus Moose Lodge 1406 current Eventeny Sponsor Vendor eligibility context — checked Sep. 30, 2026; first-party Dec. 5 application not recovered',
  source_refs=jsonb_build_array(
    jsonb_build_object('title','chatgpt_chunk_0171.md','drive_file_id','1FugMZQBYfn3W5I-68ntz41LOhah5exFr'),
    jsonb_build_object('url','https://www.usefestkit.com/events/loyal-order-of-moose/holiday-art-craft-fair','title','FestKit — Holiday Art & Craft Fair Dec. 5, 2026 (secondary listing)','checked_at','2026-09-30'),
    jsonb_build_object('url','https://www.eventeny.com/events/vendor/?id=53135','title','Moose Lodge 1406 — current Sponsor Vendor application for Oct. 24 fair (same-organizer eligibility context only)','checked_at','2026-09-30')
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
                    '{source_label}',to_jsonb('Secondary current event listing + Moose Lodge 1406 current organizer application context'::text),true
                  ),
                  '{schedule_text}',to_jsonb('Dec. 5, 2026 · exact time not first-party verified'::text),true
                ),
                '{schedule_status}',to_jsonb('CURRENT SECONDARY VERIFIED · FIRST-PARTY SOURCE PENDING'::text),true
              ),
              '{venue_text}',to_jsonb('Moose Lodge 1406 · 157 Dayton Blvd, Melbourne, FL 32904'::text),true
            ),
            '{venue_status}',to_jsonb('CURRENT SECONDARY SOURCE · FIRST-PARTY DEC. 5 SOURCE PENDING'::text),true
          ),
          '{booking_status}',to_jsonb('DEC. 5 EVENT SECONDARY-VERIFIED · FIRST-PARTY COMMERCIAL APPLICATION TO CONFIRM'::text),true
        ),
        '{eligibility_text}',to_jsonb('Same organizer’s current October Sponsor Vendor application explicitly accepts home service companies; do not assume those terms carry to Dec. 5 without first-party confirmation.'::text),true
      ),
      '{next_action}',to_jsonb('Email mooselodge1406events@gmail.com and request the Dec. 5 Holiday Art & Craft Fair sponsor/commercial application; confirm home-service eligibility, current price, deadline, booth footprint and availability before commitment.'::text),true
    ),
    '{current_source_checked_at}',to_jsonb('2026-09-30'::text),true
  ),
  audit_checked_at=now(),
  updated_at=now()
where control_id='R2026-098-MELBOURNE-HOLIDAY-ART';

update public.shows_app_research_calendar_controls
set detail_data=jsonb_set(
  detail_data,
  '{research_summary}',
  to_jsonb('Current secondary vendor evidence verifies the Holiday Art & Craft Fair on Dec. 5, 2026 at Moose Lodge 1406, 157 Dayton Blvd, Melbourne. The same organizer’s current October Sponsor Vendor application explicitly accepts home service companies, but a first-party Dec. 5 sponsor/commercial application, price and deadline were not recovered. Preserve this as the sole canonical-source exception and confirm directly before commitment.'::text),
  true
)
where control_id='R2026-098-MELBOURNE-HOLIDAY-ART';

do $$
declare
  missing_count integer;
  missing_ids text[];
begin
  if not exists (
    select 1 from public.shows_app_research_calendar_controls
    where control_id='R2026-098-MELBOURNE-HOLIDAY-ART'
      and research_status='RECOVERED_NOT_REVERIFIED'
      and nullif(trim(detail_data->>'official_source_url'),'') is null
      and detail_data->>'schedule_status' like 'CURRENT SECONDARY VERIFIED%'
      and detail_data->>'booking_status' like '%FIRST-PARTY COMMERCIAL APPLICATION TO CONFIRM%'
      and detail_data->>'current_source_checked_at'='2026-09-30'
  ) then raise exception 'Melbourne bounded source-exception repair failed'; end if;

  select count(*),array_agg(control_id order by control_id)
  into missing_count,missing_ids
  from public.shows_app_research_calendar_controls
  where active and calendar_visibility and plan_year=2026
    and nullif(trim(detail_data->>'official_source_url'),'') is null;

  if missing_count<>1 or missing_ids<>array['R2026-098-MELBOURNE-HOLIDAY-ART']::text[] then
    raise exception 'Canonical source exception set drifted: count %, ids %',missing_count,missing_ids;
  end if;
end $$;
