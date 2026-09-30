create table if not exists public.shows_app_research_calendar (
  control_id text primary key,
  calendar_year smallint not null check (calendar_year between 2020 and 2100),
  profile_id text null,
  event_label text not null,
  event_start date not null,
  event_end date null,
  treatment text not null,
  priority text not null check (priority in ('HIGH','MEDIUM','LOW')),
  identity_treatment text null,
  source_basis text not null,
  source_ref text null,
  notes text null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shows_app_research_calendar_date_check check (event_end is null or event_end >= event_start)
);

create index if not exists shows_app_research_calendar_year_date_idx
  on public.shows_app_research_calendar (calendar_year,event_start,event_label)
  where active=true;

alter table public.shows_app_research_calendar enable row level security;

comment on table public.shows_app_research_calendar is
  'Dated research/reconciliation controls kept separate from operating shows and live rebook opportunities. Rows require current-source re-verification before spend or commitment.';
