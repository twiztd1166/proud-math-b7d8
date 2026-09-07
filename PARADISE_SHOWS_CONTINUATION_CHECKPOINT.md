# Paradise Shows — Canonical Continuation Checkpoint

**STATUS:** COMPLETE  
**Updated:** 2026-09-07  
**Canonical production branch:** `paradise-shows-public`  
**Governed app-state head:** `a2477763dbef0635aee875c651cd5f438b407f7a`  
**Latest merged app PR:** #319 — Promote St. Lucie County Fair as 18th live target  
**Supabase project:** `taxlrlfsobtnbasjcnuf`  
**shows-api:** v86 ACTIVE  
**Pre-work semantic checkpoint:** `e8453a0a-2267-41eb-8d04-62c14cb83466`

> This file lives in production and therefore its documentation commit can be newer than the governed app-state head above. On every resume, compare the live branch head and governed Supabase state first. Production wins if anything differs.

## Current goal

Make Paradise Shows immediately useful for booking decisions:

- which shows/pop-ups to pursue, watch, hold or retire
- when to act/book
- exact current dates and venue
- current decision-safe cost/exposure
- current placement/assignment status
- historical booths/placement evidence and what it actually proves
- historical outcomes and LeadPerfection attribution with correct evidence boundaries
- current contact/action path
- commitment/payment/deadline/logistics blockers
- enough provenance that a new chat does not repeat closed research

## Current governed state

- READY catalog: `2140ff5a-04e2-4973-b12f-01e95ea9fb26`
- Show profiles: **665**
- Preserved history records: **1,086**
- Annual LeadPerfection rows: **1,235**
- Cumulative LeadPerfection rows: **1,251**
- Current show controls: **36**
- Payment controls: **4**
- Active live rebook opportunities: **18**
- Active reviews: **29**
  - PURSUE: **12**
  - WATCH: **8**
  - HOLD: **8**
  - RETIRED: **1**
- Historical outreach queue: exactly **3**
  - `LIFE-028` Palm Beach Liquors
  - `LIFE-039` Port St. Lucie Hurricane Expo
  - `LIFE-073` St. Lucie County Safety Festival

## What is verified at this checkpoint

### Latest live-target change

PR #319 is merged at the governed app-state head.

`LIFE-112` / St. Lucie County Fair is the **18th** live target:

- PURSUE / PRE_BOOKING_ACTION_REQUIRED
- Feb. 26–Mar. 7, 2027
- application open
- outside commercial space only
- $80/front foot with 10-foot minimum = **$800+**, not a flat $800 maximum
- Robin Hall / 772-464-2910 / Robin@stluciecountyfair.org
- 2025 same-row reference: “Main line to the right — 10×10” / $700 fair fee / $1,000 direct+setup / 1 net sale / $47,000 / 13 issued / 7 demos
- historical location is a placement reference only, not proven best
- no fabricated hard deadline

### Important post-PR #284 corrections already completed

Do **not** resume from the old PR #284 / `5acf67b...` state.

Subsequent completed work includes:

- PR #299 — Palm Beach Liquors current-source provenance corrected
- PR #296 — PSL Hurricane Expo promoted to PURSUE for next-cycle outreach; no fake 2027 live occurrence
- PR #303 — Manatee booth-request order ranked from direct organizer floor plan with “layout preference, not proven best” boundary
- PR #313 — verified hard-deadline countdowns on live comparison
- PR #314 — payment cards show explicit control reason and clearing state
- PR #315 — Gun Show historical non-gun approval path preserved without carrying 2021 approval forward
- PR #316 — current ArtiGras Presidential/custom booth-bearing tier guarded; stale PR #312 rejected
- PR #317 — Vero Winter 2027 commitment terms corrected; predecessor-cycle $100/final-balance mechanics removed
- PR #318 — Cognizant category-conflict / measurable activation path guarded
- PR #319 — St. Lucie County Fair promoted as 18th live target

## Palm Beach Liquors — resolved source-provenance state

The prior task “verify Palm Beach Liquors current /events source” is **closed**.

Current governed interpretation:

- PURSUE means re-establish the recurring host relationship now.
- Current business continuity is verified at the exact historical 4801 Linton Blvd Delray Beach location.
- Current phone: **561-330-4777**.
- Canonical current source is the official root store site: `https://palmbeachliquor.com/`.
- No current official event/pop-up page or next Paradise pop-up date was recovered.
- Do **not** describe the old `/events` URL as a current live calendar.
- Historical `Dovalo PM Liquors` is a 2019 source/calendar label only, not a verified current individual.

Key evidence:

- `GMAIL:16baf7ac9653499e` — 2019 Dovalo PM Liquors marketing meeting
- `GMAIL:16d16c2a80f422d8` — 2019 Palm Beach Liquors special event
- preserved `LIFE-028` 2021/2023 history
- official current Palm Beach Liquors root store site + current location/phone verification

Remaining blockers are direct-host response only:

- next pop-up date
- current daily rate
- exact placement
- event hours
- power/setup rules
- host approval

## Hubbard legacy events — closed identity/continuity correction

Direct Hubbard Mar. 4, 2025 email is controlling continuity evidence:

- `GMAIL:1956324bc0b0b531`
- Hubbard stated it “used to produce events.”

Governed result:

- `LIFE-038` Paws in the Park — HOLD
- `LIFE-056` Palm Beach Summer Beerfest — HOLD
- `LIFE-057` Nurses Night Out — HOLD

Do not recreate active outreach-cycle controls for those events without new dated current organizer evidence.

The Feb. 13, 2027 Orlando Pet Alliance Paws in the Park is a different event identity and must not be merged.

## Evidence boundaries that must not regress

- Annual/cumulative LeadPerfection attribution is not attendance proof.
- Historical booth/location evidence is not automatically a current or best location.
- Same-market/same-venue evidence from a different organizer is not same-organizer continuity.
- Predecessor-cycle costs, deposits, deadlines, maps, logistics and contract mechanics are not current terms unless explicitly verified current.
- Similar event names do not establish same identity.
- Historical organizer/person labels do not establish a current person.
- Organizer-response-only blockers are not internal-search blockers.
- Never manufacture a numeric maximum when only a minimum is verified; render minimum-only cost as `$X+`.
- Never create a hard deadline from prior-cycle timing or planning precedent.

## Continuation infrastructure now adopted

The durable protocol is in `PARADISE_SHOWS_CONTINUATION_PROTOCOL.md`.

Supabase now supports immutable semantic checkpoints through:

`public.shows_app_create_continuation_checkpoint(payload_jsonb, reason_text)`

Each semantic checkpoint is attached to a complete SHOW/PAYMENT snapshot.

`CONTINUATION` rows are immutable and are not removed by the normal 250 operational-snapshot pruning rule.

## Rejected / do not repeat

- Do not use chat summaries as production authority.
- Do not resume from PR #284 as current state.
- Do not merge stale PR #312; PR #316 superseded it.
- Do not use Palm Beach Liquors `/events` as a current event calendar.
- Do not infer current Dovalo identity.
- Do not merge Orlando Pet Alliance Paws into Hubbard Paws.
- Do not infer current Vero 2027 payment mechanics from the Jan. 2026 predecessor-cycle booking reply.
- Do not label historical booth references “best” unless the evidence supports that exact claim.

## Exact next action

1. On the next `Go` / `Continue`, read this file first.
2. Compare the live `paradise-shows-public` head, active `shows-api`, latest READY catalog, live opportunity count, review disposition counts, current shows/payments and historical outreach set.
3. If production is ahead, reconcile this checkpoint before research.
4. If production matches, continue the field-completeness/value audit from the **18-live-target / PR #319** baseline.
5. Select the next highest-value unresolved opportunity or blocker from live governed data and current official/Gmail/Drive evidence.
6. Do not reopen Palm Beach Liquors, Hubbard continuity, Vero predecessor-cycle terms, ArtiGras stale PR #312, or other closed research unless genuinely new evidence appears.
7. Before the next substantial batch, create a new `IN_PROGRESS` semantic checkpoint; after completion/verification, replace this canonical checkpoint and create a `COMPLETE` semantic checkpoint.

## Resume contract

The order of truth for continuation is:

**live GitHub + governed Supabase → this canonical checkpoint → older immutable checkpoints → chat summaries/memory**

If there is a conflict, stop using the stale checkpoint, reconcile it to production, and only then continue.
