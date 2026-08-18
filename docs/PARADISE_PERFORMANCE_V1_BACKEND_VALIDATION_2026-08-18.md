# Paradise Performance v1 — Non-Production Backend Validation

Status: **LIVE NON-PRODUCTION BACKEND FOUNDATION VALIDATED — NOT PRODUCTION AUTHORIZED**  
Date: 2026-08-18  
Git branch: `agent/paradise-performance-v1`  
Supabase project: `Canvass Project` (`taxlrlfsobtnbasjcnuf`)

## Scope

This record documents application and adversarial verification of the Paradise Performance v1 database foundation against the connected non-production Supabase project. It does not authorize production release, enable the visible Performance UI, enable native background location, define Paradise KPI numbers, define the Paradise pay plan, or alter the controlled municipality Lookup baseline.

## Pre-application state

Before schema application, the connected project was inspected and found to contain:

- 0 user-created public tables;
- 0 Supabase migration-history entries;
- 0 Auth users.

The project therefore provided an isolated clean backend target for the Performance foundation.

## Applied migrations

The following controlled migrations were applied successfully in order:

1. `paradise_performance_v1_foundation`
2. `paradise_performance_v1_rls_hardening`
3. `paradise_performance_v1_security_hardening`
4. `paradise_performance_v1_advisor_hardening`
5. `paradise_performance_v1_index_hardening`

The project migration history records all five.

## Advisor disposition

### Security advisor

Initial live advisor review correctly flagged externally executable `SECURITY DEFINER` authorization helpers. This was treated as a real blocker and closed before role testing.

Final state after hardening:

**Security advisor: 0 lints.**

Controls include:

- authorization helpers converted to `SECURITY INVOKER`;
- anon EXECUTE removed from helper functions;
- API-role CREATE on `public` remains revoked;
- authorization resolves from server-managed `performance_actor_identities`, not user-editable user metadata;
- correction resolution binds `resolved_by` to the actual current manager/admin employee identity.

### Performance advisor

The live advisor initially found:

- one `auth.uid()` initialization-plan warning on the actor self-read policy;
- multiple foreign keys without covering indexes.

These were closed by the index/RLS hardening migration.

Final remaining performance notices are only `unused_index` INFO items. The database contains no real Performance workload yet, so indexes have not had an opportunity to be used. These notices are expected at this stage and are not classified as defects.

## Disposable role-test fixtures

Synthetic, clearly non-real test fixtures were created temporarily for:

- canvasser 1;
- canvasser 2;
- manager;
- two test devices;
- two finished test shifts;
- two test Sets;
- two test GPS points;
- two test commission records;
- one test correction request.

No real employee, customer, KPI-standard, pay-plan, territory, CRM, or production data was inserted.

All disposable fixtures were removed after testing.

Post-cleanup readback:

- Auth users: **0**
- Performance employees: **0**
- Performance shifts: **0**
- Performance Sets: **0**
- Performance location points: **0**
- Performance commissions: **0**

## Live RLS / integrity test results

### Identity resolution

**PASS** — authenticated canvasser session resolves only to its mapped employee identity and role.

### Full Performance visibility parity

**PASS** — canvasser 1 could read all three employee rows and both employees' test Sets, GPS points, and commission records. This confirms shared Performance visibility while keeping auth-identity mapping itself self-scoped.

### Own in-shift GPS write

**PASS** — canvasser 1 could insert a GPS point against their own device/shift when `captured_at` was inside the original shift window.

### Cross-employee GPS attribution

**PASS / correctly blocked** — canvasser 1 could not insert a GPS point using canvasser 2's shift/device. Postgres returned row-level-security denial.

### Off-shift GPS backfill

**PASS / correctly blocked** — canvasser 1 could not attach a GPS point to their own historical shift when the point's `captured_at` was after the shift's `finished_at`.

### Cross-employee Set attribution

**PASS / correctly blocked** — canvasser 1 could not create a Set attributed to canvasser 2's shift.

### Cross-employee Set mutation

**PASS / correctly blocked** — canvasser 1's attempted UPDATE of canvasser 2's Set affected zero rows.

### Manager Set mutation

**PASS** — the manager session could update another employee's Set, proving visibility/mutation permissions differ by role as designed.

### Correction-resolution attribution

**PASS / correctly blocked** — manager could not resolve a correction request while naming canvasser 1 as `resolved_by`.

**PASS** — the same resolution succeeded when `resolved_by` matched the current manager employee identity.

### Anonymous helper access

**PASS / correctly blocked** — `anon` was denied EXECUTE on `performance_current_employee_id()`.

### Privileged KPI configuration mutation

**PASS / correctly blocked** — an authenticated canvasser was denied INSERT on `performance_kpi_standard_versions`. KPI configuration remains privileged/server-side.

### Client privilege audit

**PASS** — authenticated role readback confirmed:

- no DELETE on shifts;
- no UPDATE on append-only events;
- no UPDATE on append-only location points;
- no INSERT on authoritative commissions;
- no INSERT on finalized period snapshots;
- no anonymous helper execution;
- authenticated helper execution remains available for RLS evaluation.

### Event idempotency

**PASS / correctly blocked** — replaying the same `client_event_id` produced a unique-constraint rejection.

### One-open-shift invariant

**PASS / correctly blocked** — a second simultaneous open shift for the same employee produced a unique-index rejection.

## Hard boundaries preserved

This backend work does not change:

- the controlled **78 jurisdictions / 76 GO / 2 NO-GO** field baseline;
- live Lookup authority;
- the exact canvass opener status;
- Paradise University curriculum/certification authority;
- manager-assigned-training exclusion;
- any production/public/validated branch;
- any numeric KPI target;
- any compensation/pay-plan value.

GPS remains operational/performance evidence only and must never independently authorize canvassing or reinterpret controlled Lookup instructions.

## Disposition

**NON-PRODUCTION BACKEND FOUNDATION: PASS.**

The central Postgres/RLS foundation is ready for the next isolated implementation slice: authenticated enrollment/session APIs, client sync/offline queue integration, and actual native location bridge wiring. Those future layers require their own machine and device validation before any production authorization.