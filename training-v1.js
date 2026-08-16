let puPage='home';
const PU=window.PU_CONTENT||{version:'missing',path:[],lessons:[],media:[],drills:[],sources:{}};
const PU_VERSION=PU.version;
const PU_PATH=PU.path||[];
const PU_LESSONS=PU.lessons||[];
const PU_MEDIA=PU.media||[];
const PU_DRILLS=PU.drills||[];
const PU_SOURCES=PU.sources||{};

function puRead(){try{return JSON.parse(localStorage.puProgress||'{}')}catch{return{}}}
function puWrite(v){localStorage.puProgress=JSON.stringify(v)}
function puCompleted(){return PU_LESSONS.filter(x=>puLessonDone(x.id)).length}
function puLessonDone(id){return!!puRead()[id]?.complete}
function puMark(id,complete=true){let p=puRead();p[id]={...(p[id]||{}),complete,updatedAt:new Date().toISOString(),trainingVersion:PU_VERSION};puWrite(p)}
function puNextLesson(){return PU_LESSONS.find(x=>!puLessonDone(x.id))||PU_LESSONS[PU_LESSONS.length-1]}
function puStageStatus(stage){let lessons=PU_LESSONS.filter(x=>x.stage===stage);if(!lessons.length)return'future';let done=lessons.filter(x=>puLessonDone(x.id)).length;if(done===lessons.length)return'done';if(done>0||puNextLesson()?.stage===stage)return'current';return'future'}
function puSetPage(page){puPage=page;renderTraining();scrollTo(0,0)}
function puAuthorityClass(a){return a==='PARADISE_APPROVED'?'approved':a==='HISTORICAL'?'historical':'reference'}
function puMediaByIds(ids=[]){return ids.map(id=>PU_MEDIA.find(m=>m.id===id)).filter(Boolean)}
function puSourceByIds(ids=[]){return ids.map(id=>PU_SOURCES[id]).filter(Boolean)}
function puMediaCard(m){return`<div class="puMediaCard"><div class="puMediaTop"><span class="puBadge ${puAuthorityClass(m.authority)}">${esc(m.authority==='HISTORICAL'?'HISTORICAL':m.authority)}</span><span class="puType">${m.type==='audio'?'AUDIO':'VIDEO'}</span></div><b>${esc(m.title)}</b><small>${esc(m.trainer)} · ${esc(m.note||'')}</small><a class="puOpen" href="${esc(m.url)}" target="_blank" rel="noopener">OPEN IN DRIVE ↗</a></div>`}
function puSourceLinks(ids=[]){let s=puSourceByIds(ids);if(!s.length)return'';return`<details class="puSources"><summary>Go deeper / source material</summary><div class="puSourceList">${s.map(x=>`<a href="${esc(x.url)}" target="_blank" rel="noopener"><span><b>${esc(x.title)}</b><small>${esc(x.authority)} · not current field authority</small></span><b>↗</b></a>`).join('')}</div></details>`}
function puLessonMedia(ids=[]){let m=puMediaByIds(ids);if(!m.length)return'<p>No media is required for this lesson.</p>';return`<div class="puLessonMedia">${m.map(puMediaCard).join('')}</div>`}

function puHome(){
  const next=puNextLesson(),done=puCompleted(),pct=PU_LESSONS.length?Math.round((done/PU_LESSONS.length)*100):0;
  M.innerHTML=`<section class="puHero"><small>PARADISE UNIVERSITY</small><h2>Train. Practice. Advance.</h2><p>Simple training for the field today and your next role tomorrow.</p></section>
  <button class="puContinue" id="puContinue"><small>NEXT UP · ${esc(next?.minutes||0)} MIN</small><b>${esc(next?.title||'Training')}</b><span>${esc(next?.summary||'')}</span></button>
  <div class="puGrid">
    <button class="puTile" data-pu="practice"><span class="puIcon">◎</span><b>Practice</b><small>Opening, objections, appointments, and field rules.</small></button>
    <button class="puTile" data-pu="career"><span class="puIcon">↗</span><b>Career Path</b><small>Canvasser → Senior → Sales or Manager.</small></button>
    <button class="puTile" data-pu="media"><span class="puIcon">▶</span><b>Videos & Audio</b><small>Curated essentials and deeper source training.</small></button>
    <button class="puTile" data-pu="progress"><span class="puIcon">✓</span><b>My Progress</b><small>${done} of ${PU_LESSONS.length} lessons complete.</small></button>
  </div>
  <div class="puSection">Your path</div><div class="puPath">${PU_PATH.map(s=>`<button class="puStage ${puStageStatus(s.id)}" data-stage="${esc(s.id)}"><small>${puStageStatus(s.id)==='done'?'Complete':puStageStatus(s.id)==='current'?'Current':'Up next'}</small><b>${esc(s.name)}</b><span class="puLockedNote">${esc(s.short)}</span></button>`).join('')}</div>
  <div class="puProgressBar"><span style="width:${pct}%"></span></div><div class="puProgressText"><span>Current curriculum</span><span>${pct}%</span></div>
  <div class="puNotice"><b>Field rule:</b> Live municipality instructions always override generic training examples. Return to Lookup any time you need the current field answer.</div>`;
  document.getElementById('puContinue').onclick=()=>next&&puSetPage('lesson:'+next.id);
  document.querySelectorAll('[data-pu]').forEach(b=>b.onclick=()=>puSetPage(b.dataset.pu));
  document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>puSetPage('stage:'+b.dataset.stage));
}

function puPractice(){
  const cats=['Opening','Objections','Appointments','Field Rules'];
  M.innerHTML=`<button class="back puBack" id="puBack">← Training</button><h2>Practice</h2><p class="sub">Pick one skill. Keep the drill short, say the answer out loud, then check it.</p><div class="puSection">Practice now</div><div class="puGrid">${cats.map((c,i)=>`<button class="puTile" data-cat="${esc(c)}"><span class="puIcon">${['◉','↔','▣','!'][i]}</span><b>${esc(c)}</b><small>${esc(c==='Opening'?'First 20 seconds and delivery.':c==='Objections'?'Understand before responding.':c==='Appointments'?'Transition, choices, quality.':'NO-GO, refusals, access, literature.')}</small></button>`).join('')}</div><div id="puDrill" class="card"><div class="puEmpty">Choose a practice category above.</div></div>`;
  document.getElementById('puBack').onclick=()=>puSetPage('home');
  document.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>puShowDrill(b.dataset.cat));
}
function puShowDrill(category){
  let pool=PU_DRILLS.filter(x=>x.category===category);if(!pool.length)return;
  let last=Number(sessionStorage['puDrill:'+category]||-1),idx=(last+1)%pool.length;sessionStorage['puDrill:'+category]=idx;let d=pool[idx];
  document.getElementById('puDrill').innerHTML=`<div class="puLessonStep"><small>${esc(d.category)} PRACTICE</small><h3>${esc(d.title)}</h3><p>${esc(d.prompt)}</p><button id="puReveal" class="btn secondary puReveal">SHOW COACHING ANSWER</button><div id="puAnswer" class="puAnswer" hidden><b>COACHING ANSWER</b><p>${esc(d.answer)}</p></div></div>`;
  document.getElementById('puReveal').onclick=()=>{document.getElementById('puAnswer').hidden=false;document.getElementById('puReveal').hidden=true};
}

function puCareer(){
  M.innerHTML=`<button class="back puBack" id="puBack">← Training</button><h2>Career Path</h2><p class="sub">Everyone can look ahead. Certification shows what you have demonstrated, not what you are allowed to view.</p><div class="puSection">Field to sales</div><div class="puList">${PU_PATH.map((s,i)=>`<button data-stage="${esc(s.id)}"><b>${i+1}. ${esc(s.name)}</b><small>${esc(s.short)} · ${puStageStatus(s.id)==='done'?'Complete':puStageStatus(s.id)==='current'?'Current':'Available to explore'}</small></button>`).join('')}</div><div class="puSection">Leadership branch</div><div class="card"><div class="row"><div class="lab">SENIOR CANVASSER → CANVASS MANAGER</div><div class="val">Leadership, coaching, territory management, appointment quality, KPIs, compliance, and developing future sales reps.</div></div></div>`;
  document.getElementById('puBack').onclick=()=>puSetPage('home');
  document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>puSetPage('stage:'+b.dataset.stage));
}

function puMedia(){
  const essentials=PU_MEDIA.filter(x=>x.priority==='ESSENTIAL');
  const optional=PU_MEDIA.filter(x=>x.priority!=='ESSENTIAL');
  M.innerHTML=`<button class="back puBack" id="puBack">← Training</button><h2>Videos & Audio</h2><p class="sub">Curated source media, organized by the skills Paradise actually teaches.</p><div class="puNotice"><b>Important:</b> Original Tony Hoty, Dave Yoho, and Grosso material is reference training. Learn the useful method and concepts; current Paradise scripts, policies, and municipality instructions control.</div><div class="puSection">Canvasser essentials</div><section class="card">${essentials.map(puMediaCard).join('')}</section><div class="puSection">Optional / go deeper</div><section class="card">${optional.map(puMediaCard).join('')}</section><div class="puNotice">The dedicated player pass will add in-app resume, speed controls, seeking, playlists, chapters, and transcript hooks without copying these source files into the public app repository.</div>`;
  document.getElementById('puBack').onclick=()=>puSetPage('home');
}

function puProgress(){
  let done=puCompleted(),pct=PU_LESSONS.length?Math.round((done/PU_LESSONS.length)*100):0,next=puNextLesson();
  M.innerHTML=`<button class="back puBack" id="puBack">← Training</button><h2>My Progress</h2><p class="sub">Simple progress on this device for the v1 working build.</p><section class="card"><div class="row"><div class="lab">CURRENT STAGE</div><div class="val strong">${esc(PU_PATH.find(x=>puStageStatus(x.id)==='current')?.name||PU_PATH[PU_PATH.length-1]?.name||'Foundation')}</div></div><div class="row"><div class="lab">CURRENT CURRICULUM</div><div class="puProgressBar"><span style="width:${pct}%"></span></div><div class="puProgressText"><span>${done} complete</span><span>${pct}%</span></div></div><div class="row"><div class="lab">NEXT RECOMMENDED</div><div class="val strong">${esc(next?.title||'Complete')}</div></div></section><div class="puSection">Completed</div><div class="puList">${PU_LESSONS.filter(x=>puLessonDone(x.id)).map(x=>`<button data-lesson="${esc(x.id)}"><b>✓ ${esc(x.title)}</b><small>${esc(PU_PATH.find(s=>s.id===x.stage)?.name||x.stage)}</small></button>`).join('')||'<div class="puEmpty">Complete your first lesson to start your progress history.</div>'}</div>`;
  document.getElementById('puBack').onclick=()=>puSetPage('home');document.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>puSetPage('lesson:'+b.dataset.lesson));
}

function puStage(stage){
  let s=PU_PATH.find(x=>x.id===stage),lessons=PU_LESSONS.filter(x=>x.stage===stage),notice=stage==='sales-apprentice'?'<div class="puNotice"><b>SALES TRAINING:</b> This material prepares you for a future sales role. It is not authorization to price or sell at the door, present financing at the door, contract, or take payment.</div>':'';
  M.innerHTML=`<button class="back puBack" id="puBack">← Career Path</button><h2>${esc(s?.name||'Training')}</h2><p class="sub">${esc(s?.short||'')}</p>${notice}<div class="puSection">Lessons</div><div class="puList">${lessons.length?lessons.map(x=>`<button data-lesson="${esc(x.id)}"><b>${puLessonDone(x.id)?'✓ ':''}${esc(x.title)}</b><small>${esc(x.minutes)} min · ${esc(x.summary)}</small></button>`).join(''):'<div class="puEmpty">This stage is mapped for the next curriculum pass. You may still explore it now.</div>'}</div>`;
  document.getElementById('puBack').onclick=()=>puSetPage('career');document.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>puSetPage('lesson:'+b.dataset.lesson));
}

function puLesson(id){
  let x=PU_LESSONS.find(l=>l.id===id);if(!x){puSetPage('home');return}let done=puLessonDone(id);
  M.innerHTML=`<button class="back puBack" id="puBack">← Training</button><div class="head"><div><h2>${esc(x.title)}</h2><p>${esc(PU_PATH.find(s=>s.id===x.stage)?.name||x.stage)} · ${esc(x.minutes)} min</p></div>${done?'<span class="puBadge approved">COMPLETE</span>':''}</div><div class="puAuthority"><span class="puBadge approved">PARADISE APPROVED</span><small>Training lesson · current field lookup still controls the actual route.</small></div><section class="card"><div class="puLessonStep"><small>LEARN</small><h3>What to know</h3><p>${esc(x.learn)}</p></div><div class="puLessonStep"><small>WATCH / LISTEN</small><h3>Relevant media</h3>${puLessonMedia(x.media)}</div><div class="puLessonStep"><small>PRACTICE</small><h3>Do it</h3><p>${esc(x.practice)}</p></div><div class="puLessonStep"><small>PASS</small><h3>Check yourself</h3><p>${esc(x.pass)}</p><div class="puLessonActions"><button id="puDone" class="btn primary">${done?'MARK INCOMPLETE':'MARK COMPLETE'}</button><button id="puNext" class="btn secondary">NEXT LESSON</button></div></div></section>${puSourceLinks(x.sources)}<div class="puNotice"><b>Field authority:</b> If this lesson and the live municipality result ever appear to conflict, stop and follow the live field result / Compliance direction.</div>`;
  document.getElementById('puBack').onclick=()=>puSetPage('home');
  document.getElementById('puDone').onclick=()=>{puMark(id,!done);puSetPage('lesson:'+id)};
  document.getElementById('puNext').onclick=()=>{let i=PU_LESSONS.findIndex(l=>l.id===id),n=PU_LESSONS[Math.min(i+1,PU_LESSONS.length-1)];puSetPage('lesson:'+n.id)};
}

function renderTraining(){
  if(view!=='training')return;
  if(puPage==='home')return puHome();
  if(puPage==='practice')return puPractice();
  if(puPage==='career')return puCareer();
  if(puPage==='media')return puMedia();
  if(puPage==='progress')return puProgress();
  if(puPage.startsWith('stage:'))return puStage(puPage.slice(6));
  if(puPage.startsWith('lesson:'))return puLesson(puPage.slice(7));
  puPage='home';puHome();
}
window.PARADISE_UNIVERSITY_VERSION=PU_VERSION;
