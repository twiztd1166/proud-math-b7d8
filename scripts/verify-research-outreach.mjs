import fs from 'node:fs';
import vm from 'node:vm';

const API=process.env.SHOWS_API||'https://taxlrlfsobtnbasjcnuf.supabase.co/functions/v1/shows-api';
const source=fs.readFileSync('public/app-core.js','utf8');
const start=source.indexOf('function researchEmailAddresses');
const end=source.indexOf('async function shareShowSummary',start);
if(start<0||end<0)throw new Error('Research outreach helper block not found');

const helperSource=source.slice(start,end);
const sandbox={};
vm.createContext(sandbox);
vm.runInContext(`
function date(v){
  if(!v)return '—';
  const d=new Date(String(v).slice(0,10)+'T12:00:00');
  return Number.isNaN(d.getTime())?String(v):d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
}
${helperSource}
this.outreach={researchEmailDraft,researchCallScript,researchOutreachProfile};
`,sandbox);

const response=await fetch(API,{
  method:'POST',
  headers:{'Content-Type':'application/json'},
  body:JSON.stringify({action:'bootstrap'}),
});
if(!response.ok)throw new Error(`Bootstrap HTTP ${response.status}`);
const data=await response.json();
if(!data.ok)throw new Error(data.error||'Bootstrap failed');

const rows=(data.researchCalendarControls||[])
  .filter(row=>Number(row.plan_year||2026)===2026)
  .filter(row=>row.calendar_visibility!==false&&row.active!==false);
if(rows.length<115)throw new Error(`Expected at least 115 visible 2026 research controls; found ${rows.length}`);

let emailCount=0;
let callCount=0;
let maxMailtoLength=0;
let maxFacts=0;
let maxQuestions=0;

for(const row of rows){
  const profile=sandbox.outreach.researchOutreachProfile(row);
  const email=sandbox.outreach.researchEmailDraft(row);
  const call=sandbox.outreach.researchCallScript(row);
  const routes=Number(Boolean(email))+Number(Boolean(call));
  if(routes!==1)throw new Error(`${row.control_id}: expected exactly one concrete outreach route, found ${routes}`);
  maxFacts=Math.max(maxFacts,profile.facts.length);
  maxQuestions=Math.max(maxQuestions,profile.questions.length);

  if(email){
    emailCount++;
    if(!email.href.startsWith('mailto:'))throw new Error(`${row.control_id}: missing mailto route`);
    if(!email.subject.includes(String(row.event_label||'')))throw new Error(`${row.control_id}: subject is not event-specific`);
    if(!email.body.includes(String(row.event_label||'')))throw new Error(`${row.control_id}: body is not event-specific`);
    if(!email.body.includes('Paradise Exteriors'))throw new Error(`${row.control_id}: company identity missing`);
    if(/Current booking status:|\bHIST-\d|\bPROSPECT-|Treat as a historical repeat|not net-new/i.test(email.body)){
      throw new Error(`${row.control_id}: internal control jargon leaked into organizer-facing email`);
    }
    if(/\b(?:in|via|under)\s*,|\s+,|·\s*·/i.test(email.body)){
      throw new Error(`${row.control_id}: malformed organizer-facing email after internal-data cleanup`);
    }
    if(email.body.includes('Please also confirm the current price/package, application or commitment deadline')){
      throw new Error(`${row.control_id}: legacy generic all-fields question survived`);
    }
    maxMailtoLength=Math.max(maxMailtoLength,email.href.length);
    if(email.href.length>7500)throw new Error(`${row.control_id}: mailto draft is too large (${email.href.length} chars)`);
  }else{
    callCount++;
    if(!call.href.startsWith('tel:'))throw new Error(`${row.control_id}: missing tel route`);
    if(!call.script.includes(String(row.event_label||'')))throw new Error(`${row.control_id}: call script is not event-specific`);
    if(!call.script.includes('Paradise Exteriors'))throw new Error(`${row.control_id}: call script company identity missing`);
    if(/\bHIST-\d|\bPROSPECT-|Treat as a historical repeat|not net-new/i.test(call.script)){
      throw new Error(`${row.control_id}: internal control jargon leaked into organizer-facing call script`);
    }
    if(/\b(?:in|via|under)\s*,|\s+,|·\s*·/i.test(call.script)){
      throw new Error(`${row.control_id}: malformed organizer-facing call script after internal-data cleanup`);
    }
    if(!call.script.includes('Manager Notes'))throw new Error(`${row.control_id}: call closeout does not preserve note workflow`);
  }
}

const byId=new Map(rows.map(row=>[row.control_id,row]));
const coral=byId.get('R2026-002-CORAL-SPRINGS-OKTOBERFEST');
if(!coral)throw new Error('Coral Springs regression fixture missing');
const coralDraft=sandbox.outreach.researchEmailDraft(coral);
if(!coralDraft)throw new Error('Coral Springs should use email');
if(!/Please confirm Paradise Exteriors is eligible/i.test(coralDraft.body))throw new Error('Coral Springs lost required Paradise eligibility confirmation');

const sabor=byId.get('R2026-009-SABOR-FEST');
if(!sabor)throw new Error('Sabor Fest regression fixture missing');
const saborDraft=sandbox.outreach.researchEmailDraft(sabor);
if(!saborDraft)throw new Error('Sabor Fest should have an organizer-facing email route');
if(!/Please confirm Paradise Exteriors is eligible/i.test(saborDraft.body))throw new Error('Sabor Fest lost selection/approval eligibility confirmation');

const jupiter=byId.get('R2026-018-JUPITER-HARBOURFEST');
if(!jupiter)throw new Error('Jupiter HarbourFest regression fixture missing');
const jupiterDraft=sandbox.outreach.researchEmailDraft(jupiter);
if(!jupiterDraft)throw new Error('Jupiter HarbourFest should have an organizer-facing email route');
if(!/Please confirm Paradise Exteriors is eligible/i.test(jupiterDraft.body))throw new Error('Jupiter HarbourFest lost curated-fit eligibility confirmation');

const bucklerOct=byId.get('R2026-015-BUCKLER-WPB-OCT');
if(!bucklerOct)throw new Error('Buckler October regression fixture missing');
const bucklerOctDraft=sandbox.outreach.researchEmailDraft(bucklerOct);
if(!bucklerOctDraft)throw new Error('Buckler October should use email');
if(!/Please confirm Paradise Exteriors is eligible/i.test(bucklerOctDraft.body))throw new Error('Buckler October lost Paradise eligibility confirmation');
if(/history exists in\s*,/i.test(bucklerOctDraft.body))throw new Error('Buckler October retained malformed stripped-history prose');

const florida=byId.get('R2026-004-FLORIDA-CREATIVES-PSL');
if(!florida)throw new Error('Florida Creatives regression fixture missing');
const floridaDraft=sandbox.outreach.researchEmailDraft(florida);
if(!floridaDraft)throw new Error('Florida Creatives should use email');
if(/Please confirm the current price\/package/.test(floridaDraft.body))throw new Error('Florida Creatives repeats already verified price');
if(/Please confirm the current application or commitment deadline/.test(floridaDraft.body))throw new Error('Florida Creatives repeats already verified deadline');
if(!/late inventory|late participation/i.test(floridaDraft.body))throw new Error('Florida Creatives lost late-inventory customization');

const martin=byId.get('R2026-007-MARTIN-FALL-FEST');
if(!martin)throw new Error('Martin Fall Fest regression fixture missing');
const martinDraft=sandbox.outreach.researchEmailDraft(martin);
if(!martinDraft)throw new Error('Martin Fall Fest should use email');
if(/Please confirm the current price\/package/.test(martinDraft.body))throw new Error('Martin Fall Fest repeats verified price');
if(!/Please confirm the current application or commitment deadline/.test(martinDraft.body))throw new Error('Martin Fall Fest should ask for missing deadline');

const psl=byId.get('R2026-041-PSL-FALL-FUN');
if(!psl)throw new Error('PSL Fall Fun Fest regression fixture missing');
const pslDraft=sandbox.outreach.researchEmailDraft(psl);
if(!pslDraft)throw new Error('PSL Fall Fun Fest should use email');
if(!/Paradise participated in PSL Fall Fun Fest in 2024/i.test(pslDraft.body))throw new Error('PSL Fall Fun Fest lost useful historical customization');
if(/\$53\.50|Treat as a historical repeat|not net-new/i.test(pslDraft.body))throw new Error('PSL Fall Fun Fest exposes internal/obsolete historical details');

const buckler=byId.get('R2026-094-BUCKLER-WPB-DEC');
if(!buckler)throw new Error('Buckler December regression fixture missing');
const bucklerCall=sandbox.outreach.researchCallScript(buckler);
if(!bucklerCall)throw new Error('Buckler December should use phone-only call script');
if(!/Please confirm Paradise Exteriors is eligible/i.test(bucklerCall.script))throw new Error('Buckler call script lost eligibility gap');
if(!/Please confirm the current price\/package/i.test(bucklerCall.script))throw new Error('Buckler call script lost price gap');

console.log({
  outreach_contract:'PASS',
  visible_2026:rows.length,
  email_drafts:emailCount,
  phone_call_scripts:callCount,
  max_mailto_length:maxMailtoLength,
  max_facts:maxFacts,
  max_questions:maxQuestions,
});
