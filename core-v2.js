let db=window.PCM_DATA,sel=null,view='lookup',q='',releaseStep=0;
let form={manager:localStorage.pcmManager||'',office:localStorage.pcmOffice||'',route:'',address:'',confirm:false,notes:'',completedAt:'',releaseId:'',releaseDate:'',c:{time:'',signs:'',materials:'',permit:'',appointment:''}};
const M=document.getElementById('main'),NL=document.getElementById('nLook'),NR=document.getElementById('nRel');
const aliases={'st pete':'Saint Petersburg','st petersburg':'Saint Petersburg','psl':'Port Saint Lucie','port st lucie':'Port Saint Lucie','ft lauderdale':'Fort Lauderdale','ft pierce':'Fort Pierce','dania beach':'Dania','opa-locka':'Opa Locka','pbg':'Palm Beach Gardens','wpb':'West Palm Beach','nmb':'North Miami Beach'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function norm(s=''){return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\bst\.?\b/g,'saint').replace(/[^a-z0-9]+/g,' ').trim()}
function dist(a,b){let r=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let p=r[0];r[0]=i;for(let j=1;j<=b.length;j++){let t=r[j];r[j]=Math.min(r[j]+1,r[j-1]+1,p+(a[i-1]===b[j-1]?0:1));p=t}}return r[b.length]}
function score(x,s){let raw=s.toLowerCase().trim(),z=norm(s),n=norm(x.name);if(aliases[raw]===x.name)return 1000;if(!z)return 0;if(n===z)return 950;if(n.startsWith(z))return 850;if(n.split(' ').some(w=>w.startsWith(z)))return 760;if(n.includes(z))return 700;if(norm(x.county).includes(z)||norm(x.jurisdiction).includes(z))return 400;if(z.length>2){let v=1-dist(n,z)/Math.max(n.length,z.length);if(v>.62)return 300+v*200}return 0}
function find(s){return db.records.map(r=>[r,score(r,s)]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]||a[0].name.localeCompare(b[0].name)).slice(0,8).map(x=>x[0])}
function hoursTextBlocker(r=sel){return String(r?.hours||'').startsWith('HOURS TEXT BLOCKER')}
function firstSentence(s=''){let x=String(s).trim();if(!x)return'—';let m=x.match(/^(.+?[.!?])(?:\s|$)/);return(m?m[1]:x).trim()}
function cleanDetail(s=''){return String(s||'—').replace(/\s+\|\s+/g,'\n\n').replace(/\s+(?=(?:DOOR HANGER|PUBLIC\/ROW\/VEHICLE|STATE|LOCAL|THIS RATIONALE APPLIES ONLY|HILLSBOROUGH|PASCO|HERNANDO|CHARLOTTE|SARASOTA):)/g,'\n')}
function hoursSummary(r){let h=String(r?.hours||'').trim();if(hoursTextBlocker(r))return'HOLD — hours are not verified yet. Do not start a commercial canvass route until Compliance clears them.';if(r?.release==='NO-GO')return'No time window changes this NO-GO. Do not canvass this route.';if(/^EXACT ADDRESS/i.test(h))return'CHECK THE EXACT ADDRESS FIRST — the time rule depends on the city/county. Open the full canvassing rule below for the exact branch.';let m=h.match(/\b\d{1,2}:\d{2}\s*(?:AM|PM)[^.!?]*(?:[.!?]|$)/i);if(m)return m[0].trim();if(/NO .*CLOCK-HOUR LIMIT FOUND|no general .*hours|no city-specific .*hours|no separate city .*hours/i.test(h))return'No local residential canvassing time limit was found for this route. Follow the signs, access, and state rules below.';return firstSentence(h)}
function startSummary(r){if(r?.release==='NO-GO')return'Do not start this route.';let a=String(r?.addressCheck||''),d=String(r?.doFirst||'');if(/EXACT ADDRESS|LEGAL JURISDICTION CHECK REQUIRED/i.test(a))return'Confirm the exact city/county for the address before starting.';if(/No government permit|NOT REQUIRED|no .*permit.*required|no .*filing.*required/i.test(d))return'No route-specific permit or pre-filing is required for appointment-setting. Complete the Daily Check before starting.';return firstSentence(d)}
function refusalSummary(r){let s=String(r?.refusal||'').trim();if(!s)return'Honor posted property signs and any resident refusal. Leave immediately if asked.';return cleanDetail(s)}
function materialsSummary(r){let s=String(r?.access||'').trim();if(!s)return'Use only lawful private-property access. Do not bypass gates, fences, signs, or resident instructions.';let door=s.split('| DOOR HANGER:')[0].trim();return cleanDetail(door||s)}
function appointmentSummary(){return'Keep the conversation to appointment-setting only. If it turns into pricing, an order, a contract, payment, financing, or another sale step, stop and use the sales/HSS process.'}
function hangerActionSummary(r){
  const m=String(r?.hangerMode||'').toUpperCase();
  if(m.includes('LIMITED ENTITY/EMPLOYEE'))return'Not part of the universal hanger program. Use only the separately approved North Miami Beach version.';
  if(m.includes('BLOCKED'))return'Do not leave a door hanger here until Compliance clears the rule.';
  if(m.includes('DO NOT DISTRIBUTE'))return'Do not leave or hand out the commercial door hanger.';
  if(m.includes('NO FRONT-ENTRY'))return'Do not leave or hand out the commercial hanger at the front door or inside the restricted entrance area.';
  if(m.includes('OWNER CONSENT'))return'Do not leave it at an unanswered home. Give it to the resident only after they agree to receive it.';
  if(m.includes('DIRECT HANDOFF'))return'If nobody answers, take it with you. Hand it directly to a willing resident.';
  if(m.includes('RECEPTACLE'))return'Use an existing non-USPS flyer/newspaper holder, or hand it directly to a willing resident. Do not attach it to the home.';
  if(m.includes('NON-AFFIXED'))return'Leave it securely without attaching it to the door, knob, wall, fence, or gate.';
  if(m.includes('NO-KNOCK'))return'Literature-only route: leave the piece without knocking or ringing.';
  if(m.includes('SPECIAL LOCATION')||m.includes('ADDRESS SPLIT'))return'Check the exact city/county first, then follow the placement rule shown below.';
  if(m.includes('HANG ON FRONT KNOB')||m.includes('HANG ON KNOB'))return'Hang it securely on the allowed front-door knob or handle. Do not tape, staple, nail, glue, or interfere with the door.';
  if(m.includes('SECURE PRIVATE-ENTRY'))return'Leave it securely at the private front entry. Do not assume the door knob or handle is allowed.';
  return firstSentence(r?.hangerPlacement||r?.hangerRelease||r?.hangerMode||'Follow the door-hanger rule shown below.');
}
function hangerWhereSummary(r){
  const m=String(r?.hangerMode||'').toUpperCase();
  if(m.includes('BLOCKED')||m.includes('DO NOT DISTRIBUTE'))return'Take the hanger with you.';
  if(m.includes('LIMITED ENTITY/EMPLOYEE'))return'Outside the universal-stock plan.';
  if(m.includes('OWNER CONSENT')||m.includes('DIRECT HANDOFF'))return'No unattended leave. Use direct handoff only as allowed by the rule.';
  if(m.includes('RECEPTACLE'))return'Use a non-USPS delivery holder at the residence; otherwise use direct handoff.';
  if(m.includes('NON-AFFIXED'))return'Use a secure non-affixed spot at the private entry. If there is no safe lawful spot, take it with you.';
  if(m.includes('NO-KNOCK'))return'Leave it securely at the lawful private entry without knocking or ringing.';
  if(m.includes('SPECIAL LOCATION')||m.includes('ADDRESS SPLIT'))return'Check the exact city/county and read the full placement rule before leaving anything.';
  if(m.includes('HANG ON FRONT KNOB')||m.includes('HANG ON KNOB'))return'Front-door knob/handle only where the rule allows it. Keep it secure and removable.';
  if(m.includes('SECURE PRIVATE-ENTRY'))return'Use another secure spot at the private front entry. If no safe lawful spot exists, take it with you.';
  return firstSentence(r?.hangerPlacement||'Follow the full placement rule below.');
}
function courtesyActionSummary(r){
  const a=String(r?.courtesyFieldAction||'').toUpperCase();
  if(a.includes('OUTSIDE UNIVERSAL STOCK'))return'Do not issue the universal courtesy notice here.';
  if(a.includes('DO NOT LEAVE'))return'Do not leave the courtesy notice here until Compliance clears the rule.';
  if(a.includes('OWNER CONSENT'))return'Do not leave it at an unanswered home. Give it to the resident only after they agree.';
  if(a.includes('HANDOFF ONLY'))return'Hand it directly to a willing resident. Do not leave it unattended.';
  if(a.includes('ADDRESS CHECK FIRST'))return'Check the exact city/county first, then follow the placement rule.';
  if(a.includes('NO-KNOCK'))return'Leave the notice without knocking or ringing.';
  if(a.includes('NON-AFFIXED'))return'Leave it securely without attaching it to the door, knob, wall, fence, or gate.';
  if(a.includes('KNOB/HANDLE'))return'Leave it securely on the allowed front-door knob or handle.';
  if(a.includes('SECURE PRIVATE-ENTRY'))return'Leave it securely at the private front entry; do not assume the knob or handle is allowed.';
  return firstSentence(r?.courtesyPlacement||r?.courtesyFieldAction||'Follow the courtesy-notice rule shown below.');
}
function courtesyWhereSummary(r){
  const a=String(r?.courtesyFieldAction||'').toUpperCase();
  if(a.includes('OUTSIDE UNIVERSAL STOCK')||a.includes('DO NOT LEAVE'))return'Take the notice with you.';
  if(a.includes('OWNER CONSENT')||a.includes('HANDOFF ONLY'))return'No unattended leave. Use direct handoff only as allowed by the rule.';
  if(a.includes('ADDRESS CHECK FIRST'))return'Confirm the exact city/county before leaving the notice.';
  if(a.includes('NO-KNOCK'))return'Use the lawful private entry without knocking or ringing.';
  if(a.includes('NON-AFFIXED'))return'Use a secure non-affixed spot at the private entry. If there is no safe lawful spot, take it with you.';
  if(a.includes('KNOB/HANDLE'))return'Front-door knob/handle only where the rule allows it; keep it secure and removable.';
  if(a.includes('SECURE PRIVATE-ENTRY'))return'Use a secure spot at the private front entry. If no safe lawful spot exists, take it with you.';
  return firstSentence(r?.courtesyPlacement||'Follow the full placement rule below.');
}
function mailboxSummary(){return'Never put Paradise literature in, on, or attached to a USPS mailbox.'}
function hoaSummary(){return'HOA, security, gate, and private-street rules still apply. Do not bypass access controls. Permission to work at one home does not give permission to distribute to neighbors.'}
const checks=[{key:'time',title:'Hours',help:hoursSummary},{key:'signs',title:'Signs and resident refusal',help:refusalSummary},{key:'materials',title:'Property access and materials',help:materialsSummary},{key:'permit',title:'Permit / ID / address check',help:startSummary},{key:'appointment',title:'Appointment-setting only',help:appointmentSummary}];
function status(r){if(r.release==='NO-GO')return{tone:'stop',label:'NO-GO',ans:'DO NOT CANVASS',symbol:'✕'};if(hoursTextBlocker(r))return{tone:'first',label:'GO — HOURS ON HOLD',ans:'DO NOT START THE COMMERCIAL ROUTE YET',symbol:'!'};if(r.managerClass.includes('DO THIS FIRST'))return{tone:'first',label:'GO — CHECK FIRST',ans:'COMPLETE THE REQUIRED PRECHECK FIRST',symbol:'!'};if(r.managerClass==='GO - SPECIAL RULES')return{tone:'special',label:'GO — SPECIAL RULES',ans:'FOLLOW THE RULES BELOW',symbol:'!'};return{tone:'go',label:'GO',ans:'COMPLETE THE DAILY CHECK BEFORE STARTING',symbol:'✓'}}
function managerAction(r){if(r.release==='NO-GO')return'Do not canvass this route.';if(hoursTextBlocker(r))return'Hours are not cleared yet. Do not start a commercial canvass route until Compliance clears them.';if(r.managerClass.includes('DO THIS FIRST'))return'Complete the first-step requirement below, then run the Daily Check.';if(r.managerClass==='GO - SPECIAL RULES')return'Read the special rules below, then run the Daily Check.';return'Review the field rules below, then run the Daily Check.'}
function pill(r){let s=status(r),t=s.tone==='stop'?'NO-GO':s.tone==='special'?'SPECIAL':s.tone==='first'?'CHECK':'GO';return`<span class="pill ${s.tone}">${t}</span>`}
function row(l,v,strong=''){return`<div class="row"><div class="lab">${esc(l)}</div><div class="val ${strong}">${esc(cleanDetail(v||'—'))}</div></div>`}
function readList(k){try{return JSON.parse(localStorage[k]||'[]')}catch{return[]}}
function writeList(k,v){localStorage[k]=JSON.stringify(v)}
function favorites(){return readList('pcmFavorites')}
function isFavorite(name){return favorites().includes(name)}
function toggleFavorite(name){let a=favorites();a=a.includes(name)?a.filter(x=>x!==name):[name,...a].slice(0,12);writeList('pcmFavorites',a);render()}
function recordsFromNames(names){return names.map(n=>db.records.find(r=>r.name===n)).filter(Boolean)}
function localDateISO(d=new Date()){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return`${y}-${m}-${day}`}
function currentDeployBlock(){return String(window.PCM_DEPLOY_BLOCK_REASON||'').trim()}
function releaseIdentityReady(){return!!(form.manager.trim()&&form.route.trim()&&form.address.trim()&&form.confirm&&!currentDeployBlock()&&!hoursTextBlocker(sel))}
function resetForm(){form={...form,route:'',address:'',confirm:false,notes:'',completedAt:'',releaseId:'',releaseDate:'',c:{time:'',signs:'',materials:'',permit:'',appointment:''}};releaseStep=0}
function choose(r){sel=r;q=r.name;resetForm();let a=readList('pcmRecent').filter(x=>x!==r.name);a.unshift(r.name);writeList('pcmRecent',a.slice(0,6));view='lookup';render();scrollTo(0,0)}
function setView(v){view=v;render();scrollTo(0,0)}
function home(){sel=null;q='';resetForm();setView('lookup');setTimeout(()=>document.getElementById('search')?.focus(),30)}
function blockingCheck(){for(const x of checks)if(form.c[x.key]==='STOP'||form.c[x.key]==='ESCALATE')return{x,value:form.c[x.key]};return null}
function decision(){const block=currentDeployBlock();if(block)return[false,block];if(!sel||sel.release!=='GO')return[false,'This municipality is NO-GO.'];if(hoursTextBlocker(sel))return[false,'Hours are not cleared yet. Do not start this commercial canvass route until Compliance clears the hours.'];if(!form.manager.trim())return[false,'Enter the manager name.'];if(!form.route.trim())return[false,'Enter the territory or route.'];if(!form.address.trim())return[false,'Enter the exact address or route boundary.'];if(!form.confirm)return[false,'Confirm that the address matches the city/county rule shown.'];if(form.releaseDate&&form.releaseDate!==localDateISO())return[false,'This check is from a different date. Start a new Daily Check for today.'];for(const x of checks)if(form.c[x.key]==='STOP')return[false,`${x.title} was marked STOP.`];for(const x of checks)if(form.c[x.key]==='ESCALATE')return[false,`${x.title} needs manager/compliance review.`];if(checks.some(x=>form.c[x.key]!=='PASS'))return[false,'All five checks must pass before canvassing.'];return[true,'Address confirmed and all five checks passed.']}
function releaseScopeText(date=form.releaseDate||localDateISO()){return`For ${date} only, and only for the city and route/address entered in this check.`}
function toast(s){let e=document.createElement('div');e.className='toast';e.textContent=s;document.body.appendChild(e);setTimeout(()=>e.remove(),2400)}
