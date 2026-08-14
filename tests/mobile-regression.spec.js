import {test,expect} from '@playwright/test';
async function pick(page,name){
  await page.getByPlaceholder('Start typing a city…').fill(name);
  await page.locator('.opt').filter({hasText:name}).first().click();
}
async function setupGo(page){
  await page.goto('/index.html');
  await pick(page,'Boynton Beach');
  await page.getByRole('button',{name:/START ROUTE RELEASE/}).click();
  await page.getByPlaceholder('Exact street address or boundary').fill('123 Test Route');
  await page.getByRole('checkbox').check();
  await page.getByRole('button',{name:/START 5 CHECKS/}).click();
}
test('controlled lookup renders GO and both NO-GOs',async({page})=>{
  await page.goto('/index.html');
  await expect(page.getByRole('heading',{name:'Can I canvass here?'})).toBeVisible();
  await pick(page,'Boynton Beach');
  await expect(page.locator('.traffic')).toContainText('GO — NO PAPERWORK');
  await page.getByRole('button',{name:'New search'}).click();
  await pick(page,'Punta Gorda');
  await expect(page.locator('.traffic')).toContainText('NO-GO — DO NOT DEPLOY');
  await page.getByRole('button',{name:'New search'}).click();
  await pick(page,'Tarpon Springs');
  await expect(page.locator('.traffic')).toContainText('NO-GO — DO NOT DEPLOY');
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
test('five PASS checks produce DEPLOY and device history',async({page})=>{
  await setupGo(page);
  for(let i=0;i<5;i++)await page.getByRole('button',{name:/PASS/}).click();
  await expect(page.locator('.finalDecision')).toContainText('DEPLOY');
  await expect(page.locator('.savedBanner')).toContainText('SAVED ON THIS DEVICE');
  await page.getByRole('button',{name:'View history'}).click();
  await expect(page.getByRole('heading',{name:'Release History'})).toBeVisible();
  await expect(page.locator('.historyCard').first()).toContainText('Boynton Beach');
});
test('STOP and ESCALATE fail closed',async({page})=>{
  await setupGo(page);
  await page.getByRole('button',{name:/STOP/}).click();
  await expect(page.locator('.finalDecision')).toContainText('DO NOT DEPLOY');
  await page.getByRole('button',{name:'START NEW ROUTE'}).click();
  await pick(page,'Boynton Beach');
  await page.getByRole('button',{name:/START ROUTE RELEASE/}).click();
  await page.getByPlaceholder('Exact street address or boundary').fill('456 Test Route');
  await page.getByRole('checkbox').check();
  await page.getByRole('button',{name:/START 5 CHECKS/}).click();
  await page.getByRole('button',{name:/ESCALATE/}).click();
  await expect(page.locator('.finalDecision')).toContainText('DO NOT DEPLOY');
});
test('PWA metadata and service worker are present',async({page})=>{
  await page.goto('/index.html');
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href','manifest.webmanifest');
  await expect.poll(async()=>page.evaluate(()=>navigator.serviceWorker?.ready.then(()=>true).catch(()=>false))).toBeTruthy();
  await expect(page.locator('#appHealth')).toContainText('Snapshot 2026-08-13');
});
