-- Correct contact-quality defect found after the 2026 recovered-research contact enrichment.
-- Source: Greater Palm Bay Senior Activity Center April 2026 newsletter.
-- The prior migration used vendor@gpbsc.net; the published Vendor Fairs address is vendorfair@gpbsc.net.

do $$
declare
  current_contact text;
begin
  select detail_data->>'contact_text' into current_contact
  from public.shows_app_research_calendar_controls
  where control_id='R2026-036-PALM-BAY-SENIOR';

  if current_contact is distinct from 'Chris Grier · vendor@gpbsc.net · 321-724-1338' then
    raise exception 'Unexpected pre-correction Palm Bay Senior contact: %', current_contact;
  end if;
end $$;

update public.shows_app_research_calendar_controls
set
  detail_data = jsonb_set(
    jsonb_set(
      detail_data,
      '{contact_status}',
      to_jsonb('CURRENT ORGANIZER CONTACT'::text),
      true
    ),
    '{contact_text}',
    to_jsonb('Christine Grier · vendorfair@gpbsc.net · 321-724-1338'::text),
    true
  ),
  source_refs = case
    when exists (
      select 1
      from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e
      where e->>'url'='https://gpbsac.org/wp-content/uploads/2026/03/GPBSAC-April-2026-newsletter-Final.pdf'
    ) then coalesce(source_refs,'[]'::jsonb)
    else coalesce(source_refs,'[]'::jsonb) || jsonb_build_array(
      jsonb_build_object(
        'url','https://gpbsac.org/wp-content/uploads/2026/03/GPBSAC-April-2026-newsletter-Final.pdf',
        'title','Greater Palm Bay Senior Activity Center — April 2026 newsletter',
        'checked_at','2026-09-30'
      )
    )
  end,
  updated_at=now()
where control_id='R2026-036-PALM-BAY-SENIOR';

do $$
declare
  corrected text;
  remaining_missing integer;
begin
  select detail_data->>'contact_text' into corrected
  from public.shows_app_research_calendar_controls
  where control_id='R2026-036-PALM-BAY-SENIOR';

  if corrected <> 'Christine Grier · vendorfair@gpbsc.net · 321-724-1338' then
    raise exception 'Palm Bay Senior contact correction failed: %', corrected;
  end if;

  select count(*) into remaining_missing
  from public.shows_app_research_calendar_controls
  where active=true and calendar_visibility=true and plan_year=2026
    and (
      upper(coalesce(detail_data->>'contact_status',''))='NOT VERIFIED'
      or lower(trim(coalesce(detail_data->>'contact_text','')))='not verified'
      or nullif(trim(coalesce(detail_data->>'contact_text','')),'') is null
    );

  if remaining_missing <> 0 then
    raise exception 'Contact completeness regressed; % visible rows unresolved', remaining_missing;
  end if;
end $$;
