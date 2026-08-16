# Paradise University v1 — Physical iPhone / PWA Acceptance Gate

Status: REQUIRED HUMAN DEVICE GATE — NOT YET PASSED

As of: 2026-08-16

This checklist implements the physical-device requirement in `PARADISE_UNIVERSITY_V1_SPEC.md`. Automated WebKit/iPhone regression is necessary but does **not** substitute for a real iPhone Safari + installed PWA test.

## Current automated baseline

Runtime checkpoint `ca6c3c14ef8fd0878336554ef150c80dac39915c` passed the full `Validate Paradise University v1` workflow:

- syntax/build-boundary checks
- training content/hardening
- controlled field baseline
- training release isolation
- static production bundle
- iPhone field regression
- iPhone offline regression
- Paradise University iPhone regression
- device matrix

The current branch may contain documentation-only commits after that runtime checkpoint. Reconfirm the exact branch head is green before using it as a release candidate.

## Hard rule

Do not mark this gate PASS from simulator/WebKit evidence alone.

A PASS requires a named tester, actual iPhone model, iOS version, browser/PWA mode, exact tested commit, date/time, and recorded results below.

## Test device record

- Tester: ______________________________
- Date: ________________________________
- iPhone model: _________________________
- iOS version: __________________________
- Safari version if shown: ______________
- Exact working-branch commit: __________
- App URL tested: _______________________
- Installed to Home Screen: YES / NO
- Network used for online pass: __________
- Offline pass performed: YES / NO

## A. Field-app regression on physical iPhone

PASS only if all are true:

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
- [ ] A new user can follow: `Training → Continue Training → lesson → Practice/Pass → Next Lesson` without explanation.

## C. Lesson/progress behavior

- [ ] Open a lesson and confirm Learn / Watch-Listen / Practice / Pass order is readable.
- [ ] Complete a non-Quick-Check lesson and confirm local completion records correctly.
- [ ] Complete a Quick-Check lesson and confirm wrong answer does not falsely mark knowledge passed.
- [ ] Complete the Quick Check correctly and confirm device knowledge state updates.
- [ ] Close the PWA completely and reopen it.
- [ ] Confirm lesson progress persists.
- [ ] Confirm device progress does not claim official HR/company certification.
- [ ] Confirm Sales Apprentice content still shows the doorstep sales-authority warning.
- [ ] Confirm Sales Rep graduation/readiness language still requires current company test/manager release.

## D. Media-rights behavior — current build

Current controlled posture: the 12 curated Tony Hoty / Dave Yoho / Grosso copied media records are retained for lineage but are rights-held and not playable.

- [ ] Videos & Audio visibly shows the media-rights gate.
- [ ] The 12 rights-held items show `RIGHTS REVIEW` rather than Play.
- [ ] No copied Drive URL is exposed from those cards.
- [ ] Source Library retains trainer/source lineage without exposing the copied-file link.
- [ ] Attempting a direct/stale media launch cannot produce a Drive iframe, HTML audio, or HTML video element for a rights-held asset.
- [ ] Rights-held media does not block lesson completion or career progress.
- [ ] The app remains stable when moving between Training and Lookup after viewing a rights-held item.

## E. Physical playback gate — cannot pass until cleared media exists

The v1 specification requires real-device audio/video playback tests. Because the current release-safe build intentionally has **0 playable third-party copied assets and 0 Paradise-owned approved media assets**, the full media acceptance gate is currently **OPEN**.

Before release, load at least:

- one rights-cleared or Paradise-owned audio item; and
- one rights-cleared or Paradise-owned video item.

Then test on the physical iPhone/PWA:

### Audio

- [ ] Play starts reliably.
- [ ] Pause works.
- [ ] Resume works.
- [ ] −15 seconds works.
- [ ] +30 seconds works.
- [ ] Scrub/seek works.
- [ ] 1x / 1.25x / 1.5x / 2x work.
- [ ] Elapsed/duration display updates.
- [ ] Close/reopen returns to stored resume position.
- [ ] Bookmark position works.
- [ ] Transcript link works if supplied.
- [ ] Chapters work if supplied.
- [ ] Mark Complete works.
- [ ] Next Item works.
- [ ] Lock-screen/headset controls work if retained as supported behavior.

### Video

- [ ] Video starts reliably in Safari.
- [ ] Video starts reliably in installed PWA.
- [ ] Inline playback behaves acceptably.
- [ ] Pause/resume works.
- [ ] Seek works.
- [ ] Playback speed works.
- [ ] Resume position survives app close/reopen.
- [ ] Orientation change does not trap controls.
- [ ] Close/minimize player remains reachable in portrait and landscape.
- [ ] Picture-in-picture is tested only if the product claims/supports it.

## F. Offline installed-PWA test

1. Open the app online from the Home Screen PWA.
2. Visit Lookup, Training, Practice, Career Path, Progress, More, Source Library.
3. Confirm service worker is active by normal app behavior.
4. Enable Airplane Mode and disable Wi-Fi.
5. Relaunch the installed PWA.

PASS only if:

- [ ] Core app opens offline.
- [ ] Previously cached jurisdiction dataset/field behavior remains available exactly as designed.
- [ ] Training home opens.
- [ ] Core lessons open.
- [ ] Practice opens.
- [ ] Career Path opens.
- [ ] My Progress opens.
- [ ] Source Library metadata opens.
- [ ] Rights-held trainer media remains blocked rather than failing into an exposed Drive URL.
- [ ] No giant raw media library has been precached.
- [ ] Returning online restores normal network behavior without clearing progress.

## G. Visual / touch QA

- [ ] No text clips under Dynamic Type at normal and one larger text setting.
- [ ] Buttons have usable tap targets.
- [ ] Bottom navigation remains reachable above the iPhone home indicator.
- [ ] Player/rights-hold close control stays inside the viewport.
- [ ] No modal traps the user.
- [ ] No accidental double-tap is required.
- [ ] No important control depends only on hover.
- [ ] Long lesson/source titles wrap without hiding action buttons.

## H. Acceptance record

### Current-build navigation / rights gate

- Result: PASS / FAIL / NOT RUN
- Tested commit: _________________________
- Tester: _______________________________
- Date: _________________________________
- Defects / notes: _______________________

### Rights-cleared audio playback

- Result: PASS / FAIL / BLOCKED — NO CLEARED AUDIO
- Asset ID: _____________________________
- Rights basis: PARADISE_OWNED / APPROVED_INTERNAL_HOSTING / EXTERNAL_LINK_ONLY (external link is not an in-app playback test)
- Notes: ________________________________

### Rights-cleared video playback

- Result: PASS / FAIL / BLOCKED — NO CLEARED VIDEO
- Asset ID: _____________________________
- Rights basis: PARADISE_OWNED / APPROVED_INTERNAL_HOSTING / EXTERNAL_LINK_ONLY (external link is not an in-app playback test)
- Notes: ________________________________

### Installed-PWA offline test

- Result: PASS / FAIL / NOT RUN
- Notes: ________________________________

## Release disposition

Until the physical device record is completed:

`PHYSICAL_DEVICE_ACCEPTANCE = OPEN`

Until one cleared/Paradise-owned audio and one cleared/Paradise-owned video are physically tested:

`MEDIA_PLAYBACK_ACCEPTANCE = OPEN`

Neither status may be converted to PASS from Playwright/WebKit automation alone.

Promotion to the validated branch remains separately controlled and requires explicit authorization plus validated-branch readback.