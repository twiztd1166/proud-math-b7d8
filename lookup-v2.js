function quickButton(r,kind){return`<button class="quickBtn" data-city="${esc(r.name)}"><span><b>${kind==='favorite'?'★ ':''}${esc(r.name)}</b><small>${esc(r.county)} County</small></span>${pill(r)}</button>`}
function docLink(label,url){return url?`<a class="source" href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}</a>`:''}
function lookupHome(){let fav=recordsFromNames(favorites()).slice(0,6),recent=recordsFromNames(readList('pcmRecent')).filter(r=>!fav.some(f=>f.name===r.name)).slice(0,6),block=currentDeployBlock(),age=typeof pcmSnapshotAgeDays==='function'?pcmSnapshotAgeDays():null;M.innerHTML=`<h2>Can I canvass here?</h2><p class="sub">Type a city or service area.</p>${block?`<div class="blockBanner"><b>UPDATE REQUIRED.</b> ${esc(block)}</div>`:''}${age!==null&&age>30&&!block?`<div class="staleBanner"><b>Check for an update.</b> These rules were last refreshed ${age} days ago.</div>`:''}<div class="counts"><span>● <b>${db.meta.goCount} GO</b> · ${db.meta.noGoCount} NO-GO</span><span>Rules ${esc(db.meta.snapshotDate)}</span></div><div class="search"><span>⌕</span><input id="search" type="search" autocomplete="off" autocapitalize="words" placeholder="Start typing a city…" value="${esc(q)}"><button id="clear" aria-label="Clear search">×</button></div><div id="sugs"></div><button id="browseAll" class="btn secondary browseLaunch">BROWSE ALL AREAS</button>${fav.length?`<div class="sectionTitle">Favorites</div><div class="quickGrid">${fav.map(r=>quickButton(r,'favorite')).join('')}</div>`:''}${recent.length?`<div class="sectionTitle">Recent</div><div class="quickGrid">${recent.map(r=>quickButton(r,'recent')).join('')}</div>`:''}<div class="notice"><b>Field use:</b> If the address, city, or official guidance conflicts with this app, stop and ask Compliance before continuing.</div>`;let I=document.getElementById('search'),S=document.getElementById('sugs');function draw(){q=I.value;if(!q.trim()){S.innerHTML='';return}let a=find(q);S.innerHTML=a.length?`<div class="list">${a.map(r=>`<button class="opt" data-city="${esc(r.name)}"><span class="ot"><b>${esc(r.name)}</b><small>${esc(r.county)} County · ${esc(r.jurisdiction)}</small></span>${pill(r)}</button>`).join('')}</div>`:`<div class="list"><div class="row"><div class="val strong">This area is not in the app. Do not canvass from this lookup until Compliance confirms the correct jurisdiction.</div></div></div>`;S.querySelectorAll('[data-city]').forEach(b=>b.onclick=()=>choose(db.records.find(r=>r.name===b.dataset.city)))}I.oninput=draw;I.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();let a=find(I.value);if(a.length===1||a[0]&&score(a[0],I.value)>=850)choose(a[0])}};document.getElementById('clear').onclick=()=>{I.value='';q='';S.innerHTML='';I.focus()};document.getElementById('browseAll').onclick=browseLaunch;document.querySelectorAll('.quickBtn[data-city]').forEach(b=>b.onclick=()=>choose(db.records.find(r=>r.name===b.dataset.city)));setTimeout(()=>I.focus(),20)}
function city(){
  let r=sel,s=status(r),fav=isFavorite(r.name),block=currentDeployBlock(),age=typeof pcmSnapshotAgeDays==='function'?pcmSnapshotAgeDays():null,hoursBlocker=hoursTextBlocker(r),releaseBlocked=r.release!=='GO'||!!block||hoursBlocker,addressFirst=/EXACT ADDRESS|LEGAL JURISDICTION CHECK REQUIRED/i.test(String(r.addressCheck||''));
  M.innerHTML=`<div class="head"><div><h2>${esc(r.name)}</h2><p>${esc(r.county)} County</p></div><button class="favBtn" id="fav" aria-label="${fav?'Remove favorite':'Add favorite'}">${fav?'★':'☆'}</button><button class="back" id="new">New search</button></div>
  ${block?`<div class="blockBanner"><b>UPDATE REQUIRED.</b> ${esc(block)}</div>`:''}
  ${age!==null&&age>30&&!block?`<div class="staleBanner"><b>Check for an update.</b> These rules were last refreshed ${age} days ago.</div>`:''}
  ${hoursBlocker?`<div class="blockBanner"><b>HOURS NOT CLEARED.</b> Do not start a commercial canvass route here until Compliance confirms the hours.</div>`:''}
  <section class="traffic ${s.tone}"><div class="trafficSymbol">${s.symbol}</div><div><small>CANVASSING</small><h3>${esc(s.label)}</h3><b>${esc(s.ans)}</b><p>${esc(managerAction(r))}</p></div></section>
  <section class="card essentials">
    <div class="sectionTitle">BEFORE YOU START</div>
    ${row('Hours',hoursSummary(r),'strong')}
    ${row('First step',startSummary(r),'strong')}
    ${addressFirst?row('Address / city check',addressSummary(r)):''}
    ${row('Signs / resident refusal',refusalSummary(r))}
  </section>
  <section class="card essentials">
    <div class="sectionTitle">DOOR HANGER</div>
    ${row('What to do',hangerActionSummary(r),'strong')}
    ${row('Where / how',hangerWhereSummary(r))}
    ${row('Signs / refusal',hangerSignsSummary())}
    ${row('Mailbox',mailboxSummary(),'strong')}
  </section>
  <section class="card essentials">
    <div class="sectionTitle">INSTALLATION-DAY COURTESY NOTICE</div>
    ${row('What to do',courtesyActionSummary(r),'strong')}
    ${row('Where / how',courtesyWhereSummary(r))}
    ${row('HOA / gate / private access',hoaSummary())}
    ${docLink('Open courtesy notice',db.meta.currentCourtesyNoticeUrl||db.meta.courtesyNoticeUrl)}
  </section>
  <div class="actions"><button id="rel" class="btn ${releaseBlocked?'danger':'primary'} heroAction">${block?'UPDATE APP BEFORE STARTING':hoursBlocker?'HOURS NOT CLEARED — DO NOT START ROUTE':r.release==='GO'?'RUN DAILY CHECK →':'✕ DO NOT CANVASS'}</button><button id="proof" class="btn secondary">Why?</button><button id="script" class="btn secondary">What to say</button></div>
  <section class="card">
    <details><summary>More canvassing details</summary><div class="detail detailRows">
      ${row('City / county rule',r.jurisdiction)}
      ${row('Address check',addressSummary(r))}
      ${row('Hours',hoursSummary(r))}
      ${row('Signs / resident refusal',refusalSummary(r))}
      ${row('Property access',materialsSummary(r))}
      ${row('Before starting',startSummary(r))}
      ${row('Appointment-setting only',appointmentSummary(r))}
    </div></details>
    <details><summary>More door-hanger details</summary><div class="detail detailRows">
      ${row('What to do',hangerActionSummary(r),'strong')}
      ${row('Where / how',hangerWhereSummary(r))}
      ${row('Signs / refusal',hangerSignsSummary())}
      ${row('Mailbox',mailboxSummary())}
      ${row('Public areas / vehicles',publicPlacementSummary())}
      ${row('Material','Use only the approved Paradise door hanger for this route.')}
    </div></details>
    <details><summary>More courtesy-notice details</summary><div class="detail detailRows">
      ${row('What to do',courtesyActionSummary(r),'strong')}
      ${row('Where / how',courtesyWhereSummary(r))}
      ${row('HOA / gate / private access',hoaSummary())}
      ${row('What the notice may contain',courtesyContentSummary())}
      ${docLink('Open courtesy notice',db.meta.currentCourtesyNoticeUrl||db.meta.courtesyNoticeUrl)}
    </div></details>
    <details><summary>Reference documents</summary><div class="detail">
      ${docLink('Courtesy notice',db.meta.currentCourtesyNoticeUrl||db.meta.courtesyNoticeUrl)}
      ${docLink('Municipality master PDF',db.meta.currentMasterPdfUrl)}
      ${docLink('Rules sheet',db.meta.currentSheetUrl)}
      ${docLink('Canvass Manager',db.meta.currentAppUrl)}
      <div class="notice"><b>Stable links:</b> These links stay the same when the approved files or app are updated.</div>
    </div></details>
    <details id="why"><summary>Why?</summary><div class="detail">${esc(whySummary(r))}</div></details>
    <details id="say"><summary>What to say</summary><div class="detail">${esc(plainScript(r))}</div></details>
    <details><summary>If someone questions the rule</summary><div class="detail">${esc(challengeSummary())}</div></details>
    <details><summary>If the conversation turns into a sale</summary><div class="detail">${esc(appointmentSummary(r))}</div></details>
    <details><summary>Sources and proof</summary><div class="detail"><b>Last checked:</b> ${esc(r.lastVerified||db.meta.snapshotDate||'—')}<br><br>${sourceProof(r)}${docLink('Open municipality master PDF',db.meta.currentMasterPdfUrl)}${docLink('Open rules sheet',db.meta.currentSheetUrl)}<div class="notice"><b>Source record:</b> The exact controlled legal text remains in the source record and official links. This screen shows the manager-ready instructions.</div></div></details>
  </section>`;
  document.getElementById('new').onclick=home;
  document.getElementById('fav').onclick=()=>toggleFavorite(r.name);
  document.getElementById('rel').onclick=()=>{if(block){toast(block);return}if(hoursBlocker){toast('Hours are not cleared yet. Do not start this commercial route until Compliance confirms them.');return}if(r.release==='GO'){releaseStep=0;setView('release')}else toast('Do not canvass this route. Door-hanger and courtesy-notice rules are shown separately above.')};
  document.getElementById('proof').onclick=()=>openDetail('why');
  document.getElementById('script').onclick=()=>openDetail('say');
}
function openDetail(id){let e=document.getElementById(id);e.open=true;e.scrollIntoView({behavior:'smooth',block:'start'})}
