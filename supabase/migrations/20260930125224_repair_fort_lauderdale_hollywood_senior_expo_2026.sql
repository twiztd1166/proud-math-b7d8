-- Normalize the current Senior Expo USA control after the provenance repair.
-- This migration matches the applied production state: exact city/date confidence, current package wording,
-- and decision-safe commitment guidance while preserving the earlier research-summary correction.

update public.shows_app_research_calendar_controls
set
  city='Davie',
  date_confidence='CURRENT_VERIFIED',
  deadline_date=date '2026-10-30',
  price_text='$425–$1,200 current published Florida exhibitor package range',
  research_status='CURRENT_REVERIFIED',
  notes='Current Senior Expo USA sources verify the Nov. 9, 2026 Fort Lauderdale / Hollywood Fall Senior Expo at Seminole Hard Rock in Davie, with an Oct. 30 registration deadline and Florida exhibitor packages published at $425–$1,200. No current official sold-out evidence found; confirm Home Improvement category availability before payment.',
  source_basis='Senior Expo USA current 2026 schedule, event page, Florida exhibitor listings, and Florida exhibitor-sales contact — checked Sep. 30, 2026',
  source_refs=jsonb_build_array(
    jsonb_build_object('url','https://seniorexpousa.com/schedule/','title','Senior Expo USA — 2026 annual schedule','checked_at','2026-09-30'),
    jsonb_build_object('url','https://seniorexpousa.com/expos/florida/fort-lauderdale-hollywood-fall-senior-expo-2026/','title','Fort Lauderdale / Hollywood Fall Senior Expo — official 2026 event page','checked_at','2026-09-30'),
    jsonb_build_object('url','https://seniorexpousa.com/brand/florida/','title','Senior Expo USA — Florida exhibitor packages','checked_at','2026-09-30'),
    jsonb_build_object('url','https://seniorexpousa.com/contact/','title','Senior Expo USA — Florida exhibitor sales contact','checked_at','2026-09-30')
  ),
  detail_data=jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(
                  jsonb_set(
                    jsonb_set(
                      jsonb_set(
                        jsonb_set(
                          jsonb_set(
                            detail_data,
                            '{official_source_url}',to_jsonb('https://seniorexpousa.com/expos/florida/fort-lauderdale-hollywood-fall-senior-expo-2026/'::text),true
                          ),
                          '{action_url}',to_jsonb('https://seniorexpousa.com/brand/florida/'::text),true
                        ),
                        '{action_label}',to_jsonb('Open Florida exhibitor options'::text),true
                      ),
                      '{source_label}',to_jsonb('Senior Expo USA — current 2026 official sources'::text),true
                    ),
                    '{schedule_text}',to_jsonb('Nov. 9, 2026 · 10:00 AM–1:00 PM'::text),true
                  ),
                  '{schedule_status}',to_jsonb('CURRENT VERIFIED'::text),true
                ),
                '{venue_text}',to_jsonb('Seminole Hard Rock Hotel & Casino Hollywood · 1 Seminole Way, Davie, FL 33314'::text),true
              ),
              '{venue_status}',to_jsonb('CURRENT OFFICIAL'::text),true
            ),
            '{deadline_text}',to_jsonb('Exhibitor registration deadline Oct. 30, 2026'::text),true
          ),
          '{booking_status}',to_jsonb('CURRENT EXHIBITOR PRODUCT LISTED · AVAILABILITY / CATEGORY TO CONFIRM'::text),true
        ),
        '{contact_text}',to_jsonb('Senior Expo USA Florida Exhibitor Sales · Evan Nicholson · Evan@SeniorExpoUSA.com · 248-747-4854'::text),true
      ),
      '{contact_status}',to_jsonb('CURRENT OFFICIAL VERIFIED'::text),true
    ),
    '{current_cost_text}',to_jsonb('$425–$1,200 published Florida exhibitor package range · confirm eligibility for any discounted rate before payment'::text),true
  ),
  audit_checked_at=now(),
  updated_at=now()
where control_id='R2026-063-SENIOR-HARDROCK';

update public.shows_app_research_calendar_controls
set detail_data=jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            detail_data,
            '{current_cost_status}',to_jsonb('CURRENT OFFICIAL RANGE'::text),true
          ),
          '{eligibility_text}',to_jsonb('Aging In Place Home Improvements is explicitly included among expo service categories; confirm Home Improvement exhibitor inventory/category acceptance with Evan Nicholson before payment.'::text),true
        ),
        '{next_action}',to_jsonb('Contact Evan Nicholson now to confirm Home Improvement category availability for Nov. 9 and, if open, select the appropriate $425–$1,200 exhibitor package before the Oct. 30 registration deadline.'::text),true
      ),
      '{commitment_terms_text}',to_jsonb('Current Florida exhibitor packages are published at $425–$1,200. Confirm the exact selected tier, any multi-expo discount eligibility, category availability, cancellation/refund terms and payment requirements before commitment.'::text),true
    ),
    updated_at=now()
where control_id='R2026-063-SENIOR-HARDROCK';

do $$
declare
  visible_count integer;
  structured_deadlines integer;
begin
  if not exists (
    select 1
    from public.shows_app_research_calendar_controls
    where control_id='R2026-063-SENIOR-HARDROCK'
      and city='Davie'
      and event_start=date '2026-11-09'
      and deadline_date=date '2026-10-30'
      and date_confidence='CURRENT_VERIFIED'
      and research_status='CURRENT_REVERIFIED'
      and detail_data->>'contact_text' like '%Evan@SeniorExpoUSA.com%'
      and detail_data->>'booking_status' not like '%SOLD OUT%'
  ) then
    raise exception 'Senior Expo USA repair failed';
  end if;

  select count(*) into visible_count
  from public.shows_app_research_calendar_controls
  where active and calendar_visibility and plan_year=2026;
  if visible_count<>115 then
    raise exception 'Expected 115 visible research controls; found %',visible_count;
  end if;

  select count(*) into structured_deadlines
  from public.shows_app_research_calendar_controls
  where active and calendar_visibility and plan_year=2026 and deadline_date is not null;
  if structured_deadlines<>16 then
    raise exception 'Expected 16 visible structured deadlines after Senior Expo repair; found %',structured_deadlines;
  end if;
end $$;
