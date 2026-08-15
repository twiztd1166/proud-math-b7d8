let pcmBrowseCounty='';
function pcmCounties(){let m=new Map();for(const r of db.records){let k=r.county||'Other';if(!m.has(k))m.set(k,[]);m.get(k).push(r)}return [...m.entries()].sort((a,b)=>a[0].localeCompare(b[0]))}
function browse(){
  if(pcmBrowseCounty)return browseCounty(pcmBrowseCounty);
  let groups=pcmCounties();
  M.innerHTML=`<div class="head"><div><h2>Browse Areas</h2><p>Choose a county, then a city or service area.</p></div><button class="back" id="browseBack">Search</button></div><div class="countyGrid">${groups.map(([c,a])=>{let no=a.filter(r=>r.release==='NO-GO').length;return`<button class="countyBtn" data-county="${esc(c)}"><b>${esc(c)} County</b><small>${a.length} areas${no?` · ${no} NO-GO`:''}</small></button>`}).join('')}</div><div class="notice"><b>Check the exact address.</b> Mailing addresses and service-area names can cross city or county lines. Confirm the actual jurisdiction before canvassing.</div>`;
  document.getElementById('browseBack').onclick=()=>setView('lookup');
  document.querySelectorAll('[data-county]').forEach(b=>b.onclick=()=>{pcmBrowseCounty=b.dataset.county;render();scrollTo(0,0)});
}
function browseCounty(c){
  let a=db.records.filter(r=>(r.county||'Other')===c).sort((x,y)=>x.name.localeCompare(y.name));
  M.innerHTML=`<div class="head"><div><h2>${esc(c)} County</h2><p>${a.length} areas</p></div><button class="back" id="allCounties">Counties</button></div><div class="search browseSearch"><span>⌕</span><input id="areaFilter" type="search" autocomplete="off" placeholder="Filter these areas…"><button id="areaClear" aria-label="Clear filter">×</button></div><div id="areaList" class="areaList"></div>`;
  const list=document.getElementById('areaList'),inp=document.getElementById('areaFilter');
  function draw(){let z=norm(inp.value);let rows=!z?a:a.filter(r=>norm(r.name).includes(z)||norm(r.jurisdiction).includes(z));list.innerHTML=rows.length?rows.map(r=>`<button class="areaBtn" data-city="${esc(r.name)}"><span class="ot"><b>${esc(r.name)}</b><small>${esc(r.jurisdiction)}</small></span>${pill(r)}</button>`).join(''):`<div class="notice">No matching areas in ${esc(c)} County.</div>`;list.querySelectorAll('[data-city]').forEach(b=>b.onclick=()=>{pcmBrowseCounty='';choose(db.records.find(r=>r.name===b.dataset.city))})}
  inp.oninput=draw;document.getElementById('areaClear').onclick=()=>{inp.value='';draw();inp.focus()};document.getElementById('allCounties').onclick=()=>{pcmBrowseCounty='';render();scrollTo(0,0)};draw();setTimeout(()=>inp.focus(),30);
}
function browseLaunch(){pcmBrowseCounty='';setView('browse')}
