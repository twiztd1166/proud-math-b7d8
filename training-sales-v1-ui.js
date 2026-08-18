(()=>{
  if(!window.PU_CONTENT?.salesPolicyGate)return;
  const pricingFinanceControl=Object.freeze({
    status:'PARTIAL_SOURCE_CLOSURE',
    asOf:'2026-08-16',
    leapLendingStatus:'EVALUATED_ENROLLED_NOT_ACTIVE',
    financeOfficeStatus:'CURRENT_OPERATIONAL_HANDOFF_CONFIRMED',
    rules:Object.freeze([
      'LIVE PRICE: Use the current Paradise-approved price configured in the live sales system. Do not quote from memory or from a static training PDF. March 2026 Paradise/Leap implementation records show the Vytex price configuration was actively corrected in Leap.',
      'DISCOUNT / APPROVAL: Use the current DealDesk and manager-approval controls. v191 is the latest recovered native DealDesk build, but thresholds, tiers, fees, and finance options are dynamic and must not be memorized from training. Never bypass an approval indicator.',
      'PRESENTATION: Current Paradise workbook and internal training support moving from price into ROI / affordability and only then through the current approved incentive path. Use current controlled wording and tools; do not invent urgency, savings, or authority.',
      'FINANCING: Use only the current Paradise-approved financing tool / lender flow and live terms. Current 2026 operational records repeatedly place customer financing applications, finance-document assistance, reapplications, lender servicing, and finance follow-up with Paradise’s Finance Coordinator / current office process. A rep or manager may communicate an approved current option on a specific deal, but do not self-select a lender workflow, reuse credentials, or infer approval rules. Leap SalesPro Lending / UCA / waterfall was evaluated in February 2026, but connected vendor records show it was not an active Paradise rep workflow: on June 16 Leap said Paradise was enrolled but had not started using it, and August outreach again asked whether Paradise wanted to use SalesPro financing. Treat those Leap workflows as implementation history, not a Paradise operating procedure. The SalesPro Finance Calculator may support payment discussion, but it does not authorize a Leap Lending application workflow, a lender approval, or any remembered rate, term, fee, or payment.'
    ]),
    sources:Object.freeze([
      Object.freeze({id:'sales-workbook-v3',title:'Paradise Sales Workbook Tri-Fold v3 Tampa',authority:'REFERENCE',currentness:'Source modified 2026-07-11; current internal presentation-workbook evidence.',url:'https://drive.google.com/file/d/1Bj_y6UyMRCeXmxebwsVra0aJOAVVb9r8/view?usp=drivesdk'}),
      Object.freeze({id:'dealdeck-v191',title:'DealDesk v191 — B34 Red When Triggered',authority:'REFERENCE',currentness:'Latest recovered native DealDesk build; use the live tool, not memorized values.',url:'https://docs.google.com/spreadsheets/d/15l70sMnqkH03PFCV20B5y4RM9D_yWouxHPipEM7h0Mw/edit?usp=drivesdk'}),
      Object.freeze({id:'sales-meeting-2026-03-16',title:'Paradise Exteriors Sales Weekly Meeting — 2026-03-16',authority:'REFERENCE',currentness:'Current internal training evidence for the price / ROI / financing / incentive sequence; not a substitute for controlled procedures.',url:'https://docs.google.com/document/d/11r4E0PfCSg_990mNW8ZPOwF8xT-bCZcYs7GCNjkJeB0/edit?usp=drivesdk'}),
      Object.freeze({id:'vytex-price-book-2025-09-06',title:'Paradise Exteriors — Vytex Price Book — 2025-09-06',authority:'REFERENCE',currentness:'Configuration-source evidence used by Paradise Sales Manager with Leap in March 2026; current live system controls actual price.',url:'https://drive.google.com/file/d/19aoC-9wU-DBwW4qOFFAxNlC4O7qF3ryT/view?usp=drivesdk'})
    ]),
    implementationEvidence:Object.freeze([
      'February 5–6, 2026 Leap SalesPro Payments + Waterfall records were implementation-design discussions: Paradise still had to choose who would run the financing waterfall, lender/plan strategy, hard-pull handling, deposit handling, and training/configuration before rollout.',
      'June 16, 2026 Leap told Paradise it was enrolled in Lending through Leap SalesPro but had not started using it yet.',
      'August 5 and August 14, 2026 Leap again asked Paradise stakeholders whether they were interested in using the financing included in SalesPro. That outreach is consistent with the workflow still not being an adopted Paradise rep procedure.'
    ]),
    officeEvidence:Object.freeze([
      'February–June 2026 Paradise records repeatedly identify the Finance Coordinator as the person handling customer financing applications, finance-document assistance, updated rate-sheet coordination, alternative financing, reapplications, and lender follow-up.',
      'Current records also show managers may communicate an approved lender/plan on an individual job, while the broader application/document servicing remains routed through the finance/office process.',
      'These records establish an operational handoff boundary, not a fixed lender-selection algorithm. Lender availability, eligibility, plans, rates, fees, approval criteria, and portals remain live/dynamic controls.'
    ]),
    implementationPrivacy:'Private vendor and internal finance email was used only to establish implementation/adoption and operational-handoff status. Paradise University does not expose mailbox content, customer records, lender credentials, portal credentials, rate tables, or customer credit information.',
    unresolved:Object.freeze([
      'Exact live discount authorization / exception workflow beyond current tool and manager-approval controls',
      'Exact current lender-selection and application sequence inside the Finance Coordinator / office process, including program eligibility, required disclosures, and lender-specific terms',
      'Qualification criteria and required qualification documentation beyond the recovered current TO script',
      'Contract execution and required-document workflow',
      'Customer cancellation / rescission handling procedure',
      'Final button-up, CRM handoff, and full Sales Rep certification checklist'
    ])
  });
  const contractHandoffControl=Object.freeze({
    status:'PARTIAL_SOURCE_CLOSURE',
    asOf:'2026-08-16',
    resultReleaseStatus:'CURRENT_PROCESS_CONFIRMED',
    paymentPortalStatus:'CURRENT_CONTROL_CONFIRMED',
    buttonUpStatus:'PARTIAL_SOURCE_CLOSURE',
    rules:Object.freeze([
      'DOCUMENT REVIEW: Use the current Paradise-generated agreement and review the actual job, product, measurement/specification, price/payment, and customer details before signature. Correct errors before sending. Current 2026 operations repeatedly route reviewed documents through the office/admin e-signature process; do not bypass review or hand-edit controlled legal pages.',
      'PAYMENT / DEPOSIT: Use the current Paradise payment portal and the current required deposit/payment policy. A February 16, 2026 management instruction specifically corrected reps who were deferring the entire payment and directed the team to process an approved amount during the appointment, with any permitted remaining balance scheduled under the current process. The dollar and percentage examples in that email are date-sensitive and must not be memorized as evergreen policy; use the live current rule and manager/admin direction.',
      'CANCELLATION NOTICE: The current customer agreement package includes two Notice of Cancellation pages and a customer acknowledgment. Do not alter the notice language, independently interpret the customer’s legal rights, or promise a cancellation outcome. Preserve any written request and escalate it promptly through the current Paradise management/admin process.',
      'AUTHORIZED CANCELLATION: A current 2026 management-authorized cancellation example required the signed cancellation form to be returned so company records were complete before the refund process continued. This is a control example, not authority for a sales rep to approve a cancellation, refund, deadline, or amount.',
      'RESULT / RELEASE: A completed signed agreement is not the end of the operational handoff. Repeated 2026 Paradise records route signed agreements through RESULT/RELEASE so the job can be released/created in the operating system, and office confirmation such as Done or Released is the closure signal in the recovered records. Verify the handoff succeeded; do not assume a signed PDF alone created the job.',
      'SYSTEM RECOVERY: Current LeadPerfection upload-failure records are routed for manual recovery and result/release rather than ignored. If the normal system handoff fails, escalate the failure and confirm recovery before treating the job as released.',
      'ADDENDA / CHANGES: Keep changes to an existing sold job tied to the original sale/job through the current addendum/change process. Do not manufacture a duplicate appointment or new sale merely to process an existing-job correction.'
    ]),
    evidence:Object.freeze([
      'Current March 2026 Paradise customer agreement package: e-sign consent, job specifications, improvement agreement, two Notice of Cancellation pages, customer cancellation acknowledgment, rapid-response/finance-measure-production handoff language, lien notice, and additional terms.',
      'Repeated January–March 2026 internal Document Review records: generated documents are reviewed, corrected when needed, approved, then routed through the office/admin team for electronic signature.',
      'February 16, 2026 management payment-control instruction: use the payment portal and process the current required appointment/deposit amount rather than simply deferring the entire payment; exact examples remain date-sensitive.',
      'February 6, 2026 management-authorized cancellation example: signed cancellation form requested back for complete records before the refund process continued.',
      'Repeated January–March 2026 RESULT/RELEASE records: signed agreements are routed to the office release group and recovered confirmations include Done / Released. One current dropship record expressly says release was needed so the job could be created in the system.',
      'March 2026 LeadPerfection upload-failure record: the failed contract upload was routed for manual result/release and recovery rather than treated as complete.',
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
      'Qualification criteria and required qualification documentation beyond the recovered current TO script'
    ])
  });
  const readinessGraduationControl=Object.freeze({
    status:'PARTIAL_SOURCE_CLOSURE',
    asOf:'2026-08-16',
    assessmentReferenceStatus:'CURRENT_SESSION_STRUCTURE_CONFIRMED',
    source:Object.freeze({id:'sales-manager-plan-2026',title:'Paradise Exteriors LLC Sales Manager Policies, Responsibilities & Compensation Plan',authority:'PARADISE_APPROVED',revision:'367',modified:'2026-01-15',url:'https://docs.google.com/document/d/1e54fRhQv6vo8qRb6AP34bOsPKAms7EqR0hbZ34kSqJk/edit?usp=drivesdk'}),
    assessmentSource:Object.freeze({id:'grosso-masterclass-assessment-2026-02-20',title:'Paradise Exteriors Grosso Sales Academy Masterclass — Final Exam Session',authority:'REFERENCE',date:'2026-02-20',url:'https://docs.google.com/document/d/1dtCI15cG-FQSnMJBjYz0zV66oI5SvQvT_r7wa5AbtQ0/edit?usp=drivesdk'}),
    rules:Object.freeze([
      'KNOWLEDGE GATE: Current Sales Rep policy requires classroom training plus a written and verbal test with an 85% proficiency standard. A device lesson, Quick Check, or local completion mark is not the company test.',
      'RELEASE AUTHORITY: The Sales Manager determines readiness for independent issued appointments. Paradise University does not self-certify or release a representative to run appointments.',
      'FIELD OBSERVATION: Current Sales Manager policy requires post-training ride-along observations, targeted ride-along evaluations with written observation reports, and post-ride-along retraining/coaching when needed.',
      'TRAINING COVERAGE: Current manager responsibilities include sales training/scripts/methodology, financing options, paperwork, pricing, POS/DNS systems, company policies/procedures, product knowledge, and technical training.',
      'PROCESS COMPLIANCE: Graduation/readiness is broader than close rate. Current manager policy requires full compliance with sales tools, systems, processes, pricing discipline, paperwork accuracy, coaching, and remediation.',
      'GRADUATION ASSETS: Current manager policy calls for preparing graduating representatives with required company assets such as samples, demonstration materials, iPads/technology, business cards, inspection tools, and related equipment. Issuing assets does not by itself prove certification.'
    ]),
    assessmentEvidence:Object.freeze([
      'Observed February 20, 2026 Grosso Masterclass structure: a 56-question multiple-choice written exam with a one-hour limit, followed by a proctored verbal portion; the session recap says written and verbal performance were combined and verbal scripting carried heavier weight in that observed Masterclass assessment.',
      'Grosso proctoring instructions required separate verbal recordings for Introduction Script, Qualification Script, and Major Close Script. The external assessment used Siro to analyze script adherence, tonality, pacing, and overall delivery, and submission was required for full Masterclass Final Exam credit.',
      'The observed Masterclass results were consolidated for management. This is REFERENCE assessment evidence only; it does not replace Paradise’s controlling 85% policy standard, manager readiness decision, ride-along requirements, or any current internal certification artifact.'
    ]),
    assessmentPrivacy:'Do not expose or reuse external assessment access codes, passwords, team codes, login details, or reconstruct proprietary exam questions. Paradise University may teach the observed assessment structure only.',
    unresolved:Object.freeze([
      'Actual current 56-question exam content and answer key, or any replacement current written Sales Rep exam',
      'Permanent Paradise verbal-test script, scoring rubric, weighting, and pass calculation connecting external assessment results to the Paradise 85% proficiency policy',
      'Exact manager sign-off / release-to-independent-appointments form',
      'Required number and sequence of shadow appointments / ride-alongs before release',
      'Current ride-along evaluation rubric and field-pass threshold for a graduating Sales Rep',
      'Final combined Sales Rep certification checklist and system of record'
    ])
  });
  window.PU_SALES_PRICING_FINANCE_CONTROL=pricingFinanceControl;
  window.PU_SALES_CONTRACT_HANDOFF_CONTROL=contractHandoffControl;
  window.PU_SALES_READINESS_GRADUATION_CONTROL=readinessGraduationControl;
  const baseStage=puStage;
  puStage=function(stage){
    if(stage!=='sales-rep')return baseStage(stage);
    const s=PU_PATH.find(x=>x.id===stage),lessons=PU_LESSONS.filter(x=>x.stage===stage),gate=window.PU_CONTENT.salesPolicyGate,source=window.PU_CONTENT.sources?.[gate.sourceId],ctl=pricingFinanceControl,ch=contractHandoffControl,rg=readinessGraduationControl;
    const controlRows=ctl.rules.map((text,i)=>`<div class="row"><div class="lab">${['LIVE PRICE','DISCOUNT / APPROVAL','PRESENTATION','FINANCING'][i]}</div><div class="val">${esc(text.replace(/^[^:]+:\s*/,''))}</div></div>`).join('');
    const controlSources=ctl.sources.map(x=>`<a class="puMoreRow" href="${esc(x.url)}" target="_blank" rel="noopener"><span><b>${esc(x.title)}</b><small>${esc(x.authority)} · ${esc(x.currentness)}</small></span><strong>↗</strong></a>`).join('');
    const financeImplementationRows=ctl.implementationEvidence.map(x=>`<div class="puMoreRow"><span><b>IMPLEMENTATION STATUS</b><small>${esc(x)}</small></span></div>`).join('');
    const financeOfficeRows=ctl.officeEvidence.map(x=>`<div class="puMoreRow"><span><b>FINANCE OFFICE HANDOFF</b><small>${esc(x)}</small></span></div>`).join('');
    const contractRows=ch.rules.map(text=>{const parts=text.split(':');const lab=parts.shift();return`<div class="row"><div class="lab">${esc(lab)}</div><div class="val">${esc(parts.join(':').trim())}</div></div>`}).join('');
    const evidenceRows=ch.evidence.map(x=>`<div class="puMoreRow"><span><b>CURRENT INTERNAL EVIDENCE</b><small>${esc(x)}</small></span></div>`).join('');
    const readinessRows=rg.rules.map(text=>{const parts=text.split(':');const lab=parts.shift();return`<div class="row"><div class="lab">${esc(lab)}</div><div class="val">${esc(parts.join(':').trim())}</div></div>`}).join('');
    const assessmentRows=rg.assessmentEvidence.map(x=>`<div class="puMoreRow"><span><b>REFERENCE ASSESSMENT EVIDENCE</b><small>${esc(x)}</small></span></div>`).join('');
    const readinessBlocked=rg.unresolved.map(x=>`<div class="puMoreRow"><span><b>${esc(x)}</b><small>Not recovered as a verified current Paradise-controlled artifact; do not infer completion or certification.</small></span></div>`).join('');
    M.innerHTML=`<button class="back puBack" id="puBack">← Career Path</button><h2>${esc(s?.name||'Sales Rep Academy')}</h2><p class="sub">Core in-home sales method. The current build publishes only what is supported by verified Paradise policy or clearly labeled source/reference training.</p><div class="puNotice"><b>PART 1 READY:</b> Preparation through Product Presentation. These lessons teach the process and current Paradise accuracy boundaries.</div><div class="puSection">Core sales lessons</div><div class="puList">${lessons.map(x=>`<button data-lesson="${esc(x.id)}"><b>${puLessonDone(x.id)?'✓ ':''}${esc(x.title)}</b><small>${esc(x.minutes)} min · ${esc(x.summary)}</small></button>`).join('')}</div><div class="puSection">Verified Paradise sales-policy layer</div><section class="card"><div class="row"><div class="lab">SOURCE</div><div class="val strong">${esc(source?.title||'Verified 2026 Paradise sales policy')}</div></div><div class="row"><div class="lab">SOURCE REVISION</div><div class="val">${esc(gate.sourceModified||'2026')} · internal 2026 policy source</div></div><div class="row"><div class="lab">READINESS STANDARD</div><div class="val">Written + verbal test · 85% proficiency · Sales Manager determines readiness for independent issued appointments.</div></div><div class="row"><div class="lab">IN-HOME TIMELINE</div><div class="val">Entry 10–15 · Measure/Needs 10–20 · Customer Profile/Company 30–45 · Product Demo 30–45 · Close/TO 15–30 · Wrap Up/Warm Down 15–30 · total average 2–3 hours.</div></div><div class="row"><div class="lab">ISSUED APPOINTMENTS</div><div class="val">Firm appointment time; current Dispatch / Call Center and manager process controls pre-visit contact and late-arrival communication. No unauthorized follow-up after the initial issued appointment.</div></div><div class="row"><div class="lab">CURRENT OPERATING CONTROLS</div><div class="val">Rilla Voice on appointments · full TO compliance · disposition/result before leaving the driveway · current net-sale/deposit conditions remain company policy controls.</div></div>${source?`<a class="puMoreRow" href="${esc(source.url)}" target="_blank" rel="noopener"><span><b>Open verified Paradise policy source</b><small>Use the source for the exact current policy text represented above.</small></span><strong>↗</strong></a>`:''}</section><div class="puSection">Sales Rep readiness & graduation controls</div><section class="card"><div class="puNotice"><b>PARTIAL SOURCE CLOSURE:</b> Current Paradise policy establishes the readiness owner, 85% written/verbal knowledge standard, post-training field observation, written ride-along reporting, retraining, process-compliance expectations, and graduation-asset responsibility. A current-session Grosso Masterclass assessment structure is recovered as REFERENCE only. The actual current Paradise exam/key, permanent scoring rubric, field rubric, and release checklist remain unavailable.</div>${readinessRows}<a class="puMoreRow" href="${esc(rg.source.url)}" target="_blank" rel="noopener"><span><b>${esc(rg.source.title)}</b><small>${esc(rg.source.authority)} · revision ${esc(rg.source.revision)} · ${esc(rg.source.modified)}</small></span><strong>↗</strong></a><details class="puSources"><summary>Observed Grosso Masterclass assessment structure — REFERENCE</summary><div class="puSourceList">${assessmentRows}<a class="puMoreRow" href="${esc(rg.assessmentSource.url)}" target="_blank" rel="noopener"><span><b>${esc(rg.assessmentSource.title)}</b><small>${esc(rg.assessmentSource.authority)} · ${esc(rg.assessmentSource.date)} · observed session structure, not Paradise release authority</small></span><strong>↗</strong></a><div class="puMoreRow"><span><b>ASSESSMENT PRIVACY / IP CONTROL</b><small>${esc(rg.assessmentPrivacy)}</small></span></div></div></details><details class="puSources"><summary>Certification artifacts still missing</summary><div class="puSourceList">${readinessBlocked}</div></details></section><div class="puSection">Current pricing & financing control path</div><section class="card"><div class="puNotice"><b>PARTIAL SOURCE CLOSURE:</b> Current sources establish where price, approval, presentation, and financing controls live. Customer financing applications/documents are currently routed through Paradise’s Finance Coordinator / office process. Leap Lending was evaluated/enrolled but is not established as an active Paradise rep workflow. Do not convert vendor implementation history or individual lender examples into rep operating procedure.</div>${controlRows}<details class="puSources"><summary>Finance Coordinator / office handoff</summary><div class="puSourceList">${financeOfficeRows}</div></details><details class="puSources"><summary>Financing implementation status</summary><div class="puSourceList">${financeImplementationRows}<div class="puMoreRow"><span><b>PRIVACY CONTROL</b><small>${esc(ctl.implementationPrivacy)}</small></span></div></div></details><details class="puSources"><summary>Controlled / current source evidence</summary><div class="puSourceList">${controlSources}</div></details></section><div class="puSection">Contract, cancellation & handoff controls</div><section class="card"><div class="puNotice"><b>PARTIAL SOURCE CLOSURE:</b> Current 2026 operational evidence confirms payment-portal/deposit control and RESULT/RELEASE/recovery boundaries. Full field-by-field button-up, contract, cancellation, refund, CRM, financing-document, and certification procedure remains gated.</div>${contractRows}<details class="puSources"><summary>Current operational evidence</summary><div class="puSourceList">${evidenceRows}<div class="puMoreRow"><span><b>PRIVACY CONTROL</b><small>${esc(ch.privacy)}</small></span></div></div></details></section><div class="puNotice"><b>CURRENT POLICY REQUIRED — PROCEDURE GATE — HOLD:</b> ${esc(gate.message)}</div><details class="puSources"><summary>What is still blocked</summary><div class="puSourceList">${(ch.unresolved||[]).map(x=>`<div class="puMoreRow"><span><b>${esc(x)}</b><small>Requires a verified current Paradise procedural source before operational training publishes.</small></span></div>`).join('')}</div></details>`;
    document.getElementById('puBack').onclick=()=>puSetPage('career');
    document.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>puSetPage('lesson:'+b.dataset.lesson));
  };
  window.PU_SALES_UI_VERSION='2026.08.16-pu-sales-ui-v7';
})();