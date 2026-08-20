import fs from 'node:fs';

const metadataPath = 'store/paradise-performance/store-metadata-v1.json';
const screenshotPlanPath = 'store/paradise-performance/store-screenshot-plan-v1.json';
const finalEvidencePlanPath = 'store/paradise-performance/store-final-binary-evidence-plan-v1.json';
const privacyDraftPath = 'docs/PARADISE_PERFORMANCE_EMPLOYEE_APP_PRIVACY_NOTICE_DRAFT_2026-08-19.md';
const runbookPath = 'docs/PARADISE_NATIVE_STORE_SUBMISSION_RUNBOOK_V1.md';

for (const path of [metadataPath, screenshotPlanPath, finalEvidencePlanPath, privacyDraftPath, runbookPath]) {
  if (!fs.existsSync(path)) throw new Error(`Missing required store submission file: ${path}`);
}

const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
const screenshotPlan = JSON.parse(fs.readFileSync(screenshotPlanPath, 'utf8'));
const finalEvidencePlan = JSON.parse(fs.readFileSync(finalEvidencePlanPath, 'utf8'));
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
assert(metadata.apple.deviceFamily === 'IPHONE_ONLY', 'Apple store v1 device family must remain iPhone-only');
assert(metadata.apple.targetedDeviceFamilyBuildSetting === '1', 'Apple TARGETED_DEVICE_FAMILY must remain 1');
assert(metadata.apple.ipadScreenshotsRequiredByCurrentBuild === false, 'iPad screenshots must remain out of scope only while the build is iPhone-only');
assert(metadata.apple.appleSiliconMacAvailability === 'OPT_OUT_UNLESS_SEPARATELY_VALIDATED', 'Apple Silicon Mac availability must fail closed');
assert(metadata.apple.testFlightDependency === false, 'Submission package must not add a TestFlight dependency');
assert(metadata.apple.unlistedRequestSequence.includes('Submit the final app to App Review'), 'Apple unlisted sequence must preserve App Review before the unlisted request');
assert(metadata.apple.unlistedRequestSequence.includes('beta/prerelease'), 'Apple unlisted sequence must preserve the no-beta request boundary');
assert(metadata.googlePlay.track === 'INTERNAL_TESTING', 'Android initial release must remain Internal testing');
assert(metadata.googlePlay.maxInitialTesters === 100, 'Internal testing control must remain 100 testers');

assert(metadata.branding?.nativeIconPackageStatus === 'VALIDATED_VISUALLY_APPROVED_AND_PUBLISHED_IN_STABLE_SOURCE', 'Native icon package must remain recorded as validated and visually approved');
assert(metadata.branding?.controlledSquareIconSource?.sha256 === '75e563729b9d0771335930a9e0c97eed3c2f37dd3b4a855f998201a8009f0c13', 'Controlled Paradise icon source SHA drift');
assert(metadata.screenshots?.plan === screenshotPlanPath, 'Store metadata must point to the controlled screenshot plan');
assert(metadata.screenshots?.status === 'CONTROLLED_CAPTURE_PLAN_READY_FINAL_CAPTURE_BLOCKED_ON_SIGNED_CANDIDATE', 'Screenshot status must remain blocked on final signed capture');
assert(metadata.screenshots?.states === 6, 'Store metadata must preserve six screenshot states');
assert(!metadata.hardBlockersBeforeSubmission.some(value => value.includes('app icon')), 'Validated app icon must not remain listed as a hard blocker');
assert(metadata.hardBlockersBeforeSubmission.some(value => value.includes('signed-build screenshot')), 'Final signed-build screenshots must remain a hard blocker');

assert(screenshotPlan.status === 'CONTROLLED_CAPTURE_PLAN_NOT_YET_CAPTURED', 'Screenshot plan must not claim final capture');
assert(screenshotPlan.apple?.deviceFamily === 'IPHONE_ONLY', 'Screenshot plan must remain iPhone-only');
assert(screenshotPlan.apple?.targetPixels?.width === 1320 && screenshotPlan.apple?.targetPixels?.height === 2868, 'Apple screenshot target drift');
assert(screenshotPlan.googlePlay?.targetPixels?.width === 1080 && screenshotPlan.googlePlay?.targetPixels?.height === 1920, 'Google Play screenshot target drift');
assert(Array.isArray(screenshotPlan.story) && screenshotPlan.story.length === 6, 'Screenshot story must remain six states');
assert(screenshotPlan.captureAuthority?.finalScreenshotsRequireSignedCandidate === true, 'Final screenshots must remain blocked on the signed candidate');
assert(screenshotPlan.captureAuthority?.syntheticReviewDataRequired === true, 'Synthetic review data must remain required');
assert(screenshotPlan.captureAuthority?.realProductionEmployeeOrCustomerDataAllowed === false, 'Production PII must remain forbidden in screenshots');
assert(screenshotPlan.provenance?.runtimeBehaviorBaselineEnteringEvidencePlan === '662e0716fda60003bac3800712c8d2910c3aa10b', 'Screenshot runtime-behavior baseline drift');
assert(screenshotPlan.provenance?.releaseSourceAtPlanAuthoring === 'c84bc51d9beb1cda0e27f92f746b5219997e871c', 'Screenshot plan authoring release-source drift');
assert(screenshotPlan.provenance?.publicMetadataAtPlanAuthoring === 'efc7fa075bb820b7796d7fb99e82864a36023c35', 'Screenshot plan authoring metadata drift');
assert(screenshotPlan.provenance?.currentReleaseSourceAuthorityAtCapture?.includes('paradise-canvass-manager-validated'), 'Screenshot capture must resolve the current validated release-source');
assert(screenshotPlan.provenance?.currentReleaseSourceAuthorityAtCapture?.includes('latest.json'), 'Screenshot capture must resolve latest.json');
assert(!('validatedApplicationBaseline' in screenshotPlan), 'Screenshot plan must not reintroduce a self-referential current application SHA field');
assert(!('publicMetadataBaseline' in screenshotPlan), 'Screenshot plan must not reintroduce a self-referential current metadata SHA field');
assert(screenshotPlan.preCaptureReadback?.some(value => value.includes('signed-candidate artifact SHA-256')), 'Screenshot plan must bind capture to the exact signed artifact');

assert(finalEvidencePlan.status === 'CONTROLLED_FINAL_BINARY_EVIDENCE_PLAN_NOT_YET_CAPTURED', 'Final-binary evidence plan must remain explicitly not captured');
assert(finalEvidencePlan.app?.bundleId === 'com.paradiseexteriors.performance', 'Final-binary evidence app identity drift');
assert(finalEvidencePlan.app?.version === '1.0.0' && finalEvidencePlan.app?.build === '1', 'Final-binary evidence version/build drift');
assert(finalEvidencePlan.provenance?.runtimeBehaviorBaselineEnteringEvidencePlan === '662e0716fda60003bac3800712c8d2910c3aa10b', 'Final-binary evidence runtime baseline drift');
assert(finalEvidencePlan.provenance?.releaseSourceAtPlanAuthoring === 'c84bc51d9beb1cda0e27f92f746b5219997e871c', 'Final-binary evidence authoring release-source drift');
assert(finalEvidencePlan.provenance?.publicMetadataAtPlanAuthoring === 'efc7fa075bb820b7796d7fb99e82864a36023c35', 'Final-binary evidence authoring metadata drift');
assert(finalEvidencePlan.provenance?.currentReleaseSourceAuthorityAtCapture?.includes('paradise-canvass-manager-validated'), 'Final evidence capture must resolve the current validated branch');
assert(finalEvidencePlan.provenance?.currentReleaseSourceAuthorityAtCapture?.includes('latest.json'), 'Final evidence capture must resolve latest.json');
assert(finalEvidencePlan.captureAuthority?.finalProductionSignedCandidateRequired === true, 'Final evidence must require a production-signed candidate');
assert(finalEvidencePlan.captureAuthority?.unsignedCiCandidateMaySatisfyFinalEvidence === false, 'Unsigned CI candidates must not satisfy final evidence');
assert(finalEvidencePlan.captureAuthority?.simulatorOnlyMaySatisfyFinalEvidence === false, 'Simulator-only evidence must not satisfy final evidence');
assert(finalEvidencePlan.captureAuthority?.syntheticReviewDataRequired === true, 'Final evidence must require synthetic review data');
assert(finalEvidencePlan.captureAuthority?.productionEmployeeOrCustomerDataAllowed === false, 'Final evidence must forbid production employee/customer data');
assert(finalEvidencePlan.captureAuthority?.credentialsOrSigningSecretsMayBeStoredInRepository === false, 'Final evidence must forbid repository credential/signing-secret storage');
assert(finalEvidencePlan.captureAuthority?.physicalAcceptanceWaiverDoesNotConvertEvidenceCaptureToPass === true, 'Evidence capture must not convert the hardware waiver into PASS');
assert(finalEvidencePlan.signedCandidateIdentity?.status === 'NOT_CAPTURED', 'Signed-candidate identity must remain not captured until real evidence exists');
assert(finalEvidencePlan.appleFinalBinaryReadback?.status === 'NOT_CAPTURED', 'Apple final-binary readback must remain not captured');
assert(finalEvidencePlan.androidFinalBinaryReadback?.status === 'NOT_CAPTURED', 'Android final-binary readback must remain not captured');
assert(finalEvidencePlan.screenshotEvidence?.status === 'NOT_CAPTURED', 'Screenshot evidence register must remain not captured');
assert(finalEvidencePlan.reviewAccessEvidence?.status?.startsWith('BLOCKED_'), 'Review-access evidence must remain blocked until operational E2E exists');
assert(finalEvidencePlan.artifactRegister?.status === 'EMPTY_UNTIL_CAPTURE', 'Final evidence artifact register must remain empty until capture');

const fgs = finalEvidencePlan.googlePlayForegroundServiceDemonstration;
assert(fgs?.status === 'NOT_CAPTURED', 'Google Play FGS demonstration must remain not captured');
assert(fgs?.videoUrl?.startsWith('BLOCKED_'), 'Google Play FGS video URL must fail closed until real final-binary evidence exists');
assert(Array.isArray(fgs?.requiredSequence) && fgs.requiredSequence.length === 8, 'Google Play FGS evidence must preserve the controlled eight-step sequence');
const fgsStepIds = fgs.requiredSequence.map(step => step.id);
for (const requiredStep of ['pre-shift', 'user-start', 'active-notification', 'background', 'lock-unlock', 'return-active', 'finish-day', 'service-stopped']) {
  assert(fgsStepIds.includes(requiredStep), `Missing Google Play FGS demonstration step: ${requiredStep}`);
}
assert(fgs.requiredSequence.find(step => step.id === 'user-start')?.proof.includes('Start My Day'), 'FGS evidence must prove employee foreground initiation');
assert(fgs.requiredSequence.find(step => step.id === 'active-notification')?.proof.includes('foreground-service notification'), 'FGS evidence must prove the visible active-shift notification');
assert(fgs.requiredSequence.find(step => step.id === 'background')?.proof.includes('Background the app'), 'FGS evidence must prove the active service while the app is backgrounded');
assert(fgs.requiredSequence.find(step => step.id === 'finish-day')?.proof.includes('Finish Day'), 'FGS evidence must prove employee Finish Day');
assert(fgs.requiredSequence.find(step => step.id === 'service-stopped')?.proof.includes('notification is removed'), 'FGS evidence must prove the foreground service stops');
assert(finalEvidencePlan.androidFinalBinaryReadback?.required?.some(value => value.includes('does not request ACCESS_BACKGROUND_LOCATION')), 'Android final-binary evidence must prove no ACCESS_BACKGROUND_LOCATION');
assert(finalEvidencePlan.androidFinalBinaryReadback?.required?.some(value => value.includes('FOREGROUND_SERVICE_LOCATION')), 'Android final-binary evidence must prove FOREGROUND_SERVICE_LOCATION');
assert(finalEvidencePlan.androidFinalBinaryReadback?.required?.some(value => value.includes('foregroundServiceType=location')), 'Android final-binary evidence must prove foregroundServiceType=location');
assert(finalEvidencePlan.androidFinalBinaryReadback?.required?.some(value => value.includes('target SDK remains API 36')), 'Android final-binary evidence must prove target SDK 36');
assert(finalEvidencePlan.screenshotEvidence?.plan === screenshotPlanPath, 'Final-binary evidence must reference the controlled screenshot plan');

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
assert(/apps exclusively active on the Internal Testing track are exempt from inclusion in the Data Safety section/i.test(runbook), 'Runbook must preserve current Google Internal Testing Data Safety exemption');
assert(runbook.includes('Data Safety is **not a hard blocker solely to that Internal-Testing-only release**'), 'Runbook must not reintroduce Data Safety as a hard blocker to initial Internal Testing');
assert(runbook.includes('Performance Today idle/current-workday state'), 'Screenshot plan must use the real Performance Today v1 surface');
assert(runbook.includes('Lookup field/legal instruction view'), 'Screenshot plan must preserve Lookup as an independently visible field authority');
assert(runbook.includes('Finish Day / completed-workday state'), 'Screenshot plan must use the real Finish Day v1 surface');
assert(!runbook.includes('Performance/progress view showing only configured/authorized information'), 'Screenshot plan must not imply an unavailable generic KPI/performance screen');

const serialized = JSON.stringify(metadata) + '\n' + JSON.stringify(screenshotPlan) + '\n' + JSON.stringify(finalEvidencePlan) + '\n' + privacyDraft + '\n' + runbook;
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
