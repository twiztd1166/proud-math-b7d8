function quickButton(r,kind){return`<button class="quickBtn" data-city="${esc(r.name)}"><span><b>${kind==='favorite'?'★ ':''}${esc(r.name)}</b><small>${esc(r.county)} County</small></span>${pill(r)}</button>`}
function docLink(label,url){return url?`<a class="source" href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}</a>`:''}
function lookupHome(){let fav=recordsFromNames(favorites()).slice(0,6),recent=recordsFromNames(readList('pcmRecent')).filter(r=>!fav.some(f=>f.name===r.name)).slice(0,6),block=currentDeployBlock(),age=typeof pcmSnapshotAgeDays==='function'?pcmSnapshotAgeDays():null;M.innerHTML=`<h2>Can I canvass here?</h2><p class="sub">Start typing a city or service area. Results appear as you type.</p>${block?`<div class="blockBanner"><b>DEPLOY BLOCKED.</b> ${esc(block)}</div>`:''}${age!==null&&age>30&&!block?`<div class="staleBanner"><b>Freshness warning.</b> Controlled snapshot is ${age} days old. Age alone does not change the legal status; check for a newer validated register.</div>`:''}<div class="counts"><span>● <b>${db.meta.goCount} GO</b> · ${db.meta.noGoCount} NO-GO</span><span>Snapshot ${esc(db.meta.snapshotDate)}</span></div><div class="search"><span>⌕</span><input id="search" type="search" autocomplete="off" autocapitalize="words" placeholder="Start typing a city…" value="${esc(q)}"><button id="clear" aria-label="Clear search">×</button></div><div id="sugs"></div><button id="browseAll" class="btn secondary browseLaunch">BROWSE ALL AREAS</button>${fav.length?`<div class="sectionTitle">Favorites</div><div class="quickGrid">${fav.map(r=>quickButton(r,'favorite')).join('')}</div>`:''}${recent.length?`<div class="sectionTitle">Recent</div><div class="quickGrid">${recent.map(r=>quickButton(r,'recent')).join('')}</div>`:''}<div class="notice"><b>Mobile field lookup.</b> Each user has an independent session. The controlled register remains the source of truth; the app uses the approved snapshot shown above.</div>`;let I=document.getElementById('search'),S=document.getElementById('sugs');function draw(){q=I.value;if(!q.trim()){S.innerHTML='';return}let a=find(q);S.innerHTML=a.length?`<div class="list">${a.map(r=>`<button class="opt" data-city="${esc(r.name)}"><span class="ot"><b>${esc(r.name)}</b><small>${esc(r.county)} County · ${esc(r.jurisdiction)}</small></span>${pill(r)}</button>`).join('')}</div>`:`<div class="list"><div class="row"><div class="val strong">Not in the controlled register — DO NOT DEPLOY based on an unlisted city.</div></div></div>`;S.querySelectorAll('[data-city]').forEach(b=>b.onclick=()=>choose(db.records.find(r=>r.name===b.dataset.city)))}I.oninput=draw;I.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();let a=find(I.value);if(a.length===1||a[0]&&score(a[0],I.value)>=850)choose(a[0])}};document.getElementById('clear').onclick=()=>{I.value='';q='';S.innerHTML='';I.focus()};document.getElementById('browseAll').onclick=browseLaunch;document.querySelectorAll('.quickBtn[data-city]').forEach(b=>b.onclick=()=>choose(db.records.find(r=>r.name===b.dataset.city)));setTimeout(()=>I.focus(),20)}
function city(){
  let r=sel,s=status(r),fav=isFavorite(r.name),block=currentDeployBlock(),age=typeof pcmSnapshotAgeDays==='function'?pcmSnapshotAgeDays():null,releaseBlocked=r.release!=='GO'||!!block,hoursBlocker=String(r.hours||'').startsWith('HOURS TEXT BLOCKER');
  M.innerHTML=`<div class="head"><div><h2>${esc(r.name)}</h2><p>${esc(r.county)} County</p></div><button class="favBtn" id="fav" aria-label="${fav?'Remove favorite':'Add favorite'}">${fav?'★':'☆'}</button><button class="back" id="new">New search</button></div>
  ${block?`<div class="blockBanner"><b>DEPLOY BLOCKED.</b> ${esc(block)}</div>`:''}
  ${age!==null&&age>30&&!block?`<div class="staleBanner"><b>Freshness warning.</b> Controlled snapshot is ${age} days old; check for a newer validated register.</div>`:''}
  ${hoursBlocker?`<div class="staleBanner"><b>HOURS TEXT BLOCKER.</b> No numeric local hours are released for this area. Do not invent a time window; use the exact controlled hours text below and escalate if a numeric window is required.</div>`:''}
  <section class="traffic ${s.tone}"><div class="trafficSymbol">${s.symbol}</div><div><small>COMMERCIAL CANVASS STATUS</small><h3>${esc(s.label)}</h3><b>${esc(s.ans)}</b><p>${esc(managerAction(r))}</p></div></section>
  <section class="card essentials">
    ${row('DO FIRST',r.doFirst,'strong')}
    ${row('COMMERCIAL CANVASS HOURS',r.hours,hoursBlocker?'strong':'')}
    ${row('KEY RESTRICTION',r.refusal)}
    ${row('NEXT ACTION',r.nextAction,'strong')}
  </section>
  <section class="card essentials">
    <div class="sectionTitle">COMMERCIAL DOOR HANGER</div>
    ${row('FIELD ACTION',r.hangerPlacement,'strong')}
    ${row('RELEASE',r.hangerRelease)}
    ${row('PLACEMENT MODE',r.hangerMode)}
    ${row('SIGNS / REFUSAL',r.hangerSigns)}
    ${row('MAILBOX',r.hangerMailbox,'strong')}
  </section>
  <section class="card essentials">
    <div class="sectionTitle">INSTALLATION COURTESY NOTICE • CURRENT</div>
    ${row('FIELD ACTION',r.courtesyFieldAction,'strong')}
    ${row('COURTESY RELEASE',r.courtesyRelease)}
    ${row('PLACEMENT MODE',r.courtesyMode)}
    ${row('FIELD PLACEMENT',r.courtesyPlacement)}
    ${row('HOA / GATE / PRIVATE ACCESS',r.courtesyHOA)}
    ${docLink('OPEN CURRENT COURTESY NOTICE',db.meta.currentCourtesyNoticeUrl||db.meta.courtesyNoticeUrl)}
  </section>
  <div class="actions"><button id="rel" class="btn ${releaseBlocked?'danger':'primary'} heroAction">${block?'UPDATE REQUIRED — COMMERCIAL CANVASS BLOCKED':r.release==='GO'?'START COMMERCIAL CANVASS RELEASE →':'✕ COMMERCIAL CANVASS — DO NOT DEPLOY'}</button><button id="proof" class="btn secondary">Why / Proof</button><button id="script" class="btn secondary">What to say</button></div>
  <section class="card">
    <details><summary>Commercial door hanger details</summary><div class="detail detailRows">
      ${row('Door hanger release',r.hangerRelease)}
      ${row('Nobody home / unattended',r.hangerUnattended)}
      ${row('Resident answered / handoff',r.hangerHandoff)}
      ${row('Posted signs / refusal',r.hangerSigns)}
      ${row('Placement / securement',r.hangerSecurement)}
      ${row('Mailbox',r.hangerMailbox)}
      ${row('Public ROW / vehicle',r.hangerPublic)}
      ${row('Material version',r.hangerMaterial)}
      ${row('Hanger last verified',r.hangerLastVerified)}
    </div></details>
    <details><summary>Installation courtesy notice details</summary><div class="detail detailRows">
      ${row('FIELD ACTION',r.courtesyFieldAction,'strong')}
      ${row('Courtesy release',r.courtesyRelease)}
      ${row('Placement mode',r.courtesyMode)}
      ${row('Field placement',r.courtesyPlacement)}
      ${row('Installation-day behavior',r.courtesyBehavior)}
      ${row('HOA / gate / private access',r.courtesyHOA)}
      ${row('Content lock',r.courtesyContent)}
      ${row('Universal material',r.courtesyMaterial)}
      ${row('Difference from commercial hanger',r.courtesyDelta)}
      ${docLink('OPEN CURRENT COURTESY NOTICE',db.meta.currentCourtesyNoticeUrl||db.meta.courtesyNoticeUrl)}
    </div></details>
    <details><summary>Operating details</summary><div class="detail detailRows">${row('Legal jurisdiction / address rule',r.jurisdiction)}${row('Address check',r.addressCheck)}${row('Access / materials',r.access)}</div></details>
    <details><summary>Current controlled documents</summary><div class="detail">
      ${docLink('OPEN CURRENT COURTESY NOTICE',db.meta.currentCourtesyNoticeUrl||db.meta.courtesyNoticeUrl)}
      ${docLink('OPEN CURRENT MUNICIPALITY MASTER PDF',db.meta.currentMasterPdfUrl)}
      ${docLink('OPEN CURRENT CONTROLLED SHEET',db.meta.currentSheetUrl)}
      ${docLink('OPEN PERMANENT CANVASS MANAGER URL',db.meta.currentAppUrl)}
      <div class="notice"><b>Permanent-link control.</b> These CURRENT targets are intended to stay stable while the underlying files/app are updated.</div>
    </div></details>
    <details id="why"><summary>Why this status?</summary><div class="detail">${esc(r.why)}</div></details>
    <details id="say"><summary>Approved response</summary><div class="detail">${esc(r.script)}</div></details>
    <details><summary>Official challenge / escalation</summary><div class="detail">${esc(r.challenge)}</div></details>
    <details><summary>Florida HSS escalation boundary</summary><div class="detail">${esc(r.hssEscalation)}</div></details>
    <details><summary>Official sources / offline proof</summary><div class="detail"><b>Last verified:</b> ${esc(r.lastVerified||'—')}<br><br>${sourceProof(r)}<div class="notice"><b>Control note.</b> Manager Lookup controls current commercial canvass release/hours. Door Hanger Audit controls the commercial hanger. Installation Courtesy Audit controls the installation-day courtesy notice. Historical evidence labels do not override those current controls.</div></div></details>
  </section>`;
  document.getElementById('new').onclick=home;
  document.getElementById('fav').onclick=()=>toggleFavorite(r.name);
  document.getElementById('rel').onclick=()=>{if(block){toast(block);return}if(r.release==='GO'){releaseStep=0;setView('release')}else toast('COMMERCIAL CANVASS NO-GO: do not deploy this ordinary canvass route. Courtesy-notice controls, if any, are separate.')};
  document.getElementById('proof').onclick=()=>openDetail('why');
  document.getElementById('script').onclick=()=>openDetail('say');
}
function openDetail(id){let e=document.getElementById(id);e.open=true;e.scrollIntoView({behavior:'smooth',block:'start'})}
