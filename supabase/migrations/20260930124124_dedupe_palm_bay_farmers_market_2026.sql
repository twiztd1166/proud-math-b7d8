-- Collapse duplicate Palm Bay Farmers Market aliases while preserving audit lineage.
-- The organizer publishes one recurring Palm Bay Farmers Market series with themed monthly occurrences:
-- Oct. 10: Pumpkins & Palms; Nov. 14: Homegrown Harvest; Dec. 12: Palm Bay Holiday Market.
-- Generic Oct/Dec aliases remain stored but are removed from calendar/API visibility.
-- October has conflicting Eventeny deadline surfaces, so the earlier Oct. 1 date remains the safe structured cutoff.

update public.shows_app_research_calendar_controls
set
  calendar_visibility=false,
  research_status='SUPERSEDED',
  notes='Superseded duplicate occurrence. The Oct. 10, 2026 Palm Bay Farmers Market occurrence is canonically represented by R2026-013-PUMPKINS-PALMS (Palm Bay Farmers Market - Pumpkins & Palms). Preserved for audit lineage only.',
  detail_data=jsonb_set(detail_data,'{manager_data_note}',to_jsonb('Superseded duplicate alias. Canonical visible occurrence: R2026-013-PUMPKINS-PALMS.'::text),true),
  updated_at=now()
where control_id='R2026-012-PALM-BAY-FARMERS-OCT';

update public.shows_app_research_calendar_controls
set
  event_label='Palm Bay Farmers Market - Pumpkins & Palms',
  series_key='PALM-BAY-FARMERS-MARKET',
  deadline_date=date '2026-10-01',
  price_text='$60–$1,000 sponsor/vendor options',
  research_status='CURRENT_REVERIFIED',
  source_basis='Eventeny official event page and direct Sponsor Vendor application — checked Sep. 30, 2026',
  detail_data=jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(
                  detail_data,
                  '{official_source_url}',to_jsonb('https://www.eventeny.com/events/pumpkins-palms-market-32182/'::text),true
                ),
                '{action_url}',to_jsonb('https://www.eventeny.com/events/vendor/?id=52095'::text),true
              ),
              '{action_label}',to_jsonb('Open Sponsor Vendor application'::text),true
            ),
            '{source_label}',to_jsonb('Eventeny — Palm Bay Farmers Market - Pumpkins & Palms'::text),true
          ),
          '{deadline_text}',to_jsonb('Deadline conflict: official event overview lists Oct. 1, 2026; direct Sponsor Vendor application currently displays Oct. 10, 2026 at 12:00 AM ET. Treat Oct. 1 as the safe cutoff and verify the live application before submission.'::text),true
        ),
        '{booking_status}',to_jsonb('SPONSOR VENDOR APPLICATION ACTIVE · DEADLINE CONFLICT — USE OCT. 1 SAFE CUTOFF'::text),true
      ),
      '{next_action}',to_jsonb('Open the Sponsor Vendor application now and submit by the Oct. 1 safe cutoff if space remains; verify the live deadline, category exclusivity and selected sponsor tier before payment.'::text),true
    ),
    '{current_source_checked_at}',to_jsonb('2026-09-30'::text),true
  ),
  audit_checked_at=now(),
  updated_at=now()
where control_id='R2026-013-PUMPKINS-PALMS';

update public.shows_app_research_calendar_controls
set
  event_label='Palm Bay Farmers Market - Homegrown Harvest',
  series_key='PALM-BAY-FARMERS-MARKET',
  deadline_date=date '2026-11-05',
  price_text='$60–$1,000 sponsor/vendor options',
  research_status='CURRENT_REVERIFIED',
  source_basis='Eventeny official Palm Bay Farmers Market - Homegrown Harvest event and Sponsor Vendor application — checked Sep. 30, 2026',
  source_refs=jsonb_build_array(
    jsonb_build_object('title','chatgpt_chunk_0171.md','drive_file_id','1FugMZQBYfn3W5I-68ntz41LOhah5exFr'),
    jsonb_build_object('url','https://www.eventeny.com/events/homegrown-harvest-market-32796/','title','Palm Bay Farmers Market - Homegrown Harvest — official Eventeny event','checked_at','2026-09-30'),
    jsonb_build_object('url','https://www.eventeny.com/events/vendor/?id=53272','title','Homegrown Harvest — Sponsor Vendor application','checked_at','2026-09-30')
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
                      '{official_source_url}',to_jsonb('https://www.eventeny.com/events/homegrown-harvest-market-32796/'::text),true
                    ),
                    '{action_url}',to_jsonb('https://www.eventeny.com/events/vendor/?id=53272'::text),true
                  ),
                  '{action_label}',to_jsonb('Open Sponsor Vendor application'::text),true
                ),
                '{source_label}',to_jsonb('Eventeny — Palm Bay Farmers Market - Homegrown Harvest'::text),true
              ),
              '{deadline_text}',to_jsonb('Sponsor Vendor application deadline Nov. 5, 2026 at 12:00 AM ET'::text),true
            ),
            '{booking_status}',to_jsonb('SPONSOR VENDOR APPLICATION ACTIVE'::text),true
          ),
          '{current_cost_text}',to_jsonb('$60 booth · $25 exclusivity add-on · $250 Bronze · $500 Silver · $1,000 Gold'::text),true
        ),
        '{current_cost_status}',to_jsonb('CURRENT OFFICIAL'::text),true
      ),
      '{next_action}',to_jsonb('Submit the Sponsor Vendor application by Nov. 5; confirm category exclusivity, selected tier, placement and remaining inventory before payment.'::text),true
    ),
    '{current_source_checked_at}',to_jsonb('2026-09-30'::text),true
  ),
  audit_checked_at=now(),
  updated_at=now()
where control_id='R2026-073-PALM-BAY-FARMERS-NOV';

update public.shows_app_research_calendar_controls
set
  series_key='PALM-BAY-FARMERS-MARKET',
  research_status='CURRENT_REVERIFIED',
  source_basis='Eventeny official Palm Bay Holiday Market event and Sponsor Vendor application — checked Sep. 30, 2026',
  source_refs=case
    when exists (
      select 1 from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e
      where e->>'url'='https://www.eventeny.com/events/vendor/?id=54950'
    ) then source_refs
    else coalesce(source_refs,'[]'::jsonb)||jsonb_build_array(
      jsonb_build_object('url','https://www.eventeny.com/events/vendor/?id=54950','title','Palm Bay Holiday Market — Sponsor Vendor application','checked_at','2026-09-30')
    )
  end,
  detail_data=jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          detail_data,
          '{action_url}',to_jsonb('https://www.eventeny.com/events/vendor/?id=54950'::text),true
        ),
        '{action_label}',to_jsonb('Open Sponsor Vendor application'::text),true
      ),
      '{next_action}',to_jsonb('Submit the Sponsor Vendor application by Dec. 3 if space remains; confirm category exclusivity, selected tier, placement and remaining inventory before payment.'::text),true
    ),
    '{current_source_checked_at}',to_jsonb('2026-09-30'::text),true
  ),
  audit_checked_at=now(),
  updated_at=now()
where control_id='R2026-107-PALM-BAY-HOLIDAY-MARKET';

update public.shows_app_research_calendar_controls
set
  calendar_visibility=false,
  research_status='SUPERSEDED',
  notes='Superseded duplicate occurrence. The Dec. 12, 2026 Palm Bay Farmers Market occurrence is canonically represented by R2026-107-PALM-BAY-HOLIDAY-MARKET (Palm Bay Holiday Market). Preserved for audit lineage only.',
  detail_data=jsonb_set(detail_data,'{manager_data_note}',to_jsonb('Superseded duplicate alias. Canonical visible occurrence: R2026-107-PALM-BAY-HOLIDAY-MARKET.'::text),true),
  updated_at=now()
where control_id='R2026-113-PALM-BAY-FARMERS-DEC';

do $$
declare
  visible_count integer;
  dup_count integer;
  structured_deadlines integer;
begin
  select count(*) into visible_count
  from public.shows_app_research_calendar_controls
  where active and calendar_visibility and plan_year=2026;
  if visible_count<>115 then raise exception 'Expected 115 visible 2026 research controls after dedupe; found %',visible_count; end if;

  select count(*) into dup_count
  from (
    select detail_data->>'official_source_url',event_start
    from public.shows_app_research_calendar_controls
    where active and calendar_visibility and plan_year=2026
      and nullif(detail_data->>'official_source_url','') is not null
    group by 1,2
    having count(*)>1
  ) x;
  if dup_count<>0 then raise exception 'Visible exact-source/date duplicates remain: %',dup_count; end if;

  select count(*) into structured_deadlines
  from public.shows_app_research_calendar_controls
  where active and calendar_visibility and plan_year=2026 and deadline_date is not null;
  if structured_deadlines<>15 then raise exception 'Expected 15 visible structured deadlines; found %',structured_deadlines; end if;

  if exists (
    select 1 from public.shows_app_research_calendar_controls
    where control_id in ('R2026-012-PALM-BAY-FARMERS-OCT','R2026-113-PALM-BAY-FARMERS-DEC')
      and calendar_visibility
  ) then raise exception 'Superseded Palm Bay duplicate still visible'; end if;

  if exists (
    select 1 from public.shows_app_research_calendar_controls
    where control_id='R2026-073-PALM-BAY-FARMERS-NOV'
      and (event_label<>'Palm Bay Farmers Market - Homegrown Harvest' or deadline_date<>date '2026-11-05')
  ) then raise exception 'November canonical Palm Bay occurrence not repaired'; end if;
end $$;
