import fs from 'node:fs';

const metadataPath = 'store/paradise-performance/store-metadata-v1.json';
const privacyDraftPath = 'docs/PARADISE_PERFORMANCE_EMPLOYEE_APP_PRIVACY_NOTICE_DRAFT_2026-08-19.md';
const runbookPath = 'docs/PARADISE_NATIVE_STORE_SUBMISSION_RUNBOOK_V1.md';

for (const path of [metadataPath, privacyDraftPath, runbookPath]) {
  if (!fs.existsSync(path)) throw new Error(`Missing required store submission file: ${path}`);
}

const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
const privacyDraft = fs.readFileSync(privacyDraftPath, 'utf8');
const runbook = fs.readFileSync(runbookPath, 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertLength(label, value, max) {
  assert(typeof value === 'string' && value.length > 0, `${label} must be non-empty`);
  assert(value.length <= max, `${label} exceeds ${max} characters: ${value.length}`);
}

assert(metadata.status === 'DRAFT_SUBMISSION_PACKAGE_NOT_SUBMITTED', 'Submission package must remain explicitly not submitted');
assert(metadata.app.name === 'Paradise Performance', 'Unexpected app name');
assert(metadata.app.bundleId === 'com.paradiseexteriors.performance', 'Unexpected bundle/application ID');
assert(metadata.app.version === '1.0.0', 'Unexpected store version baseline');
assert(metadata.app.build === '1', 'Unexpected store build baseline');

assertLength('Apple app name', metadata.app.name, 30);
assertLength('Apple subtitle', metadata.apple.subtitle, 30);
assertLength('Apple promotional text', metadata.apple.promotionalText, 170);
assertLength('Apple keywords', metadata.apple.keywords, 100);
assertLength('Google Play app name', metadata.app.name, 30);
assertLength('Google Play short description', metadata.googlePlay.shortDescription, 80);
assertLength('Apple description', metadata.apple.description, 4000);
assertLength('Google Play full description', metadata.googlePlay.fullDescription, 4000);

assert(metadata.apple.distribution === 'UNLISTED_APP_STORE', 'iPhone distribution must remain unlisted App Store');
assert(metadata.apple.testFlightDependency === false, 'Submission package must not add a TestFlight dependency');
assert(metadata.googlePlay.track === 'INTERNAL_TESTING', 'Android initial release must remain Internal testing');
assert(metadata.googlePlay.maxInitialTesters === 100, 'Internal testing control must remain 100 testers');

assert(metadata.app.privacyPolicyUrl.startsWith('BLOCKED_'), 'Do not silently promote the current website privacy page to final app privacy policy');
assert(metadata.apple.reviewAccount.startsWith('BLOCKED_'), 'Apple review account must fail closed until configured');
assert(metadata.googlePlay.appAccess.startsWith('BLOCKED_'), 'Google Play review access must fail closed until configured');
assert(metadata.googlePlay.foregroundServiceDeclaration.video.startsWith('BLOCKED_'), 'Foreground-service video must fail closed until a real final-binary video exists');

assert(metadata.apple.privacyDraft.tracking === false, 'Current controlled privacy intent must remain no advertising/cross-company tracking');
assert(metadata.googlePlay.dataSafetyDraft.sharedForAdvertising === false, 'Google Data Safety draft must remain no advertising sharing');
assert(metadata.googlePlay.dataSafetyDraft.sold === false, 'Google Data Safety draft must remain no sale of employee data');

assert(privacyDraft.includes('DRAFT / NOT LEGALLY APPROVED / DO NOT PUBLISH AS FINAL'), 'Privacy notice must remain visibly draft');
assert(privacyDraft.includes('FINAL RETENTION POLICY NOT YET APPROVED'), 'Privacy notice must preserve unresolved retention blocker');
assert(privacyDraft.includes('COUNSEL/HR APPROVAL REQUIRED'), 'Privacy notice must preserve workforce/legal approval blocker');
assert(runbook.includes('No TestFlight dependency'), 'Runbook must preserve no-TestFlight decision');
assert(runbook.includes('Google Play Internal Testing'), 'Runbook must preserve Android private testing decision');
assert(runbook.includes('Unlisted App Store'), 'Runbook must preserve iPhone unlisted decision');
assert(runbook.includes('Do not use the current live page as the final store privacy-policy URL'), 'Runbook must preserve privacy-page blocker');

const serialized = JSON.stringify(metadata) + '\n' + privacyDraft + '\n' + runbook;
const forbiddenSecretPatterns = [
  /BEGIN PRIVATE KEY/i,
  /BEGIN CERTIFICATE/i,
  /\.p12\b/i,
  /\.jks\b/i,
  /keystorePassword\s*[:=]\s*[^\s\[]+/i,
  /APPLE_API_KEY\s*[:=]\s*[^\s\[]+/i,
  /GOOGLE_PLAY_SERVICE_ACCOUNT\s*[:=]\s*[^\s\[]+/i,
];
for (const pattern of forbiddenSecretPatterns) {
  assert(!pattern.test(serialized), `Potential signing/store secret found: ${pattern}`);
}

console.log('Paradise store submission package controls: PASS');
