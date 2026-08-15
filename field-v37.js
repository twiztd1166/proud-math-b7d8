/* Paradise Canvass Manager v3.9 — one-screen field dashboard.
   Controlled legal/source data is unchanged. */

function fieldNeedsAddress(r){return /LEGAL JURISDICTION CHECK REQUIRED/i.test(String(r?.addressCheck||''))}

function fieldHours(r){
  if(r?.release==='NO-GO')return'DO NOT CANVASS';
  const h=String(r?.hours||'').trim();
  if(typeof rawHoursUnconfirmed==='function'&&rawHoursUnconfirmed(r))return'NOT CONFIRMED — use Paradise’s normal route schedule.';
  const m=h.match(/\b\d{1,2}(?::\d{2})?\s*(?:AM|PM)\s*(?:–|-|to)\s*\d{1,2}(?::\d{2})?\s*(?:AM|PM)/i);
  if(m)return m[0].replace(/\s+to\s+/i,'–').toUpperCase();
  if(/NO .*CLOCK-HOUR LIMIT FOUND|no general .*hours|no city-specific .*hours|no separate city .*hours/i.test(h))return'USE PARADISE’S NORMAL ROUTE SCHEDULE';
  if(fieldNeedsAddress(r))return'ADDRESS DEPENDENT — use the hours for the exact city/county.';
  return firstSentence(h);
}

function fieldHanger(r){
  const m=String(r?.hangerMode||'').toUpperCase();
  if(m.includes('LIMITED ENTITY/EMPLOYEE'))return'NOT APPROVED — do not use the universal hanger.';
  if(m.includes('BLOCKED')||m.includes('DO NOT DISTRIBUTE'))return'NO — take the hanger with you.';
  if(m.includes('NO FRONT-ENTRY'))return'NO AT FRONT DOOR — do not leave it in the restricted entrance area.';
  if(m.includes('PERMISSION / LOCATION'))return'NO COLD LEAVE — take it with you. Only give it to a resident after express permission at an allowed location.';
  if(m.includes('OWNER CONSENT'))return'HANDOFF WITH CONSENT — do not leave it unattended.';
  if(m.includes('DIRECT HANDOFF'))return'HANDOFF ONLY — if no one answers, take it with you.';
  if(m.includes('RECEPTACLE'))return'YES — use an existing non-USPS flyer/newspaper holder, or hand it to a resident.';
  if(m.includes('NON-AFFIXED'))return'YES — leave it secure at the front entry. DO NOT ATTACH it to the home.';
  if(m.includes('NO-KNOCK'))return'YES — leave it at the allowed front entry. DO NOT KNOCK OR RING.';
  if(m.includes('SPECIAL LOCATION')||m.includes('ADDRESS SPLIT'))return'CHECK ADDRESS BEFORE LEAVING IT.';
  if(m.includes('HANG ON FRONT KNOB')||m.includes('HANG ON KNOB'))return'YES — HANG ON FRONT DOORKNOB / HANDLE.';
  if(m.includes('SECURE PRIVATE-ENTRY'))return'YES — LEAVE AT FRONT ENTRY. DO NOT USE THE KNOB / HANDLE.';
  return'FOLLOW THE PLACEMENT RULE IN DETAILS.';
}

function fieldCourtesy(r){
  const a=String(r?.courtesyFieldAction||'').toUpperCase();
  if(a.includes('OUTSIDE UNIVERSAL STOCK'))return'NOT APPROVED — do not use the universal courtesy notice.';
  if(a.includes('DO NOT LEAVE'))return'NO — take the notice with you.';
  if(a.includes('OWNER CONSENT'))return'HANDOFF WITH CONSENT — do not leave it unattended.';
  if(a.includes('APPROVED NON-USPS RECEPTACLE')||a.includes('RECEPTACLE OR HANDOFF'))return'YES — use an existing non-USPS flyer/newspaper holder, or hand it to a resident.';
  if(a.includes('HANDOFF ONLY'))return'HANDOFF ONLY — do not leave it unattended.';
  if(a.includes('ADDRESS CHECK FIRST'))return'CHECK ADDRESS BEFORE LEAVING IT.';
  if(a.includes('NO-KNOCK'))return'YES — leave it at the allowed front entry. DO NOT KNOCK OR RING.';
  if(a.includes('NON-AFFIXED'))return'YES — leave it secure at the front entry. DO NOT ATTACH it to the home.';
  if(a.includes('KNOB/HANDLE'))return'YES — HANG ON FRONT DOORKNOB / HANDLE.';
  if(a.includes('SECURE PRIVATE-ENTRY'))return'YES — LEAVE AT FRONT ENTRY. DO NOT USE THE KNOB / HANDLE.';
  return'FOLLOW THE PLACEMENT RULE IN DETAILS.';
}

function fieldCanvass(r){
  if(r?.release==='NO-GO')return{tone:'stop',symbol:'✕',title:'NO — DO NOT CANVASS',sub:'This area is not approved for canvassing.'};
  if(fieldNeedsAddress(r))return{tone:'go',symbol:'✓',title:'YES — CANVASSING ALLOWED',sub:'Address changes which local rules apply. Confirm the city/county, then run the Daily Check.'};
  return{tone:'go',symbol:'✓',title:'YES — CANVASSING ALLOWED',sub:'Run the Daily Check before starting.'};
}

function fieldFirstStep(r){
  if(r?.release==='NO-GO')return'';
  if(fieldNeedsAddress(r))return'ADDRESS CHANGES THE LOCAL RULES — confirm the exact city/county.';
  const d=String(r?.doFirst||'');
  if(/permit|registration|badge|identification|\bID\b|background check|fingerprint|fee/i.test(d)&&!/No government permit|NOT REQUIRED|no .*permit.*required|no .*filing.*required/i.test(d))return firstSentence(d);
  return'';
}

function fieldDetailRow(label,value){return`<div class="row" data-field="${esc(label.toLowerCase().replace(/[^a-z0-9]+/g,'-'))}"><div class="lab">${esc(label)}</div><div class="val strong">${esc(value||'—')}</div></div>`}

window.status=function(r){
  const f=fieldCanvass(r);
  return{tone:f.tone,label:f.title,ans:f.sub,symbol:f.symbol};
};
window.managerAction=function(r){return fieldCanvass(r).sub};
window.pill=function(r){
  if(r.release==='NO-GO')return'<span class="pill stop">NO-GO</span>';
  return'<span class="pill go">CANVASS</span>';
};
window.hoursSummary=fieldHours;
window.hangerActionSummary=fieldHanger;
window.hangerWhereSummary=fieldHanger;
window.courtesyActionSummary=fieldCourtesy;
window.courtesyWhereSummary=fieldCourtesy;

window.city=function(){
  const r=sel,f=fieldCanvass(r),fav=isFavorite(r.name),block=currentDeployBlock(),age=typeof pcmSnapshotAgeDays==='function'?pcmSnapshotAgeDays():null,first=fieldFirstStep(r),releaseBlocked=r.release!=='GO'||!!block;
  M.innerHTML=`
    <div class="head"><div><h2>${esc(r.name)}</h2><p>${esc(r.county)} County</p></div><button class="favBtn" id="fav" aria-label="${fav?'Remove favorite':'Add favorite'}">${fav?'★':'☆'}</button><button class="back" id="new">New search</button></div>
    ${block?`<div class="blockBanner"><b>UPDATE REQUIRED.</b> ${esc(block)}</div>`:''}
    ${age!==null&&age>30&&!block?`<div class="staleBanner"><b>Check for an update.</b> Rules were last refreshed ${age} days ago.</div>`:''}
    <section class="traffic ${f.tone}"><div class="trafficSymbol">${f.symbol}</div><div><small>CANVASSING</small><h3>${esc(f.title)}</h3><p>${esc(f.sub)}</p></div></section>
    <section class="card essentials">
      <div class="sectionTitle">FIELD ANSWERS</div>
      ${fieldDetailRow('Hours',fieldHours(r))}
      ${first?fieldDetailRow(fieldNeedsAddress(r)?'Address rule':'Before starting',first):''}
      ${fieldDetailRow('Door hanger',fieldHanger(r))}
      ${fieldDetailRow('Courtesy notice',fieldCourtesy(r))}
      ${fieldDetailRow('Always','OBEY POSTED SIGNS. LEAVE IF ASKED. NEVER USE A USPS MAILBOX.')}
      ${docLink('Open courtesy notice',db.meta.currentCourtesyNoticeUrl||db.meta.courtesyNoticeUrl)}
    </section>
    <div class="actions"><button id="rel" class="btn ${releaseBlocked?'danger':'primary'} heroAction">${block?'UPDATE APP BEFORE STARTING':r.release==='GO'?'RUN DAILY CHECK →':'✕ DO NOT CANVASS'}</button><button id="script" class="btn secondary">What to say</button></div>
    <section class="card"><details id="details"><summary>Details & sources</summary><div class="detail detailRows">
      ${row('City / county rule',r.jurisdiction)}
      ${row('Address',addressSummary(r))}
      ${row('Property access',materialsSummary(r))}
      ${row('Signs / resident refusal',refusalSummary(r))}
      ${row('Appointment only',appointmentSummary(r))}
      ${row('Door hanger',fieldHanger(r))}
      ${row('Courtesy notice',fieldCourtesy(r))}
      ${docLink('Municipality master PDF',db.meta.currentMasterPdfUrl)}
      ${docLink('Rules sheet',db.meta.currentSheetUrl)}
      ${sourceProof(r)}
    </div></details><details id="say"><summary>What to say</summary><div class="detail">${esc(plainScript(r))}</div></details></section>`;
  document.getElementById('new').onclick=home;
  document.getElementById('fav').onclick=()=>toggleFavorite(r.name);
  document.getElementById('rel').onclick=()=>{if(block){toast(block);return}if(r.release==='GO'){releaseStep=0;setView('release')}else toast('Do not canvass this area.')};
  document.getElementById('script').onclick=()=>{const e=document.getElementById('say');e.open=true;e.scrollIntoView({behavior:'smooth',block:'start'})};
};
