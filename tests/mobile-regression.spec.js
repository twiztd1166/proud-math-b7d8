import {test,expect} from '@playwright/test';
async function pick(page,name){
  await page.getByPlaceholder('Start typing a city…').fill(name);
  await page.locator('.opt').filter({hasText:name}).first().click();
}
async function setupGo(page,address='123 Test Route'){
  await page.goto('/index.html');
  await pick(page,'Boynton Beach');
  await page.getByRole('button',{name:/START ROUTE RELEASE/}).click();
  await page.getByPlaceholder('Manager name').fill('Test Manager');
  await page.getByPlaceholder('Neighborhood / route').fill('Test Route A');
  await page.getByPlaceholder('Exact street address or boundary').fill(address);
  await page.getByRole('checkbox').check();
  await page.getByRole('button',{name:/START 5 CHECKS/}).click();
}
test('controlled lookup renders current canvass, hours, hanger, courtesy and both NO-GOs',async({page})=>{
  await page.goto('/index.html');
  await expect(page.getByRole('heading',{name:'Can I canvass here?'})).toBeVisible();
  await pick(page,'Boynton Beach');
  await expect(page.locator('.traffic')).toContainText('GO — NO PAPERWORK');
  await expect(page.locator('.traffic')).toContainText('COMMERCIAL CANVASS STATUS');
  await expect(page.getByText('HOURS TEXT BLOCKER.',{exact:false})).toBeVisible();
  await expect(page.getByText('COMMERCIAL DOOR HANGER',{exact:true})).toBeVisible();
  await expect(page.getByText('INSTALLATION COURTESY NOTICE • CURRENT',{exact:true})).toBeVisible();
  await expect(page.getByText('LEAVE — SECURE PRIVATE-ENTRY / NO KNOB ASSUMPTION',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'New search'}).click();
  await pick(page,'Punta Gorda');
  await expect(page.locator('.traffic')).toContainText('NO-GO — DO NOT DEPLOY');
  await page.getByRole('button',{name:'New search'}).click();
  await pick(page,'Tarpon Springs');
  await expect(page.locator('.traffic')).toContainText('NO-GO — DO NOT DEPLOY');
});
test('permanent controlled-document links are exposed',async({page})=>{
  await page.goto('/index.html');
  await pick(page,'Apollo Beach');
  await page.getByText('Current controlled documents').click();
  await expect(page.getByRole('link',{name:'OPEN CURRENT COURTESY NOTICE'}).last()).toHaveAttribute('href',/1vGHFL0aXX0EmV65kPZRrUqs1ONupqRWi/);
  await expect(page.getByRole('link',{name:'OPEN CURRENT MUNICIPALITY MASTER PDF'})).toHaveAttribute('href',/1GrHvdIupQiANktfoeC_9aEwnSGlzDOgl/);
  await expect(page.getByRole('link',{name:'OPEN CURRENT CONTROLLED SHEET'})).toHaveAttribute('href',/1IuiNXffS7cUOmZbW91IJ5L8J3jz_WX-czfueveIp4t8/);
  await expect(page.getByRole('link',{name:'OPEN PERMANENT CANVASS MANAGER URL'})).toHaveAttribute('href','https://canvass.paradiseexteriors.com/');
});
test('browse areas by county works',async({page})=>{
  await page.goto('/index.html');
  await page.getByRole('button',{name:'BROWSE ALL AREAS'}).click();
  await expect(page.getByRole('heading',{name:'Browse Areas'})).toBeVisible();
  await page.getByRole('button',{name:/Palm Beach County/}).click();
  await expect(page.getByRole('heading',{name:'Palm Beach County'})).toBeVisible();
  await page.getByRole('button',{name:/Boynton Beach/}).click();
  await expect(page.locator('.traffic')).toContainText('GO — NO PAPERWORK');
});
test('required route identity and five PASS checks produce evidence-grade DEPLOY record',async({page})=>{
  await page.goto('/index.html');
  await pick(page,'Boynton Beach');
  await page.getByRole('button',{name:/START ROUTE RELEASE/}).click();
  const start=page.getByRole('button',{name:/START 5 CHECKS/});
  await expect(start).toBeDisabled();
  await page.getByPlaceholder('Manager name').fill('Test Manager');
  await page.getByPlaceholder('Neighborhood / route').fill('Test Route A');
  await page.getByPlaceholder('Exact street address or boundary').fill('123 Test Route');
  await page.getByRole('checkbox').check();
  await expect(start).toBeEnabled();
  await start.click();
  for(let i=0;i<5;i++)await page.getByRole('button',{name:/PASS/}).click();
  await expect(page.locator('.finalDecision')).toContainText('DEPLOY');
  await expect(page.locator('.savedBanner')).toContainText('SAVED ON THIS DEVICE');
  await expect(page.locator('.finalFacts')).toContainText('2026.08.14-v3.3');
  await expect(page.locator('.finalFacts')).toContainText(/Dataset SHA-256/);
  await expect(page.locator('.scopeBanner')).toContainText('Valid only for');
  await page.getByRole('button',{name:'View history'}).click();
  await expect(page.getByRole('heading',{name:'Release History'})).toBeVisible();
  await expect(page.locator('.historyCard').first()).toContainText('Boynton Beach');
});
test('STOP and ESCALATE fail closed with field guidance',async({page})=>{
  await setupGo(page);
  await page.getByRole('button',{name:/STOP/}).click();
  await expect(page.locator('.finalDecision')).toContainText('DO NOT DEPLOY');
  await expect(page.locator('.fieldResponse')).toContainText('What to do now');
  await page.getByRole('button',{name:'START NEW ROUTE'}).click();
  await pick(page,'Boynton Beach');
  await page.getByRole('button',{name:/START ROUTE RELEASE/}).click();
  await page.getByPlaceholder('Manager name').fill('Test Manager');
  await page.getByPlaceholder('Neighborhood / route').fill('Test Route B');
  await page.getByPlaceholder('Exact street address or boundary').fill('456 Test Route');
  await page.getByRole('checkbox').check();
  await page.getByRole('button',{name:/START 5 CHECKS/}).click();
  await page.getByRole('button',{name:/ESCALATE/}).click();
  await expect(page.locator('.finalDecision')).toContainText('DO NOT DEPLOY');
  await expect(page.locator('.fieldResponse')).toContainText('manager/compliance');
});
test('PWA metadata, provenance and service worker are present',async({page})=>{
  await page.goto('/index.html');
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href','manifest.webmanifest');
  await expect.poll(async()=>page.evaluate(()=>navigator.serviceWorker?.ready.then(()=>true).catch(()=>false))).toBeTruthy();
  await expect(page.locator('#appHealth')).toContainText('Snapshot 2026-08-14');
  await expect.poll(async()=>page.evaluate(()=>window.PCM_PROVENANCE?.datasetSha256)).toMatch(/^[0-9a-f]{64}$/);
});
test('malformed device storage fails safe instead of crashing',async({page})=>{
  await page.goto('/index.html');
  await page.evaluate(()=>{localStorage.pcmFavorites='{bad';localStorage.pcmRecent='not-json';localStorage.pcmReleaseHistoryV1='{broken'});
  await page.reload();
  await expect(page.getByRole('heading',{name:'Can I canvass here?'})).toBeVisible();
  await page.getByRole('button',{name:'History'}).click();
  await expect(page.getByText('No completed releases yet')).toBeVisible();
});
