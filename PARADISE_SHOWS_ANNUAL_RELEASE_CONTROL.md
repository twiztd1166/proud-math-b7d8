# Paradise Shows annual-plan release control

## Purpose

A READY annual-plan run is a validated candidate, not automatically the publicly current plan.
Public reads are controlled by the explicit publication pointer in Supabase.

## Controlled release sequence

1. Construct a successor as DRAFT.
2. Validate the exact data delta and all planning invariants.
3. Promote the candidate to READY. This does **not** make it public.
4. Run `Paradise Shows annual candidate prepublication verifier` with the candidate run UUID.
5. Only after that workflow passes, record the release-validation evidence in `shows_app_annual_plan_release_validations`.
6. Move `shows_app_annual_plan_publication` for the plan year to that validated READY run.
7. Re-run the three production suites on `paradise-shows-public`:
   - governed annual-read verifier;
   - annual-plan production scope verifier;
   - full public live smoke.
8. Read back the publication pointer, API contract, and annual-plan/historical counts before closeout.

The database publication table has a foreign-key and trigger gate: a run cannot become the publication pointer unless it has a matching release-validation row and is still READY for the same plan year.

## API contract

`shows-annual-plan-api` response contract v3:

- default read: returns the explicit published run for the requested year;
- `runId` read: returns a specific READY candidate without publishing it;
- `published`: true only when the selected run matches the current publication pointer;
- `publication`: identifies the current published run and publication metadata;
- canonical response order: exact date -> structured estimate -> expected-month midpoint -> ON_DEMAND -> undated, then PURSUE/WATCH/RESEARCH, HIGH/MEDIUM/LOW, canonical event, plan ID.

## Current 2027 control

Published run: `83a90da8-d460-413f-8ca4-7735bcbe0f88` (R19).

R19 release evidence was seeded from the production checks on final release commit `1ce7a24aa97e95dec2048fed09089ee2e65988ae`:

- governed annual-read run `34853339450` — PASS;
- production scope/history run `34853339418` — PASS;
- full mature smoke run `34853339607` — PASS.

R19 data remains 291 rows / 284 profiles / 45 PURSUE / 246 WATCH, with 381 fixed overlaps / 0 reciprocal-uncontrolled and 171 historical-audit rows.

## Safety boundary

Do not move the publication pointer before candidate validation. Do not treat a READY row as evidence that the public plan changed. Do not mutate annual-plan rows merely to publish a validated candidate.
