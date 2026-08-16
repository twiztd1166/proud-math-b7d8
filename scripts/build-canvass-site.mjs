import fs from 'node:fs';
import path from 'node:path';

const files=[
  'index.html','style.css','style-v2.css','pwa-v3.css','hardening-v3-2.css','training-v1.css','plain-data.js','provenance-v3-2.js','core-v2.js','lookup-v2.js','browse-v3.js','release-v2a.js','history-v2.js','release-v2b.js','pwa-v3.js','field-v36.js','field-v37.js','training-content-v1.js','training-v1.js','boot-v2.js','manifest.webmanifest','icon-192.png','icon-512.png','sw.js','latest.json','register-manifest.json'
];
const out='canvass-dist';
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});
for(const f of files){
  if(!fs.existsSync(f))throw new Error(`Missing production asset: ${f}`);
  fs.copyFileSync(f,path.join(out,path.basename(f)));
}
const index=fs.readFileSync(path.join(out,'index.html'),'utf8');
if(/central-sync|central-config|central-style/.test(index))throw new Error('Dormant central sync exposed in production index');
if(!index.includes('plain-data.js'))throw new Error('Production index is not using controlled plain-data build');
if(!index.includes('provenance-v3-2.js'))throw new Error('Production index is missing evidence provenance controls');
if(!index.includes('hardening-v3-2.css'))throw new Error('Production index is missing v3.2 hardening styles');
if(!index.includes('field-v37.js'))throw new Error('Production index is missing v3.7 field dashboard');
if(!index.includes('training-content-v1.js')||!index.includes('training-v1.js')||!index.includes('training-v1.css'))throw new Error('Production index is missing Paradise University assets');
console.log(`Built ${files.length} controlled static assets in ${out}`);