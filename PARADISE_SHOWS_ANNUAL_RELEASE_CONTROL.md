# Paradise Shows annual-plan release control

## Purpose

A READY annual-plan run is a validated candidate, not automatically the publicly current plan.
Public annual reads are controlled by the explicit publication pointer in Supabase.

This file defines the stable release contract. Exact release commit SHAs, workflow run IDs, validation timestamps, and final evidence belong in `shows_app_annual_plan_release_validations`; do not duplicate those changing identifiers here as a second source of truth.

## Controlled release sequence

1. Construct a successor as DRAFT.
2. Validate the exact data delta and all planning invariants.
3. Promote the candidate to READY. This does **not** make it public.
4. Run `Paradise Shows annual candidate prepublication verifier` with the candidate run UUID.
5. Only after that workflow passes, record the release-validation evidence in `shows_app_annual_plan_release_validations`.
6. Move `shows_app_annual_plan_publication` for the plan year to that validated READY run.
7. Re-run the production suites on `paradise-shows-public`:
   - governed annual-read verifier;
   - annual-plan production scope verifier;
   - full public live smoke;
   - legacy annual compatibility verifier.
8. Read back the publication pointer, API contract, annual-plan/historical counts, and release-validation row before closeout.

The publication table has a foreign-key and trigger gate: a run cannot become the publication pointer unless it has a matching release-validation row and is still READY for the same plan year.

## Canonical annual API contract

`shows-annual-plan-api` is the only authoritative browser annual-plan endpoint.

Response contract v3:

- default read: returns the explicit published run for the requested year;
- `runId` read: returns a specific READY candidate without publishing it;
- `published`: true only when the selected run matches the current publication pointer;
- `publication`: identifies the current published run and publication metadata;
- canonical response order: exact date -> structured estimate -> expected-month midpoint -> ON_DEMAND -> undated, then PURSUE/WATCH/RESEARCH, HIGH/MEDIUM/LOW, canonical event, plan ID.

`shows_app_annual_plan_current` must resolve the same publication pointer. It must not independently mean "newest READY."

## Legacy annual surfaces

### `shows-history-api?action=annualPlan`

Compatibility-only. As of `shows-history-api` v4, this legacy annual read selects the explicit publication pointer while preserving its older annual response shape/version. Historical Coverage behavior remains separately run-addressable and is not a public-currentness signal.

### `shows-api?action=annualPlan`

**Compatibility-only / non-authoritative.** As of `shows-api` v92, this legacy annual read resolves the explicit `shows_app_annual_plan_publication` pointer and then requires the selected run to remain READY for the same plan year. It preserves the legacy v1 annual response shape and downstream row/summary behavior.

The complete pre-change v91 operating-function source was mechanically captured from Supabase into version control before modification, with a tested rollback path. The v92 release changed only the legacy `annualPlan` run selector and passed operating authentication checks plus the full production regression stack. The current production browser still must not use this route as its annual-plan authority; `shows-annual-plan-api` remains the sole authoritative browser annual endpoint.

The repository regression must continue to prove that `public/app-annual-api.js` points only to `shows-annual-plan-api`, that `shows-history-api` annual compatibility resolves the published run, and that legacy `shows-api?action=annualPlan` cannot define public currentness independently of the publication pointer.

## Current 2027 control

Published run: `83a90da8-d460-413f-8ca4-7735bcbe0f88` (R19).

Stable R19 invariants:

- 291 annual rows;
- 284 profiles;
- 45 PURSUE / 246 WATCH / 0 RESEARCH;
- 381 fixed overlap pairs / 0 reciprocal-uncontrolled;
- 17 fixed PURSUE/PURSUE pairs / 0 uncontrolled;
- 2 estimate-driven PURSUE/PURSUE pairs / 0 uncontrolled;
- 171 historical-audit rows.

Current release-control stack:

- `shows-annual-plan-api` v5 / response contract v3;
- `shows-history-api` v4 for publication-aligned legacy annual compatibility;
- `shows-api` v92 for publication-aligned general-API annual compatibility while preserving its operating API role;
- explicit 2027 publication pointer -> R19;
- READY candidate preview remains separate from publication.

Read the R19 row in `shows_app_annual_plan_release_validations` for the exact validated commit, workflow run IDs, attempt numbers, timestamps, and hardening evidence.

## Safety boundary

Do not move the publication pointer before candidate validation. Do not treat a READY row as evidence that the public plan changed. Do not mutate annual-plan rows merely to publish a validated candidate. Do not use a compatibility endpoint as an alternate definition of "current." Do not broaden compatibility-endpoint fixes into unrelated operating-API changes without separate review, rollback, and regression proof.
