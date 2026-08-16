(()=>{
  const manager=window.PU_CONTENT?.manager;
  const managerLessons=window.PU_CONTENT?.managerLessons||[];
  if(!manager||!managerLessons.length)return;
  const baseCareer=puCareer,baseStage=puStage,baseLesson=puLesson;
  const managerDone=()=>managerLessons.filter(x=>puLessonDone(x.id)).length;
  const managerActions=[
    {label:'Train a Rep',lesson:'manager-train-rep',detail:'Train a New Rep · repeatable learn, practice, test, field-verify loop.'},
    {label:'Coach in the Field',lesson:'manager-ridealong',detail:'Ride-Along Coaching · observe first, then coach one behavior.'},
    {label:'Run Today’s Huddle',lesson:'manager-huddle',detail:'Run a 10-Minute Huddle · one compliance point, one skill, one live drill.'},
    {label:'Review Appointments',lesson:'manager-appointment-qa',detail:'Appointment Quality Review · audit the set and the behavior that created it.'},
    {label:'Review Numbers',lesson:'manager-funnel',detail:'Manage the Funnel, Not One Number · diagnose the first weak conversion.'},
    {label:'Compliance Help',lesson:'manager-compliance',detail:'Compliance Leadership · live municipality instructions remain the authority.'},
    {label:'Develop Future Sales Reps',lesson:'manager-future-sales',detail:'Develop Future Sales Reps · quality, behavior, learning readiness, and production.'}
  ];
  puCareer=function(){
    const done=managerDone();
    M.innerHTML=`<button class="back puBack" id="puBack">← Training</button><h2>Career Path</h2><p class="sub">Everyone can look ahead. Certification shows what you have demonstrated, not what you are allowed to view.</p><div class="puSection">Field to sales</div><div class="puList">${PU_PATH.map((s,i)=>`<button data-stage="${esc(s.id)}"><b>${i+1}. ${esc(s.name)}</b><small>${esc(s.short)} · ${puStageStatus(s.id)==='done'?'Complete':puStageStatus(s.id)==='current'?'Current':'Available to explore'}</small></button>`).join('')}</div><div class="puSection">Leadership branch</div><div class="puList"><button data-stage="manager"><b>${esc(manager.name)}</b><small>Senior Canvasser → Manager · ${done}/${managerLessons.length} lessons complete</small></button></div><div class="puNotice"><b>Simple path:</b> Canvassers can grow toward Sales, Management, or both. Manager lessons do not interrupt your normal Continue Training queue.</div>`;
    document.getElementById('puBack').onclick=()=>puSetPage('home');
    document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>puSetPage('stage:'+b.dataset.stage));
  };
  puStage=function(stage){
    if(stage!=='manager')return baseStage(stage);
    const done=managerDone();
    M.innerHTML=`<button class="back puBack" id="puBack">← Career Path</button><h2>${esc(manager.name)}</h2><p class="sub">Choose the manager job you need to do right now. The full curriculum stays available below.</p><div class="puNotice"><b>Manager rule:</b> The manager does not override the live municipality result or invent field exceptions. Paradise’s current field controls remain the authority.</div><div class="puSection">Manager tools</div><div class="puGrid">${managerActions.map((a,i)=>`<button class="puTile" data-manager-action="${esc(a.lesson)}"><span class="puIcon">${['↗','◎','◉','▣','▤','!','★'][i]}</span><b>${esc(a.label)}</b><small>${esc(a.detail)}</small></button>`).join('')}</div><details class="puSources puManagerCurriculum"><summary>Full Manager Curriculum · ${done}/${managerLessons.length} complete</summary><div class="puList">${managerLessons.map(x=>`<button data-manager-lesson="${esc(x.id)}"><b>${puLessonDone(x.id)?'✓ ':''}${esc(x.title)}</b><small>${esc(x.minutes)} min · ${esc(x.summary)}</small></button>`).join('')}</div></details>`;
    document.getElementById('puBack').onclick=()=>puSetPage('career');
    document.querySelectorAll('[data-manager-action]').forEach(b=>b.onclick=()=>puSetPage('lesson:'+b.dataset.managerAction));
    document.querySelectorAll('[data-manager-lesson]').forEach(b=>b.onclick=()=>puSetPage('lesson:'+b.dataset.managerLesson));
  };
  puLesson=function(id){
    const x=managerLessons.find(l=>l.id===id);
    if(!x)return baseLesson(id);
    const done=puLessonDone(id);
    M.innerHTML=`<button class="back puBack" id="puBack">← Manager Academy</button><div class="head"><div><h2>${esc(x.title)}</h2><p>${esc(manager.name)} · ${esc(x.minutes)} min</p></div>${done?'<span class="puBadge approved">COMPLETE</span>':''}</div><div class="puAuthority"><span class="puBadge approved">PARADISE APPROVED</span><small>Manager training · current field lookup still controls the actual route.</small></div><section class="card"><div class="puLessonStep"><small>LEARN</small><h3>What to know</h3><p>${esc(x.learn)}</p></div><div class="puLessonStep"><small>WATCH / LISTEN</small><h3>Relevant media</h3>${puLessonMedia(x.media)}</div><div class="puLessonStep"><small>PRACTICE</small><h3>Do it</h3><p>${esc(x.practice)}</p></div><div class="puLessonStep"><small>PASS</small><h3>Check yourself</h3><p>${esc(x.pass)}</p><div class="puLessonActions"><button id="puDone" class="btn primary">${done?'MARK INCOMPLETE':'MARK COMPLETE'}</button><button id="puNext" class="btn secondary">NEXT MANAGER LESSON</button></div></div></section>${puSourceLinks(x.sources)}<div class="puNotice"><b>Authority:</b> Source material helps explain methods. Current Paradise policy, field controls, and current company standards control operations.</div>`;
    document.getElementById('puBack').onclick=()=>puSetPage('stage:manager');
    document.getElementById('puDone').onclick=()=>{puMark(id,!done);puSetPage('lesson:'+id)};
    document.getElementById('puNext').onclick=()=>{let i=managerLessons.findIndex(l=>l.id===id),n=managerLessons[Math.min(i+1,managerLessons.length-1)];puSetPage('lesson:'+n.id)};
    if(typeof puBindMediaButtons==='function')puBindMediaButtons(M);
  };
  window.PU_MANAGER_UI_VERSION='2026.08.16-pu-manager-ui-v2';
})();
