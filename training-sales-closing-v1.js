(()=>{
  if(typeof puStage!=='function'||!window.PU_CONTENT?.salesPolicyGate)return;
  const control=Object.freeze({
    status:'PARTIAL_SOURCE_CLOSURE',
    asOf:'2026-08-16',
    sources:Object.freeze([
      Object.freeze({id:'sales-rep-policy-2026',title:'Paradise Exteriors — Final 2026 Sales Representative Policies & Compensation Plan',authority:'PARADISE_APPROVED',url:window.PU_CONTENT.sources?.paradiseSalesPolicy2026?.url||'https://docs.google.com/document/d/138nsdiqs3XeSmq4PXlnGQNHFnDp2EJSe33ldrFu3TNQ/edit?usp=drivesdk'}),
      Object.freeze({id:'sales-manager-plan-2026',title:'Paradise Exteriors LLC Sales Manager Policies, Responsibilities & Compensation Plan',authority:'PARADISE_APPROVED',url:'https://docs.google.com/document/d/1e54fRhQv6vo8qRb6AP34bOsPKAms7EqR0hbZ34kSqJk/edit?usp=drivesdk'}),
      Object.freeze({id:'sales-meeting-2026-03-16',title:'Paradise Exteriors Sales Weekly Meeting — 2026-03-16',authority:'REFERENCE',url:'https://docs.google.com/document/d/11r4E0PfCSg_990mNW8ZPOwF8xT-bCZcYs7GCNjkJeB0/edit?usp=drivesdk'})
    ]),
    rules:Object.freeze([
      'PROCESS ENTRY: Current March 2026 Paradise training moves into pre-close only after the presentation and customer questions/commitments are addressed. Do not skip discovery, inspection, current company/category education, or product accuracy just to reach price faster.',
      'CURRENT SEQUENCE EVIDENCE: March 16 training uses pre-close → current base / 30-day price → close attempt → current approved incentive path → financing comparison when appropriate → close. This is current training evidence, not authority to memorize an old price, discount, letter, financing term, or incentive. Live Paradise tools and manager controls govern anything dynamic.',
      'TO / MANAGER SUPPORT: Current Sales Rep policy requires full TO compliance. Current Sales Manager policy assigns managers daily field support, inbound field-rep calls, NRP and situational drops, cancel saves, overflow appointments, rehash situations, pricing discipline, and process/compliance enforcement. Use the current manager path when support or approval is required; do not invent a substitute TO.',
      'OUTCOME CONTROL: Current Sales Rep policy requires the appointment result/disposition before leaving the driveway. A close attempt, manager support call, or customer delay does not remove that requirement.',
      'NO INVENTED AUTHORITY: The exact TO trigger, script, routing, qualification criteria, NRP decision tree, and manager authority matrix were not recovered as current controlled artifacts. Do not infer them from historical trainer material, generic sales methods, or a meeting role-play.'
    ]),
    unresolved:Object.freeze([
      'Exact current TO trigger points and when a TO is mandatory versus situational',
      'Exact TO call routing, required participants, contact method, and fallback path',
      'Approved TO / manager-assist script and prohibited wording',
      'Current qualification criteria and required documentation before or during close',
      'Definitions and decision trees for NRP, situational drops, rehash, and cancel-save use',
      'Exact manager approval authority at each pricing, discount, financing, and exception stage',
      'Closing-stage documentation checklist and required CRM / POS / DNS entries'
    ])
  });
  window.PU_SALES_CLOSING_SUPPORT_CONTROL=control;
  const previousStage=puStage;
  puStage=function(stage){
    const out=previousStage(stage);
    if(stage!=='sales-rep')return out;
    const hold=[...M.querySelectorAll('.puNotice')].find(x=>/CURRENT POLICY REQUIRED\s*[—-]\s*PROCEDURE GATE\s*[—-]\s*HOLD/i.test(x.textContent||''));
    if(!hold||M.querySelector('[data-pu-closing-support]'))return out;
    const wrap=document.createElement('div');
    wrap.dataset.puClosingSupport='1';
    const rows=control.rules.map(text=>{const p=text.split(':');const label=p.shift();return`<div class="row"><div class="lab">${esc(label)}</div><div class="val">${esc(p.join(':').trim())}</div></div>`}).join('');
    const sources=control.sources.map(x=>`<a class="puMoreRow" href="${esc(x.url)}" target="_blank" rel="noopener"><span><b>${esc(x.title)}</b><small>${esc(x.authority)} · current 2026 control/source evidence</small></span><strong>↗</strong></a>`).join('');
    const blocked=control.unresolved.map(x=>`<div class="puMoreRow"><span><b>${esc(x)}</b><small>Still requires a verified current Paradise-controlled procedure before operational training publishes.</small></span></div>`).join('');
    wrap.innerHTML=`<div class="puSection">Closing & manager-support control path</div><section class="card"><div class="puNotice"><b>PARTIAL SOURCE CLOSURE:</b> Current Paradise sources now establish the high-level close sequence, manager-support ownership, TO-compliance requirement, and appointment-disposition boundary. The exact TO and qualification procedure is still gated.</div>${rows}<details class="puSources"><summary>Current controlled / internal evidence</summary><div class="puSourceList">${sources}</div></details><details class="puSources"><summary>Closing / TO artifacts still missing</summary><div class="puSourceList">${blocked}</div></details></section>`;
    hold.insertAdjacentElement('beforebegin',wrap);
    return out;
  };
  window.PU_SALES_CLOSING_SUPPORT_VERSION='2026.08.16-pu-sales-closing-v1';
})();
