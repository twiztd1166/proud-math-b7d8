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
