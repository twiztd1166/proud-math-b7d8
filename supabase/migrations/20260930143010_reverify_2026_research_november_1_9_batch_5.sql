
create temporary table _nov_before on commit drop as
select count(*) filter (where active and calendar_visibility and plan_year=2026 and research_status='CURRENT_REVERIFIED') n
from public.shows_app_research_calendar_controls;

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='Cars & Coffee Palm Beach current 2026 event schedule + current sponsor/vendor inquiry page — checked Sep. 30, 2026',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED',
      'schedule_text','Nov. 1, 2026 · gates 7:00 AM · official event 8:00 AM–12:00 PM',
      'venue_text','Boca Raton Innovation Campus (BRiC) · 4850 T-Rex Ave, Boca Raton, FL 33431','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT SPONSOR/VENDOR INQUIRY ACTIVE','current_cost_text','Not publicly posted — request current package','current_cost_status','NOT VERIFIED',
      'next_action','Submit the current sponsor/vendor inquiry for the Nov. 1 event and request package pricing, footprint, exclusivity, remaining inventory and lead-capture rights; email Support@carsandcoffeepb.com if no response within 48 hours.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-049-CARS-COFFEE-NOV';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='Homestead-Miami Speedway current 2026 Championship Weekend, partners and fan-hospitality pages — checked Sep. 30, 2026',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Nov. 6–8, 2026 · NASCAR Championship Weekend',
      'venue_text','Homestead-Miami Speedway · Homestead, FL','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT PARTNERSHIP/CORPORATE INQUIRY OPEN · SELECT FAN HOSPITALITY SOLD OUT/WAITLIST',
      'current_cost_text','Custom partnership/corporate hospitality quote required','current_cost_status','CUSTOM QUOTE',
      'next_action','Use the Speedway partnership inquiry for a Paradise-specific consumer activation or corporate package. Do not treat sold-out Speedway Terrace/Ally Champions Club inventory as closing the separate partnership route.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-052-NASCAR-HOMESTEAD';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='Dream Asia Festival current South Florida 2026 event page + current official Vendor Application link — checked Sep. 30, 2026',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED',
      'schedule_text','Nov. 6, 2026 · 4:00 PM–10:00 PM; Nov. 7–8 · 10:00 AM–10:00 PM',
      'venue_text','South Florida Fair · 9067 Southern Blvd, West Palm Beach, FL 33411','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT VENDOR APPLICATION PUBLISHED · PARADISE CATEGORY/PRICE/DEADLINE TO CONFIRM',
      'current_cost_text','Not publicly verified','current_cost_status','NOT VERIFIED',
      'attendance_text','Current event page advertises 80+ food vendors and 30+ market vendors.',
      'next_action','Open the official Vendor Application and confirm whether a home-improvement/service business is accepted for West Palm Beach, then obtain current fee, footprint, deadline and remaining inventory before commitment.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-053-DREAM-ASIA';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='Main Street Fort Pierce exact current Nov. 6, 2026 Friday Fest listing — checked Sep. 30, 2026',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Nov. 6, 2026 · 5:30 PM–8:30 PM',
      'venue_text','Marina Square · 1 Avenue A, Fort Pierce, FL 34950','venue_status','CURRENT OFFICIAL',
      'booking_status','EVENT/VENDORS CURRENT-VERIFIED · PARADISE COMMERCIAL VENDOR TERMS TO REQUEST',
      'current_cost_text','Not verified','current_cost_status','NOT VERIFIED',
      'next_action','Contact Main Street Fort Pierce at mainstreet@mainstreetfortpierce.org / 772-466-3880 for current commercial/service-vendor eligibility, fee, deadline, footprint and remaining Nov. 6 inventory.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-051-FP-FRIDAY-FEST-NOV';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='Air Dot Show current 2026 Kennedy Space Center Salute to America in Space event + partnership pages — checked Sep. 30, 2026',
    source_refs=case when exists (
      select 1 from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e
      where e->>'url'='https://air.show/kennedyspacecenter/' and e->>'checked_at'='2026-09-30'
    ) then source_refs else coalesce(source_refs,'[]'::jsonb)||jsonb_build_array(
      jsonb_build_object('url','https://air.show/kennedyspacecenter/','title','Salute to America in Space — Kennedy Space Center 2026','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED'),
      jsonb_build_object('url','https://air.show/ksc-sponsor/','title','Salute to America in Space — Partnership Opportunities','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED')
    ) end,
    detail_data=detail_data||jsonb_build_object(
      'official_source_url','https://air.show/kennedyspacecenter/','action_url','https://air.show/ksc-sponsor/',
      'source_label','Air Dot Show current Kennedy Space Center event + partnership route',
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Nov. 7–8, 2026',
      'venue_text','Space Florida Launch and Landing Facility / historic Shuttle Landing Facility · Kennedy Space Center, FL','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT CUSTOM PARTNERSHIP INQUIRY OPEN','current_cost_text','Custom partnership proposal required','current_cost_status','CUSTOM QUOTE',
      'eligibility_text','Current partnership program expressly supports consumer/community brands, public activation, brand visibility, corporate hospitality, and industry engagement.',
      'next_action','Contact Joshua Purvis at 813-447-0151 / sales@air.show for a Paradise-specific consumer/community activation proposal, physical footprint, audience package, category rights and budget.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-116-NASA-MAX-POWER';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',
    price_text='$275 vendor · $600–$4,000 available sponsorship tiers; $5,000 Captain sold out',
    source_basis='Treasure Coast Brew Fest current Nov. 7, 2026 event and sponsorship/vendor page — checked Sep. 30, 2026',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Nov. 7, 2026 · 1:00 PM–5:00 PM',
      'venue_text','Stuart Memorial Park · Stuart, FL','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT VENDOR AND SPONSOR OPTIONS ACTIVE · $5,000 CAPTAIN SOLD OUT',
      'current_cost_text','$275 vendor 10×10 + 2 GA tickets · $600 Snifter · $1,000 Pint · $2,000 Growler · $3,000 Mighty Stage · $4,000 Chalice · $5,000 Captain sold out',
      'current_cost_status','CURRENT OFFICIAL','attendance_text','Current sponsor page states 1,500+ attendees, 200+ beers and 50+ breweries.',
      'next_action','For the lowest-cost physical lead-gen footprint, compare the $275 vendor booth with the $600 Snifter sponsor, which also includes a 10×10 booth and broader marketing visibility.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-059-TC-BREW-FEST';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text='$40 business vendor 10×10',
    source_basis='SPCA of Brevard current Bark in the Park 2026 event page — checked Sep. 30, 2026',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Nov. 7, 2026 · 11:00 AM–4:00 PM',
      'venue_text','Sand Point Park · 101 N Washington Ave, Titusville, FL 32796','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT BUSINESS VENDOR SPACES AND SPONSORSHIPS ACTIVE · FIRST COME FIRST SERVED',
      'current_cost_text','$40 business vendor 10×10 · $5 nonprofit 10×10','current_cost_status','CURRENT OFFICIAL',
      'booth_placement_text','Vendor receives 10×10 space and supplies own tent, table, chairs and setup items.',
      'next_action','Reserve the $40 business-vendor space while first-come inventory remains; compare sponsorship only if added brand visibility is worth the higher spend.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-056-BARK-TITUSVILLE';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',
    price_text='$150–$400 vendor · $1,250–$50,000 sponsor',
    source_basis='Riverwalk Fort Lauderdale current Second Annual Downtown Day of the Dead 2026 page — checked Sep. 30, 2026',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED',
      'schedule_text','Nov. 7, 2026 · Festival 3:00 PM–8:00 PM · Costume Stroll 6:00 PM · Block Party 5:00 PM–11:00 PM',
      'venue_text','Esplanade Park · 400 SW 2nd St, Fort Lauderdale, FL 33312','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT SPONSOR AND VENDOR OPPORTUNITIES ACTIVE',
      'current_cost_text','$150–$400 vendor · $1,250–$50,000 sponsorship','current_cost_status','CURRENT OFFICIAL RANGE',
      'next_action','Email events@GoRiverwalk.com / 954-468-1541 ext. 205 for the exact Paradise-compatible vendor tier and remaining inventory; use sponsorship only if the additional rights justify the spend.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-055-DAY-DEAD';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',
    price_text='$300 regular business · other category tiers $200–$1,500',
    source_basis='MJD Health & Wellness Festival current Nov. 7, 2026 site and vendor-pricing page — checked Sep. 30, 2026',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Nov. 7, 2026 · 10:00 AM–5:00 PM · setup 9:00 AM',
      'venue_text','Cagni Park · 13300 NE 7th Ave, North Miami, FL 33161','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT VENDOR REGISTRATION OPEN',
      'current_cost_text','$200 small nonprofit · $300 Regular Business · $500 large nonprofit · $1,200 doctors · $1,500 insurance companies',
      'current_cost_status','CURRENT OFFICIAL',
      'booth_placement_text','Regular Business package includes one 4×10 table + 2 chairs; tents are not included and can be rented separately.',
      'commitment_terms_text','Current site states no refunds.',
      'next_action','Confirm Paradise fits the $300 Regular Business category before payment, then reserve the booth if inventory remains.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-057-NORTH-MIAMI-HEALTH';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='Miami-Dade Food Wine Beer Culture Festival current Nov. 7, 2026 event + sponsorship pages — checked Sep. 30, 2026',
    source_refs=case when exists (
      select 1 from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e
      where e->>'url'='https://miamidadefoodwine.com/' and e->>'checked_at'='2026-09-30'
    ) then source_refs else coalesce(source_refs,'[]'::jsonb)||jsonb_build_array(
      jsonb_build_object('url','https://miamidadefoodwine.com/','title','Miami-Dade Food Wine Beer Culture Festival — 2026 event','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED'),
      jsonb_build_object('url','https://miamidadefoodwine.com/sponsors','title','Miami-Dade Festival — 2026 Sponsors & Partners','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED')
    ) end,
    detail_data=detail_data||jsonb_build_object(
      'official_source_url','https://miamidadefoodwine.com/','action_url','https://miamidadefoodwine.com/sponsors',
      'source_label','Miami-Dade Food Wine Beer Culture Festival current event + custom sponsorship route',
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Nov. 7, 2026 · 11:00 AM–11:00 PM',
      'venue_text','Amelia Earhart Park · 401 E 65th St, Hialeah, FL 33013','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT PARTNER SLOTS OPEN · PUBLIC VENDOR ROUTE IS FOOD/BEVERAGE/ARTISAN FOCUSED',
      'current_cost_text','Custom sponsorship proposal — no fixed public tiers','current_cost_status','CUSTOM QUOTE',
      'eligibility_text','Public vendor application is oriented to restaurants, food trucks, breweries, wineries/spirits and artisan makers; Paradise should use the open sponsor/partner route instead of assuming vendor eligibility.',
      'next_action','Use the 2026 sponsor enquiry to request a Paradise home-improvement activation in the Family Zone, district program or another consumer-facing area; obtain footprint, rights, category exclusivity and budget before commitment.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-058-MIAMI-FOOD-WINE';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',deadline_date=date '2026-10-31',
    price_text='$500 10×10 · $900 10×20 artist/local-maker vendor application',
    source_basis='Live Eventeny The Tequila Fest 2026 Artists and Local Makers application — checked Sep. 30, 2026',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED WITH HOURS CONFLICT',
      'schedule_text','Nov. 7, 2026 · Eventeny listing shows 4:00 PM–8:00 PM; vendor terms reference remaining active through 10:00 PM — confirm vendor hours',
      'venue_text','Mizner Park Amphitheater · Boca Raton, FL','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT ARTISTS/LOCAL-MAKERS APPLICATION ACTIVE · PARADISE SERVICE-BUSINESS ELIGIBILITY NOT ESTABLISHED',
      'deadline_text','Oct. 31, 2026 at 11:59 PM ET','current_cost_text','$500 single 10×10 · $900 double 10×20 · $50 electricity',
      'current_cost_status','CURRENT OFFICIAL','attendance_text','Application states expected attendance of 2,000+ and audience skew 70%+ female, ages 30–55.',
      'booth_placement_text','Fee includes fire-retardant tent, weights, one table and two chairs.',
      'commitment_terms_text','Vendor fee is non-refundable; space is confirmed only after payment.',
      'next_action','Do not apply as an artist/local maker without organizer approval. Contact Joe@TrueHospitalityCreative.com and ask for a Paradise-compatible commercial sponsor/service-business activation before the Oct. 31 application cutoff.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-060-TEQUILA-FEST';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',
    price_text='$395 standard · $350/event for 3+ · $450 perimeter · sponsors $495/$595/$895/$1,195',
    source_basis='Expo Media / Retirement Times current 2026 Delray fact sheet + vendor-space application — checked Sep. 30, 2026',
    source_refs=case when exists (
      select 1 from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e
      where e->>'url'='https://retirement-times.com/wp-content/uploads/2026/01/FACT_SHEETS-2026SENIOREXPOS.pdf'
        and e->>'checked_at'='2026-09-30'
    ) then source_refs else coalesce(source_refs,'[]'::jsonb)||jsonb_build_array(
      jsonb_build_object('url','https://retirement-times.com/wp-content/uploads/2026/01/FACT_SHEETS-2026SENIOREXPOS.pdf','title','2026 Senior Expo Fact Sheets — Delray','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED'),
      jsonb_build_object('url','https://retirement-times.com/wp-content/uploads/2026/01/SEContracts-2026-HealthFairs-FILLABLE.pdf','title','2026 Senior Lifestyle & Healthcare Expo Vendor Space Application','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED')
    ) end,
    detail_data=detail_data||jsonb_build_object(
      'official_source_url','https://retirement-times.com/wp-content/uploads/2026/01/FACT_SHEETS-2026SENIOREXPOS.pdf',
      'action_url','https://retirement-times.com/wp-content/uploads/2026/01/SEContracts-2026-HealthFairs-FILLABLE.pdf',
      'source_label','Expo Media / Retirement Times current 2026 Delray Senior Expo fact sheet + contract',
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Nov. 9, 2026 · 9:30 AM–1:00 PM',
      'venue_text','South County Civic Center · 16700 Jog Road, Delray Beach, FL 33446','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT 2026 EXHIBITOR CONTRACT ACTIVE · CATEGORY AVAILABILITY TO CONFIRM',
      'current_cost_text','$395 standard 6-ft table + 2 chairs · $350/event for 3+ expos · $450 perimeter/electrical · Silver $495 · Gold $595 · Platinum $895 · Diamond $1,195',
      'current_cost_status','CURRENT OFFICIAL',
      'attendance_text','Fact sheet says the prior Delray event sold out with 50 exhibitors and anticipates 55 businesses/organizations/medical-dental practices.',
      'eligibility_text','Fact sheet includes lifestyle products and home healthcare; confirm aging-in-place/home-improvement category acceptance before contract.',
      'commitment_terms_text','Refund requests are credited toward future events or Senior Expo advertising; no cash or credit-card refunds.',
      'next_action','Call 754-246-2874 or email drew@retirement-times.com to confirm Paradise category availability for Nov. 9 and reserve the lowest suitable space.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-062-SENIOR-DELRAY';

update public.shows_app_research_calendar_controls r
set source_refs=coalesce(source_refs,'[]'::jsonb)||jsonb_build_array(
      jsonb_build_object('url',r.detail_data->>'official_source_url','title',coalesce(nullif(r.detail_data->>'source_label',''),'Current official source'),'checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED')
    ),updated_at=now()
where control_id in (
 'R2026-049-CARS-COFFEE-NOV','R2026-052-NASCAR-HOMESTEAD','R2026-053-DREAM-ASIA',
 'R2026-051-FP-FRIDAY-FEST-NOV','R2026-059-TC-BREW-FEST','R2026-056-BARK-TITUSVILLE',
 'R2026-055-DAY-DEAD','R2026-057-NORTH-MIAMI-HEALTH','R2026-060-TEQUILA-FEST'
)
and not exists (
  select 1 from jsonb_array_elements(coalesce(r.source_refs,'[]'::jsonb)) e
  where e->>'url'=r.detail_data->>'official_source_url' and e->>'checked_at'='2026-09-30'
);

update public.shows_app_research_calendar_controls
set source_refs=coalesce(source_refs,'[]'::jsonb)||jsonb_build_array(
  jsonb_build_object('url','https://www.carsandcoffeepb.com/','title','Cars & Coffee Palm Beach — 2026 dates and venue','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED')
)
where control_id='R2026-049-CARS-COFFEE-NOV';

update public.shows_app_research_calendar_controls
set source_refs=coalesce(source_refs,'[]'::jsonb)||jsonb_build_array(
  jsonb_build_object('url','https://www.homesteadmiamispeedway.com/events/champ/','title','Homestead-Miami Speedway — 2026 NASCAR Championship Weekend','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED'),
  jsonb_build_object('url','https://www.homesteadmiamispeedway.com/fan-hospitality/','title','Homestead-Miami Speedway — 2026 Fan Hospitality','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED')
)
where control_id='R2026-052-NASCAR-HOMESTEAD';

update public.shows_app_research_calendar_controls
set source_refs=coalesce(source_refs,'[]'::jsonb)||jsonb_build_array(
  jsonb_build_object('url','https://www.dreamasiafest.com/','title','Dream Asia Festival — current Vendor Application route','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED')
)
where control_id='R2026-053-DREAM-ASIA';

do $$
declare before_n int; after_n int; bad int;
begin
  select n into before_n from _nov_before;
  select count(*) filter (where active and calendar_visibility and plan_year=2026 and research_status='CURRENT_REVERIFIED') into after_n
  from public.shows_app_research_calendar_controls;
  if after_n-before_n<>12 then raise exception 'expected 12 Nov. 1-9 rows; before %, after %',before_n,after_n; end if;

  select count(*) into bad
  from public.shows_app_research_calendar_controls
  where control_id in (
   'R2026-049-CARS-COFFEE-NOV','R2026-052-NASCAR-HOMESTEAD','R2026-053-DREAM-ASIA',
   'R2026-051-FP-FRIDAY-FEST-NOV','R2026-116-NASA-MAX-POWER','R2026-059-TC-BREW-FEST',
   'R2026-056-BARK-TITUSVILLE','R2026-055-DAY-DEAD','R2026-057-NORTH-MIAMI-HEALTH',
   'R2026-058-MIAMI-FOOD-WINE','R2026-060-TEQUILA-FEST','R2026-062-SENIOR-DELRAY'
  )
  and (research_status<>'CURRENT_REVERIFIED' or detail_data->>'current_source_checked_at'<>'2026-09-30');
  if bad<>0 then raise exception 'Nov. batch verification failed for % rows',bad; end if;

  if (select deadline_date from public.shows_app_research_calendar_controls where control_id='R2026-060-TEQUILA-FEST')<>date '2026-10-31' then
    raise exception 'Tequila deadline not structured';
  end if;
  if (select price_text from public.shows_app_research_calendar_controls where control_id='R2026-060-TEQUILA-FEST')
     <> '$500 10×10 · $900 10×20 artist/local-maker vendor application' then
    raise exception 'Tequila stale price not corrected';
  end if;
  if (select price_text from public.shows_app_research_calendar_controls where control_id='R2026-062-SENIOR-DELRAY')
     not like '$395 standard%' then raise exception 'Delray Senior pricing missing'; end if;
  if (select price_text from public.shows_app_research_calendar_controls where control_id='R2026-052-NASCAR-HOMESTEAD') is not null then
    raise exception 'NASCAR custom quote should not have fixed price';
  end if;
end $$;
