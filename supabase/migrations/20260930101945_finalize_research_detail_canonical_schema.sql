update public.shows_app_research_calendar_controls
set detail_data = detail_data || jsonb_build_object(
  'archive_line_number', 10461,
  'archive_evidence_row', '| PSL Fall Fun Fest — Oct. 30–31 | WATCH/PURSUE MED — DIRECT CITY ROUTE | Strong family event, but the public marketplace is product-oriented. Paradise should test the City business-company/sponsor path, not force itself into the artisan lane. |',
  'historical_signal', 'Paradise definitively paid and enrolled for PSL Fall Fun Fest in 2024; City receipt shows Fall Fest AC Vendor, $53.50 paid, Oct. 25–27, 2024. Treat as a historical repeat, not net-new.'
),
updated_at=now()
where control_id='R2026-041-PSL-FALL-FUN';

update public.shows_app_research_calendar_controls
set detail_data = detail_data || jsonb_build_object(
  'archive_line_number', 4476,
  'archive_evidence_row', '| Nov. 6–8 | NASCAR Championship Weekend — Homestead | PURSUE — HIGH / PREMIUM | Exact championship weekend with formal corporate partnership path; requires economics quote rather than ordinary booth logic. |'
),
updated_at=now()
where control_id='R2026-052-NASCAR-HOMESTEAD';

alter table public.shows_app_research_calendar_controls
  drop column if exists details;
