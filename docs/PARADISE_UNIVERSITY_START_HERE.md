# Paradise University v1 — START HERE

Status: **MACHINE-ONLY PRE-PROMOTION CONTROL — NOT PRODUCTION AUTHORIZED**  
As of: 2026-08-17

This is the current in-repository status pointer for Paradise University v1. Read it before relying on older review, physical-test, opener-decision, red-team, or closeout records.

## Current controlled candidate

- Working branch: `agent/paradise-university-v1`
- Immutable browser runtime: `3cbbbf5006eb27926c362a97ee959ddadb8b227e`
- Immutable runtime URL: `https://rawcdn.githack.com/twiztd1166/proud-math-b7d8/3cbbbf5006eb27926c362a97ee959ddadb8b227e/index.html`
- Validated field baseline commit: `5e7efc40de524bef0e63c76595c3c518925888b9`
- Validated field dataset SHA-256: `a98b8badf4c3df616fb091eb32ff85f70682f226e4fcd55591f3784b37abe200`
- Field denominator: 78 jurisdictions / 76 GO / 2 NO-GO
- NO-GO jurisdictions: Punta Gorda; Tarpon Springs

No browser-runtime asset was changed by the current release-path hardening work.

## Machine validation status

Paradise University / Daily Training machine coverage remains PASS for the frozen runtime. The last complete four-workflow functional checkpoint before release-path hardening was `d4b0080c6d80d2b93a372a91222f581fcf949fb2`, where all four University workflows passed on the same head:

- Full Paradise University validator — `32069575291` — PASS
- Content hardening — `32069575250` — PASS
- UX polish / Daily Training — `32069575272` — PASS
- Adversarial red team — `32069575300` — PASS

The subsequent release-isolation/control repair head `3f4e4e65ab72ca8de27d9f44f2ffd691cf364c07` re-approved only the controlled public-release workflow path inside the release-isolation validator after that validator correctly rejected the new release-workflow modification. On that repair head, the full University validator passed release isolation and the complete iPhone/offline/Training/device matrix. No app-runtime or field-data exception was added.

The applicable machine-coverage statement remains: maximum available automated validation is PASS for the covered matrix; this does not manufacture physical-device evidence, human policy judgment, trainer-media sharing visibility, opener approval, or promotion authorization.

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

Current statutory/source references used for that machine audit:

- Florida Statutes § 501.047 — home-solicitation misrepresentation restrictions
- Florida Statutes § 501.204 — Florida Deceptive and Unfair Trade Practices Act
- Federal Trade Commission truth-in-advertising / deception guidance

This record is decision support, not a legal opinion.

## Trainer media access-control visibility

Machine status: **UNRESOLVED — ACCESS NOT VERIFIED**.

Representative Tony media was resolved through the connected account in Paradise's `Canvassing Docs` shared drive, but the available Drive connector does not expose the item-level permission list/shared-visibility fields needed to prove whether an item is restricted, domain-scoped, or anyone-with-link.

Do not describe trainer-media sharing as access-controlled until item-level visibility can be independently verified. Shared-drive location alone is not proof of restricted access.

## Release-path hardening

The pre-promotion audit found that the four University workflows previously ran only on the isolated University branch, while the field release workflow published the public branch without requiring those University gates and did not advance the stable validated branch.

The isolated candidate now hardens that architecture as follows:

1. All four Paradise University validation workflows are configured for both `agent/paradise-university-v1` and `paradise-canvass-manager-public`.
2. Bot-generated publication commits are excluded from recursively running the expensive University jobs.
3. The `Validate canvass register` public-release workflow still performs the controlled field rebuild, field integrity checks, iPhone field/offline tests, and device matrix.
4. Before publishing, the field release workflow polls GitHub Actions for the exact public source SHA and requires all four University workflow names to be present and `completed:success`.
5. A missing, pending beyond the bounded wait, or failed University gate causes the release workflow to fail closed.
6. Only after the field and University gates succeed may generated controlled artifacts/metadata be published.
7. The workflow then uses a normal, non-force push to advance `paradise-canvass-manager-validated` to the validated artifact SHA.
8. A non-fast-forward validated-branch update therefore fails rather than rewriting stable validated history.

The release workflow is also configured to parse on the isolated University branch while skipping its publishing job there. GitHub accepted that workflow and created the skipped isolated-branch run, proving parser acceptance without executing a production publish.

## Required future promotion method

`agent/paradise-university-v1` and `paradise-canvass-manager-public` currently diverge at the validated baseline because the public branch contains one later metadata-only publication commit. Therefore **do not reset or force-move public to the University branch**.

When promotion is separately authorized, the safe path is:

1. normal PR/merge from the University branch into `paradise-canvass-manager-public`;
2. let the resulting public merge SHA run the four University workflows plus the field release workflow;
3. require the exact-SHA gates to succeed;
4. allow the release workflow to publish any generated controlled metadata/artifacts and fast-forward `paradise-canvass-manager-validated`;
5. read back both public and validated branch SHAs after completion.

No production merge or branch advance has been authorized or performed by this pre-promotion work.

## Branch-protection residual risk

GitHub branch metadata currently reports the working/public/validated branches as unprotected. The connected GitHub surface available for this work does not expose a branch-protection/ruleset write action.

The fail-closed workflow materially improves the normal release path, but it cannot prevent a sufficiently privileged manual/direct ref update outside that workflow. Treat branch protection/rulesets as a separate repository-governance improvement when an authorized settings surface is available.

Do not weaken the release workflow to compensate for the missing settings capability.

## Older records / supersession rule

Preserve older audit and review records as historical evidence. Where an older document pins an earlier runtime/head or states that human/physical testing is presently required, this START HERE file plus the current physical acceptance record and current pre-promotion gate supersede that old **current-status** statement only. The historical evidence itself remains intact.

In particular:

- `PARADISE_UNIVERSITY_HUMAN_REVIEW_SIGNOFF.md` — retained checklist/template; older runtime pin is historical.
- `PARADISE_UNIVERSITY_AI_HUMAN_REVIEW_EVIDENCE_MAP.md` — retained evidence map; current human/physical disposition is deferred.
- `PARADISE_UNIVERSITY_OPENER_DECISION_SUPPORT.md` — exact opener-preservation rule remains useful; its older runtime pin is historical.
- `PARADISE_UNIVERSITY_RELEASE_GATE.json` — machine-only closeout snapshot; use the newer pre-promotion gate for current release-path status.

## Hard rule

Paradise University is **not production authorized** merely because machine tests are green. Current machine testing is saturated for the frozen runtime, but the exact opener remains pending, trainer-media sharing visibility remains unresolved, human/physical review is deferred rather than passed, branch protection is not enforced by repository settings, and production promotion requires a separate explicit authorization.
