(()=>{
  const stageRules={
    foundation:{label:'Foundation',next:'Complete the basics before Field Ready.'},
    'field-ready':{label:'Field Ready',next:'Training complete → manager script/compliance demonstration required.'},
    canvasser:{label:'Certified Canvasser',next:'Training complete → manager role-play and field verification required.'},
    senior:{label:'Senior Canvasser',next:'Training complete → manager advancement review required.'},
    'sales-apprentice':{label:'Sales Apprentice',next:'Training complete → manager sales-readiness review and shadowing verification required.'},
    'sales-rep':{label:'Sales Rep Academy — Part 1',next:'Part 1 complete → current Paradise policy modules are still required before full Sales Rep certification.'}
  };
  function stageInfo(stage){
    const lessons=PU_LESSONS.filter(x=>x.stage===stage),done=lessons.filter(x=>puLessonDone(x.id)).length,total=lessons.length;
    return{stage,done,total,complete:total>0&&done===total,pct:total?Math.round(done/total*100):0,...(stageRules[stage]||{label:stage,next:''})};
  }
  function managerInfo(){
    const lessons=window.PU_CONTENT?.managerLessons||[],done=lessons.filter(x=>puLessonDone(x.id)).length,total=lessons.length;
    return{done,total,complete:total>0&&done===total,pct:total?Math.round(done/total*100):0};
  }
  function readyCard(x){
    const state=x.complete?'TRAINING COMPLETE':'IN TRAINING';
    return`<div class="row puReadyRow"><div><div class="lab">${esc(x.label)}</div><div class="val strong">${esc(state)}</div><div class="puMiniProgress"><span style="width:${x.pct}%"></span></div><small>${x.done}/${x.total} lessons · ${esc(x.next)}</small></div></div>`;
  }
  puProgress=function(){
    const stages=PU_PATH.map(x=>stageInfo(x.id)),manager=managerInfo(),done=puCompleted(),pct=PU_LESSONS.length?Math.round(done/PU_LESSONS.length*100):0,next=puNextLesson();
    M.innerHTML=`<button class="back puBack" id="puBack">← Training</button><h2>My Progress</h2><p class="sub">See what you have completed and what must happen next.</p><div class="puNotice"><b>Device progress only:</b> Completion on this phone is not an official Paradise certification. Manager demonstration, field verification, and current company requirements still control advancement.</div><section class="card"><div class="row"><div class="lab">CURRENT TRAINING</div><div class="val strong">${esc(PU_PATH.find(x=>puStageStatus(x.id)==='current')?.name||PU_PATH[PU_PATH.length-1]?.name||'Foundation')}</div></div><div class="row"><div class="lab">CORE PATH</div><div class="puProgressBar"><span style="width:${pct}%"></span></div><div class="puProgressText"><span>${done} complete</span><span>${pct}%</span></div></div><div class="row"><div class="lab">NEXT RECOMMENDED</div><div class="val strong">${esc(next?.title||'Core path complete')}</div></div></section><div class="puSection">Advancement readiness</div><section class="card">${stages.map(readyCard).join('')}</section><div class="puSection">Leadership path</div><section class="card">${readyCard({label:'Canvass Manager Academy',done:manager.done,total:manager.total,pct:manager.pct,complete:manager.complete,next:manager.complete?'Training complete → manager certification demonstration and field verification required.':'Complete Manager Academy lessons from Career Path.'})}</section><div class="puSection">Completed lessons</div><div class="puList">${PU_LESSONS.filter(x=>puLessonDone(x.id)).map(x=>`<button data-lesson="${esc(x.id)}"><b>✓ ${esc(x.title)}</b><small>${esc(PU_PATH.find(s=>s.id===x.stage)?.name||x.stage)}</small></button>`).join('')||'<div class="puEmpty">Complete your first lesson to start your progress history.</div>'}</div>`;
    document.getElementById('puBack').onclick=()=>puSetPage('home');
    document.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>puSetPage('lesson:'+b.dataset.lesson));
  };
  window.PU_READINESS_VERSION='2026.08.16-pu-readiness-v1';
})();
