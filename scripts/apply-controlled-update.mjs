import fs from 'node:fs';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const expectedHash='7508cd852b943376b33abfb329696aed8d0919fea9765c14558ca69eb0564b99';
const expectedPatchedHash='13040b38f5ef8e67f32b0fc5d51b20e83916512d14ec1038ae55a502b6dcb421';
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

// Controlled 2026-08-14 correction: remove the extra evidentiary assumption that a
// doorknob/handle had to be expressly named before a secure removable hanger could be
// used where unattended private-entry placement was already released. This patch is
// name-locked and does not touch NON-AFFIXED, HANDOFF, CONSENT, RECEPTACLE, SPECIAL
// LOCATION, BLOCKED, DO NOT DISTRIBUTE, or NO FRONT-ENTRY commercial modes.
const oldMode='SECURE PRIVATE-ENTRY — KNOB NOT SPECIFICALLY VERIFIED';
const newMode='HANG ON KNOB/HANDLE — SECURE REMOVABLE';
const newPlacement='Preferred unattended method: place the approved die-cut/slit hanger over the lawful front-door knob/handle so it is secure against wind. No tape, staples, nails, glue, adhesive, mailbox contact, damage, or obstruction of the lock/latch/door operation. Honor all signs/refusals and the full row; use only the municipality-compliant material version.';
const commercialKnobNames=[
  'Belle Glade','Boca Raton','Boynton Beach','Clearwater','Cocoa','Delray Beach','Englewood','Hialeah','Hobe Sound','Indian Rocks Beach','Jensen Beach','Jupiter','Lake Worth','Lake Worth Beach','Lakeland','Longboat Key','Miami','Myakka City','Oldsmar','Opa Locka','Pahokee','Parrish','Plant City','Port Charlotte','Port Richey','Rockledge','Rotonda West','Safety Harbor','Sarasota','Satellite Beach','Seminole','South Bay','Venice','West Palm Beach'
];
const byName=new Map(obj.records.map(r=>[r.name,r]));
if(commercialKnobNames.length!==34||new Set(commercialKnobNames).size!==34)throw new Error('Controlled commercial knob-name set invalid');
for(const name of commercialKnobNames){
  const r=byName.get(name);
  if(!r)throw new Error(`Controlled knob correction missing jurisdiction: ${name}`);
  if(r.hangerMode!==oldMode)throw new Error(`Unexpected commercial mode before knob correction: ${name}=${JSON.stringify(r.hangerMode)}`);
  if(r.courtesyMode!==oldMode)throw new Error(`Unexpected courtesy mode before knob correction: ${name}=${JSON.stringify(r.courtesyMode)}`);
  r.hangerMode=newMode;
  r.hangerPlacement=newPlacement;
  r.courtesyMode=newMode;
  r.courtesyPlacement=newPlacement;
  r.courtesyFieldAction='LEAVE — KNOB/HANDLE';
}
const courtesyOnly={
  'New Port Richey':'INSTALLATION-DAY COURTESY ONLY. Place the notice securely over the lawful front-door knob/handle. No sales CTA, no knock/ring, no mailbox, no adhesive/fastener, no damage or lock/latch obstruction. Honor signs/refusals/HOA/access. Do not use this release for commercial advertising.',
  'Tarpon Springs':'INSTALLATION-DAY COURTESY ONLY. Place the notice securely over the lawful front-door knob/handle only while the notice contains no offer or attempt to persuade the recipient to receive a paid service. No sales CTA, no knock/ring, no mailbox, no adhesive/fastener, no damage or lock/latch obstruction. Do not use in the Sponge Dock Area. Honor signs/refusals/HOA/access.'
};
for(const [name,placement] of Object.entries(courtesyOnly)){
  const r=byName.get(name);
  if(!r)throw new Error(`Controlled courtesy knob correction missing jurisdiction: ${name}`);
  if(r.courtesyMode!==oldMode)throw new Error(`Unexpected courtesy-only mode before knob correction: ${name}=${JSON.stringify(r.courtesyMode)}`);
  r.courtesyMode=newMode;
  r.courtesyPlacement=placement;
  r.courtesyFieldAction='LEAVE — KNOB/HANDLE';
}
if(byName.get('Miami Gardens')?.hangerMode!=='NON-AFFIXED ONLY')throw new Error('Miami Gardens special placement drift');
if(byName.get('New Port Richey')?.hangerMode!=='DO NOT DISTRIBUTE')throw new Error('New Port Richey commercial placement drift');
if(byName.get('Tarpon Springs')?.hangerMode!=='NO FRONT-ENTRY DISTRIBUTION')throw new Error('Tarpon Springs commercial placement drift');
const remainingOldCommercial=obj.records.filter(r=>r.hangerMode===oldMode).map(r=>r.name);
const remainingOldCourtesy=obj.records.filter(r=>r.courtesyMode===oldMode).map(r=>r.name);
if(remainingOldCommercial.length||remainingOldCourtesy.length)throw new Error(`Unpatched knob modes remain: commercial=${remainingOldCommercial.join('|')} courtesy=${remainingOldCourtesy.join('|')}`);
const patchedHash=crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
if(patchedHash!==expectedPatchedHash)throw new Error(`Controlled knob patch hash mismatch: ${patchedHash}`);

// Operational-link normalization occurs only after the controlled legal payload passes
// its immutable evidence hash and the controlled correction passes its locked patch hash.
obj.meta.currentAppUrl=stableManagerUrl;
obj.meta.permanentLinkControl='CURRENT courtesy notice, municipality master PDF, controlled Sheet, and Canvass Manager use stable operational links. Drive documents are updated in place; the manager app URL follows only the validated GitHub release branch after the full validation workflow passes.';

fs.writeFileSync('controlled-register-source.json',JSON.stringify(obj,null,2)+'\n');

// Fail closed if any municipality loses a required hours, hanger, or courtesy control.
execFileSync(process.execPath,['scripts/validate-field-controls.mjs'],{stdio:'inherit'});
// Fail closed if field devices would load external executable resources or lose the SW same-origin guard.
execFileSync(process.execPath,['scripts/validate-runtime-isolation.mjs'],{stdio:'inherit'});

const canonicalHash=crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
console.log(JSON.stringify({parts:files.length,snapshot:obj.meta.snapshotDate,records:obj.records.length,go,noGo,sourceCoverage,payloadSha256:payloadHash,patchedPayloadSha256:patchedHash,canonicalSha256:canonicalHash,currentAppUrl:obj.meta.currentAppUrl},null,2));
