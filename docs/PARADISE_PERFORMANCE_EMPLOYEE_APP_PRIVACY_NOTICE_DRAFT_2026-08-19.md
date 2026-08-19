# Paradise Performance Employee App Privacy Notice — DRAFT FOR APPROVAL

Status: **DRAFT / NOT LEGALLY APPROVED / DO NOT PUBLISH AS FINAL**

Date: 2026-08-19

Purpose: provide a review-ready privacy notice for the Paradise Performance employee application so counsel/HR/management can approve the final language before App Store or Google Play submission.

This draft does **not** replace Paradise Exteriors LLC's public website privacy policy and does not make any conclusion about legal sufficiency. It intentionally preserves unresolved retention, employment-policy, and contact-routing decisions rather than inventing them.

## 1. Scope

This notice applies to the **Paradise Performance** mobile application used by authorized Paradise Exteriors LLC employees, canvassers, managers, and other company-authorized personnel.

The app is an internal workforce tool. It is not intended for consumers or the general public.

## 2. Information the app may process

Depending on the functions an authorized employee uses, the app may process or transmit:

- employee or user account identifiers;
- trusted-device identifiers and device/platform metadata;
- active shift or workday identifiers;
- timestamps associated with work activity;
- precise or approximate device location while an employee has intentionally started an active workday/location-tracking session;
- location accuracy;
- where supplied by the device, altitude, speed, heading, and indicators that location may be simulated or mocked;
- operational route or workday evidence derived from employee activity;
- app interaction or synchronization information necessary to operate, secure, troubleshoot, or reconcile the employee session.

The current controlled native design does **not** request Android `ACCESS_BACKGROUND_LOCATION`. Android workday location is designed to run through a user-started foreground location service with a visible notification. On iPhone, the app requests When In Use location permission from the visible employee flow and may continue location updates during the employee-started active workday while the app is backgrounded, with the platform's background-location indication enabled.

## 3. When location collection begins

Location tracking is designed to begin only when an authorized employee intentionally starts the controlled **Start My Day** / active-workday flow and grants the required device permission.

Ordinary app launch alone is not intended to start an active workday location session.

The native layer is designed to stop active tracking when the controlled workday/session is stopped or otherwise ended according to the application controls.

## 4. Why Paradise uses this information

Paradise may use information processed through the app for legitimate internal business purposes such as:

- authenticating authorized employees and trusted devices;
- maintaining session and device security;
- supporting field-work and active-workday functionality;
- recording and synchronizing operational field activity;
- providing employee performance and progress views where separately configured and authorized;
- supporting training and employee-development features;
- investigating synchronization, reliability, security, or abuse issues;
- maintaining auditable operational records where required by approved company policy or law.

This draft does **not** authorize any compensation formula, KPI threshold, territory rule, employee ranking rule, disciplinary rule, or retention period that has not been separately approved by Paradise.

## 5. Advertising and cross-company tracking

The controlled Paradise Performance design is not intended to use employee data for third-party advertising, targeted advertising, data-broker activity, or cross-company advertising tracking.

The current iOS privacy manifest is designed to declare no advertising/cross-company tracking use.

If the final production app later adds an analytics, advertising, attribution, crash-reporting, or other third-party SDK that changes the data flow, this notice and the App Store/Google Play privacy disclosures must be re-reviewed before release.

## 6. Service providers and disclosures

Paradise may use service providers that operate infrastructure necessary to provide the application, such as hosting, authentication, database, synchronization, security, or distribution services. Service providers should receive information only as necessary to provide their contracted service and subject to applicable company agreements and controls.

Current controlled backend infrastructure includes a Paradise-managed Supabase project for the Performance application foundation.

This draft does not authorize sale of employee data or disclosure to data brokers.

Paradise may also disclose information when required by law, legal process, or an authorized company investigation, subject to applicable legal and company-policy requirements.

## 7. Data retention — APPROVAL REQUIRED

**FINAL RETENTION POLICY NOT YET APPROVED.**

Before publication, Paradise must replace this section with an approved retention rule addressing at minimum:

- active-workday/location records;
- device-enrollment and revocation records;
- authentication/session records;
- operational performance records;
- training/progress records;
- backups and logs;
- legal-hold or investigation exceptions;
- deletion/anonymization after the approved retention period.

No retention duration should be represented in a store submission until it is approved and matches actual production behavior.

## 8. Employee choices and device controls

Employees can use the operating-system permission controls to review or change location permissions. Certain app functions may not work if a required permission is disabled.

An employee should not be represented as consenting to unrelated advertising or data-broker tracking merely by using the employee app.

The trusted-device system may allow Paradise to revoke an authorized device or employee session as part of security and access control.

## 9. Security

Paradise uses technical and administrative controls intended to restrict the employee application to authorized users and trusted devices. The controlled foundation includes enrollment, session, revocation, and row-level access controls.

No system can be guaranteed to be completely secure. Employees should promptly report a lost device, suspected account compromise, or unauthorized access through the company-approved support route.

## 10. Employee rights / employment-law notice — APPROVAL REQUIRED

**COUNSEL/HR APPROVAL REQUIRED.**

Before publication, Paradise should insert any notices, acknowledgments, access/correction/deletion procedures, state-specific workforce-monitoring disclosures, or employee-policy cross-references required by applicable law or company policy.

This app privacy notice should not be used to waive employee rights or create employment terms beyond approved company policies.

## 11. Children

Paradise Performance is an internal workforce application and is not directed to children.

## 12. Changes

Paradise may update this notice when application features, data practices, applicable law, or company policy changes. Store privacy disclosures must be reviewed whenever the app's actual collection or use changes.

## 13. Contact — APPROVAL REQUIRED

Final employee-app privacy/support contact: **[APPROVE BEFORE PUBLICATION]**

Candidate company identity:

Paradise Exteriors LLC  
1918 Corporate Dr  
Boynton Beach, FL 33426  
USA

Candidate general contact currently published by Paradise: `info@paradiseexteriors.com`

Do not publish the final app notice until management/counsel confirms the correct employee privacy/support contact and whether a separate HR/privacy address should be used.

---

## Approval checklist

The final reviewer should explicitly approve or replace each of these unresolved items:

1. retention durations and deletion rules;
2. employee monitoring/location notice requirements;
3. employee access/correction/deletion procedure;
4. final privacy/support email or route;
5. exact service-provider disclosure language;
6. whether operational location data can be used for performance management, discipline, compensation, litigation, or only narrower operational purposes;
7. any state-specific employee notice or acknowledgment requirements;
8. whether this notice should be incorporated into or linked from Paradise's main public privacy policy.

Until those items are approved, status remains **DRAFT / DO NOT PUBLISH AS FINAL**.
