# Paradise Native Store Submission Runbook v1

Status: **SUBMISSION PACKAGE PREP / NOT SUBMITTED / NOT PUBLICLY DISTRIBUTED**

Date: 2026-08-19

Validated engineering baseline entering this stage: `2a47c0c4166b11e68b945ad8f9399261cb3a6bd7`

## Decision locked

- Android: **Google Play Internal Testing** for the initial employee rollout.
- iPhone: **Unlisted App Store** distribution.
- **No TestFlight dependency.**
- Do not publish Android to a public Production track without separate authorization.
- Do not request ordinary public App Store discovery.

## Current store engineering foundation

The validated repository already contains:

- app/bundle identity `com.paradiseexteriors.performance`;
- store version baseline `1.0.0` / build `1`;
- Android compile/target SDK 36 preparation;
- unsigned Android Release AAB compilation;
- iOS 26+ SDK validation;
- unsigned generic physical-iPhone Release compilation;
- iOS `PrivacyInfo.xcprivacy` integration;
- employee-started location controls;
- Android location foreground-service architecture without `ACCESS_BACKGROUND_LOCATION`;
- trusted-device/session/revocation controls;
- no signing secrets committed to GitHub.

Unsigned CI artifacts remain engineering evidence only and must not be distributed to employees.

## External policy anchors

Apple:

- Unlisted distribution: `https://developer.apple.com/support/unlisted-app-distribution/`
- App Store distribution methods: `https://developer.apple.com/help/app-store-connect/manage-your-apps-availability/set-distribution-methods`
- App privacy details: `https://developer.apple.com/app-store/app-privacy-details/`

Google:

- Internal testing: `https://support.google.com/googleplay/android-developer/answer/9845334`
- Prepare and roll out a release: `https://support.google.com/googleplay/android-developer/answer/9859348`
- Foreground-service declaration: `https://support.google.com/googleplay/android-developer/answer/13392821`
- Android location foreground-service requirements: `https://developer.android.com/develop/background-work/services/fgs/service-types`

## Critical privacy-policy finding

Paradise currently publishes `https://www.paradiseexteriors.com/privacy-policy/`, but the live page presently exposes the Privacy Policy heading and site navigation/footer without substantive employee-app privacy terms.

Therefore:

**Do not use the current live page as the final store privacy-policy URL until Paradise publishes approved substantive language that accurately covers the employee app.**

A review draft is maintained at:

`docs/PARADISE_PERFORMANCE_EMPLOYEE_APP_PRIVACY_NOTICE_DRAFT_2026-08-19.md`

That draft intentionally leaves retention, workforce-monitoring notice, rights/process, and final contact decisions unresolved for management/counsel/HR approval.

## Approved branding source candidates

Do not invent a new Paradise logo.

Google Drive currently contains company-source branding candidates including:

- `Paradise Exteriors Logo - 2174x1060__f53cbf0cc5.png`
  - Drive file ID: `1zMrEBxsxkyooIxXbmmopda_yjsGXa96I`
- `Paradise Exteriors Brand Guidlines__c5af41dab6.png`
  - Drive file ID: `1FePJBk-RGlT3gtl15v2eiMaWo1iOt9ii`

Before submission, the final icon/screenshot designer should use the approved company brand source and produce store-compliant assets without altering the Paradise identity.

## Apple — exact submission sequence

### A. Account / app record

1. Confirm active Apple Developer Program membership.
2. Confirm App Store Connect access with a role capable of creating/submitting the app.
3. Create the app record using bundle ID `com.paradiseexteriors.performance`.
4. Use app name `Paradise Performance` unless management separately changes the naming decision.
5. Set the distribution method initially as the publicly available App Store method required for the unlisted-request process; do **not** market or release it as a normal public-discovery app.

### B. Upload

1. Create the final signed App Store archive from the exact controlled release source.
2. Keep signing certificates/private keys/provisioning/App Store Connect API secrets outside GitHub.
3. Upload through Apple's approved upload workflow.
4. Confirm version `1.0.0`, build `1`, bundle ID, entitlements, privacy manifest, and location purpose strings from the uploaded binary.

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
- final App Review account and trusted-device enrollment instructions;
- screenshots and app icon;
- age-rating answers;
- final app-privacy questionnaire.

### D. App privacy

The final App Store Connect privacy answers must reflect the final production binary and backend behavior.

Current controlled baseline indicates likely disclosure of at least:

- Precise Location;
- Coarse Location where applicable;
- User ID;
- Device ID / device-level trusted identifier;
- operational app/workday activity where retained;
- other route/workday evidence where applicable.

Current controlled intent:

- linked to the employee/user where operationally associated;
- used for app functionality/security/account operation;
- **not** used for advertising or cross-company tracking.

Do not submit these as final answers until the privacy draft, retention policy, and final binary are reviewed together.

### E. App Review notes

App Review must receive usable access instructions. The current package intentionally contains a blocker instead of invented credentials.

Before submission, add:

- review username/account;
- password or approved review-access mechanism;
- exact trusted-device/enrollment steps;
- any one-time token/QR process needed by the reviewer;
- steps to reach Start My Day and demonstrate location behavior;
- explanation that location begins from an employee-started foreground workday and is not advertising/tracking.

### F. Unlisted request

Apple's current process requires the app to be ready for final distribution and submitted to App Review. Review Notes should state that the app is intended for unlisted distribution. Then submit the Unlisted App Distribution request.

Use the controlled request rationale in `store-metadata-v1.json`.

Do not submit an unlisted request for a beta/prerelease build.

## Google Play — exact submission sequence

### A. Account / app record

1. Confirm active Google Play Console developer account and permissions.
2. Create the app record for `Paradise Performance` / `com.paradiseexteriors.performance`.
3. Enable Google Play App Signing and establish protected upload-key custody according to the account owner's chosen signing workflow.
4. Do not commit upload keys or keystores to GitHub.

### B. Internal testing

1. Use **Testing > Internal testing**.
2. Upload the final signed Android App Bundle derived from the controlled release.
3. Add up to 100 authorized tester Google/Workspace accounts.
4. Roll out only to the Internal testing track.
5. Send employees the Play opt-in/tester URL after the release is accepted and available.

If the eligible Android population later exceeds the internal-test limit, move to an appropriately controlled closed/private testing/distribution design rather than making the app publicly available by default.

### C. Store listing

Use the controlled metadata package for:

- app name;
- short description;
- full description;
- support URL;
- approved brand source.

Do not use the current empty/substantively incomplete privacy page as the final privacy URL.

### D. App access

Google review must be able to access restricted functionality.

Before submission, provide a review account and exact enrollment/trusted-device instructions. Do not claim the app is unrestricted.

### E. Foreground service declaration

The controlled Android design uses the `location` foreground-service type for a user-started active workday.

The Play Console declaration should truthfully describe:

- what functionality uses the location foreground service;
- why timely execution matters;
- what happens if the service is interrupted;
- the user action that starts the workday/location flow;
- a reviewable demonstration video URL.

Draft text is controlled in `store-metadata-v1.json`.

The video must show the final production binary and the employee steps that trigger the feature. Do not fabricate a video URL.

### F. Data Safety

The final Data Safety form must be reconciled against:

- the final signed binary;
- the Supabase-backed production data flow;
- the approved employee-app privacy notice;
- actual retention/deletion policy;
- any third-party SDKs in the final build.

The draft controlled categories are maintained in `store-metadata-v1.json`; they are not final legal/policy answers.

## Screenshot plan

Use real production UI from the final signed release. Do not use mock screenshots that imply unavailable features or approved KPI/pay values.

Recommended screenshot story:

1. Paradise Performance secure welcome/enrollment state.
2. Main employee home / current-workday state.
3. Start My Day location-permission/workday flow.
4. Performance/progress view showing only configured/authorized information.
5. Paradise University / training view.
6. Manager or employee workflow representative of the authorized role.

Before capture:

- use synthetic/review-only employee data;
- remove real customer/employee PII;
- do not display enrollment secrets/tokens;
- do not imply physical-device acceptance tests passed;
- ensure the screenshot UI matches the submitted binary.

## Final blockers — do not bypass

Actual employee-installable distribution remains blocked on:

1. Apple Developer / App Store Connect access;
2. Google Play Console access;
3. protected production signing configuration;
4. approved substantive employee-app privacy policy URL;
5. approved retention and workforce-location notice language;
6. final review accounts/enrollment instructions;
7. approved icon/screenshots;
8. Google foreground-service demonstration video;
9. final App Store privacy and Google Data Safety review;
10. successful official-store review/processing.

## Release rule

Do not call Paradise Performance "distributed," "App Store approved," "unlisted approved," "Google Play available," or "employee installable" until the corresponding official store actually returns that state.
