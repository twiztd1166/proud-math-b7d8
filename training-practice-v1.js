(()=>{
  const STORE='puPracticeStatsV1';
  const VERSION='2026.08.17-pu-practice-v3-adaptive';
  const WEAK_MODE='__weak__';
  const cats=[
    {id:'Opening',label:'Practice Opening',icon:'◉',help:'First 20 seconds, pace, confidence, delivery.'},
    {id:'Objections',label:'Practice Objections',icon:'↔',help:'Acknowledge, understand, respond, return—or stop.'},
    {id:'Appointments',label:'Practice Appointments',icon:'▣',help:'Value of visit, transition, choices, quality.'},
    {id:'Field Rules',label:'Practice Field Rules',icon:'!',help:'NO-GO, refusal, access, permit, literature.'}
  ];
  let activeCat='',activeDrill=null,lastByCat={};
  const readStats=()=>{try{return JSON.parse(localStorage[STORE]||'{}')}catch{return{}}};
  const writeStats=v=>localStorage[STORE]=JSON.stringify(v);
  const today=()=>{const d=new Date(),y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return`${y}-${m}-${day}`};
  const sourceScenarios=()=>Array.isArray(window.PU_PRACTICE_SCENARIOS)&&window.PU_PRACTICE_SCENARIOS.length?window.PU_PRACTICE_SCENARIOS:(window.PU_CONTENT?.drills||[]);
  function weakIdsFrom(s=readStats()){
    const latest=new Map();for(const h of Array.isArray(s.history)?s.history:[])if(h?.scenarioId)latest.set(h.scenarioId,h.outcome);
    const valid=new Set(sourceScenarios().map(x=>x.id));return[...latest.entries()].filter(([id,outcome])=>valid.has(id)&&outcome==='NEEDS_PRACTICE').map(([id])=>id);
  }
  function stats(){const s=readStats();return{total:Number(s.total||0),today:s.date===today()?Number(s.today||0):0,got:Number(s.got||0),more:Number(s.more||0),byCategory:s.byCategory||{},history:Array.isArray(s.history)?s.history:[],weakCount:weakIdsFrom(s).length}}
  function record(kind,drill){
    let s=readStats(),d=today();if(s.date!==d){s.date=d;s.today=0}
    s.total=Number(s.total||0)+1;s.today=Number(s.today||0)+1;s.got=Number(s.got||0)+(kind==='got'?1:0);s.more=Number(s.more||0)+(kind==='more'?1:0);s.byCategory=s.byCategory||{};s.byCategory[drill.category]=Number(s.byCategory[drill.category]||0)+1;
    const history=Array.isArray(s.history)?s.history:[];history.push({scenarioId:drill.id,category:drill.category,outcome:kind==='got'?'GOT_IT':'NEEDS_PRACTICE',hardStop:!!drill.hardStop,scoreDimensions:Array.isArray(drill.scoreDimensions)?drill.scoreDimensions.slice():[],trainingContentVersion:drill.trainingContentVersion||window.PU_PRACTICE_DATA_VERSION||PU_VERSION,at:new Date().toISOString()});s.history=history.slice(-50);writeStats(s)
  }
  function pool(cat){return sourceScenarios().filter(x=>x.category===cat)}
  function weakPool(){const ids=new Set(weakIdsFrom());return sourceScenarios().filter(x=>ids.has(x.id))}
  function pick(cat){
    const p=cat===WEAK_MODE?weakPool():pool(cat);if(!p.length)return null;let choices=p.filter(x=>x.id!==lastByCat[cat]);if(!choices.length)choices=p;
    if(cat!==WEAK_MODE){const weak=new Set(weakIdsFrom()),weighted=[];for(const x of choices){const weight=weak.has(x.id)?3:1;for(let i=0;i<weight;i++)weighted.push(x)}choices=weighted}
    const x=choices[Math.floor(Math.random()*choices.length)];lastByCat[cat]=x.id;return x
  }
  function renderStats(){const s=stats(),el=document.getElementById('puPracticeStats');if(el)el.innerHTML=`<span><b>${s.today}</b> today</span><span><b>${s.total}</b> total</span>`}
  function renderWeakEntry(){
    const el=document.getElementById('puWeakAreaEntry');if(!el)return;const weak=weakPool();
    if(!weak.length){el.innerHTML='';return}
    el.innerHTML=`<button id="puWeakPractice" class="puContinue"><small>ADAPTIVE REVIEW</small><b>Practice My Weak Areas</b><span>${weak.length} scenario${weak.length===1?'':'s'} flagged for review. A correct retry clears the flag.</span></button>`;
    document.getElementById('puWeakPractice').onclick=()=>{activeCat=WEAK_MODE;activeDrill=pick(WEAK_MODE);document.querySelectorAll('[data-practice-cat]').forEach(x=>x.classList.remove('active'));scenario()}
  }
  function scenario(){
    const box=document.getElementById('puPracticeBox');if(!box)return;
    if(!activeDrill){box.innerHTML=activeCat===WEAK_MODE?'<div class="puEmpty">Weak-area review is clear for now. Use the four skill categories for more practice.</div>':'<div class="puEmpty">Choose a skill above to start a quick scenario.</div>';return}
    const weak=new Set(weakIdsFrom()),stop=activeDrill.hardStop?'<span class="puBadge historical">HARD STOP</span>':weak.has(activeDrill.id)?'<span class="puBadge reference">REVIEW</span>':'';
    box.innerHTML=`<div class="puPracticeScenario"><div class="puMediaTop"><small>${esc(activeDrill.category).toUpperCase()}</small>${stop}</div><h3>${esc(activeDrill.title)}</h3><p>${esc(activeDrill.prompt)}</p><button id="puReveal" class="btn primary">SHOW COACHING ANSWER</button><div id="puPracticeAnswer"></div></div>`;
    document.getElementById('puReveal').onclick=()=>{
      const dims=Array.isArray(activeDrill.scoreDimensions)&&activeDrill.scoreDimensions.length?`<small>FOCUS: ${esc(activeDrill.scoreDimensions.join(' · '))}</small>`:'';
      const coach=activeDrill.coachingNote?`<p class="puPracticeCoachNote"><b>Coaching focus:</b> ${esc(activeDrill.coachingNote)}</p>`:'';
      document.getElementById('puPracticeAnswer').innerHTML=`<div class="puCoachAnswer"><small>COACHING ANSWER</small><p>${esc(activeDrill.answer)}</p>${dims}${coach}<div class="puRate"><button data-rate="got">✓ GOT IT</button><button data-rate="more">↻ NEED MORE PRACTICE</button></div><button id="puNextScenario" class="btn secondary">NEXT SCENARIO</button></div>`;
      document.getElementById('puReveal').disabled=true;
      let rated=false;
      document.querySelectorAll('[data-rate]').forEach(b=>b.onclick=()=>{if(rated)return;rated=true;record(b.dataset.rate,activeDrill);document.querySelectorAll('[data-rate]').forEach(x=>x.disabled=true);b.classList.add('selected');renderStats();renderWeakEntry()});
      document.getElementById('puNextScenario').onclick=()=>{activeDrill=pick(activeCat);scenario()};
    };
  }
  puPractice=function(){
    M.innerHTML=`<button class="back puBack" id="puBack">← Training</button><h2>Practice</h2><p class="sub">Pick one skill. One scenario at a time. Items marked Needs Practice are automatically brought back for review.</p><div id="puPracticeStats" class="puPracticeStats"></div><div id="puWeakAreaEntry"></div><div class="puGrid puPracticeGrid">${cats.map(c=>`<button class="puTile" data-practice-cat="${esc(c.id)}"><span class="puIcon">${c.icon}</span><b>${esc(c.label)}</b><small>${esc(c.help)}</small></button>`).join('')}</div><section id="puPracticeBox" class="card"><div class="puEmpty">Choose a skill above to start a quick scenario.</div></section><div class="puNotice"><b>Practice only:</b> These counts and adaptive reviews help you repeat skills. They are not an official certification or manager verification.</div>`;
    document.getElementById('puBack').onclick=()=>puSetPage('home');renderStats();renderWeakEntry();
    document.querySelectorAll('[data-practice-cat]').forEach(b=>b.onclick=()=>{activeCat=b.dataset.practiceCat;activeDrill=pick(activeCat);document.querySelectorAll('[data-practice-cat]').forEach(x=>x.classList.toggle('active',x===b));scenario()});
  };
  window.PU_PRACTICE_VERSION=VERSION;
  window.puPracticeStats=stats;
  window.puPracticeScenarioPool=sourceScenarios;
  window.puPracticeCurrentScenario=()=>activeDrill;
  window.puPracticeWeakScenarioIds=()=>weakIdsFrom().slice();
})();
