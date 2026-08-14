import {test,expect} from '@playwright/test';

test.describe.configure({retries:0});

async function pick(page,name){
  await page.getByPlaceholder('Start typing a city…').fill(name);
  await page.locator('.opt').filter({hasText:name}).first().click();
}

test('cached iPhone app works end-to-end after the origin server is physically unavailable',async({page})=>{
  const pid=Number(process.env.PCM_TEST_SERVER_PID||0);
  if(!pid)throw new Error('PCM_TEST_SERVER_PID missing');

  await page.goto('/index.html');
  await expect(page.getByRole('heading',{name:'Can I canvass here?'})).toBeVisible();

  await expect.poll(async()=>page.evaluate(async()=>{
    await navigator.serviceWorker.ready;
    const keys=await caches.keys();
    const key=keys.find(k=>k.startsWith('pcm-field-'));
    if(!key)return {count:0,index:false};
    const cache=await caches.open(key);
    const index=await cache.match('./index.html');
    return {count:(await cache.keys()).length,index:!!index};
  }),{timeout:15000}).toMatchObject({index:true});

  await page.reload({waitUntil:'domcontentloaded'});
  await expect.poll(async()=>page.evaluate(()=>!!navigator.serviceWorker.controller),{timeout:10000}).toBeTruthy();
  await expect(page.evaluate(async()=>!!(await caches.match('./index.html')))).resolves.toBeTruthy();

  process.kill(pid,'SIGTERM');
  await new Promise(r=>setTimeout(r,750));

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
