# Paradise Performance Native Store Distribution v1

Status: STORE-DISTRIBUTION PREP ONLY / NOT SUBMITTED / NOT PUBLIC

Date: 2026-08-19

## Decision

Paradise Performance will use official-store distribution without a public searchable consumer listing:

- Android: **Google Play Internal Testing** for the initial employee rollout. Employees receive the controlled tester URL and install through Google Play. If the eligible Android population later exceeds the internal-test limit, use an appropriately access-controlled closed/private Play track rather than a public production listing.
- iPhone: **Unlisted App Store** distribution after final App Review and approval of the unlisted-distribution request. The intended employee experience is a direct App Store link. **NO TESTFLIGHT DEPENDENCY** is required for this distribution architecture.

This repository stage prepares unsigned store candidates and compliance controls only. It does not upload, sign, submit, publish, enroll testers, or make any app discoverable.

## Production identity

- App name: Paradise Performance
- Bundle/application ID: `com.paradiseexteriors.performance`
- Store version baseline: `1.0.0`
- Store build baseline: `1`
- Web payload: the controlled Paradise production bundle generated from `canvass-dist`

Changing the bundle/application ID after store registration would create a different app identity and requires separate authorization.

## Android private distribution control

The Android candidate is prepared for Google Play with:

- compile SDK 36;
- target SDK 36;
- Release AAB compilation;
- employee-started location tracking only;
- coarse/fine location permission;
- visible foreground-service location tracking while the workday is active;
- notification permission where Android requires it;
- no `ACCESS_BACKGROUND_LOCATION` permission request in the controlled manifest;
- no signing material committed to GitHub.

Google Play signing/upload credentials remain external. The CI artifact is deliberately named `UNSIGNED-NOT-FOR-DISTRIBUTION` and is not the file employees should receive directly.

Before an internal-testing release is rolled out, the Play Console owner must complete all required store declarations, including the location/foreground-service declarations applicable to the final binary and a truthful Data safety form.

## iPhone unlisted distribution control

The iOS candidate is prepared for final App Store review with:

- bundle ID `com.paradiseexteriors.performance`;
- Release configuration on a generic physical iPhone target;
- iOS 26-or-later SDK validation in CI;
- `NSLocationWhenInUseUsageDescription` describing employee-started workday location;
- `UIBackgroundModes` location because an employee-started active workday may continue location updates while the app is backgrounded;
- visible iOS background-location indicator enabled by the native implementation;
- `PrivacyInfo.xcprivacy` bundled as an app resource;
- no signing certificates, provisioning profiles, private keys, or App Store Connect API keys committed to GitHub.

The intended route is final App Review followed by the Unlisted App Distribution request. This is not a beta submission and does not depend on TestFlight.

## Privacy disclosure baseline

The native application can process or transmit data that includes:

- precise or approximate location;
- employee/user identity;
- trusted-device identity;
- active shift/workday identity;
- timestamps and route evidence;
- location accuracy and device/platform metadata;
- where available, altitude, speed, heading, and simulated/mock-location evidence.

Location tracking is designed to begin only from the visible employee-initiated **Start My Day** flow, not at ordinary application launch. The native layer must stop active tracking when the controlled workday is stopped.

The iOS privacy manifest declares location and identifier data as linked to the user for app functionality and declares no tracking for advertising/cross-company tracking purposes. App Store Connect privacy answers and Google Play Data safety answers must match the final production behavior and legal/privacy policy exactly; the manifest is not a substitute for those console disclosures.

Paradise currently has a public privacy-policy page at:

`https://www.paradiseexteriors.com/privacy-policy/`

That URL is a candidate store privacy-policy URL only. Before submission, Paradise must confirm that the live policy accurately covers this employee application, including workday precise/approximate location, employee/device identifiers, retention/use, access, and any required employee notices. No legal adequacy is inferred merely because the page exists.

## Items intentionally external / unresolved

The following are not safe to invent or commit and remain required before actual store submission:

1. Google Play Console access and application record.
2. Google Play App Signing / upload-key custody.
3. Apple Developer Program and App Store Connect access.
4. Apple distribution certificate/provisioning/App Store Connect signing configuration or other approved signing workflow.
5. Final company-approved employee-app privacy policy / employee location notice.
6. App Store privacy questionnaire and Google Play Data safety answers based on the final production behavior.
7. Google Play foreground-service/location declaration and any required review demonstration/video.
8. Final app icon/brand assets and store screenshots supplied or approved by Paradise.
9. App Store description, support URL, review contact, review notes, age rating, and unlisted-distribution request text.
10. Actual signed Release AAB / archived iOS App Store upload and store-console submission.

## Hard controls

- Do not commit Android keystores, upload keys, Apple certificates, provisioning profiles, App Store Connect private keys, passwords, or signing secrets.
- Do not distribute CI `UNSIGNED-NOT-FOR-DISTRIBUTION` artifacts to employees as production apps.
- Do not publish Android to the public Production track unless separately authorized.
- Do not request public App Store discovery; the iPhone target is Unlisted App Store distribution.
- Do not describe TestFlight or prior device-acceptance builds as the production employee release.
- Prior physical iPhone/Android acceptance remains owner-waived / untested / NOT PASS and is not rewritten by this store-preparation work.
- Store submission does not authorize KPI/pay standards, territory policy, employee roster, CRM mappings, or any other business-policy value that remains unconfigured.

## Release boundary

This stage may be called **store-ready engineering preparation** only after its exact-head CI gates pass. Actual distribution remains blocked until the external account, signing, privacy, branding, and store-submission requirements above are completed and the resulting signed binaries are reviewed through the official stores.
