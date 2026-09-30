-- Normalize current official source URLs already present in vetted source_refs.
-- Open details renders its primary "Open official source" button from detail_data.official_source_url.
-- Leave Carifest and Melbourne Holiday Art intentionally unresolved because their current URLs only establish organizer/contact, not the exact event opportunity.

with fixes(control_id,official_url,source_label) as (
  values
    ('R2026-036-PALM-BAY-SENIOR','https://gpbsac.org/wp-content/uploads/2026/03/GPBSAC-April-2026-newsletter-Final.pdf','Greater Palm Bay Senior Activity Center — published 2026 material'),
    ('R2026-041-PSL-FALL-FUN','https://www.cityofpsl.com/Events/Special-Events/Fall-Fun-Fest','Port St. Lucie Fall Fun Fest — official City event'),
    ('R2026-047-COCOA-FALL','https://www.choosecocoa.org/Calendar.aspx?EID=6347&calType=0&day=6&month=9&year=2026','Cocoa Fall Festival — official City calendar'),
    ('R2026-048-VERO-HALLOWEEN','https://www.covb.org/DocumentCenter/View/9057/2026-COVB-Recreation-Program-Guide-PDF','Vero Beach 2026 Recreation Program Guide'),
    ('R2026-050-BEN-WINTER','https://www.thebenwestpalm.com/partner-with-the-bens-winter-wonderland-ice-rink/','The Ben Winter Wonderland — official partnership page'),
    ('R2026-058-MIAMI-FOOD-WINE','https://miamidadefoodwine.com/contact','Miami-Dade Food Wine Beer Culture Festival — official contact page'),
    ('R2026-060-TEQUILA-FEST','https://www.eventeny.com/events/vendor/?id=43890','The Tequila Fest — current vendor application'),
    ('R2026-064-PSL-RIVER-NIGHTS-NOV','https://www.cityofpsl.com/Events/Special-Events/River-Nights','Port St. Lucie River Nights — official City event'),
    ('R2026-067-FESTIVAL-GIVING','https://www.childrensmuseumtc.org/festival-of-giving-2026','Festival of Giving 2026 — official page'),
    ('R2026-082-RUM-FUZION','https://rumfuzion.com/','Rum Fuzion — official site'),
    ('R2026-083-WORLD-AIDS','https://www.eventeny.com/events/sponsor/application/?a=xmrxlqlf-25291','World AIDS Day Concert 2026 — sponsor application'),
    ('R2026-102-PSL-RIVER-NIGHTS-DEC','https://www.cityofpsl.com/Events/Special-Events/River-Nights','Port St. Lucie River Nights — official City event')
)
update public.shows_app_research_calendar_controls r
set detail_data=jsonb_set(
      jsonb_set(
        jsonb_set(r.detail_data,'{official_source_url}',to_jsonb(f.official_url),true),
        '{source_label}',to_jsonb(f.source_label),true
      ),
      '{current_source_checked_at}',to_jsonb('2026-09-30'::text),true
    ),
    updated_at=now()
from fixes f
where r.control_id=f.control_id
  and r.active
  and r.calendar_visibility
  and r.plan_year=2026
  and nullif(trim(r.detail_data->>'official_source_url'),'') is null;

update public.shows_app_research_calendar_controls
set detail_data=jsonb_set(
  jsonb_set(detail_data,'{action_url}',to_jsonb('https://www.thebenwestpalm.com/partner-with-the-bens-winter-wonderland-ice-rink/'::text),true),
  '{action_label}',to_jsonb('Open partnership page'::text),true
)
where control_id='R2026-050-BEN-WINTER';

update public.shows_app_research_calendar_controls
set detail_data=jsonb_set(
  jsonb_set(detail_data,'{action_url}',to_jsonb('https://www.eventeny.com/events/vendor/?id=43890'::text),true),
  '{action_label}',to_jsonb('Open vendor application'::text),true
)
where control_id='R2026-060-TEQUILA-FEST';

update public.shows_app_research_calendar_controls
set detail_data=jsonb_set(
  jsonb_set(detail_data,'{action_url}',to_jsonb('https://www.eventeny.com/events/sponsor/application/?a=xmrxlqlf-25291'::text),true),
  '{action_label}',to_jsonb('Open sponsor application'::text),true
)
where control_id='R2026-083-WORLD-AIDS';

do $$
declare
  missing_count integer;
  missing_ids text[];
  bad_provenance integer;
begin
  select count(*),array_agg(control_id order by control_id)
  into missing_count,missing_ids
  from public.shows_app_research_calendar_controls
  where active and calendar_visibility and plan_year=2026
    and nullif(trim(detail_data->>'official_source_url'),'') is null;

  if missing_count<>2 then raise exception 'Expected 2 visible rows without canonical official source; found %',missing_count; end if;
  if missing_ids<>array['R2026-054-CARIFEST','R2026-098-MELBOURNE-HOLIDAY-ART']::text[] then
    raise exception 'Unexpected remaining official-source gaps: %',missing_ids;
  end if;

  select count(*) into bad_provenance
  from public.shows_app_research_calendar_controls r
  where r.control_id in (
    'R2026-036-PALM-BAY-SENIOR','R2026-041-PSL-FALL-FUN','R2026-047-COCOA-FALL','R2026-048-VERO-HALLOWEEN',
    'R2026-050-BEN-WINTER','R2026-058-MIAMI-FOOD-WINE','R2026-060-TEQUILA-FEST','R2026-064-PSL-RIVER-NIGHTS-NOV',
    'R2026-067-FESTIVAL-GIVING','R2026-082-RUM-FUZION','R2026-083-WORLD-AIDS','R2026-102-PSL-RIVER-NIGHTS-DEC'
  )
  and not exists (
    select 1 from jsonb_array_elements(coalesce(r.source_refs,'[]'::jsonb)) e
    where e->>'url'=r.detail_data->>'official_source_url'
  );
  if bad_provenance<>0 then raise exception 'Canonical official source not backed by source_refs for % rows',bad_provenance; end if;
end $$;
