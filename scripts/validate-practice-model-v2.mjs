import fs from 'node:fs';
import vm from 'node:vm';

const file='training-practice-data-v2.js';
const code=fs.readFileSync(file,'utf8');
const context={window:{},Object,Array,String,Boolean,RegExp};
vm.createContext(context);vm.runInContext(code,context,{filename:file});
const all=context.window.PU_PRACTICE_SCENARIOS;
const version=context.window.PU_PRACTICE_DATA_VERSION;
const expectedVersion='2026.08.16-pu-practice-data-v2';
if(version!==expectedVersion)throw new Error(`Practice data version mismatch: ${version}`);
if(!Array.isArray(all)||all.length!==20)throw new Error(`Expected 20 governed practice scenarios, found ${Array.isArray(all)?all.length:'invalid'}`);
const categories=['Opening','Objections','Appointments','Field Rules'];
for(const category of categories){const n=all.filter(x=>x.category===category).length;if(n!==5)throw new Error(`${category} must contain exactly 5 v2 scenarios; found ${n}`)}
const ids=new Set();
const allowedDimensions=new Set(['Opening','Tonality','Listening','Question quality','Project identification','Objection handling','Value of visit','Appointment transition','Appointment quality','Compliance','Exit']);
for(const x of all){
  if(!x.id||ids.has(x.id))throw new Error(`Missing/duplicate scenario id: ${x.id}`);ids.add(x.id);
  for(const k of ['category','title','level','prompt','answer','coachingNote','trainingContentVersion'])if(!x[k])throw new Error(`${x.id} missing ${k}`);
  for(const k of ['skillTags','acceptedResponseConcepts','prohibitedResponseConcepts','scoreDimensions','sourceLineage'])if(!Array.isArray(x[k])||!x[k].length)throw new Error(`${x.id} missing non-empty ${k}`);
  if(typeof x.hardStop!=='boolean')throw new Error(`${x.id} hardStop must be boolean`);
  if(x.trainingContentVersion!==expectedVersion)throw new Error(`${x.id} trainingContentVersion mismatch`);
  for(const d of x.scoreDimensions)if(!allowedDimensions.has(d))throw new Error(`${x.id} uses unsupported score dimension: ${d}`);
  if(x.hardStop){
    const accepted=x.acceptedResponseConcepts.join(' ').toLowerCase();
    const prohibited=x.prohibitedResponseConcepts.join(' ').toLowerCase();
    if(!/(stop|leave|exit|does not canvass|verify|follows live lookup)/.test(accepted))throw new Error(`${x.id} hard stop lacks stop/leave/verification acceptance concept`);
    if(!/(rebuttal|continue|argument|knock|workaround|delay|question|literature|ignore|guess|debate)/.test(prohibited))throw new Error(`${x.id} hard stop lacks prohibited continuation concept`);
  }
}
if(all.filter(x=>x.hardStop).length<6)throw new Error('Expected at least 6 explicit hard-stop practice scenarios');
console.log(`Practice v2 validated: ${all.length} scenarios / ${categories.map(c=>`${c}=${all.filter(x=>x.category===c).length}`).join(' / ')} / hardStops=${all.filter(x=>x.hardStop).length}`);
