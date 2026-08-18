(()=>{
  const auditedTrainers=/tony hoty|dave yoho|grosso/i;
  const curated=()=>((window.PU_CONTENT?.media)||[]).filter(x=>x.priority!=='SOURCE_LIBRARY');
  const thirdPartyAsset=x=>!!x&&x.authority!=='PARADISE_APPROVED'&&auditedTrainers.test(`${x.trainer||''} ${x.title||''}`);
  function rights(x){
    if(!x)return{status:'MISSING',playAllowed:false,sourceAccessAllowed:false,label:'UNAVAILABLE'};
    if(x.authority==='PARADISE_APPROVED'&&x.rightsStatus==='PARADISE_OWNED')return{status:'PARADISE_OWNED',playAllowed:true,sourceAccessAllowed:true,label:'PARADISE OWNED',basis:x.rightsBasis||'Paradise-owned media.'};
    if(x.rightsStatus==='APPROVED_INTERNAL_HOSTING')return{status:'APPROVED_INTERNAL_HOSTING',playAllowed:true,sourceAccessAllowed:true,label:'INTERNAL USE',basis:x.rightsBasis||'Internal training use recorded in controlled metadata.'};
    if(x.rightsStatus==='EXTERNAL_LINK_ONLY'&&x.externalPublicUrl)return{status:'EXTERNAL_LINK_ONLY',playAllowed:false,sourceAccessAllowed:true,label:'EXTERNAL SOURCE',basis:x.rightsBasis||'Open the source at the external publisher.'};
    if(thirdPartyAsset(x))return{status:'INTERNAL_TRAINING_USE',playAllowed:true,sourceAccessAllowed:true,label:'INTERNAL TRAINING',basis:'Paradise University is configured for internal employee training use; the copied/source file is available inside the controlled internal-training workflow.'};
    return{status:'INTERNAL_REFERENCE_USE',playAllowed:!!(x.url||x.streamUrl),sourceAccessAllowed:!!(x.url||x.externalPublicUrl),label:'INTERNAL REFERENCE',basis:'Internal training/reference use in Paradise University.'};
  }
  window.puTrainingAssetRightsStatus=rights;
  window.puMediaRightsStatus=rights;
  const reviewed=curated();
  window.PU_MEDIA_RIGHTS_CONTROL=Object.freeze({
    status:'INTERNAL_USE_NON_BLOCKING',
    asOf:'2026-08-16',
    curatedReviewedCount:reviewed.length,
    curatedPlayableCount:reviewed.filter(x=>rights(x).playAllowed).length,
    curatedRightsHoldCount:reviewed.filter(x=>!rights(x).playAllowed).length,
    rule:'Paradise University is an internal employee-training app. Current curated Tony Hoty, Dave Yoho, and Grosso assets are treated as internal-training content and are not a software release blocker. Keep them out of public distribution and preserve source/authority labeling.',
    note:'This is a project operating choice for internal use, not a legal opinion about copyright or contract rights.'
  });
  if(typeof puMediaCard==='function'){
    const baseCard=puMediaCard;
    puMediaCard=function(m){
      const r=rights(m);if(r.playAllowed)return baseCard(m);
      const authority=m.authority==='HISTORICAL'?'HISTORICAL':m.authority;
      return`<div class="puMediaCard puRightsHold" data-rights-hold="${esc(m.id)}"><div class="puMediaTop"><span class="puBadge ${puAuthorityClass(m.authority)}">${esc(authority)}</span><span class="puType">${m.type==='audio'?'AUDIO':'VIDEO'}</span></div><b>${esc(m.title)}</b><small>${esc(m.trainer||'')} · ${esc(m.note||'')}</small><div class="puPlayRow"><button class="puPlay" disabled>UNAVAILABLE</button><span class="puSourceOpen">SOURCE RECORD</span></div><small>${esc(r.basis)}</small></div>`;
    };
    puLessonMedia=function(ids=[]){let m=puMediaByIds(ids);if(!m.length)return'<p>No media is required for this lesson.</p>';return`<div class="puLessonMedia">${m.map(puMediaCard).join('')}</div>`};
    puSourceLinks=function(ids=[]){let s=puSourceByIds(ids);if(!s.length)return'';return`<details class="puSources"><summary>Go deeper / source material</summary><div class="puSourceList">${s.map(x=>{const r=rights(x);return r.sourceAccessAllowed?`<a href="${esc(x.externalPublicUrl||x.url)}" target="_blank" rel="noopener"><span><b>${esc(x.title)}</b><small>${esc(x.authority)} · ${esc(r.label)}</small></span><b>↗</b></a>`:`<div class="puMoreRow"><span><b>${esc(x.title)}</b><small>${esc(x.authority)} · SOURCE RECORD</small></span><strong>RECORD</strong></div>`}).join('')}</div></details>`};
  }
  window.PU_MEDIA_RIGHTS_VERSION='2026.08.16-pu-media-internal-v2';
})();