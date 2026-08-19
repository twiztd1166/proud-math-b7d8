# Paradise University v1 — START HERE

Status: **PRODUCTION RELEASED / VALIDATED — TRAINING EXPERIENCE v4 + PARADISE PERFORMANCE v1 SOFTWARE FOUNDATION**  
As of: 2026-08-19

This is the current in-repository status pointer. Historical pre-promotion gates, machine reviews, remediation records, and physical-device records remain preserved as historical evidence and must not be rewritten into PASS.

Current release gate: `PARADISE_UNIVERSITY_RELEASE_GATE.json`  
Current exact release pointer: `latest.json`  
Historical pre-promotion gate: `PARADISE_UNIVERSITY_PREPROMOTION_GATE_V22.json`  
Deferred University physical record: `PARADISE_UNIVERSITY_PHYSICAL_DEVICE_ACCEPTANCE_V4.md`

## Current validated production release

Do **not** hard-code the moving stable commit in this document. Resolve the current exact validated release from `latest.json`:

- exact validated SHA: `latest.json.sha`
- immutable runtime URL: `latest.json.url`
- validated status: `latest.json.validated` must be `true`
- stable validated branch: `paradise-canvass-manager-validated`
- stable manager URL: `https://raw.githack.com/twiztd1166/proud-math-b7d8/paradise-canvass-manager-validated/index.html`
- dataset SHA-256: `a98b8badf4c3df616fb091eb32ff85f70682f226e4fcd55591f3784b37abe200`
- field denominator: **78 jurisdictions / 76 GO / 2 NO-GO**
- NO-GO: **Punta Gorda; Tarpon Springs**
- change control: **dataset unchanged · 0 jurisdiction changes · 0 classification changes**

The stable UI surface is **Lookup · Training · Daily Check · History**. Lookup remains authoritative. There is no visible Paradise Performance tab in this release.

## Historical release evidence

The first unified application-payload release was validated at:

`c76792c6202cb9d4e75b51dea4a6c8ba3c4e4270`

Its metadata-only child was:

`6d54c7b75a57bfdb94dbfc596504ccb6f152ca75`

Those SHAs are **historical evidence**, not the moving current-release pointer. Subsequent docs/control-only validated releases may advance the stable commit without changing the application payload. The current exact release must therefore always be read from `latest.json`.

The release-control defect that blocked the first publication was a shallow Git checkout in the validated/public ancestry check. The validated SHA was genuinely an ancestor of the public candidate, but `fetch-depth: 2` prevented Git from proving it. The release-control fix changed ancestry checks to full history and removed the remaining legacy force-promotion path.

Controlled evidence:

- ancestry failure reproduced: run `32226496599` — FAIL at ancestry check only;
- ancestry corrected read-only diagnostic: run `32226577491` — PASS;
- full corrected read-only release mirror: run `32227074297` — PASS end to end;
- release-control repair: PR #11;
- first unified production metadata publication: `6d54c7b75a57bfdb94dbfc596504ccb6f152ca75`;
- PR #13 docs/control closeout premerge: run `32228244109` — PASS end to end;
- PR #13 validated control commit: `f8ed532721a666a31c5f25a1239157fd2c9fd2c1`;
- PR #13 metadata-only child: `6e3194f571e86fac9f452426a6ea675ed3a19bbd`;
- manual validated-ref movement: **none**;
- force promotion: **none**.

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
2. Exact public candidates must satisfy the controlled 78 / 76 / 2 baseline and exact dataset hash.
3. Published release metadata must match either the frozen field baseline metadata or the exact metadata object currently published on the public branch; arbitrary SHAs are rejected.
4. Corrected recovery ancestry checks use complete Git history.
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

**Production release is proven; deferred or waived controls are not.** Do not represent machine validation, production publication, or stable-branch promotion as physical-device evidence, human compliance approval, opener approval, trainer-media sharing verification, repository-ruleset enforcement, or Paradise Performance physical-hardware acceptance.
