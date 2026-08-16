# Paradise University v1 — Physical iPhone / PWA Acceptance Gate

Status: REQUIRED HUMAN DEVICE GATE — NOT YET PASSED

As of: 2026-08-16

This checklist implements the physical-device requirement in `PARADISE_UNIVERSITY_V1_SPEC.md`. Automated WebKit/iPhone regression is necessary but does **not** substitute for a real iPhone Safari + installed PWA test.

## Current software baseline

Current fully green runtime candidate: `45b0b0f887beeeae50fb7e7652c616d2b6e34842`.

Current runtime validator run: `31973581353` — PASS through syntax/build boundary, training hardening, exact field baseline, release isolation, production bundle, iPhone field regression, iPhone offline regression, Paradise University iPhone regression, currentness browser acceptance, and device matrix.

Current runtime content-hardening run: `31973581258` — PASS.

Control/documentation head after that runtime was recorded: `57ac2089b1ceb093faf11b226d16e54b036564f9`. That docs/control head also independently passed full validator run `31973759999` and hardening run `31973759895`. It does not change the app runtime used for this physical test.

Use this immutable runtime URL for the physical test so later working-branch documentation edits cannot change the tested app. Because this URL is pinned to an exact commit, use RawGitHack's permanent-cache CDN form rather than the branch/development form:

`https://rawcdn.githack.com/twiztd1166/proud-math-b7d8/45b0b0f887beeeae50fb7e7652c616d2b6e34842/index.html`

The controlled jurisdiction baseline at this candidate remains SHA `a98b8badf4c3df616fb091eb32ff85f70682f226e4fcd55591f3784b37abe200`, 78 records / 76 GO / 2 NO-GO.

## Currentness controls included in this candidate

This runtime includes the currentness hardening validated after the original physical-device packet was written:

- `Missing Parties` appointment QA is source-anchored to current Paradise 2026 Sales Representative policy: one or more homeowners or decision makers not being present for the appointment.
- The app expressly does **not** convert that rule into a blanket `spouse must be present` rule.
- The 2025-derived canvass opener remains visible for review but is labeled `CURRENT APPROVAL PENDING`.
- The opener lesson tells employees not to deploy the candidate wording merely because it appears in Paradise University and to use only the current manager-approved canvass opening until a named Paradise reviewer approves or replaces the candidate.

Physical-device acceptance verifies that these controls render and behave correctly on the actual phone. It does **not** itself approve the opener.

## Hard rule

Do not mark this gate PASS from simulator/WebKit evidence alone. A PASS requires a named tester, actual iPhone model, iOS version, browser/PWA mode, exact tested runtime commit, date/time, and recorded results below.

## Test device record

- Tester: ______________________________
- Date: ________________________________
- iPhone model: _________________________
- iOS version: __________________________
- Safari version if shown: ______________
- Exact runtime commit tested: `45b0b0f887beeeae50fb7e7652c616d2b6e34842`
- Control packet head at preparation: `57ac2089b1ceb093faf11b226d16e54b036564f9`
- App URL tested: `https://rawcdn.githack.com/twiztd1166/proud-math-b7d8/45b0b0f887beeeae50fb7e7652c616d2b6e34842/index.html`
- Installed to Home Screen: YES / NO
- Network used for online pass: __________
- Offline pass performed: YES / NO

## A. Field-app regression on physical iPhone

- [ ] App opens normally in Safari.
- [ ] App opens normally from installed Home Screen PWA.
- [ ] Lookup is immediately obvious from Training.
- [ ] Search Boca Raton and confirm current controlled field result renders normally.
- [ ] Search one known NO-GO jurisdiction and confirm NO-GO remains explicit.
- [ ] Daily Check can be opened and completed.
- [ ] History still opens normally.
- [ ] No Training screen replaces or obscures field error/failure behavior.
- [ ] No horizontal clipping or unreachable controls in portrait orientation.

## B. Training navigation / usability

- [ ] Training opens in one obvious tap.
- [ ] Continue Training is the most prominent action.
- [ ] Practice is visible without nested navigation.
- [ ] Career Path is visible without nested navigation.
- [ ] Videos & Audio is visible without nested navigation.
- [ ] My Progress is visible without nested navigation.
- [ ] More remains secondary.
- [ ] Returning to Lookup is obvious and immediate.
- [ ] A new user can follow `Training → Continue Training → lesson → Practice/Pass → Next Lesson` without explanation.

## C. Lesson / knowledge / progress behavior

- [ ] Open a lesson and confirm Learn / Watch-Listen / Practice / Pass order is readable.
- [ ] Complete a non-Quick-Check lesson and confirm local completion records correctly.
- [ ] Complete a Quick-Check lesson and confirm a wrong answer does not falsely mark knowledge passed.
- [ ] Complete the Quick Check correctly and confirm device knowledge state updates.
- [ ] Close the PWA completely and reopen it.
- [ ] Confirm lesson progress persists.
- [ ] Confirm device progress does not claim official HR/company certification.
- [ ] Confirm Sales Apprentice still shows the doorstep sales-authority warning.
- [ ] Confirm Sales Rep readiness still requires current company test / manager release.

### Currentness visual acceptance

- [ ] Open the field-opening lesson and confirm it visibly shows `CURRENT APPROVAL PENDING`.
- [ ] Confirm the field-opening lesson visibly warns not to deploy the candidate script yet and tells employees to use only the current manager-approved canvass opening.
- [ ] Confirm completing the field-opening lesson does not visually convert the candidate opener into approved/current field authority.
- [ ] Open Manager Academy → Review Appointments / Appointment QA and confirm the current Missing Parties concept is expressed as homeowners or decision makers not being present.
- [ ] Confirm the appointment-QA lesson does not present a blanket `spouse must be present` rule.

## D. Internal trainer-media behavior

Current project scope treats the curated Tony Hoty / Dave Yoho / Grosso recordings as internal Paradise employee-training content. Rights clearance is **not** a Paradise University release gate.

- [ ] Videos & Audio shows `INTERNAL TRAINING MEDIA` rather than a rights-hold warning.
- [ ] Tony Hoty, Dave Yoho, and Grosso media cards remain labeled REFERENCE or HISTORICAL as applicable.
- [ ] Trainer media can be opened from Videos & Audio.
- [ ] Trainer source links can be opened from Search / Source Library while online.
- [ ] Opening trainer media never changes its authority classification to Paradise Approved.
- [ ] Returning from media to Lookup is obvious and immediate.
- [ ] A trainer recording never overrides a live municipality result or current Paradise-approved lesson.

Project note: internal-use treatment is an operating decision for this app, not a legal opinion.

## E. Physical media playback

Use at least one internal audio item and one internal video item from the current curated catalog.

Recommended minimum pair for this test because both Drive targets and local file integrity were independently confirmed during build closeout:

- Audio: `grosso-tonality-audio` — Grosso University — Tonality and Body Language.
- Video: `grosso-tonality-video` — Grosso University — Tonality and Body Language.

Tony Hoty `tony-canvassing-101` was also independently confirmed as a valid MP3 and is a useful second audio check. Dave Yoho `dave-science-canvassing-video` is substantially larger, so test it as a secondary streaming/load check after the minimum pair rather than making the whole physical gate depend on it.

### Current Drive-embedded media path

The current trainer catalog uses Google Drive preview embeds rather than controlled `streamUrl` files. For those items:

- [ ] Drive player loads reliably in Safari while online.
- [ ] Drive player loads reliably in installed PWA while online.
- [ ] Audio/video actually starts.
- [ ] Pause/resume in the Drive player works.
- [ ] Orientation change does not trap the player.
- [ ] Close and minimize controls remain reachable.
- [ ] `MARK COMPLETE` works and persists on device.
- [ ] `SAVE FOR LATER` works and persists on device.
- [ ] `NEXT ITEM` advances to the next curated item.
- [ ] The UI accurately says exact Paradise-controlled speed / seek / resume is unavailable for Drive iframe playback.

### Controlled-stream path — only if a `streamUrl` item is added or claimed

If Paradise later loads a controlled audio/video stream and claims enhanced player controls, test:

- [ ] Play / pause.
- [ ] −15 / +30.
- [ ] Scrub / seek.
- [ ] 1x / 1.25x / 1.5x / 2x.
- [ ] Elapsed / duration display.
- [ ] Close/reopen exact resume.
- [ ] Bookmark position.
- [ ] Transcript if supplied.
- [ ] Chapters if supplied.
- [ ] Lock-screen/headset controls if claimed.
- [ ] Picture-in-picture only if claimed.

Do not fail the current Drive-embedded catalog merely because iframe playback cannot expose Paradise-native seek/speed/resume controls; instead confirm the app describes that limitation accurately.

## F. Offline installed-PWA test

1. Open the app online from the Home Screen PWA.
2. Visit Lookup, Training, Practice, Career Path, Progress, More, Source Library, and the field-opening lesson once so the currentness runtime is exercised online.
3. Enable Airplane Mode and disable Wi-Fi.
4. Relaunch the installed PWA.

PASS only if:

- [ ] Core app opens offline.
- [ ] Cached jurisdiction dataset / field behavior remains available exactly as designed.
- [ ] Training home opens.
- [ ] Core lessons open.
- [ ] Field-opening lesson still shows `CURRENT APPROVAL PENDING` offline.
- [ ] Practice opens with the 20-scenario model.
- [ ] Career Path opens.
- [ ] My Progress opens.
- [ ] Source Library metadata opens.
- [ ] Internal trainer-media cards / metadata remain visible.
- [ ] External Google Drive media is **not represented as offline-cached media**; failed external playback while offline does not break the app shell.
- [ ] No giant raw media library has been precached.
- [ ] Returning online restores external media/source access without clearing progress.

## G. Visual / touch QA

- [ ] No text clips under Dynamic Type at normal and one larger text setting.
- [ ] Buttons have usable tap targets.
- [ ] Bottom navigation remains reachable above the iPhone home indicator.
- [ ] Player close/minimize controls stay inside the viewport.
- [ ] No modal traps the user.
- [ ] No accidental double-tap is required.
- [ ] No important control depends only on hover.
- [ ] Long lesson/source titles wrap without hiding action buttons.
- [ ] The `CURRENT APPROVAL PENDING` badge/notice is readable without obscuring lesson controls.

## H. Acceptance record

### Navigation / field isolation

- Result: PASS / FAIL / NOT RUN
- Tested runtime commit: `45b0b0f887beeeae50fb7e7652c616d2b6e34842`
- Tester: _______________________________
- Date: _________________________________
- Notes: _________________________________

### Currentness rendering

- Result: PASS / FAIL / NOT RUN
- Opener shows `CURRENT APPROVAL PENDING`: YES / NO
- Missing Parties wording is homeowner/decision-maker based: YES / NO
- Blanket spouse rule absent: YES / NO
- Notes: ________________________________

### Internal audio playback

- Result: PASS / FAIL / NOT RUN
- Asset ID: _____________________________
- Playback path: DRIVE EMBED / CONTROLLED STREAM
- Notes: ________________________________

### Internal video playback

- Result: PASS / FAIL / NOT RUN
- Asset ID: _____________________________
- Playback path: DRIVE EMBED / CONTROLLED STREAM
- Notes: ________________________________

### Installed-PWA offline test

- Result: PASS / FAIL / NOT RUN
- Notes: ________________________________

## Release disposition

Until the physical device record is completed:

`PHYSICAL_DEVICE_ACCEPTANCE = OPEN`

Until one current internal audio item and one current internal video item are physically tested online on the actual iPhone/PWA:

`MEDIA_PLAYBACK_ACCEPTANCE = OPEN`

Neither status may be converted to PASS from Playwright/WebKit automation alone.

This physical-device PASS, if achieved, does **not** approve the exact canvass opener. Opener currentness remains separately controlled by `docs/PARADISE_UNIVERSITY_HUMAN_CURRENTNESS_DECISION.md`.

Promotion to the validated branch remains separately controlled and requires completed human curriculum/compliance review, explicit promotion authorization, and validated-branch readback.
