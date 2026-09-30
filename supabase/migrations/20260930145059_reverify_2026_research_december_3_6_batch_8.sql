
create temporary table _b8_before on commit drop as
select count(*) filter (where active and calendar_visibility and plan_year=2026 and research_status='CURRENT_REVERIFIED') n
from public.shows_app_research_calendar_controls;

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',
    deadline_date=date '2026-12-01',price_text='$500–$5,000 sponsor tiers',
    source_basis='Battle Bros Events current Space Coast Holiday Food Fest 2026 page + live Eventeny sponsor application — checked Sep. 30, 2026',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Dec. 5, 2026 · 12:00 PM–9:00 PM',
      'booking_status','CURRENT SPONSOR APPLICATION ACTIVE · DEADLINE DEC. 1 AT 12:00 AM ET',
      'deadline_text','Sponsor application deadline Dec. 1, 2026 at 12:00 AM ET',
      'current_cost_text','$500 Mild · $750 Medium · $1,000 Hot · $2,000 Fiery · $5,000 Nuclear/Title','current_cost_status','CURRENT OFFICIAL',
      'attendance_text','Current application states expected in-person attendance of 6,000–10,000+.',
      'eligibility_text','Sponsor application explicitly accepts small/large businesses, brick-and-mortar, services, marketing and lead-generation companies.',
      'next_action','Submit before the Dec. 1 midnight deadline if inventory remains. $500 includes a 10×10 booth; $2,000 adds industry exclusivity and a 10×20 footprint.',
      'commitment_terms_text','Sponsorship is non-refundable; Act-of-God cancellation transfers sponsorship to a rescheduled or future Battle Bros event.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-090-SPACE-COAST-HOLIDAY-FOOD';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='City of West Palm Beach current Holiday in Paradise Tree Lighting 2026 page — checked Sep. 30, 2026',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Dec. 3, 2026 · 6:00 PM–10:00 PM',
      'booking_status','EVENT CURRENT-VERIFIED · CURRENT SPONSOR/ACTIVATION PACKAGE TO REQUEST',
      'current_cost_text','Not verified','current_cost_status','NOT VERIFIED',
      'next_action','Contact City sponsorship representative Cinde Martin / Community Events for the current Holiday in Paradise activation package, price, footprint, deadline, category rights and remaining inventory.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-086-WPB-HOLIDAY-PARADISE';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='Main Street Fort Pierce exact current Dec. 4, 2026 Friday Fest listing — checked Sep. 30, 2026',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Dec. 4, 2026 · 5:30 PM–8:30 PM',
      'venue_text','Marina Square · 1 Avenue A, Fort Pierce, FL 34950','venue_status','CURRENT OFFICIAL',
      'booking_status','EVENT CURRENT-VERIFIED · CURRENT BUSINESS/SERVICE VENDOR TERMS TO REQUEST',
      'current_cost_text','Not verified','current_cost_status','NOT VERIFIED',
      'next_action','Contact mainstreet@mainstreetfortpierce.org / 772-466-3880 for current commercial/service-vendor eligibility, fee, deadline, footprint and remaining Dec. 4 inventory.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-089-FP-FRIDAY-FEST-DEC';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='City of Greenacres current Holiday in the Park 2026 page — checked Sep. 30, 2026',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Dec. 4, 2026 · 5:00 PM–9:00 PM',
      'venue_text','Samuel J. Ferreri Community Park · 2905 Jog Road, Greenacres, FL','venue_status','CURRENT OFFICIAL',
      'booking_status','EVENT/FESTIVE VENDORS CURRENT-VERIFIED · PARADISE BUSINESS PARTICIPATION TERMS TO REQUEST',
      'current_cost_text','Not verified','current_cost_status','NOT VERIFIED',
      'next_action','Contact Nichole King at nking@greenacresfl.gov / 561-642-2196 to confirm Paradise-compatible vendor or sponsor participation, fee, deadline, footprint and availability.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-087-GREENACRES-HOLIDAY';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',
    source_basis='City of Hallandale Beach current Special Events + sponsorship/vendor opportunity pages — recurring Holiday in the Park first-Friday pattern checked Sep. 30, 2026',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT RECURRING EVENT VERIFIED · EXACT 2026 DATE NOT SEPARATELY POSTED',
      'schedule_text','Current City page states Holiday in the Park is held the first Friday of December; estimated sort date remains Dec. 4, 2026 until an exact 2026 event posting is published.',
      'venue_text','Peter Bluesten Park · Hallandale Beach, FL','venue_status','CURRENT RECURRING VENUE',
      'booking_status','CURRENT CITY SPONSOR/VENDOR OPPORTUNITY ROUTE PUBLISHED · EXACT 2026 PACKAGE TO REQUEST',
      'current_cost_text','Not verified','current_cost_status','NOT VERIFIED',
      'next_action','Contact HBParksRec@coHB.org / 954-457-1452 and request the 2026 Holiday in the Park sponsor/vendor application, exact date confirmation, price, footprint and deadline.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-088-HALLANDALE-HOLIDAY';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',
    deadline_date=date '2026-12-04',price_text='$500–$5,000 sponsor tiers',
    source_basis='Battle Bros Events current Treasure Coast Holiday Food Fest 2026 page + live Eventeny sponsor application — checked Sep. 30, 2026',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Dec. 12, 2026 · 12:00 PM–9:00 PM',
      'venue_text','Clover Park · 31 Piazza Drive, Port St. Lucie, FL 34986','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT SPONSOR APPLICATION ACTIVE · DEADLINE DEC. 4 AT 12:00 AM ET',
      'deadline_text','Sponsor application deadline Dec. 4, 2026 at 12:00 AM ET',
      'current_cost_text','$500 Mild · $750 Medium · $1,000 Hot · $2,000 Fiery · $5,000 Nuclear/Title','current_cost_status','CURRENT OFFICIAL',
      'attendance_text','Current application states expected in-person attendance of 5,000–10,000+.',
      'eligibility_text','Sponsor application explicitly accepts small/large businesses, brick-and-mortar, services, marketing and lead-generation companies.',
      'next_action','Submit before the Dec. 4 midnight deadline if inventory remains. $500 includes a 10×10 booth; $2,000 adds industry exclusivity and a 10×20 footprint.',
      'commitment_terms_text','Sponsorship is non-refundable if sponsor withdraws or fails to participate.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-105-TC-HOLIDAY-FOOD';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='Buckler Shows current West Palm 2026 Holiday Craft Fair page + official vendor application path — checked Sep. 30, 2026; recovered $400 price not carried forward',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED',
      'schedule_text','Dec. 5, 2026 · 10:00 AM–5:00 PM; Dec. 6 · 10:00 AM–4:00 PM',
      'venue_text','South Florida Fairgrounds — West Expo · 9067 Southern Blvd, West Palm Beach, FL 33411','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT OFFICIAL VENDOR APPLICATION PATH · COMMERCIAL/HOME-SERVICE ELIGIBILITY AND PRICE TO CONFIRM',
      'current_cost_text','Not verified in current public vendor page; recovered $400 price cleared','current_cost_status','NOT VERIFIED',
      'next_action','Call Buckler Shows at 386-860-0092 and confirm home-service eligibility, current 10×10 price, remaining December inventory and terms before applying.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-094-BUCKLER-WPB-DEC';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='City of Greenacres current Centennial Close-Out Celebration 2026 page — checked Sep. 30, 2026',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Dec. 5, 2026 · 3:00 PM–9:00 PM',
      'venue_text','Samuel J. Ferreri Community Park · 2905 Jog Road, Greenacres, FL','venue_status','CURRENT OFFICIAL',
      'booking_status','EVENT/FOOD AND CRAFT VENDORS CURRENT-VERIFIED · PARADISE BUSINESS PARTICIPATION TERMS TO REQUEST',
      'current_cost_text','Not verified','current_cost_status','NOT VERIFIED',
      'next_action','Contact Nichole King to confirm whether a home-improvement business can participate as vendor/sponsor and obtain current price, deadline, footprint and availability.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-096-GREENACRES-CENTENNIAL';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='Howard Alan Events current 26th Annual Downtown Delray Beach Art Festival on 4th page — checked Sep. 30, 2026',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED',
      'schedule_text','Dec. 5–6, 2026 · 10:00 AM–5:00 PM both days',
      'venue_text','401 E Atlantic Avenue / NE 4th Ave corridor, Delray Beach, FL','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT ARTIST FESTIVAL VERIFIED · PARADISE COMMERCIAL/SPONSOR ACTIVATION NOT PUBLICLY ESTABLISHED',
      'current_cost_text','Not verified for non-artist commercial participation','current_cost_status','NOT VERIFIED',
      'next_action','Contact Howard Alan Events at info@artfestival.com / 561-746-6615 and ask whether a non-artist commercial sponsorship or activation exists; do not use the artist application for Paradise.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-095-HOWARD-ALAN-DELRAY';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',
    price_text='$600–$20,000 sponsorship tiers',
    source_basis='Marine Industries Association of Palm Beach County current 32nd Annual Holiday Boat Parade 2026 page + current sponsor inventory newsletter — checked Sep. 30, 2026',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Dec. 5, 2026 · rain or shine',
      'booking_status','CURRENT 2026 SPONSORSHIP INVENTORY PUBLISHED',
      'current_cost_text','$600 Bosun · $1,000 First Mate · $2,500 Captain · $5,000 Judging/Awards/Fireworks Destination · $10,000 Admiral · $20,000 Presenting',
      'current_cost_status','CURRENT OFFICIAL',
      'next_action','Contact MIAPBC and confirm the lowest tier that includes a meaningful physical or lead-generation activation; current newsletter still shows multiple $600–$10,000 tiers available.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-093-PB-HOLIDAY-BOAT';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='City of Pembroke Pines current 2026 Special Events page — SnowFest Dec. 5 and vendor/sponsor contact checked Sep. 30, 2026',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Dec. 5, 2026',
      'booking_status','CURRENT 2026 SNOWFEST VERIFIED · CITY VENDOR/SPONSOR INQUIRY ACTIVE',
      'current_cost_text','Not publicly posted','current_cost_status','NOT VERIFIED',
      'next_action','Contact Francie Novo at fnovo@ppines.com / 954-392-2116 for SnowFest vendor/sponsor pricing, deadline, footprint, category eligibility, insurance and remaining inventory.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-097-PEMBROKE-SNOWFEST';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='City of Port St. Lucie current Festival of Lights 2026 page — event/vendor presence checked Sep. 30, 2026',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Dec. 5, 2026 · 2:00 PM–10:00 PM',
      'venue_text','MIDFLORIDA Event Center · 9221 SE Event Center Place, Port St. Lucie, FL 34952','venue_status','CURRENT OFFICIAL',
      'booking_status','EVENT/HOLIDAY VENDORS CURRENT-VERIFIED · BUSINESS/COMPANY BOOTH TERMS TO CONFIRM',
      'current_cost_text','Not verified','current_cost_status','NOT VERIFIED',
      'next_action','Contact specialevents@cityofpsl.com / 772-344-4139 for current business/company booth eligibility, fee, deadline, footprint, insurance and remaining inventory.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-091-PSL-FESTIVAL-LIGHTS';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='West Palm Beach Beer Wine & Spirits Fest current Dec. 5, 2026 official event page — event/vendors verified; recovered $500 activation not current-source supported',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Dec. 5, 2026 · session 1:00 PM–4:30 PM',
      'venue_text','Meyer Amphitheater · 104 Datura St, West Palm Beach, FL 33401','venue_status','CURRENT OFFICIAL',
      'booking_status','EVENT/MERCHANT VENDORS CURRENT-VERIFIED · PARADISE EXPERIENTIAL-MARKETING PACKAGE TO RECONFIRM',
      'current_cost_text','Not verified; recovered $500 activation amount cleared','current_cost_status','NOT VERIFIED',
      'next_action','Contact Evan Berman at evan@evanbermanproductions.com / 631-807-8494 for a current Paradise-compatible merchant/experiential package, price, footprint and availability.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-092-WPB-BEER-WINE';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='Cars & Coffee Palm Beach current 2026 event schedule + official sponsor/vendor inquiry page — checked Sep. 30, 2026',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED',
      'schedule_text','Dec. 6, 2026 · gates 7:00 AM · official event 8:00 AM–12:00 PM',
      'venue_text','Boca Raton Innovation Campus (BRiC) · 4850 T-Rex Ave, Boca Raton, FL 33431','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT SPONSOR/VENDOR INQUIRY ACTIVE',
      'current_cost_text','Not publicly posted','current_cost_status','NOT VERIFIED',
      'next_action','Submit the current sponsor/vendor inquiry for Dec. 6 and request pricing, footprint, exclusivity, inventory and lead-capture rights; email Support@carsandcoffeepb.com if no response within 48 hours.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-099-CARS-COFFEE-DEC';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',
    price_text='$250 Silver · $700 Gold · $1,500 Platinum · $2,500 Title',
    source_basis='Martin County Parks & Recreation current Music at the Mansion series + sponsorship tiers — checked Sep. 30, 2026; exact December 2026 occurrence date remains unverified',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT SERIES VERIFIED · EXACT DECEMBER DATE NOT VERIFIED',
      'schedule_text','Current County page confirms Music at the Mansion runs December–May; estimated sort date remains Dec. 6, 2026 until the exact December occurrence is posted.',
      'venue_text','Mansion at Tuckahoe outdoor amphitheater at Indian RiverSide Park · Jensen Beach, FL','venue_status','CURRENT OFFICIAL SERIES VENUE',
      'booking_status','CURRENT MUSIC AT THE MANSION SPONSORSHIP / VENDOR-ACTIVATION PACKAGE PUBLISHED',
      'current_cost_text','$250 Silver · $700 Gold · $1,500 Platinum · $2,500 Title','current_cost_status','CURRENT OFFICIAL',
      'attendance_text','Martin County states turnout exceeds 1,200 participants per concert.',
      'booth_placement_text','Silver includes 10×10 vendor space; Gold adds table, two chairs and tent.',
      'next_action','Contact events@martin.fl.us / 772-221-1430 to confirm the exact December 2026 concert date and current sponsor inventory before booking.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-101-MUSIC-MANSION';

update public.shows_app_research_calendar_controls r
set source_refs=coalesce(source_refs,'[]'::jsonb)||jsonb_build_array(
  jsonb_build_object('url',r.detail_data->>'official_source_url','title',coalesce(nullif(r.detail_data->>'source_label',''),'Current official source'),'checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED')
),updated_at=now()
where control_id in (
 'R2026-090-SPACE-COAST-HOLIDAY-FOOD','R2026-086-WPB-HOLIDAY-PARADISE','R2026-089-FP-FRIDAY-FEST-DEC',
 'R2026-087-GREENACRES-HOLIDAY','R2026-088-HALLANDALE-HOLIDAY','R2026-105-TC-HOLIDAY-FOOD',
 'R2026-094-BUCKLER-WPB-DEC','R2026-096-GREENACRES-CENTENNIAL','R2026-095-HOWARD-ALAN-DELRAY',
 'R2026-093-PB-HOLIDAY-BOAT','R2026-097-PEMBROKE-SNOWFEST','R2026-091-PSL-FESTIVAL-LIGHTS',
 'R2026-092-WPB-BEER-WINE','R2026-099-CARS-COFFEE-DEC','R2026-101-MUSIC-MANSION'
)
and r.detail_data->>'official_source_url' is not null
and not exists (
 select 1 from jsonb_array_elements(coalesce(r.source_refs,'[]'::jsonb)) e
 where e->>'url'=r.detail_data->>'official_source_url' and e->>'checked_at'='2026-09-30'
);

do $$
declare before_n int; after_n int; bad int;
begin
  select n into before_n from _b8_before;
  select count(*) filter (where active and calendar_visibility and plan_year=2026 and research_status='CURRENT_REVERIFIED') into after_n
  from public.shows_app_research_calendar_controls;
  if after_n-before_n<>15 then raise exception 'expected 15 Dec 3-6 batch8 rows; before %, after %',before_n,after_n; end if;

  select count(*) into bad
  from public.shows_app_research_calendar_controls
  where control_id in (
   'R2026-090-SPACE-COAST-HOLIDAY-FOOD','R2026-086-WPB-HOLIDAY-PARADISE','R2026-089-FP-FRIDAY-FEST-DEC',
   'R2026-087-GREENACRES-HOLIDAY','R2026-088-HALLANDALE-HOLIDAY','R2026-105-TC-HOLIDAY-FOOD',
   'R2026-094-BUCKLER-WPB-DEC','R2026-096-GREENACRES-CENTENNIAL','R2026-095-HOWARD-ALAN-DELRAY',
   'R2026-093-PB-HOLIDAY-BOAT','R2026-097-PEMBROKE-SNOWFEST','R2026-091-PSL-FESTIVAL-LIGHTS',
   'R2026-092-WPB-BEER-WINE','R2026-099-CARS-COFFEE-DEC','R2026-101-MUSIC-MANSION'
  ) and (research_status<>'CURRENT_REVERIFIED' or detail_data->>'current_source_checked_at'<>'2026-09-30');
  if bad<>0 then raise exception 'batch8 verification failed for % rows',bad; end if;

  if (select price_text from public.shows_app_research_calendar_controls where control_id='R2026-094-BUCKLER-WPB-DEC') is not null then
    raise exception 'Buckler stale recovered price not cleared';
  end if;
  if (select price_text from public.shows_app_research_calendar_controls where control_id='R2026-092-WPB-BEER-WINE') is not null then
    raise exception 'WPB Beer stale activation price not cleared';
  end if;
  if (select event_start from public.shows_app_research_calendar_controls where control_id='R2026-088-HALLANDALE-HOLIDAY') is not null then
    raise exception 'Hallandale recurring date must remain estimated';
  end if;
  if (select event_start from public.shows_app_research_calendar_controls where control_id='R2026-101-MUSIC-MANSION') is not null then
    raise exception 'Music at Mansion exact date must remain estimated';
  end if;
end $$;
