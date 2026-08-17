(()=>{
  if(typeof puHome!=='function'||typeof puProgress!=='function'||typeof puSetPage!=='function'||typeof renderTraining!=='function')return;
  const VERSION='2026.08.17-pu-training-ux-polish-v1';
  const NAV_KEY='puTrainingNavV1';
  const trackOrder=Array.isArray(window.PU_DEFAULT_TRACK_STAGES)?[...window.PU_DEFAULT_TRACK_STAGES]:['foundation','field-ready','canvasser'];
  const coreLessons=()=>PU_LESSONS.filter(x=>trackOrder.includes(x.stage));
  const ready=x=>typeof window.puLessonTrainingReady==='function'?window.puLessonTrainingReady(x.id):puLessonDone(x.id);
  const stageName=id=>PU_PATH.find(x=>x.id===id)?.name||id;
  const nextCore=()=>typeof puNextLesson==='function'?puNextLesson():coreLessons().find(x=>!ready(x))||null;
  const readNav=()=>{try{const x=JSON.parse(sessionStorage[NAV_KEY]||'[]');return Array.isArray(x)?x:[]}catch{return[]}};
  const writeNav=x=>{try{sessionStorage[NAV_KEY]=JSON.stringify(x.slice(-40))}catch{}};
  const pushContext=(page,scrollY)=>{if(!page)return;const stack=readNav(),last=stack[stack.length-1];if(last&&last.page===page){last.scrollY=scrollY}else stack.push({page,scrollY});writeNav(stack)};
  const milestone=next=>{
    const core=coreLessons();
    if(!next)return{eyebrow:'CANVASSER CORE COMPLETE',detail:'Core device training complete · manager advancement / refresher training is next.'};
    const index=Math.max(0,core.findIndex(x=>x.id===next.id)),remaining=core.filter(x=>x.stage===next.stage&&!ready(x)).length,label=stageName(next.stage),minutes=Number(next.minutes||0);
    return{eyebrow:`NEXT UP · ${minutes} MIN · ${index+1} OF ${core.length} · ${String(label).toUpperCase()}`,detail:`${remaining} gate${remaining===1?'':'s'} until ${label} device training complete.`};
  };

  const baseHome=puHome;
  puHome=function(){
    baseHome();if(view!=='training')return;
    const next=nextCore(),m=milestone(next),core=coreLessons(),done=core.filter(ready).length;
    const button=document.getElementById('puContinue');
    if(button){const small=button.querySelector('small'),span=button.querySelector('span');if(small)small.textContent=m.eyebrow;if(span)span.textContent=next?`${next.summary||''} · ${m.detail}`:m.detail}
    const progressTile=M.querySelector('[data-pu="progress"] small');if(progressTile)progressTile.textContent=`${done} of ${core.length} core gates · ${Math.max(0,core.length-done)} remaining.`;
    const nextRow=[...M.querySelectorAll('.puCurrentPath .row')].find(row=>(row.querySelector('.lab')?.textContent||'').trim()==="WHAT'S NEXT");if(nextRow){const val=nextRow.querySelector('.val');if(val)val.textContent=m.detail}
  };

  const baseProgress=puProgress;
  puProgress=function(){
    baseProgress();if(view!=='training')return;
    const m=milestone(nextCore()),card=M.querySelector('h2+*')?.matches?.('section.card')?M.querySelector('h2+*'):M.querySelector('section.card');if(!card)return;
    if(card.querySelector('.puNextMilestone'))return;
    const nextRow=[...card.querySelectorAll(':scope > .row')].find(row=>(row.querySelector('.lab')?.textContent||'').trim()==='NEXT STEP');
    const row=document.createElement('div');row.className='row puNextMilestone';row.innerHTML=`<div class="lab">NEXT MILESTONE</div><div class="val">${esc(m.detail)}</div>`;
    if(nextRow)nextRow.insertAdjacentElement('afterend',row);else card.appendChild(row);
  };

  const baseSetPage=puSetPage;
  let restoring=false;
  puSetPage=function(page){
    const current=puPage,y=Math.max(0,window.scrollY||0),same=current===page;
    if(view==='training'&&!restoring&&current&&!same)pushContext(current,y);
    baseSetPage(page);
    if(same)requestAnimationFrame(()=>window.scrollTo(0,y));
  };

  function fallbackPage(page){
    if(String(page||'').startsWith('lesson:')){
      const id=String(page).slice(7),lesson=PU_LESSONS.find(x=>x.id===id)||(window.PU_CONTENT?.managerLessons||[]).find(x=>x.id===id);
      return lesson?.stage==='manager'?'stage:manager':lesson?.stage?`stage:${lesson.stage}`:'home';
    }
    if(String(page||'').startsWith('stage:'))return'career';
    if(page==='search'||page==='library'||page==='refs')return'more';
    if(page==='canvassing-library')return'media';
    return'home';
  }
  function restoreContext(){
    const stack=readNav();let ctx=null;
    while(stack.length){const x=stack.pop();if(x&&x.page&&x.page!==puPage){ctx=x;break}}
    writeNav(stack);const target=ctx?.page||fallbackPage(puPage),y=Math.max(0,Number(ctx?.scrollY||0));
    restoring=true;baseSetPage(target);restoring=false;requestAnimationFrame(()=>window.scrollTo(0,y));
  }
  function wireBack(){const back=document.getElementById('puBack');if(back)back.onclick=restoreContext}
  const baseRender=renderTraining;
  renderTraining=function(){const out=baseRender();if(view==='training')wireBack();return out};

  window.PU_TRAINING_UX_POLISH_VERSION=VERSION;
  window.puTrainingMilestone=()=>milestone(nextCore());
  window.puTrainingNavStack=()=>readNav().map(x=>({...x}));
})();
