function checkSummary(){return checks.map(x=>`<div class="summaryCheck"><span>${esc(x.title)}</span><b class="state ${esc(form.c[x.key]||'MISSING')}">${esc(form.c[x.key]||'NOT SET')}</b></div>`).join('')}
function sourceProof(r){const refs=pcmAuthorityRefs(r),src=r.sources||[];return`${refs.length?`<div class="authorityRefs"><b>Authority references in controlled rationale:</b> ${refs.map(esc).join(' · ')}</div>`:''}${src.map((u,i)=>`<div class="sourceRef">${esc(pcmSourceDescriptor(u,i))}</div><a class="source" href="${esc(u)}" target="_blank" rel="noopener">Open official source ${i+1}</a>`).join('')}${!navigator.onLine?'<div class="offlineSourceNote">Offline: authority labels and controlled rationale remain available; external official-source pages require a connection.</div>':''}`}
function fieldResponseCard(){
  const b=blockingCheck();
  let now='Do not deploy. Resolve the final-decision reason above before starting a new release.';
  if(b?.value==='STOP')now=`Do not deploy. ${b.x.title} was marked STOP. Correct that condition before any new release.`;
  if(b?.value==='ESCALATE')now=`Do not deploy. ${b.x.title} was marked ESCALATE. Contact manager/compliance and resolve the issue before any new release.`;
  if(currentDeployBlock())now='Do not deploy from this build. Update to the newer validated controlled register, then start a new release.';
  return`<section class="card fieldResponse"><h3>What to do now</h3><p>${esc(now)}</p><div class="responseLabel">Manager next action</div><p>${esc(sel.nextAction||'Stop and resolve the issue before resuming.')}</p><div class="responseLabel">What to say / challenge handling</div><p>${esc(sel.challenge||sel.script||'Do not argue. Stop and contact manager/compliance.')}</p><div class="responseLabel">Official proof</div>${sourceProof(sel)}</section>`;
}
function releaseFinal(){
  let d=decision();if(!form.completedAt)form.completedAt=new Date().toISOString();form.releaseDate=form.releaseDate||localDateISO(new Date(form.completedAt));form.releaseId=form.releaseId||pcmNewReleaseId();
  let saved=saveCurrentRelease(),when=new Date(form.completedAt).toLocaleString(),p=window.PCM_PROVENANCE||{},build=window.PCM_BUILD_COMMIT||'—';
  M.innerHTML=`${releaseHeader()}<section class="finalDecision ${d[0]?'yes':'no'}"><small>FINAL DECISION</small><div class="finalSymbol">${d[0]?'✓':'✕'}</div><h3>${d[0]?'DEPLOY':'DO NOT DEPLOY'}</h3><p>${esc(d[1])}</p></section>${saved?`<div class="savedBanner">✓ SAVED ON THIS DEVICE</div>`:`<div class="saveWarning">! DEVICE SAVE FAILED — COPY THIS RECORD</div>`}<div class="scopeBanner"><b>Release scope:</b> ${esc(releaseScopeText(form.releaseDate))}</div>${!d[0]?fieldResponseCard():''}<section class="card finalFacts">${row('Release ID',form.releaseId,'strong')}${row('Release date',form.releaseDate,'strong')}${row('Municipality',sel.name,'strong')}${row('Exact route / address',form.address,'strong')}${row('Manager',form.manager||'—')}${row('Office / Team',form.office||'—')}${row('Territory / Route',form.route||'—')}${row('Completed',when)}${row('Controlled snapshot',db.meta.snapshotDate)}${row('App version',p.appVersion||window.PCM_BUILD_VERSION||'—')}${row('Dataset SHA-256',p.datasetSha256||'—')}${row('Build commit',build)}</section><section class="card checkSummary">${checkSummary()}</section><div class="field"><label>Notes / Exception / New-Conflict Reference</label><textarea id="notes" class="textarea" placeholder="Optional notes">${esc(form.notes)}</textarea></div><div class="actions finalActions"><button id="newRoute" class="btn primary">START NEW ROUTE</button><button id="historyBtn" class="btn secondary">View history</button><button id="share" class="btn secondary">Share record</button><button id="copy" class="btn secondary">Copy record</button><button id="review" class="btn secondary">Review checks</button></div><div class="notice"><b>Recordkeeping status.</b> This release is stored automatically on this device. Export History when a durable copy is needed.</div>`;
  bindCityBack();
  document.getElementById('notes').oninput=e=>{form.notes=e.target.value;saveCurrentRelease()};
  document.getElementById('copy').onclick=copy;
  document.getElementById('share').onclick=()=>{let r=makeReleaseRecord();if(r)shareRecord(r)};
  document.getElementById('review').onclick=()=>{form.completedAt='';form.releaseId='';form.releaseDate='';releaseStep=1;release()};
  document.getElementById('newRoute').onclick=home;
  document.getElementById('historyBtn').onclick=()=>setView('history');
}
function release(){
  if(!sel){M.innerHTML=`<div class="empty"><h2>Select a municipality first</h2><p>Daily Release is tied to a controlled lookup.</p><button class="btn primary" id="go">Go to lookup</button></div>`;document.getElementById('go').onclick=()=>setView('lookup');return}
  if(sel.release!=='GO'){
    let s=status(sel);M.innerHTML=`<div class="head"><div><h2>Daily Release</h2><p>${esc(sel.name)}</p></div><button class="back" id="cityBack">Back</button></div><section class="traffic stop"><div class="trafficSymbol">✕</div><div><small>RELEASE BLOCKED</small><h3>${esc(s.label)}</h3><p>${esc(sel.nextAction)}</p></div></section><section class="card fieldResponse"><h3>What to do now</h3><p>Do not deploy this ordinary uninvited route.</p><div class="responseLabel">What to say / challenge handling</div><p>${esc(sel.challenge||sel.script||'Do not argue. Stop and contact manager/compliance.')}</p><div class="responseLabel">Official proof</div>${sourceProof(sel)}</section><section class="card"><details open><summary>Why this status?</summary><div class="detail">${esc(sel.why)}</div></details></section>`;bindCityBack();return
  }
  if(releaseStep===0)return releaseSetup();if(releaseStep>=1&&releaseStep<=5)return releaseCheck();return releaseFinal();
}
async function copy(){let r=makeReleaseRecord();if(!r){toast('Release record unavailable.');return}return copyRecord(r)}
