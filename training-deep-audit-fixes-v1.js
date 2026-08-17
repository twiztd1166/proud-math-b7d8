(()=>{
  const VERSION='2026.08.17-pu-deep-audit-fixes-v1';
  const currentRecord=id=>{try{return puRead()[id]||{}}catch{return{}}};
  const currentDone=id=>{const x=currentRecord(id);return !!x.complete&&x.trainingVersion===PU_VERSION};
  const trainingReady=x=>typeof window.puLessonTrainingReady==='function'?window.puLessonTrainingReady(x.id):currentDone(x.id);

  // Current curriculum completion is version-aware. Older completion is retained as history,
  // but it cannot satisfy the current device-training gate.
  puLessonDone=currentDone;
  puCompleted=()=>PU_LESSONS.filter(x=>currentDone(x.id)).length;
  const baseMark=puMark;
  puMark=function(id,complete=true){
    const before=currentRecord(id);
    if(complete&&before.complete&&before.trainingVersion&&before.trainingVersion!==PU_VERSION){
      const all=puRead(),history=Array.isArray(before.completionHistory)?before.completionHistory.slice():[];
      if(!history.some(x=>x.trainingVersion===before.trainingVersion&&x.completedAt===(before.completedAt||before.updatedAt||''))){
        history.push({trainingVersion:before.trainingVersion,completedAt:before.completedAt||before.updatedAt||'',migratedAt:new Date().toISOString()});
      }
      all[id]={...before,completionHistory:history.slice(-10)};puWrite(all);
    }
    baseMark(id,complete);
  };

  // Career-stage wording must not imply that device progress itself certifies the employee.
  const canvasserStage=PU_PATH.find(x=>x.id==='canvasser');
  if(canvasserStage)canvasserStage.name='Canvasser';

  // Keep currentness language consistent everywhere without changing the exact candidate opener.
  const openingDrill=PU_DRILLS.find(x=>x.id==='opening');
  if(openingDrill)openingDrill.prompt='Deliver the current manager-approved opening at a calm conversational pace. Stop after the first project question and wait for the homeowner.';
  const managerScript=(window.PU_CONTENT?.managerLessons||[]).find(x=>x.id==='manager-script-coaching');
  if(managerScript){
    managerScript.summary=String(managerScript.summary||'').replace(/keep the approved words intact/ig,'keep the current manager-approved words intact');
    managerScript.learn=String(managerScript.learn||'').replace(/approved Paradise script/ig,'current manager-approved Paradise opening');
  }
  if(Array.isArray(window.PU_PRACTICE_SCENARIOS)){
    const replacements=[
      [/Paradise base opening/ig,'current manager-approved Paradise opening'],
      [/base Paradise opening/ig,'current manager-approved Paradise opening'],
      [/approved neutral project question/ig,'current manager-approved project question'],
      [/approved words/ig,'current manager-approved words']
    ];
    const rewrite=v=>replacements.reduce((s,[rx,to])=>String(s||'').replace(rx,to),v);
    window.PU_PRACTICE_SCENARIOS=Object.freeze(window.PU_PRACTICE_SCENARIOS.map(x=>Object.freeze({...x,prompt:rewrite(x.prompt),answer:rewrite(x.answer),coachingNote:rewrite(x.coachingNote)})));
  }

  // When all device-training gates are current, there is no phantom "next" lesson.
  puNextLesson=function(){return PU_LESSONS.find(x=>!trainingReady(x))||null};

  const baseHome=puHome;
  puHome=function(){
    baseHome();
    const done=PU_LESSONS.filter(trainingReady).length,pct=PU_LESSONS.length?Math.round(done/PU_LESSONS.length*100):0,next=puNextLesson();
    const bar=M.querySelector('.puProgressBar span');if(bar)bar.style.width=`${pct}%`;
    const text=M.querySelector('.puProgressText');if(text)text.innerHTML=`<span>Device training gates</span><span>${pct}%</span>`;
    const cont=document.getElementById('puContinue');
    if(cont&&!next){
      const small=cont.querySelector('small'),b=cont.querySelector('b'),span=cont.querySelector('span');
      if(small)small.textContent='CORE DEVICE TRAINING';if(b)b.textContent='Training Complete';if(span)span.textContent='Review progress, refreshers, or your next manager-guided advancement step.';
      cont.onclick=()=>puSetPage('progress');
    }
  };

  const baseLesson=puLesson;
  puLesson=function(id){
    baseLesson(id);
    if(view!=='training')return;
    const i=PU_LESSONS.findIndex(x=>x.id===id),next=document.getElementById('puNext');
    if(next&&i===PU_LESSONS.length-1){next.textContent='VIEW PROGRESS';next.onclick=()=>puSetPage('progress')}
  };

  const baseProgress=puProgress;
  puProgress=function(){
    baseProgress();
    const inProgress=PU_LESSONS.filter(x=>{const r=currentRecord(x.id);return !currentDone(x.id)&&!!r.startedAt});
    const notStarted=PU_LESSONS.filter(x=>!currentRecord(x.id).startedAt);
    const summary=document.getElementById('puProgressStateSummary');
    if(summary){const value=summary.querySelector('.row .val');if(value)value.textContent=`${inProgress.length} in progress · ${notStarted.length} not started`}
  };
  window.puLessonProgressState=id=>{const r=currentRecord(id);if(currentDone(id))return'complete';if(r.startedAt)return'in-progress';return'not-started'};

  function normalizeAuthorityText(root){
    if(!root||typeof document==='undefined')return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;
    while((n=walker.nextNode())){
      n.nodeValue=n.nodeValue
        .replace(/the existing Paradise canvass script/gi,'the current manager-approved canvass opening')
        .replace(/approved Paradise script/gi,'current manager-approved Paradise opening')
        .replace(/keep the approved words intact/gi,'keep the current manager-approved words intact');
    }
    root.querySelectorAll('.puReadyRow .lab').forEach(x=>{if((x.textContent||'').trim()==='Certified Canvasser')x.textContent='Canvasser'});
  }
  const baseRender=renderTraining;
  renderTraining=function(){const out=baseRender();if(view==='training')normalizeAuthorityText(M);return out};

  window.PU_COMPLETION_MODEL_VERSION='2026.08.17-current-curriculum-only-v1';
  window.PU_DEEP_AUDIT_FIXES_VERSION=VERSION;
})();
