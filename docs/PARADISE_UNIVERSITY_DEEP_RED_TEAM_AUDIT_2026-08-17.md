# Paradise University v1 — Deep Automated Red-Team Audit

Status: **PASS — AUTOMATED DEEP RED TEAM / NO BLOCKING MACHINE-DETECTABLE DEFECT IN COVERED MATRIX**

Date: 2026-08-17  
Audit mode: `AUTOMATED_DEEP_RED_TEAM_NO_HUMAN_CHECK_REQUESTED`  
Working branch: `agent/paradise-university-v1`  
Immutable browser runtime audited: `c862244e15b5aba620ebf1afebe2a4d2ee1aa9ea`  
Immutable runtime URL: `https://rawcdn.githack.com/twiztd1166/proud-math-b7d8/c862244e15b5aba620ebf1afebe2a4d2ee1aa9ea/index.html`  
Exact fully-green pre-closeout control head: `579bc8e36894bd835f07f79db177f5c617df67f3`

## Bottom line

The requested no-human-check deep red-team pass is complete for the automated surface that can be tested from the repository and CI environment.

`AUTOMATED_DEEP_RED_TEAM = PASS`

`BLOCKING_MACHINE_DETECTABLE_DEFECTS_REMAINING_IN_COVERED_MATRIX = 0`

This does **not** convert human judgment or real-device evidence into an artificial PASS. Current-runtime physical iPhone/PWA testing and human curriculum/currentness judgment were not performed in this audit mode and remain unasserted.

## Exact green validation stack

All four workflows completed successfully on exact head `579bc8e36894bd835f07f79db177f5c617df67f3`:

- Full Paradise University validator — run `32034062002` — PASS.
- Content hardening — run `32034062037` — PASS.
- UX polish — run `32034062054` — PASS.
- Dedicated adversarial red team — run `32034062129` — PASS.

The dedicated red-team Playwright summary was **60 passed**.

The red-team suite contains **12 adversarial tests × 5 configured browser/device profiles = 60 executions**:

- WebKit iPhone
- WebKit small iPhone
- WebKit iPhone landscape
- WebKit iPad
- Chromium Android

## Adversarial coverage

### 1. Current-version readiness cannot be inherited from stale progress

The repository already contained a deep-audit control that makes `puLessonDone()` require the current `PU_VERSION`. The red-team pass therefore did **not** discover a live stale-completion readiness bypass.

The audit did expose an ambiguity worth hardening: raw historical completion and current-version readiness were not explicit enough at every layer. Defense-in-depth controls were added so that:

- raw prior-version completion is preserved as history;
- prior-version completion is not current completion;
- prior-version completion cannot satisfy current readiness;
- prior-version Quick Check state cannot satisfy the current Quick Check version;
- stale lesson UI shows `PRIOR VERSION`;
- forward navigation remains blocked until the current version is satisfied;
- the employee is offered `MARK COMPLETE FOR CURRENT VERSION` rather than silently inheriting old completion.

### 2. Progress-transfer input trust boundary hardened

The manual JSON progress-transfer feature is now treated as untrusted input.

Controls tested include:

- strict allowlist of transferable local-storage fields;
- unexpected fields rejected;
- prototype-pollution-style `__proto__` field rejected;
- malformed JSON-backed stores rejected before writes;
- payload and per-store size ceilings;
- invalid `puLastMedia` length rejected;
- state snapshot / rollback if a write fails;
- unrelated local-storage data is excluded from export;
- imported media notes are rendered inert against markup/script injection;
- older imported training history does not bypass current-version gates.

### 3. Forged local progress cannot create official certification

The red team deliberately forged a transfer payload showing every device lesson and required Quick Check complete.

The app still exposes the separate `OFFICIAL CERTIFICATION` boundary and states that manager demonstration, field verification, and current Paradise requirements remain separate from device progress.

This is the correct trust model. A local/manual transfer file is a convenience and continuity artifact, not a cryptographically trusted HR credential. Without a trusted server/signature authority, a device owner can edit local JSON; Paradise University therefore must never use that file alone as official certification or release authority.

### 4. Navigation corruption fails closed

The contextual Back stack was injected with a malformed/hostile page target. The app returned safely to Training home and did not execute a JavaScript URL or open a dialog.

### 5. Trainer-media attack surface

Automated checks confirmed:

- 79 indexed trainer media records exactly;
- 79 unique media IDs;
- Tony Hoty: 24;
- Dave Yoho: 4;
- Grosso University: 51;
- SOURCE_LIBRARY: 67;
- curated: 12;
- no trainer URL in the catalog is a RawGitHack/raw-GitHub public media mirror;
- Drive-backed playback remains top-level rather than embedded;
- zero training player iframes;
- Tony `Canvassing 101` resolves to the controlled Google Drive file and opens with `_blank` / `noopener` semantics;
- the service worker only handles same-origin requests and does not precache/intercept Google Drive media.

Historical real-iPhone playback evidence on remediation runtime `ac353dcea74bbb8ca262e5f55deaa8c61ee08752` remains preserved, but it is not re-labeled as physical acceptance of the current runtime.

### 6. Field authority and controlled baseline

Every red-team workflow re-confirmed the controlled field baseline and training-release isolation:

- 78 jurisdictions;
- 76 GO;
- 2 NO-GO;
- Punta Gorda and Tarpon Springs remain NO-GO;
- controlled dataset SHA-256 remains `a98b8badf4c3df616fb091eb32ff85f70682f226e4fcd55591f3784b37abe200`;
- Training does not replace live municipality Lookup.

The validated production branch remained unchanged at `5e7efc40de524bef0e63c76595c3c518925888b9` during the audit. No Paradise University promotion occurred.

### 7. Exact opener / authority boundary

The runtime still contains exactly:

> I’m not here to sell you anything. I’m [Name] with Paradise Exteriors. We’re doing some work here in the neighborhood. Quick question—have you ever gotten an estimate to replace your [windows / doors / roof]?

The lesson remains `CURRENT APPROVAL PENDING`. The red-team pass did not rewrite the opener and did not treat automated testing as the named Paradise currentness approval.

### 8. Experience controls preserved

The automated stack continues to cover:

- Continue Training / role-aware current queue;
- milestones and `What You Need Next`;
- contextual Back;
- compact lesson overview;
- adaptive `Practice My Weak Areas` without fabricated weakness claims;
- Quick Check completion/forward guards;
- Sales Apprentice authority boundary;
- media Learning Tools and device-local notes;
- manual progress export/import;
- no central-account-sync claim;
- no XP/streak/leaderboard release mechanic;
- no manager-assigned training/due-date experience;
- offline app shell and cached training/field assets;
- no false claim that external Drive media is offline cached.

## Red-team failure history — preserved rather than hidden

The audit was intentionally allowed to fail while the new adversarial gate was being established.

1. The first dedicated workflow failed because its checkout was shallow and the release-isolation validator could not read the historical validated field-base commit. The adversarial product tests had not failed. The workflow was corrected to `fetch-depth: 0`; the validator itself was not weakened.
2. An early adversarial suite made an incorrect assumption that stale `puLessonDone()` should remain true. Deeper source review established that the existing deep-audit layer already correctly returns false for stale current-version completion. The test was corrected to distinguish raw history from current readiness, and the UI/model was hardened to make that distinction explicit.
3. The trainer-playback assertion initially looked for the visible Drive button text as the accessibility name. The controlled player uses a more descriptive `aria-label`. The assertion was corrected to verify the actual button semantics, canonical Drive target, `_blank`, `noopener`, and absence of iframes.
4. The expanded forged-certification test reached 55/60 because one locator matched both a certification heading and explanatory text across all five projects. After tightening the locator, the same five executions showed that the certification boundary is intentionally inside the collapsed `Advancement & certification details` panel. The attack was left unchanged; the test was corrected only to open that panel before requiring the boundary to be visible.
5. The final unchanged adversarial behaviors then passed **60/60**.

These intermediate reds are retained because a useful red-team process should expose test-infrastructure and model assumptions rather than paper them over.

## Runtime / control-head separation

Runtime `c862244e15b5aba620ebf1afebe2a4d2ee1aa9ea` is the last browser-runtime asset change for this audit.

The compare from that runtime through pre-closeout green control head `579bc8e36894bd835f07f79db177f5c617df67f3` contains only red-team workflow/static-validator/test changes; no browser-runtime asset changed after `c862244…`.

Therefore the immutable browser runtime remains `c862244…`; later closeout documentation does not redefine it.

## What this audit does not claim

By user direction, no new human/device check was requested. Accordingly:

- current-runtime real-iPhone Safari acceptance: **NOT RUN / UNASSERTED**;
- current-runtime freshly installed Home Screen PWA physical acceptance: **NOT RUN / UNASSERTED**;
- current-runtime external Drive playback on a real iPhone: **NOT RUN / UNASSERTED**;
- human curriculum/compliance judgment: **NOT RUN / UNASSERTED**;
- named opener-currentness decision: **OPEN**;
- explicit production-promotion authorization: **OPEN**.

Historical physical playback evidence remains evidence of the inherited top-level Drive design only. Simulator/CI results are not mislabeled as physical evidence.

## Non-blocking infrastructure observation

GitHub Actions emitted a maintenance warning that `actions/checkout@v4` and `actions/setup-node@v4` target deprecated Node.js 20 action runtimes and are currently being forced to Node.js 24 by the runner. This did not fail or weaken the validation, but the workflow actions should be upgraded when an appropriate supported major version is available.

## Final automated disposition

`AUTOMATED_DEEP_RED_TEAM = PASS`

`COVERED_MACHINE_DETECTABLE_RELEASE_DEFECT = NONE_FOUND`

`HUMAN_OR_PHYSICAL_EVIDENCE_SYNTHESIZED = NO`

`PARADISE_UNIVERSITY_PRODUCTION_PROMOTION = NOT_PERFORMED`

The software is at the strongest automated-assurance point reached in this build. Remaining release controls are non-automated authority/evidence decisions, not concealed software-test failures.
