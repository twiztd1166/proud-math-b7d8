# Paradise University v1 — Physical iPhone / PWA Acceptance Gate

Status: **OPEN — CURRENT TRAINING EXPERIENCE v2 RUNTIME RETEST REQUIRED — NOT PRODUCTION AUTHORIZED**

As of: 2026-08-17

This packet is the required real-device gate for the current Paradise University candidate. Automated WebKit/iPhone regression is necessary but does **not** substitute for a real iPhone Safari + installed Home Screen PWA test.

## Controlled candidate

Current immutable browser runtime candidate:

`ae46fa6d5258146a357041bcd184b07031778043`

Use this exact URL for the current physical acceptance pass:

`https://rawcdn.githack.com/twiztd1166/proud-math-b7d8/ae46fa6d5258146a357041bcd184b07031778043/index.html`

Current green test/control head before these closeout-document commits:

`0693890b3050b25ca4b94f0fe60974efc7c5441b`

The full validator passed on that control head in run `32020240642`. Content hardening passed in run `32020240685`. Changes after runtime `ae46fa6…` through that green control head were test/CI controls only; they do not redefine the immutable browser runtime.

Controlled jurisdiction baseline:

- Dataset SHA-256: `a98b8badf4c3df616fb091eb32ff85f70682f226e4fcd55591f3784b37abe200`
- 78 records
- 76 GO
- 2 NO-GO

Validated production/manager branch remains separate and unchanged at:

`5e7efc40de524bef0e63c76595c3c518925888b9`

This acceptance pass does **not** promote Paradise University.

## Prior physical evidence — preserve, do not overstate

### Failed embedded-Drive checkpoint

Runtime `5eb794090a0a20f13d63c34ab05ac2b68877147c` was tested on a real iPhone and exposed a real failure: the embedded Google Drive player returned `Can't access your Google Account` and depended on Google/Safari cookie behavior that employees should not have to weaken or troubleshoot.

Controlled disposition:

`PRIOR_DRIVE_IFRAME_PHYSICAL_PLAYBACK = FAIL`

Do **not** pass any future gate by weakening Safari privacy or third-party-cookie settings.

### Corrected playback checkpoint

Runtime `ac353dcea74bbb8ca262e5f55deaa8c61ee08752` replaced embedded Google playback with the controlled top-level `PLAY IN GOOGLE DRIVE ↗` path.

Real-iPhone evidence already recorded for that checkpoint includes:

- Tony Hoty **Canvassing 101**: top-level Drive launch PASS; actual audio playback PASS.
- Tony Hoty **New Canvasser Training — Process**: top-level Drive launch PASS; picture + audio PASS; pause/resume PASS; portrait → landscape → portrait PASS; return to University PASS.
- Additional tested non-Tony trainer paths: reported PASS.
- Known Drive-iframe blocker: CLOSED by physical retest.

This evidence remains valid historical evidence that the inherited secure playback design worked on a real iPhone. It is **not** full physical acceptance of the newer Training Experience v2 runtime `ae46fa6…` because the v2 navigation, queueing, lesson gating, Sales Apprentice bridge, media curation, and current Canvassing Library presentation changed afterward.

For the current candidate, perform at least one real playback spot-check again from the exact `ae46fa6…` runtime in Safari and the installed PWA.

## Hard rule

Do not mark this gate PASS from simulator, automated WebKit, CI, Drive metadata, local file decode, prior-runtime screenshots, or prior-runtime playback alone.

A current PASS requires a named tester, actual iPhone model, iOS version, Safari + installed Home Screen PWA, exact current runtime `ae46fa6…`, online and Airplane Mode/offline results, field GO/NO-GO checks, Training Experience v2 checks, authority/currentness checks, and a current-runtime trainer playback spot-check.

## Test device record — current runtime

- Tester: ______________________________
- Role: ________________________________
- Date/time: ___________________________
- iPhone model: _________________________
- iOS version: __________________________
- Safari version if shown: ______________
- Exact runtime commit tested: `ae46fa6d5258146a357041bcd184b07031778043`
- App URL tested: `https://rawcdn.githack.com/twiztd1166/proud-math-b7d8/ae46fa6d5258146a357041bcd184b07031778043/index.html`
- Installed to Home Screen: YES / NO
- Network used for online pass: __________
- Airplane Mode/offline pass performed: YES / NO

## A. Launch, field isolation, and Lookup

- [ ] App opens normally in Safari from the exact current URL.
- [ ] App opens normally from a newly refreshed/reinstalled Home Screen PWA using the current cache.
- [ ] Lookup remains obvious and immediately reachable from Training.
- [ ] Search **Boca Raton** and confirm the current controlled field result renders normally.
- [ ] Search one known NO-GO jurisdiction and confirm NO-GO remains explicit.
- [ ] Punta Gorda and Tarpon Springs remain NO-GO in the controlled dataset.
- [ ] Daily Check opens and can be completed.
- [ ] History opens normally.
- [ ] No Training control overrides or obscures live municipality Lookup.
- [ ] No horizontal clipping or unreachable controls in portrait orientation.

## B. Training Experience v2 home — simplified employee path

- [ ] Training opens in one obvious tap.
- [ ] **Continue Training** is the primary action.
- [ ] Practice, Career Path, Videos & Audio, and My Progress remain easy to find.
- [ ] The default Canvasser experience presents one obvious current-role queue rather than multiple competing course lists.
- [ ] Future-role Sales Apprentice / Sales Rep material is not silently auto-queued for an ordinary Canvasser.
- [ ] Future-role material remains intentionally discoverable through Career Path when appropriate.
- [ ] Returning to Lookup is obvious and immediate.

## C. Quick Check / completion ordering

Use a required-Quick-Check lesson.

- [ ] Before the Quick Check is satisfied, `MARK COMPLETE` cannot bypass it.
- [ ] Before the Quick Check is satisfied, forward/next-lesson navigation cannot bypass it.
- [ ] Complete the Quick Check and confirm completion/forward navigation then behaves normally.
- [ ] Repeat the forward-navigation guard on a **manager** lesson with a required Quick Check.
- [ ] The employee-facing pending language is clear and uses the simplified Quick Check wording.
- [ ] Local completion does not claim official HR/company certification.

## D. Sales Apprentice bridge and Sales controls

- [ ] Sales Apprentice renders the intended **four-item bridge**, not the former long wall of material.
- [ ] It clearly states that advanced sales training does **not** authorize pricing, financing, contracting, closing, or selling at the door.
- [ ] Sales Rep material preserves current-policy boundaries and does not invent unsupported procedures.
- [ ] **Sales Controls & References** is collapsed by default.
- [ ] Opening Sales Controls & References makes the underlying evidence/control material reachable.
- [ ] Collapsing evidence for usability has not removed or changed the substantive controls.

## E. Canvassing Library reachability

- [ ] Canvassing Library is reachable from **Training home**.
- [ ] Canvassing Library is reachable from **Videos & Audio**.
- [ ] Canvassing Library is reachable from **More Training Tools**.
- [ ] Source Library remains available but secondary to the daily employee training path.

## F. Complete Tony Hoty visibility and deduplication

Open **Canvassing Library**.

- [ ] Tony section renders **exactly 24 indexed media items**.
- [ ] No Tony media ID/card is duplicated within the Tony library rendering.
- [ ] `Canvassing 101` is visible.
- [ ] `New Canvasser Training — Process` is visible.
- [ ] `10 Step Canvassing Approach` is visible.
- [ ] Callback / Canvass Set / full-program / sound-bite material is visible.
- [ ] Manager/recruiting Tony material is visible where categorized.
- [ ] `Tony Hoty Canvassing Manual` is visible.
- [ ] `Tony Hoty Master Training Manual` is visible.
- [ ] Long titles wrap without hiding controls.
- [ ] Tony material remains `REFERENCE` / `HISTORICAL` as applicable and does not silently become `PARADISE APPROVED`.

## G. Dave Yoho and Grosso support visibility

- [ ] Dave Yoho canvassing / lead-generation section exposes **4 indexed media items**.
- [ ] Dave material remains reference/source material rather than current Paradise marketing policy.
- [ ] Grosso canvassing-support material is discoverable where relevant.
- [ ] Advanced Grosso in-home selling / bootcamp / product-demo / company-demo / Thermal Titan / virtual-closer material does not become ordinary Canvasser authority.
- [ ] Trainer playability never changes authority status.

## H. Curated Videos & Audio — no duplicate clutter

- [ ] Curated Videos & Audio screen is materially simpler than the full Source Library.
- [ ] The same media item is not rendered multiple times merely because it fits multiple curated themes.
- [ ] Complete trainer/source material remains reachable through Canvassing Library / Source Library.
- [ ] Source-only/historical recordings are not implied to be mandatory for promotion or certification.

## I. Secure trainer playback — current-runtime spot-check

Open at least one Tony item and one non-Tony item from the exact current runtime. At least one check must be repeated from the installed PWA.

PASS only if:

- [ ] Zero embedded Google Drive playback iframes appear.
- [ ] The old `Can't access your Google Account` embedded state does not appear inside Paradise University.
- [ ] `PLAY IN GOOGLE DRIVE ↗` is visible for Drive-backed trainer media.
- [ ] The correct controlled Drive source opens as a top-level authorized session.
- [ ] Actual playback starts for the current-runtime spot-check.
- [ ] Return to Paradise University works normally.
- [ ] No third-party-cookie/privacy-setting workaround is required.
- [ ] `SAVE FOR LATER` and allowed completion controls remain reachable in the app.
- [ ] The playback flow does not imply the media is cached for offline use when it is not.

Suggested Tony spot-check: `tony-canvassing-101` or `tony-video-process`.

Suggested non-Tony spot-check: `grosso-tonality-audio`, `grosso-tonality-video`, or a Dave Yoho item.

### Current-runtime playback result

- Tony asset: ___________________________
- Safari playback: PASS / FAIL / NOT RUN
- Installed PWA playback: PASS / FAIL / NOT RUN
- Non-Tony asset: ______________________
- Non-Tony playback: PASS / FAIL / NOT RUN
- Third-party-cookie workaround required: YES / NO
- Notes: _______________________________

## J. Opener / Missing Parties / authority controls

The existing candidate opener must remain exactly:

> I’m not here to sell you anything. I’m [Name] with Paradise Exteriors. We’re doing some work here in the neighborhood. Quick question—have you ever gotten an estimate to replace your [windows / doors / roof]?

- [ ] Exact candidate wording is unchanged.
- [ ] It still displays the controlled **CURRENT APPROVAL PENDING** state rather than silently becoming Paradise Approved.
- [ ] No trainer script silently replaces it.
- [ ] Missing Parties remains one or more homeowners or decision makers not present.
- [ ] No blanket spouse-presence rule appears.
- [ ] Trainer material does not override Paradise-approved curriculum or live municipality Lookup.
- [ ] Device lesson completion does not claim official HR/company certification.

## K. Offline installed-PWA test

1. Load the exact current runtime online and refresh/reinstall the Home Screen PWA so cache `trainingux3` is active.
2. Visit Lookup, Training, Practice, Career Path, My Progress, Canvassing Library, More, Source Library, and the field-opening lesson.
3. Enable Airplane Mode and disable Wi-Fi.
4. Relaunch the installed PWA.

PASS only if:

- [ ] Core app opens offline.
- [ ] Cached jurisdiction dataset / field behavior remains available exactly as designed.
- [ ] Training Experience v2 home opens offline.
- [ ] Core lessons, Practice, Career Path, and My Progress open offline.
- [ ] Canvassing Library opens offline.
- [ ] All **24 Tony media records** remain visible offline as metadata/cards.
- [ ] Both Tony manual/source records remain visible as metadata.
- [ ] Dave media metadata remains available as designed.
- [ ] External `PLAY IN GOOGLE DRIVE ↗` / source access is **not** falsely represented as offline-cached playback.
- [ ] Failed external access while offline does not break the app shell.
- [ ] No giant raw trainer-media library has been precached.
- [ ] Returning online restores external media/source access without clearing progress.

## L. Visual / touch QA

- [ ] No text clips at normal Dynamic Type.
- [ ] Repeat key Home, lesson, Canvassing Library, and Sales Apprentice screens at one larger Dynamic Type setting.
- [ ] Buttons have usable tap targets.
- [ ] Bottom navigation remains reachable above the iPhone home indicator.
- [ ] Player close/minimize and external Drive action remain inside the viewport.
- [ ] No modal or collapsed reference panel traps the user.
- [ ] Long Tony titles wrap correctly.
- [ ] Portrait orientation is clean across Training Home, lesson, Practice, Career Path, Canvassing Library, and My Progress.
- [ ] Rotate a trainer playback flow where supported and return without a dead state.

## Acceptance record — current runtime only

### Field / Lookup
- Result: PASS / FAIL / NOT RUN
- Boca Raton: PASS / FAIL / NOT RUN
- NO-GO jurisdiction tested: __________________
- NO-GO result: PASS / FAIL / NOT RUN
- Notes: _________________________________

### Training Experience v2
- Result: PASS / FAIL / NOT RUN
- One default Canvasser queue: YES / NO
- Future roles excluded from default queue: YES / NO
- Quick Check before completion: PASS / FAIL / NOT RUN
- Quick Check before forward navigation: PASS / FAIL / NOT RUN
- Manager Quick Check forward guard: PASS / FAIL / NOT RUN
- Sales Apprentice four-item bridge: YES / NO
- Notes: _________________________________

### Canvassing Library completeness
- Result: PASS / FAIL / NOT RUN
- Tony rendered count: ______ / 24
- Tony duplicate cards found: ______
- Both Tony manuals visible: YES / NO
- Dave rendered count: ______ / 4
- Trainer authority labels correct: YES / NO
- Notes: _________________________________

### Sales controls / references
- Result: PASS / FAIL / NOT RUN
- Collapsed by default: YES / NO
- Evidence reachable when opened: YES / NO
- Notes: _________________________________

### Current-runtime trainer playback
- Result: PASS / FAIL / NOT RUN
- Tony asset tested: _____________________
- Non-Tony asset tested: _________________
- Safari: PASS / FAIL / NOT RUN
- Home Screen PWA: PASS / FAIL / NOT RUN
- Notes: _________________________________

### Offline installed-PWA
- Result: PASS / FAIL / NOT RUN
- Canvassing Library offline: PASS / FAIL / NOT RUN
- 24 Tony records visible offline: YES / NO
- False offline-media claim absent: YES / NO
- Notes: _________________________________

### Currentness / authority
- Result: PASS / FAIL / NOT RUN
- Existing opener wording unchanged: YES / NO
- `CURRENT APPROVAL PENDING` present: YES / NO
- Trainer media remains REFERENCE/HISTORICAL: YES / NO
- Missing Parties homeowner/decision-maker wording: YES / NO
- Blanket spouse rule absent: YES / NO
- Notes: _________________________________

### Visual / touch
- Result: PASS / FAIL / NOT RUN
- Notes: _________________________________

## Release disposition

Until every required current-runtime row above is completed and no blocking physical defect remains:

`PHYSICAL_DEVICE_ACCEPTANCE = OPEN_CURRENT_RUNTIME_RETEST_REQUIRED`

Prior `ac353…` playback evidence remains preserved as historical evidence of the secure playback path, but it does not convert this `ae46fa6…` physical gate to PASS.

A physical-device PASS does **not** itself approve or revise the Paradise canvass opener, complete human curriculum/compliance signoff, certify employees, or authorize production promotion.

Promotion remains separately controlled and requires all other hard gates plus explicit promotion authorization and validated-branch readback.
