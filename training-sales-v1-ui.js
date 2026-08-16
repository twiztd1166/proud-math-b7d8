(()=>{
  if(!window.PU_CONTENT?.salesPolicyGate)return;
  const baseStage=puStage;
  puStage=function(stage){
    if(stage!=='sales-rep')return baseStage(stage);
    const s=PU_PATH.find(x=>x.id===stage),lessons=PU_LESSONS.filter(x=>x.stage===stage),gate=window.PU_CONTENT.salesPolicyGate;
    M.innerHTML=`<button class="back puBack" id="puBack">← Career Path</button><h2>${esc(s?.name||'Sales Rep Academy')}</h2><p class="sub">Core in-home sales method. The current build stops before policy-sensitive price, financing, contract, and closing procedures.</p><div class="puNotice"><b>PART 1 READY:</b> Preparation through Product Presentation. These lessons teach the process and current Paradise accuracy boundaries.</div><div class="puSection">Core sales lessons</div><div class="puList">${lessons.map(x=>`<button data-lesson="${esc(x.id)}"><b>${puLessonDone(x.id)?'✓ ':''}${esc(x.title)}</b><small>${esc(x.minutes)} min · ${esc(x.summary)}</small></button>`).join('')}</div><div class="puNotice"><b>CURRENT POLICY REQUIRED:</b> ${esc(gate.message)}</div>`;
    document.getElementById('puBack').onclick=()=>puSetPage('career');
    document.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>puSetPage('lesson:'+b.dataset.lesson));
  };
})();
