create table if not exists public.shows_app_research_calendar_controls (
  control_id text primary key,
  plan_year integer not null default 2026 check (plan_year >= 2026 and plan_year <= 2035),
  series_key text,
  event_label text not null,
  city text,
  event_start date,
  event_end date,
  date_text text,
  date_confidence text not null default 'ARCHIVE_VERIFIED'
    check (date_confidence in ('ARCHIVE_VERIFIED','CURRENT_VERIFIED','RECURRING_HIGH_CONFIDENCE','ESTIMATED','TBD')),
  disposition text not null
    check (disposition in ('PURSUE','WATCH','HOLD','SUPPRESS','B2B','SOLD_OUT')),
  priority text
    check (priority is null or priority in ('HIGH','MED_HIGH','MEDIUM','LOW_MED','LOW')),
  route_type text,
  lineage_type text not null default 'UNRESOLVED'
    check (lineage_type in ('EXACT','SAME_SERIES','SAME_ORGANIZER','SAME_MUNICIPALITY','HISTORICAL_SUCCESSOR','HISTORICAL_REACTIVATION','PORTFOLIO_CHILD','PROVISIONAL_NET_NEW','UNRESOLVED','PREMIUM_LANE','SPONSOR_ONLY')),
  profile_id text,
  mfc_id text,
  price_text text,
  deadline_date date,
  deadline_text text,
  calendar_visibility boolean not null default true,
  research_status text not null default 'RECOVERED_NOT_REVERIFIED'
    check (research_status in ('RECOVERED_NOT_REVERIFIED','CURRENT_REVERIFIED','SUPERSEDED','REJECTED')),
  source_basis text not null,
  source_refs jsonb not null default '[]'::jsonb,
  notes text,
  audit_checked_at timestamptz,
  updated_at timestamptz not null default now(),
  active boolean not null default true
);

alter table public.shows_app_research_calendar_controls enable row level security;

create index if not exists shows_app_research_calendar_controls_year_date_idx
  on public.shows_app_research_calendar_controls (plan_year,event_start)
  where active=true;

comment on table public.shows_app_research_calendar_controls is
  'Recovered remainder-of-2026 research overlay. Preserves discovery/lineage/treatment separately from operating shows, rebook opportunities, and canonical annual plans. Not a booking or attendance proof table.';
