# Paradise University v1 — Physical Device Attempt Record — 2026-08-17

Status: **CORRECTED-RUNTIME RETEST IN PROGRESS — AUDIO DRIVE PATH PASS / FULL GATE OPEN**

This record preserves both the physical-device failure that triggered the secure trainer-player correction and the subsequent real-device retest evidence. It is evidence for release control only; it is **not** yet a completed physical-device acceptance record and it does **not** authorize promotion.

## Superseded runtime tested

Superseded runtime candidate: `5eb794090a0a20f13d63c34ab05ac2b68877147c`

The controlled field baseline at that candidate remained:

- dataset SHA-256: `a98b8badf4c3df616fb091eb32ff85f70682f226e4fcd55591f3784b37abe200`
- 78 jurisdictions
- 76 GO
- 2 NO-GO

## Failure observed on superseded runtime

The physical test exposed a trainer-media playback blocker in the old player architecture: Google Drive media was being loaded inside an embedded iframe. On physical iPhone Safari / PWA behavior, that architecture could depend on Google authentication/storage access in a third-party embedded context and could fail because the embedded frame could not reliably use the required Google session/cookie state.

Controlled disposition:

`OLD_DRIVE_IFRAME_PLAYBACK = FAIL`

The failure is treated as a release blocker for the superseded runtime. Automated WebKit, Drive metadata, and local media decode results do not override this physical failure.

## What the original failure record did not infer

The tester name, exact iPhone model, exact iOS version, exact timestamp, and complete results for every non-media checklist item were not captured in the controlled record available here. They are therefore **not invented or backfilled**.

This record does not claim the old runtime failed the field engine, municipality baseline, curriculum, or offline shell. It records the specific physical trainer-media playback architecture failure that required correction.

## Corrective action

The employee trainer player was changed to remove the Google Drive iframe dependency.

New behavior:

- **zero Google Drive iframes** in the Paradise training player;
- internal Drive media launches as a **top-level authorized Google Drive session**;
- Google retains its normal sign-in/storage context rather than being forced into a third-party embedded frame;
- Drive remains the controlled source/archive location;
- Paradise does **not** copy Tony Hoty / Dave Yoho / Grosso University trainer media onto the public RawGitHack app origin;
- a native `<audio>` / `<video>` path remains available for any future properly controlled streaming URL;
- the installed PWA cache was refreshed so an older iframe player cannot remain silently cached.

Runtime containing the completed correction: `ac353dcea74bbb8ca262e5f55deaa8c61ee08752`

Player version: `2026.08.17-pu-player-v3-drive-top-level`

## Automated correction evidence

The corrected runtime/control line subsequently passed:

- secure-player hardening, including a permanent guard that fails CI if a training `<iframe>` is reintroduced;
- controlled 78 / 76 / 2 field baseline;
- iPhone field regression;
- iPhone offline PWA regression;
- Paradise University iPhone regression;
- device matrix regression.

Runtime validation run: `32010356293` — PASS  
Independent content/player hardening run: `32010356249` — PASS

The later docs/control head also re-passed the complete validator and hardening stack without changing the runtime candidate.

## Corrected-runtime physical retest — confirmed evidence

Immutable runtime under retest:

`https://rawcdn.githack.com/twiztd1166/proud-math-b7d8/ac353dcea74bbb8ca262e5f55deaa8c61ee08752/index.html`

### Tony Hoty — Canvassing 101 audio

The user performed the requested real-iPhone retest of the corrected top-level Drive path and reported:

- `PLAY IN GOOGLE DRIVE` opened Google Drive successfully;
- the controlled **Canvassing 101** audio actually played;
- the corrected path worked.

Controlled disposition for this tested path:

`TONY_CANVASSING_101_TOP_LEVEL_DRIVE_LAUNCH = PASS`

`TONY_CANVASSING_101_PHYSICAL_AUDIO_PLAYBACK = PASS`

`KNOWN_DRIVE_IFRAME_BLOCKER = CLOSED_BY_PHYSICAL_RETEST`

This is the first physical evidence that the replacement architecture solves the specific real-iPhone playback blocker. It does **not** by itself establish that every trainer-media file plays, that video rotation works, that the installed Home Screen PWA path is complete, or that the offline shell has passed physical acceptance.

No requirement to weaken Safari privacy or third-party-cookie settings is recorded for this successful retest.

## Remaining physical retest

The full physical gate remains OPEN. The corrected runtime still needs physical confirmation of the remaining required items, including at minimum:

- trainer **video** playback through the new top-level Drive launch;
- return from Drive to Paradise University without a navigation trap;
- at least one non-Tony trainer-media playback check;
- installed Home Screen PWA behavior;
- PWA offline shell / cached field and curriculum behavior;
- external Drive media not being falsely represented as offline-cached;
- field Lookup regression including one GO and one NO-GO jurisdiction;
- no embedded Google Drive iframe appearing anywhere in the employee player.

Current controlled state:

`PHYSICAL_DEVICE_ACCEPTANCE = OPEN / RETEST IN PROGRESS`

`MEDIA_PLAYBACK_ACCEPTANCE = PARTIAL PASS — TONY AUDIO PASS / VIDEO + ADDITIONAL PATHS OPEN`

This physical evidence does not approve the canvass opener, does not complete human curriculum/compliance sign-off, and does not authorize promotion.