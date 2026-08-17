# Paradise University v1 — Physical iPhone / PWA Acceptance Gate

Status: RETEST REQUIRED AFTER DRIVE-IFRAME FIX — NOT YET PASSED

As of: 2026-08-17

This checklist implements the physical-device requirement in `PARADISE_UNIVERSITY_V1_SPEC.md`. Automated WebKit/iPhone regression is necessary but does **not** substitute for a real iPhone Safari + installed Home Screen PWA test.

## Current software baseline

Current fully green runtime candidate: `ac353dcea74bbb8ca262e5f55deaa8c61ee08752`.

Current full validator evidence: run `32010356293` — PASS through syntax/build boundary, training hardening, exact field baseline, release isolation, production bundle, iPhone field regression, iPhone offline regression, Paradise University iPhone regression, and device matrix.

Current content-hardening evidence: run `32010356249` — PASS, including the permanent secure trainer-playback boundary that fails if an embedded training `<iframe>` is reintroduced.

Use this immutable runtime URL for the physical retest:

`https://rawcdn.githack.com/twiztd1166/proud-math-b7d8/ac353dcea74bbb8ca262e5f55deaa8c61ee08752/index.html`

The controlled jurisdiction baseline remains SHA `a98b8badf4c3df616fb091eb32ff85f70682f226e4fcd55591f3784b37abe200`, 78 records / 76 GO / 2 NO-GO.

The validated production/manager branch remains separate at `5e7efc40de524bef0e63c76595c3c518925888b9`. This physical retest does **not** promote the University runtime.

## Prior physical attempt — FAILED / useful evidence

The prior physical test used runtime `5eb794090a0a20f13d63c34ab05ac2b68877147c` on a real iPhone.

Observed failure:

- Paradise University opened the trainer-media modal correctly.
- The embedded Google Drive player returned `Can't access your Google Account`.
- Google directed the tester to storage/cookie troubleshooting and stated that some Google embeds require third-party-cookie access.
- This established that the Drive iframe was not a reliable employee playback mechanism on the physical iPhone.

Controlled disposition:

`PRIOR_DRIVE_IFRAME_PHYSICAL_PLAYBACK = FAIL`

Do **not** pass the gate by weakening Safari privacy/cookie settings or by requiring an employee to troubleshoot third-party-cookie access.

## Remediation now under test

Runtime `ac353dcea74bbb8ca262e5f55deaa8c61ee08752` removes Google Drive from the embedded-player path.

For Drive-backed trainer media:

- Paradise University must render **zero Google Drive iframes**.
- The player presents `PLAY IN GOOGLE DRIVE ↗`.
- That control opens the original controlled Drive file as a **top-level authorized Google Drive session** rather than embedding Google inside RawGitHack.
- The original Drive file remains the controlled source/archive and its permissions remain in force.
- Paradise does **not** mirror Tony Hoty, Dave Yoho, or Grosso media onto the public RawGitHack app origin.
- Exact external Drive playback position/speed is not claimed by Paradise University.
- `MARK COMPLETE` and `SAVE FOR LATER` remain device-local app state.
- If a future protected `streamUrl` is supplied, the app retains its native HTML5 audio/video path.

This architecture removes the known third-party-cookie iframe dependency without turning internally controlled trainer media into public CDN assets.

## Tony media integrity already confirmed

Preferred physical-test pair:

1. `tony-canvassing-101` — **Tony Hoty Audio Canvassing 101.mp3**
   - MP3
   - 44.1 kHz stereo
   - full local decode: PASS

2. `tony-video-process` — **New Canvasser Training - Process.mp4**
   - H.264 video + AAC audio
   - 1272×720
   - 44.1 kHz stereo audio
   - full local decode: PASS

File-integrity PASS does not prove top-level Drive playback on the physical iPhone. That is the purpose of this retest.

## Hard rule

Do not mark this gate PASS from simulator, automated WebKit, Drive metadata, local file decode, or the absence of an iframe alone.

A PASS requires:

- named human tester;
- actual iPhone model;
- iOS version;
- Safari + installed Home Screen PWA test;
- exact runtime `ac353dcea74bbb8ca262e5f55deaa8c61ee08752`;
- online and offline app-shell results;
- actual Tony audio and Tony video playback through the new top-level Drive launch;
- at least one non-Tony trainer-media playback check;
- no third-party-cookie workaround required.

## Test device record

- Tester: ______________________________
- Role: ________________________________
- Date/time: ___________________________
- iPhone model: _________________________
- iOS version: __________________________
- Safari version if shown: ______________
- Exact runtime commit tested: `ac353dcea74bbb8ca262e5f55deaa8c61ee08752`
- App URL tested: `https://rawcdn.githack.com/twiztd1166/proud-math-b7d8/ac353dcea74bbb8ca262e5f55deaa8c61ee08752/index.html`
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
- [ ] No horizontal clipping or unreachable controls in portrait orientation.

## B. Training home and Canvassing Library

- [ ] Training opens in one obvious tap.
- [ ] Continue Training remains the most prominent action.
- [ ] Practice, Career Path, Videos & Audio, and My Progress remain easy to find.
- [ ] Canvassing Library is reachable from Training home.
- [ ] Canvassing Library is reachable from Videos & Audio.
- [ ] Canvassing Library is reachable from More Training Tools.
- [ ] Returning to Lookup is obvious and immediate.

## C. Complete Tony Hoty visibility

Open **Canvassing Library**.

- [ ] Tony section renders **24 media items**.
- [ ] `Canvassing 101` is visible.
- [ ] `New Canvasser Training — Process` is visible.
- [ ] `10 Step Canvassing Approach` is visible.
- [ ] callback / Canvass Set / full-program / sound-bite material is visible.
- [ ] manager/recruiting Tony material is visible where categorized.
- [ ] `Tony Hoty Canvassing Manual` is visible.
- [ ] `Tony Hoty Master Training Manual` is visible.
- [ ] Long titles wrap without hiding controls.
- [ ] Tony material remains REFERENCE / HISTORICAL as applicable rather than automatically becoming `PARADISE APPROVED`.

## D. Secure player behavior — required before actual playback

Open any Drive-backed trainer recording inside Paradise University.

PASS only if:

- [ ] The old embedded Google player does **not** appear.
- [ ] The old `Can't access your Google Account` iframe screen does **not** appear inside the Paradise modal.
- [ ] `PLAY IN GOOGLE DRIVE ↗` is visible.
- [ ] The app explains that Drive opens as a top-level authorized session.
- [ ] No prompt requires changing Safari third-party-cookie/privacy settings merely to use Paradise University.
- [ ] `MARK COMPLETE` is reachable.
- [ ] `SAVE FOR LATER` is reachable.
- [ ] Minimize / Close remain reachable.

## E. Tony audio playback — REQUIRED

Preferred asset: `tony-canvassing-101` — **Canvassing 101**.

### Safari

1. Open Canvassing Library → Tony Hoty → Canvassing 101.
2. Confirm the Paradise modal shows `PLAY IN GOOGLE DRIVE ↗`, not an embedded Google frame.
3. Tap `PLAY IN GOOGLE DRIVE ↗`.
4. Confirm a top-level Google Drive/Safari/Drive-app session opens for the correct controlled file.
5. Confirm the audio actually starts.
6. Pause and resume once.
7. Return to Paradise University.

- [ ] Correct Tony file opens.
- [ ] Audio actually starts.
- [ ] Pause/resume works in the top-level Drive session.
- [ ] Return to Paradise University works normally.
- [ ] No third-party-cookie setting change was required.
- [ ] `SAVE FOR LATER` works in Paradise University.
- [ ] `MARK COMPLETE` works in Paradise University.

### Installed Home Screen PWA

Repeat the same flow from the installed PWA.

- [ ] `PLAY IN GOOGLE DRIVE ↗` launches the correct controlled file.
- [ ] Audio starts.
- [ ] Return to the installed Paradise University PWA works normally.
- [ ] No viewport trap / dead app state occurs.
- [ ] No third-party-cookie setting change was required.

## F. Tony video playback — REQUIRED

Preferred asset: `tony-video-process` — **New Canvasser Training — Process (Video)**.

### Safari

- [ ] Paradise modal shows the top-level Drive launch, not an iframe.
- [ ] `PLAY IN GOOGLE DRIVE ↗` opens the correct controlled video.
- [ ] Video starts with picture and audio.
- [ ] Pause/resume works.
- [ ] Portrait ↔ landscape works in the playback session.
- [ ] Return to Paradise University works normally.
- [ ] No third-party-cookie setting change was required.

### Installed Home Screen PWA

- [ ] The same video opens from the installed PWA.
- [ ] Picture + audio start.
- [ ] Return to Paradise University works normally.
- [ ] No blank embedded-player state appears.

## G. Additional trainer-media smoke check

Use at least one non-Tony item.

Recommended: `grosso-tonality-audio` or `grosso-tonality-video`.

- [ ] Paradise modal is iframe-free.
- [ ] `PLAY IN GOOGLE DRIVE ↗` opens the correct controlled source.
- [ ] Playback starts.
- [ ] Authority remains REFERENCE / HISTORICAL as applicable.
- [ ] Returning to Paradise University and Lookup is obvious.

Optional secondary load/stream check: Dave Yoho `The Science of Successful Canvassing`.

## H. Lesson / currentness / authority controls

- [ ] Existing Paradise canvass opener wording is unchanged.
- [ ] Opener still shows the controlled currentness state rather than silently becoming current-approved.
- [ ] Missing Parties remains homeowners/decision makers, not a blanket spouse rule.
- [ ] Sales Apprentice still states advanced sales training does not authorize pricing/selling at the door.
- [ ] Trainer material does not override Paradise-approved curriculum or live municipality Lookup.
- [ ] Device completion does not claim official HR/company certification.

## I. Offline installed-PWA test

1. Open the current runtime online from the installed Home Screen PWA so the refreshed cache is active.
2. Visit Lookup, Training, Practice, Career Path, My Progress, Canvassing Library, More, Source Library, and the field-opening lesson.
3. Enable Airplane Mode and disable Wi-Fi.
4. Relaunch the installed PWA.

PASS only if:

- [ ] Core app opens offline.
- [ ] Cached jurisdiction dataset / field behavior remains available exactly as designed.
- [ ] Training home, core lessons, Practice, Career Path, and My Progress open.
- [ ] **Canvassing Library opens offline.**
- [ ] **All 24 Tony media records remain visible offline as metadata/cards.**
- [ ] Tony manuals/source records remain visible as metadata.
- [ ] `PLAY IN GOOGLE DRIVE ↗` or external source access is not falsely represented as offline-cached playback.
- [ ] Failed external access while offline does not break the app shell.
- [ ] No giant raw trainer-media library has been precached.
- [ ] Returning online restores external media/source access without clearing progress.

## J. Visual / touch QA

- [ ] No text clips at normal Dynamic Type.
- [ ] Repeat one key screen at one larger Dynamic Type setting.
- [ ] Buttons have usable tap targets.
- [ ] Bottom navigation remains reachable above the iPhone home indicator.
- [ ] Player close/minimize and `PLAY IN GOOGLE DRIVE ↗` remain inside the viewport.
- [ ] No modal traps the user.
- [ ] Long Tony titles wrap correctly.

## Acceptance record

### Field isolation / navigation
- Result: PASS / FAIL / NOT RUN
- Notes: _________________________________

### Canvassing Library completeness
- Result: PASS / FAIL / NOT RUN
- Tony rendered count: ______ / 24
- Both Tony manuals visible: YES / NO
- Notes: _________________________________

### Secure player / old iframe regression
- Result: PASS / FAIL / NOT RUN
- Old embedded Google player absent: YES / NO
- `PLAY IN GOOGLE DRIVE ↗` visible: YES / NO
- Third-party-cookie workaround required: YES / NO
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

### Non-Tony playback
- Result: PASS / FAIL / NOT RUN
- Asset tested: __________________________
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

Until this retest is completed:

`PHYSICAL_DEVICE_ACCEPTANCE = RETEST_REQUIRED_AFTER_DRIVE_IFRAME_FIX`

Until at least one Tony audio and one Tony video item are physically played through the new top-level Drive path in both Safari and the installed PWA:

`MEDIA_PLAYBACK_ACCEPTANCE = OPEN`

Neither status may be converted to PASS from Playwright/WebKit automation, Drive metadata, local decode testing, or the absence of an iframe alone.

A physical-device PASS does **not** itself approve or revise the Paradise canvass opener, complete human curriculum/compliance signoff, or authorize promotion.

Promotion to the validated branch remains separately controlled and requires the remaining human gates plus explicit promotion authorization and validated-branch readback.
