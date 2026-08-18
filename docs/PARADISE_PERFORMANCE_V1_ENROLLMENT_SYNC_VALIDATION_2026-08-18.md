# Paradise Performance v1 — Enrollment, Sync & Native Bridge Validation

Status: **ISOLATED NON-PRODUCTION IMPLEMENTATION VALIDATED — NOT PRODUCTION AUTHORIZED**  
Date: 2026-08-18  
Branch: `agent/paradise-performance-v1`  
Draft PR: #4 — `Paradise Performance v1 foundation`  
Non-production backend: `Canvass Project` (`taxlrlfsobtnbasjcnuf`)

## Executive disposition

The trusted-device enrollment/session foundation, revocation-aware shared-read model, offline replay queue, and shared native shift-location bridge are implemented and machine-validated at the current isolated stage.

**Disposition: PASS FOR THE NEXT ISOLATED IMPLEMENTATION SLICE.**

This is not a production-release determination. Actual Swift/iOS and Android background-location implementations, production-native secure token storage, physical-device lifecycle testing, and authenticated HTTP Edge invocation remain outside this validation boundary.

## 1. Employee identity experience

The employee-facing design remains account-light:

- no employee-visible email/password registration;
- manager/admin creates a short-lived one-time enrollment QR;
- the QR contains a high-entropy one-time token;
- the database stores only the SHA-256 token hash and a short non-secret prefix;
- redemption creates a hidden per-device Supabase Auth identity;
- the device receives a normal access/refresh session;
- native production storage for refresh tokens is required to use OS-protected secure storage;
- a cleared/revoked device is re-enrolled by manager QR rather than by employee password-reset flow.

The hidden generated email/password used internally to create the Supabase Auth device identity is never included in the successful enrollment response.

## 2. Enrollment database controls

Controlled repository migrations:

- `20260818084500_paradise_performance_v1_device_enrollment.sql`
- `20260818090000_paradise_performance_v1_enrollment_advisor_hardening.sql`
- `20260818091500_paradise_performance_v1_read_session_hardening.sql`

Key controls:

- one unique `device_public_id` per enrolled device;
- one Auth identity per enrolled device;
- token table is RLS-enabled and inaccessible to `anon` / `authenticated` clients;
- token plaintext is not stored;
- final enrollment is completed by a server-only atomic database function;
- device revocation is completed by a server-only database function;
- current employee role derives from the authoritative employee row rather than stale client metadata;
- role/activity changes therefore do not depend on a JWT refresh before Performance authorization changes.

## 3. Revocation / stale-JWT hardening

A live adversarial pass identified a material issue in the earlier shared-read design: policies using unconditional `USING (true)` would have allowed any generic Supabase `authenticated` identity, including a revoked Performance device until JWT expiry, to continue reading shared Performance rows.

This was classified as a real security blocker and closed before this stage was marked green.

Current shared-read rule:

- employee-list shared visibility requires a current non-revoked Performance actor identity;
- all other shared Performance read policies require a currently resolvable active Performance employee;
- a generic authenticated Supabase identity with no Performance mapping gets no Performance team rows;
- revoking the actor mapping removes shared Performance reads immediately, even if the underlying user JWT has not yet expired.

### Live database proof

Synthetic, non-real identities were used to exercise RLS directly.

**Enrolled synthetic canvasser:**

- current employee resolved correctly;
- current role resolved as canvasser;
- shared employee/device Performance data was visible as designed.

**Generic authenticated synthetic stranger:**

- current Performance employee: null;
- current Performance role: null;
- visible employees: 0;
- visible devices: 0;
- visible Sets: 0.

**Same synthetic canvasser identity after device/actor revocation:**

- current Performance employee: null;
- current Performance role: null;
- visible employees: 0;
- visible devices: 0;
- visible Sets: 0.

This proves that a still-authenticated/replayable user JWT does not preserve Performance data access after Performance device revocation.

## 4. Enrollment privilege proof

Live Postgres privilege readback confirmed:

- `authenticated` may not SELECT the enrollment-token table;
- `authenticated` may read safe device metadata such as `device_public_id`;
- `authenticated` may not read a device's internal `auth_user_id`;
- `authenticated` may not execute the enrollment finalizer;
- `service_role` may execute the enrollment finalizer;
- `authenticated` may not execute the device-revocation database function;
- `service_role` may execute the device-revocation database function.

No database secret/service-role/secret API key is committed to or expected in a client bundle.

## 5. Edge Function architecture

Deployed non-production Edge Functions:

- `performance-enrollment-mint`
- `performance-enrollment-redeem`
- `performance-device-revoke`

All three were compiled and deployed to ACTIVE status.

### Final JWT verification modes

The final modes intentionally differ by caller type:

| Function | `verify_jwt` | Reason |
|---|---:|---|
| `performance-enrollment-mint` | `true` | Called only by a signed-in manager/admin user. Platform validates the user session JWT first; handler independently validates `auth.getUser()` plus current Performance role. |
| `performance-enrollment-redeem` | `false` | No user identity exists yet. The high-entropy short-lived one-time QR token is the enrollment credential; handler/database enforce token validity and single use. |
| `performance-device-revoke` | `true` | Called only by a signed-in manager/admin user. Platform JWT precheck is followed by handler current-Performance-role validation. |

This configuration matches the specific Supabase Authorization-header model for requests that carry a real signed-in user JWT in `Authorization` and the API key separately as `apikey`.

### Handler authorization

Protected manager endpoints do not rely on the platform check alone. They also:

1. parse the user access JWT;
2. call Supabase Auth `getUser()`;
3. resolve the current active Performance employee;
4. resolve the current authoritative Performance role;
5. require manager/admin where appropriate.

Thus removal/revocation of the Performance mapping fails closed even if the user JWT itself is still within its normal expiry window.

## 6. Edge HTTP integration boundary

The functions are compiled, deployed, and ACTIVE in the connected non-production project.

A full authenticated HTTP invocation could not be exercised from the available execution container because that environment could not resolve the Supabase project hostname. The Supabase connector available in this workflow can deploy/read/log Edge Functions but does not expose a direct authenticated function-invocation action.

Therefore:

- **Edge deployment/compile status: PASS**
- **database/RLS authorization behavior: PASS**
- **Edge source/static contract: PASS**
- **actual external HTTP POST enrollment flow: NOT YET PROVEN in this tool environment**

This limitation must remain open until native/runtime integration testing can issue real function requests. No result in this record should be interpreted as a passed physical-device enrollment flow.

## 7. Offline sync queue

Implemented:

- `performance/client/performance-sync.mjs`
- current contract: `2026.08.18-performance-sync-v2`

Hard invariants:

- each field write receives a stable client UUID before network submission;
- retry never changes the client UUID;
- retry never changes the original device `capturedAt` timestamp;
- SQL duplicate/idempotency rejection is treated as a successful replay acknowledgment rather than creating a second record;
- authentication/RLS failure moves the record to `AUTH_BLOCKED` and stops later replay;
- `AUTH_BLOCKED` data is preserved rather than silently discarded;
- permanent non-auth 4xx rejection becomes `REJECTED` and is not automatically retried forever;
- transient/network failures remain `PENDING` with bounded exponential backoff;
- replay order is by original captured time;
- Lookup remains independent and usable when the Performance queue is offline/blocked.

### Regression defects closed during implementation

Two subtle queue defects were caught before live employee use:

1. terminal `AUTH_BLOCKED` / `REJECTED` rows could have been reconsidered on every flush;
2. the in-memory queue cloning implementation passed `Array.map`'s index into `structuredClone`.

Both were corrected and locked by tests.

## 8. Trusted-device client session

Implemented:

- `performance/client/performance-session.mjs`

Machine-tested behaviors:

- enrollment response is handed directly to Supabase `auth.setSession()`;
- startup verifies both Supabase Auth and current Performance employee/role mapping;
- revoked/unmapped session becomes `REVOKED_OR_UNENROLLED` and is locally signed out;
- no employee password-reset UX is required;
- production native refresh-token persistence requires an OS-protected storage adapter.

Native secure-storage implementation is still an implementation requirement; the current module defines/enforces the contract but does not claim Keychain/Keystore physical validation.

## 9. Shared native location bridge

Implemented:

- `performance/native/performance-location-contract.mjs`
- `performance/native/capacitor-location-bridge.mjs`

The shared orchestration is cross-platform and designed for a Capacitor native plugin implementation on iOS and Android.

Machine-tested behavior:

- tracking cannot start without an explicit `Start My Day` user action;
- one bridge instance binds to one active shift;
- duplicate start for the same shift is idempotent;
- a different shift cannot silently take over an active tracking session;
- permission denied creates `PERMISSION_REQUIRED` and does not start tracking;
- approximate location is represented as `LIMITED`, not precise;
- app relaunch may attach to a native session only when that same shift is already active;
- app relaunch does not invent/restart a location session when the native layer reports none;
- `captureNow()` enters the same offline/idempotent queue path;
- each native location keeps the original native timestamp and a stable client point UUID;
- Finish Day removes listeners and stops native tracking;
- if the app has no active shift but finds orphan native tracking, it force-stops it.

This shared bridge is not a claim that iOS Core Location or Android foreground-service background tracking has been physically implemented or accepted yet. Those platform layers remain the next native implementation stage.

## 10. Database advisor status

Final non-production advisor readback after this slice:

- **Security advisor: 0 lints**
- Performance advisor: only expected `unused_index` INFO notices on an empty/no-workload database.

At final readback the only unused-index notices were for:

- `performance_enrollment_tokens_expires_idx`
- `performance_shifts_territory_id_idx`

No security warning or missing-FK-index warning remains.

## 11. Migration ledger reconciliation

The non-production migration ledger temporarily contained two identical history entries for `paradise_performance_v1_device_enrollment`.

The stored SQL MD5 for both entries was identical:

`7e3c23cfc5781ef979d02084518264a3`

The migration itself was idempotent and therefore did not create duplicate schema objects, but duplicate history was not accepted as a clean control state. The later duplicate history row was removed after hash equality was verified.

Final ledger contains one enrollment migration and eight unique Performance migrations total through `paradise_performance_v1_read_session_hardening`.

## 12. Synthetic-data cleanup

All synthetic enrollment/security test data was removed.

Final live readback:

- Auth users: **0**
- Performance employees: **0**
- actor identities: **0**
- devices: **0**
- enrollment tokens: **0**
- shifts: **0**
- Sets: **0**
- location points: **0**
- commissions: **0**

No real Paradise employee, customer, KPI, territory, CRM, compensation, or production data was introduced.

## 13. GitHub machine gate

The reconciled implementation head before this validation-record commit was:

`7c0cf0d48926d12d3bce1ccdf9a706120735ccb2`

GitHub Actions run:

`32139742059` — `Validate Paradise Performance foundation`

Result: **COMPLETED / SUCCESS**

Passed stages:

1. Static foundation controls
2. Enrollment and stale-session controls
3. Performance contract tests

The gate includes the offline replay/session regressions and shared native-location bridge tests.

A new exact-head run is expected after this validation record is committed because the workflow watches Performance validation documentation.

## 14. Hard boundaries preserved

Nothing in this slice changes or authorizes:

- the controlled **78 jurisdictions / 76 GO / 2 NO-GO** field baseline;
- live municipality Lookup authority;
- current exact canvass opener approval status;
- Paradise University certification authority;
- manager-assigned-training exclusion;
- production/public/validated branches;
- any numeric KPI standard;
- any pay-plan value;
- real employee enrollment;
- real customer data;
- physical iOS/Android acceptance;
- production background GPS.

GPS remains operational/performance evidence only. It cannot independently authorize canvassing or reinterpret controlled Lookup instructions.

## Final conclusion

**Enrollment/session + offline sync + shared native bridge foundation: GREEN at the isolated machine/non-production level.**

The next implementation slice should build the actual platform-native location plugins and secure session storage:

- iOS Core Location background implementation + Keychain-backed session storage;
- Android foreground location service + Keystore-backed session storage;
- real device lifecycle/restart/background tests;
- actual authenticated Edge HTTP enrollment/revocation invocation from the app runtime;
- then the first visible Performance UI shell.

No production promotion is authorized by this record.
