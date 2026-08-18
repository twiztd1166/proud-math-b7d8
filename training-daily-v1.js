(()=>{
  if(typeof puHome!=='function'||typeof puSetPage!=='function'||typeof renderTraining!=='function')return;
  const VERSION='2026.08.17-pu-daily-training-v1';
  const STORE='puDailyTrainingV1';
  const trackOrder=Array.isArray(window.PU_DEFAULT_TRACK_STAGES)?[...window.PU_DEFAULT_TRACK_STAGES]:['foundation','field-ready','canvasser'];
  const themes=[
    {label:'Foundation & Standards',practice:'Field Rules',help:'Reinforce role boundaries, professionalism, and field authority.'},
    {label:'Door Approach',practice:'Opening',help:'Sharpen the first 20 seconds, pace, confidence, and delivery.'},
    {label:'Field Compliance',practice:'Field Rules',help:'Rehearse GO/NO-GO, refusals, access, literature, and stop conditions.'},
    {label:'Conversation Skills',practice:'Objections',help:'Listen first, separate hesitation from refusal, and stop when required.'},
    {label:'Product & Appointment Knowledge',practice:'Appointments',help:'Identify the project and move appropriately toward a quality appointment.'},
    {label:'Coaching & Library',practice:'Opening',help:'Use one curated trainer source, then apply the useful method inside Paradise rules.'},
    {label:'Weekly Review',practice:'Objections',help:'Mix prior learning and spend extra time on genuine weak areas.'}
  ];
  const escHtml=s=>typeof esc==='function'?esc(s):String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  const coreLessons=()=>PU_LESSONS.filter(x=>trackOrder.includes(x.stage));
  const ready=x=>typeof window.puLessonTrainingReady==='function'?window.puLessonTrainingReady(x.id):puLessonDone(x.id);
  const stageName=id=>PU_PATH.find(x=>x.id===id)?.name||id;
  const nextCore=()=>coreLessons().find(x=>!ready(x))||null;
  const dateKey=()=>{const d=new Date(),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return`${y}-${m}-${day}`};
  function readState(){
    try{const x=JSON.parse(localStorage.getItem(STORE)||'{}');return x&&typeof x==='object'&&!Array.isArray(x)&&Array.isArray(x.days)?{days:x.days.filter(v=>typeof v==='string').slice(-365)}:{days:[]}}catch{return{days:[]}}
  }
  function writeState(s){try{localStorage.setItem(STORE,JSON.stringify({days:s.days.slice(-365)}))}catch{}}
  function touchDay(){
    const s=readState(),today=dateKey();if(!s.days.includes(today)){s.days.push(today);writeState(s)}
    const dayNumber=Math.max(1,s.days.indexOf(today)+1),cycleDay=((dayNumber-1)%themes.length)+1;
    return{dayNumber,cycleDay,theme:themes[cycleDay-1],days:s.days.slice()}
  }
  function completedReview(){
    const p=typeof puRead==='function'?puRead():{},done=coreLessons().filter(ready);if(!done.length)return null;
    const today=dateKey(),older=done.filter(x=>String(p[x.id]?.updatedAt||'').slice(0,10)!==today),pool=older.length?older:done;
    return pool.slice().sort((a,b)=>Date.parse(p[a.id]?.updatedAt||0)-Date.parse(p[b.id]?.updatedAt||0))[0]||null
  }
  function weakCount(){try{const x=window.puPracticeWeakScenarioIds?.();return Array.isArray(x)?x.length:0}catch{return 0}}
  function reviewAction(){
    const x=completedReview();
    if(x)return{kind:'lesson',id:x.id,title:x.title,eyebrow:'QUICK REVIEW · 2–3 MIN',detail:`Revisit one previously completed ${stageName(x.stage)} lesson.`,stage:x.stage};
    return{kind:'practice',category:'Field Rules',title:'Field authority refresher',eyebrow:'QUICK REVIEW · 2–3 MIN',detail:'Rehearse the rule that live municipality instructions control the actual route.',weak:false};
  }
  function skillAction(){
    const x=nextCore();
    if(x)return{kind:'lesson',id:x.id,title:x.title,eyebrow:`TODAY'S SKILL · ${Number(x.minutes||0)} MIN`,detail:`Current-track lesson · ${stageName(x.stage)}.`,stage:x.stage};
    return{kind:'progress',title:'Maintain your canvasser core',eyebrow:"TODAY'S SKILL · 3–5 MIN",detail:'Core device gates are complete. Use What You Need Next and keep skills fresh without auto-queuing a future role.',stage:'core-complete'};
  }
  function applicationAction(cycleDay,theme){
    const weak=weakCount();
    if(cycleDay===6)return{kind:'media',title:'Coaching library session',eyebrow:'COACH · 3–5 MIN',detail:'Choose one curated trainer item, capture one takeaway, then apply it inside current Paradise rules.',weak:false};
    if(weak>0)return{kind:'practice',weak:true,title:'Practice My Weak Areas',eyebrow:'APPLY · 3–5 MIN',detail:`${weak} scenario${weak===1?'':'s'} flagged by actual device-local attempts. A correct retry clears the flag.`};
    return{kind:'practice',category:theme.practice,title:`Practice ${theme.practice}`,eyebrow:'APPLY · 3–5 MIN',detail:theme.help,weak:false};
  }
  function plan(){
    const day=touchDay(),review=reviewAction(),skill=skillAction(),application=applicationAction(day.cycleDay,day.theme);
    return{version:VERSION,dayNumber:day.dayNumber,cycleDay:day.cycleDay,theme:day.theme.label,review,skill,application,recommendationOnly:true}
  }
  function openAction(a){
    if(!a)return;
    if(a.kind==='lesson')return puSetPage(`lesson:${a.id}`);
    if(a.kind==='progress')return puSetPage('progress');
    if(a.kind==='media')return puSetPage('media');
    if(a.kind==='practice'){
      puSetPage('practice');
      setTimeout(()=>{
        if(a.weak){const weak=document.getElementById('puWeakPractice');if(weak){weak.click();return}}
        const target=[...document.querySelectorAll('[data-practice-cat]')].find(x=>x.dataset.practiceCat===a.category);target?.click()
      },30)
    }
  }
  function activityHtml(a,index){return`<button class="puDailyActivity" data-daily-index="${index}"><small>${escHtml(a.eyebrow)}</small><b>${escHtml(a.title)}</b><span>${escHtml(a.detail)}</span></button>`}
  const baseHome=puHome;
  puHome=function(){
    baseHome();if(view!=='training')return;
    const p=plan(),anchor=document.getElementById('puContinue');if(!anchor||M.querySelector('.puDailyTraining'))return;
    const d=document.createElement('section');d.className='puDailyTraining';d.innerHTML=`<div class="puDailyHead"><div><small>RECOMMENDED FOR TODAY</small><h3>Training Day ${p.dayNumber}</h3></div><span>~10–15 min</span></div><div class="puDailyTheme">${escHtml(p.theme)} · Day ${p.cycleDay} of 7</div><div class="puDailyActivities">${[p.review,p.skill,p.application].map(activityHtml).join('')}</div><button id="puStartDaily" class="btn primary puStartDaily">START TODAY'S TRAINING</button><small class="puDailyBoundary">Recommendation only · the cycle advances on each distinct day this device opens Training. It does not create a deadline, certification, or future-role authorization.</small>`;
    anchor.insertAdjacentElement('beforebegin',d);
    const actions=[p.review,p.skill,p.application];d.querySelectorAll('[data-daily-index]').forEach(b=>b.onclick=()=>openAction(actions[Number(b.dataset.dailyIndex)]));
    d.querySelector('#puStartDaily').onclick=()=>openAction(p.review)
  };
  window.PU_DAILY_TRAINING_VERSION=VERSION;
  window.puDailyTrainingPlan=()=>{const p=plan();return JSON.parse(JSON.stringify(p))};
  window.puDailyTrainingState=()=>{const s=readState(),today=dateKey();return{days:s.days.slice(),today,dayNumber:s.days.includes(today)?s.days.indexOf(today)+1:0}};
})();
