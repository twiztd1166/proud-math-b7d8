import fs from 'node:fs';
import vm from 'node:vm';

process.on('uncaughtException',err=>{
  const msg=String(err?.message||err||'Unknown hardening failure').replace(/\r?\n/g,' ');
  console.error(`::error title=Paradise University hardening::${msg}`);
  process.exit(1);
});

const ctx={window:{}};vm.createContext(ctx);
for(const f of ['training-content-v1.js','training-content-sourcefix-v1.js','training-manager-v1-data.js','training-sales-v1-data.js','training-media-expanded-v1.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx);
const u=ctx.window.PU_CONTENT;
if(!u)throw new Error('Paradise University content missing');
if(u.mediaCatalogVersion!=='2026.08.16-pu-media-expanded-v1')throw new Error(`Unexpected media catalog version ${u.mediaCatalogVersion||'missing'}`);
if((u.media||[]).length<30)throw new Error(`Expanded media catalog unexpectedly small: ${(u.media||[]).length}/30`);
if(Object.keys(u.sources||{}).length<20)throw new Error(`Expanded source library unexpectedly small: ${Object.keys(u.sources||{}).length}/20`);
const mediaIds=(u.media||[]).map(x=>x.id);
if(new Set(mediaIds).size!==mediaIds.length)throw new Error('Duplicate media IDs in expanded catalog');

const lessons=[...(u.lessons||[]),...(u.managerLessons||[])];
const fieldLessons=(u.lessons||[]).filter(x=>['foundation','field-ready','canvasser'].includes(x.stage));
const text=x=>[x.title,x.summary,x.learn,x.practice,x.pass].filter(Boolean).join(' ');

const legacyPressure=[
  /ask forgiveness before permission/i,
  /no law against distributing (?:fliers|flyers)/i,
  /buy or die/i,
  /anything not a definite no is yes/i,
  /anything other than (?:a )?definite no is yes/i,
  /traumatiz/i,
  /prices? will never be cheaper/i,
  /9 times out of 10/i,
  /two times? a day until/i,
  /2x\s*\/\s*day/i,
  /cancel (?:the )?competitor/i,
  /government assistance.*free/i,
  /free (?:windows|doors|roof)/i,
  /full[- ]year price lock/i
];
for(const l of lessons){
  const t=text(l);
  for(const rx of legacyPressure)if(rx.test(t))throw new Error(`Quarantined legacy/pressure language leaked into approved lesson ${l.id}: ${rx}`);
}

const doorstepPositive=[
  /(?:you may|you can|go ahead and|should)\s+(?:quote|give) (?:a )?price/i,
  /(?:you may|you can|go ahead and|should)\s+present financing/i,
  /(?:you may|you can|go ahead and|should)\s+(?:take|collect) (?:a )?(?:deposit|payment)/i,
  /(?:you may|you can|go ahead and|should)\s+(?:sign|execute) (?:a )?contract/i,
  /close the sale at the door/i,
  /offer (?:a )?(?:discount|promotion) at the door/i
];
for(const l of fieldLessons){
  const t=text(l);
  for(const rx of doorstepPositive)if(rx.test(t))throw new Error(`Doorstep sales authorization leaked into ${l.id}: ${rx}`);
}

for(const l of lessons){
  for(const sid of l.sources||[])if(!u.sources?.[sid])throw new Error(`Unknown source ${sid} in ${l.id}`);
  for(const mid of l.media||[])if(!(u.media||[]).some(m=>m.id===mid))throw new Error(`Unknown media ${mid} in ${l.id}`);
}
for(const [id,s] of Object.entries(u.sources||{})){
  if(!['REFERENCE','HISTORICAL','PARADISE_APPROVED'].includes(s.authority))throw new Error(`Unknown authority ${s.authority} for source ${id}`);
  if(!/^https:\/\//.test(String(s.url||'')))throw new Error(`Source URL invalid for ${id}`);
}
for(const m of u.media||[]){
  if(!['REFERENCE','HISTORICAL','PARADISE_APPROVED'].includes(m.authority))throw new Error(`Unknown authority ${m.authority} for media ${m.id}`);
  if(m.authority!=='PARADISE_APPROVED'&&!String(m.note||'').trim())throw new Error(`Reference media lacks source note: ${m.id}`);
  if(!/^https:\/\//.test(String(m.url||'')))throw new Error(`Media URL invalid for ${m.id}`);
  if(/Tony Hoty|Dave Yoho|Grosso/i.test(String(m.trainer||''))&&m.authority==='PARADISE_APPROVED')throw new Error(`Third-party media misclassified as Paradise approved: ${m.id}`);
}

const salesSource=u.sources?.paradiseSalesPolicy2026;
const salesGate=u.salesPolicyGate;
if(!salesSource)throw new Error('Verified 2026 Paradise sales policy source missing');
if(salesSource.authority!=='PARADISE_APPROVED')throw new Error('2026 Paradise sales policy source must remain PARADISE_APPROVED');
if(!/138nsdiqs3XeSmq4PXlnGQNHFnDp2EJSe33ldrFu3TNQ/.test(String(salesSource.url||'')))throw new Error('Unexpected 2026 Paradise sales policy source URL');
if(salesGate?.status!=='CURRENT_POLICY_REQUIRED')throw new Error('Sales policy procedure gate was weakened');
if(salesGate?.sourceId!=='paradiseSalesPolicy2026')throw new Error('Sales policy gate lost verified source linkage');
if(salesGate?.sourceRevision!=='1585'||salesGate?.sourceModified!=='2026-03-05')throw new Error('Sales policy source revision control drift');
for(const phrase of ['price-presentation procedure','Financing presentation workflow','Contract execution','Customer cancellation / rescission handling procedure','full Sales Rep certification checklist'])if(!(salesGate.unresolved||[]).some(x=>String(x).includes(phrase)))throw new Error(`Sales procedure hold missing: ${phrase}`);
if((salesGate.supported||[]).length<5)throw new Error('Verified 2026 sales policy scope unexpectedly incomplete');

const expectedExpanded=['tony-callback','tony-recruit-manager','tony-new-canvasser-part1','tony-storm-xactimate','tony-audio-dvd-main','tony-dvd-main-video','tony-dvd-video','tony-video-clips','grosso-extreme-leadership-video','grosso-sales-training-video'];
for(const id of expectedExpanded)if(!mediaIds.includes(id))throw new Error(`Expanded source media missing: ${id}`);
for(const id of ['tonyDvdFolder','tonyIndividualAudio','tonyTrainingAudio','grossoAudioFolder','grossoVideoFolder','grossoObjectionSchool','grossoVirtualClosers','grossoAdvancedSelling'])if(!u.sources?.[id])throw new Error(`Expanded source group missing: ${id}`);

const requiredBoundaries={
  fieldLookup:/live municipality/i,
  fieldLiterature:/separate|different/i,
  refusal:/clear refusal|stop immediately|ends the interaction/i,
  apprentice:/not authorization to sell at the door|does not expand doorstep authority/i,
  manager:/does not override the live municipality|do not improvise law|NO-GO/i
};
const fieldBlob=fieldLessons.map(text).join(' ');
const apprenticeBlob=(u.lessons||[]).filter(x=>x.stage==='sales-apprentice').map(text).join(' ');
const managerBlob=(u.managerLessons||[]).map(text).join(' ');
if(!requiredBoundaries.fieldLookup.test(fieldBlob))throw new Error('Live municipality override missing from field curriculum');
if(!requiredBoundaries.fieldLiterature.test(fieldBlob)||!/door[- ]hanger/i.test(fieldBlob)||!/courtesy/i.test(fieldBlob))throw new Error('Literature/courtesy separation missing from field curriculum');
if(!requiredBoundaries.refusal.test(fieldBlob))throw new Error('Clear-refusal stop boundary missing from field curriculum');
if(!requiredBoundaries.apprentice.test(apprenticeBlob))throw new Error('Sales Apprentice doorstep boundary missing');
if(!requiredBoundaries.manager.test(managerBlob))throw new Error('Manager live-rule override missing');

if((u.drills||[]).some(d=>/leave my property|get off my property/i.test(d.prompt||'')&&!/stop immediately and leave/i.test(d.answer||'')))throw new Error('Clear-refusal practice answer drift');
if((u.drills||[]).some(d=>/NO-GO/i.test(d.title||d.prompt||'')&&!/do not canvass/i.test(d.answer||'')))throw new Error('NO-GO practice answer drift');

console.log({status:'PASS',fieldLessons:fieldLessons.length,totalLessons:lessons.length,sources:Object.keys(u.sources||{}).length,media:(u.media||[]).length,mediaCatalogVersion:u.mediaCatalogVersion,drills:(u.drills||[]).length,salesPolicySource:salesGate.sourceId,salesProcedureGate:salesGate.status});
