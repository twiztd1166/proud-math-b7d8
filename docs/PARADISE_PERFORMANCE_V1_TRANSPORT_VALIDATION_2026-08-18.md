# Paradise Performance v1 — Deployed Transport Validation

Status: **PASS — DEPLOYED HTTP ENROLLMENT / REVOCATION TRANSPORT PROVEN IN ISOLATED NON-PRODUCTION PROJECT**  
Date: 2026-08-18  
Project: isolated Canvass Supabase project (`taxlrlfsobtnbasjcnuf`)  
Production authorization: **NONE**

## Purpose

Close the previously open transport gate with a real deployed network sequence rather than a source-level or mocked function call.

The test exercised the deployed Supabase Auth service, deployed Edge Functions, trusted-device mapping RPCs, database authorization state, one-time enrollment semantics, and post-revocation authorization using disposable synthetic fixtures only.

No production/public/validated Paradise branch or ref was changed by this backend validation.

## Deployed functions under test

The isolated project reported the intended active deployment architecture immediately before the test:

- `performance-enrollment-mint` — ACTIVE v5 — platform JWT verification ON.
- `performance-enrollment-redeem` — ACTIVE v3 — platform JWT verification OFF because the short-lived one-time enrollment token is the pre-session credential.
- `performance-device-revoke` — ACTIVE v3 — platform JWT verification ON.

The checked repository handlers additionally enforce current Performance actor/role authorization on mint and revoke.

## Test architecture

A temporary Postgres `http` extension was enabled only in the isolated database so Postgres could act as an HTTPS client to the actual deployed `*.supabase.co/functions/v1/...` endpoints.

The extension was not added to repository migrations and was removed immediately after validation. Final migration history remained exactly eight Performance migration records.

To avoid introducing a visible manager password or privileged API secret, the test bootstrap used one directly seeded disposable enrollment-token record for a synthetic manager employee. That bootstrap token was committed to the database before the external request so the deployed redeem function could see it.

The deployed redeem endpoint then created the same hidden Auth user / trusted-device session used by the intended product architecture. That manager session became the credential for the actual transport chain below.

All returned access/session material stayed inside PL/pgSQL variables. The validation result exposed only HTTP status and boolean evidence; access and refresh tokens were not returned in the test readout and were not written to repository source.

## Real deployed sequence

### 1. Bootstrap manager device through deployed redeem

`performance-enrollment-redeem`

Result: **HTTP 200**

Validated effects:

- bootstrap enrollment token consumed;
- hidden Auth user created by deployed Edge code;
- manager actor identity created;
- manager device created;
- manager trusted-device access session returned to the test harness.

### 2. Actual manager-authenticated mint

`performance-enrollment-mint`

Credential: manager trusted-device access token returned by step 1.

Result: **HTTP 200**

Validated effects:

- deployed JWT gate accepted the manager session;
- handler `auth.getUser()` / current Performance identity resolution accepted the actor;
- manager role authorization passed;
- short-lived target enrollment token was created for the disposable canvasser.

### 3. Actual target redeem

`performance-enrollment-redeem`

Credential: newly minted one-time token from step 2.

Result: **HTTP 200**

Validated effects:

- target token consumed;
- hidden target Auth user created;
- target actor identity and device mapping finalized;
- target trusted-device access session created.

### 4. One-time-token replay control

The exact consumed target token was sent to deployed redeem a second time with a different device public ID.

Result: **HTTP 401**

Expected control: consumed enrollment token is unavailable for replay.

PASS.

### 5. Actual manager-authenticated revoke

`performance-device-revoke`

Credential: manager trusted-device access token from step 1.

Target: device created by step 3.

Result: **HTTP 200**

Response contract confirmed:

- `revoked = true`;
- `authBanPending = false`.

Database readback immediately confirmed:

- target actor identity `revoked_at` populated;
- target device `revoked_at` populated.

### 6. Stale target access after revoke

The same target access token that worked before revocation was sent to the protected deployed mint endpoint after step 5.

Result: **HTTP 401**

Expected control: revoked trusted-device session fails closed rather than retaining protected Performance access until normal JWT expiry.

PASS.

## Machine result

The transport probe returned:

- setup redeem status: `200`
- mint status: `200`
- target redeem status: `200`
- consumed-token replay status: `401`
- revoke status: `200`
- revoked target access status: `401`
- manager bootstrap token consumed: `true`
- target minted token consumed: `true`
- target actor revoked immediately: `true`
- target device revoked immediately: `true`
- error: `null`

## Cleanup / isolation readback

All disposable test rows and hidden Auth users were removed immediately after the assertions.

Final readback after cleanup:

- temporary `http` extension: **0 installed**
- Supabase migration history: **8** — unchanged
- Auth users: **0**
- Auth sessions: **0**
- Auth refresh tokens: **0**
- Performance employees: **0**
- Performance actor identities: **0**
- Performance devices: **0**
- Performance enrollment tokens: **0**
- Performance shifts: **0**
- Performance events: **0**
- Performance GPS points: **0**
- Performance Sets: **0**
- Performance outcomes: **0**
- Performance commissions: **0**

Supabase Security Advisor after cleanup: **0 lints**.

Performance Advisor after the live path was exercised: one expected `unused_index` INFO remains for `performance_shifts_territory_id_idx`. The earlier enrollment-token expiry unused-index notice disappeared because this transport validation exercised enrollment-token operations. No security warning or missing-index warning was introduced.

## Gate result

The previously open deployed transport gate is **CLOSED / PASS** for the tested architecture:

**bootstrap trusted manager device → manager-authenticated MINT → target REDEEM → replay rejected → manager-authenticated REVOKE → stale target access fails closed**.

The initial manager bootstrap is intentionally not characterized as the normal manager UX; it is a disposable test fixture used solely to obtain a valid manager trusted-device session without inventing a manager password or exposing a privileged API key. The actual gate under test begins with the manager-authenticated mint operation.

## Remaining release gate

This validation does **not** prove physical mobile behavior.

Still required before any release authorization:

- real iPhone locked-screen/background location test;
- real Android locked-screen/foreground-service location test;
- movement/location capture through background and relaunch;
- network loss/recovery and idempotent queued replay on device;
- Finish Day stopping native tracking;
- off-shift no-location proof;
- Keychain/Keystore persistence, refresh, revocation/sign-out cleanup, and reinstall behavior on physical devices.

No production promotion is authorized by this record.
