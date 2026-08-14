import fs from 'node:fs';

const index=fs.readFileSync('index.html','utf8');
const codeFiles=['provenance-v3-2.js','core-v2.js','lookup-v2.js','browse-v3.js','release-v2a.js','history-v2.js','release-v2b.js','pwa-v3.js','boot-v2.js','sw.js'];
const allowedMetadataUrl='https://raw.githubusercontent.com/twiztd1166/proud-math-b7d8/paradise-canvass-manager-public/latest.json';

const resourceAttrs=[...index.matchAll(/<(?:script|link)\b[^>]*(?:src|href)=["']([^"']+)["'][^>]*>/gi)].map(m=>m[1]);
const externalResources=resourceAttrs.filter(u=>/^(?:https?:)?\/\//i.test(u)||/^javascript:/i.test(u));
if(externalResources.length)throw new Error(`External executable/style resource detected in index.html: ${externalResources.join(', ')}`);
if(/<script\b(?![^>]*\bsrc=)[^>]*>/i.test(index))throw new Error('Inline executable script detected in index.html');
if(resourceAttrs.some(u=>u.includes('node_modules')))throw new Error('node_modules resource exposed by index.html');

const findings=[];
for(const file of codeFiles){
  const text=fs.readFileSync(file,'utf8');
  if(/\b(?:eval|Function)\s*\(/.test(text))findings.push(`${file}: dynamic code execution`);
  if(/\bimport\s*\(/.test(text))findings.push(`${file}: dynamic import`);
  if(/\bimport\s+[^;]+\s+from\s+["']https?:\/\//i.test(text))findings.push(`${file}: remote module import`);
  if(/\brequire\s*\(\s*["']https?:\/\//i.test(text))findings.push(`${file}: remote require`);
  const urls=[...text.matchAll(/https?:\/\/[^'"`\s)]+/g)].map(m=>m[0]);
  for(const url of urls){
    if(file==='pwa-v3.js'&&url===allowedMetadataUrl)continue;
    findings.push(`${file}: unexpected hard-coded external URL ${url}`);
  }
}
if(findings.length)throw new Error(`Runtime isolation check failed: ${findings.join(' | ')}`);

const sw=fs.readFileSync('sw.js','utf8');
if(!sw.includes("if(url.origin!==self.location.origin)return"))throw new Error('Service worker same-origin fetch guard missing');

console.log(JSON.stringify({
  indexResources:resourceAttrs.length,
  externalExecutableResources:externalResources.length,
  codeFilesChecked:codeFiles.length,
  allowedExternalReadOnlyMetadata:[allowedMetadataUrl],
  serviceWorkerSameOriginGuard:true
},null,2));
