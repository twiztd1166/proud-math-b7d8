
create temporary table _b3_before on commit drop as
select count(*) filter (where active and calendar_visibility and plan_year=2026 and research_status='CURRENT_REVERIFIED') n
from public.shows_app_research_calendar_controls;

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',
    price_text='$500 Bronze / $750 Silver / $1,000 Gold Sponsor',
    source_basis='City of Delray Beach current 2026 Special Events Sponsorship Opportunities + 2026 KidsFest sponsorship package — checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Oct. 24, 2026 · 11:00 AM–3:00 PM',
      'venue_text','Old School Square · 51 N Swinton Ave, Delray Beach, FL','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT 2026 KIDSFEST SPONSORSHIP ROUTE PUBLISHED · INVENTORY/DEADLINE TO CONFIRM',
      'current_cost_text','$500 Bronze · $750 Silver · $1,000 Gold','current_cost_status','CURRENT OFFICIAL',
      'attendance_text','City package states average attendance of 4,500+.',
      'next_action','Contact Delray Beach Special Events now to confirm remaining Gold/Silver/Bronze inventory and the application cutoff; sponsorship benefits include a promotional tent.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-030-DELRAY-KIDSFEST';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='Town of Malabar current 2026 Fallfest calendar with current Vendor Participant Sign Up Form link — checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Oct. 24, 2026 · 4:00 PM–7:00 PM',
      'venue_text','Malabar Community Park · 1850 Malabar Rd, Malabar, FL','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT 2026 VENDOR PARTICIPANT SIGN-UP ROUTE PUBLISHED · FEE/DEADLINE TO CONFIRM',
      'current_cost_text','Not reverified from the current sign-up form','current_cost_status','NOT VERIFIED',
      'next_action','Use the current Vendor Participant Sign Up Form or call 321-727-7764 to confirm the current for-profit vendor fee, deadline, Paradise eligibility and remaining space.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-031-MALABAR-FALLFEST';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='Caribbean Culture Fest current official 2026 site — event, Culture Market and sponsor/vendor inquiry checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Oct. 24, 2026 · gates 4:00 PM · show 6:00 PM',
      'venue_text','North Miami Stadium · 2555 NE 151 Street, North Miami, FL','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT SPONSORSHIP AND VENDOR INQUIRIES OPEN · CUSTOM ACTIVATION PACKAGES',
      'current_cost_text','Custom quote required','current_cost_status','CURRENT ROUTE / PRICE TO CONFIRM',
      'attendance_text','Official site describes a 12,000-capacity stadium and a Culture Market with 40+ vendors.',
      'next_action','Call 305-244-8508 for a Paradise-specific sponsor/vendor proposal covering vendor space, onsite activation, brand integration, price, deadline and category availability.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-032-NORTH-MIAMI-CARIBBEAN';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',
    price_text='$75 commercial booth before Oct. 13 / $100 after Oct. 13',
    source_basis='Indian River Lagoon Science Festival current 2026 exhibitor registration and event information — checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Oct. 24, 2026 · 10:00 AM–3:00 PM',
      'venue_text','Museum Pointe Park · 414 Seaway Drive, Fort Pierce, FL','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT 2026 COMMERCIAL EXHIBITOR REGISTRATION OPEN · STEAM ACTIVITY REQUIRED',
      'current_cost_text','$75 Commercial Business before Oct. 13 · $100 after Oct. 13 · optional $25 electrical','current_cost_status','CURRENT OFFICIAL',
      'eligibility_text','Commercial exhibitors must provide a hands-on STEAM activity or demonstration; organizer may exclude non-STEAM exhibits.',
      'booth_placement_text','Commercial package includes tented 10×10, 8-foot table, 2 chairs, sign and unloading assistance.',
      'next_action','Only pursue if Paradise can present a genuine hands-on STEAM/building-science activity. Confirm organizer acceptance before paying the commercial exhibitor fee.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-034-IRL-SCIENCE';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',
    source_basis='Sun Sentinel PRIME Expo South Florida current 2026 official event + B2B exhibitor pages — checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Oct. 25, 2026 · 8:30 AM–2:00 PM',
      'venue_text','Boca Raton Marriott at Boca Center · 5150 Town Center Circle, Boca Raton, FL','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT LIMITED EXHIBITOR BOOTHS / SPONSORSHIP INQUIRY OPEN',
      'current_cost_text','Not publicly listed — request current exhibitor quote','current_cost_status','NOT VERIFIED',
      'eligibility_text','Official event content expressly includes Home Improvement as a topic.',
      'attendance_text','Official B2B page describes thousands of active adults and seniors.',
      'next_action','Email sflevents@sunsentinel.com now for the current Boca exhibitor package, booth price, deadline, footprint, category exclusivity and remaining inventory.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-035-PRIME-BOCA';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',
    source_basis='Space Coast State Fair current 2026 official fair + vendor-information pages — checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Oct. 29–Nov. 15, 2026',
      'booking_status','CURRENT COMMERCIAL VENDOR APPLICATION ROUTE LIVE','current_cost_text','Rate by phone — 321-323-4460',
      'current_cost_status','CURRENT ROUTE / PRICE TO CONFIRM','eligibility_text','Current official vendor page states commercial vendors are welcome.',
      'next_action','Call 321-323-4460 or email contact@SpaceCoastDaily.com for current commercial-vendor pricing, booth size, deadline, insurance, load-in and remaining inventory.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-039-SPACE-COAST-STATE-FAIR';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',
    price_text='$100 nonmember / $65 MSVB Business Member',
    source_basis='Main Street Vero Beach current Monster Mash on Main Street / Downtown Friday page — checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Oct. 30, 2026 · 6:00 PM–9:00 PM',
      'booking_status','CURRENT VENDOR ROUTE PUBLISHED · DEADLINE LANGUAGE CONFLICT REQUIRES DIRECT CONFIRMATION',
      'deadline_text','Current page conflicts: event section says application due Oct. 6 while recurring guidance says vendor applications open on the 7th. Do not treat either as final without organizer confirmation.',
      'current_cost_text','$100 nonmember · $65 MSVB Business Member vendor spot','current_cost_status','CURRENT OFFICIAL',
      'eligibility_text','Current vendor guidance permits onsite service vendors and encourages interactive booths; general information-only booths are limited.',
      'next_action','Call Main Street Vero Beach at 772-643-6782 now to resolve the Oct. 6/Oct. 7 application conflict and confirm whether Oct. 30 vendor inventory remains before payment.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-040-VERO-DOWNTOWN-FRIDAY';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',deadline_date=date '2026-10-30',
    price_text='$750 10×10 · larger packages up to $2,250',
    source_basis='Live Eventeny Light Up Dania Beach 2026 Business Exhibitor application — checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Nov. 14, 2026 · 5:00 PM–9:00 PM',
      'booking_status','CURRENT BUSINESS EXHIBITOR APPLICATION ACTIVE','deadline_text','Oct. 30, 2026 at 11:59 PM ET',
      'current_cost_text','$750 10×10 · larger packages up to $2,250','current_cost_status','CURRENT OFFICIAL',
      'booth_placement_text','Standard booth is 10×10; vendor supplies equipment. Electricity available, but vendor must provide its own needs.',
      'commitment_terms_text','COI naming the City is required. Written acceptance is due by Nov. 1. No refunds for rain or acts of nature.',
      'next_action','Submit before Oct. 30 at 11:59 PM if pursuing; confirm category availability and insurance compliance before payment.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-075-LIGHT-UP-DANIA';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',event_end=date '2026-11-01',price_text=null,
    source_basis='City of Port St. Lucie current 2026 Fall Fun Fest page — checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED',
      'schedule_text','Oct. 30, 2026 · 5:00 PM–10:00 PM; Oct. 31 · 12:00 PM–10:00 PM; Nov. 1 · 1:00 PM–6:00 PM',
      'venue_text','MIDFLORIDA Credit Union Event Center · Port St. Lucie, FL','venue_status','CURRENT OFFICIAL',
      'booking_status','EVENT/LOCAL MARKETPLACE VENDORS CURRENT-VERIFIED · BUSINESS/COMPANY BOOTH TERMS TO CONFIRM',
      'current_cost_text','Not verified','current_cost_status','NOT VERIFIED',
      'next_action','Contact Port St. Lucie Special Events for current business/company booth eligibility, price, deadline, footprint, insurance and remaining inventory for the Oct. 30–Nov. 1 event.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-041-PSL-FALL-FUN';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',
    source_basis='Discover The Palm Beaches current 2026 LagoonFest page with current exhibitor application and sponsor deck — checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Oct. 31, 2026 · 8:30 AM–2:00 PM',
      'venue_text','201 Fern Street, West Palm Beach, FL','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT 2026 EXHIBITOR APPLICATION AND SPONSOR DECK PUBLISHED',
      'current_cost_text','Not verified','current_cost_status','NOT VERIFIED',
      'next_action','Open the current exhibitor application or sponsor deck and confirm Paradise eligibility, booth/sponsor pricing, deadline, footprint and remaining inventory.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-042-LAGOONFEST';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='Wicked Manors current official 2026 event and sponsorship pages — checked Sep. 30, 2026; prior 2025 deck pricing not carried forward',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Oct. 31, 2026 · 6:00 PM–11:00 PM',
      'venue_text','Wilton Drive · Wilton Manors, FL','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT 2026 SPONSORSHIP OPPORTUNITIES ACTIVE · 2026 PRICING TO REQUEST',
      'current_cost_text','Not verified for 2026','current_cost_status','NOT VERIFIED',
      'attendance_text','Official sponsorship page describes attendance in the tens of thousands.',
      'next_action','Contact Rebecca D’Amico for the current 2026 sponsorship deck and a Paradise-compatible activation proposal; do not use the stale 2025 package pricing.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-044-WICKED-MANORS';

update public.shows_app_research_calendar_controls
set event_label='Hallandale Beach Halloween Trail of Treats',
    research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='City of Hallandale Beach current 2026 Halloween Trail of Treats calendar + vendor/sponsorship opportunity route — checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'source_label','City of Hallandale Beach current Halloween Trail of Treats event + vendor/sponsorship opportunities',
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Oct. 31, 2026 · 6:00 PM–8:00 PM',
      'venue_text','OB Johnson Park · 1000 NW 8th Ave, Hallandale Beach, FL','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT VENDOR/SPONSOR/PARTNER OPPORTUNITY ROUTE PUBLISHED',
      'current_cost_text','Not verified','current_cost_status','NOT VERIFIED',
      'next_action','Use the City Vendor or Sponsorship Opportunities route or contact HBParksRec@coHB.org / 954-457-1452 for Paradise eligibility, price, deadline, footprint and remaining inventory.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-045-HALLANDALE-HALLOWEEN';

do $$
declare before_n int; after_n int; bad int;
begin
  select n into before_n from _b3_before;
  select count(*) filter (where active and calendar_visibility and plan_year=2026 and research_status='CURRENT_REVERIFIED') into after_n
  from public.shows_app_research_calendar_controls;
  if after_n-before_n <> 12 then raise exception 'expected 12 newly reverified rows; before %, after %',before_n,after_n; end if;

  select count(*) into bad
  from public.shows_app_research_calendar_controls
  where control_id in (
    'R2026-030-DELRAY-KIDSFEST','R2026-031-MALABAR-FALLFEST','R2026-032-NORTH-MIAMI-CARIBBEAN',
    'R2026-034-IRL-SCIENCE','R2026-035-PRIME-BOCA','R2026-039-SPACE-COAST-STATE-FAIR',
    'R2026-040-VERO-DOWNTOWN-FRIDAY','R2026-075-LIGHT-UP-DANIA','R2026-041-PSL-FALL-FUN',
    'R2026-042-LAGOONFEST','R2026-044-WICKED-MANORS','R2026-045-HALLANDALE-HALLOWEEN'
  )
  and (research_status<>'CURRENT_REVERIFIED' or detail_data->>'current_source_checked_at'<>'2026-09-30');
  if bad<>0 then raise exception 'batch3 verification failed for % rows',bad; end if;

  if (select event_end from public.shows_app_research_calendar_controls where control_id='R2026-041-PSL-FALL-FUN') <> date '2026-11-01' then
    raise exception 'PSL Fall Fun Fest end date not corrected';
  end if;
  if (select event_label from public.shows_app_research_calendar_controls where control_id='R2026-045-HALLANDALE-HALLOWEEN') <> 'Hallandale Beach Halloween Trail of Treats' then
    raise exception 'Hallandale title not normalized';
  end if;
  if (select deadline_date from public.shows_app_research_calendar_controls where control_id='R2026-040-VERO-DOWNTOWN-FRIDAY') is not null then
    raise exception 'Vero Downtown conflicting deadline should remain unstructured';
  end if;
end $$;
