
create temporary table _b2_before on commit drop as
select count(*) filter (where active and calendar_visibility and plan_year=2026 and research_status='CURRENT_REVERIFIED') n
from public.shows_app_research_calendar_controls;

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',
    date_confidence='CURRENT_VERIFIED',
    deadline_date=null,
    source_basis='Palm Beach North Chamber current Jupiter HarbourFest event listing and live exhibitor registration route — checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED',
      'schedule_text','Oct. 16, 2026 · 4:00 PM–10:00 PM; Oct. 17, 2026 · 12:00 PM–10:00 PM',
      'venue_text','Harbourside Place · Jupiter, FL','venue_status','CURRENT OFFICIAL',
      'booking_status','BUSINESS EXHIBITOR REGISTRATION ROUTE LIVE · SPONSOR DEADLINE PASSED',
      'deadline_text','Sponsor deadline Sep. 15, 2026 — passed. Current page still shows Business Exhibitor registration; no separate exhibitor cutoff is published.',
      'current_cost_text','$850 Business Exhibitor · $450 Marketplace Vendor · $750 Food Truck','current_cost_status','CURRENT OFFICIAL',
      'next_action','Open the live EventHub registration route or email Brian Elkins and confirm that $850 Business Exhibitor inventory remains before payment; do not treat the Sep. 15 sponsor deadline as a published exhibitor cutoff.'
    ), audit_checked_at=now(),updated_at=now()
where control_id='R2026-018-JUPITER-HARBOURFEST';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='Buckler Shows current West Palm 2026 show page + official vendor-information application path — checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED',
      'schedule_text','Oct. 10, 2026 · 10:00 AM–5:00 PM; Oct. 11, 2026 · 10:00 AM–4:00 PM',
      'venue_text','South Florida Fairgrounds — West Expo · 9067 Southern Blvd, West Palm Beach, FL 33411','venue_status','CURRENT OFFICIAL',
      'booking_status','OFFICIAL VENDOR APPLICATION PATH CURRENT · COMMERCIAL/HOME-SERVICE ELIGIBILITY AND PRICE TO CONFIRM',
      'current_cost_text','Not verified in the current public vendor page','current_cost_status','NOT VERIFIED',
      'next_action','Call Buckler Shows at 386-860-0092 before applying and confirm home-service eligibility, current 10×10 price, remaining October inventory and terms.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-015-BUCKLER-WPB-OCT';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',
    source_basis='Downtown Melbourne current Fall for Downtown Melbourne 2026 event page and sponsor/vendor route — checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Oct. 10, 2026 · 11:00 AM–4:00 PM',
      'venue_text','Historic Downtown Melbourne · across from Holmes Park & Drew’s Brews, 2029 Melbourne Ct, Melbourne, FL','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT SPONSOR/VENDOR OPPORTUNITY ROUTE PUBLISHED · PRICE/DEADLINE TO CONFIRM',
      'current_cost_text','Not verified','current_cost_status','NOT VERIFIED',
      'next_action','Use the current Fall Fest sponsor/vendor route or email events@downtownmelbourne.com now to confirm Paradise eligibility, remaining space, price, deadline, footprint and insurance.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-010-FALL-DOWNTOWN-MELBOURNE';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',
    price_text='$150 Merchant/Informational if selected — applications closed; sponsorship separate',
    source_basis='City of Hollywood current 2026 Hispanic Heritage Festival vendor and sponsorship page — checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Oct. 10, 2026 · 2:00 PM–8:00 PM',
      'venue_text','ArtsPark at Young Circle · Hollywood, FL','venue_status','CURRENT OFFICIAL',
      'booking_status','MERCHANT/INFORMATIONAL APPLICATIONS CLOSED · SPONSORSHIP ROUTE CURRENT',
      'current_cost_text','$150 Merchant/Informational participation fee if selected — that vendor route is now closed; sponsorship pricing is separate',
      'current_cost_status','CURRENT OFFICIAL FOR CLOSED VENDOR ROUTE / SPONSOR PRICE TO CONFIRM',
      'next_action','Do not pursue the closed merchant/informational application. Contact Events@HollywoodFL.org / 954-921-3404 for remaining sponsorship inventory and Paradise-compatible activation rights.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-008-HOLLYWOOD-HISPANIC';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text='$100 vendor fee',
    source_basis='Town of Miami Lakes current Sabor Fest 2026 event page + vendor registration form — checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Oct. 10, 2026 · 4:00 PM–9:00 PM',
      'venue_text','Main Street · 6710 Main Street, Miami Lakes, FL 33014','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT VENDOR REGISTRATION FORM PUBLISHED · ACCEPTANCE/REMAINING SPACE TO CONFIRM',
      'current_cost_text','$100 vendor fee','current_cost_status','CURRENT OFFICIAL',
      'next_action','Submit or confirm the current $100 vendor registration immediately; obtain written acceptance for Paradise services and confirm assigned space/setup instructions before commitment.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-009-SABOR-FEST';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='City of Deerfield Beach current 2026 Fall Festival page — checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Oct. 10, 2026 · 4:00 PM–8:00 PM',
      'venue_text','Pioneer Park · 217 NE 5th Ave, Deerfield Beach, FL','venue_status','CURRENT OFFICIAL',
      'booking_status','SALES VENDOR APPLICATIONS CURRENT BY REQUEST · SPONSORSHIPS AVAILABLE · SPACE LIMITED',
      'deadline_text','No current application deadline published; sales-vendor applications available by request and space is limited.',
      'current_cost_text','Not verified','current_cost_status','NOT VERIFIED',
      'next_action','Email dfbspecialevents@dfb.city now to request the sales-vendor packet and confirm Paradise eligibility, fee, footprint, remaining space and sponsorship options.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-011-DEERFIELD-FALL';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text='$45 business booth',
    source_basis='SPCA of Brevard current Wag-O-Ween Festival 2026 page and booth sign-up route — checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Oct. 10, 2026 · 9:30 AM–12:00 PM',
      'venue_text','Wickham Park, Pavilions 1–3 · 2500 Parkway Dr, Melbourne, FL 32935','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT BUSINESS BOOTH SIGN-UP ACTIVE','current_cost_text','$45 business booth · single 10×10 space','current_cost_status','CURRENT OFFICIAL',
      'eligibility_text','Current page expressly offers business booths; one 10×10 space, no electricity/water/generators.',
      'next_action','Use the current booth sign-up form and confirm remaining business-booth inventory before paying $45; sponsorship inquiries go to livein321@kw.com.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-014-WAG-O-WEEN';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='Cars & Coffee Palm Beach current 2026 event schedule + official sponsor/vendor inquiry page — checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED',
      'schedule_text','Oct. 11, 2026 · 8:00 AM–12:00 PM · vendor check-in 6:00 AM sharp for non-food vendors',
      'venue_text','Boca Raton Innovation Campus (BRiC) · 4850 T-Rex Ave, Boca Raton, FL 33431','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT SPONSOR/VENDOR INQUIRY ACTIVE','current_cost_text','Not publicly posted — request current package','current_cost_status','NOT VERIFIED',
      'next_action','Submit the current sponsor/vendor inquiry and request October package pricing, footprint, exclusivity, inventory and lead-capture rights; email Support@carsandcoffeepb.com if no response within 48 hours.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-017-CARS-COFFEE-OCT';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',
    price_text='$150–$400 vendor · $500–$10,000 sponsor',
    source_basis='Riverwalk Fort Lauderdale current 10th Annual Fall Festival 2026 page — checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Oct. 17, 2026 · 12:00 PM–4:00 PM',
      'venue_text','Esplanade Park · Downtown Fort Lauderdale, FL','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT SPONSOR AND VENDOR OPPORTUNITIES ACTIVE','current_cost_text','$150–$400 vendor · $500–$10,000 sponsorship',
      'current_cost_status','CURRENT OFFICIAL RANGE','attendance_text','Organizer states more than 2,000 attendees each year.',
      'next_action','Email events@GoRiverwalk.com or call 954-468-1541 ext. 205 now for the Paradise-compatible vendor tier, remaining inventory, deadline and booth requirements.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-021-RIVERWALK-FALL';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',
    price_text='$125 vendor · $1,000/$2,000 activity sponsor · $5,000 featured sponsor',
    source_basis='Village of Wellington current 2026 Fall Festival event + sponsorship/vendor pages — checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Oct. 17, 2026 · 3:00 PM–10:00 PM',
      'venue_text','Village Park · 11700 Pierson Road, Wellington, FL 33414','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT VENDOR/SPONSOR REQUEST ROUTE ACTIVE',
      'current_cost_text','$125 vendor including 10×10 tent, table and chairs · $1,000/$2,000 Activity Sponsor · $5,000 Featured Sponsor',
      'current_cost_status','CURRENT OFFICIAL','attendance_text','Village sponsorship page states attendance of 10,000+.',
      'next_action','Submit the Sponsor-Vendor Request Form now and confirm remaining $125 vendor inventory. Compare sponsorship only if added branding/exclusivity justifies the higher spend.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-023-WELLINGTON-FALL';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',
    price_text='$500 Exhibitor Level 1 10×10 space',
    source_basis='Annual Brazilian Festival current 2026 South Florida exhibitor page + 2026 exhibitor application — checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Oct. 17, 2026',
      'booking_status','CURRENT 2026 EXHIBITOR APPLICATION PUBLISHED',
      'current_cost_text','$500 Exhibitor Level 1 10×10 space; corporations with more than 50 employees have organizer-determined pricing',
      'current_cost_status','CURRENT OFFICIAL',
      'eligibility_text','Current application offers Exhibitor Level 1 for business/service exhibitors. Large-corporation pricing is set by organizer.',
      'next_action','Email info@brazilianfestival.org or call 305-803-0338 to confirm Paradise qualifies for the $500 Exhibitor Level 1 rate, remaining inventory and load-in before payment.',
      'commitment_terms_text','Current application states the $500 fee reserves space only; tent/tables/chairs are separate and the purchase is non-refundable.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-020-BRAZILIAN-FESTIVAL';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text='$250+ sponsorship',
    source_basis='Town of Jupiter current Halloween Spooktacular 2026 page/news listing — checked Sep. 30, 2026',
    source_refs=case when exists (
      select 1 from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e where e->>'url'='https://www.jupiter.fl.us/651/Halloween-Spooktacular'
    ) then source_refs else coalesce(source_refs,'[]'::jsonb) || jsonb_build_array(
      jsonb_build_object('url','https://www.jupiter.fl.us/651/Halloween-Spooktacular','title','Town of Jupiter — Halloween Spooktacular 2026','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED')
    ) end,
    detail_data=detail_data || jsonb_build_object(
      'official_source_url','https://www.jupiter.fl.us/651/Halloween-Spooktacular','source_label','Town of Jupiter current Halloween Spooktacular 2026 page',
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Oct. 17, 2026 · 4:00 PM–7:00 PM',
      'venue_text','Jupiter Community Center · 200 Military Trail, Jupiter, FL','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT BUSINESS SPONSORSHIP OPPORTUNITY · NONPROFIT VENDOR ROUTE SEPARATE',
      'current_cost_text','Business sponsorship starts at $250; exact current tier benefits to confirm','current_cost_status','CURRENT OFFICIAL STARTING PRICE',
      'next_action','Use the Town sponsorship route and confirm the current $250+ business sponsor options, onsite footprint, inventory and any category restrictions before commitment.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-022-JUPITER-SPOOKTACULAR';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='City of Boynton Beach current 2026 Fall Festival calendar — checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Oct. 17, 2026 · 3:00 PM–6:00 PM',
      'venue_text','Centennial Park & Amphitheater · 120 E Ocean Ave, Boynton Beach, FL 33435','venue_status','CURRENT OFFICIAL',
      'booking_status','EVENT CURRENT-VERIFIED · PARADISE-COMPATIBLE VENDOR/SPONSOR TERMS NOT PUBLISHED',
      'current_cost_text','Not verified','current_cost_status','NOT VERIFIED',
      'next_action','Contact City of Boynton Beach Events for current business/vendor or sponsorship availability, price, deadline, footprint and eligibility; do not assume artisan/food vendor terms apply to Paradise.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-025-BOYNTON-FALL';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='City of Pompano Beach Parks current Caribbean Fest 2026 event page with live sponsor and vendor forms — checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Oct. 17, 2026 · 5:00 PM–10:00 PM',
      'venue_text','Community Park · 1801 NE 6th Street, Pompano Beach, FL','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT SPONSOR INTEREST FORM AND VENDOR APPLICATION PUBLISHED','current_cost_text','Not publicly posted','current_cost_status','NOT VERIFIED',
      'next_action','Submit the current sponsor interest form or vendor application and confirm Paradise home-service eligibility, pricing, deadline, footprint and remaining inventory before commitment.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-024-POMPANO-CARIBBEAN';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',
    price_text='$60 sponsor-vendor 10×10',deadline_date=date '2026-10-17',
    source_basis='Live Eventeny Moose Lodge 1406 Fall Art & Craft Fair Sponsor Vendor application — checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Oct. 24, 2026 · 10:00 AM–4:00 PM',
      'booking_status','SPONSOR VENDOR APPLICATION ACTIVE · HOME SERVICE COMPANIES EXPLICITLY ELIGIBLE',
      'deadline_text','Oct. 17, 2026 at 11:59 PM ET','current_cost_text','$60 · one 10×10 outside sponsor-vendor space','current_cost_status','CURRENT OFFICIAL',
      'eligibility_text','Application explicitly lists home service companies, local businesses, Realtors, insurance, financial, health/wellness and organizations.',
      'next_action','Submit the $60 Sponsor Vendor application before Oct. 17 at 11:59 PM if space remains; Paradise fits the explicit home-service category.',
      'commitment_terms_text','Vendor provides own tent/tables/chairs/displays/weights. Fee is non-refundable once accepted unless organizer cancels the event.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-033-MOOSE-MELBOURNE';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',
    source_basis='South Florida Fair current 2026 Spookyville event page — checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED',
      'schedule_text','Oct. 17–31, 2026 · Fridays 5:00 PM–9:00 PM · Saturdays/Sundays 11:00 AM–9:00 PM',
      'venue_text','Yesteryear Village at the South Florida Fairgrounds · West Palm Beach, FL','venue_status','CURRENT OFFICIAL',
      'booking_status','EVENT AND ONSITE VENDORS CURRENT-VERIFIED · PARADISE SPONSOR/EXHIBITOR PACKAGE TO REQUEST',
      'current_cost_text','Not verified for Paradise sponsor/exhibitor participation','current_cost_status','NOT VERIFIED',
      'next_action','Contact Lorie Stinson / South Florida Fair sponsorship team for a current Spookyville business activation or sponsor package; confirm footprint, event dates included, pricing, deadline and category rights.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-027-SPOOKYVILLE';

do $$
declare before_n int; after_n int; bad int;
begin
  select n into before_n from _b2_before;
  select count(*) filter (where active and calendar_visibility and plan_year=2026 and research_status='CURRENT_REVERIFIED') into after_n
  from public.shows_app_research_calendar_controls;
  if after_n-before_n <> 16 then raise exception 'expected 16 newly reverified rows; before %, after %', before_n, after_n; end if;

  select count(*) into bad
  from public.shows_app_research_calendar_controls
  where control_id in (
    'R2026-018-JUPITER-HARBOURFEST','R2026-015-BUCKLER-WPB-OCT','R2026-010-FALL-DOWNTOWN-MELBOURNE',
    'R2026-008-HOLLYWOOD-HISPANIC','R2026-009-SABOR-FEST','R2026-011-DEERFIELD-FALL','R2026-014-WAG-O-WEEN',
    'R2026-017-CARS-COFFEE-OCT','R2026-021-RIVERWALK-FALL','R2026-023-WELLINGTON-FALL','R2026-020-BRAZILIAN-FESTIVAL',
    'R2026-022-JUPITER-SPOOKTACULAR','R2026-025-BOYNTON-FALL','R2026-024-POMPANO-CARIBBEAN',
    'R2026-033-MOOSE-MELBOURNE','R2026-027-SPOOKYVILLE'
  ) and (research_status <> 'CURRENT_REVERIFIED' or detail_data->>'current_source_checked_at' <> '2026-09-30');
  if bad<>0 then raise exception 'batch2 verification failed for % rows',bad; end if;

  if (select deadline_date from public.shows_app_research_calendar_controls where control_id='R2026-018-JUPITER-HARBOURFEST') is not null then
    raise exception 'HarbourFest sponsor deadline still structured as general deadline';
  end if;
  if (select deadline_date from public.shows_app_research_calendar_controls where control_id='R2026-033-MOOSE-MELBOURNE') <> date '2026-10-17' then
    raise exception 'Moose deadline missing';
  end if;
end $$;
