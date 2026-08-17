# Paradise University v1 — Physical iPhone / PWA Acceptance Gate

Status: REQUIRED HUMAN DEVICE GATE — NOT YET PASSED

As of: 2026-08-16

This checklist implements the physical-device requirement in `PARADISE_UNIVERSITY_V1_SPEC.md`. Automated WebKit/iPhone regression is necessary but does **not** substitute for a real iPhone Safari + installed Home Screen PWA test.

## Current software baseline

Current fully green runtime candidate: `5eb794090a0a20f13d63c34ab05ac2b68877147c`.

Current full validator run: `31983974156` — PASS through syntax/build boundary, training hardening, exact field baseline, release isolation, production bundle, iPhone field regression, iPhone offline regression, Paradise University iPhone regression, and device matrix.

Current content-hardening run: `31983974058` — PASS.

Use this immutable runtime URL for the physical test:

`https://rawcdn.githack.com/twiztd1166/proud-math-b7d8/5eb794090a0a20f13d63c34ab05ac2b68877147c/index.html`

The controlled jurisdiction baseline remains SHA `a98b8badf4c3df616fb091eb32ff85f70682f226e4fcd55591f3784b37abe200`, 78 records / 76 GO / 2 NO-GO.

The validated production/manager branch remains separate at `5e7efc40de524bef0e63c76595c3c518925888b9`. This physical test does **not** promote the University runtime.

## What changed since the prior physical packet

This runtime adds the visible **Canvassing Library** while preserving the simple employee home screen.

Acceptance expectations:

- Canvassing Library is reachable from Training home, Videos & Audio, and More Training Tools.
- All **24 indexed Tony Hoty recordings** are visible in the Canvassing Library.
- Tony materials are organized into canvassing-focused sections instead of being hidden in a flat source dump.
- `Tony Hoty Canvassing Manual` and `Tony Hoty Master Training Manual` are directly visible.
- Dave Yoho and canvassing-relevant Grosso media remain available without converting advanced sales material into canvasser requirements.
- Trainer material stays `REFERENCE` / `HISTORICAL`; it does not become `PARADISE APPROVED` merely because it is visible.
- The existing Paradise canvass opener wording was **not changed** by this library update.
- Live municipality Lookup remains operational authority for field behavior.

## Tony media integrity already confirmed before physical test

Two Tony items were re-fetched directly from the controlled Drive source and fully decoded without media errors:

1. `tony-canvassing-101` — **Tony Hoty Audio Canvassing 101.mp3**
   - MP3
   - 44.1 kHz stereo
   - full decode: PASS

2. `tony-video-process` — **New Canvasser Training - Process.mp4**
   - H.264 video + AAC audio
   - 1272×720
   - 44.1 kHz stereo audio
   - full decode: PASS

These are the preferred Tony audio/video pair for the real-device playback test. File-integrity PASS does not prove Safari/Drive-iframe behavior on the physical iPhone; that remains the purpose of this gate.

## Hard rule

Do not mark this gate PASS from simulator, automated WebKit, Drive metadata, or file-decode evidence alone.

A PASS requires:

- named human tester;
- actual iPhone model;
- iOS version;
- Safari + Home Screen PWA test;
- exact tested runtime commit;
- online and offline results;
- actual trainer audio and video playback.

## Test device record

- Tester: ______________________________
- Role: ________________________________
- Date/time: ___________________________
- iPhone model: _________________________
- iOS version: __________________________
- Safari version if shown: ______________
- Exact runtime commit tested: `5eb794090a0a20f13d63c34ab05ac2b68877147c`
- App URL tested: `https://rawcdn.githack.com/twiztd1166/proud-math-b7d8/5eb794090a0a20f13d63c34ab05ac2b68877147c/index.html`
- Installed to Home Screen: YES / NO
- Network used for online pass: __________
- Offline pass performed: YES / NO

## A. Field-app regression on physical iPhone

- [ ] App opens normally in Safari.
- [ ] App opens normally from installed Home Screen PWA.
- [ ] Lookup remains obvious and immediately reachable from Training.
- [ ] Search Boca Raton and confirm current controlled field result renders normally.
- [ ] Search one known NO-GO jurisdiction and confirm NO-GO remains explicit.
- [ ] Daily Check opens and can be completed.
- [ ] History opens normally.
- [ ] No Training screen replaces or obscures field failure/error behavior.
- [ ] No horizontal clipping or unreachable controls in portrait orientation.

## B. Training home and Canvassing Library navigation

- [ ] Training opens in one obvious tap.
- [ ] Continue Training remains the most prominent action.
- [ ] Practice, Career Path, Videos & Audio, and My Progress remain easy to find.
- [ ] More remains secondary.
- [ ] Canvassing Library is visibly reachable from Training home.
- [ ] Canvassing Library is reachable from Videos & Audio.
- [ ] Canvassing Library is reachable from More Training Tools.
- [ ] Returning to Lookup is obvious and immediate.

## C. Complete Tony Hoty visibility

Open **Canvassing Library**.

- [ ] Tony section reports / renders **24 media items**.
- [ ] `Canvassing 101` is visible.
- [ ] `New Canvasser Training — Process` is visible.
- [ ] `10 Step Canvassing Approach` is visible.
- [ ] `Canvass Set` is visible.
- [ ] callback material is visible.
- [ ] Tony full-program material is visible.
- [ ] Tony sound-bite / specialized canvassing examples are visible.
- [ ] manager/recruiting Tony material is visible where categorized.
- [ ] `Tony Hoty Canvassing Manual` is visible.
- [ ] `Tony Hoty Master Training Manual` is visible.
- [ ] Long titles wrap without hiding Play or Source controls.
- [ ] No Tony item is relabeled `PARADISE APPROVED` merely because it appears in the library.

## D. Lesson / knowledge / progress behavior

- [ ] Open a lesson and confirm Learn / Watch-Listen / Practice / Pass order is readable.
- [ ] Complete a non-Quick-Check lesson and confirm local completion records correctly.
- [ ] Confirm a wrong Quick-Check answer does not falsely mark knowledge passed.
- [ ] Complete a Quick Check correctly and confirm device knowledge state updates.
- [ ] Close the PWA completely and reopen it.
- [ ] Confirm lesson progress persists.
- [ ] Confirm device progress does not claim official HR/company certification.
- [ ] Confirm Sales Apprentice still shows the doorstep sales-authority warning.
- [ ] Confirm Sales Rep readiness still requires current company test / manager release.

## E. Currentness / authority controls

- [ ] Open the field-opening lesson and confirm the existing Paradise candidate opener wording has not been silently rewritten by this library update.
- [ ] Confirm the opener authority/currentness label still matches the controlled currentness decision state.
- [ ] Confirm completing the field-opening lesson does not turn trainer/source material into current field authority.
- [ ] Open Manager Academy → Appointment QA and confirm Missing Parties is expressed as homeowners or decision makers not being present.
- [ ] Confirm the appointment-QA lesson does not present a blanket `spouse must be present` rule.
- [ ] Confirm trainer media never overrides current Paradise-approved lessons or live municipality Lookup.

## F. Physical Tony audio playback — required

Preferred asset: `tony-canvassing-101` — **Canvassing 101**.

Online Safari:

- [ ] Open Canvassing Library → Tony Hoty → Canvassing 101.
- [ ] Paradise player/modal opens correctly.
- [ ] Drive embed loads.
- [ ] Audio actually starts.
- [ ] Pause/resume works in the Drive player.
- [ ] Close/minimize controls remain reachable.
- [ ] `SAVE FOR LATER` works.
- [ ] `MARK COMPLETE` works.
- [ ] Reopen and confirm app progress state persists.

Installed Home Screen PWA:

- [ ] Repeat playback and confirm audio starts.
- [ ] No viewport trap or blank player state.

## G. Physical Tony video playback — required

Preferred asset: `tony-video-process` — **New Canvasser Training — Process (Video)**.

Online Safari:

- [ ] Open the video from Canvassing Library.
- [ ] Drive embed loads.
- [ ] Video actually starts with picture and audio.
- [ ] Pause/resume works.
- [ ] Rotate portrait ↔ landscape once and confirm controls remain reachable.
- [ ] Return to portrait without being trapped.
- [ ] Close the player and return to the library.

Installed Home Screen PWA:

- [ ] Repeat playback and confirm video starts.
- [ ] No blank iframe / permanent loading state.

## H. Additional trainer-media smoke check

Use at least one non-Tony item so the physical test covers another trainer path.

Recommended:

- `grosso-tonality-audio` or `grosso-tonality-video`.

Optional large-stream check:

- `dave-science-canvassing-video` — use as a secondary load/stream check; do not make the whole gate depend on its larger file size.

- [ ] Non-Tony trainer media opens.
- [ ] Authority remains REFERENCE / HISTORICAL as applicable.
- [ ] Returning from media to Lookup is obvious.

## I. Offline installed-PWA test

1. Open the app online from the Home Screen PWA.
2. Visit Lookup, Training, Practice, Career Path, My Progress, Canvassing Library, More, Source Library, and the field-opening lesson.
3. Confirm the current build has refreshed after the older installed version.
4. Enable Airplane Mode and disable Wi-Fi.
5. Relaunch the installed PWA.

PASS only if:

- [ ] Core app opens offline.
- [ ] Cached jurisdiction dataset / field behavior remains available exactly as designed.
- [ ] Training home opens.
- [ ] Core lessons open.
- [ ] Practice opens.
- [ ] Career Path opens.
- [ ] My Progress opens.
- [ ] **Canvassing Library opens offline.**
- [ ] **All 24 Tony media records remain visible offline as metadata/cards.**
- [ ] Tony manuals/source records remain visible as metadata.
- [ ] External Google Drive playback is **not** represented as offline-cached media.
- [ ] Failed external playback while offline does not break the app shell.
- [ ] No giant raw trainer-media library has been precached.
- [ ] Returning online restores external media/source access without clearing progress.

## J. Visual / touch QA

- [ ] No text clips at normal Dynamic Type.
- [ ] Repeat one key screen at one larger Dynamic Type setting.
- [ ] Buttons have usable tap targets.
- [ ] Bottom navigation remains reachable above the iPhone home indicator.
- [ ] Player close/minimize controls stay inside the viewport.
- [ ] No modal traps the user.
- [ ] No important control depends on hover.
- [ ] Long Tony titles wrap correctly.
- [ ] Canvassing Library sections remain scannable on a normal iPhone-width screen.

## Acceptance record

### Field isolation / navigation
- Result: PASS / FAIL / NOT RUN
- Notes: _________________________________

### Canvassing Library completeness
- Result: PASS / FAIL / NOT RUN
- Tony rendered count: ______ / 24
- Both Tony manuals visible: YES / NO
- Notes: _________________________________

### Tony audio playback
- Result: PASS / FAIL / NOT RUN
- Asset tested: __________________________
- Safari: PASS / FAIL
- Home Screen PWA: PASS / FAIL
- Notes: _________________________________

### Tony video playback
- Result: PASS / FAIL / NOT RUN
- Asset tested: __________________________
- Safari: PASS / FAIL
- Home Screen PWA: PASS / FAIL
- Notes: _________________________________

### Offline installed-PWA test
- Result: PASS / FAIL / NOT RUN
- Canvassing Library offline: PASS / FAIL
- 24 Tony records visible offline: YES / NO
- Notes: _________________________________

### Currentness / authority
- Result: PASS / FAIL / NOT RUN
- Existing opener wording unchanged: YES / NO
- Trainer media remains REFERENCE/HISTORICAL: YES / NO
- Missing Parties homeowner/decision-maker wording: YES / NO
- Blanket spouse rule absent: YES / NO
- Notes: _________________________________

## Release disposition

Until this real-device record is completed:

`PHYSICAL_DEVICE_ACCEPTANCE = OPEN`

Until at least one Tony audio and one Tony video item are physically played online in both Safari and the installed PWA:

`MEDIA_PLAYBACK_ACCEPTANCE = OPEN`

Neither status may be converted to PASS from Playwright/WebKit automation, Drive metadata, or local decode testing alone.

A physical-device PASS does **not** itself approve or revise the Paradise canvass opener, does not perform human curriculum/compliance signoff, and does not authorize promotion.

Promotion to the validated branch remains separately controlled and requires the remaining human gates plus explicit promotion authorization and validated-branch readback.
