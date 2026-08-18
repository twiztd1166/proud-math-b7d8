# Paradise Performance v1 — Trusted Device, Sync, Read-Session & Native-Adapter Validation

Status: **NON-PRODUCTION IMPLEMENTATION SLICE VALIDATED WITH ONE EXPLICIT TRANSPORT/DEVICE GATE REMAINING**  
Date: 2026-08-18  
Repository: `twiztd1166/proud-math-b7d8`  
Branch: `agent/paradise-performance-v1`  
Draft PR: #4 — open, draft, unmerged  
Supabase project: `Canvass Project` (`taxlrlfsobtnbasjcnuf`)  
Implementation source head before this validation-record commit: `b028c063ee8bd20cb2b468045f9cff1f1ffbbcd3`

## Scope

This record closes the current non-production implementation slice for:

- trusted-device employee enrollment without a visible employee email/password flow;
- short-lived one-time manager enrollment QR/token handling;
- hidden Supabase Auth device credential creation and normal access/refresh session handoff;
- immediate Performance RLS revocation plus Auth refresh/sign-in blocking on device revoke;
- offline/idempotent Performance write queuing and replay handling;
- stale-session/shared-read hardening;
- first Capacitor/native location adapter wiring contract;
- live non-production schema/function/advisor readback.

It does **not** authorize production release, merge PR #4, activate a visible Performance tab, activate real employee tracking, define numeric KPI standards, define compensation rules, or change the controlled field Lookup baseline.

## Controlled source state

The current PR contains eight controlled Performance migration files:

1. `20260818072700_paradise_performance_v1_foundation.sql`
2. `20260818074500_paradise_performance_v1_rls_hardening.sql`
3. `20260818080000_paradise_performance_v1_security_hardening.sql`
4. `20260818081500_paradise_performance_v1_advisor_hardening.sql`
5. `20260818083000_paradise_performance_v1_index_hardening.sql`
6. `20260818084500_paradise_performance_v1_device_enrollment.sql`
7. `20260818090000_paradise_performance_v1_enrollment_advisor_hardening.sql`
8. `20260818091500_paradise_performance_v1_read_session_hardening.sql`

The trusted-device/client/native implementation also includes:

- `performance/client/performance-session.mjs`
- `performance/client/performance-sync.mjs`
- `performance/native/performance-location-contract.mjs`
- `performance/native/capacitor-location-bridge.mjs`
- three Edge Functions plus `_shared/performance-auth.ts`
- enrollment/session/sync/native adapter contract tests
- static enrollment-security and foundation validators.

## Live migration-history reconciliation

The live non-production Supabase migration table currently contains **9 migration records** for these **8 logical controlled migration layers**.

The reason is preserved explicitly: `paradise_performance_v1_device_enrollment` was applied twice under two different generated remote migration versions:

- `20260818122948`
- `20260818123057`

The migration is written with idempotent table/column/index/function operations, and the second application did not create a second logical schema layer or duplicate application data. The duplicate history row is therefore classified as a **non-production migration-history artifact**, not a schema defect. Migration history was not manually rewritten to hide it.

The later live `paradise_performance_v1_read_session_hardening` migration is legitimate and is source-locked in the branch as `20260818091500_paradise_performance_v1_read_session_hardening.sql`.

## Trusted-device enrollment security model

### Employee experience

Employees do not need to know or manage a Supabase email/password. A manager-authorized flow mints a short-lived, one-time enrollment token/QR for an active employee. The device redeems that token and receives a normal Supabase user session.

### Token storage

Only a SHA-256 token hash is stored in `performance_enrollment_tokens`. There is no plaintext enrollment-token column. The token is single-use, expiration-bound, and row-locked during final redemption.

### Hidden Auth credential

The redeem Edge Function creates a hidden device Auth user and high-entropy password server-side. The password is used only to create the Supabase session and is not returned to the client. The client receives the access token, refresh token, expiry, employee identity, and device identity needed for normal session handoff.

### Immediate device revocation

Device revocation first marks the authoritative Performance actor mapping revoked. RLS therefore stops resolving the employee identity immediately, independent of the remaining lifetime of an already-issued access JWT. The hidden Auth user is then banned to block later refresh/sign-in.

## Edge Function live deployment readback

All three functions are ACTIVE in the isolated Canvass Project and were redeployed from the repository source used by this PR.

Final controlled auth-mode readback:

| Function | Live version | `verify_jwt` | Intended authority |
|---|---:|---:|---|
| `performance-enrollment-mint` | 5 | `true` | Supabase JWT + handler manager/admin verification |
| `performance-enrollment-redeem` | 3 | `false` | short-lived, high-entropy, single-use enrollment token; no prior employee session exists |
| `performance-device-revoke` | 3 | `true` | Supabase JWT + handler manager/admin verification |

During reconciliation, a newer mint deployment briefly appeared with `verify_jwt=false` after an earlier `true` deployment. That live/source drift was treated as a real control issue. Mint was redeployed again after the deployment queue settled; final independent readback is version 5 with `verify_jwt=true`. Source `supabase/config.toml` also locks the intended `true / false / true` pattern.

The public redeem function remains intentionally `verify_jwt=false`; its one-time enrollment secret is the enrollment credential and its handler validates the token/hash/lifetime/use state before privileged enrollment work.

## Read-session hardening

Shared Performance visibility now means **all currently enrolled Paradise Performance actors**, not every generic account carrying Supabase's `authenticated` role.

The read-session migration:

- gates `performance_employees` shared reads through a non-revoked actor identity;
- gates the remaining shared Performance read policies through a current Performance employee identity;
- therefore removes team-read access after device/actor revocation and blocks unrelated authenticated Supabase users.

### Live generic-authenticated test

A synthetic employee row was inserted inside a transaction, then the transaction switched to the `authenticated` role with a simulated valid UUID in `auth.uid()` but **no Performance actor mapping**.

Result:

- simulated `auth.uid()` resolved correctly;
- visible `performance_employees` rows: **0**.

The transaction was rolled back. No test row persisted.

**Disposition: PASS.** Generic authentication alone does not grant team Performance visibility.

## Offline/sync behavior

The client sync layer preserves field work across connectivity and session problems:

- a client write gets one stable UUID and keeps it across retries;
- original `capturedAt` is preserved instead of being replaced with retry/server time;
- duplicate-key replay is treated as an acknowledgment rather than a second write;
- transient failures remain queued with bounded exponential backoff;
- `AUTH_BLOCKED` stops replay rather than silently discarding field work;
- terminal `REJECTED`/`AUTH_BLOCKED` rows do not automatically retry forever;
- Lookup remains usable if Performance sync is offline or blocked.

Contract tests cover these invariants.

## Native location adapter status

The branch now includes the first `CapacitorPerformanceLocationBridge` adapter layer. It:

- starts native tracking only from an explicit visible `Start My Day` action;
- binds one adapter instance to one active shift;
- can reattach after app relaunch only when the native plugin already reports that exact shift active;
- never silently invents/start a new shift on launch;
- forces native tracking stopped when no active shift exists;
- normalizes each GPS sample and queues it through the same idempotent offline sync path;
- preserves device `capturedAt` timestamps;
- uses a stable client UUID for each queued GPS point;
- exposes denied/approximate permission states rather than silently pretending precise tracking;
- detaches listeners and stops native tracking on Finish Day;
- never allows GPS to authorize or reinterpret live field Lookup.

This is adapter/contract implementation only. The actual iOS Core Location / Android foreground-background plugin/runtime and physical locked-screen device behavior remain separate validation work.

## Machine validation

Implementation source head before this record:

`b028c063ee8bd20cb2b468045f9cff1f1ffbbcd3`

GitHub Actions run:

`32139223629`

Workflow: `Validate Paradise Performance foundation`  
Job: `Paradise Performance foundation`  
Result: **COMPLETED / SUCCESS**

All three substantive gates passed:

1. Static foundation controls — PASS
2. Enrollment and stale-session controls — PASS
3. Performance contract tests — PASS

The validators cover the eight controlled migration files, current-key Edge auth model, `true / false / true` function config, hidden-password non-return invariant, trusted session handoff, stale-session read gates, offline replay semantics, and native adapter invariants.

## Supabase advisors

Final security advisor readback:

**0 security lints.**

Final performance advisor readback contains only two `unused_index` INFO notices on the empty non-production database:

- `performance_enrollment_tokens_expires_idx`
- `performance_shifts_territory_id_idx`

No missing-FK-index warning or RLS warning remains. These two INFO notices are expected before a real workload has exercised the indexes and are not classified as defects at this stage.

Supabase reference for the unused-index advisor: `https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index`

## Final zero-data readback

After all synthetic fixtures and prior skipped-state test records were removed, the isolated project read back:

- Performance employees: **0**
- Performance actor identities: **0**
- Performance devices: **0**
- enrollment tokens: **0**
- shifts: **0**
- events: **0**
- location points: **0**
- Sets: **0**
- outcomes: **0**
- commissions: **0**
- Auth users: **0**
- Auth sessions: **0**
- Auth refresh tokens: **0**

No real employee, customer, KPI-standard, pay-plan, territory, CRM, or production data was added.

## Explicit remaining validation gates

### 1. Edge HTTP transport end-to-end invocation

The connected tool environment can deploy/list/read Edge Functions but does not expose a direct Edge Function invoke action, arbitrary outbound HTTP POST from the execution container could not resolve the project endpoint, and the project did not have a database HTTP extension enabled for an internal workaround.

Therefore this record does **not** claim a live HTTP `mint → redeem → revoke` round trip through the deployed public function endpoints. Deployment/source/auth-mode state and underlying database/RLS behavior are validated; transport-level invocation remains a non-production gate.

### 2. Physical native background-location validation

No physical iPhone or Android device test has yet proven locked-screen/background location continuity, OS permission transitions, battery behavior, process death/relaunch behavior, or Finish Day shutdown against a real native plugin implementation.

### 3. Production authorization

No production/public/validated ref is moved by this work. PR #4 remains draft and unmerged.

## Hard boundaries preserved

This slice does not change:

- the controlled **78 jurisdictions / 76 GO / 2 NO-GO** field baseline;
- live Paradise Lookup authority;
- exact canvass opener approval status;
- Paradise University certification authority;
- manager-assigned-training exclusion;
- numeric KPI thresholds;
- compensation/pay-plan values;
- production/public/validated branches.

## Disposition

**TRUSTED-DEVICE / OFFLINE-SYNC / READ-SESSION / NATIVE-ADAPTER FOUNDATION: MACHINE GREEN, LIVE NON-PRODUCTION BACKEND GREEN, WITH EDGE-TRANSPORT AND PHYSICAL-NATIVE VALIDATION STILL OPEN.**

The next safe implementation slice is to wire the native iOS/Android plugin runtime and Performance shift UI to these already-controlled contracts, then perform device/background/location and deployed-function transport validation before considering any production authorization.
