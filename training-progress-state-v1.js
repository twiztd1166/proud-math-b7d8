(()=>{
  const VERSION='2026.08.16-pu-progress-state-v1';
  const known=id=>PU_LESSONS.some(x=>x.id===id);
  function state(id){
    const x=puRead()[id];
    if(x?.complete)return'complete';
    if(x?.startedAt)return'in-progress';
    return'not-started';
  }
  function markStarted(id){
    if(!known(id))return;
    const p=puRead(),now=new Date().toISOString(),x={...(p[id]||{})};
    if(!x.startedAt){x.startedAt=x.updatedAt||now;x.updatedAt=x.updatedAt||now;x.trainingVersion=x.trainingVersion||PU_VERSION;p[id]=x;puWrite(p)}
  }
  const baseMark=puMark;
  puMark=function(id,complete=true){
    markStarted(id);baseMark(id,complete);
    if(!known(id))return;
    const p=puRead(),x={...(p[id]||{})};
    x.startedAt=x.startedAt||x.updatedAt||new Date().toISOString();
    if(complete)x.completedAt=x.completedAt||x.updatedAt||new Date().toISOString();else delete x.completedAt;
    p[id]=x;puWrite(p);
  };
  const baseLesson=puLesson;
  puLesson=function(id){markStarted(id);baseLesson(id)};
  const baseProgress=puProgress;
  puProgress=function(){
    baseProgress();
    const inProgress=PU_LESSONS.filter(x=>state(x.id)==='in-progress');
    const notStarted=PU_LESSONS.filter(x=>state(x.id)==='not-started');
    const currentIndex=PU_PATH.findIndex(x=>puStageStatus(x.id)==='current');
    const nextStage=currentIndex>=0&&currentIndex<PU_PATH.length-1?PU_PATH[currentIndex+1]?.name:'Manager / certification review';
    const summary=document.createElement('section');summary.className='card';summary.id='puProgressStateSummary';
    summary.innerHTML=`<div class="row"><div class="lab">LESSON STATE</div><div class="val strong">${inProgress.length} in progress · ${notStarted.length} not started</div></div><div class="row"><div class="lab">OFFICIAL CERTIFICATION</div><div class="val strong">Not stored on this device</div><small>Manager demonstration, field verification, and current Paradise requirements remain separate.</small></div><div class="row"><div class="lab">NEXT CAREER STAGE</div><div class="val strong">${esc(nextStage)}</div></div>`;
    const firstCard=M.querySelector('section.card');if(firstCard)firstCard.insertAdjacentElement('afterend',summary);else M.appendChild(summary);
    if(inProgress.length){
      const heading=document.createElement('div');heading.className='puSection';heading.textContent='In progress';
      const list=document.createElement('div');list.className='puList';list.id='puInProgressList';list.innerHTML=inProgress.map(x=>`<button data-progress-lesson="${esc(x.id)}"><b>◷ ${esc(x.title)}</b><small>${esc(PU_PATH.find(s=>s.id===x.stage)?.name||x.stage)} · continue where you stopped</small></button>`).join('');
      const advancement=[...M.querySelectorAll('.puSection')].find(x=>/Advancement readiness/i.test(x.textContent||''));
      if(advancement){M.insertBefore(heading,advancement);M.insertBefore(list,advancement)}else{M.appendChild(heading);M.appendChild(list)}
      list.querySelectorAll('[data-progress-lesson]').forEach(b=>b.onclick=()=>puSetPage('lesson:'+b.dataset.progressLesson));
    }
  };
  window.PU_PROGRESS_STATE_VERSION=VERSION;
  window.puLessonProgressState=state;
})();
