-- Repair the Fort Lauderdale / Hollywood Fall Senior Expo provenance.
-- The Nov. 9, 2026 control belongs to Senior Expo USA, not Retirement-Times / Expo Media.
-- Preserve the recovered sold-out statement as historical evidence only; current category availability must be confirmed.

update public.shows_app_research_calendar_controls
set
  deadline_date=date '2026-10-30',
  price_text='$425–$1,200 exhibitor packages',
  research_status='CURRENT_REVERIFIED',
  source_basis='Senior Expo USA official 2026 event, annual schedule, Florida exhibitor catalog and contact page — checked Sep. 30, 2026',
  notes='Recovered archive evidence reported Home Improvement inventory sold out. Current Senior Expo USA sources now list the Nov. 9, 2026 event, active exhibitor packages and Florida sales contact, but do not confirm category-level availability. Treat current Home Improvement/home-services availability as unverified until Evan Nicholson confirms it.',
  source_refs=jsonb_build_array(
    jsonb_build_object('title','chatgpt_chunk_0171.md','drive_file_id','1FugMZQBYfn3W5I-68ntz41LOhah5exFr'),
    jsonb_build_object('url','https://seniorexpousa.com/expos/florida/fort-lauderdale-hollywood-fall-senior-expo-2026/','title','Senior Expo USA — Fort Lauderdale / Hollywood Fall Senior Expo 2026','checked_at','2026-09-30'),
    jsonb_build_object('url','https://seniorexpousa.com/schedule/','title','Senior Expo USA — 2026 annual schedule and registration deadline','checked_at','2026-09-30'),
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
                              '{source_label}',to_jsonb('Senior Expo USA — Fort Lauderdale / Hollywood Fall Senior Expo 2026'::text),true
                            ),
                            '{venue_text}',to_jsonb('Seminole Hard Rock Hotel & Casino Hollywood · 1 Seminole Way, Davie, FL 33314'::text),true
                          ),
                          '{venue_status}',to_jsonb('CURRENT OFFICIAL'::text),true
                        ),
                        '{schedule_text}',to_jsonb('Nov. 9, 2026 · 10:00 AM–1:00 PM'::text),true
                      ),
                      '{schedule_status}',to_jsonb('CURRENT VERIFIED'::text),true
                    ),
                    '{deadline_text}',to_jsonb('Registration deadline Oct. 30, 2026'::text),true
                  ),
                  '{booking_status}',to_jsonb('2026 EVENT / EXHIBITOR OPTIONS ACTIVE · HOME-IMPROVEMENT CATEGORY AVAILABILITY TO CONFIRM'::text),true
                ),
                '{contact_text}',to_jsonb('Evan Nicholson · Evan@SeniorExpoUSA.com · 248-747-4854'::text),true
              ),
              '{contact_status}',to_jsonb('CURRENT OFFICIAL VERIFIED'::text),true
            ),
            '{current_cost_text}',to_jsonb('$425–$1,200 exhibitor packages'::text),true
          ),
          '{current_cost_status}',to_jsonb('CURRENT OFFICIAL RANGE'::text),true
        ),
        '{eligibility_text}',to_jsonb('Official event content includes Aging In Place Home Improvements; exhibitor route is active, but current Home Improvement/home-services category inventory must be confirmed before commitment.'::text),true
      ),
      '{commitment_status}',to_jsonb('REVERIFY CATEGORY AVAILABILITY BEFORE COMMITMENT'::text),true
    ),
    '{next_action}',to_jsonb('Email Evan Nicholson and confirm Home Improvement / home-services category availability. If open, select the appropriate $425–$1,200 exhibitor package before the Oct. 30 registration deadline.'::text),true
  ),
  audit_checked_at=now(),
  updated_at=now()
where control_id='R2026-063-SENIOR-HARDROCK';

update public.shows_app_research_calendar_controls
set detail_data=jsonb_set(
  jsonb_set(detail_data,'{research_summary}',to_jsonb('Current Senior Expo USA sources verify the Fort Lauderdale / Hollywood Fall Senior Expo on Nov. 9, 2026 at Seminole Hard Rock in Davie, with exhibitor packages listed at $425–$1,200 and an Oct. 30 registration deadline. Recovered archive evidence reported Home Improvement inventory sold out, but current category availability is not published; confirm directly with Florida exhibitor sales before commitment.'::text),true),
  '{current_source_checked_at}',to_jsonb('2026-09-30'::text),true
)
where control_id='R2026-063-SENIOR-HARDROCK';

do $$
begin
  if not exists (
    select 1 from public.shows_app_research_calendar_controls
    where control_id='R2026-063-SENIOR-HARDROCK'
      and deadline_date=date '2026-10-30'
      and detail_data->>'official_source_url'='https://seniorexpousa.com/expos/florida/fort-lauderdale-hollywood-fall-senior-expo-2026/'
      and detail_data->>'contact_text' like '%Evan@SeniorExpoUSA.com%'
      and detail_data->>'booking_status' not like '%SOLD OUT%'
  ) then raise exception 'Senior Expo USA provenance repair failed'; end if;

  if exists (
    select 1 from jsonb_array_elements(
      (select source_refs from public.shows_app_research_calendar_controls where control_id='R2026-063-SENIOR-HARDROCK')
    ) e
    where coalesce(e->>'url','') like '%retirement-times.com%'
  ) then raise exception 'Wrong Retirement-Times source remains on Senior Expo USA control'; end if;

  if (
    select count(*) from public.shows_app_research_calendar_controls
    where active and calendar_visibility and plan_year=2026 and deadline_date is not null
  ) <> 16 then raise exception 'Expected 16 visible structured deadline rows after Senior Expo repair'; end if;
end $$;
