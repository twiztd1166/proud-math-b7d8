import fs from 'node:fs';
import path from 'node:path';

const files=[
  'index.html','style.css','style-v2.css','pwa-v3.css','hardening-v3-2.css','training-v1.css','training-player-v1.css','training-readiness-v1.css','training-practice-v1.css','training-checks-v1.css','training-more-v1.css','training-experience-v3.css','training-daily-v1.css','plain-data.js','provenance-v3-2.js','core-v2.js','lookup-v2.js','browse-v3.js','release-v2a.js','history-v2.js','release-v2b.js','pwa-v3.js','field-v36.js','field-v37.js','training-content-v1.js','training-content-sourcefix-v1.js','training-manager-v1-data.js','training-sales-v1-data.js','training-media-expanded-v1.js','training-media-reconciliation-v1.js','training-governance-v1.js','training-v1.js','training-media-rights-v1.js','training-media-ui-v1.js','training-manager-v1-ui.js','training-currentness-v1.js','training-sales-v1-ui.js','training-sales-closing-v1.js','training-readiness-v1.js','training-practice-data-v2.js','training-practice-v1.js','training-checks-v1.js','training-progress-state-v1.js','training-player-v1.js','training-media-player-gate-v1.js','training-more-v1.js','training-more-rights-gate-v1.js','training-deep-audit-fixes-v1.js','training-experience-v2.js','training-ux-polish-v1.js','training-experience-v3.js','training-daily-v1.js','training-storage-hardening-v1.js','boot-v2.js','manifest.webmanifest','icon-192.png','icon-512.png','sw.js','latest.json','register-manifest.json'
];
const out='canvass-dist';
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});
for(const f of files){if(!fs.existsSync(f))throw new Error(`Missing production asset: ${f}`);fs.copyFileSync(f,path.join(out,path.basename(f)))}
const index=fs.readFileSync(path.join(out,'index.html'),'utf8');
if(/central-sync|central-config|central-style/.test(index))throw new Error('Dormant central sync exposed in production index');
for(const f of ['plain-data.js','provenance-v3-2.js','field-v37.js','training-content-v1.js','training-content-sourcefix-v1.js','training-manager-v1-data.js','training-sales-v1-data.js','training-media-expanded-v1.js','training-media-reconciliation-v1.js','training-governance-v1.js','training-v1.js','training-media-rights-v1.js','training-media-ui-v1.js','training-manager-v1-ui.js','training-currentness-v1.js','training-sales-v1-ui.js','training-sales-closing-v1.js','training-readiness-v1.js','training-practice-data-v2.js','training-practice-v1.js','training-checks-v1.js','training-progress-state-v1.js','training-player-v1.js','training-media-player-gate-v1.js','training-more-v1.js','training-more-rights-gate-v1.js','training-deep-audit-fixes-v1.js','training-experience-v2.js','training-ux-polish-v1.js','training-experience-v3.js','training-daily-v1.js','training-storage-hardening-v1.js'])if(!index.includes(f))throw new Error(`Production index missing ${f}`);
for(const f of ['hardening-v3-2.css','training-v1.css','training-player-v1.css','training-readiness-v1.css','training-practice-v1.css','training-checks-v1.css','training-more-v1.css','training-experience-v3.css','training-daily-v1.css'])if(!index.includes(f))throw new Error(`Production index missing ${f}`);

// Do not trust the manually maintained bundle inventory alone. Every local file referenced by
// production HTML must physically exist in the built directory.
const htmlRefs=[...index.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1]).filter(x=>!/^https?:/i.test(x)&&!x.startsWith('#'));
for(const ref of new Set(htmlRefs)){
  const clean=ref.split(/[?#]/)[0];if(!clean)continue;
  const target=path.join(out,path.basename(clean));
  if(!fs.existsSync(target))throw new Error(`Built production HTML references missing asset: ${ref}`);
}

// Every explicit service-worker CORE file must also be present in the same bundle. Root './'
// is a navigation alias, not a physical filename, so it is intentionally skipped.
const sw=fs.readFileSync(path.join(out,'sw.js'),'utf8');
const coreBlock=sw.match(/const CORE=\[(.*?)\];/s)?.[1];
if(!coreBlock)throw new Error('Unable to read service-worker CORE asset inventory');
const coreRefs=[...coreBlock.matchAll(/'\.\/([^']*)'/g)].map(m=>m[1]).filter(Boolean);
for(const ref of new Set(coreRefs))if(!fs.existsSync(path.join(out,path.basename(ref))))throw new Error(`Service-worker CORE references missing bundled asset: ${ref}`);

console.log(`Built ${files.length} controlled static assets in ${out}; ${new Set(htmlRefs).size} HTML references and ${new Set(coreRefs).size} offline-core files verified.`);
