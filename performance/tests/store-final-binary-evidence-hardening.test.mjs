import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const planPath = 'store/paradise-performance/store-final-binary-evidence-plan-v1.json';

function includesRequired(items, fragment) {
  return Array.isArray(items) && items.some(value => String(value).includes(fragment));
}

test('final-binary evidence plan preserves artifact-derived OS and iOS privacy readbacks', () => {
  const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));

  assert.equal(plan.status, 'CONTROLLED_FINAL_BINARY_EVIDENCE_PLAN_NOT_YET_CAPTURED');
  assert.equal(plan.appleFinalBinaryReadback?.status, 'NOT_CAPTURED');
  assert.equal(plan.androidFinalBinaryReadback?.status, 'NOT_CAPTURED');

  assert.ok(
    includesRequired(plan.appleFinalBinaryReadback?.required, 'minimum supported iOS version / deployment target'),
    'Apple final evidence must record the actual signed-candidate minimum iOS/deployment target',
  );
  assert.ok(
    includesRequired(plan.appleFinalBinaryReadback?.required, 'NSLocationWhenInUseUsageDescription'),
    'Apple final evidence must read back the exact location usage description',
  );
  assert.ok(
    includesRequired(plan.appleFinalBinaryReadback?.required, 'UIBackgroundModes'),
    'Apple final evidence must read back UIBackgroundModes',
  );
  assert.ok(
    includesRequired(plan.androidFinalBinaryReadback?.required, 'minSdkVersion'),
    'Android final evidence must record the actual signed-candidate minSdkVersion',
  );
  assert.ok(
    includesRequired(plan.androidFinalBinaryReadback?.required, 'POST_NOTIFICATIONS'),
    'Android final evidence must preserve POST_NOTIFICATIONS readback',
  );
  assert.ok(
    includesRequired(plan.googlePlayForegroundServiceDemonstration?.separateTechnicalReadback, 'minSdkVersion'),
    'Google FGS technical readback must record minSdkVersion',
  );
});

test('final signed-candidate dependency, secret, and provider evidence remains fail-closed', () => {
  const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  const evidence = plan.signedCandidateSecurityAndDependencyEvidence;

  assert.equal(evidence?.status, 'NOT_CAPTURED');
  assert.ok(includesRequired(evidence?.requiredPerPlatform, 'SDK, native framework/library, and packaged dependency inventory'));
  assert.ok(includesRequired(evidence?.requiredPerPlatform, 'secret scan'));
  assert.ok(includesRequired(evidence?.requiredPerPlatform, 'provider/network-destination review'));
  assert.ok(includesRequired(evidence?.requiredPerPlatform, 'zero-vulnerability'));
  assert.ok(includesRequired(evidence?.requiredPerPlatform, 'exact signed artifact SHA-256'));
  assert.match(String(evidence?.failureRule || ''), /keep this section NOT_CAPTURED/);

  assert.equal(plan.captureAuthority?.finalProductionSignedCandidateRequired, true);
  assert.equal(plan.captureAuthority?.unsignedCiCandidateMaySatisfyFinalEvidence, false);
  assert.equal(plan.captureAuthority?.simulatorOnlyMaySatisfyFinalEvidence, false);
});
