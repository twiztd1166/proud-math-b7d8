# Paradise Performance v1 — Store Review Access

Status: **ISOLATED REVIEW-ACCESS CANDIDATE / NOT PROVISIONED / NOT DEPLOYED / NOT SUBMITTED**

Date: 2026-08-19

Stable validated application entering this tranche: `8a096f0eebc8657efbf26bf440341c95d56e3b2f`.

Public metadata head entering this tranche: `8eedcad72a747bd4bd7d6fa216117714a2c624bc`.

## Problem being solved

Paradise's ordinary trusted-device enrollment uses a manager-issued high-entropy one-time code. That is correct for employees but is not a suitable reusable marketplace-review credential.

The store-review path must therefore satisfy two controls at once:

1. marketplace reviewers receive stable credentials that can be reused during review; and
2. Paradise does **not** weaken the one-time trusted-device enrollment model or expose production employee/customer data.

## Architecture

The reusable store-review credential is a normal Supabase Auth email/password account in the isolated non-production project `taxlrlfsobtnbasjcnuf`.

That account:

- has **no** row in `performance_actor_identities`;
- has no Performance manager/admin role;
- cannot use ordinary Performance RLS/team reads merely because it can authenticate;
- is marked only through admin-controlled `app_metadata` for the store-review gate;
- is used from a separate non-persistent Supabase client;
- is signed out locally immediately after review enrollment is prepared.

Required admin-controlled app metadata:

- `paradise_store_review: true`
- `performance_review_employee_id: <synthetic canvasser UUID>`
- `performance_review_issuer_employee_id: <synthetic manager/admin UUID>`

No credential value belongs in this repository or the Drive working package.

## Edge Function

`performance-review-enrollment-mint`

- `verify_jwt = true`;
- independently calls `auth.getUser(jwt)`;
- requires the admin-controlled store-review flag;
- does not call `authenticatePerformanceActor()`;
- does not accept an employee ID from the client;
- requires the configured review employee to be an active `canvasser`;
- requires the configured issuer to be an active `manager` or `admin`;
- revokes older unused review enrollment tokens for the synthetic review employee;
- mints a fresh 32-byte high-entropy token;
- stores only the SHA-256 token hash in `performance_enrollment_tokens`;
- fixes the review enrollment lifetime at 10 minutes;
- returns the plaintext token only to the authenticated review-gate call so the native app can immediately run normal enrollment.

The reusable review credential itself is never converted into a Performance actor identity.

## Native flow

On an unenrolled native device, the existing employee one-time-code form remains unchanged.

A separate **STORE REVIEW ACCESS** card accepts the marketplace-review email/password.

The client then:

1. creates a separate Supabase client with `persistSession=false`, `autoRefreshToken=false`, and `detectSessionInUrl=false`;
2. signs in with the reusable review credentials;
3. invokes `performance-review-enrollment-mint`;
4. signs that temporary review session out locally;
5. passes the returned one-time enrollment token into the existing `redeemTrustedDevice()` path;
6. stores only the resulting ordinary hidden device-bound trusted-device session in OS-protected storage.

The review email/password is never written to localStorage, secure storage, the offline queue, logs, repository files, or Drive control documents.

## Synthetic review identities

Provisioning requires exactly:

- one active synthetic `canvasser` employee for the reviewer experience;
- one active synthetic `manager` or `admin` employee used only as audit issuer for enrollment-token creation;
- one reusable Supabase Auth review-gate user with the app metadata above and **no** Performance actor identity.

Recommended display names should make the synthetic nature obvious, for example `Paradise Store Review` and `Paradise Store Review Issuer`.

Do not reuse a real employee ID, email, route, customer, lead, appointment, compensation record, or production auth account.

## Data boundary

The connected project `taxlrlfsobtnbasjcnuf` is the same isolated non-production project already used by the native-store integration. A read-only live check immediately before this tranche found zero:

- Auth users;
- Performance employees;
- actor identities;
- devices;
- enrollment tokens;
- shifts;
- events;
- location points;
- Sets;
- commissions.

Provisioning the review fixture is a separate controlled action after code validation. It must be read back after creation.

## Required validation before merge

- review-access contract tests PASS;
- enrollment/stale-session security validator PASS;
- reusable review user remains outside `performance_actor_identities` by design;
- review function cannot select arbitrary employees;
- temporary review client remains non-persistent;
- sign-out occurs on successful and failed post-sign-in flows;
- normal trusted-device redemption remains the only path to the ongoing employee session;
- native Performance bundle compiles with the review UI;
- native store iOS/Android Release candidates compile;
- full public field/offline/University/device/adversarial regression remains GREEN;
- exact diff / zero-behind / merge-tree readback before merge.

## Provisioning gate

**NOT YET AUTHORIZED BY MERGE STATUS.**

After exact-head code validation, the isolated project may be provisioned with synthetic review identities and the new Edge Function for deployed transport testing. The reusable password must be generated/stored outside GitHub and outside the Drive working package, then entered only in the Apple/Google review consoles or another approved secret-delivery channel.

Do not provision production employee data. Do not create a reusable enrollment token. Do not deploy this function to an unrelated Supabase project.

## Release boundary

Passing this tranche does not mean App Store Connect or Google Play review access is operational until all of the following are true:

- the Edge Function is deployed to the isolated project;
- the synthetic issuer/reviewer fixtures and review-gate Auth user exist;
- reusable credentials are stored in the actual review consoles;
- end-to-end login → fresh one-time enrollment → trusted-device redemption is tested against the deployed isolated backend;
- final signed-binary review instructions are updated;
- explicit store submission authorization is later granted.
