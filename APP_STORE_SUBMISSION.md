# Paradise Shows — App Store submission packet

## Recommended distribution

**Primary recommendation: Private Custom App through Apple Business Manager.**

Paradise Shows is an internal business-operations tool containing event planning, organizer, payment-status, task, and historical-performance information. Private distribution is a better fit than a publicly searchable App Store listing.

If unmanaged employee-owned devices later require ordinary App Store installation, evaluate Apple's Unlisted App option. An unlisted link is not a security mechanism.

## App identity

- App name: **Paradise Shows**
- Bundle ID: **com.paradiseexteriors.shows**
- SKU: **PARADISE-SHOWS-IOS-001**
- Version: **1.0**
- Build: **1**
- Primary language: **English (U.S.)**
- Primary category: **Business**
- Secondary category: **Productivity**
- Copyright: **2026 Paradise Exteriors LLC**
- iPhone deployment target: **iOS 15.0**
- Device family for v1: **iPhone**
- URL scheme: **paradiseshows://**

## Product-page metadata

### Subtitle
Event planning & execution

### Promotional text
Turn show research into clear next steps, booking controls, payment visibility, calendar planning, and historical performance.

### Description
Paradise Shows is the event-planning and show-operations workspace for Paradise Exteriors.

Use one operating view to see what needs attention, review upcoming events, manage booking and payment controls, compare historical show performance, and preserve the evidence behind each decision.

Key capabilities include:
- Action-first Next Steps organized by who or what must move next
- Published annual show calendar and conflict visibility
- Current, planned, and historical show records
- Booking, organizer-response, and payment controls
- Historical booth, cost, performance, and source evidence
- Native iOS share sheet, haptic navigation feedback, and deep links
- Mobile-first show detail and operational workflow

Paradise Shows is designed for authorized business use.

### Keywords
events,shows,operations,calendar,booking,payments,history,planning,workflow

### Support URL
https://paradise-shows-public.proud-math-b7d8.pages.dev/support

### Privacy Policy URL
https://paradise-shows-public.proud-math-b7d8.pages.dev/privacy

### Marketing URL
https://paradise-shows-public.proud-math-b7d8.pages.dev/

## App Review notes

Paradise Shows is a proprietary business-operations application for Paradise Exteriors LLC. It is intended for private Custom App distribution through Apple Business Manager.

The app helps authorized team members plan and operate trade shows and community events. The native iOS container packages the production web interface locally and adds native platform behavior including the iOS share sheet, haptic feedback, launch screen, and custom deep-link routing.

The app does not sell digital goods, contain advertising, or use third-party advertising tracking.

Suggested review paths:
- Next: current operating actions
- Calendar: published 2027 plan
- Shows: current controls, annual plan, and historical evidence
- Payments: payment-control records
- More: system controls, support, and privacy

No consumer account creation is required. The submitted build opens to a role-neutral access-code screen. Provide Apple a temporary reviewer access code only in App Store Connect Review Information; never commit that code to source control or place it in screenshots.

## App Privacy / privacy-manifest gate

Current source contains:
- no advertising SDK
- no App Tracking Transparency usage
- no native request for location, camera, microphone, contacts, photos, Bluetooth, Health, or advertising identifier
- an app privacy manifest declaring no tracking, no app-level required-reason API use, and user-entered operational content as Other User Content used for App Functionality
- Capacitor 8.5.0 as the current native Swift Package Manager binary runtime; the main Capacitor toolchain is at 8.5.2, while the current SPM binary release is 8.5.0. Its SDK privacy manifest/signature requirements are handled by the upstream package

**Before App Store Connect privacy answers are published**, confirm the exact Cloudflare, Supabase, authentication, and server-log retention practices. Do not select “Data Not Collected” solely from the client source; Apple treats data collected through embedded web traffic as app data where applicable.

## Age rating

The current product has no objectionable content, advertising, social media, chat, gambling, medical content, or unrestricted general-purpose web browser.

Complete Apple’s current age-rating questionnaire using those facts. The expected rating is the lowest applicable rating, subject to the questionnaire and any future feature changes.

## Export compliance

The native target sets `ITSAppUsesNonExemptEncryption = false`. This assumes the app uses only standard/exempt platform HTTPS/TLS and contains no custom non-exempt cryptography. Reconfirm before upload if cryptography is added.

## Screenshots

For the first iPhone release, prepare 6.9-inch portrait screenshots at one Apple-accepted size, preferably:

- **1320 × 2868**, or
- **1290 × 2796**, or
- **1260 × 2736**

Recommended sequence:
1. Next Steps
2. 2027 Calendar
3. Shows & history
4. Show detail / next action
5. Payments

Screenshots must not contain alpha/transparency.

## Hard security gate before TestFlight / App Review

The current production show APIs protect mutations with a 12-hour access-code session, but their read endpoints are still callable without an authenticated session. Origin/CORS restrictions are not an authorization control for direct HTTP clients.

**Do not submit this app to TestFlight external testing or App Review until authenticated reads are enforced and production-validated across:**

- `shows-api` operating/bootstrap/catalog reads
- `shows-history-api`
- `shows-annual-plan-api`

The implemented transition reuses the existing 12-hour company access-code session for human reads and writes and adds a role-neutral app login gate. GitHub Actions does not store the company access code: the approved GitHub workflows obtain short-lived GitHub OIDC identity, exchange it through `shows-api` `ciSession`, and receive a short-lived read-only `ci.*` token that cannot authorize write actions. App Review should receive its temporary reviewer access code only through App Store Connect Review Information.

Private Custom App distribution limits who can discover/install the iOS binary. It does not by itself secure the backend or the existing web URL.

## Review-access handling

Before submission:
- Create or designate a temporary App Review access code.
- Enter it only in App Store Connect Review Information with concise login instructions.
- Verify it opens the same read/write role-neutral app session used by authorized staff.
- Rotate or retire the reviewer code after approval if operational policy requires it.
- Never place the code in GitHub, app binaries, screenshots, support pages, or privacy-policy text.

## Account-specific items still required

These cannot be safely hard-coded in source control:

1. Apple Developer organization enrollment / Team ID
2. App Store Connect app record
3. Apple Business Manager Organization ID (for Private Custom App distribution)
4. Distribution certificate / automatic signing authorization
5. App Store Connect privacy questionnaire confirmation
6. Age-rating questionnaire
7. App screenshots captured from the signed/TestFlight build
8. App Review contact information
9. Final TestFlight internal-device acceptance
10. Submission and release approval

## Reproducible local build

1. Install current supported Xcode 26.x on macOS 26.
2. From repository root:
   - `npm ci`
   - `npm run ios:prepare`
3. Open `ios/App/App.xcodeproj`.
4. Select the Paradise Exteriors Apple Developer team.
5. Confirm bundle ID `com.paradiseexteriors.shows`.
6. Build on a physical iPhone.
7. Archive and upload to App Store Connect.
8. Test with TestFlight before App Review.

CI independently compiles an unsigned iPhone Simulator build on a GitHub `macos-26` runner.
