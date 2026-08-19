# Paradise Performance v1 — Physical Evidence Gate

Status: **IMPLEMENTED — NON-PRODUCTION — REAL PHONE EXECUTION STILL REQUIRED**  
Date: 2026-08-19  
Acceptance artifact/control head: `783d0c11d20d9e72444a258ac55b2d22b1219692`  
Acceptance workflow run: `32241534617`  
Isolated project: `taxlrlfsobtnbasjcnuf`

## Purpose

This gate prevents build/simulator evidence, incomplete real-device testing, wrong acceptance artifacts, missing retained evidence, unsafe credential retention, or uncleared synthetic backend state from being promoted as a physical-device PASS.

It does not perform the hardware test. A real iPhone and a real Android phone must still execute the controlled A-L matrix.

## Exact artifacts

Evidence is bound to the independently verified install/source packages:

- Android `app-debug.apk` SHA-256: `1b7860ddc62c1f469e70129323dbc2c3f4a5c005d3a2aaea33c09f18dd8efd68`
- iOS `paradise-performance-ios-xcode-project.zip` SHA-256: `28521af3b38e7bf171f864606c1b98488e323089a785a081e9a33a682da4ebe2`

A platform evidence file with a different or missing `artifactSha256` fails closed.

## Local evidence files

Copy the public templates into the gitignored local evidence directory:

```bash
mkdir -p performance/acceptance/private-evidence
cp performance/acceptance/physical-evidence-template.json performance/acceptance/private-evidence/ios.json
cp performance/acceptance/physical-evidence-template.json performance/acceptance/private-evidence/android.json
cp performance/acceptance/physical-cleanup-template.json performance/acceptance/private-evidence/cleanup.json
```

Raw screenshots, GPS evidence, exported acceptance JSON, and any private token handoff material belong under `performance/acceptance/private-evidence/` or outside the repository. They must not be committed to the public repository.

## PASS rule

Run:

```bash
node scripts/validate-performance-physical-acceptance-evidence.mjs \
  performance/acceptance/private-evidence/ios.json \
  performance/acceptance/private-evidence/android.json \
  performance/acceptance/private-evidence/cleanup.json
```

The command returns PASS only when all of the following are true:

- both documents are pinned to acceptance head `783d0c11d20d9e72444a258ac55b2d22b1219692`, workflow `32241534617`, and isolated project `taxlrlfsobtnbasjcnuf`;
- each platform carries the exact controlled artifact SHA-256 listed above;
- one document is `ios` and the other is `android`;
- each platform has a real device model, OS version, install method, tester, synthetic employee ID, Performance device ID, and valid start/end timestamps;
- all timestamps are offset-aware ISO values (`Z` or explicit UTC offset), not timezone-ambiguous local strings;
- every required A-L case is explicitly `pass: true`;
- background GPS contains at least one accepted row and valid captured-time range;
- offline replay proves at least one queued write, a final queue of zero, and zero duplicate client point IDs;
- server revocation has a timestamp and zero accepted post-revoke GPS rows;
- Finish Day has a timestamp and zero post-finish collected GPS rows;
- required zero-proof fields must contain explicit numeric zero; `null`, blank, missing, and nonnumeric values fail closed;
- every referenced screenshot/photo file actually exists, is nonempty, and has an accepted image extension;
- every referenced sanitized evidence JSON file actually exists, is nonempty, and parses as JSON;
- sanitized JSON is rejected if it retains credential fields such as access/refresh tokens, hidden credentials, passwords, service-role/secret keys, or token-like secret patterns;
- each platform says `finalDisposition: "PASS"`;
- iPhone and Android use independent synthetic employee/device fixtures;
- final isolated-backend cleanup readback is zero for employees, actor identities, devices, enrollment tokens, shifts, events, GPS points, Sets, outcomes, commissions, KPI standards, pay plans, territories, Auth users, Auth sessions, and refresh tokens;
- Security Advisor lint count is explicitly zero after cleanup.

Any failed or missing condition exits nonzero and prints the exact blocking fields.

## Privacy boundary

`.gitignore` explicitly excludes:

- `performance/acceptance/private-evidence/`
- `PRIVATE_TEST_TOKENS*`

The public templates contain no tokens, access credentials, customer data, employee data, or GPS evidence.

## Important limitation

A successful GitHub Actions build, simulator run, generic iPhone-device compile, APK package, artifact checksum, local validator unit test, or existence check of retained evidence is **not** physical acceptance. The validator consumes evidence produced by the real-phone run; it cannot prove the truth of a screenshot or manufacture real hardware behavior.

## Production boundary

Even after this local evidence gate passes, production promotion remains a separate controlled action. This file does not authorize merge, release, employee tracking, KPI thresholds, pay rules, municipality changes, University changes, Layer-3 changes, or production deployment.
