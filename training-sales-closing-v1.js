(()=>{
  if(typeof puStage!=='function'||!window.PU_CONTENT?.salesPolicyGate)return;
  const control=Object.freeze({
    status:'PARTIAL_SOURCE_CLOSURE',
    asOf:'2026-08-16',
    toSourceStatus:'CURRENT_SOURCE_CLOSED',
    sources:Object.freeze([
      Object.freeze({id:'sales-rep-policy-2026',title:'Paradise Exteriors — Final 2026 Sales Representative Policies & Compensation Plan',authority:'PARADISE_APPROVED',url:window.PU_CONTENT.sources?.paradiseSalesPolicy2026?.url||'https://docs.google.com/document/d/138nsdiqs3XeSmq4PXlnGQNHFnDp2EJSe33ldrFu3TNQ/edit?usp=drivesdk'}),
      Object.freeze({id:'sales-manager-plan-2026',title:'Paradise Exteriors LLC Sales Manager Policies, Responsibilities & Compensation Plan',authority:'PARADISE_APPROVED',url:'https://docs.google.com/document/d/1e54fRhQv6vo8qRb6AP34bOsPKAms7EqR0hbZ34kSqJk/edit?usp=drivesdk'}),
      Object.freeze({id:'current-to-script-2026-02-16',title:'Paradise Exteriors — Current TO Script',authority:'PARADISE_APPROVED',currentness:'Management-issued 2026-02-16 as “Current TO Script (use this every appointment).”',url:'https://docs.google.com/document/d/1NQn3qyjIRok3f9mpPLXd5HA_RYOHhWrdJz_h5I5sKG0/edit?usp=sharing'}),
      Object.freeze({id:'commitments-worksheet-2026-02-16',title:'Paradise Exteriors — Commitments Blank / Test Worksheet',authority:'PARADISE_APPROVED',currentness:'Management-issued 2026-02-16 for immediate scoring/use; document modified 2026-02-16.',url:'https://docs.google.com/document/d/10zxa9PuNfMo9LGgzDRK2enA93E6mB8tjuLboWwBuKws/edit?usp=drive_link'}),
      Object.freeze({id:'sales-meeting-2026-03-16',title:'Paradise Exteriors Sales Weekly Meeting — 2026-03-16',authority:'REFERENCE',url:'https://docs.google.com/document/d/11r4E0PfCSg_990mNW8ZPOwF8xT-bCZcYs7GCNjkJeB0/edit?usp=drivesdk'})
    ]),
    rules:Object.freeze([
      'PROCESS ENTRY: Enter the close only after the presentation, customer questions, discovery/inspection, and required commitments have been handled. Do not skip the earlier sales process just to reach price faster.',
      'TO REQUIRED EVERY APPOINTMENT: Paradise management directed the team on 2026-02-16 to run a proper TO every time and identified the linked TO document as the “Current TO Script (use this every appointment).” Full TO compliance remains a Sales Rep policy requirement.',
      'TO INPUTS / BRANCHES: Before the TO, have the information the current script requires, including project/product summary, customer commitments, price/promotion posture, and—when relevant—cash versus finance, comfortable deposit, monthly-payment target, target price, and decision/affordability position. The current script branches from three states: promotion accepted but terms need help; promotion not accepted but customer gave a target; or promotion not accepted but customer said they can proceed if affordable.',
      'COMMITMENT GATE: Management directed that commitments be secured before price. The current scoring worksheet identifies Company Commitment, Product Commitment, Pre-Close Commitment / If No, and Holy Grail Commitment. Do not turn price into a shopping conversation by skipping the commitment sequence.',
      'DISCOUNT BOUNDARY: Do not discount without the required move-forward / affordability commitment. Use the current TO script, current DealDesk controls, and manager authority. Do not continue dropping price merely because the customer has not committed.',
      'DYNAMIC TERMS: The current TO script contains examples involving deposits, financing, rates/terms, marketing assistance, manufacturer help, and price movement. Those values and approvals can change. Use the live Paradise-approved financing/pricing tools and current manager direction; never memorize a rate, term, fee, discount, lender approval, manufacturer concession, or marketing claim from a training snapshot.',
      'MANAGER SUPPORT: Current Sales Manager policy assigns managers field support, inbound field-rep calls, NRP and situational drops, cancel saves, overflow appointments, rehash situations, pricing discipline, and process/compliance enforcement. Use the current manager path when support or approval is required.',
      'OUTCOME CONTROL: Current Sales Rep policy requires the appointment result/disposition before leaving the driveway. A close attempt, TO, manager-support call, or customer delay does not remove that requirement.',
      'STILL GATED: Recovery of the current TO script closes the former TO-trigger/script gap, but it does not establish every lender disclosure, qualification document, manager exception limit, NRP/rehash/cancel-save decision tree, fallback routing rule, or CRM closeout field. Do not infer those missing procedures.'
    ]),
    unresolved:Object.freeze([
      'Exact TO contact/fallback path if the assigned manager or normal manager-support route is unavailable',
      'Exact current lender application workflow, program eligibility, required disclosures, and lender-specific approval documentation',
      'Current qualification criteria and required documentation before or during close beyond the inputs expressly present in the current TO script',
      'Definitions and decision trees for NRP, situational drops, rehash, and cancel-save use',
      'Exact manager approval authority at each pricing, discount, financing, and exception stage beyond live DealDesk / manager controls',
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
    const sources=control.sources.map(x=>`<a class="puMoreRow" href="${esc(x.url)}" target="_blank" rel="noopener"><span><b>${esc(x.title)}</b><small>${esc(x.authority)} · ${esc(x.currentness||'current 2026 control/source evidence')}</small></span><strong>↗</strong></a>`).join('');
    const blocked=control.unresolved.map(x=>`<div class="puMoreRow"><span><b>${esc(x)}</b><small>Still requires a verified current Paradise-controlled procedure before operational training publishes.</small></span></div>`).join('');
    wrap.innerHTML=`<div class="puSection">Closing & manager-support control path</div><section class="card"><div class="puNotice"><b>TO SOURCE CLOSED / BROADER CLOSE PARTIAL:</b> The exact current Paradise TO script and commitment worksheet are now recovered and management-issued for every appointment. Lender disclosures, qualification documentation, manager exception limits, special-situation decision trees, fallback routing, and CRM closeout details remain gated.</div>${rows}<details class="puSources"><summary>Current controlled / internal evidence</summary><div class="puSourceList">${sources}</div></details><details class="puSources"><summary>Closing artifacts still missing</summary><div class="puSourceList">${blocked}</div></details></section>`;
    hold.insertAdjacentElement('beforebegin',wrap);
    return out;
  };
  window.PU_SALES_CLOSING_SUPPORT_VERSION='2026.08.16-pu-sales-closing-v2';
})();