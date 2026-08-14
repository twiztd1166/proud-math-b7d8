import {test,expect} from '@playwright/test';

test.describe.configure({retries:0});

async function pick(page,name){
  await page.getByPlaceholder('Start typing a city…').fill(name);
  await page.locator('.opt').filter({hasText:name}).first().click();
}

test('cached iPhone app works end-to-end when every uncached network request is cut off',async({page,context})=>{
  await page.goto('/index.html');
  await expect(page.getByRole('heading',{name:'Can I canvass here?'})).toBeVisible();

  await expect.poll(async()=>page.evaluate(async()=>{
    await navigator.serviceWorker.ready;
    const keys=await caches.keys();
    const key=keys.find(k=>k.startsWith('pcm-field-'));
    if(!key)return 0;
    const cache=await caches.open(key);
    return (await cache.keys()).length;
  }),{timeout:15000}).toBeGreaterThan(10);

  await page.reload({waitUntil:'domcontentloaded'});
  await expect.poll(async()=>page.evaluate(()=>!!navigator.serviceWorker.controller),{timeout:10000}).toBeTruthy();

  // Playwright WebKit has an internal crash when setOffline(true) is followed by reload.
  // Blocking every uncached request exercises the same failover path without relying on that broken emulator API.
  // Requests already satisfied by the service worker are not intercepted by BrowserContext.route().
  await context.route('**/*',route=>route.abort('internetdisconnected'));
  await page.reload({waitUntil:'domcontentloaded',timeout:15000});
  await expect(page.getByRole('heading',{name:'Can I canvass here?'})).toBeVisible();

  await pick(page,'Boynton Beach');
  await expect(page.locator('.traffic')).toContainText('GO — NO PAPERWORK');
  await page.getByRole('button',{name:'New search'}).click();
  await pick(page,'Punta Gorda');
  await expect(page.locator('.traffic')).toContainText('NO-GO — DO NOT DEPLOY');
  await page.getByRole('button',{name:'New search'}).click();
  await pick(page,'Tarpon Springs');
  await expect(page.locator('.traffic')).toContainText('NO-GO — DO NOT DEPLOY');
  await page.getByRole('button',{name:'New search'}).click();

  await pick(page,'Boynton Beach');
  await page.getByRole('button',{name:/START ROUTE RELEASE/}).click();
  await page.getByPlaceholder('Exact street address or boundary').fill('789 Offline Test Route');
  await page.getByRole('checkbox').check();
  await page.getByRole('button',{name:/START 5 CHECKS/}).click();
  for(let i=0;i<5;i++)await page.getByRole('button',{name:/PASS/}).click();
  await expect(page.locator('.finalDecision')).toContainText('DEPLOY');
  await expect(page.locator('.savedBanner')).toContainText('SAVED ON THIS DEVICE');
  await page.getByRole('button',{name:'View history'}).click();
  await expect(page.locator('.historyCard').first()).toContainText('789 Offline Test Route');
});
