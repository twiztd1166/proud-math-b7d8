# Paradise University v1 — Deep Automated Red-Team Audit

Status: **PASS — AUTOMATED DEEP RED TEAM / NO BLOCKING MACHINE-DETECTABLE DEFECT IN COVERED MATRIX**

Release status: **NOT RELEASE READY**

Date: 2026-08-17  
Audit mode: `AUTOMATED_DEEP_RED_TEAM_NO_HUMAN_CHECK_REQUESTED`  
Working branch: `agent/paradise-university-v1`  
Immutable browser runtime audited: `8a74bd78bb57369dbaeb4f6708a82db538bc19f7`  
Immutable runtime URL: `https://rawcdn.githack.com/twiztd1166/proud-math-b7d8/8a74bd78bb57369dbaeb4f6708a82db538bc19f7/index.html`  
Exact fully-green pre-closeout control head: `5f3ae08dda63f3ca5785b233ffe50cfc1c685262`

## Bottom line

The automated deep-red-team surface is saturated to the strongest machine-testable point reached in this build.

`AUTOMATED_DEEP_RED_TEAM = PASS`

`BLOCKING_MACHINE_DETECTABLE_DEFECTS_REMAINING_IN_COVERED_MATRIX = 0`

`PARADISE_UNIVERSITY_RELEASE_STATUS = NOT_RELEASE_READY`

The distinction matters. Automated testing does **not** create current-runtime physical iPhone/PWA evidence, human curriculum/currentness approval, proof of Google Drive sharing restrictions, or production-promotion authorization. Those remain separate open gates.

## Exact green validation stack

All four validation workflows completed successfully on exact head `5f3ae08dda63f3ca5785b233ffe50cfc1c685262`:

- Full Paradise University validator — run `32042429862` — **PASS**.
- Content hardening — run `32042429860` — **PASS**.
- UX polish — run `32042430006` — **PASS**.
- Dedicated adversarial red team — run `32042429868` — **PASS**.

The dedicated adversarial job ran with `--retries=0` and reported:

**90 passed**

The current red-team matrix contains **18 adversarial tests per profile × 5 configured browser/device profiles = 90 executions**:

- WebKit iPhone
- WebKit small iPhone
- WebKit iPhone landscape
- WebKit iPad
- Chromium Android

## Adversarial coverage and hardening

### 1. Current-version readiness cannot be inherited from stale progress

The current completion model requires the active curriculum version. Red-team coverage proves:

- raw prior-version completion can remain visible as history;
- prior-version completion is not current completion;
- prior-version completion cannot satisfy current readiness;
- prior-version Quick Check state cannot satisfy the current Quick Check version;
- stale lesson UI identifies prior-version state;
- forward navigation remains blocked until the current version is satisfied;
- the employee must satisfy the current-version completion path rather than silently inheriting stale readiness.

This remains a defense-in-depth hardening result, not evidence that a live stale-readiness bypass existed before the audit.

### 2. Progress-transfer input is treated as untrusted data

The manual JSON progress-transfer feature is not a trusted certification credential. Controls now include:

- strict allowlist of transferable local-storage fields;
- unexpected fields rejected;
- prototype-pollution-style `__proto__` field rejected;
- malformed JSON-backed stores rejected before writes;
- payload and per-store size ceilings;
- invalid `puLastMedia` length rejected;
- unrelated local-storage data excluded from export;
- imported media notes rendered inert against markup/script injection;
- state snapshot / rollback if a write fails;
- transfer-domain **snapshot replacement** rather than merge-patch behavior;
- destination-only Quick Check/media state cannot survive and combine with an imported snapshot;
- older imported history does not bypass current-version gates.

Progress transfer version remains:

`2026.08.17-pu-progress-transfer-v2-hardened`

### 3. Destructive import recoverability is now guarded

The later red-team sweep found a real recoverability defect: a structurally valid empty or sparse progress backup could replace existing device progress immediately, without first warning the user.

Risk classification:

- **could erase local device-training history**;
- **could not manufacture current readiness**;
- **could not manufacture official certification authority**.

Remediation:

- import guard version `2026.08.17-pu-progress-import-guard-v1`;
- if the destination device already contains transferable Paradise University state, the user is explicitly warned that the import will replace it;
- Cancel performs **zero transfer-domain writes** and leaves existing values unchanged;
- Continue preserves the hardened snapshot-replacement semantics and still removes destination-only stale transfer state;
- if confirmation capability is unavailable, the destructive path fails closed.

Dedicated browser tests exercise both Cancel and Continue across every configured profile as part of the 90/90 matrix.

### 4. Corrupt or stale browser storage fails closed

`training-storage-hardening-v1.js` version `2026.08.17-pu-storage-hardening-v1` sanitizes the top-level object stores used by readiness, Quick Checks, media, Practice, and notes.

The audit specifically attacks valid JSON with an invalid top-level shape such as `null`, arrays, strings, and numbers. Invalid stores are discarded rather than treated as training evidence. The app then continues without creating readiness or throwing a training/player/practice error.

### 5. Forged local progress cannot create official certification

The red team deliberately forges local progress indicating completed lessons and required Quick Checks.

The app still preserves the separate `OFFICIAL CERTIFICATION` boundary and states that manager demonstration, field verification, and current Paradise requirements remain separate from device progress.

This is intentional. Without a trusted server/signature authority, a device owner can edit local JSON. Paradise University therefore must never treat local/manual progress as official release or certification authority.

### 6. Navigation corruption fails closed

The contextual Back stack is attacked with a malformed/hostile page target. The app safely returns to Training home and does not execute a JavaScript URL or open an attacker-controlled dialog.

### 7. Trainer-media attack surface

Automated catalog checks confirm:

- 79 indexed trainer media records exactly;
- 79 unique media IDs;
- Tony Hoty: 24;
- Dave Yoho: 4;
- Grosso University: 51;
- SOURCE_LIBRARY: 67;
- curated: 12;
- no trainer media URL is mirrored onto RawGitHack/raw GitHub;
- Drive-backed playback remains top-level rather than embedded;
- zero training-player iframes;
- Tony `Canvassing 101` resolves to the controlled Google Drive target and opens with `_blank` / `noopener` semantics;
- the service worker does not precache/intercept external Google Drive media.

Historical real-iPhone playback evidence on remediation runtime `ac353dcea74bbb8ca262e5f55deaa8c61ee08752` remains preserved. It is **not** relabeled as physical acceptance of current runtime `8a74bd78…`.

#### Drive sharing/access-control evidence gap

The app repository/RawGitHack shell is public, so the JavaScript catalog necessarily exposes the Google Drive URLs/IDs for the trainer assets. That design is safe as an access-control boundary only if Google Drive sharing itself is appropriately restricted.

Connected Drive metadata reads for representative Tony media and the Tony root folder did **not** return permission visibility sufficient to prove whether the assets are restricted, domain-scoped, or anyone-with-link.

Controlled disposition:

`TRAINER_MEDIA_DRIVE_SHARING_VISIBILITY = UNVERIFIED`

No Drive permissions were changed during this audit. The release record must not claim the files are access-restricted until that sharing state is independently verified.

### 8. Service-worker / offline trust boundary

The service worker was hardened beyond the original same-origin guard.

Current controls prove:

- only same-origin requests are handled;
- external Google Drive content is not cached;
- validated field-shell CORE assets remain present exactly once;
- additional CORE precache assets are limited to `training-*` JavaScript/CSS;
- install and activation semantics remain controlled;
- non-navigation cache behavior remains pinned;
- offline `index.html` refresh is allowed only from the exact app entry path **with no query string**;
- deep/query navigation cannot replace the canonical offline shell.

Current PWA cache identity:

`pcm-field-v3-12-pu-v1-content5-readiness2-practice1-checks2-more1-media1-mediaui2-player3-progress1-managerhome1-governance1-2026-08-17-playerlayout1-mediaplaylists1-salespolicy1-pricingfinance1-contracthandoff1-salesgrad1-salesclose2-salesui7-financeimpl1-financeoffice1-handoff2-assessref1-mediarights1-morelinkrights1-practice2-internalmedia1-currentness1-canvasslib1-drivetoplevel1-deepaudit1-trainingux5-experience3-redteam7`

The full validator also passed the offline iPhone regression with this exact cache and import-guard runtime.

### 9. Field authority and release isolation

Every red-team cycle reconfirmed the controlled field baseline:

- 78 jurisdictions;
- 76 GO;
- 2 NO-GO;
- Punta Gorda and Tarpon Springs remain NO-GO;
- controlled dataset SHA-256 remains `a98b8badf4c3df616fb091eb32ff85f70682f226e4fcd55591f3784b37abe200`;
- Training does not replace live municipality Lookup.

Release-isolation now also mechanically normalizes the production `index.html` back to the validated field shell and permits only the exact approved additive Training CSS/nav/scripts. `boot-v2.js` remains limited to the known Training router additions, and the service-worker exception is constrained to preserved field assets plus training-only additions and the explicit navigation hardening.

The validated production branch was re-read after the automated closeout and remained unchanged at:

`5e7efc40de524bef0e63c76595c3c518925888b9`

No Paradise University promotion occurred.

### 10. Exact opener / authority boundary

The runtime still contains exactly:

> I’m not here to sell you anything. I’m [Name] with Paradise Exteriors. We’re doing some work here in the neighborhood. Quick question—have you ever gotten an estimate to replace your [windows / doors / roof]?

The lesson remains `CURRENT APPROVAL PENDING`.

The red-team pass did not rewrite the opener and did not treat automated testing or generic continuation as named Paradise currentness approval.

### 11. Experience controls preserved

The automated stack continues to cover:

- Continue Training / current role-aware queue;
- milestones and `What You Need Next`;
- contextual Back;
- compact lesson overview;
- adaptive `Practice My Weak Areas` without fabricated weakness claims;
- Quick Check completion/forward guards;
- Sales Apprentice authority boundary;
- media Learning Tools and device-local notes;
- manual progress export/import;
- hardened snapshot replacement and destructive-import confirmation;
- no central-account-sync claim;
- no XP/streak/leaderboard release mechanic;
- no manager-assigned training/due-date experience;
- offline app shell and cached training/field assets;
- no false claim that external Drive media is offline cached.

## Red-team failure history — preserved rather than hidden

The red-team process intentionally preserves intermediate failures and distinguishes product defects from test-harness defects.

1. The original dedicated workflow initially failed because checkout was shallow and release isolation could not read the historical validated field-base commit. Checkout was corrected to full history; the release-isolation validator was not weakened.
2. An early stale-readiness test assumed historical `puLessonDone()` should remain true. Source review established the current-version control correctly returned false; the test/model were corrected to distinguish history from current readiness.
3. Early Drive-player accessibility assertions were corrected to target the actual descriptive `aria-label` while preserving canonical Drive target, `_blank`, `noopener`, and no-iframe requirements.
4. The forged-certification locator was tightened after matching both a heading and explanatory text. The attack itself was not weakened.
5. A later redteam6 expansion reached **79/85** browser executions before failing. Five failures were stale redteam5/string assertions, and one was a Chromium headless-shell segmentation fault in a redundant static service-worker inventory test. The static inventory was already proven mechanically by release isolation. The stale assertions were corrected; the redundant browser-only static test was removed. The corrected redteam6 checkpoint then passed on exact head `5f4538329a98900f90abe4247e9a40e0d0a5b8a4`.
6. The next sweep discovered the valid-but-destructive progress-import warning gap described above. It was remediated in the redteam7 runtime and covered by explicit Cancel/Continue browser regressions.
7. Final redteam7 adversarial execution passed **90/90 with retries disabled**.

These intermediate reds remain part of the record because a high-confidence audit should expose false assumptions, harness defects, and recoverability weaknesses instead of silently deleting them from history.

## Runtime / control-head separation

The last browser-runtime asset change for this audit is:

`8a74bd78bb57369dbaeb4f6708a82db538bc19f7`

After that runtime commit, the known sequential commits through pre-closeout green control head `5f3ae08dda63f3ca5785b233ffe50cfc1c685262` changed only:

- `tests/service-worker-hardening-v1.spec.js`
- `tests/offline-regression.spec.js`
- `tests/training-red-team-v1.spec.js`
- `scripts/validate-training-experience-v3.mjs`
- `.github/workflows/validate-paradise-university-red-team.yml`

No browser-runtime file changed after `8a74bd78…` in that chain.

A GitHub compare-API attempt for this interval returned 404, so this audit does **not** falsely label compare-API proof as successful. The separation above is based on the known sequential commit/file chain. Closeout documentation commits after `5f3ae08d…` likewise do not redefine the runtime.

## What this audit does not claim

The following remain open/unasserted:

- current-runtime real-iPhone Safari acceptance: **NOT RUN / UNASSERTED**;
- current-runtime freshly installed Home Screen PWA physical acceptance: **NOT RUN / UNASSERTED**;
- current-runtime external Drive playback on a real iPhone: **NOT RUN / UNASSERTED**;
- human curriculum/compliance judgment: **NOT RUN / UNASSERTED**;
- trainer-media Drive sharing/access-control visibility: **UNVERIFIED**;
- named opener-currentness decision: **OPEN**;
- explicit production-promotion authorization: **OPEN**.

Historical physical playback evidence remains evidence of the inherited top-level Drive design only. Simulator/CI results are not mislabeled as physical evidence.

## Non-blocking infrastructure observation

GitHub Actions continues to warn that `actions/checkout@v4` and `actions/setup-node@v4` target the deprecated Node.js 20 action runtime and are currently forced to Node.js 24 by the runner. This did not fail or weaken the validation. Upgrade those actions when an appropriate supported major is available.

## Final automated disposition

`AUTOMATED_DEEP_RED_TEAM = PASS`

`ADVERSARIAL_EXECUTIONS = 90 / 90 PASS`

`COVERED_MACHINE_DETECTABLE_RELEASE_DEFECT = NONE_FOUND`

`HUMAN_OR_PHYSICAL_EVIDENCE_SYNTHESIZED = NO`

`TRAINER_MEDIA_DRIVE_SHARING_VISIBILITY = UNVERIFIED`

`PARADISE_UNIVERSITY_RELEASE_STATUS = NOT_RELEASE_READY`

`PARADISE_UNIVERSITY_PRODUCTION_PROMOTION = NOT_PERFORMED`

The software is at the strongest automated-assurance point reached in this build. Remaining release controls are real evidence/authority gates, not concealed software-test failures.
