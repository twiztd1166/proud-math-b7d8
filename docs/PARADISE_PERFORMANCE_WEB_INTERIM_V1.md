# Paradise Performance Web Interim v1

Status: WORKING CANDIDATE / NOT DEPLOYED / NOT EMPLOYEE-ROLLOUT AUTHORIZED

## Purpose

Provide a controlled browser/PWA interim path while Apple App Store and Google Play account/signing work is completed. The web interim reuses the validated Canvass Manager + Paradise University base and the existing Paradise Performance trusted-device backend. It does not replace or redefine the native release.

Runtime lineage:

- stable validated application release-source: `16664d276a529006be68a846e12ede5ff7344e1b`
- public evidence-control base used by this isolated branch: `5f080e915b83f020b699cff49f90b136112da668`
- field baseline: 78 jurisdictions / 76 GO / 2 NO-GO / zero intended drift

## What the web interim enables

- existing validated Lookup
- existing Paradise University training/progress
- Paradise Performance Today workday start/finish
- existing one-time manager enrollment through `performance-enrollment-redeem`
- trusted browser identity using the backend-supported `web-test` platform
- immediate RLS/revocation semantics from the existing Performance identity/device model
- offline EVENT/LOCATION queue behavior already used by the controlled Performance client
- explicit foreground browser location samples at Start My Day, Capture Location Now, and best-effort Finish Day

## Security boundary

The web client receives only the existing Supabase publishable key plus the enrolled user's session. No service-role/secret key may be bundled. Employees do not receive visible Supabase email/password credentials.

Unlike the native app, the web interim persists the revocable refresh session in same-origin browser storage because OS Keychain/Keystore plugins are unavailable in a normal browser. This is an explicit interim tradeoff. Enroll only private company-controlled browsers/devices. The user can clear local web access; manager/admin revocation remains the authoritative server-side control.

A stored binding is accepted only when the authenticated employee mapping is valid and the stored device row is still present, not revoked, and has `platform = web-test`.

## Location boundary

The web interim must never be represented as continuous native GPS.

- It uses `navigator.geolocation.getCurrentPosition()` only.
- It never calls `watchPosition()`.
- It does not promise location continuity while Safari/Chrome is backgrounded, suspended, terminated, or while the phone is locked.
- Reopening an already-active shift does not silently prompt for or begin location collection.
- Location permission failure does not block Finish Day.
- Web location remains operational evidence only and never authorizes canvassing; Lookup remains the field/legal authority.

The native iOS/Android release remains the intended path for controlled background/locked-screen location behavior.

## Build isolation

`node scripts/build-performance-web-site.mjs` requires a fresh `canvass-dist`, copies it to `performance-web-dist`, then injects only the web interim shell. The builder verifies that the original `canvass-dist/index.html` remains byte-identical.

The web build changes its copied PWA manifest to Paradise Performance and adds only `performance-web-app.js` and `performance-web.css` to the copied service-worker CORE cache. It does not alter the public/validated Canvass bundle.

## Release gates before any employee use

1. Web interim CI must be GREEN on the exact candidate head.
2. Field baseline must remain 78 / 76 / 2 with no release/classification drift.
3. Trusted browser enrollment must be validated end to end with synthetic/non-production data first.
4. A hosting target must use HTTPS and a dedicated controlled origin; preferred future candidate is `performance.paradiseexteriors.com` after deployment/smoke-test approval.
5. Privacy/HR decisions required for employee workday/location use remain applicable; this web build does not waive them.
6. Public privacy-policy readiness remains a separate organizational gate.
7. Production/customer data remains prohibited until separately authorized.
8. Employee rollout requires explicit Paradise authorization.

Physical-device acceptance for the native app remains OWNER-WAIVED / UNTESTED / NOT PASS and is not converted to PASS by web testing.

## Non-goals

- no App Store or Play submission
- no public-production release
- no native background-GPS substitute
- no customer SET writes
- no KPI/pay/commission values
- no territory-rule invention
- no retention-policy invention
- no Layer-3/CURRENT/municipality classification changes
- no Cloudflare or Paradise-domain deployment from this implementation tranche
