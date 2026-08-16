(()=>{
  const stageRules={
    foundation:{label:'Foundation',next:'Complete the basics before Field Ready.'},
    'field-ready':{label:'Field Ready',next:'Device training gates complete → manager script/compliance demonstration required.'},
    canvasser:{label:'Certified Canvasser',next:'Device training gates complete → manager role-play and field verification required.'},
    senior:{label:'Senior Canvasser',next:'Device training gates complete → manager advancement review required.'},
    'sales-apprentice':{label:'Sales Apprentice',next:'Device training gates complete → manager sales-readiness review and shadowing verification required.'},
    'sales-rep':{label:'Sales Rep Academy — Part 1',next:'Part 1 device training complete → current Paradise policy modules are still required before full Sales Rep certification.'}
  };
  const ready=id=>typeof puLessonTrainingReady==='function'?puLessonTrainingReady(id):puLessonDone(id);
  const checkRequired=id=>typeof puQuickCheckRequired==='function'&&puQuickCheckRequired(id);
  const checkPassed=id=>typeof puQuickCheckPassed==='function'&&puQuickCheckPassed(id);
  function stageInfo(stage){
    const lessons=PU_LESSONS.filter(x=>x.stage===stage),contentDone=lessons.filter(x=>puLessonDone(x.id)).length,done=lessons.filter(x=>ready(x.id)).length,total=lessons.length;
    return{stage,done,contentDone,total,complete:total>0&&done===total,pct:total?Math.round(done/total*100):0,...(stageRules[stage]||{label:stage,next:''})};
  }
  function managerInfo(){
    const lessons=window.PU_CONTENT?.managerLessons||[],contentDone=lessons.filter(x=>puLessonDone(x.id)).length,done=lessons.filter(x=>ready(x.id)).length,total=lessons.length;
    return{done,contentDone,total,complete:total>0&&done===total,pct:total?Math.round(done/total*100):0};
  }
  function readyCard(x){
    const state=x.complete?'DEVICE TRAINING COMPLETE':'IN TRAINING';
    return`<div class="row puReadyRow"><div><div class="lab">${esc(x.label)}</div><div class="val strong">${esc(state)}</div><div class="puMiniProgress"><span style="width:${x.pct}%"></span></div><small>${x.done}/${x.total} device training gates · ${x.contentDone}/${x.total} content marked complete · ${esc(x.next)}</small></div></div>`;
  }
  puProgress=function(){
    const stages=PU_PATH.map(x=>stageInfo(x.id)),manager=managerInfo(),contentDone=puCompleted(),readyDone=PU_LESSONS.filter(x=>ready(x.id)).length,pct=PU_LESSONS.length?Math.round(readyDone/PU_LESSONS.length*100):0,next=PU_LESSONS.find(x=>!ready(x.id))||puNextLesson();
    const required=PU_LESSONS.filter(x=>checkRequired(x.id)).length,passed=PU_LESSONS.filter(x=>checkRequired(x.id)&&checkPassed(x.id)).length;
    M.innerHTML=`<button class="back puBack" id="puBack">← Training</button><h2>My Progress</h2><p class="sub">See what you reviewed, what knowledge evidence is complete, and what must happen next.</p><div class="puNotice"><b>Device progress only:</b> Content completion and Quick Checks on this phone are not an official Paradise certification. Manager demonstration, field verification, and current company requirements still control advancement.</div><section class="card"><div class="row"><div class="lab">CURRENT TRAINING</div><div class="val strong">${esc(PU_PATH.find(x=>puStageStatus(x.id)==='current')?.name||PU_PATH[PU_PATH.length-1]?.name||'Foundation')}</div></div><div class="row"><div class="lab">DEVICE TRAINING GATES</div><div class="puProgressBar"><span style="width:${pct}%"></span></div><div class="puProgressText"><span>${readyDone} of ${PU_LESSONS.length} ready</span><span>${pct}%</span></div></div><div class="row"><div class="lab">CONTENT MARKED COMPLETE</div><div class="val strong">${contentDone} of ${PU_LESSONS.length}</div></div><div class="row"><div class="lab">REQUIRED KNOWLEDGE CHECKS</div><div class="val strong">${passed} of ${required} passed</div></div><div class="row"><div class="lab">NEXT RECOMMENDED</div><div class="val strong">${esc(next?.title||'Core path device training complete')}</div></div></section><div class="puSection">Advancement readiness</div><section class="card">${stages.map(readyCard).join('')}</section><div class="puSection">Leadership path</div><section class="card">${readyCard({label:'Canvass Manager Academy',done:manager.done,contentDone:manager.contentDone,total:manager.total,pct:manager.pct,complete:manager.complete,next:manager.complete?'Device training gates complete → manager certification demonstration and field verification required.':'Complete Manager Academy content and required Quick Checks from Career Path.'})}</section><div class="puSection">Content marked complete</div><div class="puList">${PU_LESSONS.filter(x=>puLessonDone(x.id)).map(x=>`<button data-lesson="${esc(x.id)}"><b>${ready(x.id)?'✓':'◷'} ${esc(x.title)}</b><small>${esc(PU_PATH.find(s=>s.id===x.stage)?.name||x.stage)}${checkRequired(x.id)&&!checkPassed(x.id)?' · knowledge check pending':''}</small></button>`).join('')||'<div class="puEmpty">Complete your first lesson to start your device progress history.</div>'}</div>`;
    document.getElementById('puBack').onclick=()=>puSetPage('home');
    document.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>puSetPage('lesson:'+b.dataset.lesson));
  };
  window.PU_READINESS_VERSION='2026.08.16-pu-readiness-v2';
})();
