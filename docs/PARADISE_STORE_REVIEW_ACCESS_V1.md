# Paradise Performance v1 — Store Review Access

Status: **ISOLATED REVIEW-ACCESS CANDIDATE / FUNCTION DEPLOYED / SYNTHETIC EMPLOYEES PROVISIONED / AUTH REVIEW USER PENDING / NOT SUBMITTED**

Date: 2026-08-19

Stable validated application entering this tranche: `8a096f0eebc8657efbf26bf440341c95d56e3b2f`.

Public metadata head entering this tranche: `8eedcad72a747bd4bd7d6fa216117714a2c624bc`.

## Problem being solved

Paradise's ordinary trusted-device enrollment uses a manager-issued high-entropy one-time code. That is correct for employees but is not a suitable reusable marketplace-review credential.

The store-review path must satisfy two controls at once:

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
- `performance_review_employee_id: 1f8af617-73ef-4b0d-a741-23c9f062077e`
- `performance_review_issuer_employee_id: fd669519-c21a-4d2f-8b98-d1a1eae24893`

No credential value belongs in this repository or the Drive working package.

## Edge Function — deployed isolated v1

`performance-review-enrollment-mint`

Deployed project: `taxlrlfsobtnbasjcnuf`

- deployment ID: `2a916318-1ead-4c8c-bf24-ea41306d0230`
- deployed version: `1`
- state: `ACTIVE`
- `verify_jwt = true`
- deployed bundle SHA-256: `dfeeed1e7e5f4ed3cf1185cbfdbae59f3cbc993f6ef33570a0b9d72f6339abd9`

The deployed source was read back after deployment and matches the controlled branch implementation.

Function controls:

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

## Synthetic review fixtures — provisioned

Two and only two synthetic Performance employees were created in the isolated project:

- issuer: `fd669519-c21a-4d2f-8b98-d1a1eae24893` — `Paradise Store Review Issuer` — `manager` — active;
- reviewer: `1f8af617-73ef-4b0d-a741-23c9f062077e` — `Paradise Store Review` — `canvasser` — active — manager points to the synthetic issuer.

Both are tagged in the isolated database with office/team `STORE_REVIEW_SYNTHETIC`.

No real employee ID, email, route, customer, lead, appointment, compensation record, or production auth account was reused.

## Live data boundary after deployment

Readback after function deployment and fixture provisioning:

- Auth users: `0`
- Performance employees: `2`
- actor identities: `0`
- devices: `0`
- enrollment tokens: `0`
- shifts: `0`
- events: `0`
- location points: `0`
- Sets: `0`
- commissions: `0`

This proves the deployed function + synthetic fixtures alone grant no ongoing app/Performance access.

Machine-readable deployment state:

`store/paradise-performance/store-review-access-v1.json`

## Auth review user — remaining provisioning blocker

The reusable Supabase Auth review-gate user has **not** been created.

The connected Supabase tool does not expose the supported `auth.admin.createUser()` operation, and this tranche will not bypass Supabase Auth administration by inserting/updating internal `auth.users` rows directly.

Required supported creation path:

- create one server-side/admin Auth user with reusable review email/password;
- email may be auto-confirmed through the supported Auth admin API;
- apply only the three controlled `app_metadata` fields listed above;
- do **not** create a `performance_actor_identities` row for that auth user;
- store the password only in Apple/Google review consoles or another approved secret channel, never GitHub/Drive.

Until that user exists, deployed end-to-end reviewer login cannot be truthfully marked PASS.

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
- deployed function/source/config readback PASS;
- deployed live boundary remains zero actor identities/devices/tokens before the Auth review user is created;
- exact diff / zero-behind / merge-tree readback before merge.

Deployed end-to-end reusable-login transport testing remains **BLOCKED_PENDING_REVIEW_GATE_AUTH_USER** and must be closed before store submission, even if this source tranche later merges.

## Release boundary

Passing source/CI validation does not mean App Store Connect or Google Play review access is operational until all of the following are true:

- the reusable review-gate Auth user exists through the supported admin path;
- reusable credentials are stored in the actual review consoles;
- the auth user has the exact approved app metadata and still has no Performance actor identity;
- end-to-end login → fresh one-time enrollment → trusted-device redemption is tested against the deployed isolated backend;
- final signed-binary review instructions are updated;
- explicit store submission authorization is later granted.
