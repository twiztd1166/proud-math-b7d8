(()=>{
  if(typeof puMedia!=='function')return;
  const catalog=PU_MEDIA.filter(x=>x.priority!=='SOURCE_LIBRARY');
  const rights=x=>typeof puMediaRightsStatus==='function'?puMediaRightsStatus(x):{playAllowed:false,label:'UNAVAILABLE'};
  const curated=catalog.filter(x=>rights(x).playAllowed);
  const blocked=catalog.filter(x=>!rights(x).playAllowed);
  window.PU_CURATED_MEDIA_IDS=curated.map(x=>x.id);
  window.PU_RIGHTS_REVIEW_MEDIA_IDS=blocked.map(x=>x.id);
  const unique=items=>{const seen=new Set();return items.filter(x=>x&&!seen.has(x.id)&&seen.add(x.id))};
  const mediaFromLessons=lessons=>unique((lessons||[]).flatMap(x=>(x.media||[]).map(id=>curated.find(m=>m.id===id)).filter(Boolean)));
  const trainerMatches=(m,re)=>re.test(`${m.trainer||''} ${m.title||''}`);
  const playlist=(title,items,empty='')=>`<div class="puSection">${esc(title)}</div><section class="card puMediaPlaylist" data-playlist="${esc(title)}">${items.length?items.map(puMediaCard).join(''):`<div class="puEmpty">${esc(empty)}</div>`}</section>`;
  puMedia=function(){
    const lastId=localStorage.puLastMedia||'',last=curated.find(x=>x.id===lastId),statusFor=x=>typeof puMediaProgressStatus==='function'?puMediaProgressStatus(x.id):{},lastStatus=last?statusFor(last):null;
    const recent=last&&!lastStatus?.complete?last:curated.find(x=>{const s=statusFor(x);return s.saved&&!s.complete})||null;
    const explicitlyRequired=curated.filter(x=>x.required===true||x.priority==='REQUIRED'||x.requirement==='REQUIRED');
    const essentials=curated.filter(x=>x.priority==='ESSENTIAL').slice(0,4);
    const sales=mediaFromLessons(PU_LESSONS.filter(x=>x.stage==='sales-apprentice'||x.stage==='sales-rep')).slice(0,3);
    const manager=mediaFromLessons(window.PU_CONTENT?.managerLessons||[]).slice(0,3);
    const tony=curated.filter(x=>trainerMatches(x,/tony hoty/i)).slice(0,3);
    const dave=curated.filter(x=>trainerMatches(x,/dave yoho/i)).slice(0,3);
    const grosso=curated.filter(x=>trainerMatches(x,/grosso/i)).slice(0,3);
    const paradise=curated.filter(x=>x.authority==='PARADISE_APPROVED').slice(0,3);
    M.innerHTML=`<button class="back puBack" id="puBack">← Training</button><h2>Videos & Audio</h2><p class="sub">Curated internal training media. Paradise-approved lessons remain the operational authority.</p><div class="puNotice"><b>INTERNAL TRAINING MEDIA:</b> Tony Hoty, Dave Yoho, and Grosso recordings are available for Paradise employee training. Keep REFERENCE and HISTORICAL labels intact; these recordings do not override current Paradise policy or the live municipality Lookup.</div>${playlist('Continue Listening',recent?[recent]:[],'Nothing unfinished yet.')}${playlist('Required for You',explicitlyRequired,'No media item is separately marked required. Follow Continue Training for the required lesson sequence.')}${playlist('Canvasser Essentials',essentials,'No canvasser-essential media is currently published.')}${playlist('Future Sales Rep',sales,'No sales-development media is currently published.')}${playlist('Manager Training',manager,'No manager media is currently published.')}${playlist('Tony Hoty',tony,'No Tony Hoty media is currently published.')}${playlist('Dave Yoho',dave,'No Dave Yoho media is currently published.')}${playlist('Rick Grosso / Grosso University',grosso,'No Grosso University media is currently published.')}${playlist('Paradise Training',paradise,'No Paradise-owned media file is loaded yet; Paradise lessons remain the approved training layer.')}${blocked.length?playlist('Unavailable Media',blocked,''):''}
    <button id="puFullSourceLibrary" class="puMoreButton puMediaLibraryButton">BROWSE FULL SOURCE LIBRARY <span>›</span></button><div class="puNotice"><b>Authority control:</b> Trainer media is for learning and reference. Current Paradise-approved lessons, manager direction, and the live municipality result control operational behavior.</div>`;
    document.getElementById('puBack').onclick=()=>puSetPage('home');
    document.getElementById('puFullSourceLibrary').onclick=()=>puSetPage('library');
    if(typeof puBindMediaButtons==='function')puBindMediaButtons(M);
  };
  // Previous acceptance markers retained for compatibility: 2026.08.16-pu-media-ui-v2 / v3 / v4
  window.PU_MEDIA_UI_VERSION='2026.08.16-pu-media-ui-v5';
})();