import fs from 'node:fs';

function read(path){return fs.readFileSync(path,'utf8');}
function requireToken(source,token,label){if(!source.includes(token))throw new Error(`${label} missing required control: ${token}`);}
function forbidToken(source,token,label){if(source.includes(token))throw new Error(`${label} contains forbidden control: ${token}`);}

const build=read('.github/workflows/build-canvass-v37.yml');
const unified=read('.github/workflows/validate-paradise-unified-release-v2.yml');
const cloudflare=read('.github/workflows/deploy-canvass-cloudflare.yml');
const preview=read('.github/workflows/publish-paradise-performance-web-preview.yml');
const full=read('.github/workflows/validate-paradise-university-v1.yml');
const hardening=read('.github/workflows/validate-paradise-university-hardening.yml');
const ux=read('.github/workflows/validate-paradise-university-ux-polish.yml');
const red=read('.github/workflows/validate-paradise-university-red-team.yml');
const premerge=read('.github/workflows/validate-paradise-public-pr.yml');

// Ruleset design intentionally permits GitHub Actions to perform narrowly controlled
// publication pushes. Keep every write surface explicit and fail closed on any new workflow.
// The field/unified workflows may advance the validated release only after their existing
// validation gates. The web-preview publisher may write only a dedicated non-production
// preview branch after rebuilding and validating the isolated Performance web output.
const workflowFiles=fs.readdirSync('.github/workflows').filter(name=>/\.ya?ml$/i.test(name)).sort();
const writeWorkflows=workflowFiles.filter(name=>/\bcontents:\s*write\b/.test(read(`.github/workflows/${name}`)));
const expectedWriteWorkflows=['build-canvass-v37.yml','publish-paradise-performance-web-preview.yml','validate-paradise-unified-release-v2.yml'];
if(JSON.stringify(writeWorkflows)!==JSON.stringify(expectedWriteWorkflows))throw new Error(`Unexpected GitHub Actions contents-write surface: ${writeWorkflows.join(', ')||'NONE'}`);
requireToken(cloudflare,'contents: read','manual Cloudflare deployment');
forbidToken(cloudflare,'contents: write','manual Cloudflare deployment');

// Non-production Paradise Performance web preview publisher.
requireToken(preview,'name: Publish Paradise Performance web interim preview','web preview publisher');
requireToken(preview,'branches:\n      - paradise-canvass-manager-public','web preview publisher trigger');
requireToken(preview,"- '.github/workflows/publish-paradise-performance-web-preview.yml'",'web preview publisher path scope');
requireToken(preview,'contents: write','web preview publisher permission');
requireToken(preview,"PREVIEW_BRANCH: 'paradise-performance-web-interim-preview'",'web preview publisher branch pin');
requireToken(preview,'node scripts/validate-paradise-performance-web-interim.mjs','web preview source validation');
requireToken(preview,'node --test performance/tests/performance-web-interim.test.mjs','web preview contract tests');
requireToken(preview,'node scripts/build-canvass-site.mjs','web preview controlled base build');
requireToken(preview,'node scripts/build-performance-web-site.mjs','web preview isolated build');
requireToken(preview,'node scripts/validate-paradise-performance-web-interim.mjs --built','web preview built validation');
requireToken(preview,'NOT EMPLOYEE-ROLLOUT AUTHORIZED','web preview status stamp');
requireToken(preview,'NOT A NATIVE GPS SUBSTITUTE','web preview location boundary');
requireToken(preview,'FIELD_BASELINE=78/76/2','web preview field baseline stamp');
requireToken(preview,'LOCATION_MODE=FOREGROUND_SAMPLE_ONLY','web preview location mode stamp');
requireToken(preview,'cp -R performance-web-dist/. /tmp/paradise-performance-web-preview/','web preview output-only publish');
requireToken(preview,'git checkout --orphan "$PREVIEW_BRANCH"','web preview orphan branch');
requireToken(preview,'git push --force origin HEAD:"$PREVIEW_BRANCH"','web preview dedicated force-push target');
requireToken(preview,"test \"${GITHUB_REF_NAME}\" = 'paradise-canvass-manager-public'",'web preview source branch guard');
forbidToken(preview,'refs/heads/paradise-canvass-manager-validated','web preview publisher');
forbidToken(preview,'latest.json','web preview publisher');
forbidToken(preview,'CLOUDFLARE','web preview publisher');
forbidToken(preview,'secrets.','web preview publisher');

for(const [label,source,group] of [
  ['full University validator',full,'paradise-university-v1-validation-${{ github.ref_name }}'],
  ['content hardening',hardening,'paradise-university-v1-hardening-${{ github.ref_name }}'],
  ['UX polish',ux,'paradise-university-ux-polish-validation-${{ github.ref_name }}'],
  ['adversarial red team',red,'paradise-university-red-team-validation-${{ github.ref_name }}']
]){
  requireToken(source,'branches: [agent/paradise-university-v1, paradise-canvass-manager-public]',label);
  requireToken(source,`group: ${group}`,label);
  requireToken(source,"if: github.actor != 'github-actions[bot]'",label);
  requireToken(source,'contents: read',label);
}

requireToken(build,'branches: [agent/paradise-university-v1, paradise-canvass-manager-public]','field release');
requireToken(build,'group: paradise-canvass-manager-public-validation-${{ github.ref_name }}','field release');
requireToken(build,"if: github.actor != 'github-actions[bot]' && github.ref_name == 'paradise-canvass-manager-public'",'field release');
requireToken(build,'contents: write','field release');
requireToken(build,'actions: read','field release');
requireToken(build,'head_sha=${GITHUB_SHA}','field release exact-SHA gate');
requireToken(build,'DEADLINE=$((SECONDS + 900))','field release bounded wait');
requireToken(build,"completed:success",'field release success gate');
requireToken(build,"A Paradise University release gate failed on this exact source SHA.",'field release failure gate');
requireToken(build,"Timed out waiting for exact-SHA Paradise University release gates.",'field release timeout gate');
requireToken(build,'REMOTE_SHA="$(git ls-remote origin refs/heads/paradise-canvass-manager-public | cut -f1)"','field release stale-head guard');
requireToken(build,'if [ "$REMOTE_SHA" != "$GITHUB_SHA" ]; then','field release stale-head guard');
requireToken(build,'git push origin "$VALIDATED_SHA:refs/heads/paradise-canvass-manager-validated"','validated branch advance');
for(const name of [
  'Validate Paradise University v1',
  'Validate Paradise University content hardening',
  'Validate Paradise University UX polish',
  'Validate Paradise University adversarial red team'
])requireToken(build,`'${name}'`,'field release required workflow set');
forbidToken(build,'--force','field release');
forbidToken(build,'-f origin','field release');

requireToken(unified,'name: Validate Paradise unified release v2','unified release v2');
requireToken(unified,'branches: [paradise-canvass-manager-public]','unified release v2 trigger');
requireToken(unified,'workflow_dispatch:','unified release v2 manual recovery trigger');
requireToken(unified,'group: paradise-unified-release-v2-${{ github.ref_name }}','unified release v2 concurrency');
requireToken(unified,"if: github.actor != 'github-actions[bot]' && github.ref_name == 'paradise-canvass-manager-public'",'unified release v2 recursion guard');
requireToken(unified,'contents: write','unified release v2 permissions');
requireToken(unified,'ref: ${{ github.sha }}','unified release v2 exact-SHA checkout');
for(const validator of [
  'scripts/validate-training-model-v1.mjs',
  'scripts/validate-practice-model-v2.mjs',
  'scripts/validate-training-hardening.mjs',
  'scripts/validate-training-reconciliation.mjs',
  'scripts/validate-deep-audit-controls.mjs',
  'scripts/validate-training-experience-v2.mjs',
  'scripts/validate-training-experience-v3.mjs',
  'scripts/validate-release-workflow-controls.mjs',
  'scripts/validate-field-baseline-v1.mjs',
  'scripts/validate-training-release-isolation.mjs'
])requireToken(unified,validator,'unified release v2 validator coverage');
for(const test of [
  'tests/mobile-regression.spec.js',
  'tests/offline-regression.spec.js',
  'tests/training-experience-v2.spec.js',
  'tests/training-experience-v3.spec.js',
  'tests/training-smoke.spec.js',
  'tests/training-ux-polish.spec.js',
  'tests/matrix-smoke.spec.js',
  'tests/training-red-team-v1.spec.js',
  'tests/service-worker-hardening-v1.spec.js',
  'tests/progress-transfer-recovery-v1.spec.js'
])requireToken(unified,test,'unified release v2 test coverage');
requireToken(unified,'a98b8badf4c3df616fb091eb32ff85f70682f226e4fcd55591f3784b37abe200','unified release v2 dataset pin');
requireToken(unified,'REMOTE_SHA="$(git ls-remote origin refs/heads/paradise-canvass-manager-public | cut -f1)"','unified release v2 stale-head guard');
requireToken(unified,'if [ "$REMOTE_SHA" != "$GITHUB_SHA" ]; then','unified release v2 stale-head guard');
requireToken(unified,'git push origin "$VALIDATED_SHA:refs/heads/paradise-canvass-manager-validated"','unified release v2 validated branch advance');
forbidToken(unified,'--force','unified release v2');
forbidToken(unified,'-f origin','unified release v2');

requireToken(premerge,'name: Validate Paradise public premerge gate','public premerge workflow');
requireToken(premerge,'pull_request:','public premerge trigger');
requireToken(premerge,'branches: [paradise-canvass-manager-public]','public premerge target');
requireToken(premerge,'branches: [agent/paradise-university-v1]','public premerge parser-check trigger');
requireToken(premerge,'group: paradise-public-premerge-${{ github.event.pull_request.number || github.ref_name }}','public premerge concurrency');
requireToken(premerge,'name: Paradise public premerge gate','public premerge required-check name');
requireToken(premerge,"if: github.event_name == 'pull_request'",'public premerge execution boundary');
requireToken(premerge,'contents: read','public premerge permissions');
requireToken(premerge,'fetch-depth: 0','public premerge release-isolation history');
for(const validator of [
  'scripts/validate-training-model-v1.mjs',
  'scripts/validate-practice-model-v2.mjs',
  'scripts/validate-training-hardening.mjs',
  'scripts/validate-training-reconciliation.mjs',
  'scripts/validate-deep-audit-controls.mjs',
  'scripts/validate-training-experience-v2.mjs',
  'scripts/validate-training-experience-v3.mjs',
  'scripts/validate-release-workflow-controls.mjs',
  'scripts/validate-field-baseline-v1.mjs',
  'scripts/validate-training-release-isolation.mjs'
])requireToken(premerge,validator,'public premerge validator coverage');
for(const test of [
  'tests/mobile-regression.spec.js',
  'tests/offline-regression.spec.js',
  'tests/training-experience-v2.spec.js',
  'tests/training-experience-v3.spec.js',
  'tests/training-smoke.spec.js',
  'tests/training-ux-polish.spec.js',
  'tests/matrix-smoke.spec.js',
  'tests/training-red-team-v1.spec.js',
  'tests/service-worker-hardening-v1.spec.js',
  'tests/progress-transfer-recovery-v1.spec.js'
])requireToken(premerge,test,'public premerge test coverage');
requireToken(premerge,'--project=webkit-iphone --retries=0 --reporter=github','public premerge iPhone gate');
requireToken(premerge,'tests/matrix-smoke.spec.js --retries=0 --reporter=github','public premerge device matrix');
requireToken(premerge,'tests/training-red-team-v1.spec.js tests/service-worker-hardening-v1.spec.js tests/progress-transfer-recovery-v1.spec.js --retries=0 --reporter=github','public premerge adversarial matrix');
forbidToken(premerge,'pull_request_target:','public premerge workflow');
forbidToken(premerge,'contents: write','public premerge workflow');
forbidToken(premerge,'git push','public premerge workflow');
forbidToken(premerge,'secrets.','public premerge workflow');

console.log({
  status:'PASS',
  universityWorkflows:4,
  publicPremergeProtectionGate:true,
  publicPremergeRequiredCheck:'Paradise public premerge gate',
  publicSameShaGate:true,
  selfContainedUnifiedReleaseV2:true,
  boundedWaitSeconds:900,
  stalePublicHeadGuard:true,
  validatedBranchNormalPush:true,
  branchScopedConcurrency:true,
  botPublicationRecursionGuard:true,
  webPreviewPublisher:true,
  webPreviewBranch:'paradise-performance-web-interim-preview',
  workflowCount:workflowFiles.length,
  contentsWriteWorkflows:writeWorkflows,
  premergeUsesSecrets:false
});