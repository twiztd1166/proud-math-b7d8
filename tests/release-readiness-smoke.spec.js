import {test,expect} from '@playwright/test';

test('future v3.13 code-only validated release requires app update before route while preserving current field rules',async({page})=>{
  await page.goto('/index.html');
  const state=await page.evaluate(()=>{
    const meta={validated:true,version:'2026.08.16-v3.13',snapshot:window.PCM_PROVENANCE.snapshot,datasetSha256:window.PCM_PROVENANCE.datasetSha256,url:'https://example.test/v313/index.html'};
    pcmLatest=meta;pcmApplyDeployBlock();pcmHealth();
    return{current:window.PCM_BUILD_VERSION,newer:pcmMetaIsNewer(meta),actionableData:pcmMetaIsActionable(meta),block:window.PCM_DEPLOY_BLOCK_REASON||'',updateText:document.querySelector('.healthUpdate')?.textContent||'',ruleBlock:document.querySelector('.healthBlock')?.textContent||''};
  });
  expect(state.current).toBe('2026.08.14-v3.12');
  expect(state.newer).toBeTruthy();
  expect(state.actionableData).toBeFalsy();
  expect(state.block).toMatch(/newer approved app version/i);
  expect(state.updateText).toMatch(/UPDATE NOW/);
  expect(state.ruleBlock).toMatch(/UPDATE REQUIRED/);
  await page.getByPlaceholder('Start typing a city…').fill('Boca Raton');
  await page.locator('.opt').filter({hasText:'Boca Raton'}).first().click();
  await expect(page.locator('.traffic h3')).toHaveText('YES — CANVASSING ALLOWED');
  await expect(page.getByRole('button',{name:/UPDATE APP BEFORE STARTING/})).toBeVisible();
});

test('release candidate keeps controlled jurisdiction SHA unchanged',async({page})=>{
  await page.goto('/index.html');
  await expect.poll(async()=>page.evaluate(()=>window.PCM_PROVENANCE?.datasetSha256)).toBe('a98b8badf4c3df616fb091eb32ff85f70682f226e4fcd55591f3784b37abe200');
  const counts=await page.evaluate(()=>({records:window.PCM_DATA.records.length,go:window.PCM_DATA.meta.goCount,noGo:window.PCM_DATA.meta.noGoCount}));
  expect(counts).toEqual({records:78,go:76,noGo:2});
});

test('Sales Rep Academy uses verified 2026 Paradise policy without weakening the procedure hold',async({page})=>{
  await page.goto('/index.html');
  const source=await page.evaluate(()=>({policy:window.PU_CONTENT?.sources?.paradiseSalesPolicy2026,gate:window.PU_CONTENT?.salesPolicyGate,version:window.PU_SALES_POLICY_VERSION}));
  expect(source.version).toBe('2026.03.05-final-2026-policy');
  expect(source.policy?.authority).toBe('PARADISE_APPROVED');
  expect(source.policy?.url).toContain('138nsdiqs3XeSmq4PXlnGQNHFnDp2EJSe33ldrFu3TNQ');
  expect(source.gate?.status).toBe('CURRENT_POLICY_REQUIRED');
  expect(source.gate?.sourceRevision).toBe('1585');
  expect(source.gate?.unresolved).toEqual(expect.arrayContaining([expect.stringMatching(/price-presentation/i),expect.stringMatching(/Financing presentation/i),expect.stringMatching(/Contract execution/i),expect.stringMatching(/cancellation \/ rescission/i),expect.stringMatching(/full Sales Rep certification/i)]));
  await page.locator('#nTrain').click();await page.getByRole('button',{name:/Career Path/}).first().click();await page.getByRole('button',{name:/6\. Sales Rep/}).click();
  await expect(page.getByText(/Verified Paradise sales-policy layer/i)).toBeVisible();
  await expect(page.getByText(/Written \+ verbal test · 85% proficiency/i).first()).toBeVisible();
  await expect(page.getByText(/total average 2–3 hours/i)).toBeVisible();
  await expect(page.getByText(/PROCEDURE GATE — HOLD/)).toBeVisible();
  await expect(page.getByRole('link',{name:/Open verified Paradise policy source/})).toHaveAttribute('href',/138nsdiqs3XeSmq4PXlnGQNHFnDp2EJSe33ldrFu3TNQ/);
  await expect(page.getByRole('button',{name:/Retail Close|Qualification|Major Close|Button-Up/i})).toHaveCount(0);
});

test('Sales Rep readiness keeps Paradise release authority while labeling Grosso assessment structure as reference',async({page})=>{
  await page.goto('/index.html');
  const ctl=await page.evaluate(()=>window.PU_SALES_READINESS_GRADUATION_CONTROL);
  expect(ctl?.status).toBe('PARTIAL_SOURCE_CLOSURE');
  expect(ctl?.assessmentReferenceStatus).toBe('CURRENT_SESSION_STRUCTURE_CONFIRMED');
  expect(ctl?.source?.id).toBe('sales-manager-plan-2026');
  expect(ctl?.source?.authority).toBe('PARADISE_APPROVED');
  expect(ctl?.source?.revision).toBe('367');
  expect(ctl?.assessmentSource?.id).toBe('grosso-masterclass-assessment-2026-02-20');
  expect(ctl?.assessmentSource?.authority).toBe('REFERENCE');
  expect(ctl?.rules).toEqual(expect.arrayContaining([
    expect.stringMatching(/written and verbal test with an 85% proficiency standard/i),
    expect.stringMatching(/Sales Manager determines readiness for independent issued appointments/i),
    expect.stringMatching(/ride-along evaluations with written observation reports/i),
    expect.stringMatching(/financing options, paperwork, pricing, POS\/DNS systems/i),
    expect.stringMatching(/full compliance with sales tools, systems, processes/i),
    expect.stringMatching(/Issuing assets does not by itself prove certification/i)
  ]));
  expect(ctl?.assessmentEvidence).toEqual(expect.arrayContaining([
    expect.stringMatching(/56-question multiple-choice written exam.*one-hour limit/i),
    expect.stringMatching(/Introduction Script, Qualification Script, and Major Close Script/i),
    expect.stringMatching(/script adherence, tonality, pacing, and overall delivery/i),
    expect.stringMatching(/REFERENCE assessment evidence only.*does not replace Paradise/i)
  ]));
  expect(ctl?.assessmentPrivacy).toMatch(/Do not expose or reuse external assessment access codes.*proprietary exam questions/i);
  expect(ctl?.unresolved).toEqual(expect.arrayContaining([
    expect.stringMatching(/56-question exam content and answer key/i),
    expect.stringMatching(/Permanent Paradise verbal-test script/i),
    expect.stringMatching(/manager sign-off/i),
    expect.stringMatching(/ride-alongs before release/i),
    expect.stringMatching(/field-pass threshold/i),
    expect.stringMatching(/system of record/i)
  ]));
  await page.locator('#nTrain').click();await page.getByRole('button',{name:/Career Path/}).first().click();await page.getByRole('button',{name:/6\. Sales Rep/}).click();
  await expect(page.getByText(/Sales Rep readiness & graduation controls/i)).toBeVisible();
  await expect(page.getByText(/A device lesson, Quick Check, or local completion mark is not the company test/i)).toBeVisible();
  await expect(page.getByText(/Paradise University does not self-certify or release a representative/i)).toBeVisible();
  await expect(page.getByText(/written observation reports/i)).toBeVisible();
  await expect(page.getByText(/Issuing assets does not by itself prove certification/i)).toBeVisible();
  await expect(page.getByRole('link',{name:/Sales Manager Policies, Responsibilities & Compensation Plan/})).toHaveAttribute('href',/1e54fRhQv6vo8qRb6AP34bOsPKAms7EqR0hbZ34kSqJk/);
  await page.getByText('Observed Grosso Masterclass assessment structure — REFERENCE',{exact:true}).click();
  await expect(page.getByText(/56-question multiple-choice written exam with a one-hour limit/i)).toBeVisible();
  await expect(page.getByText(/Introduction Script, Qualification Script, and Major Close Script/i)).toBeVisible();
  await expect(page.getByText(/script adherence, tonality, pacing, and overall delivery/i)).toBeVisible();
  await expect(page.getByText(/observed session structure, not Paradise release authority/i)).toBeVisible();
  await expect(page.getByText(/Do not expose or reuse external assessment access codes/i)).toBeVisible();
  await page.getByText('Certification artifacts still missing',{exact:true}).click();
  await expect(page.getByText(/Actual current 56-question exam content and answer key/i)).toBeVisible();
  await expect(page.getByText(/Final combined Sales Rep certification checklist and system of record/i)).toBeVisible();
  await expect(page.getByText(/CURRENT POLICY REQUIRED — PROCEDURE GATE — HOLD/i)).toBeVisible();
});

test('pricing and financing control path preserves finance-office handoff, evaluated Leap status, and live-tool authority',async({page})=>{
  await page.goto('/index.html');
  const ctl=await page.evaluate(()=>window.PU_SALES_PRICING_FINANCE_CONTROL);
  expect(ctl?.status).toBe('PARTIAL_SOURCE_CLOSURE');
  expect(ctl?.asOf).toBe('2026-08-16');
  expect(ctl?.leapLendingStatus).toBe('EVALUATED_ENROLLED_NOT_ACTIVE');
  expect(ctl?.financeOfficeStatus).toBe('CURRENT_OPERATIONAL_HANDOFF_CONFIRMED');
  expect(ctl?.rules).toEqual(expect.arrayContaining([
    expect.stringMatching(/current Paradise-approved price configured in the live sales system/i),
    expect.stringMatching(/DealDesk and manager-approval controls/i),
    expect.stringMatching(/Finance Coordinator \/ current office process/i),
    expect.stringMatching(/not an active Paradise rep workflow/i),
    expect.stringMatching(/does not authorize a Leap Lending application workflow/i)
  ]));
  expect(ctl?.sources?.map(x=>x.id)).toEqual(expect.arrayContaining(['sales-workbook-v3','dealdeck-v191','sales-meeting-2026-03-16','vytex-price-book-2025-09-06']));
  expect(ctl?.sources?.every(x=>x.authority==='REFERENCE')).toBeTruthy();
  expect(ctl?.officeEvidence).toEqual(expect.arrayContaining([
    expect.stringMatching(/February–June 2026.*Finance Coordinator.*customer financing applications/i),
    expect.stringMatching(/managers may communicate an approved lender\/plan on an individual job/i),
    expect.stringMatching(/operational handoff boundary, not a fixed lender-selection algorithm/i)
  ]));
  expect(ctl?.implementationEvidence).toEqual(expect.arrayContaining([
    expect.stringMatching(/implementation-design discussions/i),
    expect.stringMatching(/June 16, 2026.*enrolled.*had not started using it/i),
    expect.stringMatching(/August 5 and August 14, 2026/i)
  ]));
  expect(ctl?.implementationPrivacy).toMatch(/does not expose mailbox content.*lender credentials.*rate tables.*credit information/i);
  expect(ctl?.unresolved).toEqual(expect.arrayContaining([
    expect.stringMatching(/discount authorization/i),
    expect.stringMatching(/lender-selection and application sequence inside the Finance Coordinator/i),
    expect.stringMatching(/Qualification criteria.*beyond the recovered current TO script/i),
    expect.stringMatching(/Contract execution/i),
    expect.stringMatching(/cancellation \/ rescission/i),
    expect.stringMatching(/CRM handoff/i)
  ]));
  expect((ctl?.unresolved||[]).join(' ')).not.toMatch(/exact manager TO procedure/i);
  await page.locator('#nTrain').click();await page.getByRole('button',{name:/Career Path/}).first().click();await page.getByRole('button',{name:/6\. Sales Rep/}).click();
  await expect(page.getByText(/Current pricing & financing control path/i)).toBeVisible();
  await expect(page.getByText(/Customer financing applications\/documents are currently routed through Paradise’s Finance Coordinator \/ office process/i)).toBeVisible();
  await expect(page.getByText(/Leap Lending was evaluated\/enrolled but is not established as an active Paradise rep workflow/i)).toBeVisible();
  await expect(page.getByText(/Do not quote from memory or from a static training PDF/i)).toBeVisible();
  await expect(page.getByText(/Never bypass an approval indicator/i)).toBeVisible();
  await expect(page.getByText(/do not self-select a lender workflow, reuse credentials, or infer approval rules/i)).toBeVisible();
  await page.getByText('Finance Coordinator / office handoff',{exact:true}).click();
  await expect(page.getByText(/Finance Coordinator as the person handling customer financing applications/i)).toBeVisible();
  await expect(page.getByText(/operational handoff boundary, not a fixed lender-selection algorithm/i)).toBeVisible();
  await page.getByText('Financing implementation status',{exact:true}).click();
  await expect(page.getByText(/enrolled in Lending through Leap SalesPro but had not started using it yet/i)).toBeVisible();
  await expect(page.getByText(/Paradise University does not expose mailbox content/i)).toBeVisible();
  await expect(page.getByText(/CURRENT POLICY REQUIRED — PROCEDURE GATE — HOLD/i)).toBeVisible();
  await expect(page.getByRole('button',{name:/Retail Close|Qualification|Major Close|Button-Up/i})).toHaveCount(0);
});

test('contract cancellation and handoff controls confirm payment and result-release boundaries without inventing full button-up',async({page})=>{
  await page.goto('/index.html');
  const ctl=await page.evaluate(()=>window.PU_SALES_CONTRACT_HANDOFF_CONTROL);
  expect(ctl?.status).toBe('PARTIAL_SOURCE_CLOSURE');
  expect(ctl?.asOf).toBe('2026-08-16');
  expect(ctl?.resultReleaseStatus).toBe('CURRENT_PROCESS_CONFIRMED');
  expect(ctl?.paymentPortalStatus).toBe('CURRENT_CONTROL_CONFIRMED');
  expect(ctl?.buttonUpStatus).toBe('PARTIAL_SOURCE_CLOSURE');
  expect(ctl?.rules).toEqual(expect.arrayContaining([
    expect.stringMatching(/review the actual job, product, measurement\/specification, price\/payment, and customer details before signature/i),
    expect.stringMatching(/current Paradise payment portal/i),
    expect.stringMatching(/date-sensitive and must not be memorized as evergreen policy/i),
    expect.stringMatching(/Do not alter the notice language/i),
    expect.stringMatching(/not authority for a sales rep to approve a cancellation, refund, deadline, or amount/i),
    expect.stringMatching(/office confirmation such as Done or Released is the closure signal/i),
    expect.stringMatching(/LeadPerfection upload-failure/i),
    expect.stringMatching(/original sale\/job/i)
  ]));
  expect(ctl?.privacy).toMatch(/customer-specific contracts and email threads.*not linked/i);
  expect(ctl?.unresolved).toEqual(expect.arrayContaining([
    expect.stringMatching(/Field-by-field contract completion checklist/i),
    expect.stringMatching(/Legal determination and timing for cancellation/i),
    expect.stringMatching(/refund authorization/i),
    expect.stringMatching(/LeadPerfection \/ CRM required fields/i),
    expect.stringMatching(/Full button-up/i),
    expect.stringMatching(/Qualification criteria.*recovered current TO script/i)
  ]));
  expect((ctl?.unresolved||[]).join(' ')).not.toMatch(/manager TO procedure/i);
  await page.locator('#nTrain').click();await page.getByRole('button',{name:/Career Path/}).first().click();await page.getByRole('button',{name:/6\. Sales Rep/}).click();
  await expect(page.getByText(/Contract, cancellation & handoff controls/i)).toBeVisible();
  await expect(page.getByText(/payment-portal\/deposit control and RESULT\/RELEASE\/recovery boundaries/i)).toBeVisible();
  await expect(page.getByText(/current Paradise payment portal/i)).toBeVisible();
  await expect(page.getByText(/date-sensitive and must not be memorized as evergreen policy/i)).toBeVisible();
  await expect(page.getByText(/do not bypass review or hand-edit controlled legal pages/i)).toBeVisible();
  await expect(page.getByText(/Do not alter the notice language/i)).toBeVisible();
  await expect(page.getByText(/not authority for a sales rep to approve a cancellation, refund, deadline, or amount/i)).toBeVisible();
  await expect(page.getByText(/office confirmation such as Done or Released is the closure signal/i)).toBeVisible();
  await expect(page.getByText(/If the normal system handoff fails, escalate the failure and confirm recovery/i)).toBeVisible();
  await page.getByText('Current operational evidence',{exact:true}).click();
  await expect(page.getByText(/use the payment portal and process the current required appointment\/deposit amount/i)).toBeVisible();
  await expect(page.getByText(/release was needed so the job could be created in the system/i)).toBeVisible();
  await expect(page.getByText(/PRIVACY CONTROL/i).last()).toBeVisible();
  await expect(page.getByText(/customer-specific contracts and email threads.*not linked/i)).toBeVisible();
  await expect(page.getByText(/CURRENT POLICY REQUIRED — PROCEDURE GATE — HOLD/i)).toBeVisible();
  await expect(page.getByRole('button',{name:/Retail Close|Qualification|Major Close|Button-Up/i})).toHaveCount(0);
});