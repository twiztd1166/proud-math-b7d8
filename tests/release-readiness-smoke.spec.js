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

test('Sales Rep readiness and graduation controls preserve manager release authority without inventing certification artifacts',async({page})=>{
  await page.goto('/index.html');
  const ctl=await page.evaluate(()=>window.PU_SALES_READINESS_GRADUATION_CONTROL);
  expect(ctl?.status).toBe('PARTIAL_SOURCE_CLOSURE');
  expect(ctl?.source?.id).toBe('sales-manager-plan-2026');
  expect(ctl?.source?.authority).toBe('PARADISE_APPROVED');
  expect(ctl?.source?.revision).toBe('367');
  expect(ctl?.rules).toEqual(expect.arrayContaining([
    expect.stringMatching(/written and verbal test with an 85% proficiency standard/i),
    expect.stringMatching(/Sales Manager determines readiness for independent issued appointments/i),
    expect.stringMatching(/ride-along evaluations with written observation reports/i),
    expect.stringMatching(/financing options, paperwork, pricing, POS\/DNS systems/i),
    expect.stringMatching(/full compliance with sales tools, systems, processes/i),
    expect.stringMatching(/Issuing assets does not by itself prove certification/i)
  ]));
  expect(ctl?.unresolved).toEqual(expect.arrayContaining([
    expect.stringMatching(/written Sales Rep exam/i),
    expect.stringMatching(/verbal-test script/i),
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
  await page.getByText('Certification artifacts still missing',{exact:true}).click();
  await expect(page.getByText(/Actual current written Sales Rep exam/i)).toBeVisible();
  await expect(page.getByText(/Final combined Sales Rep certification checklist and system of record/i)).toBeVisible();
  await expect(page.getByText(/CURRENT POLICY REQUIRED — PROCEDURE GATE — HOLD/i)).toBeVisible();
});

test('pricing and financing control path uses live tools without unlocking dynamic procedures',async({page})=>{
  await page.goto('/index.html');
  const ctl=await page.evaluate(()=>window.PU_SALES_PRICING_FINANCE_CONTROL);
  expect(ctl?.status).toBe('PARTIAL_SOURCE_CLOSURE');
  expect(ctl?.asOf).toBe('2026-08-16');
  expect(ctl?.rules).toEqual(expect.arrayContaining([
    expect.stringMatching(/current Paradise-approved price configured in the live sales system/i),
    expect.stringMatching(/DealDesk and manager-approval controls/i),
    expect.stringMatching(/does not authorize a Leap Lending application workflow/i)
  ]));
  expect(ctl?.sources?.map(x=>x.id)).toEqual(expect.arrayContaining(['sales-workbook-v3','dealdeck-v191','sales-meeting-2026-03-16','vytex-price-book-2025-09-06']));
  expect(ctl?.sources?.every(x=>x.authority==='REFERENCE')).toBeTruthy();
  expect(ctl?.unresolved).toEqual(expect.arrayContaining([
    expect.stringMatching(/discount authorization/i),
    expect.stringMatching(/lender application/i),
    expect.stringMatching(/Contract execution/i),
    expect.stringMatching(/cancellation \/ rescission/i),
    expect.stringMatching(/CRM handoff/i)
  ]));
  await page.locator('#nTrain').click();await page.getByRole('button',{name:/Career Path/}).first().click();await page.getByRole('button',{name:/6\. Sales Rep/}).click();
  await expect(page.getByText(/Current pricing & financing control path/i)).toBeVisible();
  await expect(page.getByText(/PARTIAL SOURCE CLOSURE/i).first()).toBeVisible();
  await expect(page.getByText(/Do not quote from memory or from a static training PDF/i)).toBeVisible();
  await expect(page.getByText(/Never bypass an approval indicator/i)).toBeVisible();
  await expect(page.getByText(/does not authorize a Leap Lending application workflow/i)).toBeVisible();
  await expect(page.getByText(/CURRENT POLICY REQUIRED — PROCEDURE GATE — HOLD/i)).toBeVisible();
  await expect(page.getByRole('button',{name:/Retail Close|Qualification|Major Close|Button-Up/i})).toHaveCount(0);
});

test('contract cancellation and handoff controls teach current boundaries without exposing customer records or unlocking legal procedure',async({page})=>{
  await page.goto('/index.html');
  const ctl=await page.evaluate(()=>window.PU_SALES_CONTRACT_HANDOFF_CONTROL);
  expect(ctl?.status).toBe('PARTIAL_SOURCE_CLOSURE');
  expect(ctl?.asOf).toBe('2026-08-16');
  expect(ctl?.rules).toEqual(expect.arrayContaining([
    expect.stringMatching(/review the actual job, product, measurement\/specification, price\/payment, and customer details before signature/i),
    expect.stringMatching(/Do not alter the notice language/i),
    expect.stringMatching(/not authority for a sales rep to approve a cancellation, refund, deadline, or amount/i),
    expect.stringMatching(/RESULT\/RELEASE/i),
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
    expect.stringMatching(/manager TO procedure/i)
  ]));
  await page.locator('#nTrain').click();await page.getByRole('button',{name:/Career Path/}).first().click();await page.getByRole('button',{name:/6\. Sales Rep/}).click();
  await expect(page.getByText(/Contract, cancellation & handoff controls/i)).toBeVisible();
  await expect(page.getByText(/do not bypass review or hand-edit controlled legal pages/i)).toBeVisible();
  await expect(page.getByText(/Do not alter the notice language/i)).toBeVisible();
  await expect(page.getByText(/not authority for a sales rep to approve a cancellation, refund, deadline, or amount/i)).toBeVisible();
  await expect(page.getByText(/Verify the handoff succeeded/i)).toBeVisible();
  await expect(page.getByText(/If the normal system handoff fails, escalate the failure and confirm recovery/i)).toBeVisible();
  await page.getByText('Current operational evidence',{exact:true}).click();
  await expect(page.getByText(/PRIVACY CONTROL/i)).toBeVisible();
  await expect(page.getByText(/customer-specific contracts and email threads.*not linked/i)).toBeVisible();
  await expect(page.getByText(/CURRENT POLICY REQUIRED — PROCEDURE GATE — HOLD/i)).toBeVisible();
  await expect(page.getByRole('button',{name:/Retail Close|Qualification|Major Close|Button-Up/i})).toHaveCount(0);
});
