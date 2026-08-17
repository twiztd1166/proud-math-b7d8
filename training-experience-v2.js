(()=>{
  if(typeof puHome!=='function'||typeof puMedia!=='function'||typeof puProgress!=='function'||typeof puLesson!=='function'||typeof renderTraining!=='function')return;
  const VERSION='2026.08.17-pu-training-experience-v2';
  const CORE_TRACK_END='canvasser';
  const trackOrder=['foundation','field-ready','canvasser'];
  const coreLessons=()=>PU_LESSONS.filter(x=>trackOrder.includes(x.stage));
  const ready=x=>typeof window.puLessonTrainingReady==='function'?window.puLessonTrainingReady(x.id):puLessonDone(x.id);
  const nextCore=()=>coreLessons().find(x=>!ready(x))||null;
  const stageName=id=>PU_PATH.find(x=>x.id===id)?.name||id;
  const compactStage=()=>{
    const next=nextCore();
    if(next)return{current:stageName(next.stage),next:trackOrder[trackOrder.indexOf(next.stage)+1]?stageName(trackOrder[trackOrder.indexOf(next.stage)+1]):'Canvasser complete'};
    return{current:'Canvasser',next:'Senior / Sales / Manager by advancement'};
  };
  const uniqueById=items=>{const seen=new Set();return items.filter(x=>x&&!seen.has(x.id)&&seen.add(x.id))};
  const mediaById=id=>(window.PU_CONTENT?.media||[]).find(x=>x.id===id);
  const curated=()=>((window.PU_CONTENT?.media)||[]).filter(x=>x.priority!=='SOURCE_LIBRARY'&&(typeof puMediaRightsStatus!=='function'||puMediaRightsStatus(x).playAllowed));
  const mediaStatus=x=>typeof puMediaProgressStatus==='function'?puMediaProgressStatus(x.id):{};
  const card=m=>puMediaCard(m);
  const section=(title,items,empty='')=>`<div class="puSection">${esc(title)}</div><section class="card puMediaPlaylist" data-playlist="${esc(title)}">${items.length?items.map(card).join(''):`<div class="puEmpty">${esc(empty)}</div>`}</section>`;
  const essentialOrder=['tony-new-canvasser-process','tony-canvassing-101','grosso-tonality-audio','grosso-objections-audio','dave-science-canvassing-video','grosso-good-lead-audio'];
  const apprenticeKeep=new Set(['sales-apprentice-intro','sales-process-map','sales-shadowing','sales-apprentice-ready']);
  const rolePriority=new Map([['foundation',0],['field-ready',1],['canvasser',2],['senior',3],['sales-apprentice',4],['sales-rep',5]]);

  // Continue Training is the employee's applicable canvasser path by default.
  // Future-role content remains fully explorable through Career Path but does not silently enter the required queue.
  puNextLesson=function(){return nextCore()};
  puStageStatus=function(stage){
    const lessons=PU_LESSONS.filter(x=>x.stage===stage);if(!lessons.length)return'future';
    const done=lessons.filter(x=>ready(x)).length;
    if(done===lessons.length)return'done';
    const next=nextCore();
    if(trackOrder.includes(stage)&&(done>0||next?.stage===stage))return'current';
    return'future';
  };

  function home(){
    const lessons=coreLessons(),done=lessons.filter(ready).length,pct=lessons.length?Math.round(done/lessons.length*100):0,next=nextCore(),st=compactStage();
    M.innerHTML=`<section class="puHero"><small>PARADISE UNIVERSITY</small><h2>Train. Practice. Advance.</h2><p>Do today's job well. Future-role training stays available when you want to look ahead.</p></section>
      <button class="puContinue" id="puContinue"><small>${next?`NEXT UP · ${esc(next.minutes||0)} MIN`:'CANVASSER CORE COMPLETE'}</small><b>${esc(next?.title||'Core Training Complete')}</b><span>${esc(next?.summary||'Review Practice, your progress, or explore the next career stage with your manager.')}</span></button>
      <div class="puGrid">
        <button class="puTile" data-pu="practice"><span class="puIcon">◎</span><b>Practice</b><small>Opening, objections, appointments, and field rules.</small></button>
        <button class="puTile" data-pu="media"><span class="puIcon">▶</span><b>Videos & Audio</b><small>Recommended canvassing media first; complete library one level deeper.</small></button>
        <button class="puTile" data-pu="career"><span class="puIcon">↗</span><b>Career Path</b><small>Senior, Sales Apprentice, Sales Rep, and Manager.</small></button>
        <button class="puTile" data-pu="progress"><span class="puIcon">✓</span><b>My Progress</b><small>${done} of ${lessons.length} core training gates complete.</small></button>
      </div>
      <section class="card puCurrentPath"><div class="row"><div class="lab">CURRENT TRACK</div><div class="val strong">Canvasser Core</div></div><div class="row"><div class="lab">CURRENT STAGE</div><div class="val strong">${esc(st.current)}</div></div><div class="row"><div class="lab">WHAT'S NEXT</div><div class="val">${esc(st.next)}</div></div><div class="puProgressBar"><span style="width:${pct}%"></span></div><div class="puProgressText"><span>Core device training gates</span><span>${pct}%</span></div></section>
      <button id="puMoreButton" class="puMoreButton">MORE TRAINING TOOLS <span>›</span></button>
      <div class="puNotice"><b>Field rule:</b> Live municipality instructions always override generic training examples. Use Lookup for the current field answer.</div>`;
    document.getElementById('puContinue').onclick=()=>next?puSetPage('lesson:'+next.id):puSetPage('progress');
    M.querySelectorAll('[data-pu]').forEach(b=>b.onclick=()=>puSetPage(b.dataset.pu));
    document.getElementById('puMoreButton').onclick=()=>puSetPage('more');
  }

  function media(){
    const all=curated(),lastId=localStorage.puLastMedia||'',last=all.find(x=>x.id===lastId),lastState=last?mediaStatus(last):null;
    const recent=last&&!lastState?.complete?last:all.find(x=>{const s=mediaStatus(x);return s.saved&&!s.complete})||null;
    const essentials=uniqueById(essentialOrder.map(mediaById).filter(x=>x&&all.some(y=>y.id===x.id))).slice(0,6);
    const future=uniqueById(PU_LESSONS.filter(x=>['senior','sales-apprentice','sales-rep'].includes(x.stage)).flatMap(x=>(x.media||[]).map(mediaById))).filter(x=>x&&all.some(y=>y.id===x.id)&&!essentials.some(y=>y.id===x.id)).slice(0,6);
    M.innerHTML=`<button class="back puBack" id="puBack">← Training</button><h2>Videos & Audio</h2><p class="sub">The most applicable field training appears first. Each recording is shown once on this screen.</p><div class="puNotice"><b>REFERENCE MEDIA:</b> Trainer recordings support learning. Paradise-approved lessons, current manager direction, and live municipality instructions control field behavior.</div>${section('Continue Listening',recent?[recent]:[],'Nothing unfinished yet.')}${section('Canvasser Essentials',essentials,'No canvasser-essential media is currently published.')}${section('Future Role Training',future,'No future-role media is currently published.')}<button id="puCanvassingLibraryMedia" class="puMoreButton puMediaLibraryButton">COMPLETE CANVASSING LIBRARY <span>›</span></button><button id="puFullSourceLibrary" class="puMoreButton puMediaLibraryButton">FULL SOURCE LIBRARY <span>›</span></button>`;
    document.getElementById('puBack').onclick=()=>puSetPage('home');
    document.getElementById('puCanvassingLibraryMedia').onclick=()=>puSetPage('canvassing-library');
    document.getElementById('puFullSourceLibrary').onclick=()=>puSetPage('library');
    if(typeof puBindMediaButtons==='function')puBindMediaButtons(M);
  }

  function progress(){
    const lessons=coreLessons(),done=lessons.filter(ready).length,pct=lessons.length?Math.round(done/lessons.length*100):0,next=nextCore(),st=compactStage();
    const completed=lessons.filter(x=>puLessonDone(x.id));
    const inProgress=lessons.filter(x=>{try{const r=puRead()[x.id]||{};return !puLessonDone(x.id)&&!!r.startedAt}catch{return false}});
    M.innerHTML=`<button class="back puBack" id="puBack">← Training</button><h2>My Progress</h2><p class="sub">Your current canvasser track first. Detailed readiness evidence remains below.</p><section class="card"><div class="row"><div class="lab">MY TRACK</div><div class="val strong">Canvasser Core</div></div><div class="row"><div class="lab">CURRENT STAGE</div><div class="val strong">${esc(st.current)}</div></div><div class="row"><div class="lab">NEXT STEP</div><div class="val strong">${esc(next?.title||'Manager advancement / refresher training')}</div></div><div class="row"><div class="lab">CORE PROGRESS</div><div class="puProgressBar"><span style="width:${pct}%"></span></div><div class="puProgressText"><span>${done} of ${lessons.length} gates</span><span>${pct}%</span></div></div></section>${inProgress.length?`<div class="puSection">Continue where you stopped</div><div class="puList">${inProgress.map(x=>`<button data-progress-lesson="${esc(x.id)}"><b>◷ ${esc(x.title)}</b><small>${esc(stageName(x.stage))}</small></button>`).join('')}</div>`:''}<div class="puSection">Completed content</div><div class="puList">${completed.length?completed.map(x=>`<button data-progress-lesson="${esc(x.id)}"><b>${ready(x)?'✓':'◷'} ${esc(x.title)}</b><small>${esc(stageName(x.stage))}${typeof puQuickCheckRequired==='function'&&puQuickCheckRequired(x.id)&&!puQuickCheckPassed(x.id)?' · Quick Check pending':''}</small></button>`).join(''):'<div class="puEmpty">Complete your first lesson to start your progress history.</div>'}</div><details class="puSources"><summary>Advancement & certification details</summary><section class="card"><div class="row"><div class="lab">OFFICIAL CERTIFICATION</div><div class="val">Manager demonstration, field verification, and current Paradise requirements remain separate from device progress.</div></div><div class="row"><div class="lab">FUTURE TRAINING</div><div class="val">Senior, Sales Apprentice, Sales Rep, and Manager content is available under Career Path but is not part of the default canvasser queue.</div></div></section></details>`;
    document.getElementById('puBack').onclick=()=>puSetPage('home');
    M.querySelectorAll('[data-progress-lesson]').forEach(b=>b.onclick=()=>puSetPage('lesson:'+b.dataset.progressLesson));
  }

  const baseCareer=puCareer;
  function career(){
    baseCareer();
    if(view!=='training')return;
    const note=document.createElement('div');note.className='puNotice puTrackNotice';note.innerHTML='<b>Default track:</b> Continue Training stops after the Canvasser core. Senior, Sales Apprentice, Sales Rep, and Manager remain available to explore without becoming required merely because you opened them.';
    const firstSection=M.querySelector('.puSection');if(firstSection)firstSection.insertAdjacentElement('beforebegin',note);else M.appendChild(note);
  }

  const baseStage=puStage;
  function stage(stageId){
    baseStage(stageId);
    if(view!=='training')return;
    if(stageId==='sales-apprentice'){
      M.querySelectorAll('[data-lesson]').forEach(b=>{if(!apprenticeKeep.has(b.dataset.lesson))b.remove()});
      const marker=[...M.querySelectorAll('.puSection')].find(x=>(x.textContent||'').trim()==='Lessons');
      if(marker)marker.textContent='Bridge lessons';
      const sub=M.querySelector('p.sub');if(sub)sub.textContent='A short bridge from strong canvassing into formal Sales Rep training. Detailed in-home process instruction lives in Sales Rep Academy.';
    }
    if(stageId==='sales-rep'){
      const sections=[...M.querySelectorAll('.puSection')];
      const lessonSection=sections.find(x=>/Core sales lessons/i.test(x.textContent||''));
      if(lessonSection){
        const firstAfter=sections.find(x=>x!==lessonSection&&lessonSection.compareDocumentPosition(x)&Node.DOCUMENT_POSITION_FOLLOWING);
        if(firstAfter){
          const details=document.createElement('details');details.className='puSources puSalesControls';details.innerHTML='<summary>Sales Controls & References</summary><div class="puSalesControlsBody"></div>';
          const body=details.querySelector('.puSalesControlsBody');let n=firstAfter;
          while(n){const next=n.nextSibling;body.appendChild(n);n=next}
          M.appendChild(details);
        }
      }
    }
  }

  const baseLesson=puLesson;
  function lesson(id){
    baseLesson(id);
    if(view!=='training')return;
    const lessonObj=PU_LESSONS.find(x=>x.id===id)||(window.PU_CONTENT?.managerLessons||[]).find(x=>x.id===id);
    if(!lessonObj)return;
    const mediaStep=[...M.querySelectorAll('.puLessonStep')].find(x=>(x.querySelector('small')?.textContent||'').trim()==='WATCH / LISTEN');
    if(mediaStep&&!Array.isArray(lessonObj.media)||false){}
    if(mediaStep&&(!lessonObj.media||!lessonObj.media.length))mediaStep.remove();
    const quick=M.querySelector('.puQuickCheck'),actions=M.querySelector('.puLessonActions');
    if(quick&&actions){
      const passStep=actions.closest('.puLessonStep');
      if(passStep)passStep.insertBefore(quick,actions);
    }
    const doneBtn=document.getElementById('puDone'),nextBtn=document.getElementById('puNext');
    const checkRequired=typeof puQuickCheckRequired==='function'&&puQuickCheckRequired(id);
    const sync=()=>{
      if(!checkRequired)return;
      const passed=typeof puQuickCheckPassed==='function'&&puQuickCheckPassed(id);
      if(doneBtn){doneBtn.disabled=!passed&&!puLessonDone(id);doneBtn.textContent=puLessonDone(id)?'MARK INCOMPLETE':passed?'MARK COMPLETE':'PASS QUICK CHECK FIRST'}
      if(nextBtn)nextBtn.disabled=!passed;
    };
    sync();
    if(checkRequired){
      M.querySelectorAll('[data-pu-check]').forEach(b=>b.addEventListener('click',()=>setTimeout(sync,0)));
    }
    if(nextBtn&&trackOrder.includes(lessonObj.stage)){
      const core=coreLessons(),i=core.findIndex(x=>x.id===id),n=i>=0?core[i+1]:null;
      if(!n&&lessonObj.stage===CORE_TRACK_END){nextBtn.textContent='VIEW PROGRESS';nextBtn.onclick=()=>puSetPage('progress')}
    }
  }

  // Fix one bad source-lineage pointer caught by red-team review.
  if(Array.isArray(window.PU_PRACTICE_SCENARIOS)){
    window.PU_PRACTICE_SCENARIOS=Object.freeze(window.PU_PRACTICE_SCENARIOS.map(x=>{
      if(x.id!=='appointment-two-choices')return x;
      const lineage=(x.sourceLineage||[]).map(v=>v==='lesson:canvass-appointment'?'lesson:canvass-close':v);
      return Object.freeze({...x,sourceLineage:Object.freeze(lineage)});
    }));
  }

  const baseRender=renderTraining;
  puHome=home;puMedia=media;puProgress=progress;puCareer=career;puStage=stage;puLesson=lesson;
  renderTraining=function(){
    if(view!=='training')return;
    if(puPage==='home')return puHome();
    if(puPage==='media')return puMedia();
    if(puPage==='progress')return puProgress();
    if(puPage==='career')return puCareer();
    if(puPage.startsWith('stage:'))return puStage(puPage.slice(6));
    if(puPage.startsWith('lesson:'))return puLesson(puPage.slice(7));
    return baseRender();
  };
  window.PU_TRAINING_EXPERIENCE_VERSION=VERSION;
  window.PU_DEFAULT_TRACK='CANVASSER_CORE';
  window.PU_DEFAULT_TRACK_STAGES=Object.freeze(trackOrder.slice());
  window.PU_SALES_APPRENTICE_BRIDGE_IDS=Object.freeze([...apprenticeKeep]);
})();