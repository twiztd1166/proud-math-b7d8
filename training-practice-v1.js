(()=>{
  const STORE='puPracticeStatsV1';
  const VERSION='2026.08.16-pu-practice-v2';
  const cats=[
    {id:'Opening',label:'Practice Opening',icon:'◉',help:'First 20 seconds, pace, confidence, delivery.'},
    {id:'Objections',label:'Practice Objections',icon:'↔',help:'Acknowledge, understand, respond, return—or stop.'},
    {id:'Appointments',label:'Practice Appointments',icon:'▣',help:'Value of visit, transition, choices, quality.'},
    {id:'Field Rules',label:'Practice Field Rules',icon:'!',help:'NO-GO, refusal, access, permit, literature.'}
  ];
  let activeCat='',activeDrill=null,lastByCat={};
  const readStats=()=>{try{return JSON.parse(localStorage[STORE]||'{}')}catch{return{}}};
  const writeStats=v=>localStorage[STORE]=JSON.stringify(v);
  const today=()=>new Date().toISOString().slice(0,10);
  const sourceScenarios=()=>Array.isArray(window.PU_PRACTICE_SCENARIOS)&&window.PU_PRACTICE_SCENARIOS.length?window.PU_PRACTICE_SCENARIOS:(window.PU_CONTENT?.drills||[]);
  function stats(){const s=readStats();return{total:Number(s.total||0),today:s.date===today()?Number(s.today||0):0,got:Number(s.got||0),more:Number(s.more||0),byCategory:s.byCategory||{},history:Array.isArray(s.history)?s.history:[]}}
  function record(kind,drill){
    let s=readStats(),d=today();if(s.date!==d){s.date=d;s.today=0}
    s.total=Number(s.total||0)+1;s.today=Number(s.today||0)+1;s.got=Number(s.got||0)+(kind==='got'?1:0);s.more=Number(s.more||0)+(kind==='more'?1:0);s.byCategory=s.byCategory||{};s.byCategory[drill.category]=Number(s.byCategory[drill.category]||0)+1;
    const history=Array.isArray(s.history)?s.history:[];history.push({scenarioId:drill.id,category:drill.category,outcome:kind==='got'?'GOT_IT':'NEEDS_PRACTICE',hardStop:!!drill.hardStop,scoreDimensions:Array.isArray(drill.scoreDimensions)?drill.scoreDimensions.slice():[],trainingContentVersion:drill.trainingContentVersion||window.PU_PRACTICE_DATA_VERSION||PU_VERSION,at:new Date().toISOString()});s.history=history.slice(-50);writeStats(s)
  }
  function pool(cat){return sourceScenarios().filter(x=>x.category===cat)}
  function pick(cat){const p=pool(cat);if(!p.length)return null;let choices=p.filter(x=>x.id!==lastByCat[cat]);if(!choices.length)choices=p;const x=choices[Math.floor(Math.random()*choices.length)];lastByCat[cat]=x.id;return x}
  function renderStats(){const s=stats(),el=document.getElementById('puPracticeStats');if(el)el.innerHTML=`<span><b>${s.today}</b> today</span><span><b>${s.total}</b> total</span>`}
  function scenario(){
    const box=document.getElementById('puPracticeBox');if(!box)return;
    if(!activeDrill){box.innerHTML='<div class="puEmpty">Choose a skill above to start a quick scenario.</div>';return}
    const stop=activeDrill.hardStop?'<span class="puBadge historical">HARD STOP</span>':'';
    box.innerHTML=`<div class="puPracticeScenario"><div class="puMediaTop"><small>${esc(activeDrill.category).toUpperCase()}</small>${stop}</div><h3>${esc(activeDrill.title)}</h3><p>${esc(activeDrill.prompt)}</p><button id="puReveal" class="btn primary">SHOW COACHING ANSWER</button><div id="puPracticeAnswer"></div></div>`;
    document.getElementById('puReveal').onclick=()=>{
      const dims=Array.isArray(activeDrill.scoreDimensions)&&activeDrill.scoreDimensions.length?`<small>FOCUS: ${esc(activeDrill.scoreDimensions.join(' · '))}</small>`:'';
      const coach=activeDrill.coachingNote?`<p class="puPracticeCoachNote"><b>Coaching focus:</b> ${esc(activeDrill.coachingNote)}</p>`:'';
      document.getElementById('puPracticeAnswer').innerHTML=`<div class="puCoachAnswer"><small>COACHING ANSWER</small><p>${esc(activeDrill.answer)}</p>${dims}${coach}<div class="puRate"><button data-rate="got">✓ GOT IT</button><button data-rate="more">↻ NEED MORE PRACTICE</button></div><button id="puNextScenario" class="btn secondary">NEXT SCENARIO</button></div>`;
      document.getElementById('puReveal').disabled=true;
      let rated=false;
      document.querySelectorAll('[data-rate]').forEach(b=>b.onclick=()=>{if(rated)return;rated=true;record(b.dataset.rate,activeDrill);document.querySelectorAll('[data-rate]').forEach(x=>x.disabled=true);b.classList.add('selected');renderStats()});
      document.getElementById('puNextScenario').onclick=()=>{activeDrill=pick(activeCat);scenario()};
    };
  }
  puPractice=function(){
    M.innerHTML=`<button class="back puBack" id="puBack">← Training</button><h2>Practice</h2><p class="sub">Pick one skill. One scenario at a time.</p><div id="puPracticeStats" class="puPracticeStats"></div><div class="puGrid puPracticeGrid">${cats.map(c=>`<button class="puTile" data-practice-cat="${esc(c.id)}"><span class="puIcon">${c.icon}</span><b>${esc(c.label)}</b><small>${esc(c.help)}</small></button>`).join('')}</div><section id="puPracticeBox" class="card"><div class="puEmpty">Choose a skill above to start a quick scenario.</div></section><div class="puNotice"><b>Practice only:</b> These counts help you repeat skills. They are not an official certification or manager verification.</div>`;
    document.getElementById('puBack').onclick=()=>puSetPage('home');renderStats();
    document.querySelectorAll('[data-practice-cat]').forEach(b=>b.onclick=()=>{activeCat=b.dataset.practiceCat;activeDrill=pick(activeCat);document.querySelectorAll('[data-practice-cat]').forEach(x=>x.classList.toggle('active',x===b));scenario()});
  };
  window.PU_PRACTICE_VERSION=VERSION;
  window.puPracticeStats=stats;
  window.puPracticeScenarioPool=sourceScenarios;
  window.puPracticeCurrentScenario=()=>activeDrill;
})();
