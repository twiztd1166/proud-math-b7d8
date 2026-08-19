# Paradise Performance v1 — Baseline Reporting Validation

Status: **PASS — NON-PRODUCTION REPORTING / KPI-VERSION FOUNDATION MACHINE GREEN — PHYSICAL DEVICE ACCEPTANCE STILL OPEN**  
Date: 2026-08-19  
Repository: `twiztd1166/proud-math-b7d8`  
Branch: `agent/paradise-performance-baseline-v1`  
Draft PR: #20 — open, draft, unmerged  
Implementation head validated before this record commit: `bf753c9fbe3a462819c71d13c1658092e575588c`  
PR base: `agent/paradise-performance-device-acceptance-v1` at `0a246a16a62a61ab17951dafe285ab26df47a210`

## Scope

This slice adds the first authoritative Performance reporting interpretation layer without inserting Paradise business thresholds, pay rules, roster data, customer data, territory data, or CRM mappings.

It covers:

- daily, weekly, monthly, rolling 60-day, rolling 90-day, and YTD reporting-window mechanics;
- Eastern Time local-calendar attribution for current Florida operations;
- current/selected periods bounded to the selected local `as-of` day so future-dated records later in a week/month cannot leak into the result;
- origin-cohort attribution so downstream demos/sales stay attached to the Set/work period that generated them;
- pending-outcome maturity handling;
- explicit exclusion of cancelled / not-eligible outcomes rather than treating them as failed mature outcomes;
- data-quality signaling for inconsistent outcome states and bad/stale shift timing;
- historical KPI classification from the shift-pinned KPI standard version;
- effective-dated KPI-standard resolution that fails closed on overlapping active scope rules;
- provisional leaderboard behavior that refuses to create an official rank until Paradise configures eligibility requirements;
- KPI-version grouping schema hardening so one pinned version label can contain all four KPI metric rows.

## No invented business policy

Two initially tempting defaults are deliberately not adopted:

1. **Week start:** the controlling Performance specification requires weekly reporting but does not define whether Paradise's week begins Sunday, Monday, or another day. Weekly reporting therefore requires an explicit `weekStartsOn` configuration and fails closed while it is absent.
2. **KPI scope precedence:** role/office/team fields exist, but no approved precedence hierarchy is defined. If multiple active KPI rules match the same metric/scope/time, resolution fails as ambiguous instead of silently preferring a team, office, role, or generic rule.

No numeric Knocks/Hr, Sets/Hr, Demos/Hr, Sales/Hr, Above Standard, leaderboard minimum-hours, leaderboard minimum-opportunities, Overall Score, or compensation values are set by this slice.

## KPI-version schema defect closed

The original foundation declared:

`version_label text not null unique`

while each KPI row also carries one `metric_key`. Because shifts pin only one `kpi_standard_version_label`, that uniqueness rule could not represent all four KPI metrics under one historical version label.

The isolated non-production Supabase project now contains migration:

`20260819100325 paradise_performance_v1_kpi_version_grouping`

The repository source is locked at:

`supabase/migrations/20260819100325_paradise_performance_v1_kpi_version_grouping.sql`

The migration removes single-column `UNIQUE(version_label)` and replaces it with:

`UNIQUE(version_label, metric_key)`

No KPI rows or numeric standards are seeded.

### Live isolated readback

Project: `Canvass Project` (`taxlrlfsobtnbasjcnuf`)

Final constraint readback:

- `performance_kpi_standard_versions_pkey` — `PRIMARY KEY (id)`
- `performance_kpi_standard_versions_version_metric_key` — `UNIQUE (version_label, metric_key)`
- old `performance_kpi_standard_versions_version_label_key` — absent

A transaction inserted the same synthetic version label across all four allowed metrics (`knocks_per_hour`, `sets_per_hour`, `demos_per_hour`, `sales_per_hour`) and then rolled back successfully.

Post-rollback KPI-standard row count: **0**.

No employee, customer, Set, outcome, KPI threshold, pay-plan, territory, or production record was added.

## Reporting semantics validated

### Missing values

`null`, `undefined`, and blank strings are not coerced into numeric zero. Missing source evidence therefore cannot masquerade as an actual zero result.

### Zero denominators

Zero denominator remains `N/A` / `null`, never infinity or a fabricated rate.

### Outcome maturity

- `pending` does not count as a mature failure;
- `demoed` / `no_demo` form the mature Set denominator;
- a demo becomes sale-eligible only when its sale outcome is explicitly mature (`sold` / `not_sold`);
- `cancelled` / `not_eligible` are separately excluded and surfaced;
- inconsistent states such as `sold` without `demoed` are preserved as raw outcome truth but generate a data-quality issue instead of silently altering source evidence.

### Origin cohort

A later demo or sale remains attributed to the Set/work period that generated it. A sale occurring on a later day does not get divided by that later day's unrelated new canvassing hours.

### Shift timing

- current-day active/paused/finishing shifts may accrue hours through the selected `as-of` instant;
- a stale historical shift with no finish timestamp does not receive fabricated elapsed hours;
- actual timestamp elapsed time is used across DST transitions;
- invalid timing/break conditions are surfaced as data issues.

### Historical standards

Historical reporting uses the KPI version label pinned to the source shift. A newer KPI standard is not silently substituted into historical results. Mixed pinned versions block a single classification rather than rewriting history.

## Focused local regression result

The focused math / reporting / KPI-migration suite ran under Node 22 and completed:

**27 tests / 27 PASS / 0 FAIL**

Coverage includes:

- missing-vs-zero semantics;
- denominator behavior;
- KPI math;
- unconfigured standards;
- unconfigured leaderboard eligibility;
- Eastern Time date boundaries;
- rolling 60D / 90D windows;
- explicit weekly boundary configuration;
- future-dated current-period exclusion;
- origin-cohort sales attribution;
- pending and excluded outcomes;
- inconsistent outcome data-quality flags;
- active vs stale unfinished shifts;
- DST elapsed time;
- ambiguous KPI scope failure;
- pinned historical standard selection;
- provisional leaderboard ranking;
- source-locked KPI-version grouping migration.

## GitHub Actions result on exact implementation head

Exact validated implementation head:

`bf753c9fbe3a462819c71d13c1658092e575588c`

### Validate Paradise Performance foundation

Run `32241222569` — **COMPLETED / SUCCESS**

- Static foundation controls — PASS
- Enrollment and stale-session controls — PASS
- Performance contract tests — PASS

### Validate Paradise Performance native shell

Run `32241222566` — **COMPLETED / SUCCESS**

- iOS native shell compile — PASS
- Android native shell compile — PASS

### Validate Paradise Performance device acceptance

Run `32241222572` — **COMPLETED / SUCCESS**

- Acceptance contracts and isolation — PASS
- Android physical-acceptance APK build/package pipeline — PASS
- iOS acceptance simulator/generic-device build/package pipeline — PASS

This workflow success proves the controlled acceptance artifacts can be built and packaged. It **does not** convert the real-device hardware test plan into a physical PASS.

## Supabase advisor result

After the KPI-version migration and rollback probe:

- Security Advisor: **0 lints**
- Performance Advisor: one `INFO` only — unused `performance_shifts_territory_id_idx`

That index remains in place. An unused-index INFO on the zero-workload isolated environment is not evidence that the territory index is unnecessary in production.

## Hard boundaries preserved

This slice does not change or authorize changes to:

- validated field release control;
- **78 jurisdictions / 76 GO / 2 NO-GO**;
- live Paradise Lookup authority;
- municipality instructions or hours;
- Paradise University authority/content;
- Layer 3;
- real employees/customers;
- KPI numeric standards;
- compensation/pay rules;
- CRM/LeadPerfection mapping;
- territory geometry;
- Cloudflare deployment;
- production/public/validated refs.

Draft PR #20 remains open, draft, mergeable, and unmerged.

## Remaining release gate

Physical mobile acceptance remains **OPEN / NOT PASS** until the controlled acceptance plan is actually executed on at least:

- one real iPhone; and
- one real Android phone.

Required real-device evidence still includes locked/background movement, native durable spool recovery, network-loss replay, device revocation behavior, Finish Day tracking shutdown, off-shift no-location behavior, protected credential persistence, and uninstall/reinstall re-enrollment.

## Disposition

**PARADISE PERFORMANCE V1 BASELINE REPORTING / KPI-VERSION SLICE: MACHINE GREEN IN ISOLATED NON-PRODUCTION STATE.**

**PHYSICAL DEVICE ACCEPTANCE: STILL OPEN.**

**PRODUCTION AUTHORIZATION: NONE.**
