-- Paradise Performance web interim — allow explicit Knock Clock evidence.
-- Scope is limited to the two additive event types already emitted by the validated web Knock Clock client.

alter table public.performance_events
  drop constraint if exists performance_events_type_check;

alter table public.performance_events
  add constraint performance_events_type_check
  check (event_type = any (array[
    'SHIFT_STARTED'::text,
    'SHIFT_PAUSED'::text,
    'SHIFT_RESUMED'::text,
    'SHIFT_FINISHED'::text,
    'DOOR_COUNT_SET'::text,
    'CONVERSATION_COUNT_SET'::text,
    'DOOR_INCREMENTED'::text,
    'CONVERSATION_INCREMENTED'::text,
    'SET_CREATED'::text,
    'SET_COMPLETED'::text,
    'LOCATION_CAPTURED'::text,
    'OUTCOME_UPDATED'::text,
    'CORRECTION_REQUESTED'::text,
    'KNOCK_STARTED'::text,
    'KNOCK_STOPPED'::text
  ]));
