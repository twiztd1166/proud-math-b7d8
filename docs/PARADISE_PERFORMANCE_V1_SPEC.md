# Paradise Performance v1 — Controlled Specification

Status: **DESIGN LOCKED FOR IMPLEMENTATION — NOT IMPLEMENTED — NOT PRODUCTION AUTHORIZED**  
As of: 2026-08-18  
Working branch: `agent/paradise-university-v1`

## 1. Purpose

Paradise Performance v1 adds a central, multi-user field-performance system to the existing Paradise Canvass Manager / Paradise University product. It is designed to require almost no routine reporting work from a canvasser while still producing trustworthy daily, weekly, monthly, rolling 60-day, rolling 90-day, and year-to-date performance views; live shift GPS; route tracing; team visibility; customer/set attribution; downstream demo/sale attribution; compensation calculations; and leaderboards.

The employee experience must remain materially simpler than the data model beneath it.

### Primary employee loop

**START MY DAY → WORK → QUICK SET / + SET → FINISH DAY**

Everything that Paradise already knows, can calculate, can obtain from another company system, or can infer safely from authenticated device events must not be requested again from the canvasser.

## 2. Hard isolation boundaries

Performance is a new central-data subsystem. It must not redefine any existing field/legal/training authority.

1. The validated municipality baseline remains **78 jurisdictions / 76 GO / 2 NO-GO** unless changed through the existing controlled field-release process.
2. GPS may suggest an estimated jurisdiction or territory; it must never create, override, or reinterpret a GO / conditional / NO-GO field decision.
3. The live Paradise Lookup remains authoritative for field instructions.
4. Performance must not change the exact canvass opener, curriculum authority, certification authority, future-role authorization, or the manager-assigned-training exclusion.
5. Performance data outages must never block access to the controlled Lookup.
6. Performance implementation must occur on isolated development branches and may not advance public/validated production refs without the existing release gates and separate promotion authorization.

## 3. Product architecture

### 3.1 Existing UI retained

Keep the existing web-first Paradise interface and field/training content. Do not rewrite the product in a second framework merely to obtain GPS.

### 3.2 Cross-platform native shell

Use a thin native container around the existing web UI for iPhone and Android. The preferred implementation path is Capacitor so the current HTML/CSS/JavaScript experience can remain shared while device-specific capabilities are exposed through native plugins.

The native layer owns:

- background/live shift location;
- secure device enrollment/session storage;
- network status;
- haptics;
- local notifications / active-shift notification where applicable;
- eventual push notifications;
- resilient local persistence hooks if needed beyond browser storage.

### 3.3 Native live-location implementations

**iOS:** native Core Location background updates, enabled only during an active shift, with required project background-location capability and visible system behavior.  
**Android:** a `location` foreground service started while the app is visible when the employee starts the shift, with the required persistent user-visible notification and location permission handling.

Do not depend on a normal PWA/browser tab for reliable locked-phone all-shift location.

### 3.4 Central authoritative backend

Use Postgres-backed central storage. Supabase/Postgres is the preferred v1 architecture because it provides:

- central Postgres source of truth;
- Auth-backed sessions;
- Row Level Security;
- server-side/Edge Function business logic;
- realtime subscriptions for live team maps and leaderboards;
- SQL aggregation/windowing for KPI periods;
- webhooks for future CRM/payroll integrations.

No database secret/service key may be embedded in the employee client. Privileged compensation, corrections, rule changes, and integration writes occur server-side.

## 4. Identity with no traditional employee-account friction

The employee must not maintain an email/password account merely to use Paradise.

### 4.1 Personal device enrollment

Preferred first-use flow:

1. Paradise manager/admin creates or selects the employee profile.
2. Employee receives a one-time enrollment QR/code.
3. Employee opens/scans it once on the device.
4. Device receives a revocable employee-bound session/device credential.
5. Normal future opens go directly to that employee.

No daily username/password prompt.

### 4.2 Sensitive actions

PIN and/or device biometrics may protect:

- switching employee;
- viewing/changing unusually sensitive settings;
- manager/admin actions;
- re-enrolling a device.

### 4.3 Shared-device fallback

Shared devices use:

**SELECT EMPLOYEE → PIN**

Switching employees must close the prior employee session and clear unfinished local private entry UI while preserving centrally synced records.

### 4.4 Visibility parity

User direction is full Performance transparency:

> **Canvassers and managers see the same Performance data. Roles control what may be changed, not what Performance information may be viewed.**

Therefore v1 visibility parity includes team KPIs, live/last-known GPS, route traces, sets/customer records, demos, sales, sale values, compensation/pay status, histories, leaderboards, corrections, and the underlying calculation explanations wherever those are visible to managers.

Permissions differ:

- **Canvasser:** full view; normal edit/correction request on own current records.
- **Manager:** full view; approved correction/reassignment/locking actions.
- **Admin:** manager capabilities plus employee, KPI-standard, pay-plan, territory, integration, and system configuration.

A later owner-approved policy can narrow visibility, but v1 must not silently impose a manager-only data view contrary to this specification.

## 5. Universal formatting

Employee-facing and manager-facing UI uses U.S. customary conventions:

- distance: **feet / miles**;
- GPS accuracy: e.g. **±65 ft**;
- route distance: e.g. **3.9 mi**;
- time: **12-hour AM/PM**;
- dates: **MM/DD/YYYY**;
- currency: **USD**, e.g. **$27,500**;
- elapsed duration: **4 hr 18 min**;
- KPI labels: **Knocks/Hr, Sets/Hr, Demos/Hr, Sales/Hr**.

Internal storage may use standard metric/UTC representations where appropriate; presentation converts to U.S. units.

## 6. The Today state machine

Paradise should choose the primary employee action automatically.

### 6.1 No active shift

Show:

**GOOD MORNING**  
Assigned territory / readiness summary  
**START MY DAY**

Silently preflight GPS permission, required native background capability, network/sync, offline core readiness, device identity, and current assigned rules. Normal result is simply **READY ✓**. Only exceptions should interrupt the user.

### 6.2 Active shift

Open directly into Field Mode:

**SHIFT ACTIVE · 4 hr 18 min**  
**GPS ✓ · SYNCED ✓ · ON PACE**  
96 Doors · 31 Conversations · 4 Sets

Primary action: **+ SET** / **QUICK SET**

Secondary actions remain one tap away:

- + Door
- + Conversation
- Lookup
- Map
- Finish Day

### 6.3 Missing prior-day information

Do not reopen a long form. Show only the missing item(s), for example:

**YESTERDAY NEEDS 1 THING**  
Doors knocked: ___  
**FINISH YESTERDAY**

### 6.4 Completed day

Show one concise recap plus View Results.

### 6.5 Nothing pending

Show **YOU'RE ALL CAUGHT UP ✓** rather than inventing tasks.

## 7. Shift and daily log

### 7.1 Start

`START MY DAY` creates the authoritative shift record and starts live shift GPS.

Automatically store:

- employee;
- device;
- team/office;
- manager;
- assigned territory/version;
- start timestamp;
- start GPS point/accuracy if available;
- KPI-standard version;
- pay-plan version reference;
- application/version metadata.

### 7.2 Hours

Elapsed shift time is computed automatically from shift events. A normal employee should not type hours if the timer is available.

Support corrections with audit history. A manual-hours fallback remains available for missed/failed shifts, but it must never silently overwrite the original timer history.

Break handling should be simple:

- optional Pause/Resume;
- later Paradise may suggest a possible break after prolonged inactivity;
- the app must never deduct time automatically without an explicit policy/event.

### 7.3 Door and conversation counts

Support both workflows:

**Track as you go:** large `+1 Door` and `+1 Conversation` controls.  
**Enter at Finish Day:** numeric totals.

Paradise may learn which mode an employee normally uses and emphasize that mode without requiring a preferences screen.

Counters autosave immediately and provide temporary **UNDO**.

### 7.4 Finish Day

`FINISH DAY` asks only for information still missing.

If all fields are already known:

**6 hr 31 min · 148 Doors · 47 Conversations · 5 Sets**  
**EVERYTHING LOOK GOOD?**  
**FINISH DAY**

Finishing stops shift GPS and records the end timestamp/location.

## 8. Sets / customers

### 8.1 Sets are records, not a typed total

The number of Sets is the count of valid set records. The employee does not separately type `Sets = 5` and then enter five customers.

### 8.2 Normal Set

`+ SET`

Only required field for the fast path:

- customer name.

Automatically attach:

- employee;
- shift;
- timestamp;
- GPS point/accuracy;
- territory;
- originating performance cohort/date.

Appointment date/time, product, phone, address, and other CRM data may be optional or automatically populated if the operating system provides them.

### 8.3 Quick Set

For maximum field speed:

`QUICK SET`

One tap immediately creates a timestamp/GPS placeholder. It appears as:

**SET #5 — NAME NEEDED**

The employee completes the name later. The app must remind at a sensible time without interrupting the door interaction.

### 8.4 Duplicate protection

Warn when likely duplicates are detected from combinations of customer name, phone, address/CRM identity, very-close GPS/time, or duplicate integration records.

Do not silently discard a possible legitimate second record.

## 9. Demo, sale, revenue, and compensation outcomes

Each Set persists through its lifecycle:

- set;
- appointment scheduled;
- demo / no demo / pending;
- sale / no sale / pending;
- sale amount;
- commission earned;
- payment status;
- paid amount/date.

### 9.1 Preferred automation

Downstream appointment/demo/sale/contract data should come from Paradise CRM/LeadPerfection or other authoritative company systems whenever available. Employees should not duplicate company data already recorded elsewhere.

### 9.2 Manual fallback

Until integration exists or if an outcome cannot be determined, surface an exception card:

**JOHN SMITH — NEEDS UPDATE**  
DEMO · NO DEMO · PENDING

If demoed:

SOLD · NOT SOLD · PENDING

If sold:

**SALE AMOUNT $_____**

### 9.3 Attribution

Store both:

- **event date** (when demo/sale occurred), and
- **origin cohort** (the shift/set that generated the opportunity).

This prevents a Friday sale from being naively treated as though Friday's newly worked hours necessarily generated it.

Reports may show actual events occurring in a selected period, but the core efficiency engine must support origin-attributed Demos/Hr and Sales/Hr. The approved Paradise KPI-standard configuration will determine which attribution model controls each official standard/leaderboard metric; the UI must explain the selected model with one tap.

### 9.4 Outcome maturity

Fresh Sets with future/pending appointments are **PENDING**, not failed demos/sales.

Leaderboard/KPI screens must expose maturity such as:

**THIS WEEK · LIVE · 8 OUTCOMES PENDING**

## 10. Pay-plan engine

Pay calculations occur server-side from an effective-dated, versioned pay plan.

Support plan primitives sufficient for Paradise's approved plan, including:

- flat amount per qualifying sale;
- percent of sale/contract value;
- tiers;
- volume/revenue bonuses;
- combinations.

A sale record stores:

- sale amount;
- pay-plan version applied;
- calculation inputs;
- calculated/estimated commission;
- paid status;
- paid amount;
- paid date.

Employee view:

**Estimated Pay: $1,275**  
**Paid: $975**  
**Remaining/Pending: $300**

Tap any amount to explain the contributing sale(s) and rule/version.

Manager/admin corrections retain original value, corrected value, reason, actor, timestamp, and affected calculations. No silent overwrite.

## 11. KPI framework

### 11.1 Core user-requested standards

Paradise Performance must support minimum performance standards for:

- Knocks/Hr;
- Sets/Hr;
- Demos/Hr;
- Sales/Hr.

Do not invent numeric Paradise standards. Until controlled values are entered, the app shows **STANDARD NOT CONFIGURED** rather than a fabricated target.

### 11.2 Supporting metrics

Calculate centrally:

- Hours;
- Doors;
- Conversations;
- Sets;
- Demos;
- Sales;
- Revenue;
- Knocks/Hr;
- Conversations/Hr;
- Sets/Hr;
- Demos/Hr;
- Sales/Hr;
- Conversation Rate = Conversations / Doors;
- Set Rate = Sets / Conversations;
- Demo Rate = eligible Demos / mature Sets;
- Sale Rate = Sales / eligible Demos;
- Set-to-Sale Rate = Sales / mature Sets;
- Revenue/Hr;
- Average Sale;
- Commission earned/paid.

All denominator-zero cases display N/A rather than 0% where 0 would imply a real measured failure.

### 11.3 Standards are versioned

A KPI-standard version includes:

- role/team/office applicability;
- effective start/end dates;
- minimum threshold;
- optional `above_standard` threshold;
- metric attribution definition;
- precision/display rules;
- eligibility/sample rules.

Historical periods continue using the rule version applicable at the time; changing September standards must not rewrite August history.

### 11.4 Status labels

Where a separate approved `above_standard` threshold exists:

- **BELOW STANDARD**: metric < minimum;
- **MEETS STANDARD**: minimum ≤ metric < above threshold;
- **ABOVE STANDARD**: metric ≥ above threshold.

If Paradise intentionally configures only a single minimum threshold, the UI may use **BELOW MINIMUM / MEETS OR EXCEEDS MINIMUM** until an approved above-standard threshold exists rather than manufacture a third boundary.

## 12. Reporting periods

Use the employee/team operating timezone, initially `America/New_York` for current Paradise Florida operations unless a controlled office setting states otherwise.

Period definitions:

- **TODAY:** local calendar day;
- **WEEK:** Monday 12:00 AM through Sunday 11:59:59 PM local time;
- **MONTH:** calendar month;
- **60D:** today plus the preceding 59 local calendar days;
- **90D:** today plus the preceding 89 local calendar days;
- **YTD:** January 1 through today.

Use the same period selector everywhere:

**TODAY | WEEK | MONTH | 60D | 90D | YTD**

## 13. Performance views

### 13.1 During shift

The default experience is a field instrument, not an analytics dashboard.

Show only:

- elapsed time;
- GPS/sync health;
- Doors;
- Conversations;
- Sets;
- current simple pace conclusion;
- + Set;
- Lookup;
- Map;
- Finish Day.

### 13.2 Outside shift

Performance becomes the richer review system:

- My Day / My Performance;
- Leaderboard;
- Team;
- Map/Routes;
- Sets/Outcomes;
- Pay;
- historical comparisons;
- future coaching/training link.

### 13.3 Explainability

Any important value must answer, within one interaction:

1. **How was this calculated?**
2. **Where did the input come from?**
3. **When was it last updated?**
4. **Is it pending, estimated, verified, live, provisional, or final?**

## 14. Leaderboards

### 14.1 Periods

Automatically support:

- Today;
- Week;
- Month;
- 60D;
- 90D;
- YTD.

### 14.2 Filters

Support:

- All Paradise;
- office;
- team.

### 14.3 Categories

At minimum:

- Overall;
- Knocks;
- Sets;
- Demos;
- Sales;
- Revenue;
- Efficiency;
- Most Improved;
- Consistency.

Detailed boards may rank raw production and per-hour efficiency separately, e.g. Total Sets versus Sets/Hr.

### 14.4 Top 3 + Me

Default compact leaderboard shows:

- #1–#3;
- the current employee;
- the employee immediately above/below when useful.

`VIEW ALL` opens the full board.

### 14.5 Provisional eligibility

Ratios/overall rankings must not allow tiny samples to dominate. Until the controlled minimum eligible hours/opportunities for a period are met, show **PROVISIONAL**.

The exact eligibility thresholds are configuration, not invented in code.

### 14.6 Live versus final

Current periods are **LIVE**. Matured/reconciled completed periods may become **FINAL** after the configured reconciliation window.

Late corrections remain auditable and must not silently rewrite official history without showing the change.

### 14.7 Fairness

Always show both:

- raw production;
- efficiency/per-hour results.

A canvasser should not improve rank merely by working an artificially tiny number of hours.

High raw set volume also must not hide poor downstream appointment quality when quality metrics are part of the approved score.

### 14.8 Overall score

An Overall Paradise Performance Score may be implemented only after Paradise approves explicit weights/guardrails. It must be explainable; no hidden black-box ranking.

## 15. Live GPS and route tracing

### 15.1 Shift-only rule

**Shift inactive = Paradise live shift tracking off.**  
**Shift active = location tracking active.**

The UI must make this obvious.

### 15.2 Location-point record

Each accepted point stores at minimum:

- shift_id;
- employee_id;
- device_id;
- timestamp captured;
- timestamp received;
- latitude;
- longitude;
- horizontal accuracy;
- optional speed/course/altitude when supplied and useful;
- source/platform;
- battery/network context if needed for diagnostics;
- accepted/rejected route-display quality state.

### 15.3 Battery-aware cadence

Do not stream GPS every second.

Use a controlled strategy such as:

- immediate high-quality point at Start Shift;
- frequent updates while moving during an active shift;
- reduced cadence while stationary;
- immediate/better fix when adding a Set;
- refresh on Lookup/map use;
- immediate point at Finish Day;
- heartbeat/freshness updates sufficient for a near-live manager/team map.

Exact intervals belong in a versioned native-location configuration after battery/device testing.

### 15.4 Route line

Display ordered accepted GPS points as a route polyline.

Map semantics:

- Start marker;
- current/last-known marker;
- Set markers;
- End marker;
- assigned territory polygon;
- route trace;
- honest gaps where reliable points are unavailable.

Do not draw a visually authoritative continuous line across a long GPS outage. Use a gap/different uncertainty treatment.

### 15.5 GPS quality

Filter obvious impossible jumps, duplicate points, and stationary jitter for the display trace without destroying the raw source record.

User-facing freshness examples:

- **LIVE · 24 sec ago · ±55 ft**;
- **LAST SEEN · 8 min ago**;
- **LOCATION LIMITED · ±0.6 mi**.

### 15.6 Travel versus field segments

The system may classify route segments as likely travel/driving versus likely field movement for visualization/analysis, using motion/speed/context. This is an estimate and must never automatically alter pay/hours or claim that a door was knocked.

### 15.7 Estimated coverage

The map may show **ESTIMATED COVERAGE / TRAVELED / LIKELY WORKED** areas, but GPS does not prove individual doors or conversations.

### 15.8 Territory operations

Support later/optional:

- assigned territory polygon;
- inside/outside territory status;
- area claiming;
- teammate overlap warning;
- nearest estimated open area;
- route handoff.

These are operational aids. They do not override Lookup compliance authority.

### 15.9 Everyone sees the same map

Canvassers and managers use the same Team Map. Default clutter controls:

- team pins first;
- tap a person to show that person's route;
- optional Compare for multiple routes;
- clustering for dense pins/sets;
- Follow Live mode;
- location freshness displayed on every selected person.

## 16. Offline and sync

Field activity must continue when internet service is poor.

Locally queue:

- shift events;
- counter changes;
- Sets;
- GPS points;
- outcome updates;
- correction requests.

Every write receives a client-generated idempotency identifier so retries do not create duplicate Sets/counters/shift events.

User sees only simple states:

- **✓ SYNCED**;
- **SAVED ON THIS PHONE · SYNC PENDING**;
- **SYNCING**;
- actionable error only when human intervention is actually needed.

The app must recover active shift state after close/restart/crash from local + central state without requiring reconstruction.

## 17. Central data model

Minimum logical entities:

### Employees

- employee_id;
- display/legal name as required;
- role;
- office/team;
- manager;
- active status.

### Devices / sessions

- device_id;
- employee binding;
- platform;
- enrollment/revocation;
- last seen/version.

### Shifts

- shift_id;
- employee/device;
- start/end;
- break events;
- calculated/manual hours;
- territory/version;
- status;
- correction state.

### Daily activity

- shift/date;
- doors;
- conversations;
- source/provenance;
- completeness.

### Sets

- set_id;
- employee;
- originating shift/cohort;
- customer name;
- optional CRM identifiers/contact/address/product;
- created timestamp/GPS;
- appointment/outcome fields;
- data provenance.

### Outcomes / sales

- demo state/date/source;
- sale state/date/source;
- sale amount/source;
- verification state.

### Pay plans / pay calculations

- version/effective dates;
- rule configuration;
- per-sale calculation record;
- payment records.

### KPI standards

- version/effective dates;
- scope;
- thresholds;
- attribution definition;
- eligibility rules.

### Territories

- territory_id/version;
- polygon/metadata;
- assignment records.

### GPS points

- ordered raw location events and quality metadata.

### Corrections / audit

- entity/field;
- old/new;
- reason;
- actor;
- timestamps;
- approval/lock state.

### Leaderboard snapshots

- period/category/scope;
- live/final;
- calculation version;
- ranking values;
- finalization timestamp.

## 18. Security and data integrity

1. Central server is authoritative; local device state is an offline cache/queue.
2. RLS / server authorization must prevent a user from mutating another employee's source records merely because visibility is shared.
3. Admin/manager mutation endpoints require authenticated privileged role checks.
4. Compensation calculations occur server-side.
5. Rule/version tables are effective-dated and auditable.
6. Never expose privileged server keys to clients.
7. Every sync write is idempotent.
8. Every correction preserves history.
9. GPS display simplification never overwrites raw evidence.
10. Customer/set/sale records must have provenance indicating employee-entered, CRM-imported, manager-corrected, or otherwise verified source.

## 19. Data-quality guardrails

Before accepting/finalizing a day or ranking, detect obvious inconsistencies such as:

- Conversations > Doors;
- negative counts/hours;
- impossible timestamps;
- duplicate shift events;
- Set count mismatch (derived Sets should make this impossible);
- duplicate customers/CRM IDs;
- sale without a corresponding opportunity record;
- sale amount conflicts with authoritative CRM/contract feed;
- extremely implausible activity velocity requiring review;
- stale/pending outcome conditions being misclassified as failures.

Do not fabricate corrections. Surface the exact issue for correction/reconciliation.

## 20. CRM / LeadPerfection integration contract

Performance must support an integration adapter rather than hardwire CRM logic into the UI.

Outbound Set payload should support:

- stable Performance set_id;
- employee ID;
- customer data;
- appointment information;
- originating timestamps/territory;
- integration idempotency key.

Inbound updates should support:

- CRM lead/appointment ID;
- scheduled/run/demo state;
- sale state;
- contract/sale amount;
- cancellation/adjustment if used;
- authoritative timestamps;
- event provenance.

Do not implement field mappings until the current LeadPerfection schema/integration source is verified.

## 21. Future Performance → University loop

Performance v1 prepares but does not automatically authorize training/certification changes.

A later phase may map persistent KPI weakness to recommended practice/lesson content, e.g. appointment-quality weakness → relevant Practice module.

Recommendations must remain recommendations unless a later controlled policy explicitly establishes assigned training.

Official certification remains separate from KPI performance and device completion.

## 22. Accessibility and field usability

- critical field controls ≥44 CSS px equivalent;
- strong outdoor contrast;
- no critical status communicated only by color;
- large numeric keypad for counts/currency;
- one-handed placement of common controls;
- 200% text containment;
- no required horizontal scrolling;
- autosave rather than repeated Save confirmations;
- undo ordinary actions instead of confirmation dialogs;
- common employee workflow never more than two screens deep;
- active-shift primary action visible within approximately 3 seconds of opening the app.

## 23. UX acceptance budgets

Machine/user testing should treat these as product requirements:

- Start shift: **1 primary tap** after the app is ready.
- Add normal Set: **open + customer name + save/confirm**, with no unrelated required fields.
- Quick Set: **1 tap** to preserve event/GPS placeholder.
- Lookup from active shift: **1 tap**.
- Map from active shift: **1 tap**.
- Finish Day: only missing values + one finish action.
- Recover interrupted active shift: no reconstruction.
- View personal KPI summary: one tap from completed-day/home state.
- View leaderboard: one tap from Performance.
- View live map: one tap from Performance/active shift.

## 24. Implementation phases

### Phase A — foundation

- central backend schema/auth/RLS;
- employee/device enrollment;
- shifts;
- offline queue/idempotency;
- native iOS/Android shell;
- live shift GPS + route storage;
- no production rollout.

### Phase B — daily activity

- Start My Day / Field Mode / Finish Day;
- Doors/Conversations;
- normal + Quick Set;
- Today / My Day;
- timeline;
- GPS map/trace.

### Phase C — outcomes and KPI engine

- demo/sale lifecycle;
- sale amount;
- KPI calculations;
- versioned standards;
- periods;
- status/maturity/provenance.

### Phase D — leaderboards and team map

- shared Team Performance;
- Team Map;
- Today/Week/Month/60D/90D/YTD;
- categories/filters;
- provisional eligibility;
- live/final states.

### Phase E — compensation

- approved pay-plan engine;
- pay display;
- payment status;
- correction audit.

### Phase F — CRM automation

- verified LeadPerfection/current CRM mapping;
- outbound Set creation/matching;
- inbound demo/sale/contract updates;
- reconciliation.

### Phase G — coaching/assessment integration

Only after Performance data quality is demonstrated.

## 25. Open controlled inputs required before final KPI/pay behavior

These are not reasons to block building the shell/data architecture, but code must not invent them:

1. approved minimum Knocks/Hr;
2. approved minimum Sets/Hr;
3. approved minimum Demos/Hr;
4. approved minimum Sales/Hr;
5. approved above-standard threshold(s), if Paradise wants a distinct Above state;
6. minimum eligible hours/opportunities for leaderboard ratios;
7. any Overall Performance Score weights/guardrails;
8. current approved canvasser pay plan and effective-date rules;
9. authoritative employee roster/IDs/team/office mapping;
10. current LeadPerfection/CRM field mapping and webhook/API path;
11. territory geometry/assignment source;
12. location-history retention/finalization policy;
13. leaderboard reconciliation/finalization window.

## 26. Release gate additions required before any Performance production release

A future Performance candidate must add automated controls proving at minimum:

- unchanged field dataset/baseline unless separately field-authorized;
- Performance failure cannot block Lookup;
- iOS and Android shift-location start/stop lifecycle;
- no off-shift live GPS collection by the Performance service;
- GPS permission loss handled without data fabrication;
- route gap honesty;
- U.S.-unit display;
- offline queue replay/idempotency;
- no duplicate Sets after retry;
- source-record correction audit;
- KPI period boundary tests;
- zero-denominator tests;
- outcome-maturity tests;
- historical standard/pay-plan versioning;
- leaderboard provisional/final behavior;
- server-only privileged compensation logic;
- role mutation restrictions despite shared visibility;
- no service/admin secret in client bundle;
- load/realtime tests adequate for expected team size;
- CRM reconciliation fail-closed when authoritative data conflicts.

## 27. Non-goals for v1

Do not add merely because technically possible:

- GPS-derived automatic door counts;
- claims that a route trace proves a house was knocked;
- hidden/off-shift location tracking;
- facial recognition;
- mandatory voice input;
- points/XP systems unrelated to actual KPI performance;
- employee-created spreadsheets/reports;
- a separate manager application;
- a separate iOS UI and Android UI;
- duplicated CRM data entry when integration already knows the value;
- AI authority over legal/field Lookup or official certification.

## 28. Locked product principles

1. **Automate instead of enter.**
2. **One source of truth.**
3. **Shared Performance visibility; role-based mutation.**
4. **Shift active = location active; shift ended = location off.**
5. **GPS is operational evidence, not proof of a knock and not field authority.**
6. **Pending outcomes are not failures.**
7. **Every important number is explainable.**
8. **Historical rules remain historical.**
9. **Complexity belongs in the backend/admin controls, not the canvasser workflow.**
10. **If a proposed feature adds a recurring employee tap, it must justify why the system cannot derive or automate it.**

---

**Control disposition:** This document locks the intended Paradise Performance v1 architecture and employee experience for implementation planning. It does not authorize production deployment, repository-rule changes, Layer-3 adoption/promotion, KPI values, pay-plan values, or any change to the validated field/legal baseline.