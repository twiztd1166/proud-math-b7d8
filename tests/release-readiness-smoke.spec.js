import {test,expect} from '@playwright/test';

test('future v3.13 code-only release prompts update without blocking current field rules',async({page})=>{
  await page.goto('/index.html');
  const state=await page.evaluate(()=>{
    const meta={validated:true,version:'2026.08.16-v3.13',snapshot:window.PCM_PROVENANCE.snapshot,datasetSha256:window.PCM_PROVENANCE.datasetSha256,url:'https://example.test/v313/index.html'};
    pcmLatest=meta;pcmApplyDeployBlock();pcmHealth();
    return{current:window.PCM_BUILD_VERSION,newer:pcmMetaIsNewer(meta),actionableData:pcmMetaIsActionable(meta),block:window.PCM_DEPLOY_BLOCK_REASON||'',updateText:document.querySelector('.healthUpdate')?.textContent||'',ruleBlock:document.querySelector('.healthBlock')?.textContent||''};
  });
  expect(state.current).toBe('2026.08.14-v3.12');
  expect(state.newer).toBeTruthy();
  expect(state.actionableData).toBeFalsy();
  expect(state.block).toBe('');
  expect(state.updateText).toMatch(/UPDATE APP/);
  expect(state.ruleBlock).toBe('');
  await page.getByPlaceholder('Start typing a city…').fill('Boca Raton');
  await page.locator('.opt').filter({hasText:'Boca Raton'}).first().click();
  await expect(page.locator('.traffic h3')).toHaveText('YES — CANVASSING ALLOWED');
});

test('release candidate keeps controlled jurisdiction SHA unchanged',async({page})=>{
  await page.goto('/index.html');
  await expect.poll(async()=>page.evaluate(()=>window.PCM_PROVENANCE?.datasetSha256)).toBe('a98b8badf4c3df616fb091eb32ff85f70682f226e4fcd55591f3784b37abe200');
  const counts=await page.evaluate(()=>({records:window.PCM_DATA.records.length,go:window.PCM_DATA.meta.goCount,noGo:window.PCM_DATA.meta.noGoCount}));
  expect(counts).toEqual({records:78,go:76,noGo:2});
});
