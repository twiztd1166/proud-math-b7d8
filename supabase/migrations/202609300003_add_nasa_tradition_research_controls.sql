-- Final two recovered remainder-of-2026 calendar gaps.
-- Source: Layer 3 historical research overlay, Sep. 12–14, 2026.
-- This migration assumes shows_app_research_calendar_controls already exists.

insert into public.shows_app_research_calendar_controls
(control_id,plan_year,series_key,event_label,city,event_start,event_end,date_text,date_confidence,
 disposition,priority,route_type,lineage_type,profile_id,mfc_id,price_text,deadline_date,deadline_text,
 calendar_visibility,research_status,source_basis,source_refs,notes,audit_checked_at,updated_at,active)
values
(
  'R2026-116-NASA-MAX-POWER',2026,'NASA-MAX-POWER',
  'NASA MAX POWER / Salute to America in Space','Kennedy Space Center',
  date '2026-11-07',date '2026-11-08',null,'ARCHIVE_VERIFIED',
  'PURSUE','HIGH','CONSUMER_COMMUNITY_PARTNERSHIP','PROVISIONAL_NET_NEW',
  null,null,null,null,null,true,'RECOVERED_NOT_REVERIFIED',
  'Layer 3 historical research overlay — Sep. 12–14, 2026 maximum-practical remainder-of-2026 audit',
  '[{"title":"chatgpt_chunk_0171.md","drive_file_id":"1FugMZQBYfn3W5I-68ntz41LOhah5exFr"}]'::jsonb,
  'Major late discovery. NASA/Air Dot Show research recovered a family-facing aerospace expo/airshow with a consumer/community partnership route for direct guest engagement and onsite public activation.',
  timestamptz '2026-09-13 23:59:00+00',now(),true
),
(
  'R2026-117-TRADITION-NEIGHBORHOOD',2026,'TRADITION-NEIGHBORHOOD-MARKET',
  'Tradition Neighborhood Market','Port St. Lucie',
  date '2026-10-04',date '2026-12-27','Every Sunday through remainder of 2026','ARCHIVE_VERIFIED',
  'WATCH','MED_HIGH','VENDOR_ELIGIBILITY_RECONFIRM','HISTORICAL_REACTIVATION',
  'HIST-230',null,null,null,null,true,'RECOVERED_NOT_REVERIFIED',
  'Layer 3 historical research overlay — Sep. 12–14, 2026 maximum-practical remainder-of-2026 audit',
  '[{"title":"chatgpt_chunk_0171.md","drive_file_id":"1FugMZQBYfn3W5I-68ntz41LOhah5exFr"}]'::jsonb,
  'Current Tradition recurrence plus Paradise 2023 booking/calendar evidence. Reuse HIST-230; current home-service lead-generation eligibility should be reconfirmed before booking.',
  timestamptz '2026-09-13 23:59:00+00',now(),true
)
on conflict (control_id) do update set
  event_label=excluded.event_label,
  city=excluded.city,
  event_start=excluded.event_start,
  event_end=excluded.event_end,
  date_text=excluded.date_text,
  date_confidence=excluded.date_confidence,
  disposition=excluded.disposition,
  priority=excluded.priority,
  route_type=excluded.route_type,
  lineage_type=excluded.lineage_type,
  profile_id=excluded.profile_id,
  calendar_visibility=excluded.calendar_visibility,
  research_status=excluded.research_status,
  source_basis=excluded.source_basis,
  source_refs=excluded.source_refs,
  notes=excluded.notes,
  audit_checked_at=excluded.audit_checked_at,
  updated_at=now(),
  active=excluded.active;
