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

**Enrolled synthetic canvasser:** current employee and role resolved correctly and shared team Performance data was visible as designed.

**Generic authenticated synthetic stranger:** current Performance employee/role were null and visible employee/device/Set counts were all 0.

**Same synthetic canvasser identity after device/actor revocation:** current Performance employee/role were null and visible employee/device/Set counts were all 0.

This proves that a still-authenticated user JWT does not preserve Performance data access after Performance device revocation.

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

All three are ACTIVE.

### Final JWT verification modes

| Function | `verify_jwt` | Reason |
|---|---:|---|
| `performance-enrollment-mint` | `true` | Signed-in manager/admin only. Platform validates the user session JWT; handler also validates `auth.getUser()` and current Performance role. |
| `performance-enrollment-redeem` | `false` | No user session exists yet. The high-entropy, short-lived, one-time QR token is the enrollment credential. |
| `performance-device-revoke` | `true` | Signed-in manager/admin only. Platform JWT precheck plus handler current-role validation. |

This matches Supabase's specific Authorization-header model where a signed-in client sends its user JWT in `Authorization` and the application key separately in `apikey`.

Protected manager endpoints do not rely on the platform check alone: handler authorization also validates the Auth user, current active Performance employee, and current authoritative role.

## 6. Edge HTTP integration boundary

The functions are compiled, deployed, and ACTIVE in the connected non-production project.

A full authenticated HTTP invocation could not be exercised from the available execution container because that environment could not resolve the Supabase project hostname. The connected Supabase tool can deploy/read/log Edge Functions but does not expose a direct authenticated function-invocation action.

Therefore:

- **Edge deployment/compile status: PASS**
- **database/RLS authorization behavior: PASS**
- **Edge source/static contract: PASS**
- **actual external HTTP POST enrollment flow: NOT YET PROVEN in this tool environment**

This remains open for app-runtime/native integration validation. It is not represented as a passed physical-device enrollment flow.

## 7. Offline sync queue

Implemented `performance/client/performance-sync.mjs`, current contract `2026.08.18-performance-sync-v2`.

Hard invariants:

- stable client UUID before submission and across retries;
- original device `capturedAt` survives retries;
- duplicate DB rejection is treated as replay acknowledgment rather than duplication;
- auth/RLS failure becomes `AUTH_BLOCKED`, is preserved, and stops later replay;
- non-auth permanent 4xx becomes `REJECTED` and does not retry forever;
- transient failures remain `PENDING` with bounded backoff;
- replay is ordered by original captured time;
- Lookup remains independently usable when Performance is offline/blocked.

Two defects were caught and closed during implementation: terminal `AUTH_BLOCKED`/`REJECTED` rows no longer auto-retry each flush, and the in-memory queue no longer passes `Array.map` index arguments into `structuredClone`.

## 8. Trusted-device client session

Implemented `performance/client/performance-session.mjs`.

Machine-tested behavior:

- enrollment response hands access/refresh tokens to Supabase `auth.setSession()`;
- startup verifies both Supabase Auth and current Performance employee/role mapping;
- revoked/unmapped session becomes `REVOKED_OR_UNENROLLED` and is locally signed out;
- no employee password-reset UX is required;
- production native refresh-token persistence requires OS-protected secure storage.

Actual Keychain/Keystore implementation and physical validation remain open.

## 9. Shared native location bridge

Implemented:

- `performance/native/performance-location-contract.mjs`
- `performance/native/capacitor-location-bridge.mjs`

Machine-tested behavior:

- location cannot start without explicit `Start My Day` initiation;
- one bridge instance binds one active shift;
- same-shift duplicate start is idempotent;
- another shift cannot take over silently;
- denied permission yields `PERMISSION_REQUIRED` without tracking;
- approximate permission yields `LIMITED`;
- relaunch may attach only to the same already-active native shift;
- relaunch does not invent a location session;
- `captureNow()` uses the same idempotent offline queue;
- native device timestamp and stable client point UUID are preserved;
- Finish Day detaches listeners and stops native tracking;
- orphan native tracking is force-stopped when the app has no active shift.

Actual iOS Core Location and Android foreground-service plugin implementations remain the next native slice.

## 10. Database advisor status

Final non-production readback:

- **Security advisor: 0 lints**
- Performance advisor: only expected `unused_index` INFO notices on the empty/no-workload database.

At final readback the only notices were:

- `performance_enrollment_tokens_expires_idx`
- `performance_shifts_territory_id_idx`

No security warning or missing-FK-index warning remains.

## 11. Migration ledger reconciliation

The non-production migration ledger temporarily contained two identical history entries for `paradise_performance_v1_device_enrollment`.

Both stored SQL statements had the same MD5:

`7e3c23cfc5781ef979d02084518264a3`

The later duplicate history entry was removed only after equality was verified. Final readback contains **8 unique Performance migration records** and exactly **1** enrollment migration record.

## 12. Synthetic-data cleanup

Final live readback after all tests:

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

Final exact implementation/control head:

`36f33dbdf7cf3edd0244cd48dbafc401ca316e73`

GitHub Actions run:

`32140283722` — `Validate Paradise Performance foundation`

Result: **COMPLETED / SUCCESS**

Passed:

1. Static foundation controls
2. Enrollment and stale-session controls
3. Performance contract tests

## 14. Hard boundaries preserved

Nothing in this slice changes or authorizes:

- controlled **78 jurisdictions / 76 GO / 2 NO-GO** field baseline;
- live municipality Lookup authority;
- exact canvass opener approval status;
- Paradise University certification authority;
- manager-assigned-training exclusion;
- production/public/validated branches;
- numeric KPI standards;
- pay-plan values;
- real employee enrollment;
- real customer data;
- physical iOS/Android acceptance;
- production background GPS.

GPS remains operational/performance evidence only and cannot independently authorize canvassing or reinterpret controlled Lookup instructions.

## Final conclusion

**Enrollment/session + offline sync + shared native bridge foundation: GREEN at the isolated machine/non-production level.**

Next isolated slice:

- iOS Core Location background plugin + Keychain-backed session storage;
- Android foreground location service + Keystore-backed session storage;
- real device lifecycle/restart/background tests;
- authenticated Edge HTTP enrollment/revocation from the app runtime;
- then the first visible Performance UI shell.

No production promotion is authorized by this record.
