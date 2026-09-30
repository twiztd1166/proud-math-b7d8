
create temporary table _b7_before on commit drop as
select count(*) filter (where active and calendar_visibility and plan_year=2026 and research_status='CURRENT_REVERIFIED') n
from public.shows_app_research_calendar_controls;

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',
    deadline_date=date '2026-11-15',price_text='$500–$10,000+ sponsorship tiers',
    source_basis='Rotary Club of Weston current 2025–26 Run for Tomorrow sponsorship form + City of Weston 2026 event page — checked Sep. 30, 2026',
    source_refs=case when exists (
      select 1 from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e
      where e->>'url'='https://www.westonfl.org/Home/Components/Calendar/Event/3732/19?selcat=11&sortn=EName&toggle=all'
        and e->>'checked_at'='2026-09-30'
    ) then source_refs else coalesce(source_refs,'[]'::jsonb)||jsonb_build_array(
      jsonb_build_object('url','https://www.westonfl.org/Home/Components/Calendar/Event/3732/19?selcat=11&sortn=EName&toggle=all','title','City of Weston — 29th Annual Rotary Run for Tomorrow 2026','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED'),
      jsonb_build_object('url','https://form.jotform.com/241377280948163','title','2025-26 Run for Tomorrow Sponsorship Form','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED')
    ) end,
    detail_data=detail_data||jsonb_build_object(
      'official_source_url','https://www.westonfl.org/Home/Components/Calendar/Event/3732/19?selcat=11&sortn=EName&toggle=all',
      'action_url','https://form.jotform.com/241377280948163','source_label','City of Weston current 2026 event + Rotary current sponsorship form',
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED',
      'schedule_text','Dec. 6, 2026 · event 6:00 AM–12:00 PM · Health & Fitness Festival participation available to confirmed sponsors',
      'venue_text','Cypress Bay High School · 18600 Vista Park Boulevard, Weston, FL 33332','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT SPONSORSHIP / HEALTH & FITNESS FESTIVAL BOOTH APPLICATION ACTIVE',
      'deadline_text','Sponsorship registration deadline Nov. 15, 2026',
      'current_cost_text','$500 Bronze · $1,000 Silver · $2,500 Gold · $5,000 Platinum · $10,000+ Diamond','current_cost_status','CURRENT OFFICIAL',
      'booth_placement_text','Confirmed sponsors may elect a Health & Fitness Festival booth; organizer provides a 10×10 tent, one 6-foot table and two chairs unless otherwise requested.',
      'commitment_terms_text','Certificate of Insurance is mandatory.',
      'next_action','Submit by Nov. 15 if pursuing. Plan a simple health/fitness/wellness activity for the booth and have COI ready.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-100-WESTON-RUN';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='City of Port St. Lucie current Special Events page — International Fest Nov. 21, 2026 event/vendor presence checked Sep. 30, 2026',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Nov. 21, 2026 · 5:00 PM–9:00 PM',
      'booking_status','EVENT/VENDORS CURRENT-VERIFIED · PARADISE BUSINESS-BOOTH TERMS TO CONFIRM',
      'current_cost_text','Not verified','current_cost_status','NOT VERIFIED',
      'next_action','Contact Port St. Lucie Special Events at specialevents@cityofpsl.com / 772-344-4139 for business/company booth eligibility, current fee, deadline, footprint, insurance and remaining inventory.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-080-PSL-INTERNATIONAL';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',price_text=null,
    source_basis='Turkey Bash current 2026 sponsor/brand-activation pages — checked Sep. 30, 2026; prior fixed $500 sponsor amount not carried forward',
    source_refs=case when exists (
      select 1 from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e
      where e->>'url'='https://turkey-bash.com/services/sponsors/' and e->>'checked_at'='2026-09-30'
    ) then source_refs else coalesce(source_refs,'[]'::jsonb)||jsonb_build_array(
      jsonb_build_object('url','https://turkey-bash.com/sponsors/','title','Turkey Bash 2026 — Sponsors and Partners','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED'),
      jsonb_build_object('url','https://turkey-bash.com/services/sponsors/','title','Turkey Bash 2026 — Sponsor & Brand Activation Inquiry','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED')
    ) end,
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Nov. 21, 2026 · 11:00 AM–5:00 PM',
      'venue_text','C.B. Smith Park · 900 N Flamingo Rd, Pembroke Pines, FL 33028','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT CUSTOM SPONSOR / BRAND-ACTIVATION INQUIRY ACTIVE',
      'current_cost_text','Custom package — prior $500 fixed sponsor amount is not supported by the current 2026 sponsor route','current_cost_status','CUSTOM QUOTE',
      'attendance_text','Current sponsor inquiry states expected attendance of 3,500–4,500 guests.',
      'eligibility_text','Current sponsor program invites brands to create booths, giveaways, demos, samples and family-facing activations.',
      'next_action','Submit a Paradise-specific brand-activation inquiry and request price, footprint, category exclusivity, power needs and remaining inventory.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-079-TURKEY-BASH';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',
    price_text='$175 10×10 weekend booth · $25 corner upgrade',
    source_basis='Florida Art & Craft Festivals current Vero Beach Holiday Expo 2026 exhibitor page — checked Sep. 30, 2026',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED',
      'schedule_text','Nov. 21, 2026 · 10:00 AM–5:00 PM; Nov. 22 · 10:00 AM–4:00 PM',
      'venue_text','Indian River County Fairgrounds · 7955 58th Ave, Vero Beach, FL 32967','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT ONLINE VENDOR APPLICATION ACTIVE · PARADISE SERVICE-BUSINESS ELIGIBILITY TO CONFIRM',
      'current_cost_text','$175 single 10×10 for entire weekend · $20 multi-booth discount beyond first booth · $25 corner upgrade','current_cost_status','CURRENT OFFICIAL',
      'booth_placement_text','Outdoor booth; exhibitor supplies canopy and minimum 35 lb weight per leg. No event electricity; quiet generators allowed only in designated areas.',
      'commitment_terms_text','$25 cancellation fee after approved/processed application; rain-or-shine and no weather refund.',
      'next_action','Contact info@latitude88.com / 772-492-6105 before applying and confirm a home-improvement/service exhibitor is accepted at this art/craft-focused show.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-081-VERO-HOLIDAY-EXPO';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',
    price_text='$400 exhibitor · sponsor tiers $2,500/$5,000/$10,000',
    source_basis='Rum Fuzion current official Nov. 28, 2026 vendor and sponsor page — checked Sep. 30, 2026',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Nov. 28, 2026 · gates 2:00 PM · bar closes 9:00 PM',
      'venue_text','Meyer Amphitheater · 104 Datura St, West Palm Beach, FL 33401','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT EXHIBITOR/VENDOR APPLICATION AND SPONSORSHIP OPPORTUNITIES ACTIVE',
      'current_cost_text','$250 icy products · $300 arts & crafts · $400 exhibitors · $400 food tents · $600 food trucks · Silver sponsor $2,500 · Gold $5,000 · Platinum $10,000 · Presenting exclusive/custom',
      'current_cost_status','CURRENT OFFICIAL',
      'eligibility_text','Current vendor application asks applicants to describe products or services and includes an Exhibitors category.',
      'next_action','Use the $400 Exhibitor application if Paradise is accepted as a service business; compare sponsorship only if premium placement/brand exposure justifies $2,500+.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-082-RUM-FUZION';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',deadline_date=date '2026-11-01',
    price_text='$100 regular-business 10×10 · sponsor tiers $2,500/$5,000/$10,000',
    source_basis='CAN Community Health current 2026 World AIDS Day Concert Eventeny event + regular-business vendor and sponsor applications — checked Sep. 30, 2026',
    source_refs=case when exists (
      select 1 from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e
      where e->>'url'='https://www.eventeny.com/events/ft-lauderdale-can-community-health--world-aids-day-concert-33302/' and e->>'checked_at'='2026-09-30'
    ) then source_refs else coalesce(source_refs,'[]'::jsonb)||jsonb_build_array(
      jsonb_build_object('url','https://www.eventeny.com/events/ft-lauderdale-can-community-health--world-aids-day-concert-33302/','title','CAN Community Health — World AIDS Day Concert 2026','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED'),
      jsonb_build_object('url','https://www.eventeny.com/events/vendor/?id=54339','title','World AIDS Day 2026 — Regular Business Marketplace Vendor Application','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED'),
      jsonb_build_object('url','https://www.eventeny.com/events/sponsor/application/?a=xmrxlqlf-25291','title','World AIDS Day 2026 — General Sponsorship Application','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED')
    ) end,
    detail_data=detail_data||jsonb_build_object(
      'official_source_url','https://www.eventeny.com/events/ft-lauderdale-can-community-health--world-aids-day-concert-33302/',
      'action_url','https://www.eventeny.com/events/vendor/?id=54339','source_label','CAN Community Health current World AIDS Day 2026 event + Regular Business Marketplace application',
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Nov. 29, 2026 · 5:00 PM–9:00 PM',
      'venue_text','3000 E Las Olas Blvd, Fort Lauderdale, FL 33316','venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT REGULAR-BUSINESS 10×10 APPLICATION ACTIVE · PRACTICAL COI/PAYMENT CUTOFF NOV. 1',
      'deadline_text','Regular-business application page remains open through Nov. 29, but terms require COI and payment/in-kind commitment by Nov. 1, 2026; use Nov. 1 as the practical commitment cutoff.',
      'current_cost_text','$100 regular-business 10×10 booth · sponsorship $2,500 Producer / $5,000 Community Partner / $10,000 Silver','current_cost_status','CURRENT OFFICIAL',
      'commitment_terms_text','Vendor commitment is non-refundable. COI must list City of Fort Lauderdale, Harmony Waves and CAN Community Health as additional insureds with specified liability terms.',
      'next_action','Use the $100 Regular Business Marketplace application and complete COI/payment by Nov. 1 if pursuing; sponsorship is a separate $2,500+ path.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-083-WORLD-AIDS';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',
    price_text='$750 LOA member / $1,260 non-member 10×10 booth + electric',
    source_basis='Las Olas Boulevard Association current Christmas on Las Olas 2026 exhibitor page + live standard-booth application — checked Sep. 30, 2026',
    detail_data=detail_data||jsonb_build_object(
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Dec. 1, 2026 · booths staffed 5:00 PM–10:00 PM',
      'booking_status','CURRENT STANDARD BUSINESS BOOTH APPLICATION ACTIVE',
      'current_cost_text','$750 LOA member · $1,260 non-member standard 10×10 booth including white tent, 6-foot table, 2 chairs and 120V electricity','current_cost_status','CURRENT OFFICIAL',
      'commitment_terms_text','COI naming the Las Olas Association and City of Fort Lauderdale is mandatory; event is rain or shine and payment is non-refundable.',
      'next_action','If pursuing, submit the standard booth application while inventory remains and prepare the required COI; confirm non-member availability before payment.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-084-CHRISTMAS-LAS-OLAS';

update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',date_confidence='CURRENT_VERIFIED',
    price_text='$5,000 Bronze · $7,500 Silver · $10,000 Gold',
    source_basis='City of Delray Beach current 100-Ft Christmas Tree 2026 page + current 2026 sponsorship package — checked Sep. 30, 2026',
    source_refs=case when exists (
      select 1 from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e
      where e->>'url'='https://www.delraybeachfl.gov/our-city/things-to-do/100-ft-christmas-tree' and e->>'checked_at'='2026-09-30'
    ) then source_refs else coalesce(source_refs,'[]'::jsonb)||jsonb_build_array(
      jsonb_build_object('url','https://www.delraybeachfl.gov/our-city/things-to-do/100-ft-christmas-tree','title','City of Delray Beach — 100 Ft Christmas Tree 2026','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED'),
      jsonb_build_object('url','https://www.delraybeachfl.gov/home/showpublisheddocument/15539/639154759300870000','title','City of Delray Beach — 2026 Special Events Sponsorship Package','checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED')
    ) end,
    detail_data=detail_data||jsonb_build_object(
      'official_source_url','https://www.delraybeachfl.gov/our-city/things-to-do/100-ft-christmas-tree',
      'action_url','https://www.delraybeachfl.gov/home/showpublisheddocument/15539/639154759300870000',
      'source_label','City of Delray Beach current 100-Ft Christmas Tree event + 2026 sponsorship package',
      'current_source_checked_at','2026-09-30','schedule_status','CURRENT VERIFIED','schedule_text','Dec. 1, 2026 · 6:00 PM–9:00 PM',
      'booking_status','CURRENT 2026 TREE LIGHTING SPONSORSHIP PACKAGE PUBLISHED',
      'current_cost_text','$5,000 Bronze · $7,500 Silver · $10,000 Gold','current_cost_status','CURRENT OFFICIAL',
      'booth_placement_text','Gold and Silver explicitly include promotional-tent space at Tree Lighting; Bronze does not list a physical tent.',
      'next_action','If physical lead generation is required, confirm remaining Silver/Gold inventory and exact promotional-tent footprint with Delray Beach Special Events before commitment.'
    ),audit_checked_at=now(),updated_at=now()
where control_id='R2026-085-DELRAY-TREE';

update public.shows_app_research_calendar_controls r
set source_refs=coalesce(source_refs,'[]'::jsonb)||jsonb_build_array(
  jsonb_build_object('url',r.detail_data->>'official_source_url','title',coalesce(nullif(r.detail_data->>'source_label',''),'Current official source'),'checked_at','2026-09-30','verification_scope','CURRENT_REVERIFIED')
),updated_at=now()
where control_id in ('R2026-080-PSL-INTERNATIONAL','R2026-079-TURKEY-BASH','R2026-081-VERO-HOLIDAY-EXPO','R2026-082-RUM-FUZION','R2026-084-CHRISTMAS-LAS-OLAS')
and not exists (
  select 1 from jsonb_array_elements(coalesce(r.source_refs,'[]'::jsonb)) e
  where e->>'url'=r.detail_data->>'official_source_url' and e->>'checked_at'='2026-09-30'
);

do $$
declare before_n int; after_n int; bad int;
begin
  select n into before_n from _b7_before;
  select count(*) filter (where active and calendar_visibility and plan_year=2026 and research_status='CURRENT_REVERIFIED') into after_n
  from public.shows_app_research_calendar_controls;
  if after_n-before_n<>8 then raise exception 'expected 8 final-stretch batch7 rows; before %, after %',before_n,after_n; end if;

  select count(*) into bad
  from public.shows_app_research_calendar_controls
  where control_id in (
    'R2026-100-WESTON-RUN','R2026-080-PSL-INTERNATIONAL','R2026-079-TURKEY-BASH','R2026-081-VERO-HOLIDAY-EXPO',
    'R2026-082-RUM-FUZION','R2026-083-WORLD-AIDS','R2026-084-CHRISTMAS-LAS-OLAS','R2026-085-DELRAY-TREE'
  )
  and (research_status<>'CURRENT_REVERIFIED' or detail_data->>'current_source_checked_at'<>'2026-09-30');
  if bad<>0 then raise exception 'batch7 verification failed for % rows',bad; end if;

  if (select deadline_date from public.shows_app_research_calendar_controls where control_id='R2026-100-WESTON-RUN')<>date '2026-11-15' then raise exception 'Weston deadline missing'; end if;
  if (select deadline_date from public.shows_app_research_calendar_controls where control_id='R2026-083-WORLD-AIDS')<>date '2026-11-01' then raise exception 'World AIDS practical cutoff missing'; end if;
  if (select price_text from public.shows_app_research_calendar_controls where control_id='R2026-079-TURKEY-BASH') is not null then raise exception 'Turkey Bash stale fixed price not cleared'; end if;
end $$;
