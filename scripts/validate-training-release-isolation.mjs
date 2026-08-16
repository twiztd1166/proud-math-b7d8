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
  'boot-v2.js',
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
if(changed.length)throw new Error(`Training release modified validated field-engine files: ${changed.join(', ')}`);

const normalizeProvenance=s=>s.replace(/appVersion:'[^']+'/,"appVersion:'<RELEASE_VERSION>'");
if(normalizeProvenance(show(BASE,'provenance-v3-2.js'))!==normalizeProvenance(fs.readFileSync('provenance-v3-2.js','utf8')))throw new Error('provenance-v3-2.js changed beyond allowed appVersion field');

const allowedExisting=new Set([
  '.github/workflows/validate-paradise-university-v1.yml',
  '.github/workflows/validate-paradise-university-hardening.yml',
  'index.html','sw.js','scripts/build-canvass-site.mjs','provenance-v3-2.js'
]);
const diff=execFileSync('git',['diff','--name-status',BASE,'HEAD'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean).map(line=>{const [status,...parts]=line.split('\t');return{status,path:parts[parts.length-1]}});
const suspicious=diff.filter(x=>x.status!=='A'&&!allowedExisting.has(x.path));
if(suspicious.length)throw new Error(`Unexpected modification/deletion outside additive training shell: ${suspicious.map(x=>`${x.status}:${x.path}`).join(', ')}`);
const trainingAdded=diff.filter(x=>x.status==='A'&&(x.path.startsWith('training-')||x.path.startsWith('tests/')||x.path.startsWith('scripts/')||x.path.startsWith('docs/'))).length;
if(trainingAdded<10)throw new Error(`Training release inventory unexpectedly small: ${trainingAdded}`);
console.log({status:'PASS',base:BASE,immutableFieldFiles:immutable.length,trainingAdded,totalDiffEntries:diff.length});
