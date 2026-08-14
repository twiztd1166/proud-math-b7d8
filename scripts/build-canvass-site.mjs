import fs from 'node:fs';
import path from 'node:path';

const files=[
  'index.html','style.css','style-v2.css','pwa-v3.css','plain-data.js','core-v2.js','lookup-v2.js','browse-v3.js','release-v2a.js','history-v2.js','release-v2b.js','pwa-v3.js','boot-v2.js','manifest.webmanifest','icon-192.png','icon-512.png','sw.js','latest.json','register-manifest.json'
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
console.log(`Built ${files.length} controlled static assets in ${out}`);
