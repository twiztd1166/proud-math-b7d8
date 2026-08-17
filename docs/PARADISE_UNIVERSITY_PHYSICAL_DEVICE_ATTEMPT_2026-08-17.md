# Paradise University v1 — Physical Device Attempt Record — 2026-08-17

Status: **FAILED / SUPERSEDED RUNTIME — RETEST REQUIRED**

This record preserves the physical-device failure that triggered the secure trainer-player correction. It is evidence for release control only; it is **not** a completed physical-device acceptance record and it does **not** authorize promotion.

## Runtime tested

Superseded runtime candidate: `5eb794090a0a20f13d63c34ab05ac2b68877147c`

The controlled field baseline at that candidate remained:

- dataset SHA-256: `a98b8badf4c3df616fb091eb32ff85f70682f226e4fcd55591f3784b37abe200`
- 78 jurisdictions
- 76 GO
- 2 NO-GO

## Failure observed

The physical test exposed a trainer-media playback blocker in the old player architecture: Google Drive media was being loaded inside an embedded iframe. On physical iPhone Safari / PWA behavior, that architecture could depend on Google authentication/storage access in a third-party embedded context and could fail because the embedded frame could not reliably use the required Google session/cookie state.

Controlled disposition:

`OLD_DRIVE_IFRAME_PLAYBACK = FAIL`

The failure is treated as a release blocker for the superseded runtime. Automated WebKit, Drive metadata, and local media decode results do not override this physical failure.

## What this record does not infer

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

Exact fully green control head after test-only/workflow-only corrections: `e0ce1ead9c1026384573bcbd452dc8eee81c59f5`

Full validator run: `32010356293` — PASS  
Independent content/player hardening run: `32010356249` — PASS

The commits after runtime `ac353dcea74bbb8ca262e5f55deaa8c61ee08752` through control head `e0ce1ead9c1026384573bcbd452dc8eee81c59f5` changed only tests/workflows; they did not change the player runtime, service worker runtime, municipality data, field engine, or canvass opener.

## Required retest

The physical gate remains OPEN. A new physical-device attempt must use immutable runtime:

`https://rawcdn.githack.com/twiztd1166/proud-math-b7d8/ac353dcea74bbb8ca262e5f55deaa8c61ee08752/index.html`

The retest must confirm at minimum:

- actual iPhone Safari;
- installed Home Screen PWA;
- field Lookup regression including one GO and one NO-GO jurisdiction;
- online trainer audio playback using the new **PLAY IN GOOGLE DRIVE** top-level launch;
- online trainer video playback using the new top-level launch;
- return from Drive to Paradise University without a navigation trap;
- PWA offline shell / cached field and curriculum behavior;
- external Drive media is not falsely represented as offline-cached;
- no embedded Google Drive iframe appears.

Until that retest is completed by a named human on a real device:

`PHYSICAL_DEVICE_ACCEPTANCE = OPEN`

`MEDIA_PLAYBACK_ACCEPTANCE = OPEN`

This failure/correction record does not approve the canvass opener, does not complete human curriculum/compliance sign-off, and does not authorize promotion.