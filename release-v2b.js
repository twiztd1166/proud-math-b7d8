function checkSummary(){return checks.map(x=>`<div class="summaryCheck"><span>${esc(x.title)}</span><b class="state ${esc(form.c[x.key]||'MISSING')}">${esc(form.c[x.key]==='ESCALATE'?'REVIEW':form.c[x.key]||'NOT SET')}</b></div>`).join('')}
function sourceProof(r){const refs=pcmAuthorityRefs(r),src=r.sources||[];return`${refs.length?`<div class="authorityRefs"><b>Code sections referenced:</b> ${refs.map(esc).join(' · ')}</div>`:''}${src.map((u,i)=>`<div class="sourceRef">${esc(pcmSourceDescriptor(u,i))}</div><a class="source" href="${esc(u)}" target="_blank" rel="noopener">Open official source ${i+1}</a>`).join('')}${!navigator.onLine?'<div class="offlineSourceNote">You are offline. The saved rule text is still available here; official source pages need an internet connection.</div>':''}`}
function fieldResponseCard(){
  const b=blockingCheck();
  let now='Do not canvass. Fix the reason shown above before starting a new Daily Check.';
  if(b?.value==='STOP')now=`Do not canvass. ${b.x.title} was marked STOP. Fix that issue before starting a new check.`;
  if(b?.value==='ESCALATE')now=`Do not canvass. ${b.x.title} needs review. Ask manager/compliance before continuing.`;
  if(currentDeployBlock())now='Do not canvass from this app version. Update the app, then start a new Daily Check.';
  return`<section class="card fieldResponse"><h3>What to do now</h3><p>${esc(now)}</p><div class="responseLabel">Next step</div><p>${esc(sel.nextAction||'Stop and resolve the issue before continuing.')}</p><div class="responseLabel">If someone questions the rule</div><p>${esc(sel.challenge||sel.script||'Do not argue. Stop and contact manager/compliance.')}</p><div class="responseLabel">Official source</div>${sourceProof(sel)}</section>`;
}
function releaseFinal(){
  let d=decision();if(!form.completedAt)form.completedAt=new Date().toISOString();form.releaseDate=form.releaseDate||localDateISO(new Date(form.completedAt));form.releaseId=form.releaseId||pcmNewReleaseId();
  let saved=saveCurrentRelease(),when=new Date(form.completedAt).toLocaleString(),p=window.PCM_PROVENANCE||{},build=window.PCM_BUILD_COMMIT||'—';
  M.innerHTML=`${releaseHeader()}<section class="finalDecision ${d[0]?'yes':'no'}"><small>FINAL RESULT</small><div class="finalSymbol">${d[0]?'✓':'✕'}</div><h3>${d[0]?'APPROVED TO CANVASS':'DO NOT CANVASS'}</h3><p>${esc(d[1])}</p></section>${saved?`<div class="savedBanner">✓ SAVED ON THIS PHONE</div>`:`<div class="saveWarning">! COULD NOT SAVE — COPY THIS RECORD</div>`}<div class="scopeBanner"><b>This check applies:</b> ${esc(releaseScopeText(form.releaseDate))}</div>${!d[0]?fieldResponseCard():''}<section class="card finalFacts">${row('Check ID',form.releaseId,'strong')}${row('Date',form.releaseDate,'strong')}${row('City / area',sel.name,'strong')}${row('Exact route / address',form.address,'strong')}${row('Manager',form.manager||'—')}${row('Office / team',form.office||'—')}${row('Territory / route',form.route||'—')}${row('Completed',when)}${row('Rules snapshot',db.meta.snapshotDate)}${row('App version',p.appVersion||window.PCM_BUILD_VERSION||'—')}${row('Dataset SHA-256',p.datasetSha256||'—')}${row('Build commit',build)}</section><section class="card checkSummary">${checkSummary()}</section><div class="field"><label>Notes</label><textarea id="notes" class="textarea" placeholder="Optional notes">${esc(form.notes)}</textarea></div><div class="actions finalActions"><button id="newRoute" class="btn primary">START NEW ROUTE</button><button id="historyBtn" class="btn secondary">History</button><button id="share" class="btn secondary">Share</button><button id="copy" class="btn secondary">Copy</button><button id="review" class="btn secondary">Review checks</button></div><div class="notice"><b>Saved on this phone.</b> Use History export when you need a durable copy outside this device.</div>`;
  bindCityBack();
  document.getElementById('notes').oninput=e=>{form.notes=e.target.value;saveCurrentRelease()};
  document.getElementById('copy').onclick=copy;
  document.getElementById('share').onclick=()=>{let r=makeReleaseRecord();if(r)shareRecord(r)};
  document.getElementById('review').onclick=()=>{form.completedAt='';form.releaseId='';form.releaseDate='';releaseStep=1;release()};
  document.getElementById('newRoute').onclick=home;
  document.getElementById('historyBtn').onclick=()=>setView('history');
}
function release(){
  if(!sel){M.innerHTML=`<div class="empty"><h2>Choose a city first</h2><p>The Daily Check starts from a city lookup.</p><button class="btn primary" id="go">Go to lookup</button></div>`;document.getElementById('go').onclick=()=>setView('lookup');return}
  if(hoursTextBlocker(sel)){
    M.innerHTML=`<div class="head"><div><h2>Daily Check</h2><p>${esc(sel.name)}</p></div><button class="back" id="cityBack">Back</button></div><section class="traffic stop"><div class="trafficSymbol">!</div><div><small>COMMERCIAL ROUTE</small><h3>HOURS NOT CLEARED</h3><p>Do not start a commercial canvass route here until Compliance confirms the hours.</p></div></section><section class="card essentials">${row('Hours — full rule',sel.hours,'strong')}</section><section class="card fieldResponse"><h3>What to do now</h3><p>Do not canvass this route yet. Do not guess or borrow hours from another city. Wait until Compliance clears the hours and the app is updated.</p><div class="responseLabel">Door hanger and courtesy notice</div><p>Those rules are separate and remain shown on the city page.</p><div class="responseLabel">Official source</div>${sourceProof(sel)}</section>`;
    bindCityBack();return
  }
  if(sel.release!=='GO'){
    let s=status(sel);M.innerHTML=`<div class="head"><div><h2>Daily Check</h2><p>${esc(sel.name)}</p></div><button class="back" id="cityBack">Back</button></div><section class="traffic stop"><div class="trafficSymbol">✕</div><div><small>CANVASSING</small><h3>${esc(s.label)}</h3><p>${esc(managerAction(sel))}</p></div></section><section class="card fieldResponse"><h3>What to do now</h3><p>Do not canvass this route.</p><div class="responseLabel">If someone questions the rule</div><p>${esc(sel.challenge||sel.script||'Do not argue. Stop and contact manager/compliance.')}</p><div class="responseLabel">Official source</div>${sourceProof(sel)}</section><section class="card"><details open><summary>Why?</summary><div class="detail">${esc(cleanDetail(sel.why))}</div></details></section>`;bindCityBack();return
  }
  if(releaseStep===0)return releaseSetup();if(releaseStep>=1&&releaseStep<=5)return releaseCheck();return releaseFinal();
}
async function copy(){let r=makeReleaseRecord();if(!r){toast('No Daily Check record is available yet.');return}return copyRecord(r)}
