import {test,expect} from '@playwright/test';

async function pick(page,name){await page.getByPlaceholder('Start typing a city…').fill(name);await page.locator('.opt').filter({hasText:name}).first().click()}
async function setupGo(page,address='123 Test Route'){await page.goto('/index.html');await pick(page,'Dania');await page.getByRole('button',{name:/RUN DAILY CHECK/}).click();await page.getByPlaceholder('Manager name').fill('Test Manager');await page.getByPlaceholder('Neighborhood / route').fill('Test Route A');await page.getByPlaceholder('Exact street address or boundary').fill(address);await page.getByRole('checkbox').check();await page.getByRole('button',{name:/START 5 CHECKS/}).click()}
const dashboard=page=>page.locator('section.card.essentials');const fieldValue=(page,name)=>dashboard(page).locator(`[data-field="${name}"] .val`);

test('Boca Raton gives explicit field answers',async({page})=>{await page.goto('/index.html');await pick(page,'Boca Raton');await expect(page.locator('.traffic h3')).toHaveText('YES — CANVASSING ALLOWED');await expect(fieldValue(page,'hours')).toHaveText('Use Paradise’s normal route schedule.');await expect(fieldValue(page,'door-hanger')).toHaveText('YES — HANG ON FRONT DOORKNOB / HANDLE.');await expect(fieldValue(page,'courtesy-notice')).toHaveText('YES — HANG ON FRONT DOORKNOB / HANDLE.')});

test('What to say is a permit permission and courtesy objection tool',async({page})=>{
  await page.goto('/index.html');await pick(page,'Boca Raton');
  await expect(page.getByRole('button',{name:'Permit / permission'})).toBeVisible();
  await page.getByRole('button',{name:'Permit / permission'}).click();
  const panel=page.locator('#say');
  await expect(panel).toHaveAttribute('open','');
  await expect(panel).toContainText('IF THEY ASK ABOUT A PERMIT');
  await expect(panel).toContainText('Our compliance review for Boca Raton does not require a separate route-specific canvasser permit for this appointment-setting activity.');
  await expect(panel).toContainText('IF THEY SAY YOU NEED PERMISSION');
  await expect(panel).toContainText('resident, property, HOA, security, gate, or private-access direction');
  await expect(panel).toContainText('IF THEY ASK ABOUT THE COURTESY NOTICE');
  await expect(panel).toContainText('installation-day courtesy notice, not a sales offer');
  await expect(panel).toContainText('IF THEY STILL OBJECT');
  await expect(panel).toContainText('Government or law enforcement: do not argue or debate the law');
});

test('NO-GO permit response never says permit is unnecessary',async({page})=>{
  await page.goto('/index.html');
  for(const name of ['Punta Gorda','Tarpon Springs']){
    await pick(page,name);await page.getByRole('button',{name:'Permit / permission'}).click();
    const text=await page.locator('#say').innerText();
    expect(text).toMatch(/does not deploy|not approved|do not canvass/i);
    expect(text).not.toMatch(/does not require a separate route-specific canvasser permit/i);
    if(name==='Punta Gorda')await page.getByRole('button',{name:'New search'}).click();
  }
});

test('courtesy objection response follows the courtesy release',async({page})=>{
  await page.goto('/index.html');await pick(page,'Fort Pierce');await page.getByRole('button',{name:'Permit / permission'}).click();
  await expect(page.locator('#say')).toContainText('I can hand it directly to you; I will not leave it unattended.');
  await page.getByRole('button',{name:'New search'}).click();await pick(page,'Deerfield Beach');await page.getByRole('button',{name:'Permit / permission'}).click();
  await expect(page.locator('#say')).toContainText('Do not use the courtesy notice here. Take it with you');
});

test('real jurisdiction split stays YES while showing address rule',async({page})=>{await page.goto('/index.html');await pick(page,'Apollo Beach');await expect(page.locator('.traffic h3')).toHaveText('YES — CANVASSING ALLOWED');await expect(dashboard(page).locator('[data-field="address-rule"] .val')).toContainText('ADDRESS CHANGES THE LOCAL RULES')});

test('Miami Gardens remains non-affixed',async({page})=>{await page.goto('/index.html');await pick(page,'Miami Gardens');await expect(fieldValue(page,'door-hanger')).toContainText('DO NOT ATTACH');await expect(fieldValue(page,'courtesy-notice')).toContainText('DO NOT ATTACH')});

test('unresolved hours stay canvassable',async({page})=>{await page.goto('/index.html');await pick(page,'Boynton Beach');await expect(page.locator('.traffic h3')).toHaveText('YES — CANVASSING ALLOWED');await expect(fieldValue(page,'hours')).toHaveText('Hours not confirmed - use Paradise’s normal route schedule.');await expect(fieldValue(page,'door-hanger')).toHaveText('YES — HANG ON FRONT DOORKNOB / HANDLE.')});

test('both NO-GOs still block canvassing',async({page})=>{await page.goto('/index.html');for(const name of ['Punta Gorda','Tarpon Springs']){await pick(page,name);await expect(page.locator('.traffic')).toContainText('NO — DO NOT CANVASS');if(name==='Punta Gorda')await page.getByRole('button',{name:'New search'}).click()}});

test('commercial and courtesy placement remain separate',async({page})=>{await page.goto('/index.html');await pick(page,'New Port Richey');await expect(fieldValue(page,'door-hanger')).toHaveText('NO — take the hanger with you.');await expect(fieldValue(page,'courtesy-notice')).toHaveText('YES — HANG ON FRONT DOORKNOB / HANDLE.');await page.getByRole('button',{name:'New search'}).click();await pick(page,'Tarpon Springs');await expect(fieldValue(page,'door-hanger')).toContainText('NO AT FRONT DOOR');await expect(fieldValue(page,'courtesy-notice')).toHaveText('YES — HANG ON FRONT DOORKNOB / HANDLE.')});

test('details and source documents remain available',async({page})=>{await page.goto('/index.html');await pick(page,'Apollo Beach');await page.getByText('Details & sources').click();await expect(page.getByRole('link',{name:'Municipality master PDF'})).toHaveAttribute('href',/1GrHvdIupQiANktfoeC_9aEwnSGlzDOgl/);await expect(page.getByRole('link',{name:'Rules sheet'})).toHaveAttribute('href',/1IuiNXffS7cUOmZbW91IJ5L8J3jz_WX-czfueveIp4t8/)});

test('newer approved version blocks until update',async({page})=>{await page.goto('/index.html');const meta={validated:true,version:'2026.08.14-v3.13',snapshot:'2026-08-14',datasetSha256:'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',url:'https://example.test/validated-v313/index.html'};const state=await page.evaluate(meta=>{eval('pcmLatest = meta');pcmWriteUpdateLock(meta);pcmApplyDeployBlock();pcmHealth();return{text:document.querySelector('.healthUpdate')?.textContent||'',block:window.PCM_DEPLOY_BLOCK_REASON||''}},meta);expect(state.text).toMatch(/UPDATE/);expect(state.block).toMatch(/newer approved app version|new approved rules/i)});

test('five PASS checks produce a self-contained v3.12 record',async({page})=>{await setupGo(page);for(let i=0;i<5;i++)await page.getByRole('button',{name:/PASS/}).click();await expect(page.locator('.finalDecision')).toContainText('APPROVED TO CANVASS');await expect(page.locator('.finalFacts')).toContainText('2026.08.14-v3.12');await expect(page.locator('.finalFieldAnswers')).toContainText('FIELD ANSWERS — KEEP THIS SCREEN OPEN')});

test('STOP prevents canvassing',async({page})=>{await setupGo(page);await page.getByRole('button',{name:/STOP/}).click();await expect(page.locator('.finalDecision')).toContainText('DO NOT CANVASS')});

test('PWA metadata and service worker are v3.12',async({page})=>{await page.goto('/index.html');await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href','manifest.webmanifest');await expect.poll(async()=>page.evaluate(()=>navigator.serviceWorker?.ready.then(()=>true).catch(()=>false))).toBeTruthy();await expect(page.locator('#appHealth')).toContainText('2026.08.14-v3.12');await expect.poll(async()=>page.evaluate(()=>window.PCM_PROVENANCE?.datasetSha256)).toMatch(/^[0-9a-f]{64}$/)});

test('malformed phone storage fails safe',async({page})=>{await page.goto('/index.html');await page.evaluate(()=>{localStorage.pcmFavorites='{bad';localStorage.pcmRecent='not-json';localStorage.pcmReleaseHistoryV1='{broken'});await page.reload();await expect(page.getByRole('heading',{name:'Can I canvass here?'})).toBeVisible()});
