
create temporary table _enrich_before on commit drop as
select count(*) filter (where active and calendar_visibility and plan_year=2026 and research_status='CURRENT_REVERIFIED') n
from public.shows_app_research_calendar_controls;

update public.shows_app_research_calendar_controls
set price_text='$200 Commercial/Retail · $300 Corporate Level 1 · $400 Corporate Level 2 + $10 application fee',
    source_basis='POTTC Events current Royal Palm Beach Rock-N Fall Fest 2026 page + live Jotform vendor application — checked Sep. 30, 2026',
    source_refs=case when exists (
      select 1 from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e
      where e->>'url'='https://pci.jotform.com/form/261183235018148' and e->>'checked_at'='2026-09-30'
    ) then source_refs else coalesce(source_refs,'[]'::jsonb)||jsonb_build_array(
      jsonb_build_object('url','https://pci.jotform.com/form/261183235018148','title','RPB Rock-N-Fall Fest 2026 Vendor Application','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED')
    ) end,
    detail_data=detail_data || jsonb_build_object(
      'action_url','https://pci.jotform.com/form/261183235018148',
      'booking_status','CURRENT 2026 VENDOR APPLICATION ACTIVE',
      'current_cost_text','$10 non-refundable application fee · $200 Commercial/Retail · $300 Corporate Level 1 · $400 Corporate Level 2 · $50 corner upgrade',
      'current_cost_status','CURRENT OFFICIAL',
      'booth_placement_text','Standard booth option is 10×10. Power is not available for purchase; quiet inverter generators may be used.',
      'commitment_terms_text','Application fee is non-refundable; submission does not guarantee acceptance. Approved category payment follows acceptance.',
      'next_action','Submit the $10 application and select the appropriate Commercial/Retail or Corporate category only after confirming Paradise is accepted and space remains.'
    ),
    audit_checked_at=now(),updated_at=now()
where control_id='R2026-029-RPB-ROCK-N-FALL';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',
    price_text='$1,000–$150,000 current sponsorship tiers',
    source_basis='The Ben current 2026–2027 Winter Wonderland Ice Rink partnership page — checked Sep. 30, 2026',
    source_refs=case when exists (
      select 1 from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e
      where e->>'url'='https://www.thebenwestpalm.com/partner-with-the-bens-winter-wonderland-ice-rink/'
        and e->>'checked_at'='2026-09-30'
    ) then source_refs else coalesce(source_refs,'[]'::jsonb)||jsonb_build_array(
      jsonb_build_object('url','https://www.thebenwestpalm.com/partner-with-the-bens-winter-wonderland-ice-rink/','title','The Ben — 2026–2027 Winter Wonderland Sponsorship Opportunities','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED')
    ) end,
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED',
      'schedule_text','Nov. 1, 2026–Jan. 3, 2027 · open daily 10:00 AM–9:00 PM',
      'venue_text','The Ben / downtown West Palm Beach waterfront · 251 N Narcissus Ave, West Palm Beach, FL 33401',
      'venue_status','CURRENT OFFICIAL','booking_status','CURRENT 2026–2027 SPONSORSHIP PROGRAM ACTIVE',
      'current_cost_text','$1,000 Friends · $5,000 Supporting · $10,000 Community · $15,000 Bronze · $25,000 Silver · $50,000 Gold · $100,000 Presenting · $150,000 Title; selected signature-event tiers $20,000–$25,000',
      'current_cost_status','CURRENT OFFICIAL',
      'attendance_text','Organizer states the 2025 season welcomed 30,000+ skaters plus tens of thousands of spectators and estimates 20,000 additional pedestrian/vehicle impressions per day.',
      'eligibility_text','Current sponsorship program includes onsite activations, product sampling, branded experiences, signage, hospitality and custom partnerships.',
      'next_action','Only pursue if a seasonal brand-visibility budget is justified. Contact Michael Dutton / inquiries@thebenwestpalm.com for remaining 2026–27 inventory and category rights; $1,000 Friends is signage/web recognition, while meaningful onsite activation requires higher/custom tiers.'
    ),
    audit_checked_at=now(),updated_at=now()
where control_id='R2026-050-BEN-WINTER';

update public.shows_app_research_calendar_controls
set source_basis='Fort Lauderdale International Boat Show current 2026 official show overview, exhibitor resource guide and exhibitor-sales contact — checked Sep. 30, 2026',
    source_refs=case when exists (
      select 1 from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e
      where e->>'url'='https://www.flibs.com/attend/show-overview/' and e->>'checked_at'='2026-09-30'
    ) then source_refs else coalesce(source_refs,'[]'::jsonb)||jsonb_build_array(
      jsonb_build_object('url','https://www.flibs.com/attend/show-overview/','title','FLIBS 2026 Show Overview','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED'),
      jsonb_build_object('url','https://www.flibs.com/exhibit/exhibitor-resource-guide/','title','FLIBS 2026 Exhibitor Resource Guide','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED')
    ) end,
    detail_data=detail_data || jsonb_build_object(
      'schedule_text','Oct. 28–Nov. 1, 2026 · Wed 12–7 · Thu–Sat 10–7 · Sun 10–5',
      'attendance_text','Official show overview states 100,000+ visitors, with 49% from outside Florida.',
      'venue_text','Six Fort Lauderdale waterfront locations including Bahia Mar, Broward County Convention Center, Las Olas Marina, Hall of Fame Marina, Pier Sixty-Six and Superyacht Village',
      'venue_status','CURRENT OFFICIAL'
    ),
    audit_checked_at=now(),updated_at=now()
where control_id='R2026-038-FLIBS';

do $$
declare before_n int; after_n int;
begin
  select n into before_n from _enrich_before;
  select count(*) filter (where active and calendar_visibility and plan_year=2026 and research_status='CURRENT_REVERIFIED') into after_n
  from public.shows_app_research_calendar_controls;
  if after_n-before_n<>1 then raise exception 'expected exactly Ben to add one current row; before %, after %',before_n,after_n; end if;

  if (select price_text from public.shows_app_research_calendar_controls where control_id='R2026-029-RPB-ROCK-N-FALL')
     <> '$200 Commercial/Retail · $300 Corporate Level 1 · $400 Corporate Level 2 + $10 application fee' then
    raise exception 'RPB exact pricing enrichment failed';
  end if;
  if (select research_status from public.shows_app_research_calendar_controls where control_id='R2026-050-BEN-WINTER')<>'CURRENT_REVERIFIED' then
    raise exception 'Ben not reverified';
  end if;
end $$;
