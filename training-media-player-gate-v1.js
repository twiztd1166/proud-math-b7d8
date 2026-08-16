(()=>{
  if(typeof puPlayerOpen!=='function'||typeof puBindMediaButtons!=='function')return;
  const baseOpen=puPlayerOpen;
  const rightsFor=id=>{const m=(window.PU_CONTENT?.media||[]).find(x=>x.id===id);const r=typeof puMediaRightsStatus==='function'?puMediaRightsStatus(m):{playAllowed:false,label:'RIGHTS REVIEW',basis:'Playback rights are not verified.'};return{m,r}};
  puPlayerOpen=function(id){
    const {m,r}=rightsFor(id);if(!m)return;
    if(r.playAllowed)return baseOpen(id);
    const root=puPlayerRoot();puPlayerMediaId='';root.className='puPlayerRoot';
    root.innerHTML=`<section class="puPlayerPanel" role="dialog" aria-label="Media rights hold"><div class="puPlayerHead"><div class="puPlayerTitle"><small>${esc(m.trainer||'Paradise University')} · ${m.type==='video'?'VIDEO':'AUDIO'}</small><b>${esc(m.title)}</b><span class="puPlayerAuthority historical">RIGHTS REVIEW</span></div><button id="puPlayerClose" class="puPlayerIcon" aria-label="Close player">×</button></div><div class="puPlayerBody"><div class="puNotice"><b>PLAYBACK BLOCKED:</b> Paradise University has not verified an internal reproduction / re-hosting right for this copied training asset. The source record remains in the curriculum audit trail, but the copied file will not open from the employee app.</div><div class="puPlayerNote"><b>RIGHTS CONTROL:</b> ${esc(r.basis||'Playback remains blocked pending rights verification.')}</div><div class="puPlayerActions"><button id="puPlayerClose2">CLOSE</button></div></div></section>`;
    root.querySelector('#puPlayerClose').onclick=()=>puPlayerClose();root.querySelector('#puPlayerClose2').onclick=()=>puPlayerClose();
  };
  puBindMediaButtons=function(scope=document){
    scope.querySelectorAll('[data-media]').forEach(b=>{
      const {m,r}=rightsFor(b.dataset.media);
      if(!m||!r.playAllowed){b.onclick=null;b.disabled=true;b.dataset.rightsHold='1';b.setAttribute('aria-label',`${m?.title||'Training media'} — rights review`);const strong=b.querySelector('strong');if(strong)strong.textContent='RIGHTS';const small=b.querySelector('small');if(small&&!/rights review/i.test(small.textContent||''))small.textContent=`${small.textContent||''} · RIGHTS REVIEW`;return}
      b.disabled=false;b.onclick=()=>puPlayerOpen(b.dataset.media);
    })
  };
  window.puPlayerOpen=puPlayerOpen;
  window.PU_MEDIA_PLAYER_RIGHTS_GATE_VERSION='2026.08.16-pu-media-player-rights-v1';
})();