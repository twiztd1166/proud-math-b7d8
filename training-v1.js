let puPage='home';
const PU_VERSION='2026.08.16-pu-v1-shell';
const PU_PATH=[
  {id:'foundation',name:'Foundation',short:'Start here'},
  {id:'field-ready',name:'Field Ready',short:'Ready to knock'},
  {id:'canvasser',name:'Certified Canvasser',short:'Core production'},
  {id:'senior',name:'Senior Canvasser',short:'Advanced field skills'},
  {id:'sales-apprentice',name:'Sales Apprentice',short:'Bridge to sales'},
  {id:'sales-rep',name:'Sales Rep',short:'Full sales academy'}
];
const PU_LESSONS=[
  {
    id:'foundation-welcome',
    stage:'foundation',
    title:'Welcome to Paradise University',
    minutes:5,
    summary:'Understand the career path, the purpose of training, and the difference between field rules and source training.',
    learn:'Paradise University is built to help you become excellent in the field and prepare for future advancement. The live municipality instructions control what you may do in the field. Training examples never override the current lookup result.',
    practice:'Open Career Path and identify the next two stages after Certified Canvasser.',
    pass:'Know this rule: current Paradise field instructions control over generic or historical training examples.'
  },
  {
    id:'foundation-role',
    stage:'foundation',
    title:'Your Role at the Door',
    minutes:7,
    summary:'Learn the appointment-setting boundary and the professional standard for every homeowner interaction.',
    learn:'The canvasser creates the next conversation. Your job is to identify a possible project, explain the value of a future appointment, set a real appointment when appropriate, record accurate information, and leave professionally. Do not turn the doorstep into the sales appointment.',
    practice:'Say the role in one sentence: “I create the next conversation; I do not complete the sale at the door.”',
    pass:'Be able to explain the difference between appointment-setting and conducting the sale.'
  },
  {
    id:'field-lookup',
    stage:'field-ready',
    title:'Check the Municipality Before You Knock',
    minutes:8,
    summary:'Use the live lookup for GO/NO-GO, hours, literature, courtesy-notice, and special conditions.',
    learn:'Before a route begins, use the live municipality lookup. Canvassing permission, door-hanger permission, and courtesy-notice permission are separate. If the field situation conflicts with the app, stop and ask Compliance before continuing.',
    practice:'Return to Lookup and find one GO area and one NO-GO area without starting a Daily Check.',
    pass:'Know that training never creates permission to canvass a NO-GO area.'
  },
  {
    id:'field-opening',
    stage:'field-ready',
    title:'Opening & First 20 Seconds',
    minutes:10,
    summary:'Learn the approved opening, delivery, pace, body language, and transition into the first project question.',
    learn:'The opening should be short, natural, professional, and consistent. Good delivery means calm pace, clear volume, appropriate distance, eye contact, and no over-explaining. Practice the approved Paradise wording exactly as assigned by your manager.',
    practice:'Deliver the opening three times: normal pace, slightly slower, then conversational pace. Keep the words consistent.',
    pass:'Manager or trainer verifies the opening and delivery.'
  },
  {
    id:'canvass-listen',
    stage:'canvasser',
    title:'Listen Before You Respond',
    minutes:8,
    summary:'Use one question to understand what the homeowner actually means before answering.',
    learn:'Acknowledge, understand, respond, then return to the appointment when appropriate. Do not argue. A hesitation may be explored; a clear refusal ends the conversation.',
    practice:'Homeowner says “Not right now.” Respond with one acknowledgement and one useful question.',
    pass:'Do not automatically treat uncertainty as consent or interest.'
  },
  {
    id:'canvass-appointment',
    stage:'canvasser',
    title:'Set a Quality Appointment',
    minutes:10,
    summary:'Turn real project interest into a definite appointment with accurate information.',
    learn:'A strong appointment has a real project, a reason the visit is useful, an actual time, the correct household information under current Paradise policy, and accurate contact/project notes. Calendar volume without quality is not the goal.',
    practice:'Practice moving from “Yes, we have thought about replacing them” to two actual appointment choices.',
    pass:'Verify name, property, product, reason, time, contact information, and required household details.'
  },
  {
    id:'senior-quality',
    stage:'senior',
    title:'Advanced Appointment Quality',
    minutes:10,
    summary:'Understand what helps an appointment confirm, issue, demo, and become a sale.',
    learn:'Senior canvassers look beyond the raw set. Better notes, accurate scope, clear homeowner expectations, and professional handoff improve downstream results and prepare you for sales or management.',
    practice:'Review a sample appointment and identify one missing detail that could hurt the sales rep.',
    pass:'Explain why appointment quality matters more than raw calendar count.'
  },
  {
    id:'sales-apprentice-intro',
    stage:'sales-apprentice',
    title:'Introduction to the Sales Apprentice Track',
    minutes:8,
    summary:'See how canvassing skills become deeper sales skills without changing your doorstep role.',
    learn:'Listening becomes needs analysis. Project discovery becomes full survey. Value of the visit becomes value building. Appointment closing becomes part of a complete in-home sales process. Sales Apprentice material prepares you for that future role; it does not authorize pricing, financing, contracts, or selling at the door.',
    practice:'Identify three canvassing skills that transfer directly to sales.',
    pass:'Know the boundary: SALES TRAINING — NOT AUTHORIZATION TO PRICE OR SELL AT THE DOOR.'
  }
];
function puRead(){try{return JSON.parse(localStorage.puProgress||'{}')}catch{return{}}}
function puWrite(v){localStorage.puProgress=JSON.stringify(v)}
function puCompleted(){return Object.values(puRead()).filter(x=>x&&x.complete).length}
function puLessonDone(id){return!!puRead()[id]?.complete}
function puMark(id,complete=true){let p=puRead();p[id]={...(p[id]||{}),complete,updatedAt:new Date().toISOString()};puWrite(p);renderTraining()}
function puNextLesson(){return PU_LESSONS.find(x=>!puLessonDone(x.id))||PU_LESSONS[PU_LESSONS.length-1]}
function puStageStatus(stage){let lessons=PU_LESSONS.filter(x=>x.stage===stage);if(!lessons.length)return'future';let done=lessons.filter(x=>puLessonDone(x.id)).length;if(done===lessons.length)return'done';if(done>0||puNextLesson()?.stage===stage)return'current';return'future'}
function puSetPage(page){puPage=page;renderTraining();scrollTo(0,0)}
function puHome(){
  const next=puNextLesson(),done=puCompleted(),pct=Math.round((done/PU_LESSONS.length)*100);
  M.innerHTML=`<section class="puHero"><small>PARADISE UNIVERSITY</small><h2>Train. Practice. Advance.</h2><p>Simple training for the field today and your next role tomorrow.</p></section>
  <button class="puContinue" id="puContinue"><small>NEXT UP · ${esc(next.minutes)} MIN</small><b>${esc(next.title)}</b><span>${esc(next.summary)}</span></button>
  <div class="puGrid">
    <button class="puTile" data-pu="practice"><span class="puIcon">◎</span><b>Practice</b><small>Opening, objections, appointments, and field rules.</small></button>
    <button class="puTile" data-pu="career"><span class="puIcon">↗</span><b>Career Path</b><small>Canvasser → Senior → Sales or Manager.</small></button>
    <button class="puTile" data-pu="media"><span class="puIcon">▶</span><b>Videos & Audio</b><small>Required playlists and deeper source training.</small></button>
    <button class="puTile" data-pu="progress"><span class="puIcon">✓</span><b>My Progress</b><small>${done} of ${PU_LESSONS.length} starter lessons complete.</small></button>
  </div>
  <div class="puSection">Your path</div><div class="puPath">${PU_PATH.map(s=>`<button class="puStage ${puStageStatus(s.id)}" data-stage="${esc(s.id)}"><small>${puStageStatus(s.id)==='done'?'Complete':puStageStatus(s.id)==='current'?'Current':'Up next'}</small><b>${esc(s.name)}</b><span class="puLockedNote">${esc(s.short)}</span></button>`).join('')}</div>
  <div class="puProgressBar"><span style="width:${pct}%"></span></div><div class="puProgressText"><span>Starter curriculum</span><span>${pct}%</span></div>
  <div class="puNotice"><b>Field rule:</b> Live municipality instructions always override generic training examples. Return to Lookup any time you need the current field answer.</div>`;
  document.getElementById('puContinue').onclick=()=>puSetPage('lesson:'+next.id);
  document.querySelectorAll('[data-pu]').forEach(b=>b.onclick=()=>puSetPage(b.dataset.pu));
  document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>puSetPage('stage:'+b.dataset.stage));
}
function puPractice(){M.innerHTML=`<button class="back puBack" id="puBack">← Training</button><h2>Practice</h2><p class="sub">Pick one skill. Keep drills short and repeat them often.</p><div class="puSection">Practice now</div><div class="puGrid"><button class="puTile" data-drill="opening"><span class="puIcon">◉</span><b>Practice Opening</b><small>First 20 seconds, pace, confidence, delivery.</small></button><button class="puTile" data-drill="objections"><span class="puIcon">↔</span><b>Practice Objections</b><small>Acknowledge, understand, respond, return.</small></button><button class="puTile" data-drill="appointments"><span class="puIcon">▣</span><b>Practice Appointments</b><small>Transition, two choices, verification, quality.</small></button><button class="puTile" data-drill="rules"><span class="puIcon">!</span><b>Practice Field Rules</b><small>NO-GO, refusal, HOA, permit, literature.</small></button></div><div id="puDrill" class="card"><div class="puEmpty">Choose a drill above. Full randomized scenarios are added in the next content pass.</div></div>`;document.getElementById('puBack').onclick=()=>puSetPage('home');document.querySelectorAll('[data-drill]').forEach(b=>b.onclick=()=>{let map={opening:['Opening Drill','Deliver the approved opening at a calm conversational pace. Stop after the first project question and wait for the homeowner.'],objections:['Objection Drill','Homeowner: “Not right now.” Acknowledge it and ask one question that helps you understand whether there is a future project.'],appointments:['Appointment Drill','Homeowner says the project is still being considered. Explain the value of the future visit in one sentence, then offer two real appointment choices.'],rules:['Field Rule Drill','The resident says “Leave my property.” The correct action is to stop the conversation and leave. Do not rebut a direct refusal.']};let d=map[b.dataset.drill];document.getElementById('puDrill').innerHTML=`<div class="puLessonStep"><small>PRACTICE</small><h3>${esc(d[0])}</h3><p>${esc(d[1])}</p></div>`})}
function puCareer(){M.innerHTML=`<button class="back puBack" id="puBack">← Training</button><h2>Career Path</h2><p class="sub">Everyone can look ahead. Certifications show what you have mastered.</p><div class="puSection">Field to sales</div><div class="puList">${PU_PATH.map((s,i)=>`<button data-stage="${esc(s.id)}"><b>${i+1}. ${esc(s.name)}</b><small>${esc(s.short)} · ${puStageStatus(s.id)==='done'?'Complete':puStageStatus(s.id)==='current'?'Current':'Available to explore'}</small></button>`).join('')}</div><div class="puSection">Leadership branch</div><div class="card"><div class="row"><div class="lab">SENIOR CANVASSER → CANVASS MANAGER</div><div class="val">Leadership, coaching, territory management, appointment quality, KPIs, compliance, and developing future sales reps.</div></div></div>`;document.getElementById('puBack').onclick=()=>puSetPage('home');document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>puSetPage('stage:'+b.dataset.stage))}
function puMedia(){M.innerHTML=`<button class="back puBack" id="puBack">← Training</button><h2>Videos & Audio</h2><p class="sub">One simple library. Resume playback and curated playlists come next.</p><div class="puSection">Required for you</div><section class="card"><div class="puMediaCard"><span class="puBadge approved">PARADISE APPROVED</span><b>Opening & First 20 Seconds</b><small>Paradise demonstration · media placeholder</small><button class="puMediaBtn" disabled>COMING IN MEDIA PASS</button></div></section><div class="puSection">Go deeper</div><section class="card"><div class="puMediaCard"><span class="puBadge reference">REFERENCE</span><b>Tony Hoty</b><small>Canvassing, scripting, rebuttals, audio training.</small></div><div class="puMediaCard"><span class="puBadge reference">REFERENCE</span><b>Dave Yoho</b><small>Canvassing systems, value of visit, communication, management.</small></div><div class="puMediaCard"><span class="puBadge reference">REFERENCE</span><b>Rick Grosso / Grosso University</b><small>Delivery, objections, sales development, management, masterclasses.</small></div></section><div class="puNotice">Original source material is reference unless Paradise has rewritten and approved it as current training.</div>`;document.getElementById('puBack').onclick=()=>puSetPage('home')}
function puProgress(){let done=puCompleted(),pct=Math.round((done/PU_LESSONS.length)*100),next=puNextLesson();M.innerHTML=`<button class="back puBack" id="puBack">← Training</button><h2>My Progress</h2><p class="sub">Simple progress on this device for the v1 build.</p><section class="card"><div class="row"><div class="lab">CURRENT STAGE</div><div class="val strong">${esc(PU_PATH.find(x=>puStageStatus(x.id)==='current')?.name||'Foundation')}</div></div><div class="row"><div class="lab">STARTER CURRICULUM</div><div class="puProgressBar"><span style="width:${pct}%"></span></div><div class="puProgressText"><span>${done} complete</span><span>${pct}%</span></div></div><div class="row"><div class="lab">NEXT RECOMMENDED</div><div class="val strong">${esc(next.title)}</div></div></section><div class="puSection">Completed</div><div class="puList">${PU_LESSONS.filter(x=>puLessonDone(x.id)).map(x=>`<button data-lesson="${esc(x.id)}"><b>✓ ${esc(x.title)}</b><small>${esc(PU_PATH.find(s=>s.id===x.stage)?.name||x.stage)}</small></button>`).join('')||'<div class="puEmpty">Complete your first lesson to start your progress history.</div>'}</div>`;document.getElementById('puBack').onclick=()=>puSetPage('home');document.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>puSetPage('lesson:'+b.dataset.lesson))}
function puStage(stage){let s=PU_PATH.find(x=>x.id===stage);let lessons=PU_LESSONS.filter(x=>x.stage===stage);M.innerHTML=`<button class="back puBack" id="puBack">← Career Path</button><h2>${esc(s?.name||'Training')}</h2><p class="sub">${esc(s?.short||'')}</p><div class="puSection">Lessons</div><div class="puList">${lessons.length?lessons.map(x=>`<button data-lesson="${esc(x.id)}"><b>${puLessonDone(x.id)?'✓ ':''}${esc(x.title)}</b><small>${esc(x.minutes)} min · ${esc(x.summary)}</small></button>`).join(''):'<div class="puEmpty">This stage is mapped in the build contract and will be filled during the content pass. You may still explore it now.</div>'}</div>${stage==='sales-apprentice'?'<div class="puNotice"><b>SALES TRAINING:</b> This material prepares you for a future sales role. It is not authorization to price, finance, contract, or sell at the door.</div>':''}`;document.getElementById('puBack').onclick=()=>puSetPage('career');document.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>puSetPage('lesson:'+b.dataset.lesson))}
function puLesson(id){let x=PU_LESSONS.find(l=>l.id===id);if(!x){puSetPage('home');return}let done=puLessonDone(id);M.innerHTML=`<button class="back puBack" id="puBack">← Training</button><div class="head"><div><h2>${esc(x.title)}</h2><p>${esc(PU_PATH.find(s=>s.id===x.stage)?.name||x.stage)} · ${esc(x.minutes)} min</p></div>${done?'<span class="puBadge approved">COMPLETE</span>':''}</div><section class="card"><div class="puLessonStep"><small>LEARN</small><h3>What to know</h3><p>${esc(x.learn)}</p></div><div class="puLessonStep"><small>WATCH / LISTEN</small><h3>Media</h3><p>Curated media will attach here in the dedicated media pass. The lesson remains usable without leaving the app.</p></div><div class="puLessonStep"><small>PRACTICE</small><h3>Do it</h3><p>${esc(x.practice)}</p></div><div class="puLessonStep"><small>PASS</small><h3>Check yourself</h3><p>${esc(x.pass)}</p><div class="puLessonActions"><button id="puDone" class="btn primary">${done?'MARK INCOMPLETE':'MARK COMPLETE'}</button><button id="puNext" class="btn secondary">NEXT LESSON</button></div></div></section><div class="puNotice"><b>Authority:</b> Paradise-approved lesson. Current field instructions still control the actual route.</div>`;document.getElementById('puBack').onclick=()=>puSetPage('home');document.getElementById('puDone').onclick=()=>{puMark(id,!done);puSetPage('lesson:'+id)};document.getElementById('puNext').onclick=()=>{let i=PU_LESSONS.findIndex(l=>l.id===id),n=PU_LESSONS[Math.min(i+1,PU_LESSONS.length-1)];puSetPage('lesson:'+n.id)}}
function renderTraining(){if(view!=='training')return;if(puPage==='home')return puHome();if(puPage==='practice')return puPractice();if(puPage==='career')return puCareer();if(puPage==='media')return puMedia();if(puPage==='progress')return puProgress();if(puPage.startsWith('stage:'))return puStage(puPage.slice(6));if(puPage.startsWith('lesson:'))return puLesson(puPage.slice(7));puPage='home';puHome()}
window.PARADISE_UNIVERSITY_VERSION=PU_VERSION;