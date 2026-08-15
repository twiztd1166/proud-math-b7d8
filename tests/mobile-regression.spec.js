import {test,expect} from '@playwright/test';

async function pick(page,name){
  await page.getByPlaceholder('Start typing a city…').fill(name);
  await page.locator('.opt').filter({hasText:name}).first().click();
}

async function setupGo(page,address='123 Test Route'){
  await page.goto('/index.html');
  await pick(page,'Dania');
  await page.getByRole('button',{name:/RUN DAILY CHECK/}).click();
  await page.getByPlaceholder('Manager name').fill('Test Manager');
  await page.getByPlaceholder('Neighborhood / route').fill('Test Route A');
  await page.getByPlaceholder('Exact street address or boundary').fill(address);
  await page.getByRole('checkbox').check();
  await page.getByRole('button',{name:/START 5 CHECKS/}).click();
}

const dashboard=page=>page.locator('section.card.essentials');
const fieldValue=(page,name)=>dashboard(page).locator(`[data-field="${name}"] .val`);

test('city page is a one-screen manager decision dashboard',async({page})=>{
  await page.goto('/index.html');
  await pick(page,'Boca Raton');
  const d=dashboard(page);
  await expect(page.locator('.traffic')).toContainText('CANVASS');
  await expect(d.getByText('FIELD ANSWERS')).toBeVisible();
  await expect(d.getByText('Hours',{exact:true})).toBeVisible();
  await expect(d.getByText('Door hanger',{exact:true})).toBeVisible();
  await expect(d.getByText('Courtesy notice',{exact:true})).toBeVisible();
  await expect(d.getByText('Always',{exact:true})).toBeVisible();
  await expect(fieldValue(page,'always')).toContainText('NEVER USE A USPS MAILBOX');
  await expect(page.getByText('Details & sources')).toBeVisible();
  await expect(page.getByText('More canvassing details')).toHaveCount(0);
  await expect(page.getByText('More door-hanger details')).toHaveCount(0);
  await expect(page.getByText('More courtesy-notice details')).toHaveCount(0);
  await expect(page.getByText('Reference documents')).toHaveCount(0);
});

test('specifically allowed doorknob placement is explicit on the first screen',async({page})=>{
  await page.goto('/index.html');
  const name=await page.evaluate(()=>{
    const r=window.PCM_DATA.records.find(x=>/HANG ON (?:FRONT )?KNOB/i.test(String(x.hangerMode||'')));
    if(!r)throw new Error('No verified knob/handle sample found');
    return r.name;
  });
  await pick(page,name);
  await expect(fieldValue(page,'door-hanger')).toHaveText('YES — HANG ON FRONT DOORKNOB / HANDLE.');
});

test('non-knob placement is equally explicit on the first screen',async({page})=>{
  await page.goto('/index.html');
  const name=await page.evaluate(()=>{
    const r=window.PCM_DATA.records.find(x=>/SECURE PRIVATE-ENTRY/i.test(String(x.hangerMode||'')));
    if(!r)throw new Error('No secure private-entry sample found');
    return r.name;
  });
  await pick(page,name);
  await expect(fieldValue(page,'door-hanger')).toHaveText('YES — LEAVE AT FRONT ENTRY. DO NOT USE THE KNOB / HANDLE.');
});

test('unresolved hours stay canvassable and do not expose audit language',async({page})=>{
  await page.goto('/index.html');
  await pick(page,'Boynton Beach');
  await expect(page.locator('.traffic')).toContainText('CANVASS');
  await expect(page.getByRole('button',{name:/RUN DAILY CHECK/})).toBeVisible();
  await expect(fieldValue(page,'hours')).toHaveText('NOT CONFIRMED — use Paradise’s normal route schedule.');
  const text=await page.locator('body').innerText();
  expect(text).not.toMatch(/HOURS TEXT BLOCKER|controlled rationale|legal classification|operative text|targeted current|re-audit|do not invent|inference|SECURE PRIVATE-ENTRY|KNOB NOT SPECIFICALLY VERIFIED|COURTESY TEXT BLOCKER/i);
  await page.getByRole('button',{name:/RUN DAILY CHECK/}).click();
  await expect(page.getByRole('heading',{name:'Daily Check'})).toBeVisible();
});

test('both NO-GOs still block canvassing',async({page})=>{
  await page.goto('/index.html');
  for(const name of ['Punta Gorda','Tarpon Springs']){
    await pick(page,name);
    await expect(page.locator('.traffic')).toContainText('DO NOT CANVASS');
    await expect(page.getByRole('button',{name:/DO NOT CANVASS/})).toBeVisible();
    if(name==='Punta Gorda')await page.getByRole('button',{name:'New search'}).click();
  }
});

test('commercial hanger and courtesy notice remain separate decisions',async({page})=>{
  await page.goto('/index.html');
  await pick(page,'New Port Richey');
  await expect(fieldValue(page,'door-hanger')).toHaveText('NO — take the hanger with you.');
  await expect(fieldValue(page,'courtesy-notice')).not.toHaveText('NO — take the hanger with you.');
});

test('details and source documents remain available without cluttering first screen',async({page})=>{
  await page.goto('/index.html');
  await pick(page,'Apollo Beach');
  await page.getByText('Details & sources').click();
  await expect(page.getByRole('link',{name:'Municipality master PDF'})).toHaveAttribute('href',/1GrHvdIupQiANktfoeC_9aEwnSGlzDOgl/);
  await expect(page.getByRole('link',{name:'Rules sheet'})).toHaveAttribute('href',/1IuiNXffS7cUOmZbW91IJ5L8J3jz_WX-czfueveIp4t8/);
  await expect(page.locator('.sourceRef').first()).toContainText('Official source 1');
});

test('any newer approved app version blocks field use until update',async({page})=>{
  await page.goto('/index.html');
  const meta={validated:true,version:'2026.08.14-v3.8',snapshot:'2026-08-14',datasetSha256:'d347c695c7693cb9d0944a492d395f8c23c9d5af54c6a8aad59dc1cdbbf1caf0',url:'https://example.test/validated-v38/index.html'};
  const state=await page.evaluate(meta=>{
    eval('pcmLatest = meta');
    pcmWriteUpdateLock(meta);
    pcmApplyDeployBlock();
    pcmHealth();
    return{text:document.querySelector('#pcmUpdateNow')?.textContent||'',block:window.PCM_DEPLOY_BLOCK_REASON||''};
  },meta);
  expect(state.text).toContain('UPDATE NOW');
  expect(state.block).toMatch(/newer approved app version/i);
});

test('required route identity and five PASS checks produce a v3.7 record',async({page})=>{
  await setupGo(page);
  for(let i=0;i<5;i++)await page.getByRole('button',{name:/PASS/}).click();
  await expect(page.locator('.finalDecision')).toContainText('APPROVED TO CANVASS');
  await expect(page.locator('.savedBanner')).toContainText('SAVED ON THIS PHONE');
  await expect(page.locator('.finalFacts')).toContainText('2026.08.14-v3.7');
  await page.getByRole('button',{name:'History'}).click();
  await expect(page.getByRole('heading',{name:'Daily Check History'})).toBeVisible();
});

test('STOP and REVIEW still prevent canvassing',async({page})=>{
  await setupGo(page);
  await page.getByRole('button',{name:/STOP/}).click();
  await expect(page.locator('.finalDecision')).toContainText('DO NOT CANVASS');
  await page.getByRole('button',{name:'START NEW ROUTE'}).click();
  await pick(page,'Dania');
  await page.getByRole('button',{name:/RUN DAILY CHECK/}).click();
  await page.getByPlaceholder('Manager name').fill('Test Manager');
  await page.getByPlaceholder('Neighborhood / route').fill('Test Route B');
  await page.getByPlaceholder('Exact street address or boundary').fill('456 Test Route');
  await page.getByRole('checkbox').check();
  await page.getByRole('button',{name:/START 5 CHECKS/}).click();
  await page.getByRole('button',{name:/REVIEW/}).click();
  await expect(page.locator('.finalDecision')).toContainText('DO NOT CANVASS');
});

test('PWA metadata, provenance and service worker are present',async({page})=>{
  await page.goto('/index.html');
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href','manifest.webmanifest');
  await expect.poll(async()=>page.evaluate(()=>navigator.serviceWorker?.ready.then(()=>true).catch(()=>false))).toBeTruthy();
  await expect(page.locator('#appHealth')).toContainText('2026.08.14-v3.7');
  await expect.poll(async()=>page.evaluate(()=>window.PCM_PROVENANCE?.datasetSha256)).toMatch(/^[0-9a-f]{64}$/);
});

test('malformed phone storage fails safe instead of crashing',async({page})=>{
  await page.goto('/index.html');
  await page.evaluate(()=>{localStorage.pcmFavorites='{bad';localStorage.pcmRecent='not-json';localStorage.pcmReleaseHistoryV1='{broken'});
  await page.reload();
  await expect(page.getByRole('heading',{name:'Can I canvass here?'})).toBeVisible();
  await page.getByRole('button',{name:'History'}).click();
  await expect(page.getByText('No Daily Checks yet')).toBeVisible();
});
