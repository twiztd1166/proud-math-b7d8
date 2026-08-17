import fs from 'node:fs';

function read(path){return fs.readFileSync(path,'utf8');}
function requireToken(source,token,label){if(!source.includes(token))throw new Error(`${label} missing required control: ${token}`);}
function forbidToken(source,token,label){if(source.includes(token))throw new Error(`${label} contains forbidden control: ${token}`);}

const build=read('.github/workflows/build-canvass-v37.yml');
const full=read('.github/workflows/validate-paradise-university-v1.yml');
const hardening=read('.github/workflows/validate-paradise-university-hardening.yml');
const ux=read('.github/workflows/validate-paradise-university-ux-polish.yml');
const red=read('.github/workflows/validate-paradise-university-red-team.yml');
const premerge=read('.github/workflows/validate-paradise-public-pr.yml');

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

console.log({
  status:'PASS',
  universityWorkflows:4,
  publicPremergeProtectionGate:true,
  publicPremergeRequiredCheck:'Paradise public premerge gate',
  publicSameShaGate:true,
  boundedWaitSeconds:900,
  stalePublicHeadGuard:true,
  validatedBranchNormalPush:true,
  branchScopedConcurrency:true,
  botPublicationRecursionGuard:true
});
