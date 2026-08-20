# Paradise Native Store Submission Runbook v1

Status: **SUBMISSION PACKAGE PREP / NOT SUBMITTED / NOT PUBLICLY DISTRIBUTED**

Date: 2026-08-19

Runtime-behavior baseline entering this documentation synchronization: `662e0716fda60003bac3800712c8d2910c3aa10b`.

The corresponding controlled publication before this docs-only synchronization was complete: `paradise-canvass-manager-validated` pinned that runtime-behavior baseline, public `latest.json` independently pinned **78 / 76 / 2** with zero dataset, jurisdiction, or classification drift, and the publisher metadata commit was `be6d5e388490af3cffb39c6e57bcad49fb39ff59`. Documentation-only revisions may advance the release-source SHA without changing that runtime behavior. For the current release-source identity, use `paradise-canvass-manager-validated` and public `latest.json` rather than treating this historical runtime-baseline line as a self-referential source pin.

## Decision locked

- Android: **Google Play Internal Testing** for the initial controlled employee pilot/test.
- iPhone: **Unlisted App Store** distribution.
- iOS store v1 device family: **iPhone only** (`TARGETED_DEVICE_FAMILY = 1`).
- **No TestFlight dependency.**
- Do not publish Android to a public Production track without separate authorization.
- Do not request ordinary public App Store discovery.
- Opt out of Apple Silicon Mac availability unless Paradise separately validates and authorizes the Mac experience.

## Current store engineering foundation

The controlled repository now contains:

- app/bundle identity `com.paradiseexteriors.performance`;
- store version baseline `1.0.0` / build `1`;
- native-only `performance-dist` isolated from the public Canvass bundle;
- trusted-device enrollment/session/revocation controls;
- Performance Today `Start My Day` / `Finish Day` integration;
- offline queued replay restricted to operational `EVENT` and `LOCATION` writes, while authoritative shift/workday state uses the separate controlled shift transport for start/finish state and configured workday fields;
- dormant customer `SET` transport excluded from the current native store bundle;
- reusable marketplace-review sign-in source architecture that can mint a fresh short-lived synthetic-device enrollment before ordinary trusted-device redemption; operational reviewer credentials remain blocked pending supported Auth-user provisioning and deployed end-to-end validation;
- Android compile/target SDK 36 preparation;
- unsigned Android Release AAB compilation;
- iOS 26+ SDK validation;
- unsigned generic-iPhone Release compilation;
- iOS `PrivacyInfo.xcprivacy` integration;
- employee-started location controls;
- Android location foreground-service architecture without `ACCESS_BACKGROUND_LOCATION`;
- controlled Paradise iOS AppIcon and Android launcher assets;
- visually approved Apple and Google icon-review evidence;
- no signing secrets committed to GitHub.

Unsigned CI artifacts remain engineering evidence only and must not be distributed to employees. Physical-device acceptance remains **OWNER-WAIVED / UNTESTED / NOT PASS** unless the release owner reverses that waiver and completes the hardware matrix.

## Brand package — closed

The controlled square app-icon origin is the existing Drive asset:

- `Paradise-png-Favicon-528.png`
- Drive file ID `1CsDZmKJWC6BUgszGD3NZ8BKG_m_B5Wz8`
- 528 × 528
- 44,927 bytes
- SHA-256 `75e563729b9d0771335930a9e0c97eed3c2f37dd3b4a855f998201a8009f0c13`

The recent Paradise brand-guidelines image, Drive ID `1FePJBk-RGlT3gtl15v2eiMaWo1iOt9ii`, was visually reviewed and supports the square house/P mark on white.

The validated store-assets pipeline permits deterministic resize/centering and the required platform background/alpha treatment only. It does not redraw, recolor, distort, crop a wordmark into a new mark, or invent Paradise geometry.

**App icon / launcher production is no longer a release blocker.**

Launch/splash art remains separate. Do not invent launch artwork solely to create another asset.

## Critical privacy-policy finding

Paradise currently publishes `https://www.paradiseexteriors.com/privacy-policy/`, but the currently retrievable page does not provide a verified substantive employee-app policy body.

**Do not use the current live page as the final store privacy-policy URL until Paradise publishes approved substantive language that accurately covers the employee app.**

The controlled working draft remains:

`docs/PARADISE_PERFORMANCE_EMPLOYEE_APP_PRIVACY_NOTICE_DRAFT_2026-08-19.md`

Retention, workforce-monitoring notice, rights/process, and final privacy contact remain management/counsel/HR inputs. Do not fabricate them.

## Apple — exact submission sequence

### A. Account / app record

1. Confirm active Apple Developer Program membership.
2. Confirm App Store Connect access with a role capable of creating/submitting the app.
3. Create the app record using bundle ID `com.paradiseexteriors.performance`.
4. Use app name `Paradise Performance` unless management separately changes the naming decision.
5. Keep the selected route **Unlisted App Store**, not Private / Custom App and not ordinary public discovery.
6. Opt out of Apple Silicon Mac availability unless the Mac experience is separately validated.

### B. Final signed build

1. Create the final signed App Store archive from the exact controlled release source.
2. Keep signing certificates, private keys, provisioning material, and App Store Connect API secrets outside GitHub.
3. Confirm version `1.0.0`, build `1`, bundle ID, entitlements, privacy manifest, location strings, Paradise icon, and `UIDeviceFamily = [1]` from the uploaded build.
4. Do not upload a universal iPhone+iPad binary unless Paradise intentionally reopens iPad support and accepts its additional testing/screenshot obligations.

### C. App information

Use `store/paradise-performance/store-metadata-v1.json` as the controlled copy source for:

- subtitle;
- promotional text;
- description;
- keywords;
- review notes;
- unlisted-distribution request rationale.

Required external additions before submission:

- final approved privacy-policy URL;
- final support/review contact;
- final operational App Review credential and trusted-device enrollment instructions after supported Auth-user creation, exact administrator-controlled `app_metadata` readback, and deployed end-to-end validation;
- final signed-build screenshots;
- age-rating answers;
- final app-privacy questionnaire.

The app icon package is already controlled, machine-validated, visually approved, and present in the native-store build path.

### D. App privacy

The final App Store Connect privacy answers must reflect the final signed binary and backend behavior.

Current controlled baseline indicates likely disclosure of at least:

- Precise Location;
- Coarse Location where applicable;
- User ID;
- Device ID / trusted-device identifier;
- Other Data Types for residual operational shift/workday evidence that is not general UI-interaction telemetry.

Do **not** label employee operational workday events as Apple `Product Interaction` merely because the employee used a button to create them. Re-review only if the final binary separately retains launches, taps, clicks, scrolling, views, or similar interaction telemetry.

Current controlled intent remains linked to the employee/user, used for app functionality/security/account operation, and not used for advertising or cross-company tracking.

### E. Review access

The reusable marketplace-review source path is implemented and validated in stable source. The review credential uses a separate non-persistent Auth client only to obtain a fresh short-lived one-time synthetic-device enrollment; the review client signs out before the ordinary trusted-device redemption/session flow begins. The reusable review account itself has no ordinary Performance actor identity.

**Operational status remains NOT OPERATIONAL.** Before submission, Paradise must use a supported Supabase Auth admin path to create the reusable reviewer, confirm the exact administrator-controlled `app_metadata`, run the deployed reusable login → fresh one-time enrollment → ordinary trusted-device redemption path end to end, and store the final credential only in the real marketplace review consoles or another approved secret store.

App Review must receive usable synthetic access instructions. Before submission, add:

- review username/account;
- approved review password/access mechanism;
- exact `APP REVIEW ACCESS` → fresh one-time enrollment → trusted-device redemption steps;
- steps to reach Start My Day and Finish Day;
- explanation that location starts from an employee action and is not advertising/tracking.

Never place a live password, recovery code, signing key, reusable review secret, or enrollment token in the repository or screenshot package.

### F. Unlisted request

Submit the final app to App Review with Review Notes stating that unlisted distribution is intended. Then submit Apple's Unlisted App Distribution request using the controlled rationale in `store-metadata-v1.json`.

Do not submit an unlisted request for a beta/prerelease build.

## Google Play — exact submission sequence

### A. Account / app record

1. Confirm active Google Play Console developer account and permissions.
2. Create the app record for `Paradise Performance` / `com.paradiseexteriors.performance`.
3. Establish Play App Signing/upload-key custody using the account owner's protected workflow.
4. Do not commit upload keys, keystores, passwords, service-account secrets, or recovery material to GitHub.

### B. Internal Testing

1. Use **Testing > Internal testing**.
2. Upload the final signed Android App Bundle derived from the controlled release.
3. Add up to 100 authorized tester Google/Workspace accounts.
4. Roll out only to the Internal Testing track.
5. Send the controlled Play opt-in/tester route only after the release is accepted and available.

Google states that **apps exclusively active on the Internal Testing track are exempt from inclusion in the Data Safety section**. Data Safety is **not a hard blocker solely to that Internal-Testing-only release**. Preserve the controlled draft for any later distribution mode where Google requires it.

### C. Store listing / access

Use the controlled metadata package for the app name, short description, full description, support URL, approved icon, and screenshot plan.

Google review must be able to access restricted functionality whenever the applicable Play workflow requires review access. Use the same controlled synthetic reusable-review architecture described above after supported Auth-user provisioning and deployed end-to-end validation. Do not claim the app is unrestricted or that reviewer access is operational before that validation passes.

### D. Foreground-service declaration

The Android design uses the `location` foreground-service type for a user-started active workday.

The Play Console declaration must truthfully describe:

- what functionality uses the location foreground service;
- why timely execution matters;
- what happens if the service is interrupted;
- the employee action that starts the workday/location flow;
- the final-binary demonstration video URL required by the current controlled Paradise Play release gate.

Do not fabricate a video URL or treat the foreground-service evidence package as complete until the final signed binary is available and the real demonstration is recorded.

## Controlled screenshot plan

The source of truth is:

`store/paradise-performance/store-screenshot-plan-v1.json`

**Final screenshots must come from the final signed candidate.** The unsigned CI shell and simulator-only capture are validation aids, not final store screenshot sources under Paradise's release control.

### Apple

- device family: iPhone only;
- primary portrait capture target: 6.9-inch iPhone, 1320 × 2868;
- 1–10 screenshots permitted by App Store Connect;
- submitted screenshot files must be JPEG/JPG/PNG without alpha/transparency;
- iPad screenshots are not required by this controlled build because the build is locked to iPhone device family only.

### Google Play

- phone portrait target: 1080 × 1920, 9:16;
- controlled set: six screenshots;
- submitted base captures: JPEG or 24-bit PNG without alpha;
- Paradise control requires concise alt text for every screenshot;
- no device-frame marketing overlay is part of the controlled base capture.

### Six-state story

1. Secure welcome / trusted-device enrollment state.
2. **Performance Today idle/current-workday state.**
3. Start My Day employee-started active-workday flow.
4. **Lookup field/legal instruction view** showing Lookup remains independently available.
5. Paradise University training/progress view.
6. **Finish Day / completed-workday state** from the final v1 binary.

Before capture:

- use synthetic/review-only employee data;
- remove real customer and employee PII;
- do not display enrollment secrets/tokens;
- do not show real precise coordinates or routes;
- do not imply physical-device acceptance tests passed;
- ensure every screenshot state exists in the exact submitted binary;
- do not add screenshots for customer SET, Quick Set, KPI/pay, leaderboard, or route-map surfaces unless those features are actually enabled in that binary.

After capture, record dimensions, format, SHA-256, source build identity, and visual QC for every image.

## Remaining blockers — do not bypass

Actual employee-installable distribution remains blocked on:

1. Apple Developer / App Store Connect access;
2. Google Play Console access;
3. protected production signing configuration;
4. approved substantive employee-app privacy-policy URL;
5. approved retention and workforce-location notice language;
6. operational reusable review credential: supported Auth-user provisioning, exact `app_metadata` readback, deployed end-to-end validation, and final review-console storage;
7. final signed-build screenshot set;
8. final signed-binary Google location foreground-service demonstration video and declaration evidence;
9. final App Store privacy-answer review;
10. successful official-store review/processing and explicit release authorization.

Conditional later-distribution blocker:

- Final Google Play Data Safety review before any Google Play distribution mode for which Google requires the Data Safety section.

## Release rule

Do not call Paradise Performance "distributed," "App Store approved," "unlisted approved," "Google Play available," or "employee installable" until the corresponding official store actually returns that state.
