# Paradise Performance v1 — Physical Device Acceptance

Status: **TEST PLAN / HARNESS IMPLEMENTATION — NOT YET PHYSICALLY RUN — NOT PASS**  
Date: 2026-08-18  
Release candidate anchor: `c1af14d7c1f8f8ce7b8decf1e12a02bf370b0367`  
Acceptance-tooling branch: `agent/paradise-performance-device-acceptance-v1`

## 1. Purpose

This is the final hardware/runtime gate for Paradise Performance v1 before any release-readiness claim may be considered.

The pinned parent candidate has already passed source controls, Performance contracts, deployed HTTPS mint → redeem → revoke transport, generated native shell validation, Android Gradle compilation, and iOS Xcode compilation. The parent also contains the v3 **native durable spool** that persists GPS evidence before JavaScript delivery and acknowledges a native point only after the existing idempotent JavaScript queue accepts the same stable client point ID.

This hardware gate proves what source/CI cannot:

- trusted-device enrollment and OS-protected session persistence on real phones;
- locked/background real GPS behavior;
- user-visible platform disclosure while location is active;
- native durable spool survival/recovery when the web layer is unavailable;
- offline queue survival and idempotent reconnect replay;
- normal active-shift relaunch/recovery;
- immediate device behavior after server-side revocation;
- Finish Day stopping native location with no post-finish collection;
- uninstall/reinstall requiring fresh manager enrollment.

The acceptance harness is test-only and never a field authorization source.

## 2. Hard boundaries

1. Use only the isolated non-production Supabase project.
2. Use synthetic acceptance employees only. No real employee, customer, CRM, KPI, pay-plan, or commission data.
3. Do not change Lookup, the 78-jurisdiction field baseline, training authority, KPI standards, or compensation rules.
4. Do not mount the acceptance harness in the public or validated web app.
5. Physical acceptance is PASS only from observed phone behavior plus backend readback.
6. A compiled APK/Xcode project, Simulator result, or one-platform-only result is not physical PASS.
7. Every synthetic employee/device/session/shift/event/GPS/enrollment record must be removed after evidence capture.

## 3. Required hardware record

| Field | iPhone | Android |
|---|---|---|
| Device model | NOT RUN | NOT RUN |
| OS version | NOT RUN | NOT RUN |
| Acceptance build SHA | NOT RUN | NOT RUN |
| Install method | NOT RUN | NOT RUN |
| Synthetic employee ID | NOT RUN | NOT RUN |
| Performance device ID | NOT RUN | NOT RUN |
| Test start local time | NOT RUN | NOT RUN |
| Tester | NOT RUN | NOT RUN |

Minimum hardware: **one physical iPhone and one physical Android phone**.

## 4. Acceptance build controls

The app must visibly say **Paradise Performance TEST / NON-PRODUCTION DEVICE ACCEPTANCE** and use the same product modules intended for the real client:

- trusted-device enrollment/session code;
- Keychain / Android Keystore Auth persistence;
- native Capacitor location bridge;
- v3 native durable location spool;
- authoritative shift transport;
- Today Start My Day / Finish Day controller and UI;
- idempotent offline Performance queue.

Diagnostics may expose IDs, timestamps, queue counts, permission state, and native tracking state. They must not log access tokens, refresh tokens, hidden Auth passwords, service-role/secret credentials, or enrollment-token plaintext after redemption.

## 5. Platform disclosure prerequisites

### iOS

- Location permission must originate from the visible Start My Day flow.
- Background location capability must be present.
- Normal iOS location-use disclosure/indicator behavior must be visible while active in background.
- Standard lock/background is the required continuity test. Deliberate force-quit is a separate recovery boundary because standard `startUpdatingLocation()` is not claimed to provide uninterrupted delivery after user termination.

### Android

- Location services enabled.
- Coarse or fine location granted.
- Android 13+ `POST_NOTIFICATIONS` granted.
- Active `location` foreground service and persistent user-visible shift notification present.
- Paradise intentionally refuses active-shift location when normal notification disclosure is denied on Android 13+.

## 6. Required test matrix — run independently on both phones

### A. Fresh install / no session

Install fresh and open without enrollment. Confirm enrollment-required state, native tracking stopped, zero shift/GPS writes, and no silent permission-triggered tracking.

**PASS:** no silent tracking and no Performance data writes.

### B. Trusted-device enrollment + protected refresh

Redeem a short-lived manager-issued enrollment token for the synthetic employee. Confirm session `READY`, employee/device binding matches backend, then run **REFRESH AUTH SESSION**.

**PASS:** no employee email/password prompt; refresh works from OS-protected storage; no secret appears in evidence.

### C. Start My Day

With no open shift, tap **START MY DAY** exactly once. Confirm exactly one authoritative active shift and that native status matches the same employee/device/shift IDs. Confirm the first real location point includes device capture time and accuracy.

**PASS:** one shift only; explicit Start initiates tracking; native/server context agrees.

### D. Lock/background real movement

Lock the phone and walk/drive a short real route for several minutes without keeping the app foregrounded. Unlock/reopen and compare backend GPS timestamps/coordinates to the actual interval.

**iPhone PASS:** real non-simulated background samples plus normal iOS location disclosure.

**Android PASS:** foreground-service notification remains visible plus real non-simulated background samples.

Never render or describe a route gap as confirmed movement.

### E. Native durable spool / web-layer interruption

During the active shift, create a period where native tracking remains active while the web layer is unavailable or not consuming callbacks, using the safest platform-appropriate method that does not deliberately violate the ordinary background test. Reopen/recover the app and inspect diagnostics/backend.

Required evidence:

- native samples use stable `clientPointId` values;
- original device `capturedAt` survives handoff;
- a point is persisted in the native durable spool before JavaScript acceptance;
- native ACK happens only after the JavaScript idempotent queue accepts that point;
- crash-left/pending native samples drain on recovery;
- the same client point is not duplicated when listener delivery and relaunch drain overlap;
- native spool corruption/read failure, if induced in a development-only diagnostic, must fail closed rather than silently erase pending GPS.

**PASS:** temporary web-layer absence does not silently discard native GPS evidence and recovery preserves one stable ID per point.

### F. Ordinary active-shift relaunch

Background and later reopen normally during the same shift. Confirm one server shift, same persisted employee/device/shift native context, and reattach rather than new shift start.

**PASS:** no duplicate/invented shift; recovery remains bound to exact original context.

### G. Network loss while active

Disable network while leaving location enabled, keep the phone backgrounded/locked, move enough to generate samples, then reopen still offline and run **VALIDATE SESSION**.

**PASS while offline:** session becomes `UNVERIFIED_TRANSIENT`, trusted Auth is not cleared, active native GPS is not stopped, native/JS pending evidence retains original timestamps and stable IDs.

Restore connectivity.

**PASS after reconnect:** session returns `READY`; native spool drains into the JavaScript queue; JavaScript queue drains to backend; each stable client point appears once; original capture timestamps survive replay.

### H. Explicit server-side revoke while active

With the device online, `READY`, and tracking, revoke that exact Performance device from the isolated manager/backend path. Trigger session validation on the phone.

**PASS:** definitive `REVOKED_OR_UNENROLLED`/invalid result; local trusted Auth cleared; native tracking force-stopped before invalid-session UI; old session cannot regain authorized Performance access; no later GPS from revoked device is accepted; re-use requires fresh manager enrollment.

A transient outage may not masquerade as revocation.

### I. Re-enroll after revoke

Mint and redeem a fresh one-time enrollment token on the same phone. Confirm a new active device/session binding and the prior binding remains revoked.

**PASS:** explicit manager-controlled re-enrollment; old identity is never resurrected.

### J. Finish Day + final spool drain

Generate several GPS samples, tap **FINISH DAY**, confirm authoritative shift finished and native tracking stopped. Confirm the stop occurs before final native spool drainage, pending native points are transferred/ACKed through the durable queue path, then move/wait briefly and reread backend GPS.

**PASS:** no post-Finish location collection; final pending evidence is not silently lost; no duplicate shift; final timestamps are consistent.

### K. Relaunch after completed day

Reopen after Finish Day.

**PASS:** no active shift; native tracking remains stopped; stale state does not restart tracking. Any crash-left historical native spool record may be recovered as evidence using its embedded IDs, but that recovery must not authorize or restart location.

### L. Uninstall / reinstall boundary

Finish any active shift, uninstall the test app, reinstall the same build, then open before supplying a new enrollment token.

**PASS:** manager re-enrollment is required. If protected Auth survives uninstall, fresh-install boundary logic clears the old local Auth/device binding and never adopts the stale trusted identity.

## 7. iOS deliberate termination boundary — informational/recovery

During a synthetic active shift, deliberately force-quit, record OS behavior, then relaunch manually. Do not require uninterrupted standard-location delivery through force-quit. Require safe recovery only to the already-authoritative employee/device/shift context, with no duplicate/invented shift and no off-shift collection.

## 8. Android user-stop boundary — informational/recovery

During a synthetic active shift, use Android's system user-stop/Active apps control. Confirm no hidden location continuation after user-stop. Relaunch explicitly and require safe recovery without duplicate/invented shift.

## 9. Evidence required for PASS

For each platform retain:

- acceptance build SHA;
- device model + OS;
- installation method;
- screenshot/photo of visible active-location disclosure;
- sanitized harness evidence JSON;
- authoritative shift readback;
- GPS row count + timestamp range for background/offline periods;
- native-spool pending/drain/ACK evidence with stable client point IDs;
- JavaScript queue-before / queue-after reconnect evidence;
- revocation timestamp + no-post-revoke-write proof;
- Finish Day timestamp + no-post-finish-GPS proof;
- reinstall/re-enrollment result.

Never retain access/refresh token plaintext in the acceptance record.

## 10. Cleanup gate

After both platforms:

1. finish/void remaining synthetic shifts if required;
2. revoke acceptance devices;
3. remove synthetic actor identities, devices, enrollment tokens, events, GPS, shifts, and employees;
4. remove disposable Auth users/sessions/refresh tokens;
5. rerun Supabase Security Advisor;
6. reread every Performance table count;
7. confirm no temporary extension or transport helper remains.

Expected final isolated backend: **zero test rows and zero disposable Auth records**.

## 11. Final decision rule

Physical acceptance is **PASS** only when both real-device columns pass every applicable required case and cleanup is verified.

Until that evidence exists:

**Paradise Performance v1 remains non-production and not release-authorized.**
