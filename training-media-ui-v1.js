(()=>{
  if(typeof puMedia!=='function')return;
  const curated=PU_MEDIA.filter(x=>x.priority!=='SOURCE_LIBRARY');
  window.PU_CURATED_MEDIA_IDS=curated.map(x=>x.id);
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
    M.innerHTML=`<button class="back puBack" id="puBack">← Training</button><h2>Videos & Audio</h2><p class="sub">Short playlists for today’s role, your next role, and the source trainers behind the curriculum.</p><div class="puNotice"><b>Important:</b> Original Tony Hoty, Dave Yoho, and Grosso material is reference training. Learn the useful method and concepts; current Paradise scripts, policies, and municipality instructions control.</div>${playlist('Continue Listening',recent?[recent]:[],'Nothing unfinished yet. Start a media item or save one for later and it will appear here.')}${playlist('Required for You',explicitlyRequired,'No catalog item is separately marked required. Follow Continue Training for the required lesson sequence.')}${playlist('Canvasser Essentials',essentials,'No canvasser-essential media is currently published.')}${playlist('Future Sales Rep',sales,'No curated sales-development media is currently linked to published Sales Apprentice or Sales Rep lessons.')}${playlist('Manager Training',manager,'No curated manager media is currently linked to Manager Academy lessons.')}${playlist('Tony Hoty',tony,'No curated Tony Hoty media is currently published.')}${playlist('Dave Yoho',dave,'No curated Dave Yoho media is currently published.')}${playlist('Rick Grosso / Grosso University',grosso,'No curated Grosso University media is currently published.')}${playlist('Paradise Training',paradise,'No Paradise-approved media file is loaded in the controlled catalog yet. Paradise lessons remain the approved training layer.')}
    <button id="puFullSourceLibrary" class="puMoreButton puMediaLibraryButton">BROWSE FULL SOURCE LIBRARY <span>›</span></button><div class="puNotice"><b>Playback:</b> Drive embeds support in-app viewing plus device-local Complete/Save/Next controls. Exact position resume, custom speed, and exact bookmarks require a controlled stream URL because the Drive iframe does not expose its playback position to Paradise.</div>`;
    document.getElementById('puBack').onclick=()=>puSetPage('home');
    document.getElementById('puFullSourceLibrary').onclick=()=>puSetPage('library');
    if(typeof puBindMediaButtons==='function')puBindMediaButtons(M);
  };
  // Previous acceptance marker retained for compatibility: 2026.08.16-pu-media-ui-v2
  window.PU_MEDIA_UI_VERSION='2026.08.16-pu-media-ui-v3';
})();
