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
assert(metadata.apple.unlistedRequestSequence.includes('Submit the final app to App Review'), 'Apple unlisted sequence must preserve App Review before the unlisted request');
assert(metadata.apple.unlistedRequestSequence.includes('beta/prerelease'), 'Apple unlisted sequence must preserve the no-beta request boundary');
assert(metadata.googlePlay.track === 'INTERNAL_TESTING', 'Android initial release must remain Internal testing');
assert(metadata.googlePlay.maxInitialTesters === 100, 'Internal testing control must remain 100 testers');

assert(metadata.app.privacyPolicyUrl.startsWith('BLOCKED_'), 'Do not silently promote the current website privacy page to final app privacy policy');
assert(metadata.apple.reviewAccount.startsWith('BLOCKED_'), 'Apple review account must fail closed until configured');
assert(metadata.googlePlay.appAccess.startsWith('BLOCKED_'), 'Google Play review access must fail closed until configured');
assert(metadata.googlePlay.foregroundServiceDeclaration.video.startsWith('BLOCKED_'), 'Foreground-service video must fail closed until a real final-binary video exists');

assert(metadata.apple.privacyDraft.tracking === false, 'Current controlled privacy intent must remain no advertising/cross-company tracking');
assert(metadata.apple.privacyDraft.linkedToUser === true, 'Current operational privacy draft must remain linked to the employee/user');
assert(metadata.apple.privacyDraft.purpose === 'App Functionality', 'Apple privacy purpose must remain App Functionality');
assert(metadata.apple.privacyDraft.finalAnswersRequireReview === true, 'Apple privacy answers must remain explicitly draft/review-required');
assert(metadata.apple.privacyDraft.dataCollected.includes('Precise Location'), 'Apple draft must disclose Precise Location');
assert(metadata.apple.privacyDraft.dataCollected.includes('Coarse Location'), 'Apple draft must disclose Coarse Location');
assert(metadata.apple.privacyDraft.dataCollected.includes('User ID'), 'Apple draft must disclose User ID');
assert(metadata.apple.privacyDraft.dataCollected.includes('Device ID'), 'Apple draft must disclose Device ID');
assert(metadata.apple.privacyDraft.dataCollected.some(value => value.startsWith('Other Data Types')), 'Apple draft must classify residual operational shift/workday evidence as Other Data Types');
assert(!metadata.apple.privacyDraft.dataCollected.some(value => value.includes('Product Interaction')), 'Do not classify operational shift/workday evidence as Apple Product Interaction without retained UI-interaction telemetry');
assert(metadata.apple.privacyDraft.taxonomyNote.includes('launches, taps, clicks, scrolling and views'), 'Apple taxonomy note must preserve why Product Interaction is not used for operational workday evidence');

assert(metadata.googlePlay.dataSafetyDraft.requiredForCurrentInitialInternalTestingTrack === false, 'Current Internal Testing-only release must preserve Google Data Safety exemption status');
assert(metadata.googlePlay.dataSafetyDraft.currentTrackNote.includes('exempt from inclusion in the Data Safety section'), 'Google current-track note must preserve Internal Testing Data Safety exemption');
assert(metadata.googlePlay.dataSafetyDraft.sharedForAdvertising === false, 'Google Data Safety draft must remain no advertising sharing');
assert(metadata.googlePlay.dataSafetyDraft.sold === false, 'Google Data Safety draft must remain no sale of employee data');
assert(metadata.googlePlay.dataSafetyDraft.finalAnswersRequireReview === true, 'Google Data Safety draft must remain review-required for any later applicable distribution mode');
assert(metadata.googlePlay.dataSafetyDraft.dataCollected.includes('Location'), 'Google draft must disclose Location');
assert(metadata.googlePlay.dataSafetyDraft.dataCollected.includes('User IDs'), 'Google draft must disclose User IDs');
assert(metadata.googlePlay.dataSafetyDraft.dataCollected.includes('Device or other IDs'), 'Google draft must disclose Device or other IDs');
assert(metadata.googlePlay.dataSafetyDraft.dataCollected.some(value => value.startsWith('App activity > Other actions')), 'Google draft must classify retained Start/Finish workday actions under App activity > Other actions');
assert(metadata.googlePlay.dataSafetyDraft.taxonomyNote.includes('Start/Finish workday actions'), 'Google taxonomy note must preserve the operational-action boundary');
assert(!metadata.hardBlockersBeforeSubmission.some(value => value.includes('Google Play Data Safety')), 'Google Data Safety must not be labeled a hard blocker to the current Internal-Testing-only release');
assert(metadata.conditionalBlockersBeforeBroaderDistribution.some(value => value.includes('Google Play Data Safety')), 'Google Data Safety must remain a conditional blocker for later distribution modes where required');

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
