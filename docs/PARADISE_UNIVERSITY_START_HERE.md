# Paradise University v1 — START HERE

Status: **PRODUCTION RELEASED / VALIDATED — TRAINING EXPERIENCE v4 + PARADISE PERFORMANCE v1 SOFTWARE FOUNDATION**  
As of: 2026-08-19

This is the current in-repository status pointer. Historical pre-promotion gates, machine reviews, remediation records, and physical-device records remain preserved as historical evidence and must not be rewritten into PASS.

Current release gate: `PARADISE_UNIVERSITY_RELEASE_GATE.json`  
Current deployment metadata: `latest.json`  
Historical pre-promotion gate: `PARADISE_UNIVERSITY_PREPROMOTION_GATE_V22.json`  
Deferred University physical record: `PARADISE_UNIVERSITY_PHYSICAL_DEVICE_ACCEPTANCE_V4.md`

## Current validated production state

Two SHA concepts are deliberately separated so the control document does not become stale every time the control document itself changes:

- **Immutable validated application runtime SHA:** `c76792c6202cb9d4e75b51dea4a6c8ba3c4e4270`
- **Current stable control/release head:** read from `latest.json` and `paradise-canvass-manager-validated`; those two authorities must agree exactly.
- Stable manager URL: `https://raw.githack.com/twiztd1166/proud-math-b7d8/paradise-canvass-manager-validated/index.html`
- Immutable application-runtime URL: `https://rawcdn.githack.com/twiztd1166/proud-math-b7d8/c76792c6202cb9d4e75b51dea4a6c8ba3c4e4270/index.html`
- Dataset SHA-256: `a98b8badf4c3df616fb091eb32ff85f70682f226e4fcd55591f3784b37abe200`
- Field denominator: **78 jurisdictions / 76 GO / 2 NO-GO**
- NO-GO: **Punta Gorda; Tarpon Springs**
- Change control: **dataset unchanged · 0 jurisdiction changes · 0 classification changes**

The post-release control closeout does **not** change application runtime bytes. The stable UI surface remains **Lookup · Training · Daily Check · History**. Lookup remains authoritative. There is no visible Paradise Performance tab in this release.

The exact current stable control SHA is intentionally not embedded in this file. Embedding a file's own containing commit SHA would create self-referential churn: updating the pin changes the commit SHA again. `latest.json` plus the validated branch are therefore the authoritative current control-head pin.

## Production release evidence

The application release was validated and published at immutable application-runtime SHA `c76792c6202cb9d4e75b51dea4a6c8ba3c4e4270`.

Controlled evidence:

- ancestry failure reproduced: run `32226496599` — FAIL at ancestry check only;
- ancestry corrected read-only diagnostic: run `32226577491` — PASS;
- full corrected read-only application-release mirror: run `32227074297` — PASS end to end;
- release-control repair: PR #11;
- initial application-release metadata commit: `6d54c7b75a57bfdb94dbfc596504ccb6f152ca75`;
- manual validated-ref movement: **none**;
- force promotion: **none**.

The initial release-control defect was a shallow Git checkout in the validated/public ancestry check. The validated SHA was genuinely an ancestor of the public candidate, but `fetch-depth: 2` prevented Git from proving it. The corrected release path uses full history and normal non-force validated-branch advancement.

## Post-release control closeout

PR #13 corrected the two stale current-status pointers and exposed a stale `latest.json` allowlist assertion in the Training release-isolation validator.

Evidence:

- stale validator discovery: run `32228101923` — field baseline PASS, then stale metadata assertion FAIL;
- corrected PR #13 premerge: run `32228244109` — full public premerge PASS;
- application/runtime bytes unchanged by the closeout;
- controlled field dataset unchanged.

The release-isolation validator is now being hardened so future valid promotions do not require another hard-coded SHA update. A non-baseline `latest.json` is accepted only when it is the exact public copy, its SHA equals the actual validated-branch head, and that SHA is an ancestor of public.

## Training Experience v4

Training Experience v4 remains machine-validated for the current release, including:

- same-day Today progress and resume;
- focused lesson-step resume;
- Learn → optional Watch/Listen → Practice → Quick Check → Complete flow;
- Quick Check forward gating and same-check retry;
- same-scenario Practice retry;
- minimum 44 CSS-pixel critical controls where applicable;
- 200% text/device containment;
- exact-current-cache offline readiness;
- manager-assigned training remains intentionally excluded.

Production release does not expand curriculum authority, sales authority, pricing authority, certification authority, or field authorization.

## Release-path controls

The release path remains fail-closed:

1. Public PR validation is read-only and exercises field, offline, Training/UX, device, and adversarial coverage.
2. Exact public candidates must satisfy the controlled **78 / 76 / 2** baseline and exact dataset hash.
3. Current release metadata must either equal the exact historical baseline or be the exact public `latest.json` whose SHA equals the validated branch and is an ancestor of public.
4. The corrected recovery path validates full Git ancestry with complete history before release.
5. `latest.json` is generated only after successful exact-SHA validation.
6. Stable validated promotion is a normal non-force advancement only.
7. The legacy force-promotion path has been removed.

Repository ruleset preparation remains **PREPARED — NOT APPLIED**. This release does not claim GitHub-settings enforcement that has not actually been applied.

## Residual human / physical / authority controls

These remain explicit and are **not converted to PASS by production release**:

- University physical iPhone/PWA acceptance: **DEFERRED — NOT PASS, NOT FAIL**
- Human curriculum/compliance review: **DEFERRED — NOT PASS**
- Exact canvass opener: **CURRENT APPROVAL PENDING**
- Trainer-media item-level sharing visibility: **MACHINE UNRESOLVED — ACCESS NOT VERIFIED**
- Public branch ruleset: **PREPARED — NOT APPLIED**
- Paradise Performance physical hardware acceptance: **UNTESTED / WAIVED — NOT PASS**

Paradise Performance v1 software/source/native-shell foundation is GREEN; its physical-hardware acceptance waiver remains a separate explicit limitation.

## Exact canvass opener

Candidate remains unchanged:

> I’m not here to sell you anything. I’m [Name] with Paradise Exteriors. We’re doing some work here in the neighborhood. Quick question—have you ever gotten an estimate to replace your [windows / doors / roof]?

Status: **CURRENT APPROVAL PENDING — explicit APPROVE or REVISE decision remains open.** Production promotion did not approve this wording.

## Layer-3 boundary

No Layer-3 write or promotion is created by this repository release closeout. Existing Layer-3 controls remain governed separately and must be read back before any future Layer-3 mutation.

## Hard rule

**Production release is proven; deferred or waived controls are not.** Do not represent machine validation, production publication, or stable-branch promotion as physical-device evidence, human compliance approval, opener approval, trainer-media sharing verification, repository-ruleset enforcement, or Paradise Performance physical-hardware acceptance. Resolve the current stable control head from `latest.json` and the validated branch, which must agree exactly.
