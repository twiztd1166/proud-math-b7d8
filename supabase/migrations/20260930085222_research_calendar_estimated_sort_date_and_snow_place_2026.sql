-- Place unconfirmed research controls in the calendar using an explicit estimated sort date.
-- Estimated dates are ordering metadata only and must remain visually distinguished from confirmed event_start values.
-- Also re-verifies the sole 2026 TBD control against the Town of Jupiter official event page.

alter table public.shows_app_research_calendar_controls
  add column if not exists estimated_sort_date date;

comment on column public.shows_app_research_calendar_controls.estimated_sort_date is
  'Estimated event date used only for calendar placement when event_start is not yet confirmed. Must not be presented as a confirmed event date.';

update public.shows_app_research_calendar_controls
set event_start = date '2026-12-12',
    event_end = date '2026-12-12',
    date_text = 'Dec. 12, 2026',
    date_confidence = 'CURRENT_VERIFIED',
    research_status = 'CURRENT_REVERIFIED',
    source_basis = 'Town of Jupiter official event page — verified Sep. 30, 2026',
    source_refs = coalesce(source_refs,'[]'::jsonb) || jsonb_build_array(
      jsonb_build_object(
        'title','There''s Snow Place Like Jupiter — Town of Jupiter official event page',
        'url','https://www.jupiter.fl.us/snow',
        'checked_at','2026-09-30'
      )
    ),
    notes = 'Official Town of Jupiter page now publishes Saturday, Dec. 12, 2026, 4:00–7:00 PM at Abacoa Community Park. Prior TBD treatment is superseded by the verified current date.',
    estimated_sort_date = null,
    audit_checked_at = now(),
    updated_at = now()
where control_id = 'R2026-115-SNOW-PLACE-JUPITER';
