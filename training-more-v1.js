(()=>{
  const baseHome=puHome;
  const baseRender=renderTraining;
  const managerLessons=()=>window.PU_CONTENT?.managerLessons||[];
  const allLessons=()=>[...(window.PU_CONTENT?.lessons||[]),...managerLessons()];
  const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const words=s=>norm(s).split(' ').filter(Boolean);

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
    let s=0;if(title===query)s+=120;if(title.includes(query))s+=80;if(text.includes(query))s+=35;if(tags.includes(query))s+=30;
    for(const t of terms){if(title.includes(t))s+=18;if(text.includes(t))s+=7;if(tags.includes(t))s+=8}
    s+=item.type==='lesson'?60:item.type==='drill'?40:item.type==='media'?20:0;
    return s;
  }
  function searchIndex(){
    const lessons=allLessons().map(x=>({type:'lesson',id:x.id,title:x.title,text:[x.summary,x.learn,x.practice,x.pass].join(' '),tags:x.stage||'',stage:x.stage}));
    const drills=(window.PU_CONTENT?.drills||[]).map(x=>({type:'drill',id:x.id,title:x.title,text:[x.prompt,x.answer].join(' '),tags:x.category||'',category:x.category}));
    const media=(window.PU_CONTENT?.media||[]).map(x=>({type:'media',id:x.id,title:x.title,text:[x.trainer,x.note].join(' '),tags:(x.topics||[]).join(' '),media:x}));
    const sources=Object.entries(window.PU_CONTENT?.sources||{}).map(([id,x])=>({type:'source',id,title:x.title,text:x.authority||'',tags:'source reference',source:x}));
    return[...lessons,...drills,...media,...sources];
  }
  function resultMarkup(x){
    const label=x.type==='lesson'?'PARADISE LESSON':x.type==='drill'?'PRACTICE':x.type==='media'?'MEDIA':'SOURCE / REFERENCE';
    if(x.type==='source')return`<a class="puSearchResult ${x.type}" href="${esc(x.source.url)}" target="_blank" rel="noopener"><span><small>${label}</small><b>${esc(x.title)}</b></span><strong>↗</strong></a>`;
    return`<button class="puSearchResult ${x.type}" data-result-type="${x.type}" data-result-id="${esc(x.id)}"><span><small>${label}</small><b>${esc(x.title)}</b></span><strong>›</strong></button>`;
  }
  function puSearch(){
    M.innerHTML=`<button class="back puBack" id="puBack">← More</button><h2>Search Training</h2><p class="sub">Current Paradise lessons are ranked before legacy/source material.</p><div class="puSearchBox"><span>⌕</span><input id="puSearchInput" type="search" autocomplete="off" placeholder="Try: not interested, permit, price…"></div><div class="puNotice"><b>Need the rule for a city?</b> Use Lookup. Training search never replaces the live municipality result.</div><div id="puSearchResults" class="puSearchResults"><div class="puEmpty">Type a word or phrase to search lessons, practice, media, and source material.</div></div>`;
    document.getElementById('puBack').onclick=()=>puSetPage('more');
    const input=document.getElementById('puSearchInput'),box=document.getElementById('puSearchResults');
    function draw(){const q=input.value.trim();if(!q){box.innerHTML='<div class="puEmpty">Type a word or phrase to search lessons, practice, media, and source material.</div>';return}const hits=searchIndex().map(x=>({...x,_score:score(x,q)})).filter(x=>x._score>0).sort((a,b)=>b._score-a._score||a.title.localeCompare(b.title)).slice(0,20);box.innerHTML=hits.length?hits.map(resultMarkup).join(''):'<div class="puEmpty">No training result found. Try a shorter term, or use Lookup for a municipality rule.</div>';box.querySelectorAll('[data-result-type]').forEach(b=>b.onclick=()=>{const t=b.dataset.resultType,id=b.dataset.resultId;if(t==='lesson')puSetPage('lesson:'+id);else if(t==='drill')puSetPage('practice');else if(t==='media')puPlayerOpen(id)})}
    input.oninput=draw;setTimeout(()=>input.focus(),20);
  }

  function sourceGroup(title,filter){
    const src=Object.values(window.PU_CONTENT?.sources||{}).filter(filter);
    const media=(window.PU_CONTENT?.media||[]).filter(filter);
    if(!src.length&&!media.length)return'';
    return`<div class="puSection">${esc(title)}</div><section class="card puLibraryGroup">${src.map(x=>`<a class="puLibraryItem" href="${esc(x.url)}" target="_blank" rel="noopener"><span><small>SOURCE / REFERENCE</small><b>${esc(x.title)}</b></span><strong>↗</strong></a>`).join('')}${media.map(x=>`<button class="puLibraryItem" data-media="${esc(x.id)}"><span><small>${x.authority==='HISTORICAL'?'HISTORICAL':'MEDIA / REFERENCE'}</small><b>${esc(x.title)}</b><em>${esc(x.trainer||'')}</em></span><strong>▶</strong></button>`).join('')}</section>`;
  }
  function puLibrary(){
    const isTony=x=>/tony hoty/i.test(String(x.title||x.trainer||''));
    const isDave=x=>/dave yoho/i.test(String(x.title||x.trainer||''));
    const isGrosso=x=>/grosso/i.test(String(x.title||x.trainer||''));
    M.innerHTML=`<button class="back puBack" id="puBack">← More</button><h2>Source Library</h2><p class="sub">Original training is here when you want to go deeper.</p><div class="puNotice"><b>SOURCE / REFERENCE MATERIAL:</b> Paradise-approved curriculum, current company policy, and live municipality instructions control.</div>${sourceGroup('Tony Hoty',isTony)}${sourceGroup('Dave Yoho',isDave)}${sourceGroup('Rick Grosso / Grosso University',isGrosso)}<div class="puSection">Paradise Current Reference</div>${puCurrentRefs()}`;
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
  window.PU_MORE_VERSION='2026.08.16-pu-more-v1';
})();
