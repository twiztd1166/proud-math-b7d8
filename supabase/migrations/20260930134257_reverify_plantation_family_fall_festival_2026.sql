
update public.shows_app_research_calendar_controls
set research_status='CURRENT_REVERIFIED',
    date_confidence='CURRENT_VERIFIED',
    price_text=null,
    source_basis='City of Plantation current 2026 Family Fall Festival event + sponsorship/vendor opportunities — checked Sep. 30, 2026',
    source_refs=case when exists (
      select 1 from jsonb_array_elements(coalesce(source_refs,'[]'::jsonb)) e
      where e->>'url'='https://www.plantation.org/Home/Components/Calendar/Event/6472/276?curm=8&cury=2026'
    ) then source_refs else coalesce(source_refs,'[]'::jsonb)||jsonb_build_array(
      jsonb_build_object(
        'url','https://www.plantation.org/Home/Components/Calendar/Event/6472/276?curm=8&cury=2026',
        'title','City of Plantation — Family Fall Festival 2026',
        'checked_at','2026-09-30',
        'verification_scope','CURRENT_REVERIFIED'
      ),
      jsonb_build_object(
        'url','https://www.plantation.org/government/departments/parks-recreation/sponsorship-vendor-opportunities',
        'title','City of Plantation — current sponsorship/vendor opportunities',
        'checked_at','2026-09-30',
        'verification_scope','CURRENT_REVERIFIED'
      )
    ) end,
    detail_data=detail_data || jsonb_build_object(
      'current_source_checked_at','2026-09-30',
      'schedule_status','CURRENT VERIFIED',
      'schedule_text','Oct. 17, 2026 · 10:00 AM–2:00 PM',
      'venue_text','Volunteer Park · 12050 W Sunrise Blvd, Plantation, FL 33323',
      'venue_status','CURRENT OFFICIAL',
      'booking_status','CURRENT 2026 FAMILY FALL FESTIVAL SPONSORSHIP PACKAGE AND VENDOR APPLICATION PUBLISHED',
      'action_url','https://www.plantation.org/government/departments/parks-recreation/sponsorship-vendor-opportunities',
      'current_cost_text','Not verified in accessible current public page',
      'current_cost_status','NOT VERIFIED',
      'next_action','Open/request the current 2026 Family Fall Festival vendor application or sponsorship package and confirm Paradise eligibility, fee, deadline, footprint, insurance and remaining availability.'
    ),
    audit_checked_at=now(),updated_at=now()
where control_id='R2026-026-PLANTATION-FALL';

do $$
begin
  if not exists (
    select 1 from public.shows_app_research_calendar_controls
    where control_id='R2026-026-PLANTATION-FALL'
      and research_status='CURRENT_REVERIFIED'
      and date_confidence='CURRENT_VERIFIED'
      and detail_data->>'current_source_checked_at'='2026-09-30'
  ) then raise exception 'Plantation re-verification failed'; end if;
end $$;