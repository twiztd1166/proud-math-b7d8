-- Restore the distinction between confirmed event dates and calendar-only estimated sort dates.
-- Non-exact date confidence must never be presented as an exact event_start.
-- Both controls remain calendar-orderable via estimated_sort_date.

do $$
declare
  matched integer;
begin
  select count(*) into matched
  from public.shows_app_research_calendar_controls
  where control_id in ('R2026-088-HALLANDALE-HOLIDAY','R2026-101-MUSIC-MANSION')
    and event_start is not null
    and event_end is not null
    and estimated_sort_date is null
    and date_confidence in ('RECURRING_HIGH_CONFIDENCE','ESTIMATED');
  if matched <> 2 then
    raise exception 'Expected both non-exact controls in exact-date storage before repair; matched %', matched;
  end if;
end $$;

update public.shows_app_research_calendar_controls
set
  event_start = null,
  event_end = null,
  estimated_sort_date = date '2026-12-04',
  source_basis = 'City of Hallandale Beach official Special Events page — annual first-Friday-in-December rule verified Sep. 30, 2026; event-specific 2026 date not yet published',
  source_refs = case
    when exists (
      select 1 from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e
      where e->>'url'='https://www.hallandalebeachfl.gov/1190/Special-Events'
    ) then source_refs
    else coalesce(source_refs,'[]'::jsonb) || jsonb_build_array(jsonb_build_object(
      'url','https://www.hallandalebeachfl.gov/1190/Special-Events',
      'title','Hallandale Beach Special Events — annual Holiday in the Park timing',
      'checked_at','2026-09-30'
    ))
  end,
  detail_data = jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            detail_data,
            '{schedule_text}',
            to_jsonb('Date TBD · estimated Dec. 4, 2026 from the City''s first-Friday-in-December recurring rule; 2026 event-specific date not yet published'::text),
            true
          ),
          '{venue_status}',
          to_jsonb('CURRENT CITY PROGRAM / EVENT-SPECIFIC DATE NOT PUBLISHED'::text),
          true
        ),
        '{logistics_text}',
        to_jsonb('Annual first-Friday-in-December Holiday in the Park at Peter Bluesten Park; Dec. 4 is an ordering estimate pending the 2026 event-specific publication'::text),
        true
      ),
      '{logistics_status}',
      to_jsonb('CURRENT PROGRAM / ESTIMATED DATE'::text),
      true
    ),
    '{next_action}',
    to_jsonb('Use the City sponsor/vendor contact path to confirm the 2026 event-specific date, participation route, price, deadline, footprint and remaining inventory.'::text),
    true
  ),
  audit_checked_at = now(),
  updated_at = now()
where control_id='R2026-088-HALLANDALE-HOLIDAY';

update public.shows_app_research_calendar_controls
set
  event_start = null,
  event_end = null,
  estimated_sort_date = date '2026-12-06',
  source_basis = 'Martin County official Parks & Recreation pages — series runs December-May and first Sunday of each month; checked Sep. 30, 2026; event-specific Dec. 2026 date not yet published',
  source_refs = case
    when exists (
      select 1 from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e
      where e->>'url'='https://www.martin.fl.us/ParkVolunteers'
    ) then source_refs
    else coalesce(source_refs,'[]'::jsonb) || jsonb_build_array(jsonb_build_object(
      'url','https://www.martin.fl.us/ParkVolunteers',
      'title','Martin County Parks & Recreation — Music at the Mansion recurring first-Sunday schedule',
      'checked_at','2026-09-30'
    ))
  end,
  detail_data = jsonb_set(
    jsonb_set(
      detail_data,
      '{schedule_text}',
      to_jsonb('Date TBD · estimated Dec. 6, 2026 from Martin County''s first-Sunday recurring rule; Dec. 2026 event-specific date not yet published'::text),
      true
    ),
    '{next_action}',
    to_jsonb('Contact Martin County Parks & Recreation to confirm the Dec. 2026 Music at the Mansion occurrence/date, then confirm sponsorship inventory, deadline, remaining spaces and category rights.'::text),
    true
  ),
  audit_checked_at = now(),
  updated_at = now()
where control_id='R2026-101-MUSIC-MANSION';

do $$
declare
  total integer;
  exact_rows integer;
  estimated_rows integer;
  unsortable integer;
  semantic_bad integer;
begin
  select
    count(*),
    count(*) filter (where event_start is not null),
    count(*) filter (where event_start is null and estimated_sort_date is not null),
    count(*) filter (where event_start is null and estimated_sort_date is null),
    count(*) filter (
      where date_confidence in ('ESTIMATED','RECURRING_HIGH_CONFIDENCE')
        and not (event_start is null and estimated_sort_date is not null)
    )
  into total, exact_rows, estimated_rows, unsortable, semantic_bad
  from public.shows_app_research_calendar_controls
  where active and calendar_visibility and plan_year=2026;

  if total <> 117 then raise exception 'Expected 117 visible controls; found %', total; end if;
  if exact_rows <> 115 then raise exception 'Expected 115 exact-date controls; found %', exact_rows; end if;
  if estimated_rows <> 2 then raise exception 'Expected 2 estimated-date controls; found %', estimated_rows; end if;
  if unsortable <> 0 then raise exception 'Unsortable research controls: %', unsortable; end if;
  if semantic_bad <> 0 then raise exception 'Non-exact confidence stored as exact date: %', semantic_bad; end if;
end $$;
