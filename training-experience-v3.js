(()=>{
  if(typeof puProgress!=='function'||typeof puLesson!=='function'||typeof renderTraining!=='function')return;
  const VERSION='2026.08.17-pu-training-experience-v3';
  const TRANSFER_VERSION='2026.08.17-pu-progress-transfer-v1';
  const MEDIA_NOTES_STORE='puMediaNotesV1';
  const coreStages=Array.isArray(window.PU_DEFAULT_TRACK_STAGES)?[...window.PU_DEFAULT_TRACK_STAGES]:['foundation','field-ready','canvasser'];
  const coreLessons=()=>PU_LESSONS.filter(x=>coreStages.includes(x.stage));
  const ready=x=>typeof window.puLessonTrainingReady==='function'?window.puLessonTrainingReady(x.id):puLessonDone(x.id);
  const stageName=id=>PU_PATH.find(x=>x.id===id)?.name||id;
  const currentCoreLesson=()=>typeof puNextLesson==='function'?puNextLesson():coreLessons().find(x=>!ready(x))||null;
  const stageLessons=id=>PU_LESSONS.filter(x=>x.stage===id&&coreStages.includes(id));
  const remainingInStage=id=>stageLessons(id).filter(x=>!ready(x)).length;
  const escHtml=s=>typeof esc==='function'?esc(s):String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function lessonObj(id){return PU_LESSONS.find(x=>x.id===id)||(window.PU_CONTENT?.managerLessons||[]).find(x=>x.id===id)}
  function lessonSteps(x,id){
    const steps=['Learn'];if(Array.isArray(x.media)&&x.media.length)steps.push('Watch / Listen');steps.push('Practice');if(typeof puQuickCheckRequired==='function'&&puQuickCheckRequired(id))steps.push('Quick Check');steps.push('Complete');return steps;
  }
  const baseLesson=puLesson;
  puLesson=function(id){
    baseLesson(id);if(view!=='training')return;const x=lessonObj(id);if(!x)return;
    const head=M.querySelector('.head');if(head&&!M.querySelector('.puLessonOverview')){
      const steps=lessonSteps(x,id),d=document.createElement('div');d.className='puLessonOverview';
      d.innerHTML=`<div><b>${escHtml(x.minutes||0)} min</b><span>${escHtml(stageName(x.stage)||'Training')}</span></div><div class="puLessonOverviewSteps">${steps.map((s,i)=>`<span>${i+1}. ${escHtml(s)}</span>`).join('')}</div>`;head.insertAdjacentElement('afterend',d)
    }
  };

  function advancementCopy(){
    const next=currentCoreLesson();if(!next)return['Core device training complete','Manager demonstration / role-play','Field verification','Current Paradise advancement decision'];
    const r=remainingInStage(next.stage),name=stageName(next.stage);
    if(next.stage==='foundation')return[`${r} ${name} gate${r===1?'':'s'} remaining`,'Complete Foundation','Begin Field Ready'];
    if(next.stage==='field-ready')return[`${r} ${name} gate${r===1?'':'s'} remaining`,'Manager script/compliance demonstration','Field verification before independent release'];
    return[`${r} ${name} gate${r===1?'':'s'} remaining`,'Manager role-play / knowledge review','Field verification','Manager advancement decision'];
  }

  function transferKeys(){return['puProgress','puQuickChecksV1','puMediaProgressV2','puMediaResume','puPracticeStatsV1','puLastMedia',MEDIA_NOTES_STORE]}
  function transferPayload(){const data={};for(const k of transferKeys())if(localStorage[k]!=null)data[k]=localStorage[k];return{type:'PARADISE_UNIVERSITY_PROGRESS_TRANSFER',version:TRANSFER_VERSION,trainingVersion:window.PARADISE_UNIVERSITY_VERSION||PU_VERSION,exportedAt:new Date().toISOString(),data}}
  function downloadTransfer(){
    const blob=new Blob([JSON.stringify(transferPayload(),null,2)],{type:'application/json'}),a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=`paradise-university-progress-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);showToast('Progress backup created','Use this file to manually move device-training history to another device.')
  }
  function applyTransfer(payload){
    if(!payload||payload.type!=='PARADISE_UNIVERSITY_PROGRESS_TRANSFER'||!payload.data||typeof payload.data!=='object')throw new Error('Invalid Paradise University progress file');
    for(const k of transferKeys())if(Object.prototype.hasOwnProperty.call(payload.data,k))localStorage[k]=String(payload.data[k]);
    return{version:payload.version||'',trainingVersion:payload.trainingVersion||'',exportedAt:payload.exportedAt||''}
  }
  function wireImport(input){input.onchange=async()=>{const f=input.files?.[0];if(!f)return;try{const payload=JSON.parse(await f.text()),meta=applyTransfer(payload);showToast('Progress imported',meta.trainingVersion===String(window.PARADISE_UNIVERSITY_VERSION||PU_VERSION)?'Current-version device progress restored.':'Older history imported; current-version gates still control readiness.');setTimeout(()=>puSetPage('progress'),250)}catch(e){showToast('Import failed',e?.message||'The selected file is not a valid Paradise University progress backup.')}finally{input.value=''}}}

  const baseProgress=puProgress;
  puProgress=function(){
    baseProgress();if(view!=='training')return;
    const first=M.querySelector('section.card'),steps=advancementCopy();
    if(first&&!M.querySelector('.puNextRequirements')){const d=document.createElement('section');d.className='card puNextRequirements';d.innerHTML=`<div class="lab">WHAT YOU NEED NEXT</div><ol>${steps.map(x=>`<li>${escHtml(x)}</li>`).join('')}</ol>`;first.insertAdjacentElement('afterend',d)}
    if(!M.querySelector('.puProgressTransfer')){
      const d=document.createElement('details');d.className='puSources puProgressTransfer';d.innerHTML=`<summary>Progress backup & device transfer</summary><div class="puTransferBody"><p>Export this device's Paradise University training progress and import it on another device. This is a manual transfer—not an employee account, centralized manager dashboard, or official certification record.</p><div class="puTransferActions"><button id="puExportProgress" class="btn secondary">EXPORT PROGRESS FILE</button><button id="puImportProgress" class="btn secondary">IMPORT PROGRESS FILE</button><input id="puImportProgressFile" type="file" accept="application/json,.json" hidden></div></div>`;M.appendChild(d);
      d.querySelector('#puExportProgress').onclick=downloadTransfer;const file=d.querySelector('#puImportProgressFile');d.querySelector('#puImportProgress').onclick=()=>file.click();wireImport(file)
    }
  };

  function notesRead(){try{return JSON.parse(localStorage[MEDIA_NOTES_STORE]||'{}')}catch{return{}}}
  function noteFor(id){return String(notesRead()[id]?.note||'')}
  function saveNote(id,note){const all=notesRead();all[id]={note:String(note||'').slice(0,4000),updatedAt:new Date().toISOString()};localStorage[MEDIA_NOTES_STORE]=JSON.stringify(all)}
  function practiceCategoryFor(m){const t=`${m?.title||''} ${(m?.topics||[]).join(' ')}`.toLowerCase();if(/objection|not interested|not now|hesitation/.test(t))return'Objections';if(/appointment|lead quality|set|commitment/.test(t))return'Appointments';if(/permit|compliance|field|no-go|refusal|literature|hoa|security/.test(t))return'Field Rules';if(/opening|approach|tonality|body language|canvass/.test(t))return'Opening';return''}
  function injectMediaLearning(id){
    const root=document.getElementById('puPlayerRoot'),body=root?.querySelector('.puPlayerBody'),m=(window.PU_CONTENT?.media||[]).find(x=>x.id===id);if(!body||!m||body.querySelector('.puMediaLearningTools'))return;
    const cat=practiceCategoryFor(m),note=noteFor(id),d=document.createElement('div');d.className='puMediaLearningTools';
    d.innerHTML=`<div class="puMediaLearningHead"><b>LEARNING TOOLS</b><small>Notes stay on this device / progress transfer.</small></div>${Array.isArray(m.chapters)&&m.chapters.length?`<p>${m.chapters.length} verified source chapter${m.chapters.length===1?'':'s'} available.</p>`:''}<label for="puMediaNote">My note</label><textarea id="puMediaNote" maxlength="4000" placeholder="Write one takeaway to use in the field or in Practice…">${escHtml(note)}</textarea><div class="puMediaLearningActions"><button id="puSaveMediaNote">SAVE NOTE</button>${cat?`<button id="puPracticeMediaSkill">PRACTICE THIS SKILL</button>`:''}</div>${m.transcriptUrl?'':`<small class="puToolBoundary">No verified transcript is published for this source in the current catalog; Paradise University does not fabricate one.</small>`}`;
    const progress=body.querySelector('.puPlayerProgressActions');if(progress)progress.insertAdjacentElement('afterend',d);else body.appendChild(d);
    d.querySelector('#puSaveMediaNote').onclick=()=>{saveNote(id,d.querySelector('#puMediaNote').value);showToast('Note saved','Your media note is stored with this device-training progress.')};
    if(cat)d.querySelector('#puPracticeMediaSkill').onclick=()=>{puPlayerClose();puSetPage('practice');setTimeout(()=>{const button=[...document.querySelectorAll('[data-practice-cat]')].find(x=>x.dataset.practiceCat===cat);button?.click()},40)};
  }
  if(typeof window.puPlayerOpen==='function'){
    const basePlayerOpen=window.puPlayerOpen;window.puPlayerOpen=function(id){basePlayerOpen(id);setTimeout(()=>injectMediaLearning(id),0)};if(typeof puPlayerOpen==='function')puPlayerOpen=window.puPlayerOpen;
  }

  function showToast(title,detail=''){
    let old=document.getElementById('puExperienceToast');if(old)old.remove();const d=document.createElement('div');d.id='puExperienceToast';d.className='puExperienceToast';d.setAttribute('role','status');d.innerHTML=`<b>${escHtml(title)}</b>${detail?`<small>${escHtml(detail)}</small>`:''}`;document.body.appendChild(d);requestAnimationFrame(()=>d.classList.add('show'));setTimeout(()=>{d.classList.remove('show');setTimeout(()=>d.remove(),220)},1900)
  }
  const baseMark=puMark;
  puMark=function(id,complete=true){
    const before=puLessonDone(id);baseMark(id,complete);const after=puLessonDone(id);if(!before&&after){const x=lessonObj(id),r=x&&coreStages.includes(x.stage)?remainingInStage(x.stage):null;const detail=r===0&&x?`${stageName(x.stage)} device gates complete.`:r!=null&&x?`${r} ${stageName(x.stage)} gate${r===1?'':'s'} remaining.`:'Progress saved on this device.';setTimeout(()=>showToast('Lesson complete ✓',detail),0)}
  };

  window.PU_TRAINING_EXPERIENCE_V3_VERSION=VERSION;
  window.PU_PROGRESS_TRANSFER_VERSION=TRANSFER_VERSION;
  window.puProgressTransferPayload=transferPayload;
  window.puApplyProgressTransfer=applyTransfer;
  window.puMediaLearningNote=id=>noteFor(id);
})();
