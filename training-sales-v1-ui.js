(()=>{
  if(!window.PU_CONTENT?.salesPolicyGate)return;
  const pricingFinanceControl=Object.freeze({
    status:'PARTIAL_SOURCE_CLOSURE',
    asOf:'2026-08-16',
    rules:Object.freeze([
      'LIVE PRICE: Use the current Paradise-approved price configured in the live sales system. Do not quote from memory or from a static training PDF. March 2026 Paradise/Leap implementation records show the Vytex price configuration was actively corrected in Leap.',
      'DISCOUNT / APPROVAL: Use the current DealDesk and manager-approval controls. v191 is the latest recovered native DealDesk build, but thresholds, tiers, fees, and finance options are dynamic and must not be memorized from training. Never bypass an approval indicator.',
      'PRESENTATION: Current Paradise workbook and internal training support moving from price into ROI / affordability and only then through the current approved incentive path. Use current controlled wording and tools; do not invent urgency, savings, or authority.',
      'FINANCING: Use the current Paradise-approved financing tool / lender flow and live terms. The SalesPro Finance Calculator may support payment discussion, but this training does not authorize a Leap Lending application workflow, a lender approval, or any remembered rate, term, fee, or payment.'
    ]),
    sources:Object.freeze([
      Object.freeze({id:'sales-workbook-v3',title:'Paradise Sales Workbook Tri-Fold v3 Tampa',authority:'REFERENCE',currentness:'Source modified 2026-07-11; current internal presentation-workbook evidence.',url:'https://drive.google.com/file/d/1Bj_y6UyMRCeXmxebwsVra0aJOAVVb9r8/view?usp=drivesdk'}),
      Object.freeze({id:'dealdeck-v191',title:'DealDesk v191 — B34 Red When Triggered',authority:'REFERENCE',currentness:'Latest recovered native DealDesk build; use the live tool, not memorized values.',url:'https://docs.google.com/spreadsheets/d/15l70sMnqkH03PFCV20B5y4RM9D_yWouxHPipEM7h0Mw/edit?usp=drivesdk'}),
      Object.freeze({id:'sales-meeting-2026-03-16',title:'Paradise Exteriors Sales Weekly Meeting — 2026-03-16',authority:'REFERENCE',currentness:'Current internal training evidence for the price / ROI / financing / incentive sequence; not a substitute for controlled procedures.',url:'https://docs.google.com/document/d/11r4E0PfCSg_990mNW8ZPOwF8xT-bCZcYs7GCNjkJeB0/edit?usp=drivesdk'}),
      Object.freeze({id:'vytex-price-book-2025-09-06',title:'Paradise Exteriors — Vytex Price Book — 2025-09-06',authority:'REFERENCE',currentness:'Configuration-source evidence used by Paradise Sales Manager with Leap in March 2026; current live system controls actual price.',url:'https://drive.google.com/file/d/19aoC-9wU-DBwW4qOFFAxNlC4O7qF3ryT/view?usp=drivesdk'})
    ]),
    unresolved:Object.freeze([
      'Exact live discount authorization / exception workflow beyond current tool and manager-approval controls',
      'Exact lender application workflow, program eligibility, required disclosures, and current lender-specific terms',
      'Qualification / closing scripts and exact manager TO procedure',
      'Contract execution and required-document workflow',
      'Customer cancellation / rescission handling procedure',
      'Final button-up, CRM handoff, and full Sales Rep certification checklist'
    ])
  });
  const contractHandoffControl=Object.freeze({
    status:'PARTIAL_SOURCE_CLOSURE',
    asOf:'2026-08-16',
    rules:Object.freeze([
      'DOCUMENT REVIEW: Use the current Paradise-generated agreement and review the actual job, product, measurement/specification, price/payment, and customer details before signature. Correct errors before sending. Current 2026 operations repeatedly route reviewed documents through the office/admin e-signature process; do not bypass review or hand-edit controlled legal pages.',
      'CANCELLATION NOTICE: The current customer agreement package includes two Notice of Cancellation pages and a customer acknowledgment. Do not alter the notice language, independently interpret the customer’s legal rights, or promise a cancellation outcome. Preserve any written request and escalate it promptly through the current Paradise management/admin process.',
      'AUTHORIZED CANCELLATION: A current 2026 management-authorized cancellation example required the signed cancellation form to be returned so company records were complete before the refund process continued. This is a control example, not authority for a sales rep to approve a cancellation, refund, deadline, or amount.',
      'RESULT / RELEASE: A completed signed agreement is not the end of the operational handoff. Current 2026 Paradise records repeatedly route signed agreements through RESULT/RELEASE so the job can be released/created in the operating system. Verify the handoff succeeded; do not assume a signed PDF alone created the job.',
      'SYSTEM RECOVERY: Current LeadPerfection upload-failure records are routed for manual recovery and result/release rather than ignored. If the normal system handoff fails, escalate the failure and confirm recovery before treating the job as released.',
      'ADDENDA / CHANGES: Keep changes to an existing sold job tied to the original sale/job through the current addendum/change process. Do not manufacture a duplicate appointment or new sale merely to process an existing-job correction.'
    ]),
    evidence:Object.freeze([
      'Current March 2026 Paradise customer agreement package: e-sign consent, job specifications, improvement agreement, two Notice of Cancellation pages, customer cancellation acknowledgment, rapid-response/finance-measure-production handoff language, lien notice, and additional terms.',
      'Repeated January–March 2026 internal Document Review records: generated documents are reviewed, corrected when needed, approved, then routed through the office/admin team for electronic signature.',
      'February 6, 2026 management-authorized cancellation example: signed cancellation form requested back for complete records before the refund process continued.',
      'Repeated January–March 2026 RESULT/RELEASE records: signed agreements are routed for release/job creation; LeadPerfection upload failures are routed for recovery.',
      'February 2026 addendum/change operational thread: existing-sale changes remain tied to the original sale/job rather than creating a duplicate new gross-issued appointment.'
    ]),
    privacy:'Customer-specific contracts and email threads were used only as current operational evidence and are intentionally not linked from Paradise University.',
    unresolved:Object.freeze([
      'Field-by-field contract completion checklist and exact required-document matrix',
      'Legal determination and timing for cancellation / rescission outside the controlled customer notice',
      'Exact refund authorization, calculation, timing, and accounting workflow',
      'Exact LeadPerfection / CRM required fields and ownership at each handoff step',
      'Exact financing document / disclosure package required with a sold job',
      'Full button-up / sold-job checklist and full Sales Rep certification checklist',
      'Qualification / closing scripts and exact manager TO procedure'
    ])
  });
  window.PU_SALES_PRICING_FINANCE_CONTROL=pricingFinanceControl;
  window.PU_SALES_CONTRACT_HANDOFF_CONTROL=contractHandoffControl;
  const baseStage=puStage;
  puStage=function(stage){
    if(stage!=='sales-rep')return baseStage(stage);
    const s=PU_PATH.find(x=>x.id===stage),lessons=PU_LESSONS.filter(x=>x.stage===stage),gate=window.PU_CONTENT.salesPolicyGate,source=window.PU_CONTENT.sources?.[gate.sourceId],ctl=pricingFinanceControl,ch=contractHandoffControl;
    const controlRows=ctl.rules.map((text,i)=>`<div class="row"><div class="lab">${['LIVE PRICE','DISCOUNT / APPROVAL','PRESENTATION','FINANCING'][i]}</div><div class="val">${esc(text.replace(/^[^:]+:\s*/,''))}</div></div>`).join('');
    const controlSources=ctl.sources.map(x=>`<a class="puMoreRow" href="${esc(x.url)}" target="_blank" rel="noopener"><span><b>${esc(x.title)}</b><small>${esc(x.authority)} · ${esc(x.currentness)}</small></span><strong>↗</strong></a>`).join('');
    const contractRows=ch.rules.map(text=>{const parts=text.split(':');const lab=parts.shift();return`<div class="row"><div class="lab">${esc(lab)}</div><div class="val">${esc(parts.join(':').trim())}</div></div>`}).join('');
    const evidenceRows=ch.evidence.map(x=>`<div class="puMoreRow"><span><b>CURRENT INTERNAL EVIDENCE</b><small>${esc(x)}</small></span></div>`).join('');
    M.innerHTML=`<button class="back puBack" id="puBack">← Career Path</button><h2>${esc(s?.name||'Sales Rep Academy')}</h2><p class="sub">Core in-home sales method. The current build publishes only what is supported by verified Paradise policy or clearly labeled source/reference training.</p><div class="puNotice"><b>PART 1 READY:</b> Preparation through Product Presentation. These lessons teach the process and current Paradise accuracy boundaries.</div><div class="puSection">Core sales lessons</div><div class="puList">${lessons.map(x=>`<button data-lesson="${esc(x.id)}"><b>${puLessonDone(x.id)?'✓ ':''}${esc(x.title)}</b><small>${esc(x.minutes)} min · ${esc(x.summary)}</small></button>`).join('')}</div><div class="puSection">Verified Paradise sales-policy layer</div><section class="card"><div class="row"><div class="lab">SOURCE</div><div class="val strong">${esc(source?.title||'Verified 2026 Paradise sales policy')}</div></div><div class="row"><div class="lab">SOURCE REVISION</div><div class="val">${esc(gate.sourceModified||'2026')} · internal 2026 policy source</div></div><div class="row"><div class="lab">READINESS STANDARD</div><div class="val">Written + verbal test · 85% proficiency · Sales Manager determines readiness for independent issued appointments.</div></div><div class="row"><div class="lab">IN-HOME TIMELINE</div><div class="val">Entry 10–15 · Measure/Needs 10–20 · Customer Profile/Company 30–45 · Product Demo 30–45 · Close/TO 15–30 · Wrap Up/Warm Down 15–30 · total average 2–3 hours.</div></div><div class="row"><div class="lab">ISSUED APPOINTMENTS</div><div class="val">Firm appointment time; current Dispatch / Call Center and manager process controls pre-visit contact and late-arrival communication. No unauthorized follow-up after the initial issued appointment.</div></div><div class="row"><div class="lab">CURRENT OPERATING CONTROLS</div><div class="val">Rilla Voice on appointments · full TO compliance · disposition/result before leaving the driveway · current net-sale/deposit conditions remain company policy controls.</div></div>${source?`<a class="puMoreRow" href="${esc(source.url)}" target="_blank" rel="noopener"><span><b>Open verified Paradise policy source</b><small>Use the source for the exact current policy text represented above.</small></span><strong>↗</strong></a>`:''}</section><div class="puSection">Current pricing & financing control path</div><section class="card"><div class="puNotice"><b>PARTIAL SOURCE CLOSURE:</b> Current sources now establish where price, approval, presentation, and financing controls live. They do not authorize memorized prices, discounts, lender terms, contract steps, or cancellation handling.</div>${controlRows}<details class="puSources"><summary>Controlled / current source evidence</summary><div class="puSourceList">${controlSources}</div></details></section><div class="puSection">Contract, cancellation & handoff controls</div><section class="card"><div class="puNotice"><b>PARTIAL SOURCE CLOSURE:</b> Current 2026 operational evidence now supports the review, escalation, result/release, recovery, and existing-job change boundaries below. This is not a complete contract, cancellation, refund, CRM, or certification SOP.</div>${contractRows}<details class="puSources"><summary>Current operational evidence</summary><div class="puSourceList">${evidenceRows}<div class="puMoreRow"><span><b>PRIVACY CONTROL</b><small>${esc(ch.privacy)}</small></span></div></div></details></section><div class="puNotice"><b>CURRENT POLICY REQUIRED — PROCEDURE GATE — HOLD:</b> ${esc(gate.message)}</div><details class="puSources"><summary>What is still blocked</summary><div class="puSourceList">${(ch.unresolved||[]).map(x=>`<div class="puMoreRow"><span><b>${esc(x)}</b><small>Requires a verified current Paradise procedural source before operational training publishes.</small></span></div>`).join('')}</div></details>`;
    document.getElementById('puBack').onclick=()=>puSetPage('career');
    document.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>puSetPage('lesson:'+b.dataset.lesson));
  };
  window.PU_SALES_UI_VERSION='2026.08.16-pu-sales-ui-v4';
})();
