export const PHYSICAL_ACCEPTANCE_CONTROL = Object.freeze({
  controlHead: '783d0c11d20d9e72444a258ac55b2d22b1219692',
  acceptanceWorkflowRun: 32241534617,
  projectRef: 'taxlrlfsobtnbasjcnuf',
  artifactSha256: Object.freeze({
    android: '1b7860ddc62c1f469e70129323dbc2c3f4a5c005d3a2aaea33c09f18dd8efd68',
    ios: '28521af3b38e7bf171f864606c1b98488e323089a785a081e9a33a682da4ebe2',
  }),
});

export const REQUIRED_CLEANUP_COUNTS = Object.freeze([
  'employees', 'actorIdentities', 'devices', 'enrollmentTokens', 'shifts', 'events',
  'locationPoints', 'sets', 'outcomes', 'commissions', 'kpiStandards', 'payPlans',
  'territories', 'authUsers', 'authSessions', 'refreshTokens',
]);

export const REQUIRED_CASES = Object.freeze([
  'A_fresh_install',
  'B_enroll_refresh',
  'C_start_my_day',
  'D_background_movement',
  'E_native_spool',
  'F_relaunch',
  'G_network_loss_recovery',
  'H_server_revoke',
  'I_reenroll',
  'J_finish_day',
  'K_post_finish_relaunch',
  'L_uninstall_reinstall',
]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NON_EMPTY = value => typeof value === 'string' && value.trim().length > 0;
const presentNumber = value => value !== null && value !== undefined && !(typeof value === 'string' && value.trim() === '') && Number.isFinite(Number(value));
const finiteNonNegative = value => presentNumber(value) && Number(value) >= 0;
const exactZero = value => presentNumber(value) && Number(value) === 0;

function issue(code, field, message) {
  return Object.freeze({ code, field, message });
}

function validInstant(value) {
  if (!NON_EMPTY(value)) return false;
  return Number.isFinite(new Date(value).getTime());
}

function requireNonEmpty(doc, field, issues) {
  if (!NON_EMPTY(doc[field])) issues.push(issue('MISSING_REQUIRED_VALUE', field, `${field} is required`));
}

export function validatePhysicalEvidence(doc, expectedPlatform) {
  const issues = [];
  const control = PHYSICAL_ACCEPTANCE_CONTROL;

  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    return Object.freeze({ pass: false, platform: expectedPlatform ?? null, issues: [issue('INVALID_DOCUMENT', '$', 'Evidence must be a JSON object')] });
  }

  if (doc.controlHead !== control.controlHead) issues.push(issue('CONTROL_HEAD_MISMATCH', 'controlHead', `Expected ${control.controlHead}`));
  if (Number(doc.acceptanceWorkflowRun) !== control.acceptanceWorkflowRun) issues.push(issue('WORKFLOW_RUN_MISMATCH', 'acceptanceWorkflowRun', `Expected ${control.acceptanceWorkflowRun}`));
  if (doc.projectRef !== control.projectRef) issues.push(issue('PROJECT_REF_MISMATCH', 'projectRef', `Expected ${control.projectRef}`));

  const platform = String(doc.platform ?? '').toLowerCase();
  if (!['ios', 'android'].includes(platform)) issues.push(issue('INVALID_PLATFORM', 'platform', 'platform must be ios or android'));
  if (expectedPlatform && platform !== expectedPlatform) issues.push(issue('PLATFORM_MISMATCH', 'platform', `Expected ${expectedPlatform}`));
  if (['ios', 'android'].includes(platform) && doc.artifactSha256 !== control.artifactSha256[platform]) {
    issues.push(issue('ARTIFACT_DIGEST_MISMATCH', 'artifactSha256', `Expected exact ${platform} acceptance artifact SHA-256 ${control.artifactSha256[platform]}`));
  }

  for (const field of ['deviceModel', 'osVersion', 'installMethod', 'tester', 'syntheticEmployeeId', 'performanceDeviceId', 'testStartLocal', 'testEndLocal']) {
    requireNonEmpty(doc, field, issues);
  }
  if (NON_EMPTY(doc.syntheticEmployeeId) && !UUID_RE.test(doc.syntheticEmployeeId)) issues.push(issue('INVALID_UUID', 'syntheticEmployeeId', 'syntheticEmployeeId must be a UUID'));
  if (NON_EMPTY(doc.performanceDeviceId) && !UUID_RE.test(doc.performanceDeviceId)) issues.push(issue('INVALID_UUID', 'performanceDeviceId', 'performanceDeviceId must be a UUID'));
  if (NON_EMPTY(doc.testStartLocal) && !validInstant(doc.testStartLocal)) issues.push(issue('INVALID_TIMESTAMP', 'testStartLocal', 'testStartLocal must be an ISO-compatible timestamp'));
  if (NON_EMPTY(doc.testEndLocal) && !validInstant(doc.testEndLocal)) issues.push(issue('INVALID_TIMESTAMP', 'testEndLocal', 'testEndLocal must be an ISO-compatible timestamp'));
  if (validInstant(doc.testStartLocal) && validInstant(doc.testEndLocal) && new Date(doc.testEndLocal) < new Date(doc.testStartLocal)) {
    issues.push(issue('INVALID_TIME_ORDER', 'testEndLocal', 'testEndLocal cannot precede testStartLocal'));
  }

  if (!doc.cases || typeof doc.cases !== 'object') {
    issues.push(issue('MISSING_CASES', 'cases', 'Required A-L case results are missing'));
  } else {
    for (const name of REQUIRED_CASES) {
      if (!doc.cases[name] || doc.cases[name].pass !== true) {
        issues.push(issue('CASE_NOT_PASS', `cases.${name}.pass`, `${name} must be explicitly true`));
      }
    }
  }

  const gps = doc.backgroundGps ?? {};
  if (!finiteNonNegative(gps.rowCount) || Number(gps.rowCount) < 1) issues.push(issue('BACKGROUND_GPS_NOT_PROVEN', 'backgroundGps.rowCount', 'At least one accepted background GPS row is required'));
  if (!validInstant(gps.firstCapturedAt)) issues.push(issue('MISSING_GPS_TIMESTAMP', 'backgroundGps.firstCapturedAt', 'firstCapturedAt is required'));
  if (!validInstant(gps.lastCapturedAt)) issues.push(issue('MISSING_GPS_TIMESTAMP', 'backgroundGps.lastCapturedAt', 'lastCapturedAt is required'));
  if (validInstant(gps.firstCapturedAt) && validInstant(gps.lastCapturedAt) && new Date(gps.lastCapturedAt) < new Date(gps.firstCapturedAt)) {
    issues.push(issue('INVALID_GPS_TIME_ORDER', 'backgroundGps.lastCapturedAt', 'lastCapturedAt cannot precede firstCapturedAt'));
  }

  const replay = doc.offlineReplay ?? {};
  if (!finiteNonNegative(replay.queueBefore) || Number(replay.queueBefore) < 1) issues.push(issue('OFFLINE_QUEUE_NOT_PROVEN', 'offlineReplay.queueBefore', 'queueBefore must prove at least one queued write'));
  if (!exactZero(replay.queueAfter)) issues.push(issue('OFFLINE_QUEUE_NOT_DRAINED', 'offlineReplay.queueAfter', 'queueAfter must equal 0'));
  if (!exactZero(replay.duplicateClientPointIds)) issues.push(issue('DUPLICATE_REPLAY_DETECTED', 'offlineReplay.duplicateClientPointIds', 'duplicateClientPointIds must equal 0'));

  const revoke = doc.revocation ?? {};
  if (!validInstant(revoke.revokedAt)) issues.push(issue('REVOCATION_NOT_PROVEN', 'revocation.revokedAt', 'revokedAt is required'));
  if (!exactZero(revoke.postRevokeAcceptedGpsRows)) issues.push(issue('POST_REVOKE_WRITE_DETECTED', 'revocation.postRevokeAcceptedGpsRows', 'postRevokeAcceptedGpsRows must equal 0'));

  const finish = doc.finishDay ?? {};
  if (!validInstant(finish.finishedAt)) issues.push(issue('FINISH_DAY_NOT_PROVEN', 'finishDay.finishedAt', 'finishedAt is required'));
  if (!exactZero(finish.postFinishCollectedGpsRows)) issues.push(issue('POST_FINISH_GPS_DETECTED', 'finishDay.postFinishCollectedGpsRows', 'postFinishCollectedGpsRows must equal 0'));

  if (!Array.isArray(doc.sanitizedEvidenceJsonFiles) || doc.sanitizedEvidenceJsonFiles.length < 1 || doc.sanitizedEvidenceJsonFiles.some(v => !NON_EMPTY(v))) {
    issues.push(issue('SANITIZED_EVIDENCE_MISSING', 'sanitizedEvidenceJsonFiles', 'At least one sanitized evidence JSON filename is required'));
  }
  if (!Array.isArray(doc.screenshots) || doc.screenshots.length < 1 || doc.screenshots.some(v => !NON_EMPTY(v))) {
    issues.push(issue('SCREENSHOT_EVIDENCE_MISSING', 'screenshots', 'At least one screenshot/photo filename is required'));
  }

  if (doc.finalDisposition !== 'PASS') issues.push(issue('FINAL_DISPOSITION_NOT_PASS', 'finalDisposition', 'finalDisposition must equal PASS'));

  return Object.freeze({ pass: issues.length === 0, platform: platform || expectedPlatform || null, issues: Object.freeze(issues) });
}

export function validatePhysicalEvidencePair(iosDoc, androidDoc) {
  const ios = validatePhysicalEvidence(iosDoc, 'ios');
  const android = validatePhysicalEvidence(androidDoc, 'android');
  const issues = [...ios.issues.map(v => ({ ...v, platform: 'ios' })), ...android.issues.map(v => ({ ...v, platform: 'android' }))];
  if (iosDoc?.syntheticEmployeeId && androidDoc?.syntheticEmployeeId && iosDoc.syntheticEmployeeId === androidDoc.syntheticEmployeeId) {
    issues.push({ ...issue('PLATFORM_FIXTURE_COLLISION', 'syntheticEmployeeId', 'iPhone and Android must use independent synthetic employee fixtures'), platform: 'pair' });
  }
  if (iosDoc?.performanceDeviceId && androidDoc?.performanceDeviceId && iosDoc.performanceDeviceId === androidDoc.performanceDeviceId) {
    issues.push({ ...issue('DEVICE_ID_COLLISION', 'performanceDeviceId', 'iPhone and Android must have distinct Performance device IDs'), platform: 'pair' });
  }
  return Object.freeze({ pass: issues.length === 0, ios, android, issues: Object.freeze(issues) });
}

export function validateCleanupReadback(doc) {
  const issues = [];
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    return Object.freeze({ pass: false, issues: [issue('INVALID_CLEANUP_DOCUMENT', '$', 'Cleanup evidence must be a JSON object')] });
  }
  if (doc.projectRef !== PHYSICAL_ACCEPTANCE_CONTROL.projectRef) issues.push(issue('PROJECT_REF_MISMATCH', 'projectRef', `Expected ${PHYSICAL_ACCEPTANCE_CONTROL.projectRef}`));
  if (!validInstant(doc.verifiedAt)) issues.push(issue('CLEANUP_TIMESTAMP_MISSING', 'verifiedAt', 'verifiedAt is required'));
  if (!doc.counts || typeof doc.counts !== 'object') {
    issues.push(issue('CLEANUP_COUNTS_MISSING', 'counts', 'Cleanup row counts are required'));
  } else {
    for (const key of REQUIRED_CLEANUP_COUNTS) {
      if (!exactZero(doc.counts[key])) issues.push(issue('CLEANUP_NOT_ZERO', `counts.${key}`, `${key} must equal 0 after cleanup`));
    }
  }
  if (!exactZero(doc.securityAdvisorLints)) issues.push(issue('SECURITY_ADVISOR_NOT_CLEAN', 'securityAdvisorLints', 'Security Advisor lint count must equal 0'));
  return Object.freeze({ pass: issues.length === 0, issues: Object.freeze(issues) });
}

export function validatePhysicalAcceptanceGate(iosDoc, androidDoc, cleanupDoc) {
  const pair = validatePhysicalEvidencePair(iosDoc, androidDoc);
  const cleanup = validateCleanupReadback(cleanupDoc);
  const issues = [
    ...pair.issues,
    ...cleanup.issues.map(v => ({ ...v, platform: 'cleanup' })),
  ];
  return Object.freeze({ pass: issues.length === 0, pair, cleanup, issues: Object.freeze(issues) });
}
