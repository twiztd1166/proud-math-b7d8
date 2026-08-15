/* Paradise Canvass Manager v3.6 — manager-facing clarity + update enforcement.
   Controlled legal/source data is unchanged. This file only changes field presentation and release behavior for unresolved hours. */
function rawHoursUnconfirmed(r=sel){return String(r?.hours||'').startsWith('HOURS TEXT BLOCKER')}

window.hoursTextBlocker=function(){return false};

window.hoursSummary=function(r){
  const h=String(r?.hours||'').trim();
  if(r?.release==='NO-GO')return'Do not canvass.';
  if(rawHoursUnconfirmed(r))return'Hours are still being verified. You may canvass. Use Paradise’s normal route schedule.';
  if(/^EXACT ADDRESS/i.test(h))return'Check the exact address first. The allowed hours depend on whether the address is inside the city or county.';
  const m=h.match(/\b\d{1,2}(?::\d{2})?\s*(?:AM|PM)\s*(?:–|-|to)\s*\d{1,2}(?::\d{2})?\s*(?:AM|PM)/i);
  if(m)return m[0].replace(/\s+to\s+/i,'–');
  if(/NO .*CLOCK-HOUR LIMIT FOUND|no general .*hours|no city-specific .*hours|no separate city .*hours/i.test(h))return'No local time limit was found. Use Paradise’s normal route schedule.';
  return firstSentence(h);
};

window.startSummary=function(r){
  if(r?.release==='NO-GO')return'Do not start this route.';
  const a=String(r?.addressCheck||''),d=String(r?.doFirst||'');
  if(/EXACT ADDRESS|LEGAL JURISDICTION CHECK REQUIRED/i.test(a))return'Check the exact address before starting.';
  if(/No government permit|NOT REQUIRED|no .*permit.*required|no .*filing.*required/i.test(d))return'No city paperwork is required before this route. Run the Daily Check before starting.';
  if(/permit|registration|badge|identification|\bID\b|background check|fingerprint|fee/i.test(d))return firstSentence(d);
  return'Run the Daily Check before starting.';
};

window.addressSummary=function(r){
  const a=String(r?.addressCheck||'');
  if(/EXACT ADDRESS|LEGAL JURISDICTION CHECK REQUIRED/i.test(a))return'Check the exact address before using this rule.';
  return'Make sure the address is in the city or service area shown.';
};

window.refusalSummary=function(){return'Obey No Soliciting, No Advertising, No Trespassing, and similar signs. If a resident says no or asks you to leave, leave immediately.'};
window.materialsSummary=function(){return'Do not bypass a gate, fence, private street, access control, property sign, or resident instruction.'};
window.appointmentSummary=function(){return'Set the appointment only. Do not give a price, take an order, sign a contract, collect money, or start financing at the door.'};

window.hangerActionSummary=function(r){
  const m=String(r?.hangerMode||'').toUpperCase();
  if(m.includes('LIMITED ENTITY/EMPLOYEE'))return'Do not use the universal hanger here. Use only the separately approved North Miami Beach version.';
  if(m.includes('BLOCKED')||m.includes('DO NOT DISTRIBUTE'))return'Do not leave or hand out the commercial door hanger.';
  if(m.includes('NO FRONT-ENTRY'))return'Do not leave the commercial hanger at the front door or inside the restricted entrance area.';
  if(m.includes('OWNER CONSENT'))return'Only hand it to a resident who agrees to take it. Do not leave it at an unanswered home.';
  if(m.includes('DIRECT HANDOFF'))return'Hand it directly to a resident. If no one answers, take it with you.';
  if(m.includes('RECEPTACLE'))return'Use an existing non-USPS flyer or newspaper holder, or hand it to a resident. Do not attach it to the house.';
  if(m.includes('NON-AFFIXED'))return'Leave it loose and secure at the front entry. Do not attach it to the door, knob, wall, fence, or gate.';
  if(m.includes('NO-KNOCK'))return'Leave the hanger without knocking or ringing.';
  if(m.includes('SPECIAL LOCATION')||m.includes('ADDRESS SPLIT'))return'Check the exact address first, then follow the placement instruction below.';
  if(m.includes('HANG ON FRONT KNOB')||m.includes('HANG ON KNOB'))return'Hang it securely on the front-door knob or handle. Do not tape, staple, nail, or glue it.';
  if(m.includes('SECURE PRIVATE-ENTRY'))return'Leave it securely at the front entry. Do not use the door knob or handle unless this app specifically says it is allowed.';
  return'Follow the placement instruction shown for this area.';
};

window.hangerWhereSummary=function(r){
  const m=String(r?.hangerMode||'').toUpperCase();
  if(m.includes('BLOCKED')||m.includes('DO NOT DISTRIBUTE'))return'Take the hanger with you.';
  if(m.includes('LIMITED ENTITY/EMPLOYEE'))return'Universal hanger not approved here.';
  if(m.includes('OWNER CONSENT')||m.includes('DIRECT HANDOFF'))return'Direct handoff only. Do not leave it unattended.';
  if(m.includes('RECEPTACLE'))return'Use an existing non-USPS flyer/newspaper holder. If none is available, use direct handoff.';
  if(m.includes('NON-AFFIXED'))return'Use a secure spot at the front entry without attaching the hanger. If there is no safe spot, take it with you.';
  if(m.includes('NO-KNOCK'))return'Use the front entry without knocking or ringing.';
  if(m.includes('SPECIAL LOCATION')||m.includes('ADDRESS SPLIT'))return'Check the exact address before leaving anything.';
  if(m.includes('HANG ON FRONT KNOB')||m.includes('HANG ON KNOB'))return'Front-door knob or handle only. Keep it secure and removable.';
  if(m.includes('SECURE PRIVATE-ENTRY'))return'Use a secure spot at the front entry. If there is no safe spot, take it with you.';
  return'Follow the placement instruction shown for this area.';
};

window.courtesyActionSummary=function(r){
  const a=String(r?.courtesyFieldAction||'').toUpperCase();
  if(a.includes('OUTSIDE UNIVERSAL STOCK'))return'Do not use the universal courtesy notice here.';
  if(a.includes('DO NOT LEAVE'))return'Do not leave the courtesy notice here.';
  if(a.includes('OWNER CONSENT'))return'Only hand it to a resident who agrees to take it. Do not leave it at an unanswered home.';
  if(a.includes('HANDOFF ONLY'))return'Hand it directly to a resident. Do not leave it unattended.';
  if(a.includes('ADDRESS CHECK FIRST'))return'Check the exact address first, then follow the placement instruction.';
  if(a.includes('NO-KNOCK'))return'Leave the notice without knocking or ringing.';
  if(a.includes('NON-AFFIXED'))return'Leave it loose and secure at the front entry. Do not attach it to the door, knob, wall, fence, or gate.';
  if(a.includes('KNOB/HANDLE'))return'Hang it securely on the allowed front-door knob or handle.';
  if(a.includes('SECURE PRIVATE-ENTRY'))return'Leave it securely at the front entry. Do not use the knob or handle unless this app specifically says it is allowed.';
  return'Follow the courtesy-notice instruction shown for this area.';
};

window.courtesyWhereSummary=function(r){
  const a=String(r?.courtesyFieldAction||'').toUpperCase();
  if(a.includes('OUTSIDE UNIVERSAL STOCK')||a.includes('DO NOT LEAVE'))return'Take the notice with you.';
  if(a.includes('OWNER CONSENT')||a.includes('HANDOFF ONLY'))return'Direct handoff only. Do not leave it unattended.';
  if(a.includes('ADDRESS CHECK FIRST'))return'Check the exact address before leaving the notice.';
  if(a.includes('NO-KNOCK'))return'Use the front entry without knocking or ringing.';
  if(a.includes('NON-AFFIXED'))return'Use a secure spot at the front entry without attaching the notice. If there is no safe spot, take it with you.';
  if(a.includes('KNOB/HANDLE'))return'Front-door knob or handle only. Keep it secure and removable.';
  if(a.includes('SECURE PRIVATE-ENTRY'))return'Use a secure spot at the front entry. If there is no safe spot, take it with you.';
  return'Follow the placement instruction shown for this area.';
};

window.hangerSignsSummary=function(){return'Do not leave literature where a No Soliciting, No Advertising, No Trespassing, or similar sign applies. Do not leave it after a resident says no.'};
window.publicPlacementSummary=function(){return'Do not leave literature on streets, sidewalks, parks, vehicles, poles, or other public surfaces.'};
window.mailboxSummary=function(){return'Never use a USPS mailbox. Do not put Paradise material in, on, or attached to the mailbox or mailbox post.'};
window.hoaSummary=function(){return'Follow HOA, security, gate, and private-street rules. Do not bypass access controls. Permission to work at one home does not give permission to distribute to neighboring homes.'};
window.courtesyContentSummary=function(){return'Installation-day information only. No sales pitch, discount, financing, quote request, sales QR code, referral offer, testimonial, or cross-sell.'};

window.whySummary=function(r){
  if(r?.release==='NO-GO')return'Paradise does not canvass this area. Do not use a different time or delivery method to work around the restriction.';
  if(rawHoursUnconfirmed(r))return'The exact local canvassing hours are still being verified. This does not block the route. Use Paradise’s normal route schedule and follow every other rule shown here.';
  return'Paradise may canvass this area if the Daily Check passes and the route follows the signs, access, door-hanger, and appointment-setting rules shown here.';
};
window.plainScript=function(r){
  if(r?.release==='NO-GO')return'Paradise does not canvass this area. I’m going to stop and have my manager verify any question.';
  if(rawHoursUnconfirmed(r))return'We’re Paradise Exteriors. We’re setting future appointments today. The local hours are still being verified, so we’re following our normal route schedule.';
  return'We’re Paradise Exteriors. We’re only setting a future appointment today. We’re not taking an order, signing a contract, collecting money, or giving a price at the door.';
};
window.challengeSummary=function(){return'If a resident, HOA, security officer, city employee, or police officer objects, stop. Do not argue. Note who spoke to you, where, when, and what they said. Contact your manager before continuing.'};

window.status=function(r){
  if(r.release==='NO-GO')return{tone:'stop',label:'NO-GO',ans:'DO NOT CANVASS',symbol:'✕'};
  if(rawHoursUnconfirmed(r))return{tone:'special',label:'CANVASS — HOURS NOT CONFIRMED',ans:'RUN THE DAILY CHECK BEFORE STARTING',symbol:'!'};
  if(String(r.managerClass||'').includes('DO THIS FIRST'))return{tone:'first',label:'CHECK FIRST',ans:'COMPLETE THE REQUIRED STEP FIRST',symbol:'!'};
  if(r.managerClass==='GO - SPECIAL RULES')return{tone:'special',label:'CANVASS — SPECIAL RULES',ans:'FOLLOW THE RULES BELOW',symbol:'!'};
  return{tone:'go',label:'CANVASS',ans:'RUN THE DAILY CHECK BEFORE STARTING',symbol:'✓'};
};
window.managerAction=function(r){
  if(r.release==='NO-GO')return'Do not canvass this area.';
  if(rawHoursUnconfirmed(r))return'You may canvass. Local hours are still being verified. Use Paradise’s normal route schedule.';
  if(String(r.managerClass||'').includes('DO THIS FIRST'))return'Complete the first step below, then run the Daily Check.';
  if(r.managerClass==='GO - SPECIAL RULES')return'Read the special rules below, then run the Daily Check.';
  return'Run the Daily Check before starting.';
};
window.pill=function(r){
  const s=status(r);
  const t=r.release==='NO-GO'?'NO-GO':rawHoursUnconfirmed(r)?'HOURS?':s.tone==='special'?'SPECIAL':s.tone==='first'?'CHECK':'CANVASS';
  return`<span class="pill ${s.tone}">${t}</span>`;
};

/* A newer validated app version now blocks field use, even when the legal dataset itself is unchanged. */
window.pcmReadUpdateLock=function(){
  try{
    const x=JSON.parse(localStorage[PCM_UPDATE_LOCK_KEY]||'null');
    if(!x||!(pcmIsNewerVersion(x.version)||pcmIsNewerSnapshot(x.snapshot))){delete localStorage[PCM_UPDATE_LOCK_KEY];return null}
    return x;
  }catch{return null}
};
window.pcmWriteUpdateLock=function(meta){
  try{localStorage[PCM_UPDATE_LOCK_KEY]=JSON.stringify({datasetSha256:meta.datasetSha256||'',version:meta.version||'',snapshot:meta.snapshot||'',url:meta.url||'',detectedAt:new Date().toISOString()})}catch{}
};
window.pcmUpdateTarget=function(){
  if(pcmMetaIsNewer(pcmLatest))return pcmLatest;
  return pcmReadUpdateLock();
};
window.pcmApplyDeployBlock=function(){
  window.PCM_DEPLOY_BLOCK_REASON=pcmUpdateTarget()?'A newer approved app version is available. Update the app before starting a route.':'';
};
window.pcmForceRefresh=async function(){
  try{
    if('serviceWorker'in navigator){const regs=await navigator.serviceWorker.getRegistrations();await Promise.all(regs.map(r=>r.unregister()))}
    const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('pcm-field-')).map(k=>caches.delete(k)));
  }catch{}
  const target=pcmUpdateTarget();
  const base=db?.meta?.currentAppUrl||location.href.split('?')[0];
  const join=base.includes('?')?'&':'?';
  location.replace(`${base}${join}update=${encodeURIComponent(target?.version||'latest')}&t=${Date.now()}`);
};
window.pcmHealth=function(){
  const el=document.getElementById('appHealth');if(!el)return;
  const online=navigator.onLine,target=pcmUpdateTarget(),age=typeof pcmSnapshotAgeDays==='function'?pcmSnapshotAgeDays():null,stale=age!==null&&age>30;
  el.className='appHealth '+(online?'online':'offline')+(target?' update dataUpdate':'')+(stale&&!target?' stale':'');
  el.innerHTML=`<span class="healthNet">${online?'● ONLINE':'● OFFLINE'}</span><span>Rules ${esc(db?.meta?.snapshotDate||'—')}</span><span>${esc(PCM_BUILD_VERSION)}</span>${target?'<span class="healthBlock">UPDATE REQUIRED</span><button id="pcmUpdateNow" class="healthUpdate">UPDATE NOW</button>':''}${!pcmStandalone()?'<button id="installApp" class="healthInstall">ADD TO HOME SCREEN</button>':''}`;
  const u=document.getElementById('pcmUpdateNow');if(u)u.onclick=pcmForceRefresh;
  const b=document.getElementById('installApp');if(b)b.onclick=pcmInstall;
};
window.pcmCheckLatest=async function(){
  if(pcmValidationHost()){pcmLatest=null;pcmClearUpdateLock();pcmApplyDeployBlock();pcmHealth();return}
  if(!navigator.onLine){pcmApplyDeployBlock();pcmHealth();return}
  try{
    const r=await fetch(PCM_LATEST_META+'?t='+Date.now(),{cache:'no-store'});
    if(r.ok){const x=await r.json();if(x&&x.validated===true){pcmLatest=x;if(pcmMetaIsNewer(x))pcmWriteUpdateLock(x);else pcmClearUpdateLock()}}
  }catch{}
  const before=currentDeployBlock();pcmApplyDeployBlock();pcmHealth();
  if(before!==currentDeployBlock()&&typeof render==='function')render();
};
