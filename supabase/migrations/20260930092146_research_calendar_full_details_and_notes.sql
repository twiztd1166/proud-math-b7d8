alter table public.shows_app_research_calendar_controls
  add column if not exists details jsonb not null default '{}'::jsonb;

comment on column public.shows_app_research_calendar_controls.details is
  'Full research-show detail payload for app parity with governed/operating show detail screens. Verified scalar columns remain authoritative.';

update public.shows_app_research_calendar_controls
set details =
  coalesce(details,'{}'::jsonb) ||
  jsonb_build_object(
    'detail_version', 1,
    'venue_text', case when nullif(btrim(city),'') is not null then city || ' — exact venue not yet reverified' else 'Exact venue not yet reverified' end,
    'organizer_text', 'Organizer/contact not yet reverified from the recovered research layer',
    'eligibility_text', case
      when nullif(btrim(route_type),'') is not null then replace(initcap(replace(lower(route_type),'_',' ')), 'And', '&')
      else 'Commercial participation route requires verification'
    end,
    'attendance_text', case
      when notes ~* '(attendance|attendees|visitor|spectator|families|people|[0-9],[0-9]{3})' then notes
      else 'Attendance / audience size not yet reverified'
    end,
    'booking_window_text', coalesce(nullif(btrim(deadline_text),''),'Current application / booking window not yet reverified'),
    'current_cost_status', coalesce(nullif(btrim(price_text),''),'Current vendor / sponsor rate not yet reverified'),
    'booking_readiness', case
      when disposition='PURSUE' then 'RESEARCH QUALIFIED — VERIFY CURRENT AVAILABILITY'
      when disposition='SOLD_OUT' then 'SOLD OUT / WAITLIST'
      when disposition in ('HOLD','SUPPRESS') then 'NOT BOOKABLE — CURRENT RESEARCH TREATMENT'
      else 'WATCH — VERIFICATION REQUIRED'
    end,
    'blockers_text', coalesce(nullif(btrim(notes),''),'No additional blocker note recovered'),
    'next_step', case
      when disposition='PURSUE' and nullif(btrim(price_text),'') is not null
        then 'Confirm current availability, Paradise category eligibility, application terms, and secure the current package if approved.'
      when disposition='PURSUE'
        then 'Get current vendor/sponsor quote, confirm Paradise category eligibility and availability, then decide whether to book.'
      when disposition='SOLD_OUT'
        then 'Join or confirm waitlist and monitor for reopened inventory.'
      when disposition in ('HOLD','SUPPRESS')
        then 'Do not book until the stated research blocker is cleared.'
      else 'Verify current eligibility, price, availability, audience fit, and ROI before booking.'
    end,
    'verification_note', case
      when research_status='CURRENT_REVERIFIED' then 'Current source reverified'
      when date_confidence='CURRENT_VERIFIED' then 'Current date verified; remaining commercial details may still require reverification'
      else 'Recovered research evidence — current commercial terms may require reverification'
    end,
    'source_label', source_basis,
    'archive_url', 'https://drive.google.com/file/d/1FugMZQBYfn3W5I-68ntz41LOhah5exFr/view?usp=drivesdk',
    'contact_text', 'Current organizer contact not yet reverified',
    'application_text', coalesce(nullif(btrim(deadline_text),''),'Current application link / deadline not yet reverified'),
    'placement_text', coalesce(nullif(replace(initcap(replace(lower(route_type),'_',' ')), 'And', '&'),''),'Placement / participation route requires verification'),
    'schedule_text', coalesce(nullif(btrim(date_text),''), to_char(event_start,'Mon FMDD, YYYY') || case when event_end is not null and event_end<>event_start then ' – ' || to_char(event_end,'Mon FMDD, YYYY') else '' end),
    'logistics_text', coalesce(nullif(btrim(city),''),'Location logistics not yet reverified'),
    'history_link_text', case
      when nullif(btrim(mfc_id),'') is not null then 'Linked current operating control ' || mfc_id
      when nullif(btrim(profile_id),'') is not null then 'Linked historical/catalog profile ' || profile_id
      else 'No canonical Paradise history/profile link established for this research control'
    end
  ),
  updated_at=now()
where plan_year=2026 and active and calendar_visibility;

create table if not exists public.shows_app_research_notes (
  id bigint generated always as identity primary key,
  control_id text not null references public.shows_app_research_calendar_controls(control_id) on delete cascade,
  note text not null check (length(btrim(note)) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists shows_app_research_notes_control_created_idx
  on public.shows_app_research_notes(control_id, created_at desc, id desc);

alter table public.shows_app_research_notes enable row level security;

revoke all on table public.shows_app_research_notes from anon, authenticated;
revoke all on sequence public.shows_app_research_notes_id_seq from anon, authenticated;