(()=>{
  if(typeof renderTraining!=='function')return;
  const baseRender=renderTraining;
  const sources=()=>Object.values(window.PU_CONTENT?.sources||{});
  const sourceForHref=href=>sources().find(x=>x.url===href||x.externalPublicUrl===href);
  const rightsFor=x=>typeof puTrainingAssetRightsStatus==='function'?puTrainingAssetRightsStatus(x):{sourceAccessAllowed:false,label:'RIGHTS REVIEW'};

  function blockedRow(node,source){
    const replacement=document.createElement('div');
    replacement.className=`${node.className||''} puRightsHold`.trim();
    replacement.dataset.rightsHold='1';
    const label=node.querySelector('small')?.textContent||'SOURCE / REFERENCE';
    replacement.innerHTML=`<span><small>${esc(label)} · RIGHTS REVIEW</small><b>${esc(source?.title||node.textContent||'Training source')}</b></span><strong>RECORD</strong>`;
    node.replaceWith(replacement);
  }

  function gateNode(node){
    const href=node.getAttribute('href')||'';if(!href)return;
    const source=sourceForHref(href);if(!source)return;
    const rights=rightsFor(source);
    if(rights.sourceAccessAllowed){
      if(source.externalPublicUrl)node.setAttribute('href',source.externalPublicUrl);
      const small=node.querySelector('small');if(small&&!/EXTERNAL SOURCE ONLY|RIGHTS CLEARED|PARADISE OWNED/i.test(small.textContent||''))small.textContent=`${small.textContent||'SOURCE / REFERENCE'} · ${rights.label||'SOURCE'}`;
      return;
    }
    blockedRow(node,source);
  }

  function apply(){
    document.querySelectorAll('a.puLibraryItem[href], a.puSearchResult.source[href]').forEach(gateNode);
  }

  renderTraining=function(){
    const out=baseRender();
    apply();
    const input=document.getElementById('puSearchInput');if(input&&!input.dataset.rightsGate){input.dataset.rightsGate='1';input.addEventListener('input',()=>setTimeout(apply,0))}
    return out;
  };
  window.PU_MORE_RIGHTS_GATE_VERSION='2026.08.16-pu-more-rights-v1';
})();
