import fs from 'node:fs';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
const expectedHash='7508cd852b943376b33abfb329696aed8d0919fea9765c14558ca69eb0564b99';
const stableManagerUrl='https://raw.githack.com/twiztd1166/proud-math-b7d8/paradise-canvass-manager-validated/index.html';
const files=fs.readdirSync('.').filter(f=>/^controlled-register-v34-part-\d+\.b64$/.test(f)).sort();
if(!files.length)throw new Error('Controlled v3.4 payload parts missing');
const b64=files.map(f=>fs.readFileSync(f,'utf8').trim()).join('');
const text=zlib.brotliDecompressSync(Buffer.from(b64,'base64')).toString('utf8');
const obj=JSON.parse(text);
if(!obj?.meta||!Array.isArray(obj.records))throw new Error('Controlled payload structure invalid');
const go=obj.records.filter(r=>r.release==='GO').length;
const noGo=obj.records.filter(r=>r.release==='NO-GO').length;
const stops=obj.records.filter(r=>r.release==='NO-GO').map(r=>r.name).sort();
const sourceCoverage=obj.records.filter(r=>Array.isArray(r.sources)&&r.sources.length>0&&r.sources.every(u=>/^https?:\/\//i.test(String(u)))).length;
if(obj.meta.snapshotDate!=='2026-08-14'||obj.records.length!==78||go!==76||noGo!==2)throw new Error('Controlled v3.4 payload baseline mismatch');
if(JSON.stringify(stops)!==JSON.stringify(['Punta Gorda','Tarpon Springs']))throw new Error('Controlled v3.4 NO-GO mismatch');
if(sourceCoverage!==78)throw new Error('Controlled v3.4 source coverage mismatch');
const payloadHash=crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
if(payloadHash!==expectedHash)throw new Error(`Controlled v3.4 payload hash mismatch: ${payloadHash}`);

// Operational-link normalization occurs only after the controlled legal payload passes
// its immutable evidence hash. This does not alter any jurisdiction record or classification.
obj.meta.currentAppUrl=stableManagerUrl;
obj.meta.permanentLinkControl='CURRENT courtesy notice, municipality master PDF, controlled Sheet, and Canvass Manager use stable operational links. Drive documents are updated in place; the manager app URL follows only the validated GitHub release branch after the full validation workflow passes.';

fs.writeFileSync('controlled-register-source.json',JSON.stringify(obj,null,2)+'\n');
const canonicalHash=crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
console.log(JSON.stringify({parts:files.length,snapshot:obj.meta.snapshotDate,records:obj.records.length,go,noGo,sourceCoverage,payloadSha256:payloadHash,canonicalSha256:canonicalHash,currentAppUrl:obj.meta.currentAppUrl},null,2));
