-- Keep the Palm Bay Oct. 10 research controls aligned to the same current Sponsor Vendor application.
-- The shared Eventeny application now closes at 12:00 AM ET on Oct. 10, 2026.

do $$
begin
  if not exists (
    select 1
    from public.shows_app_research_calendar_controls
    where control_id='R2026-013-PUMPKINS-PALMS'
      and deadline_date=date '2026-10-01'
      and detail_data->>'official_source_url'='https://www.eventeny.com/events/vendor/?id=52095'
  ) then
    raise exception 'Pumpkins & Palms precondition failed';
  end if;
end $$;

update public.shows_app_research_calendar_controls
set
  deadline_date=date '2026-10-10',
  detail_data=jsonb_set(
    jsonb_set(
      jsonb_set(detail_data,
        '{deadline_text}',
        to_jsonb('Sponsor Vendor application deadline Oct. 10, 2026 at 12:00 AM ET · submit by Oct. 9 to avoid the midnight cutoff'::text),
        true
      ),
      '{next_action}',
      to_jsonb('Submit the Sponsor Vendor application by Oct. 9 to avoid the Oct. 10 midnight cutoff if space remains; confirm the best commercial tier and category exclusivity.'::text),
      true
    ),
    '{current_source_checked_at}',
    to_jsonb('2026-09-30'::text),
    true
  ),
  audit_checked_at=now(),
  updated_at=now()
where control_id='R2026-013-PUMPKINS-PALMS';

do $$
begin
  if not exists (
    select 1
    from public.shows_app_research_calendar_controls
    where control_id='R2026-013-PUMPKINS-PALMS'
      and deadline_date=date '2026-10-10'
      and detail_data->>'deadline_text' like '%Oct. 10, 2026%'
  ) then
    raise exception 'Pumpkins & Palms deadline repair failed';
  end if;
end $$;
