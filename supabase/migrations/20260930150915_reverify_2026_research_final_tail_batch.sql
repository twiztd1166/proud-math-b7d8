
create temporary table _tail_before on commit drop as
select count(*) filter (where active and calendar_visibility and plan_year=2026 and research_status='CURRENT_REVERIFIED') n
from public.shows_app_research_calendar_controls;

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='City of Port St. Lucie current River Nights 2026–27 page — Dec. 10 occurrence plus current craft-vendor/exhibitor and sponsor routes checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Dec. 10, 2026 · 5:30 PM–8:30 PM',
      'venue_text','The Event Lawn at The Port District · 2454 SE Westmoreland Blvd, Port St. Lucie, FL 34952','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT CRAFT VENDOR/EXHIBITOR SIGN-UP AND SPONSOR ROUTES PUBLISHED','current_cost_text','Not publicly posted','current_cost_status','NOT VERIFIED',
      'next_action','Use the current craft vendor/exhibitor sign-up route or contact Special Events at 772-344-4139 / specialevents@cityofpsl.com to confirm home-improvement eligibility, fee, footprint, deadline and remaining Dec. 10 inventory.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-102-PSL-RIVER-NIGHTS-DEC';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',
    price_text='$250 Silver / $700 Gold / $1,500 Platinum / $2,500 Title',
    source_basis='Martin County Parks & Recreation current Winter Fest 2026 sponsorship page — checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Dec. 11, 2026',
      'venue_text','The Mansion at Tuckahoe outdoor amphitheater · Jensen Beach, FL','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT WINTER FEST SPONSORSHIP TIERS PUBLISHED · INVENTORY TO CONFIRM',
      'current_cost_text','$250 Silver · $700 Gold · $1,500 Platinum · $2,500 Title','current_cost_status','CURRENT OFFICIAL',
      'attendance_text','Martin County states Winter Fest draws more than 1,000 participants.',
      'booth_placement_text','Silver includes a 10×10 vendor space; Gold adds table, 2 chairs and tent.',
      'next_action','Contact events@martin.fl.us / 772-221-1430 now to confirm remaining Silver or Gold inventory, application cutoff and load-in before booking.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-103-MARTIN-WINTER-FEST';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='City of Cocoa current Holiday Tree Lighting and Movie in the Park 2026 calendar — checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Dec. 11, 2026 · 5:00 PM–8:30 PM',
      'venue_text','Cocoa Riverfront Park · 401 Riveredge Blvd, Cocoa, FL 32922','venue_status','CURRENT OFFICIAL',
      'booking_status','EVENT CURRENT-VERIFIED · PUBLIC BUSINESS/VENDOR/SPONSOR ROUTE NOT PUBLISHED',
      'current_cost_text','Not verified','current_cost_status','NOT VERIFIED',
      'next_action','Contact Cocoa Leisure Services at 321-639-3500 / nharris@cocoafl.gov and ask whether a business sponsor or promotional booth is available; do not assume the public event page creates a commercial vendor lane.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-104-COCOA-TREE';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',
    price_text='$50 vendor / $250 Event Sponsor / $1,500 Featured Sponsor',
    source_basis='Village of Wellington current Holiday Boat Parade 2026 event + sponsorship opportunities pages — checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Dec. 12, 2026 · 6:30 PM–8:00 PM',
      'venue_text','Town Center Promenade · 12150 Forest Hill Boulevard, Wellington, FL 33414','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT VENDOR/SPONSOR OPPORTUNITIES PUBLISHED',
      'current_cost_text','$50 vendor · $250 Event Sponsor · $1,500 Featured Sponsor','current_cost_status','CURRENT OFFICIAL',
      'attendance_text','Village sponsorship page lists attendance of approximately 2,300.',
      'booth_placement_text','Vendor and sponsor packages include a 10×10 tent, table and chairs.',
      'next_action','Submit the Sponsor-Vendor Request Form and confirm remaining $50 vendor inventory; use the $250 sponsor tier only if logo/signage benefits justify the upgrade.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-106-WELLINGTON-BOAT';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='Seminole Hard Rock Winterfest Boat Parade current 2026 parade + sponsors/partners pages — checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Dec. 12, 2026 · preshow 5:30 PM · parade/fireworks 6:00 PM',
      'booking_status','CURRENT 2026 SPONSORSHIP DECK AND CORPORATE SPONSOR/VENDOR INQUIRY ACTIVE',
      'current_cost_text','Not publicly extracted — custom sponsorship/vendor quote required','current_cost_status','NOT VERIFIED',
      'attendance_text','Winterfest states more than 1 million viewers along the 12-mile parade route and more than $50 million in Broward County economic impact.',
      'next_action','Contact Winterfest at 954-767-0686 / kathy@winterfestparade.com for the current 2026 sponsorship deck and a Paradise activation proposal covering cost, footprint, category rights, event access and lead-generation permissions.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-111-WINTERFEST-BOAT';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',
    price_text='$25 commercial parade entry',
    source_basis='Brevard County Parks & Recreation current Sep. 22, 2026 parade-registration notice + live 2026 WebTrac registration + City of Cocoa festival page — checked Sep. 30, 2026',
    source_refs=case when exists (
      select 1 from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e
      where e->>'url'='https://flbrevardweb.myvscloud.com/webtrac/web/search.html?display=detail&module=global&type=SPEVT'
        and e->>'checked_at'='2026-09-30'
    ) then source_refs else coalesce(source_refs,'[]'::jsonb)||jsonb_build_array(
      jsonb_build_object('url','https://flbrevardweb.myvscloud.com/webtrac/web/search.html?display=detail&module=global&type=SPEVT','title','Brevard County WebTrac — Cocoa / Rockledge Holiday Parade 2026 registration','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED')
    ) end,
    detail_data=detail_data || jsonb_build_object(
      'action_url','https://flbrevardweb.myvscloud.com/webtrac/web/search.html?display=detail&module=global&type=SPEVT',
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED',
      'schedule_text','Dec. 12, 2026 · parade 10:00 AM–12:00 PM · festival 11:00 AM–3:00 PM',
      'venue_text','Parade: Rockledge High School through Historic Cocoa Village to Lee Wenner Park · Festival: Cocoa Riverfront Park, 401 Riveredge Blvd, Cocoa, FL 32922',
      'venue_status','CURRENT OFFICIAL','booking_status','CURRENT COMMERCIAL PARADE REGISTRATION OPEN · FESTIVAL BUSINESS BOOTH TERMS TO CONFIRM',
      'current_cost_text','$25 Commercial parade entry','current_cost_status','CURRENT OFFICIAL',
      'next_action','Use the current Brevard County WebTrac registration for the $25 commercial parade entry if branding exposure is desired; separately contact Cocoa Leisure Services for any festival sponsor/booth inventory.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-110-COCOA-ROCKLEDGE-PARADE';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',
    price_text='$500 Silver / $1,000 Gold',
    source_basis='City of Delray Beach current 2026–27 sponsorship application — Holiday Parade Dec. 12, 2026 — checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Dec. 12, 2026',
      'booking_status','CURRENT 2026 HOLIDAY PARADE SPONSORSHIP APPLICATION PUBLISHED',
      'current_cost_text','$500 Silver · $1,000 Gold','current_cost_status','CURRENT OFFICIAL',
      'next_action','Contact Delray Beach Special Events at 561-243-7250 option 3 / espinosan@mydelraybeach.com and confirm remaining Gold/Silver inventory, application cutoff, parade-entry logistics and physical activation rights before payment.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-109-DELRAY-HOLIDAY-PARADE';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='Supercar Saturdays Florida current official 2026 schedule and sponsor/vendor contact — checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Dec. 12, 2026 · 9:00 AM–12:00 PM',
      'venue_text','Seminole Hard Rock Hotel & Casino · 1 Seminole Way, Hollywood, FL','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT SPONSOR/VENDOR INQUIRY ACTIVE','current_cost_text','Not publicly posted','current_cost_status','NOT VERIFIED',
      'next_action','Email supercarsaturdaysflorida@gmail.com or call Floyd Rag at 305-725-3096 for current sponsor/vendor pricing, footprint, exclusivity, remaining Dec. 12 inventory and lead-capture rights.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-112-SUPERCAR-SAT-DEC';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',
    price_text='$190 single 10×10 weekend booth · $25 corner upgrade',
    source_basis='Florida Art & Craft Festivals current Vero Beach Outlets Holiday Bazaar 2026 application/info page — checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Dec. 12–13, 2026',
      'venue_text','Vero Beach Outlets · 1824 94th Dr, Vero Beach, FL 32966','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT 2026 ONLINE VENDOR APPLICATION PUBLISHED · COMMERCIAL/SERVICE ELIGIBILITY TO CONFIRM',
      'current_cost_text','$190 single 10×10 for the weekend · $20 multi-booth discount per additional booth · $25 corner upgrade · $25 cancellation fee after approved/processed application',
      'current_cost_status','CURRENT OFFICIAL','booth_placement_text','Single booth is 10×10; tents must be weighted for 40 MPH gusts.',
      'next_action','Contact info@latitude88.com / 772-492-6105 before applying to confirm Paradise qualifies as a commercial/service exhibitor or sponsor; if accepted, the current 10×10 weekend booth price is $190.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-108-VERO-OUTLETS';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='Village of Wellington current 42nd Annual Holiday Parade 2026 page — Vendor Village current but application details still pending — checked Sep. 30, 2026',
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED',
      'schedule_text','Dec. 13, 2026 · Vendor Village opens 10:00 AM · parade 1:30 PM',
      'venue_text','Vendor Village: Wellington Amphitheater, 12100 Forest Hill Boulevard · Parade: Forest Hill Boulevard from Wellington Trace to Ken Adams Way',
      'venue_status','CURRENT OFFICIAL','booking_status','CURRENT 2026 PARADE / VENDOR VILLAGE VERIFIED · VENDOR APPLICATION DETAILS NOT YET PUBLISHED',
      'current_cost_text','Not yet published','current_cost_status','PENDING CURRENT PUBLICATION',
      'next_action','Monitor the current Wellington Holiday Parade page and contact the Village/partner chambers for Vendor Village application timing, business eligibility, fee, footprint and remaining inventory; do not infer terms from other Wellington events.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-114-WELLINGTON-HOLIDAY-PARADE';

do $$
declare before_n int; after_n int; bad int;
begin
  select n into before_n from _tail_before;
  select count(*) filter (where active and calendar_visibility and plan_year=2026 and research_status='CURRENT_REVERIFIED') into after_n
  from public.shows_app_research_calendar_controls;
  if after_n-before_n <> 10 then raise exception 'expected 10 newly current-reverified tail rows; before %, after %',before_n,after_n; end if;

  select count(*) into bad
  from public.shows_app_research_calendar_controls
  where control_id in (
    'R2026-102-PSL-RIVER-NIGHTS-DEC','R2026-103-MARTIN-WINTER-FEST','R2026-104-COCOA-TREE',
    'R2026-106-WELLINGTON-BOAT','R2026-111-WINTERFEST-BOAT','R2026-110-COCOA-ROCKLEDGE-PARADE',
    'R2026-109-DELRAY-HOLIDAY-PARADE','R2026-112-SUPERCAR-SAT-DEC','R2026-108-VERO-OUTLETS',
    'R2026-114-WELLINGTON-HOLIDAY-PARADE'
  )
  and (research_status<>'CURRENT_REVERIFIED' or date_confidence<>'CURRENT_VERIFIED' or detail_data->>'current_source_checked_at'<>'2026-09-30');
  if bad<>0 then raise exception 'tail batch verification failed for % rows',bad; end if;

  if (select research_status from public.shows_app_research_calendar_controls where control_id='R2026-098-MELBOURNE-HOLIDAY-ART')<>'RECOVERED_NOT_REVERIFIED' then
    raise exception 'Melbourne bounded exception was unexpectedly promoted';
  end if;
end $$;
