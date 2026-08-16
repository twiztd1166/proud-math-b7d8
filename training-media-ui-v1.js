(()=>{
  if(typeof puMedia!=='function')return;
  const curated=PU_MEDIA.filter(x=>x.priority!=='SOURCE_LIBRARY');
  window.PU_CURATED_MEDIA_IDS=curated.map(x=>x.id);
  puMedia=function(){
    const lastId=localStorage.puLastMedia||'',last=curated.find(x=>x.id===lastId),lastStatus=last&&typeof puMediaProgressStatus==='function'?puMediaProgressStatus(last.id):null,recent=last&&!lastStatus?.complete?last:null;
    const essentials=curated.filter(x=>x.priority==='ESSENTIAL'&&x.id!==recent?.id);
    const deeper=curated.filter(x=>x.priority!=='ESSENTIAL'&&x.id!==recent?.id);
    M.innerHTML=`<button class="back puBack" id="puBack">← Training</button><h2>Videos & Audio</h2><p class="sub">A short curated library for the skills Paradise actually teaches.</p><div class="puNotice"><b>Important:</b> Original Tony Hoty, Dave Yoho, and Grosso material is reference training. Learn the useful method and concepts; current Paradise scripts, policies, and municipality instructions control.</div>${recent?`<div class="puSection">Continue Listening</div><section class="card">${puMediaCard(recent)}</section>`:''}<div class="puSection">Canvasser essentials</div><section class="card">${essentials.map(puMediaCard).join('')}</section>${deeper.length?`<div class="puSection">Optional / go deeper</div><section class="card">${deeper.map(puMediaCard).join('')}</section>`:''}<button id="puFullSourceLibrary" class="puMoreButton puMediaLibraryButton">BROWSE FULL SOURCE LIBRARY <span>›</span></button><div class="puNotice"><b>Playback:</b> Drive embeds support in-app viewing plus device-local Complete/Save/Next controls. Exact position resume, custom speed, and exact bookmarks require a controlled stream URL because the Drive iframe does not expose its playback position to Paradise.</div>`;
    document.getElementById('puBack').onclick=()=>puSetPage('home');
    document.getElementById('puFullSourceLibrary').onclick=()=>puSetPage('library');
    if(typeof puBindMediaButtons==='function')puBindMediaButtons(M);
  };
  window.PU_MEDIA_UI_VERSION='2026.08.16-pu-media-ui-v2';
})();
