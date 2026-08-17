import {execFileSync} from 'node:child_process';
import fs from 'node:fs';

const BASE='5e7efc40de524bef0e63c76595c3c518925888b9';
const immutable=[
  'controlled-register-source.json',
  'plain-data.js',
  'register-manifest.json',
  'core-v2.js',
  'lookup-v2.js',
  'browse-v3.js',
  'release-v2a.js',
  'release-v2b.js',
  'history-v2.js',
  'field-v36.js',
  'field-v37.js',
  'style.css',
  'style-v2.css',
  'pwa-v3.css',
  'hardening-v3-2.css'
];
function show(ref,path){return execFileSync('git',['show',`${ref}:${path}`],{encoding:'utf8'});}
const changed=[];
for(const path of immutable){
  const base=show(BASE,path),current=fs.readFileSync(path,'utf8');
  if(base!==current)changed.push(path);
}
if(changed.length)throw new Error(`Training release modified validated field/data files: ${changed.join(', ')}`);

// index.html is an intentional additive Training-shell exception. Remove only the exact
// approved Training CSS, nav button, and scripts, then require byte identity to field base.
const baseIndex=show(BASE,'index.html');
let normalizedIndex=fs.readFileSync('index.html','utf8');
const approvedIndexAdditions=[
  '<link rel="stylesheet" href="training-v1.css">',
  '<link rel="stylesheet" href="training-player-v1.css">',
  '<link rel="stylesheet" href="training-readiness-v1.css">',
  '<link rel="stylesheet" href="training-practice-v1.css">',
  '<link rel="stylesheet" href="training-checks-v1.css">',
  '<link rel="stylesheet" href="training-more-v1.css">',
  '<link rel="stylesheet" href="training-experience-v3.css">',
  '<link rel="stylesheet" href="training-daily-v1.css">',
  '<button id="nTrain"><b>▶</b>Training</button>',
  '<script src="training-content-v1.js"></script>',
  '<script src="training-content-sourcefix-v1.js"></script>',
  '<script src="training-manager-v1-data.js"></script>',
  '<script src="training-sales-v1-data.js"></script>',
  '<script src="training-media-expanded-v1.js"></script>',
  '<script src="training-media-reconciliation-v1.js"></script>',
  '<script src="training-governance-v1.js"></script>',
  '<script src="training-v1.js"></script>',
  '<script src="training-media-rights-v1.js"></script>',
  '<script src="training-media-ui-v1.js"></script>',
  '<script src="training-manager-v1-ui.js"></script>',
  '<script src="training-currentness-v1.js"></script>',
  '<script src="training-sales-v1-ui.js"></script>',
  '<script src="training-sales-closing-v1.js"></script>',
  '<script src="training-readiness-v1.js"></script>',
  '<script src="training-practice-data-v2.js"></script>',
  '<script src="training-practice-v1.js"></script>',
  '<script src="training-checks-v1.js"></script>',
  '<script src="training-progress-state-v1.js"></script>',
  '<script src="training-player-v1.js"></script>',
  '<script src="training-media-player-gate-v1.js"></script>',
  '<script src="training-more-v1.js"></script>',
  '<script src="training-more-rights-gate-v1.js"></script>',
  '<script src="training-deep-audit-fixes-v1.js"></script>',
  '<script src="training-experience-v2.js"></script>',
  '<script src="training-ux-polish-v1.js"></script>',
  '<script src="training-experience-v3.js"></script>',
  '<script src="training-daily-v1.js"></script>',
  '<script src="training-storage-hardening-v1.js"></script>'
];
for(const token of approvedIndexAdditions){
  const count=normalizedIndex.split(token).length-1;
  if(count!==1)throw new Error(`Expected exactly one approved Training index addition: ${token}`);
  normalizedIndex=normalizedIndex.replace(token,'');
}
if(normalizedIndex!==baseIndex)throw new Error('index.html contains changes beyond the exact approved additive Training shell');

// boot-v2.js is an intentional shell/router exception: Training needs one nav element,
// one nav-state toggle, one render branch, and one click handler. Strip only those four
// additions and require the remainder to be byte-identical to the validated v3.12 boot.
const baseBoot=show(BASE,'boot-v2.js');
const currentBoot=fs.readFileSync('boot-v2.js','utf8');
for(const token of [
  "NT=document.getElementById('nTrain')",
  "NT.classList.toggle('on',view==='training')",
  "if(view==='training')return renderTraining()",
  "NT.onclick=()=>{puPage='home';setView('training')}"
])if(!currentBoot.includes(token))throw new Error(`Expected Training router hook missing from boot-v2.js: ${token}`);
for(const token of ['records.length!==78','db.meta.goCount!==76','db.meta.noGoCount!==2'])if(!currentBoot.includes(token))throw new Error(`Validated field load guard missing from boot-v2.js: ${token}`);
const normalizedBoot=currentBoot
  .replace("const NH=document.getElementById('nHist'),NT=document.getElementById('nTrain');","const NH=document.getElementById('nHist');")
  .replace("NT.classList.toggle('on',view==='training');",'')
  .replace("if(view==='training')return renderTraining();",'')
  .replace("NT.onclick=()=>{puPage='home';setView('training')};",'');
if(normalizedBoot!==baseBoot)throw new Error('boot-v2.js contains changes beyond the four approved Training router additions');

// sw.js is also a controlled exception, but not a broad one. Every validated field-shell
// cache asset must survive exactly once; all additions must be training-* assets; install,
// activation, origin boundary, and non-navigation cache-first behavior stay pinned; only
// the navigation branch is allowed the explicit fail-closed app-entry hardening below.
const baseSw=show(BASE,'sw.js');
const currentSw=fs.readFileSync('sw.js','utf8');
function parseCore(source,label){
  const m=source.match(/const CORE=\[(.*?)\];/s);
  if(!m)throw new Error(`${label} service worker CORE inventory missing`);
  return[...m[1].matchAll(/'([^']+)'/g)].map(x=>x[1]);
}
const baseCore=parseCore(baseSw,'Validated base'),currentCore=parseCore(currentSw,'Current');
const duplicates=currentCore.filter((x,i)=>currentCore.indexOf(x)!==i);
if(duplicates.length)throw new Error(`Service-worker CORE contains duplicate assets: ${[...new Set(duplicates)].join(', ')}`);
for(const asset of baseCore){
  if(currentCore.filter(x=>x===asset).length!==1)throw new Error(`Validated field-shell cache asset missing or duplicated in service worker: ${asset}`);
}
const baseCoreSet=new Set(baseCore),swTrainingExtras=currentCore.filter(x=>!baseCoreSet.has(x));
const badSwExtras=swTrainingExtras.filter(x=>!/^\.\/training-[^/]+\.(?:js|css)$/.test(x));
if(badSwExtras.length)throw new Error(`Non-training asset added to service-worker CORE: ${badSwExtras.join(', ')}`);
if(!swTrainingExtras.length)throw new Error('Service-worker CORE unexpectedly contains no Paradise University assets');
const exactSwTokens=[
  "self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));",
  "self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('pcm-field-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));",
  "if(req.method!=='GET')return",
  "if(url.origin!==self.location.origin)return",
  "event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{if(r&&r.ok){let x=r.clone();caches.open(CACHE).then(c=>c.put(req,x))}return r})))",
  "isAppEntry=(url.pathname===appIndex.pathname||url.pathname===appRoot.pathname)&&url.search===''",
  "if(isAppEntry&&r.ok&&html)",
  "catch(()=>caches.match('./index.html'))"
];
for(const token of exactSwTokens)if(!currentSw.includes(token))throw new Error(`Service-worker control missing or drifted: ${token}`);
for(const eventName of ['install','activate','fetch']){
  const count=currentSw.split(`self.addEventListener('${eventName}'`).length-1;
  if(count!==1)throw new Error(`Service worker must contain exactly one ${eventName} handler; found ${count}`);
}
if(/drive\.google\.com|googleusercontent\.com/i.test(currentSw))throw new Error('External Google/Drive media must never be cached by the service worker');

// A release-version bump is allowed, but no other provenance field may drift.
const normalizeProvenance=s=>s.replace(/appVersion:'[^']+'/,"appVersion:'<RELEASE_VERSION>'");
if(normalizeProvenance(show(BASE,'provenance-v3-2.js'))!==normalizeProvenance(fs.readFileSync('provenance-v3-2.js','utf8')))throw new Error('provenance-v3-2.js changed beyond the allowed appVersion field');

const allowedExisting=new Set([
  '.github/workflows/validate-paradise-university-v1.yml',
  '.github/workflows/validate-paradise-university-hardening.yml',
  'index.html',
  'boot-v2.js',
  'sw.js',
  'scripts/build-canvass-site.mjs',
  'provenance-v3-2.js',
  'playwright.config.js',
  'tests/offline-regression.spec.js',
  'tests/matrix-smoke.spec.js'
]);
const diff=execFileSync('git',['diff','--name-status',BASE,'HEAD'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean).map(line=>{const [status,...parts]=line.split('\t');return{status,path:parts[parts.length-1]}});
const suspicious=diff.filter(x=>x.status!=='A'&&!allowedExisting.has(x.path));
if(suspicious.length)throw new Error(`Unexpected modification/deletion outside additive training shell: ${suspicious.map(x=>`${x.status}:${x.path}`).join(', ')}`);
const trainingAdded=diff.filter(x=>x.status==='A'&&(x.path.startsWith('training-')||x.path.startsWith('tests/')||x.path.startsWith('scripts/')||x.path.startsWith('docs/'))).length;
if(trainingAdded<10)throw new Error(`Training release inventory unexpectedly small: ${trainingAdded}`);
console.log({status:'PASS',base:BASE,immutableFieldFiles:immutable.length,indexException:'Exact additive Training CSS/nav/scripts only',bootException:'Training router only',serviceWorkerException:'Validated field cache + training-only CORE + exact queryless navigation hardening',serviceWorkerTrainingAssets:swTrainingExtras.length,trainingAdded,totalDiffEntries:diff.length});
