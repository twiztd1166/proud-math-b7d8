
create temporary table _b6_before on commit drop as
select count(*) filter (where active and calendar_visibility and plan_year=2026 and research_status='CURRENT_REVERIFIED') n
from public.shows_app_research_calendar_controls;

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='City of Port St. Lucie current 2026–27 River Nights page — Nov. 12 occurrence and vendor/exhibitor/sponsor routes checked Sep. 30, 2026',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Nov. 12, 2026 · 5:30 PM–8:30 PM',
      'venue_text','The Event Lawn at The Port District · 2454 SE Westmoreland Blvd, Port St. Lucie, FL 34952','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT CRAFT-VENDOR/EXHIBITOR SIGNUP AND SPONSOR CONTACT ROUTES PUBLISHED',
      'current_cost_text','Not publicly posted','current_cost_status','NOT VERIFIED',
      'next_action','Use the current craft-vendor/exhibitor signup or contact Special Events at 772-344-4139 / specialevents@cityofpsl.com to confirm Paradise eligibility, fee, deadline, footprint and remaining Nov. 12 inventory.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-064-PSL-RIVER-NIGHTS-NOV';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',
    price_text='$100–$5,000 sponsorship; 10×10 exhibitor booth at $500+ sponsor levels subject to late availability',
    source_basis='Native Rhythms Festival current 2026 sponsor/vendor pages + 2026 Sponsor Agreement — checked Sep. 30, 2026',
    source_refs=case when exists (
      select 1 from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e
      where e->>'url'='https://nativerhythmsfestival.com/sponsors/' and e->>'checked_at'='2026-09-30'
    ) then source_refs else coalesce(source_refs,'[]'::jsonb)||jsonb_build_array(
      jsonb_build_object('url','https://nativerhythmsfestival.com/sponsors/','title','Native Rhythms Festival — 2026 Sponsors','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED'),
      jsonb_build_object('url','https://nativerhythmsfestival.com/vendors/','title','Native Rhythms Festival — 2026 Vendors','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED'),
      jsonb_build_object('url','https://nativerhythmsfestival.com/wp-content/uploads/2026/03/NRF-2026-Sponsor-Letter-Agreement.pdf','title','Native Rhythms Festival — 2026 Sponsor Agreement','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED')
    ) end,
    detail_data=detail_data||jsonb_build_object(
      'action_url','https://nativerhythmsfestival.com/sponsors/',
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Nov. 13–15, 2026',
      'venue_text','Wickham Park amphitheater area · Melbourne, FL','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT SPONSORSHIP PROGRAM ACTIVE · ONSITE SPONSOR-BOOTH RESERVATION DEADLINE PASSED / LATE INQUIRY',
      'deadline_text','Published 10×10 sponsor-exhibitor booth reservation cutoff for Gold and higher tiers was Sep. 15, 2026 — passed; late arrangements must be confirmed directly.',
      'current_cost_text','$100 Patron · $250 Silver · $500 Gold · $1,000 Platinum · $2,500 Diamond · $5,000 Keystone; Gold and higher include a 10×10 exhibitor booth if reserved/available',
      'current_cost_status','CURRENT OFFICIAL',
      'attendance_text','2026 sponsor letter estimates 10,000–15,000 visitors.',
      'eligibility_text','Current 2026 Sponsor Vendor roster includes Renewal by Andersen, establishing replacement-window/door category compatibility via the sponsor-vendor route.',
      'next_action','Contact Sponsor Coordinator Claire Ellis immediately to ask whether a late $500+ sponsor-exhibitor booth can still be accommodated. Do not use the artisan vendor application for Paradise.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-065-NATIVE-RHYTHMS';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='Stuart Air Show current 2026 exhibitor/vendor and sponsor pages + current Nov. 13–15 event corroboration — checked Sep. 30, 2026',
    source_refs=case when exists (
      select 1 from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e
      where e->>'url'='https://www.stuartairshow.com/partners' and e->>'checked_at'='2026-09-30'
    ) then source_refs else coalesce(source_refs,'[]'::jsonb)||jsonb_build_array(
      jsonb_build_object('url','https://www.stuartairshow.com/partners','title','Stuart Air Show — 2026 Sponsorship','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED'),
      jsonb_build_object('url','https://www.stuartairshow.com/vendors','title','Stuart Air Show — 2026 Exhibitors and Vendors','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED')
    ) end,
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Nov. 13–15, 2026',
      'venue_text','Witham Field · 1895 Flying Fortress Ln, Stuart, FL 34996','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT 2026 EXHIBITOR/VENDOR FORM AND SPONSORSHIP FORM ACTIVE · FOOD VENDORS NOT ACCEPTED',
      'current_cost_text','Not publicly posted','current_cost_status','NOT VERIFIED',
      'attendance_text','Current aviation event listings describe tens of thousands of attendees annually.',
      'next_action','Submit the current exhibitor/vendor form or email operations@stuartairshow.com and confirm home-improvement/service exhibitor acceptance, booth price, footprint, deadline, insurance and remaining space.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-066-STUART-AIR-SHOW';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='Children’s Museum of the Treasure Coast current 2026 Festival of Giving event + sponsorship opportunity pages — checked Sep. 30, 2026',
    source_refs=case when exists (
      select 1 from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e
      where e->>'url'='https://www.childrensmuseumtc.org/sponsoropportunities' and e->>'checked_at'='2026-09-30'
    ) then source_refs else coalesce(source_refs,'[]'::jsonb)||jsonb_build_array(
      jsonb_build_object('url','https://www.childrensmuseumtc.org/sponsoropportunities','title','Children’s Museum TC — 2026 Festival of Giving Sponsorship Opportunities','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED')
    ) end,
    detail_data=detail_data||jsonb_build_object(
      'action_url','https://www.childrensmuseumtc.org/sponsoropportunities',
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Nov. 13–21, 2026 · daily public schedule varies',
      'booking_status','CURRENT 2026 BUSINESS/COMMUNITY SPONSOR PARTICIPATION AVAILABLE',
      'current_cost_text','Festival-specific sponsor price not verified','current_cost_status','NOT VERIFIED',
      'attendance_text','Museum states the 2025 Festival of Giving featured 50 nonprofit organizations and generated more than $34,000 in support.',
      'eligibility_text','Current 2026 page encourages local businesses/community partners to sponsor a nonprofit display for visibility and community impact.',
      'next_action','Contact Christina at festivalofgiving@childrensmuseumtc.org / 772-225-7575 ext. 205 for the 2026 Festival-specific business sponsorship package, display rights, pricing and remaining inventory.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-067-FESTIVAL-GIVING';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',
    deadline_date=date '2026-09-15',price_text='$250–$2,500 sponsorship tiers',
    source_basis='Current Freedom Isn’t Free Run 5K official RunSignup event + current sponsorship registration mirror — checked Sep. 30, 2026',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Nov. 14, 2026 · 7:30 AM',
      'venue_text','Clover Park · 31 Piazza Dr, Port St. Lucie, FL 34986','venue_status','CURRENT OFFICIAL',
      'booking_status','SPONSORSHIP REGISTRATION DEADLINE PASSED · LATE-INVENTORY INQUIRY ONLY',
      'deadline_text','All published sponsorship tiers show registration ending Sep. 15, 2026 at 11:59 AM EDT — passed.',
      'current_cost_text','$250 Freedom · $500 Ruck · $750 Red, White & Blue · $1,000 Patriot · $1,776 1776 · $2,500 American 250',
      'current_cost_status','CURRENT REGISTRATION TIERS',
      'next_action','Contact the race director and ask whether any sponsorship inventory can still be accepted after the Sep. 15 cutoff; do not assume the registration buttons remain bookable.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-068-FREEDOM-5K';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='POTTC Events current 2026 Holiday Shopping Fair at South Florida Fairgrounds event + vendor information/application page — checked Sep. 30, 2026',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Nov. 14–15, 2026 · 10:00 AM–4:00 PM both days',
      'venue_text','South Florida Fairgrounds West Expo Center · 9067 Southern Blvd, West Palm Beach, FL 33411','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT 2026 COMMERCIAL VENDOR APPLICATION ACTIVE · FOOD/BEVERAGE SPACE UNAVAILABLE',
      'current_cost_text','Not publicly verified','current_cost_status','NOT VERIFIED',
      'eligibility_text','Current event page explicitly includes commercial vendors, local shops and merchants.',
      'next_action','Open the 2026 Vendor Application and confirm Paradise’s commercial-service category, current booth fee, indoor/outdoor placement, deadline, insurance and remaining inventory before commitment.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-071-HOLIDAY-SHOPPING-WPB';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='Stabilize Revitalize Fort Pierce current Pick, Paddle & Play Beach Jam 2026 page with live vendor and sponsorship packets — checked Sep. 30, 2026',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Nov. 14, 2026',
      'venue_text','Causeway Cove Marina · 601 Seaway Dr Ste 1, Fort Pierce, FL 34949','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT VENDOR PACKET AND SPONSORSHIP PACKET PUBLISHED',
      'current_cost_text','Not verified from accessible current page','current_cost_status','NOT VERIFIED',
      'next_action','Open the current vendor/sponsorship packet and confirm Paradise category eligibility, booth/sponsor price, deadline, footprint, setup, insurance and remaining inventory.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-069-PICK-PADDLE-PLAY';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='RMHC South Florida current 2026 Paddles for a Purpose event/sponsorship page — checked Sep. 30, 2026',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Nov. 14, 2026 · 8:00 AM–4:00 PM',
      'venue_text','Fair Expo · 10901 Coral Way, Miami, FL 33165','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT CUSTOM SPONSORSHIP OPPORTUNITIES AVAILABLE',
      'current_cost_text','Custom sponsorship package — current public page does not publish fixed tiers','current_cost_status','CUSTOM QUOTE',
      'attendance_text','RMHC reports the 2025 event had 150+ players and 200+ spectators and raised $20,000+.',
      'next_action','Contact Hanna Kleinhans at events@rmhcsouthflorida.org / 786-558-0878 for a Paradise-specific physical activation package, price, footprint, audience rights and category availability.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-070-RMHC-PADDLES';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',
    price_text='$150–$400 vendor · $500–$10,000 sponsor',
    source_basis='Riverwalk Fort Lauderdale current 2026 International Food Festival event + sponsorship page — checked Sep. 30, 2026',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Nov. 14, 2026 · 12:00 PM–4:00 PM',
      'venue_text','Esplanade Park · Downtown Fort Lauderdale, FL','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT SPONSOR/VENDOR OPPORTUNITIES ACTIVE',
      'current_cost_text','$150–$400 vendor · $500–$10,000 sponsorship','current_cost_status','CURRENT OFFICIAL RANGE',
      'next_action','Email events@GoRiverwalk.com / 954-468-1541 ext. 205 for the Paradise-compatible non-food/commercial vendor tier and remaining inventory; use sponsorship only if added rights justify the spend.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-072-RIVERWALK-FOOD';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='Supercar Saturdays Florida current official 2026 site — Nov. 14 event and sponsor/vendor inquiry checked Sep. 30, 2026',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Nov. 14, 2026',
      'venue_text','Seminole Hard Rock Hotel & Casino · 1 Seminole Way, Hollywood, FL','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT SPONSOR/VENDOR INQUIRY ACTIVE',
      'current_cost_text','Not publicly posted','current_cost_status','NOT VERIFIED',
      'next_action','Email supercarsaturdaysflorida@gmail.com / call 305-725-3096 for current vendor/sponsor pricing, footprint, exclusivity, availability and lead-capture rights for Nov. 14.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-074-SUPERCAR-SAT-NOV';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='Exotics Cars Shows current official Exotics at The Colonnade Nov. 15, 2026 page — checked Sep. 30, 2026',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Nov. 15, 2026',
      'venue_text','The Colonnade at Sawgrass Mills · 1800 Sawgrass Mills Circle, Sunrise, FL','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT SPONSOR AND VENDOR OPPORTUNITIES AVAILABLE',
      'current_cost_text','Not publicly posted','current_cost_status','NOT VERIFIED',
      'next_action','Contact info@exoticscarsshows.com / Floyd Rag at 305-725-3096 for current sponsor/vendor price, physical footprint, category exclusivity and remaining Nov. 15 inventory.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-076-EXOTICS-COLONNADE';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',
    price_text='$395 standard · $350/event for 3+ · $450 perimeter · sponsors $495/$595/$895/$1,195',
    source_basis='Expo Media / Retirement Times current 2026 Pompano fact sheet + vendor-space application — checked Sep. 30, 2026',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Nov. 17, 2026 · 9:30 AM–1:00 PM',
      'venue_text','Pompano Beach Civic Center · 1801 NE 6th Street, Pompano Beach, FL','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT 2026 EXHIBITOR CONTRACT ACTIVE · CATEGORY AVAILABILITY TO CONFIRM',
      'current_cost_text','$395 standard 6-ft table + 2 chairs · $350/event for 3+ expos · $450 perimeter/electrical · Silver $495 · Gold $595 · Platinum $895 · Diamond $1,195',
      'current_cost_status','CURRENT OFFICIAL',
      'attendance_text','Current fact sheet anticipates 50 businesses/residences/organizations/medical-dental practices and notes the prior Broward expo sold out with 50 vendors.',
      'eligibility_text','Exhibitor profile includes lifestyle products and home healthcare; confirm aging-in-place/home-improvement category acceptance before contract.',
      'commitment_terms_text','Refund requests are credited toward future events or Senior Expo advertising; no cash or credit-card refunds.',
      'next_action','Call 754-246-2874 or email drew@retirement-times.com to confirm Paradise category availability for Nov. 17 and reserve the lowest suitable space.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-077-SENIOR-POMPANO';

update public.shows_app_research_calendar_controls r
set source_refs=coalesce(source_refs,'[]'::jsonb)||jsonb_build_array(
  jsonb_build_object('url',r.detail_data->>'official_source_url','title',coalesce(nullif(r.detail_data->>'source_label',''),'Current official source'),'checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED')
),updated_at=now()
where control_id in (
 'R2026-064-PSL-RIVER-NIGHTS-NOV','R2026-066-STUART-AIR-SHOW','R2026-067-FESTIVAL-GIVING',
 'R2026-068-FREEDOM-5K','R2026-071-HOLIDAY-SHOPPING-WPB','R2026-069-PICK-PADDLE-PLAY',
 'R2026-070-RMHC-PADDLES','R2026-072-RIVERWALK-FOOD','R2026-074-SUPERCAR-SAT-NOV',
 'R2026-076-EXOTICS-COLONNADE','R2026-077-SENIOR-POMPANO'
)
and not exists (
  select 1 from jsonb_array_elements(coalesce(r.source_refs,'[]'::jsonb)) e
  where e->>'url'=r.detail_data->>'official_source_url' and e->>'checked_at'='2026-09-30'
);

update public.shows_app_research_calendar_controls
set source_refs=case when exists (
  select 1 from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e
  where e->>'url'='https://retirement-times.com/wp-content/uploads/2026/01/FACT_SHEETS-2026SENIOREXPOS.pdf'
    and e->>'checked_at'='2026-09-30'
) then source_refs else coalesce(source_refs,'[]'::jsonb)||jsonb_build_array(
  jsonb_build_object('url','https://retirement-times.com/wp-content/uploads/2026/01/FACT_SHEETS-2026SENIOREXPOS.pdf','title','2026 Senior Expo Fact Sheets — Pompano','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED'),
  jsonb_build_object('url','https://retirement-times.com/wp-content/uploads/2026/01/SEContracts-2026-HealthFairs-FILLABLE.pdf','title','2026 Senior Lifestyle & Healthcare Expo Vendor Space Application','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED')
) end
where control_id='R2026-077-SENIOR-POMPANO';

do $$
declare before_n int; after_n int; bad int;
begin
  select n into before_n from _b6_before;
  select count(*) filter (where active and calendar_visibility and plan_year=2026 and research_status='CURRENT_REVERIFIED') into after_n
  from public.shows_app_research_calendar_controls;
  if after_n-before_n<>12 then raise exception 'expected 12 Nov. 12-17 rows; before %, after %',before_n,after_n; end if;

  select count(*) into bad
  from public.shows_app_research_calendar_controls
  where control_id in (
   'R2026-064-PSL-RIVER-NIGHTS-NOV','R2026-065-NATIVE-RHYTHMS','R2026-066-STUART-AIR-SHOW',
   'R2026-067-FESTIVAL-GIVING','R2026-068-FREEDOM-5K','R2026-071-HOLIDAY-SHOPPING-WPB',
   'R2026-069-PICK-PADDLE-PLAY','R2026-070-RMHC-PADDLES','R2026-072-RIVERWALK-FOOD',
   'R2026-074-SUPERCAR-SAT-NOV','R2026-076-EXOTICS-COLONNADE','R2026-077-SENIOR-POMPANO'
  )
  and (research_status<>'CURRENT_REVERIFIED' or detail_data->>'current_source_checked_at'<>'2026-09-30');
  if bad<>0 then raise exception 'batch6 verification failed for % rows',bad; end if;

  if (select deadline_date from public.shows_app_research_calendar_controls where control_id='R2026-068-FREEDOM-5K')<>date '2026-09-15' then
    raise exception 'Freedom sponsor cutoff missing';
  end if;
  if (select deadline_date from public.shows_app_research_calendar_controls where control_id='R2026-065-NATIVE-RHYTHMS') is not null then
    raise exception 'Native Rhythms booth-only cutoff should not be structured as a universal deadline';
  end if;
end $$;
