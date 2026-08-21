# Paradise Performance Web Interim v2

Status: CONTROLLED TESTING CANDIDATE / NOT EMPLOYEE-ROLLOUT AUTHORIZED

## Purpose

Provide the strongest supported browser/PWA interim path while Apple App Store and Google Play account/signing work is completed. The web interim reuses the validated Canvass Manager + Paradise University base and the existing Paradise Performance trusted-device backend. It does not replace or redefine the native release.

Runtime lineage:

- stable validated application release-source: `16664d276a529006be68a846e12ede5ff7344e1b`
- public evidence/control base for this enhancement: `b78d324c119633a3b18806a576c5f5e1edaeb9bf`
- field baseline: 78 jurisdictions / 76 GO / 2 NO-GO / zero intended drift

## What the web interim enables

- existing validated Lookup
- existing Paradise University training/progress
- Paradise Performance Today workday start/finish
- existing one-time manager enrollment through `performance-enrollment-redeem`
- trusted browser identity using the backend-supported `web-test` platform
- immediate RLS/revocation semantics from the existing Performance identity/device model
- offline EVENT/LOCATION queue behavior already used by the controlled Performance client
- continuous high-accuracy foreground location during an active shift through `navigator.geolocation.watchPosition()`
- best-effort Screen Wake Lock on supported iOS/Safari and Android/Chrome browsers to reduce accidental auto-locking while a shift is active
- automatic watcher pause when the document becomes hidden and automatic resume after visibility returns when geolocation permission is already granted
- manual `RESUME LIVE GPS` / foreground capture fallback when permission or browser behavior prevents automatic resume

## Security boundary

The web client receives only the existing Supabase publishable key plus the enrolled user's session. No service-role/secret key may be bundled. Employees do not receive visible Supabase email/password credentials.

Unlike the native app, the web interim persists the revocable refresh session in same-origin browser storage because OS Keychain/Keystore plugins are unavailable in a normal browser. This is an explicit interim tradeoff. Enroll only private company-controlled browsers/devices. The user can clear local web access; manager/admin revocation remains the authoritative server-side control.

A stored binding is accepted only when the authenticated employee mapping is valid and the stored device row is still present, not revoked, and has `platform = web-test`.

## Location boundary

The web interim is continuous foreground GPS, not native background GPS.

- During an authoritative active shift, it uses high-accuracy `watchPosition()` while the document is visible.
- Accepted watch samples are queued as `web-foreground-watch` evidence; explicit/manual samples remain `web-foreground-sample`.
- Watch samples are rate-controlled to avoid excessive writes while still preserving movement evidence.
- It requests Screen Wake Lock best-effort so supported browsers keep the display awake while Paradise remains foregrounded.
- `visibilitychange` to hidden immediately clears the geolocation watcher and releases/pause-marks the wake lock.
- Returning visible automatically restarts the watcher only when location permission is already known as granted; it does not silently create a new permission prompt on an already-active shift.
- A visible user action can resume live GPS when automatic resume is not possible.
- `continuousBackgroundTracking` remains `false` by contract.
- It does not promise location continuity while Safari/Chrome is backgrounded, suspended, terminated, or while the phone is locked.
- Location permission, signal, or wake-lock failure does not block Finish Day.
- Web location remains operational evidence only and never authorizes canvassing; Lookup remains the field/legal authority.

The native iOS/Android release remains the intended path for true background/locked-screen location behavior.

## Build isolation

`node scripts/build-performance-web-site.mjs` requires a fresh `canvass-dist`, copies it to `performance-web-dist`, then injects only the web interim shell. The builder verifies that the original `canvass-dist/index.html` remains byte-identical.

The web build changes its copied PWA manifest to Paradise Performance and adds only the controlled Performance assets to the copied service-worker CORE cache. It does not alter the public/validated Canvass bundle.

## Release gates before broader employee use

1. Web interim CI must be GREEN on the exact candidate head.
2. Field baseline must remain 78 / 76 / 2 with no release/classification drift.
3. Trusted browser enrollment and live foreground GPS must be validated end to end with approved testing identities before broader use.
4. Apple/WebKit and Android/Chromium browser smoke must pass on the actual HTTPS delivery surface.
5. Privacy/HR decisions required for employee workday/location use remain applicable; this web build does not waive them.
6. Public privacy-policy readiness remains a separate organizational gate.
7. Production/customer data remains prohibited until separately authorized.
8. Employee rollout requires explicit Paradise authorization.

Physical-device acceptance for the native app remains OWNER-WAIVED / UNTESTED / NOT PASS and is not converted to PASS by web testing.

## Non-goals

- no App Store or Play submission
- no employee-wide production release
- no claim of native locked-screen/background GPS from a browser
- no customer SET writes
- no KPI/pay/commission values
- no territory-rule invention
- no retention-policy invention
- no Layer-3/CURRENT/municipality classification changes
- no Cloudflare or Paradise production-domain deployment from this implementation tranche
