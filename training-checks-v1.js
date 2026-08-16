(()=>{
  const STORE='puQuickChecksV1';
  const checks={
    'field-lookup':{q:'Training says a technique is allowed, but the live municipality lookup says NO-GO. What controls?',choices:['The training lesson','The live municipality lookup','Whichever the manager prefers'],correct:1,why:'The live municipality instructions control the actual route. Do not canvass a NO-GO area.'},
    'field-refusal':{q:'A resident says, “No. Leave my property.” What is the correct next step?',choices:['Ask one more qualifying question','Leave immediately','Give the courtesy notice first'],correct:1,why:'A clear refusal is a stop, not an objection to rebut.'},
    'canvass-five-commitments':{q:'Which is the Paradise training version of the Five Appointment Commitments?',choices:['Pitch · Demo · Price · Finance · Close','Project · Value · Time · Household · Lock It','Need · Product · Discount · Contract · Deposit'],correct:1,why:'PROJECT → VALUE → TIME → HOUSEHOLD → LOCK IT.'},
    'canvass-cert-ready':{q:'You completed every lesson on your phone. Are you automatically a Certified Canvasser?',choices:['Yes','No — manager demonstration and field verification still matter'],correct:1,why:'Device completion is training progress. Official certification requires the current Paradise verification process.'},
    'senior-sales-readiness':{q:'Who is the strongest Sales Apprentice candidate?',choices:['The rep with the most raw sets regardless of quality','The rep showing compliance, listening, quality, coachability, professionalism, and consistent production'],correct:1,why:'Sales readiness is broader than raw volume.'},
    'sales-apprentice-intro':{q:'You learned price and financing concepts in Sales Apprentice. Can you now quote or finance a project while canvassing?',choices:['Yes','No'],correct:1,why:'Sales training does not expand doorstep authority.'},
    'salesrep-company':{q:'What may be used as a factual claim in the Company Story?',choices:['Any claim found in old trainer material','Only current Paradise-approved facts and substantiated current claims','Anything another rep normally says'],correct:1,why:'Historical/source examples do not become current Paradise claims automatically.'},
    'manager-compliance':{q:'The live lookup says NO-GO, but the manager believes the route should be fine. What should the team do?',choices:['Canvass with manager approval','Do not canvass; verify through the current compliance process','Canvass without literature'],correct:1,why:'Managers do not override NO-GO or create field exceptions.'},
    'manager-funnel':{q:'A rep sets many appointments, but very few run. What should the manager audit first?',choices:['Tell the rep to knock more doors','Appointment quality and confirmation/handoff','Immediately blame the sales closer'],correct:1,why:'Diagnose the first weak conversion instead of treating every problem as a door-volume problem.'}
  };
  const read=()=>{try{return JSON.parse(localStorage[STORE]||'{}')}catch{return{}}};
  const write=v=>localStorage[STORE]=JSON.stringify(v);
  const required=id=>!!checks[id];
  const passed=id=>!!read()[id]?.passed;
  const trainingReady=id=>puLessonDone(id)&&(!required(id)||passed(id));
  function save(id,correct){let s=read(),x=s[id]||{attempts:0,correct:0,passed:false};x.attempts++;if(correct){x.correct++;x.passed=true}x.lastCorrect=correct;x.updatedAt=new Date().toISOString();s[id]=x;write(s)}
  function inject(id){
    const c=checks[id];if(!c)return;
    const notices=M.querySelectorAll('.puNotice');const anchor=notices.length?notices[notices.length-1]:null;
    const card=document.createElement('section');card.className='card puQuickCheck';card.innerHTML=`<div class="puLessonStep"><small>QUICK CHECK</small><h3>${esc(c.q)}</h3><div class="puCheckChoices">${c.choices.map((x,i)=>`<button data-pu-check="${i}">${esc(x)}</button>`).join('')}</div><div class="puCheckFeedback" aria-live="polite">${passed(id)?`<b>✓ Knowledge check passed on this device</b><p>Content progress and manager/field verification remain separate.</p>`:''}</div></div>`;
    if(anchor)M.insertBefore(card,anchor);else M.appendChild(card);
    const feedback=card.querySelector('.puCheckFeedback');let answered=false;
    card.querySelectorAll('[data-pu-check]').forEach(b=>b.onclick=()=>{
      if(answered)return;answered=true;const choice=Number(b.dataset.puCheck),ok=choice===c.correct;save(id,ok);
      card.querySelectorAll('[data-pu-check]').forEach((x,i)=>{x.disabled=true;if(i===c.correct)x.classList.add('correct');else if(x===b&&!ok)x.classList.add('wrong')});
      feedback.innerHTML=`<b>${ok?'✓ Correct':'Review this one'}</b><p>${esc(c.why)}${ok?' This satisfies the device knowledge check only; it does not create official certification.':''}</p>`;
    });
  }
  const baseNext=puNextLesson;
  puNextLesson=function(){return PU_LESSONS.find(x=>!trainingReady(x.id))||baseNext()};
  puStageStatus=function(stage){
    const lessons=PU_LESSONS.filter(x=>x.stage===stage);if(!lessons.length)return'future';
    const ready=lessons.filter(x=>trainingReady(x.id)).length,content=lessons.filter(x=>puLessonDone(x.id)).length;
    if(ready===lessons.length)return'done';
    if(content>0||puNextLesson()?.stage===stage)return'current';
    return'future';
  };
  const baseLesson=puLesson;
  puLesson=function(id){
    baseLesson(id);inject(id);
    if(!PU_LESSONS.some(x=>x.id===id)&&!(window.PU_CONTENT?.managerLessons||[]).some(x=>x.id===id))return;
    const done=puLessonDone(id),needs=required(id),ready=trainingReady(id),actions=document.querySelector('.puLessonActions');
    if(actions){const note=document.createElement('small');note.className='puCompletionNote';note.textContent=done?(needs&&!ready?'Content marked complete; required Quick Check still pending.':'Content marked complete on this device. Official certification remains separate.'):'Mark Complete records content progress only; it is not official certification.';actions.appendChild(note)}
  };
  window.PU_CHECKS_VERSION='2026.08.16-pu-checks-v2';
  window.puQuickCheckStats=read;
  window.puQuickCheckRequired=required;
  window.puQuickCheckPassed=passed;
  window.puLessonTrainingReady=trainingReady;
})();
