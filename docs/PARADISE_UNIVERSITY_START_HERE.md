# Paradise University v1 — START HERE

Status: **MACHINE-ONLY PRE-PROMOTION CONTROL — NOT PRODUCTION AUTHORIZED**  
As of: 2026-08-17

This is the current in-repository status pointer for Paradise University v1. Read it before relying on older review, physical-test, opener-decision, red-team, or closeout records.

Current machine gate: `PARADISE_UNIVERSITY_PREPROMOTION_GATE_V21.json`.

## Current controlled candidate

- Working branch: `agent/paradise-university-v1`
- Immutable browser runtime: `3cbbbf5006eb27926c362a97ee959ddadb8b227e`
- Immutable runtime URL: `https://rawcdn.githack.com/twiztd1166/proud-math-b7d8/3cbbbf5006eb27926c362a97ee959ddadb8b227e/index.html`
- Validated field baseline commit: `5e7efc40de524bef0e63c76595c3c518925888b9`
- Validated field dataset SHA-256: `a98b8badf4c3df616fb091eb32ff85f70682f226e4fcd55591f3784b37abe200`
- Field denominator: 78 jurisdictions / 76 GO / 2 NO-GO
- NO-GO jurisdictions: Punta Gorda; Tarpon Springs

No browser-runtime asset was changed by the release-path or repository-governance hardening work.

## Machine validation status

Paradise University / Daily Training machine coverage remains PASS for the frozen runtime. The repository-governance control checkpoint `9343423b311285dba9ef5e33be071f131f162cf7` passed all four University workflows on the same head:

- Full Paradise University validator — `32073329727` — PASS
- Content hardening — `32073329730` — PASS
- UX polish / Daily Training — `32073329728` — PASS
- Adversarial red team — `32073329713` — PASS

Subsequent governance work changes only workflows, validators and documentation. The release-isolation validator continues to enforce the frozen field/runtime boundary.

The v21 architecture also machine-constrains the GitHub Actions write surface. `scripts/validate-release-workflow-controls.mjs` fails unless `.github/workflows/build-canvass-v37.yml` is the only workflow with repository `contents: write`; all validation workflows and the manual Cloudflare deployment remain read-only. The public premerge workflow is additionally forbidden from using repository secrets, `pull_request_target`, or `git push`.

The applicable machine-coverage statement remains: maximum available automated validation is PASS for the covered matrix; this does not manufacture physical-device evidence, human policy judgment, trainer-media sharing visibility, opener approval, repository-settings enforcement, or promotion authorization.

## Public premerge gate — real PR event proven

Paradise now has a unique consolidated premerge check:

- workflow: `.github/workflows/validate-paradise-public-pr.yml`
- workflow name: `Validate Paradise public premerge gate`
- required job/check context: **`Paradise public premerge gate`**
- target: pull requests into `paradise-canvass-manager-public`
- repository permission: `contents: read`
- browser release retries: `0`

A draft **DO NOT MERGE / validation-only** PR #2 was created only to exercise the real `pull_request` event. GitHub produced synthetic merge commit `2d16674d52072a97caac2d4331d9eaf541bc5232`, incorporating the current public metadata-only child with the University branch. Workflow run `32073705223` passed the complete gate on that merge result:

- release-control static validation — PASS
- controlled 78 / 76 / 2 field baseline and Training/field release isolation — PASS
- static production build — PASS
- combined iPhone field + offline + Training/UX suite — PASS
- device matrix — PASS
- adversarial/service-worker/progress-transfer matrix — PASS

The fixture is not release authorization and must be closed without merge after final-head readback.

## Human / physical testing direction

Current direction is machine-only validation. Therefore:

- Physical iPhone/PWA acceptance: **DEFERRED — NOT PASS, NOT FAIL**
- Human curriculum/compliance review: **DEFERRED — NOT PASS**
- The preserved physical checklist remains available for later use but is not a current testing request.

`PARADISE_UNIVERSITY_PHYSICAL_DEVICE_ACCEPTANCE.md` contains the current physical-test disposition. Older human-review templates remain preserved as historical/checklist material; their older runtime pins do not override this file.

## Exact canvass opener

The exact candidate remains:

> I’m not here to sell you anything. I’m [Name] with Paradise Exteriors. We’re doing some work here in the neighborhood. Quick question—have you ever gotten an estimate to replace your [windows / doors / roof]?

Current status: **CURRENT APPROVAL PENDING — EXPLICIT APPROVE OR REVISE DECISION OPEN**.

A generic instruction such as `Go`, `Continue`, or permission to keep testing does not approve this wording.

Machine legal/truthfulness audit disposition: **CONTEXT_DEPENDENT — NO AUTO-APPROVAL AND NO AUTOMATIC REWRITE**. The wording may not misrepresent the reason for solicitation or create a materially misleading overall impression, and the statement that Paradise is doing work in the neighborhood must be factually true when used. Preserve the exact candidate until a separate intentional approve/revise decision is made.

This record is decision support, not a legal opinion.

## Trainer media access-control visibility

Machine status: **UNRESOLVED — ACCESS NOT VERIFIED**.

Representative media `New Canvasser Training - Process.mp4` is accessible through the authenticated Paradise Drive connection and lives in the `Canvassing Docs` shared drive, but the available Drive connector does not expose the item-level permission list/shared-visibility fields needed to prove whether the item is restricted, domain-scoped, or anyone-with-link. An anonymous-access probe could not be completed because the available unauthenticated web/container paths could not reach the connector-derived Google URL; that tooling limitation is not evidence that the file is private.

Do not describe trainer-media sharing as access-controlled until item-level visibility can be independently verified. Shared-drive location alone is not proof of restricted access.

## Release-path hardening

The current candidate now enforces these release controls:

1. All four Paradise University validation workflows run on both the isolated University branch and the public branch.
2. All four University workflows and the field release workflow use branch-scoped concurrency, so isolated work cannot cancel a public release run.
3. Bot-generated controlled publication commits are excluded from recursively running the expensive University jobs.
4. The `Validate canvass register` public-release workflow performs the controlled field rebuild, field integrity checks, iPhone field/offline tests, and device matrix.
5. Before publishing, the field release workflow polls GitHub Actions for the exact public source SHA and requires all four University workflows to be `completed:success`.
6. Missing, failed, or still-pending gates after the 900-second bounded wait fail closed.
7. The public head is re-read before publication; a newer source commit prevents stale publication.
8. Only after field + University gates succeed may generated controlled artifacts/metadata be published.
9. `paradise-canvass-manager-validated` advances only by a normal, non-force push; non-fast-forward failure is preserved rather than rewriting validated history.
10. `latest.json` has only a narrow validated-baseline-consistent exception in release isolation; arbitrary metadata drift remains blocked.
11. `scripts/validate-release-workflow-controls.mjs` statically enforces the release path, public premerge gate, and bounded GitHub Actions write surface inside content hardening.

## Repository ruleset preparation

The remaining repository-settings gap is now reduced to a concrete, tested configuration step. Read `PARADISE_PUBLIC_RULESET_SETUP.md` before changing GitHub Settings.

Prepared design:

- **Paradise Public Release Protection** — target `paradise-canvass-manager-public`; require PRs, require the exact `Paradise public premerge gate`, require up-to-date branch status, prevent deletion, and block force pushes. The GitHub Actions app needs the narrow publication bypass only because the already-controlled post-validation workflow legitimately writes generated artifacts/metadata back to public.
- **Paradise Release Control Files** — protect workflow, validator, test and build/control paths from routine modification. GitHub Actions should not bypass this file-path ruleset; the repository owner should use PR-only bypass for intentional control changes.

The connected GitHub surface does **not** expose repository-ruleset/branch-protection writes, so these settings are **PREPARED, NOT APPLIED**. Do not call repository governance closed until GitHub Settings readback shows the rules active and an ordinary PR is blocked without the required premerge check.

## Required future promotion method

`agent/paradise-university-v1` and `paradise-canvass-manager-public` diverge at the validated baseline because public contains one later metadata-only publication commit. The validation fixture proved that GitHub can construct a normal merge result and the complete premerge gate passes on that merged tree.

When promotion is separately authorized, the safe path is:

1. normal PR/merge from the University branch into `paradise-canvass-manager-public` — never reset or force-move public;
2. require `Paradise public premerge gate` to pass on the PR merge result;
3. preserve the existing validated-baseline-consistent `latest.json` relationship through the merge;
4. after merge, run the four University workflows plus the field release workflow on the exact public merge SHA;
5. require all exact-SHA gates to succeed;
6. allow only the controlled publication workflow to create any generated public artifact/metadata commits;
7. fast-forward `paradise-canvass-manager-validated` only through the normal non-force release path;
8. read back both public and validated branch SHAs.

No production merge or branch advance has been authorized or performed by this pre-promotion work.

## Older records / supersession rule

Preserve older audit and review records as historical evidence. Where an older document pins an earlier runtime/head or states that human/physical testing is presently required, this START HERE file plus the current physical acceptance record and v21 pre-promotion gate supersede that old **current-status** statement only. Historical evidence remains intact.

- `PARADISE_UNIVERSITY_HUMAN_REVIEW_SIGNOFF.md` — retained checklist/template; older runtime pin is historical.
- `PARADISE_UNIVERSITY_AI_HUMAN_REVIEW_EVIDENCE_MAP.md` — retained evidence map; current human/physical disposition is deferred.
- `PARADISE_UNIVERSITY_OPENER_DECISION_SUPPORT.md` — exact opener-preservation rule remains useful; its older runtime pin is historical.
- `PARADISE_UNIVERSITY_RELEASE_GATE.json` — machine-only closeout snapshot.
- `PARADISE_UNIVERSITY_PREPROMOTION_GATE_V19.json` — historical pre-promotion snapshot.
- `PARADISE_UNIVERSITY_PREPROMOTION_GATE_V20.json` — prior pre-promotion snapshot; v21 is current.
- `PARADISE_PUBLIC_RULESET_SETUP.md` — current controlled repository-settings recipe; prepared, not applied.

## Hard rule

Paradise University is **not production authorized** merely because machine tests are green. Current machine testing is saturated for the frozen runtime and the real public-target PR gate is proven, but the exact opener remains pending, trainer-media sharing visibility remains unresolved, human/physical review is deferred rather than passed, repository rulesets are prepared rather than applied, and production promotion requires a separate explicit authorization.
