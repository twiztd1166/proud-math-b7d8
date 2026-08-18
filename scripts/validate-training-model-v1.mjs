import fs from 'node:fs';
import vm from 'node:vm';

const ctx={window:{}};vm.createContext(ctx);
for(const f of ['training-content-v1.js','training-content-sourcefix-v1.js','training-manager-v1-data.js','training-sales-v1-data.js','training-media-expanded-v1.js','training-governance-v1.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx);
const u=ctx.window.PU_CONTENT;
if(!u||!Array.isArray(u.lessons)||!Array.isArray(u.media)||!Array.isArray(u.drills)||!Array.isArray(u.managerLessons))throw new Error('Training content model missing');
if(u.version!=='2026.08.16-pu-v1-content-5')throw new Error(`Unexpected training version ${u.version}`);
if(u.mediaCatalogVersion!=='2026.08.16-pu-media-expanded-v1')throw new Error(`Unexpected media catalog version ${u.mediaCatalogVersion||'missing'}`);
if(u.governanceVersion!=='2026.08.16-pu-governance-v1')throw new Error(`Unexpected governance version ${u.governanceVersion||'missing'}`);

const minimum={foundation:4,'field-ready':7,canvasser:9,senior:6,'sales-apprentice':11,'sales-rep':7};
for(const [stage,min] of Object.entries(minimum)){const n=u.lessons.filter(x=>x.stage===stage).length;if(n<min)throw new Error(`Insufficient ${stage} curriculum: ${n}/${min}`)}
if(u.lessons.filter(x=>x.stage==='sales-rep').length!==7)throw new Error('Sales Rep Part 1 must contain exactly seven policy-neutral lessons');
if(u.managerLessons.length<14)throw new Error(`Insufficient manager curriculum: ${u.managerLessons.length}/14`);
if(u.media.length<30)throw new Error(`Expanded media catalog too small: ${u.media.length}/30`);
if(Object.keys(u.sources||{}).length<20)throw new Error(`Expanded source catalog too small: ${Object.keys(u.sources||{}).length}/20`);
if(u.salesPolicyGate?.status!=='CURRENT_POLICY_REQUIRED')throw new Error('Sales policy gate missing');

for(const lesson of [...u.lessons,...u.managerLessons]){
  if(lesson.contentStatus!=='Published')throw new Error(`Published content status missing for ${lesson.id}`);
  if(lesson.trainingVersion!==u.version)throw new Error(`Training version missing or stale for ${lesson.id}`);
  if(!['Editorial','Training Update','Critical'].includes(lesson.changeClass))throw new Error(`Invalid change class for ${lesson.id}`);
}

for(const cat of ['Opening','Objections','Appointments','Field Rules'])if(!u.drills.some(x=>x.category===cat))throw new Error(`Practice category missing: ${cat}`);
const forbidden=['Retail Close','Qualification','Major Close','Sub-Step Close','Button-Up','Financing','Contract','Rescission'];
const salesTitles=u.lessons.filter(x=>x.stage==='sales-rep').map(x=>x.title);
for(const term of forbidden)if(salesTitles.some(t=>t.toLowerCase().includes(term.toLowerCase())))throw new Error(`Policy-sensitive operational lesson published before current policy verification: ${term}`);

for(const id of ['senior-sales-readiness','sales-process-map','sales-shadowing'])if(!u.lessons.some(x=>x.id===id))throw new Error(`Required progression lesson missing: ${id}`);
for(const id of ['manager-ridealong','manager-future-sales','manager-incidents'])if(!u.managerLessons.some(x=>x.id===id))throw new Error(`Required manager lesson missing: ${id}`);
if(!u.lessons.some(x=>/Certified Canvasser Readiness/i.test(x.title)))throw new Error('Canvasser certification readiness lesson missing');
if(!u.drills.some(x=>x.id==='leave-property'&&/stop immediately and leave/i.test(x.answer)))throw new Error('Clear-refusal drill missing');
if(!u.drills.some(x=>x.id==='no-go'&&/do not canvass/i.test(x.answer)))throw new Error('NO-GO practice drill missing');

const mediaIds=u.media.map(x=>x.id),idSet=new Set(mediaIds);
if(idSet.size!==mediaIds.length)throw new Error('Duplicate media IDs');
for(const lesson of [...u.lessons,...u.managerLessons])for(const id of lesson.media||[])if(!idSet.has(id))throw new Error(`Unknown media ${id} in ${lesson.id}`);
for(const lesson of [...u.lessons,...u.managerLessons])for(const id of lesson.sources||[])if(!u.sources?.[id])throw new Error(`Unknown source ${id} in ${lesson.id}`);

const urls=u.media.map(x=>String(x.url||''));
for(const id of ['1UoiQtvSx-85qJ4sbC2AegpEFF8ZRqGfC','1Z8wIrTrULa1g3In7_ucINtNZTV0eWczk','12hnKxDUE0nOO5kv_FuBb9fahiFGX4wty','1TKWzlPeTf7gxJ-M5gn9_PsEAUxg7QpPD','1fb4c-L2vJQF9isWRyoUDtPd76rvVr9fh','1Ehb0n6cke14wsmChuMUYNajRdua7cxYm','18v3EuZtCK8R9K-ZQOH9PHgrXNPhD7Juw','10YB84MXrnQRVLJkEHihVtEWZmUusw40H','1RuTrQXaqS5eBRaYhr4_BhZ_6o7W04lZ-','1WMIJRd-p559FllMTMxhd3qWBuNcPT99n','193wLgRBNz5wxb8By0uLu4kcynpcSdu-b','1WctdScsXFH2z37lHnlHyOl-kgzWSrgsU','1Wl1QfWgE2x_7hVA-cB-LzAXUZO6u48XE'])if(!urls.some(x=>x.includes(id)))throw new Error(`Verified media missing ${id}`);

if(!u.sources?.daveFive?.url?.includes('1Au1PhatdFIG84Azy8LiNXh0QLnjLSuIs'))throw new Error('Exact Dave Five Commitments source missing');
if(!u.sources?.grossoExpanded?.url?.includes('100B1iq77BW00sH4HYMO6zPl80ctMsaam'))throw new Error('Exact Grosso Expanded source missing');
if(!u.sources?.grossoRideAlong?.url?.includes('1cm2QPzwPRFPITk68fJmT8wc_z_OEPyTl'))throw new Error('Exact ride-along source missing');
if(!u.sources?.grossoManagement?.url?.includes('1yMpnMW-9pwKt_g4jCzR_SBLMe4FRK3RU7-ZPYYc0wHo'))throw new Error('Exact management source missing');
for(const id of ['tonyDvdFolder','tonyIndividualAudio','tonyTrainingAudio','daveScienceFolder','grossoAudioFolder','grossoVideoFolder','grossoObjectionSchool'])if(!u.sources?.[id])throw new Error(`Expanded source group missing: ${id}`);

const apprentice=u.lessons.filter(x=>x.stage==='sales-apprentice').map(x=>`${x.title} ${x.learn} ${x.pass}`).join(' ');
if(!/not authorization to sell at the door/i.test(apprentice))throw new Error('Sales Apprentice doorstep boundary missing');
const coreSales=u.lessons.filter(x=>x.stage==='sales-rep').map(x=>`${x.title} ${x.learn} ${x.pass}`).join(' ');
if(!/current Paradise|current approved|current product/i.test(coreSales))throw new Error('Sales Rep current-source accuracy boundary missing');
const mg=u.managerLessons.map(x=>`${x.title} ${x.learn} ${x.pass}`).join(' ');
if(!/do not improvise law|does not override the live municipality|NO-GO/i.test(mg))throw new Error('Manager compliance boundary missing');

console.log({status:'PASS',version:u.version,mediaCatalogVersion:u.mediaCatalogVersion,governanceVersion:u.governanceVersion,lessons:u.lessons.length,managerLessons:u.managerLessons.length,media:u.media.length,sourceLibraryMedia:u.media.filter(x=>x.priority==='SOURCE_LIBRARY').length,sources:Object.keys(u.sources||{}).length,drills:u.drills.length,policyGate:u.salesPolicyGate.status});