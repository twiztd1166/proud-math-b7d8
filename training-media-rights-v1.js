(()=>{
  const auditedTrainers=/tony hoty|dave yoho|grosso/i;
  const curated=()=>((window.PU_CONTENT?.media)||[]).filter(x=>x.priority!=='SOURCE_LIBRARY');
  const thirdPartyAsset=x=>!!x&&x.authority!=='PARADISE_APPROVED'&&auditedTrainers.test(`${x.trainer||''} ${x.title||''}`);
  function rights(x){
    if(!x)return{status:'MISSING',playAllowed:false,sourceAccessAllowed:false,label:'RIGHTS REVIEW'};
    if(x.rightsStatus==='APPROVED_INTERNAL_HOSTING')return{status:'APPROVED_INTERNAL_HOSTING',playAllowed:true,sourceAccessAllowed:true,label:'RIGHTS CLEARED',basis:x.rightsBasis||'Explicit internal-hosting approval recorded in controlled metadata.'};
    if(x.rightsStatus==='EXTERNAL_LINK_ONLY'&&x.externalPublicUrl)return{status:'EXTERNAL_LINK_ONLY',playAllowed:false,sourceAccessAllowed:true,label:'EXTERNAL SOURCE ONLY',basis:x.rightsBasis||'Use the rights-holder-controlled public source; do not host a Paradise copy.'};
    if(thirdPartyAsset(x))return{status:'RIGHTS_UNVERIFIED',playAllowed:false,sourceAccessAllowed:false,label:'RIGHTS REVIEW',basis:'No explicit Paradise internal reproduction / re-hosting grant is recorded for this third-party training asset.'};
    if(x.authority==='PARADISE_APPROVED'&&x.rightsStatus==='PARADISE_OWNED')return{status:'PARADISE_OWNED',playAllowed:true,sourceAccessAllowed:true,label:'PARADISE OWNED',basis:x.rightsBasis||'Paradise-owned media.'};
    return{status:'RIGHTS_UNVERIFIED',playAllowed:false,sourceAccessAllowed:false,label:'RIGHTS REVIEW',basis:'Playback stays blocked until a controlled rights basis is recorded.'};
  }
  window.puTrainingAssetRightsStatus=rights;
  window.puMediaRightsStatus=rights;
  const reviewed=curated();
  window.PU_MEDIA_RIGHTS_CONTROL=Object.freeze({
    status:'RELEASE_BLOCKED_PENDING_RIGHTS',
    asOf:'2026-08-16',
    curatedReviewedCount:reviewed.length,
    curatedPlayableCount:reviewed.filter(x=>rights(x).playAllowed).length,
    curatedRightsHoldCount:reviewed.filter(x=>!rights(x).playAllowed).length,
    rule:'Default deny for internal playback/re-hosting. A training asset becomes playable only when controlled metadata records APPROVED_INTERNAL_HOSTING or PARADISE_OWNED. EXTERNAL_LINK_ONLY may point only to a rights-holder-controlled public source.',
    evidence:Object.freeze([
      'Tony Hoty / Sales-Lead Consultants material recovered in the controlled source set includes an “All Rights Reserved” copyright notice. Direct delivery of manuals to Paradise supports access to those delivered materials, but does not by itself establish a right to re-host separate audio/video recordings in Paradise University.',
      'Current Grosso University vendor emails carry an “All rights reserved” copyright notice. Program participation, invoices, attendance, and access do not by themselves establish a Paradise redistribution or internal re-hosting license for copied recordings.',
      'The Dave Yoho source trail shows Paradise use of Dave Yoho Associates services, reports, webinars, events, and internally retained training references, but the rights audit did not recover an explicit grant permitting Paradise to re-host the curated Dave recording inside its own app.',
      'Across the three trainer families, the audit did not recover an explicit reproduction / redistribution / internal-app-hosting grant for the copied curated recordings. The release control therefore blocks playback rather than treating possession in Drive as permission.'
    ]),
    resolution:Object.freeze([
      'Obtain written permission or an agreement that expressly covers Paradise internal employee-app hosting/reproduction of the exact asset.',
      'Replace the copied asset with Paradise-owned training media and record PARADISE_OWNED rights metadata.',
      'Where the rights holder provides a stable public source and permits ordinary linking, use EXTERNAL_LINK_ONLY metadata and link to that rights-holder-controlled source instead of hosting a Paradise copy.'
    ])
  });
  if(typeof puMediaCard==='function'){
    const baseCard=puMediaCard;
    puMediaCard=function(m){
      const r=rights(m);if(r.playAllowed)return baseCard(m);
      const authority=m.authority==='HISTORICAL'?'HISTORICAL':m.authority;
      return`<div class="puMediaCard puRightsHold" data-rights-hold="${esc(m.id)}"><div class="puMediaTop"><span class="puBadge ${puAuthorityClass(m.authority)}">${esc(authority)}</span><span class="puType">${m.type==='audio'?'AUDIO':'VIDEO'}</span></div><b>${esc(m.title)}</b><small>${esc(m.trainer||'')} · ${esc(m.note||'')}</small><div class="puPlayRow"><button class="puPlay" disabled>RIGHTS REVIEW</button><span class="puSourceOpen">SOURCE RECORD ONLY</span></div><small>${esc(r.basis)}</small></div>`;
    };
    puLessonMedia=function(ids=[]){let m=puMediaByIds(ids);if(!m.length)return'<p>No media is required for this lesson.</p>';return`<div class="puLessonMedia">${m.map(puMediaCard).join('')}</div>`};
    puSourceLinks=function(ids=[]){let s=puSourceByIds(ids);if(!s.length)return'';return`<details class="puSources"><summary>Go deeper / source material</summary><div class="puSourceList">${s.map(x=>{const r=rights(x);return r.sourceAccessAllowed?`<a href="${esc(x.externalPublicUrl||x.url)}" target="_blank" rel="noopener"><span><b>${esc(x.title)}</b><small>${esc(x.authority)} · ${esc(r.label)}</small></span><b>↗</b></a>`:`<div class="puMoreRow puRightsHold"><span><b>${esc(x.title)}</b><small>${esc(x.authority)} · RIGHTS REVIEW · source lineage retained; copied-file access withheld pending rights verification.</small></span><strong>RECORD</strong></div>`}).join('')}</div></details>`};
  }
  window.PU_MEDIA_RIGHTS_VERSION='2026.08.16-pu-media-rights-v1';
})();