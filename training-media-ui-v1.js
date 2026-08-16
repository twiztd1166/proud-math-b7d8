(()=>{
  if(typeof puMedia!=='function')return;
  puMedia=function(){
    const essentials=PU_MEDIA.filter(x=>x.priority==='ESSENTIAL');
    const deeper=PU_MEDIA.filter(x=>x.priority!=='ESSENTIAL'&&x.priority!=='SOURCE_LIBRARY');
    M.innerHTML=`<button class="back puBack" id="puBack">← Training</button><h2>Videos & Audio</h2><p class="sub">A short curated library for the skills Paradise actually teaches.</p><div class="puNotice"><b>Important:</b> Original Tony Hoty, Dave Yoho, and Grosso material is reference training. Learn the useful method and concepts; current Paradise scripts, policies, and municipality instructions control.</div><div class="puSection">Canvasser essentials</div><section class="card">${essentials.map(puMediaCard).join('')}</section>${deeper.length?`<div class="puSection">Optional / go deeper</div><section class="card">${deeper.map(puMediaCard).join('')}</section>`:''}<button id="puFullSourceLibrary" class="puMoreButton puMediaLibraryButton">BROWSE FULL SOURCE LIBRARY <span>›</span></button><div class="puNotice"><b>Playback:</b> Drive-only sources use the Drive player today. Controlled stream URLs can use Paradise resume, speed, seek, and lock-screen controls without changing the training catalog.</div>`;
    document.getElementById('puBack').onclick=()=>puSetPage('home');
    document.getElementById('puFullSourceLibrary').onclick=()=>puSetPage('library');
    if(typeof puBindMediaButtons==='function')puBindMediaButtons(M);
  };
  window.PU_MEDIA_UI_VERSION='2026.08.16-pu-media-ui-v1';
})();
