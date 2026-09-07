# Paradise Shows Continuation Protocol

This file defines the durable continuity workflow for Paradise Shows.

## First action on every Continue / Go / fresh-chat resume

Do not treat chat history as the source of truth.

1. Read `PARADISE_SHOWS_CONTINUATION_CHECKPOINT.md`.
2. Read the live GitHub head of `paradise-shows-public`.
3. Read the current governed Supabase state:
   - latest READY catalog
   - active `shows-api` version
   - current shows and payments
   - active rebook opportunities
   - active rebook review counts/dispositions
   - historical outreach set
4. Compare those live controls with the checkpoint.
5. If they differ, production wins. Reconcile the checkpoint before continuing substantive work.
6. Resume the checkpoint's exact `NEXT ACTION`; do not restart closed research.

## Two-layer checkpoint model

### Layer A — canonical current checkpoint

`PARADISE_SHOWS_CONTINUATION_CHECKPOINT.md`

This is the human-readable current pointer. It is overwritten after every meaningful completed work batch and updated to `STATUS: IN_PROGRESS` before a large research/change batch when practical.

It must contain:

- current goal
- current task
- governed app-state GitHub head
- latest merged app PR
- Supabase project/API version and governed counts
- what was actually verified
- important evidence and exact Gmail/Drive/official-source references when material
- decisions/corrections
- GitHub/Supabase changes
- unresolved items
- exact next action
- investigated/rejected alternatives
- warnings and non-inference boundaries

### Layer B — immutable semantic history

Use the existing Supabase checkpoint infrastructure.

Each semantic continuation checkpoint is created with:

`public.shows_app_create_continuation_checkpoint(payload_jsonb, reason_text)`

The helper:

- creates a normal full SHOW/PAYMENT snapshot first
- attaches one `CONTINUATION / CURRENT` semantic row to that checkpoint
- requires `status`, `current_goal`, `current_task`, `github_head`, and `next_action`
- allows only `IN_PROGRESS` or `COMPLETE`
- makes CONTINUATION rows immutable
- excludes semantic continuation checkpoints from the normal 250-operational-snapshot pruning rule

Continuation rows are metadata only. Restore logic continues to restore only SHOW and PAYMENT rows.

## Checkpoint cadence

### Before a substantial batch

Create an immutable checkpoint with:

- `STATUS: IN_PROGRESS`
- exact current production head
- current task
- last completed state
- exact intended next action

Then update the canonical markdown to reflect the same task if the batch is large enough that an interruption would be costly.

### After a meaningful completed batch

1. Verify Supabase readback.
2. Verify GitHub branch head and merged PR.
3. Verify smoke/CI/public behavior when the batch changed app behavior.
4. Replace the canonical markdown with `STATUS: COMPLETE`.
5. Create a new immutable semantic continuation checkpoint with the completed state and exact next action.
6. Read both back.

## Stale-state rule

A chat summary, old checkpoint, old PR description, memory, or pasted continuation text never overrides production.

When checkpoint and production differ:

`live GitHub + governed Supabase > canonical checkpoint > immutable older checkpoint > chat summary`

Fix the canonical checkpoint before continuing.

## Evidence rules that must survive continuation

- LeadPerfection annual or cumulative attribution is performance/source attribution, not attendance proof.
- Historical booth/location evidence is reference evidence unless the same-row evidence is explicitly outcome-linked and even then does not prove the location remains best/current.
- Current event identity must be independently verified; similar event names are not enough.
- Historical organizer/person/contact labels are not current identity proof.
- Current booking cost, placement, deadlines, logistics, and commitment terms must not be inferred from predecessor cycles unless explicitly labeled as historical precedent.
- Organizer-response-only blockers are not internal-search blockers.
- Rejected identities/sources must be preserved so future chats do not repeat them.

## Recovery query

To read the latest immutable continuation checkpoint:

```sql
select
  c.id,
  c.created_at,
  c.reason,
  r.row_data
from public.shows_app_checkpoints c
join public.shows_app_checkpoint_rows r
  on r.checkpoint_id = c.id
where r.entity_type = 'CONTINUATION'
  and r.entity_id = 'CURRENT'
order by c.created_at desc, c.id desc
limit 1;
```

## Do not preserve hidden reasoning

Private chain-of-thought is not a project artifact and is not required for continuity.

Persist only the durable substance:

`evidence -> findings -> rejected alternatives -> decisions -> changes -> verification -> next action`.
