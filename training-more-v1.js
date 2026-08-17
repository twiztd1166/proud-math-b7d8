(()=>{
  const baseHome=puHome;
  const baseRender=renderTraining;
  const managerLessons=()=>window.PU_CONTENT?.managerLessons||[];
  const allLessons=()=>[...(window.PU_CONTENT?.lessons||[]),...managerLessons()];
  const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const words=s=>norm(s).split(' ').filter(Boolean);
  const operationalTerms=['permit','permission','no soliciting','soliciting','no go','refusal','leave property','hoa','security','police','code enforcement','hours','door hanger','courtesy notice','literature','price','pricing','financing','finance','contract','cancellation','rescission','appointment','roof','window','door','spouse','household','not interested','not now','estimate'];
  const drillAliases={
    'opening':'opening first 20 seconds introduction opener',
    'not-interested':'not interested no interest objection decline hesitation',
    'not-now':'not now later timing objection maybe later',
    'already-estimate':'already estimate already had estimate previous estimate quote',
    'price-at-door':'price pricing cost how much quote financing payment',
    'appointment-close':'appointment close schedule scheduling weekday weekend time',
    'leave-property':'leave property get off property refusal stop resident says leave',
    'no-go':'no go nogo do not canvass prohibited municipality lookup'
  };
  const isOperationalQuery=q=>{const n=norm(q);return operationalTerms.some(x=>n.includes(norm(x)))};
  const authorityRank=item=>{
    if(item.type==='lesson')return 0;
    if(item.type==='drill')return 1;
    if(item.type==='media')return item.media?.authority==='PARADISE_APPROVED'?2:item.media?.authority==='HISTORICAL'?4:3;
    return item.source?.authority==='HISTORICAL'?4:3;
  };

  function moreButton(){
    const notice=M.querySelector('.puNotice');
    if(document.getElementById('puMoreButton'))return;
    const wrap=document.createElement('div');wrap.className='puMoreWrap';
    wrap.innerHTML='<button id="puMoreButton" class="puMoreButton">MORE TRAINING TOOLS <span>›</span></button>';
    if(notice)M.insertBefore(wrap,notice);else M.appendChild(wrap);
    document.getElementById('puMoreButton').onclick=()=>puSetPage('more');
  }

  puHome=function(){baseHome();moreButton()};

  function puCurrentRefs(){
    const courtesy=db?.meta?.currentCourtesyNoticeUrl||db?.meta?.courtesyNoticeUrl||'';
    const master=db?.meta?.currentMasterPdfUrl||'';
    const sheet=db?.meta?.currentSheetUrl||'';
    return`<div class="puCurrentRefs"><button id="puGoLookup" class="puMoreRow"><span><b>Live Municipality Lookup</b><small>Use this for the current field answer.</small></span><strong>OPEN</strong></button>${master?`<a class="puMoreRow" href="${esc(master)}" target="_blank" rel="noopener"><span><b>Municipality Master PDF</b><small>Current controlled reference.</small></span><strong>↗</strong></a>`:''}${sheet?`<a class="puMoreRow" href="${esc(sheet)}" target="_blank" rel="noopener"><span><b>Rules Sheet</b><small>Current controlled source sheet.</small></span><strong>↗</strong></a>`:''}${courtesy?`<a class="puMoreRow" href="${esc(courtesy)}" target="_blank" rel="noopener"><span><b>Courtesy Notice</b><small>Current installation-day notice.</small></span><strong>↗</strong></a>`:''}</div>`;
  }

  function puMore(){
    M.innerHTML=`<button class="back puBack" id="puBack">← Training</button><h2>More</h2><p class="sub">Extra tools when you need them. Your normal training stays under Continue Training.</p><div class="puMoreList"><button class="puMoreRow" data-more="search"><span><b>Search Training</b><small>Find the Paradise lesson first, then supporting practice and sources.</small></span><strong>⌕</strong></button><button class="puMoreRow" data-more="library"><span><b>Source Library</b><small>Tony Hoty, Dave Yoho, Grosso University, and Paradise references.</small></span><strong>›</strong></button><button class="puMoreRow" data-more="manager"><span><b>Manager Training</b><small>Leadership, coaching, route operations, and developing future sales reps.</small></span><strong>›</strong></button><button class="puMoreRow" data-more="refs"><span><b>Current Reference Documents</b><small>Field lookup, municipality master, rules sheet, and courtesy notice.</small></span><strong>›</strong></button></div>`;
    document.getElementById('puBack').onclick=()=>puSetPage('home');
    M.querySelector('[data-more="search"]').onclick=()=>puSetPage('search');
    M.querySelector('[data-more="library"]').onclick=()=>puSetPage('library');
    M.querySelector('[data-more="manager"]').onclick=()=>puSetPage('stage:manager');
    M.querySelector('[data-more="refs"]').onclick=()=>puSetPage('refs');
  }

  function score(item,q){
    const query=norm(q);if(!query)return 0;const terms=words(q);const title=norm(item.title),text=norm(item.text),tags=norm(item.tags);
    let relevance=0;if(title===query)relevance+=120;if(title.includes(query))relevance+=80;if(text.includes(query))relevance+=35;if(tags.includes(query))relevance+=30;
    for(const t of terms){if(title.includes(t))relevance+=18;if(text.includes(t))relevance+=7;if(tags.includes(t))relevance+=8}
    if(!relevance)return 0;
    return relevance+(item.type==='lesson'?60:item.type==='drill'?40:item.type==='media'?20:0);
  }
  function searchIndex(){
    const lessons=allLessons().map(x=>({type:'lesson',id:x.id,title:x.title,text:[x.summary,x.learn,x.practice,x.pass].join(' '),tags:x.stage||'',stage:x.stage}));
    const drills=(window.PU_CONTENT?.drills||[]).map(x=>({type:'drill',id:x.id,title:x.title,text:[x.prompt,x.answer].join(' '),tags:[x.category||'',drillAliases[x.id]||''].join(' '),category:x.category}));
    const media=(window.PU_CONTENT?.media||[]).map(x=>({type:'media',id:x.id,title:x.title,text:[x.trainer,x.note].join(' '),tags:(x.topics||[]).join(' '),media:x}));
    const sources=Object.entries(window.PU_CONTENT?.sources||{}).map(([id,x])=>({type:'source',id,title:x.title,text:x.authority||'',tags:'source reference',source:x}));
    return[...lessons,...drills,...media,...sources];
  }
  function rankedHits(q){
    const operational=isOperationalQuery(q);
    const all=searchIndex().map(x=>({...x,_score:score(x,q)})).filter(x=>x._score>0);
    all.sort((a,b)=>operational?(authorityRank(a)-authorityRank(b)||b._score-a._score||a.title.localeCompare(b.title)):(b._score-a._score||authorityRank(a)-authorityRank(b)||a.title.localeCompare(b.title)));
    let hits=all.slice(0,20);
    const matchingDrill=all.filter(x=>x.type==='drill').sort((a,b)=>b._score-a._score)[0];
    if(matchingDrill&&!hits.some(x=>x.type==='drill'))hits=hits.length>=20?[...hits.slice(0,19),matchingDrill]:[...hits,matchingDrill];
    return hits;
  }
  function resultMarkup(x){
    const label=x.type==='lesson'?'PARADISE LESSON':x.type==='drill'?'PRACTICE':x.type==='media'?'MEDIA':'SOURCE / REFERENCE';
    if(x.type==='source')return`<a class="puSearchResult ${x.type}" href="${esc(x.source.url)}" target="_blank" rel="noopener"><span><small>${label}</small><b>${esc(x.title)}</b></span><strong>↗</strong></a>`;
    return`<button class="puSearchResult ${x.type}" data-result-type="${x.type}" data-result-id="${esc(x.id)}"><span><small>${label}</small><b>${esc(x.title)}</b></span><strong>›</strong></button>`;
  }
  function puSearch(){
    M.innerHTML=`<button class="back puBack" id="puBack">← More</button><h2>Search Training</h2><p class="sub">Current Paradise lessons are ranked before legacy/source material for operational questions.</p><div class="puSearchBox"><span>⌕</span><input id="puSearchInput" type="search" autocomplete="off" placeholder="Try: not interested, permit, price…"></div><div class="puNotice"><b>Need the rule for a city?</b> Use Lookup. Training search never replaces the live municipality result.</div><div id="puSearchResults" class="puSearchResults"><div class="puEmpty">Type a word or phrase to search lessons, practice, media, and source material.</div></div>`;
    document.getElementById('puBack').onclick=()=>puSetPage('more');
    const input=document.getElementById('puSearchInput'),box=document.getElementById('puSearchResults');
    function draw(){
      const q=input.value.trim();if(!q){box.innerHTML='<div class="puEmpty">Type a word or phrase to search lessons, practice, media, and source material.</div>';return}
      const hits=rankedHits(q);
      box.innerHTML=hits.length?hits.map(resultMarkup).join(''):'<div class="puEmpty">No training result found. Try a shorter term, or use Lookup for a municipality rule.</div>';
      box.querySelectorAll('[data-result-type]').forEach(b=>b.onclick=()=>{const t=b.dataset.resultType,id=b.dataset.resultId;if(t==='lesson')puSetPage('lesson:'+id);else if(t==='drill')puSetPage('practice');else if(t==='media')puPlayerOpen(id)})
    }
    input.oninput=draw;setTimeout(()=>input.focus(),20);
  }

  function sourceGroup(title,filter,emptyMessage=''){
    const src=Object.values(window.PU_CONTENT?.sources||{}).filter(filter);
    const media=(window.PU_CONTENT?.media||[]).filter(filter);
    if(!src.length&&!media.length)return emptyMessage?`<div class="puSection">${esc(title)}</div><section class="card puLibraryGroup"><div class="puEmpty">${esc(emptyMessage)}</div></section>`:'';
    return`<div class="puSection">${esc(title)}</div><section class="card puLibraryGroup">${src.map(x=>`<a class="puLibraryItem" href="${esc(x.url)}" target="_blank" rel="noopener"><span><small>SOURCE / REFERENCE</small><b>${esc(x.title)}</b></span><strong>↗</strong></a>`).join('')}${media.map(x=>`<button class="puLibraryItem" data-media="${esc(x.id)}"><span><small>${x.authority==='HISTORICAL'?'HISTORICAL':'MEDIA / REFERENCE'}</small><b>${esc(x.title)}</b><em>${esc(x.trainer||'')}</em></span><strong>▶</strong></button>`).join('')}</section>`;
  }
  function puLibrary(){
    const groupText=x=>`${x.title||''} ${x.trainer||''}`;
    const isTony=x=>/tony hoty/i.test(groupText(x));
    const isDave=x=>/dave yoho/i.test(groupText(x));
    const isGrosso=x=>/grosso/i.test(groupText(x));
    const isParadiseHistorical=x=>x.authority==='HISTORICAL'&&/paradise/i.test(groupText(x));
    M.innerHTML=`<button class="back puBack" id="puBack">← More</button><h2>Source Library</h2><p class="sub">Original training is here when you want to go deeper.</p><div class="puNotice"><b>SOURCE / REFERENCE MATERIAL:</b> Paradise-approved curriculum, current company policy, and live municipality instructions control.</div>${sourceGroup('Tony Hoty',isTony)}${sourceGroup('Dave Yoho',isDave)}${sourceGroup('Rick Grosso / Grosso University',isGrosso)}${sourceGroup('Paradise Historical Training',isParadiseHistorical,'No controlled historical Paradise training source is loaded in this build. Historical material will appear here only after its source and authority are verified.')}<div class="puSection">Paradise Current Reference</div>${puCurrentRefs()}`;
    document.getElementById('puBack').onclick=()=>puSetPage('more');
    document.getElementById('puGoLookup').onclick=()=>setView('lookup');
    if(typeof puBindMediaButtons==='function')puBindMediaButtons(M);
  }
  function puRefs(){
    M.innerHTML=`<button class="back puBack" id="puBack">← More</button><h2>Current Reference Documents</h2><p class="sub">Use these for current field controls and approved Paradise documents.</p><div class="puNotice"><b>Field authority:</b> The live Lookup is the fastest current field answer. Training and source material do not override it.</div>${puCurrentRefs()}`;
    document.getElementById('puBack').onclick=()=>puSetPage('more');
    document.getElementById('puGoLookup').onclick=()=>setView('lookup');
  }

  renderTraining=function(){
    if(view!=='training')return;
    if(puPage==='more')return puMore();
    if(puPage==='search')return puSearch();
    if(puPage==='library')return puLibrary();
    if(puPage==='refs')return puRefs();
    return baseRender();
  };
  window.PU_MORE_VERSION='2026.08.16-pu-more-v2';
})();

(()=>{
  if(typeof puHome!=='function'||typeof puMedia!=='function'||typeof renderTraining!=='function')return;
  const baseHome=puHome,baseMedia=puMedia,baseRender=renderTraining;
  const allMedia=()=>window.PU_CONTENT?.media||[];
  const allSources=()=>window.PU_CONTENT?.sources||{};
  const norm=s=>String(s||'').toLowerCase();
  const topicSet=m=>new Set((m.topics||[]).map(norm));
  const blob=m=>`${m.title||''} ${(m.topics||[]).join(' ')}`.toLowerCase();
  const mediaRow=m=>`<button class="puLibraryItem puCanvassMedia" data-media="${esc(m.id)}"><span><small>${m.type==='audio'?'AUDIO':'VIDEO'} · ${esc(m.authority==='HISTORICAL'?'HISTORICAL':'REFERENCE')}</small><b>${esc(m.title)}</b><em>${esc(m.trainer||'')}</em></span><strong>▶</strong></button>`;
  const sourceRow=s=>`<a class="puLibraryItem" href="${esc(s.url)}" target="_blank" rel="noopener"><span><small>${esc(s.authority==='HISTORICAL'?'HISTORICAL SOURCE':'SOURCE / REFERENCE')}</small><b>${esc(s.title)}</b></span><strong>↗</strong></a>`;
  const group=(title,items,empty='No matching material in this build.')=>`<div class="puSection">${esc(title)} · ${items.length}</div><section class="card puLibraryGroup">${items.length?items.map(mediaRow).join(''):`<div class="puEmpty">${esc(empty)}</div>`}</section>`;
  const sourceGroup=(title,items)=>`<div class="puSection">${esc(title)} · ${items.length}</div><section class="card puLibraryGroup">${items.length?items.map(sourceRow).join(''):'<div class="puEmpty">No source documents in this group.</div>'}</section>`;

  function tonyBucket(m){
    const x=blob(m);
    if(/recruit|manager/.test(x))return'Manager & Recruiting';
    if(/call back|callback/.test(x))return'Follow-Up & Callbacks';
    if(/senior/.test(x))return'Senior Canvassing';
    if(/sound-bite|storm|xactimate|solara|patio|french|entry door|gutter|multi-product/.test(x))return'Specialized & Sound-Bite Examples';
    if(/dvd|full-program|audio program|video clips/.test(x))return'Full Programs';
    if(/onboarding|new canvasser|canvassing 101|process/.test(x))return'Start Here / Fundamentals';
    return'Opening & Appointment Setting';
  }
  const tonyOrder=['Start Here / Fundamentals','Opening & Appointment Setting','Follow-Up & Callbacks','Senior Canvassing','Full Programs','Specialized & Sound-Bite Examples','Manager & Recruiting'];
  function tonyMedia(){return allMedia().filter(x=>x.trainer==='Tony Hoty')}
  function daveMedia(){return allMedia().filter(x=>x.trainer==='Dave Yoho')}
  function grossoCanvassMedia(){
    const supportive=new Set(['tonality','body-language','objections','appointment-quality','lead-quality','delivery','canvassing','communication','mindset','success']);
    const advanced=new Set(['advanced-selling','rick-grosso-bootcamp','product-demo','company-demo','thermal-titan','virtual-closers']);
    return allMedia().filter(x=>{
      if(x.trainer!=='Grosso University')return false;
      const t=topicSet(x);if([...advanced].some(k=>t.has(k)))return false;
      return [...supportive].some(k=>t.has(k))||/definition of a good lead|tonality|body language|objection/i.test(x.title||'');
    });
  }
  function trainerSources(name){
    const rx=name==='Tony Hoty'?/tony hoty/i:name==='Dave Yoho'?/dave yoho/i:/grosso/i;
    return Object.values(allSources()).filter(x=>rx.test(x.title||''));
  }
  function libraryModel(){
    const tony=tonyMedia(),dave=daveMedia(),grosso=grossoCanvassMedia();
    return{tonyTotal:tony.length,daveTotal:dave.length,grossoSupportTotal:grosso.length,totalCanvassingMedia:tony.length+dave.length+grosso.length,tonySourceTotal:trainerSources('Tony Hoty').length};
  }
  window.puCanvassingLibraryModel=libraryModel;

  function addHomeEntry(){
    if(document.getElementById('puCanvassingLibraryHome'))return;
    const grid=M.querySelector('.puGrid');if(!grid)return;
    const wrap=document.createElement('div');wrap.id='puCanvassingLibraryHome';wrap.className='puMoreWrap';
    wrap.innerHTML='<button class="puMoreButton" data-canvass-library>CANVASSING LIBRARY <span>›</span></button>';
    grid.insertAdjacentElement('afterend',wrap);wrap.querySelector('[data-canvass-library]').onclick=()=>puSetPage('canvassing-library');
  }
  puHome=function(){baseHome();addHomeEntry()};

  function addMediaEntry(){
    if(document.getElementById('puCanvassingLibraryMedia'))return;
    const full=document.getElementById('puFullSourceLibrary');if(!full)return;
    const b=document.createElement('button');b.id='puCanvassingLibraryMedia';b.className='puMoreButton puMediaLibraryButton';b.innerHTML='OPEN COMPLETE CANVASSING LIBRARY <span>›</span>';b.onclick=()=>puSetPage('canvassing-library');
    full.parentNode.insertBefore(b,full);
  }
  puMedia=function(){baseMedia();addMediaEntry()};

  function addMoreEntry(){
    if(M.querySelector('[data-more="canvassing-library"]'))return;
    const list=M.querySelector('.puMoreList');if(!list)return;
    const b=document.createElement('button');b.className='puMoreRow';b.dataset.more='canvassing-library';b.innerHTML='<span><b>Canvassing Library</b><small>Complete Tony canvassing library plus supporting Yoho and Grosso material.</small></span><strong>›</strong>';b.onclick=()=>puSetPage('canvassing-library');
    list.insertBefore(b,list.children[1]||null);
  }

  function puCanvassingLibrary(){
    const tony=tonyMedia(),dave=daveMedia(),grosso=grossoCanvassMedia(),model=libraryModel();
    const tonyGroups=tonyOrder.map(name=>({name,items:tony.filter(x=>tonyBucket(x)===name)})).filter(x=>x.items.length);
    const tonySources=trainerSources('Tony Hoty').sort((a,b)=>{const r=x=>/canvassing manual/i.test(x.title||'')?0:/master training manual/i.test(x.title||'')?1:/audio library/i.test(x.title||'')?2:3;return r(a)-r(b)||(a.title||'').localeCompare(b.title||'')});
    M.innerHTML=`<button class="back puBack" id="puBack">← Training</button><h2>Canvassing Library</h2><p class="sub">The complete canvassing reference library, organized so field employees can actually find and use it.</p><div class="puNotice"><b>SOURCE / REFERENCE:</b> Trainer recordings and manuals support learning. Current Paradise-approved lessons, the existing Paradise canvass script, manager direction, and the live municipality Lookup remain the operational authority.</div><section class="card"><div class="row"><div class="lab">TONY HOTY</div><div class="val strong">${model.tonyTotal} indexed recordings</div></div><div class="row"><div class="lab">DAVE YOHO</div><div class="val strong">${model.daveTotal} canvassing / lead-generation media</div></div><div class="row"><div class="lab">GROSSO SUPPORT</div><div class="val strong">${model.grossoSupportTotal} field-skill references</div></div></section><div data-trainer-group="Tony Hoty"><div class="puSection">Tony Hoty — Complete Canvassing Library</div><p class="sub">Every indexed Tony canvassing recording is shown below. Historical product examples remain examples, not current Paradise claims or scripts.</p>${tonyGroups.map(x=>group(x.name,x.items)).join('')}${sourceGroup('Tony Manuals & Source Material',tonySources)}</div><div data-trainer-group="Dave Yoho"><div class="puSection">Dave Yoho — Canvassing & Lead Generation</div><p class="sub">Canvassing, lead-generation, and supporting business-development material.</p>${group('Dave Yoho Media',dave)}${sourceGroup('Dave Yoho Source Material',trainerSources('Dave Yoho'))}</div><div data-trainer-group="Grosso University"><div class="puSection">Grosso University — Supporting Canvassing Skills</div><p class="sub">Tonality, objections, communication, and lead-quality material that supports canvassing. Advanced in-home sales programs stay in Career Path / Full Source Library.</p>${group('Grosso Canvassing Support',grosso)}</div><button id="puAllTrainerSource" class="puMoreButton puMediaLibraryButton">VIEW ALL TRAINER SOURCE MATERIAL <span>›</span></button><div class="puNotice"><b>Role boundary:</b> Advanced sales training does not authorize pricing, financing, contracting, closing, or selling at the door.</div>`;
    document.getElementById('puBack').onclick=()=>puSetPage('home');
    document.getElementById('puAllTrainerSource').onclick=()=>puSetPage('library');
    if(typeof puBindMediaButtons==='function')puBindMediaButtons(M);
  }

  renderTraining=function(){
    if(view!=='training')return;
    if(puPage==='canvassing-library')return puCanvassingLibrary();
    const out=baseRender();if(puPage==='more')addMoreEntry();return out;
  };
  window.PU_CANVASSING_LIBRARY_VERSION='2026.08.16-pu-canvassing-library-v1';
})();
