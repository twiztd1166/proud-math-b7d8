import test from 'node:test';
import assert from 'node:assert/strict';
import { PHYSICAL_ACCEPTANCE_CONTROL, REQUIRED_CASES, REQUIRED_CLEANUP_COUNTS, validateCleanupReadback, validatePhysicalAcceptanceGate, validatePhysicalEvidence, validatePhysicalEvidencePair } from '../acceptance/physical-evidence-validator.mjs';

const uuid = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

function passing(platform, n) {
  const cases = Object.fromEntries(REQUIRED_CASES.map(name => [name, { pass: true, notes: '' }]));
  return {
    ...PHYSICAL_ACCEPTANCE_CONTROL,
    platform,
    deviceModel: platform === 'ios' ? 'iPhone Test' : 'Android Test',
    osVersion: 'test-os',
    installMethod: 'physical-device test install',
    tester: 'tester',
    syntheticEmployeeId: uuid(n),
    performanceDeviceId: uuid(n + 10),
    testStartLocal: '2026-08-19T08:00:00-04:00',
    testEndLocal: '2026-08-19T09:30:00-04:00',
    cases,
    backgroundGps: { rowCount: 4, firstCapturedAt: '2026-08-19T12:10:00Z', lastCapturedAt: '2026-08-19T12:20:00Z' },
    offlineReplay: { queueBefore: 3, queueAfter: 0, duplicateClientPointIds: 0 },
    revocation: { revokedAt: '2026-08-19T12:40:00Z', postRevokeAcceptedGpsRows: 0 },
    finishDay: { finishedAt: '2026-08-19T13:15:00Z', postFinishCollectedGpsRows: 0 },
    sanitizedEvidenceJsonFiles: [`${platform}-evidence.json`],
    screenshots: [`${platform}-location.png`],
    finalDisposition: 'PASS',
  };
}

function cleanBackend() {
  return {
    projectRef: PHYSICAL_ACCEPTANCE_CONTROL.projectRef,
    verifiedAt: '2026-08-19T14:00:00Z',
    counts: Object.fromEntries(REQUIRED_CLEANUP_COUNTS.map(key => [key, 0])),
    securityAdvisorLints: 0,
  };
}

test('complete physical evidence plus zero cleanup passes the final gate', () => {
  const ios = passing('ios', 1);
  const android = passing('android', 2);
  const cleanup = cleanBackend();
  assert.equal(validatePhysicalEvidence(ios, 'ios').pass, true);
  assert.equal(validatePhysicalEvidence(android, 'android').pass, true);
  assert.equal(validatePhysicalEvidencePair(ios, android).pass, true);
  assert.equal(validateCleanupReadback(cleanup).pass, true);
  assert.equal(validatePhysicalAcceptanceGate(ios, android, cleanup).pass, true);
});

test('any unpassed A-L case blocks acceptance', () => {
  const doc = passing('ios', 1);
  doc.cases.H_server_revoke.pass = false;
  const result = validatePhysicalEvidence(doc, 'ios');
  assert.equal(result.pass, false);
  assert.ok(result.issues.some(v => v.code === 'CASE_NOT_PASS' && v.field.includes('H_server_revoke')));
});

test('post-revoke or post-finish location blocks acceptance', () => {
  const doc = passing('android', 2);
  doc.revocation.postRevokeAcceptedGpsRows = 1;
  doc.finishDay.postFinishCollectedGpsRows = 1;
  const result = validatePhysicalEvidence(doc, 'android');
  assert.equal(result.pass, false);
  assert.ok(result.issues.some(v => v.code === 'POST_REVOKE_WRITE_DETECTED'));
  assert.ok(result.issues.some(v => v.code === 'POST_FINISH_GPS_DETECTED'));
});

test('offline replay requires queued evidence, complete drain, and no duplicate IDs', () => {
  const doc = passing('android', 2);
  doc.offlineReplay = { queueBefore: 0, queueAfter: 2, duplicateClientPointIds: 1 };
  const result = validatePhysicalEvidence(doc, 'android');
  assert.equal(result.pass, false);
  assert.ok(result.issues.some(v => v.code === 'OFFLINE_QUEUE_NOT_PROVEN'));
  assert.ok(result.issues.some(v => v.code === 'OFFLINE_QUEUE_NOT_DRAINED'));
  assert.ok(result.issues.some(v => v.code === 'DUPLICATE_REPLAY_DETECTED'));
});

test('CI or simulator-shaped evidence cannot masquerade as physical PASS', () => {
  const doc = passing('ios', 1);
  doc.deviceModel = '';
  doc.installMethod = '';
  doc.screenshots = [];
  doc.backgroundGps.rowCount = 0;
  const result = validatePhysicalEvidence(doc, 'ios');
  assert.equal(result.pass, false);
  for (const code of ['MISSING_REQUIRED_VALUE', 'SCREENSHOT_EVIDENCE_MISSING', 'BACKGROUND_GPS_NOT_PROVEN']) {
    assert.ok(result.issues.some(v => v.code === code));
  }
});

test('iPhone and Android fixtures must remain independent', () => {
  const ios = passing('ios', 1);
  const android = passing('android', 2);
  android.syntheticEmployeeId = ios.syntheticEmployeeId;
  android.performanceDeviceId = ios.performanceDeviceId;
  const result = validatePhysicalEvidencePair(ios, android);
  assert.equal(result.pass, false);
  assert.ok(result.issues.some(v => v.code === 'PLATFORM_FIXTURE_COLLISION'));
  assert.ok(result.issues.some(v => v.code === 'DEVICE_ID_COLLISION'));
});

test('non-zero isolated backend cleanup blocks final physical acceptance', () => {
  const ios = passing('ios', 1);
  const android = passing('android', 2);
  const cleanup = cleanBackend();
  cleanup.counts.devices = 1;
  cleanup.counts.refreshTokens = 2;
  const result = validatePhysicalAcceptanceGate(ios, android, cleanup);
  assert.equal(result.pass, false);
  assert.ok(result.issues.some(v => v.code === 'CLEANUP_NOT_ZERO' && v.field === 'counts.devices'));
  assert.ok(result.issues.some(v => v.code === 'CLEANUP_NOT_ZERO' && v.field === 'counts.refreshTokens'));
});

test('repository privacy guard excludes raw physical evidence and private tokens', async () => {
  const fs = await import('node:fs');
  const ignore = fs.readFileSync('.gitignore', 'utf8');
  assert.match(ignore, /performance\/acceptance\/private-evidence\//);
  assert.match(ignore, /PRIVATE_TEST_TOKENS/);
});
