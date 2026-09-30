
update public.shows_app_research_calendar_controls
set
  research_status='CURRENT_REVERIFIED',
  date_confidence='CURRENT_VERIFIED',
  deadline_date=date '2026-09-30',
  source_basis='Battle Bros Events current Port St. Lucie vendor page + live Eventeny Sponsor Vendor application — checked Sep. 30, 2026',
  detail_data=detail_data || jsonb_build_object(
    'official_source_url','https://www.battlebrosevents.com/vendorspsl',
    'action_url','https://www.eventeny.com/events/vendor/?id=50951',
    'source_label','Battle Bros Events + live Eventeny Florida Creatives Market 2026 sponsor application',
    'current_source_checked_at','2026-09-30',
    'schedule_status','CURRENT VERIFIED',
    'schedule_text','Oct. 3–4, 2026 · 10:00 AM–4:00 PM both days',
    'booking_status','APPLICATION DEADLINE PASSED · LATE-INVENTORY INQUIRY ONLY',
    'deadline_text','Sponsor Vendor application deadline Sep. 30, 2026 at 12:00 AM ET — passed as of Sep. 30 morning',
    'current_cost_text','$500 Sponsor Vendor · 10×10 booth · optional $200 double-space / $200 choose-space add-ons',
    'current_cost_status','CURRENT OFFICIAL',
    'next_action','Email Vendors@BattleBrosEvents.com immediately and ask whether any Sponsor Vendor inventory can still be accepted after the Sep. 30 midnight deadline; do not submit or pay unless late acceptance is confirmed.',
    'commitment_terms_text','Sponsor fee is non-refundable/non-transferable after acceptance; Friday Oct. 2 setup is required unless Battle Bros approves Saturday-morning setup; vendor provides tent/tables/signage/power/weights.'
  ),
  source_refs=case when exists (
    select 1 from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e
    where e->>'url'='https://www.eventeny.com/events/vendor/?id=50951' and e->>'checked_at'='2026-09-30'
  ) then source_refs else coalesce(source_refs,'[]'::jsonb)||jsonb_build_array(jsonb_build_object(
    'url','https://www.eventeny.com/events/vendor/?id=50951','title','Florida Creatives Market 2026 — live Sponsor Vendor application','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED'
  )) end,
  audit_checked_at=now(),updated_at=now()
where control_id='R2026-004-FLORIDA-CREATIVES-PSL';

update public.shows_app_research_calendar_controls
set
  research_status='CURRENT_REVERIFIED',
  date_confidence='CURRENT_VERIFIED',
  deadline_date=date '2026-10-01',
  source_basis='City of Boynton Beach official Eventeny event + live Pirate Fest sponsorship application — checked Sep. 30, 2026',
  detail_data=detail_data || jsonb_build_object(
    'current_source_checked_at','2026-09-30',
    'schedule_status','CURRENT VERIFIED',
    'schedule_text','Oct. 31, 2026 12:00 PM–10:00 PM · Nov. 1, 2026 12:00 PM–6:00 PM',
    'booking_status','SPONSOR APPLICATION ACTIVE · DEADLINE OCT. 1 AT 5:00 PM',
    'deadline_text','Pirate Fest sponsorship deadline Oct. 1, 2026 at 5:00 PM ET',
    'current_cost_text','$500 Great Ranger · $1,000 Royal Fortune · $2,500 Flying Dutchman · $5,000 Black Pearl · $10,000 Jolly Rogers',
    'current_cost_status','CURRENT OFFICIAL',
    'next_action','Submit by Oct. 1 at 5:00 PM if pursuing. Use at least the $1,000 Royal Fortune tier for a physical 10×10 tent/table/chairs activation; confirm category conflicts before payment.',
    'commitment_terms_text','All sponsorship tiers are non-refundable. Application requires a COI naming the City as additionally insured.'
  ),
  audit_checked_at=now(),updated_at=now()
where control_id='R2026-043-BOYNTON-PIRATE';

update public.shows_app_research_calendar_controls
set
  research_status='CURRENT_REVERIFIED',
  date_confidence='CURRENT_VERIFIED',
  deadline_date=date '2026-10-08',
  source_basis='Live Eventeny GACTC Oktoberfest 2026 Business Services application — checked Sep. 30, 2026',
  detail_data=detail_data || jsonb_build_object(
    'current_source_checked_at','2026-09-30',
    'schedule_status','CURRENT VERIFIED',
    'schedule_text','Oct. 9, 2026 2:00 PM–Oct. 11, 2026 6:00 PM',
    'booking_status','BUSINESS SERVICES APPLICATION ACTIVE',
    'deadline_text','Live Business Services application deadline Oct. 8, 2026 at 12:00 AM ET',
    'current_cost_text','$25 non-refundable application fee + $250 non-refundable 10×10 space = $275 total',
    'current_cost_status','CURRENT OFFICIAL',
    'eligibility_text','Licensed reputable Florida businesses accepted; current license required and general liability insurance may be required.',
    'next_action','Apply before the Oct. 8 midnight deadline if space remains; have current Florida license and general-liability documentation ready.',
    'commitment_terms_text','$25 application fee and $250 10×10 space are non-refundable.'
  ),
  audit_checked_at=now(),updated_at=now()
where control_id='R2026-006-GACTC-OKTOBERFEST';

update public.shows_app_research_calendar_controls
set
  research_status='CURRENT_REVERIFIED',
  date_confidence='CURRENT_VERIFIED',
  deadline_date=date '2026-10-09',
  source_basis='Live Eventeny South Florida Pickle Festival 2026 Sponsor Vendor application — checked Sep. 30, 2026',
  detail_data=detail_data || jsonb_build_object(
    'current_source_checked_at','2026-09-30',
    'schedule_status','CURRENT VERIFIED',
    'schedule_text','Oct. 17, 2026 12:00 PM–Oct. 18, 2026 6:00 PM',
    'booking_status','SPONSOR VENDOR APPLICATION ACTIVE',
    'deadline_text','Sponsor Vendor application deadline Oct. 9, 2026 at 12:00 AM ET',
    'current_cost_text','$500 Mild · $1,000 Medium · $1,500 Hot · $2,500 Fiery · $5,000 Nuclear/Title',
    'current_cost_status','CURRENT OFFICIAL',
    'eligibility_text','Application explicitly accepts small/large businesses, brick-and-mortar, services, marketing and lead-generation companies.',
    'attendance_text','Organizer application states expected in-person attendance of 8,000–10,000+.',
    'next_action','Submit before Oct. 9 if inventory remains. For category exclusivity, use the $2,500 Fiery tier; otherwise compare $500–$1,500 physical booth tiers.',
    'commitment_terms_text','Sponsorship fee is non-refundable. Event is rain or shine; Act-of-God cancellation transfers sponsorship to a rescheduled or next Battle Bros event.'
  ),
  audit_checked_at=now(),updated_at=now()
where control_id='R2026-019-SFL-PICKLE';

update public.shows_app_research_calendar_controls
set
  research_status='CURRENT_REVERIFIED',
  date_confidence='CURRENT_VERIFIED',
  deadline_date=date '2026-10-09',
  source_basis='Grace Jamaican Jerk Festival official 2026 vendor page/site — checked Sep. 30, 2026',
  price_text='$1,500 small business · $850 novelty · other vendor tiers available',
  detail_data=detail_data || jsonb_build_object(
    'current_source_checked_at','2026-09-30',
    'schedule_status','CURRENT VERIFIED',
    'booking_status','2026 VENDOR APPLICATIONS ACTIVE · FIRST-COME, FIRST-SERVED',
    'deadline_text','Vendor applications close Oct. 9, 2026',
    'current_cost_text','$850 novelty · $1,500 small business · $1,200 uncooked foods · $1,800 cooked food 10×10 · $2,000 food truck · up to $3,400 larger tents',
    'current_cost_status','CURRENT OFFICIAL',
    'eligibility_text','Current official vendor route includes a $1,500 Small Business category; confirm Paradise home-improvement acceptance before payment.',
    'next_action','Contact the organizer and, if Paradise is accepted under Small Business, submit before Oct. 9 while first-come inventory remains.',
    'commitment_terms_text','Current official page states booth packages include tent, vendor passes and parking; spaces are assigned first come, first served.'
  ),
  audit_checked_at=now(),updated_at=now()
where control_id='R2026-061-GRACE-JERK';

update public.shows_app_research_calendar_controls
set
  research_status='CURRENT_REVERIFIED',
  date_confidence='CURRENT_VERIFIED',
  source_basis='Martin County Parks & Recreation current 2026 Fall Fest event + sponsorship page — checked Sep. 30, 2026',
  detail_data=detail_data || jsonb_build_object(
    'current_source_checked_at','2026-09-30',
    'schedule_status','CURRENT VERIFIED',
    'schedule_text','Oct. 9, 2026 · 5:30 PM–9:30 PM',
    'venue_text','Langford Park · 2369 NE Dixie Hwy, Jensen Beach, FL 34957',
    'venue_status','CURRENT OFFICIAL',
    'booking_status','CURRENT SPONSORSHIP TIERS PUBLISHED · INVENTORY/DEADLINE TO CONFIRM',
    'current_cost_text','$250 Silver · $700 Gold · $1,500 Platinum · $2,500 Title',
    'current_cost_status','CURRENT OFFICIAL',
    'attendance_text','Martin County states Fall Fest attracts over 1,000 participants.',
    'next_action','Contact events@martin.fl.us / 772-221-1430 now to confirm remaining Silver/Gold inventory and the application cutoff. Silver includes a 10×10 vendor space; Gold adds table, chairs and tent.'
  ),
  audit_checked_at=now(),updated_at=now()
where control_id='R2026-007-MARTIN-FALL-FEST';

update public.shows_app_research_calendar_controls
set
  research_status='CURRENT_REVERIFIED',
  date_confidence='CURRENT_VERIFIED',
  source_basis='City of North Miami Beach exact 2026 Centennial Festival calendar + Centennial sponsor site/package — checked Sep. 30, 2026',
  source_refs=case when exists (
    select 1 from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e
    where e->>'url'='https://www.citynmb.com/Calendar.aspx?EID=8967&calType=0&day=29&month=10&year=2026' and e->>'checked_at'='2026-09-30'
  ) then source_refs else coalesce(source_refs,'[]'::jsonb)||jsonb_build_array(
    jsonb_build_object('url','https://www.citynmb.com/Calendar.aspx?EID=8967&calType=0&day=29&month=10&year=2026','title','City of North Miami Beach — NMB Centennial Festival 2026','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED'),
    jsonb_build_object('url','https://www.nmbcentennial.com/','title','NMB Centennial — sponsor and Culture & Community Street Festival page','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED')
  ) end,
  detail_data=detail_data || jsonb_build_object(
    'official_source_url','https://www.citynmb.com/Calendar.aspx?EID=8967&calType=0&day=29&month=10&year=2026',
    'action_url','https://www.nmbcentennial.com/',
    'source_label','City of North Miami Beach exact 2026 event + Centennial sponsor route',
    'current_source_checked_at','2026-09-30',
    'schedule_status','CURRENT VERIFIED',
    'schedule_text','Oct. 3, 2026 · 5:00 PM–10:00 PM',
    'venue_text','North Miami Beach City Hall · 17011 NE 19th Avenue, North Miami Beach, FL 33162',
    'venue_status','CURRENT OFFICIAL',
    'booking_status','EVENT/VENDORS VERIFIED · CENTENNIAL SPONSORSHIP ROUTE ACTIVE · STREET-FESTIVAL PACKAGE TO CONFIRM',
    'current_cost_text','Street-festival-specific sponsor/vendor price not publicly established in the current exact event source',
    'current_cost_status','CURRENT ROUTE / PRICE TO CONFIRM',
    'next_action','Contact communications@citynmb.com / 305-770-5219 immediately for current Culture & Community Street Festival sponsor/vendor inventory, activation footprint, price, deadline and category availability.'
  ),
  audit_checked_at=now(),updated_at=now()
where control_id='R2026-001-NMB-CENTENNIAL';

update public.shows_app_research_calendar_controls
set
  research_status='CURRENT_REVERIFIED',
  date_confidence='CURRENT_VERIFIED',
  source_basis='Visit St. Lucie current 2026 Oktoberfest listing — checked Sep. 30, 2026',
  detail_data=detail_data || jsonb_build_object(
    'current_source_checked_at','2026-09-30',
    'schedule_status','CURRENT VERIFIED',
    'schedule_text','Oct. 3, 2026 · 5:00 PM–9:00 PM',
    'venue_text','MIDFLORIDA Event Center · 9221 SE Event Center Place, Port St. Lucie, FL 34952',
    'venue_status','CURRENT OFFICIAL',
    'booking_status','EVENT CURRENT-VERIFIED · BUSINESS/COMPANY BOOTH ROUTE NOT PUBLISHED IN CURRENT EVENT SOURCE',
    'current_cost_text','Not verified',
    'current_cost_status','NOT VERIFIED / CONTACT CITY',
    'next_action','Contact Port St. Lucie Special Events immediately to ask whether any business/company booth or sponsorship inventory remains for Oct. 3; obtain price, footprint and insurance requirements before commitment.'
  ),
  audit_checked_at=now(),updated_at=now()
where control_id='R2026-003-PSL-OKTOBERFEST';

update public.shows_app_research_calendar_controls
set
  research_status='CURRENT_REVERIFIED',
  date_confidence='CURRENT_VERIFIED',
  price_text=null,
  source_basis='City of Coral Springs current 2026 Oktoberfest event page — checked Sep. 30, 2026',
  detail_data=detail_data || jsonb_build_object(
    'current_source_checked_at','2026-09-30',
    'schedule_status','CURRENT VERIFIED',
    'schedule_text','Oct. 3, 2026 · 4:00 PM–10:00 PM',
    'venue_text','City Hall Lawn · 9500 W Sample Road, Coral Springs, FL 33065',
    'venue_status','CURRENT OFFICIAL',
    'booking_status','EVENT/LOCAL VENDORS CURRENT-VERIFIED · BUSINESS-BOOTH INVENTORY/PRICE TO CONFIRM',
    'current_cost_text','Not verified in current public event page',
    'current_cost_status','NOT VERIFIED',
    'next_action','Email events@coralsprings.gov or call 954-344-1111 immediately to confirm whether a business booth is still available for Oct. 3 and obtain the current fee, setup, insurance and cancellation terms.'
  ),
  audit_checked_at=now(),updated_at=now()
where control_id='R2026-002-CORAL-SPRINGS-OKTOBERFEST';

update public.shows_app_research_calendar_controls
set
  research_status='CURRENT_REVERIFIED',
  date_confidence='CURRENT_VERIFIED',
  price_text=null,
  source_basis='GIPA current official site — Oktoberfest 2026 date and Vendor Contract link checked Sep. 30, 2026',
  source_refs=case when exists (
    select 1 from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e
    where e->>'url'='https://www.gipa.org/form/m/386539' and e->>'checked_at'='2026-09-30'
  ) then source_refs else coalesce(source_refs,'[]'::jsonb)||jsonb_build_array(jsonb_build_object(
    'url','https://www.gipa.org/form/m/386539','title','GIPA Oktoberfest 2026 — current Vendor Contract link from official site','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED_LINK_ONLY'
  )) end,
  detail_data=detail_data || jsonb_build_object(
    'action_url','https://www.gipa.org/form/m/386539',
    'current_source_checked_at','2026-09-30',
    'schedule_status','CURRENT VERIFIED',
    'schedule_text','Oct. 3, 2026',
    'booking_status','CURRENT VENDOR CONTRACT LINK PUBLISHED · CONTRACT TERMS/AVAILABILITY TO CONFIRM',
    'current_cost_text','Not verified',
    'current_cost_status','NOT VERIFIED',
    'next_action','Open the current GIPA Vendor Contract and confirm Paradise eligibility, remaining inventory, current fee, booth location, insurance, payment and cancellation terms before commitment.'
  ),
  audit_checked_at=now(),updated_at=now()
where control_id='R2026-005-GIPA-OKTOBERFEST';

update public.shows_app_research_calendar_controls
set
  research_status='CURRENT_REVERIFIED',
  source_basis='Tradition current Neighborhood Farmer’s Market page — current Sunday market and vendor inquiry checked Sep. 30, 2026; full Oct.–Dec occurrence range remains archive-derived',
  detail_data=detail_data || jsonb_build_object(
    'current_source_checked_at','2026-09-30',
    'booking_status','CURRENT SUNDAY MARKET / VENDOR INQUIRY VERIFIED · FULL OCCURRENCE RANGE AND FEE TO CONFIRM',
    'current_cost_text','Not verified',
    'current_cost_status','NOT VERIFIED',
    'venue_text','Tradition Square · SW Meeting Street, Port St. Lucie, FL',
    'venue_status','CURRENT OFFICIAL',
    'next_action','Email Katherine at traditionmarket@hotmail.com to confirm Paradise home-improvement/service eligibility, vendor fee, space size, insurance requirements and which October–December Sundays still have inventory.'
  ),
  audit_checked_at=now(),updated_at=now()
where control_id='R2026-117-TRADITION-NEIGHBORHOOD';

do $$
declare bad integer;
begin
  select count(*) into bad
  from public.shows_app_research_calendar_controls
  where control_id in (
    'R2026-004-FLORIDA-CREATIVES-PSL','R2026-043-BOYNTON-PIRATE','R2026-006-GACTC-OKTOBERFEST',
    'R2026-019-SFL-PICKLE','R2026-061-GRACE-JERK','R2026-007-MARTIN-FALL-FEST',
    'R2026-001-NMB-CENTENNIAL','R2026-003-PSL-OKTOBERFEST','R2026-002-CORAL-SPRINGS-OKTOBERFEST',
    'R2026-005-GIPA-OKTOBERFEST','R2026-117-TRADITION-NEIGHBORHOOD'
  )
  and (research_status<>'CURRENT_REVERIFIED' or detail_data->>'current_source_checked_at'<>'2026-09-30');
  if bad<>0 then raise exception 'Urgency-batch current re-verification failed for % rows',bad; end if;

  if (select deadline_date from public.shows_app_research_calendar_controls where control_id='R2026-006-GACTC-OKTOBERFEST')<>date '2026-10-08' then
    raise exception 'GACTC deadline not corrected';
  end if;
end $$;
