import {test,expect} from '@playwright/test';
import {spawn} from 'node:child_process';

test.describe.configure({retries:0});

async function pick(page,name){
  await page.getByPlaceholder('Start typing a city…').fill(name);
  await page.locator('.opt').filter({hasText:name}).first().click();
}

async function waitForServer(url,timeout=10000){
  const end=Date.now()+timeout;
  while(Date.now()<end){
    try{const r=await fetch(url);if(r.ok)return}catch{}
    await new Promise(r=>setTimeout(r,150));
  }
  throw new Error('Offline-test origin did not start');
}

test('cached iPhone app works end-to-end after its origin server is physically unavailable',async({page})=>{
  const origin='http://127.0.0.1:4183';
  const server=spawn('python3',['-m','http.server','4183','--bind','127.0.0.1'],{
    cwd:process.cwd(),stdio:'ignore'
  });
  try{
    await waitForServer(origin+'/index.html');
    await page.goto(origin+'/index.html');
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

    server.kill('SIGTERM');
    await new Promise(r=>setTimeout(r,750));
    await expect.poll(async()=>{
      try{await fetch(origin+'/index.html');return false}catch{return true}
    },{timeout:5000}).toBeTruthy();

    await page.reload({waitUntil:'domcontentloaded',timeout:15000});
    await expect(page.getByRole('heading',{name:'Can I canvass here?'})).toBeVisible();

    await pick(page,'Boynton Beach');
    await expect(page.locator('.traffic')).toContainText('GO — NO PAPERWORK');
    await expect(page.getByRole('button',{name:/HOURS BLOCKER — COMMERCIAL CANVASS HOLD/})).toBeVisible();
    await expect(page.getByText('COMMERCIAL DOOR HANGER',{exact:true})).toBeVisible();
    await expect(page.getByText('INSTALLATION COURTESY NOTICE • CURRENT',{exact:true})).toBeVisible();
    await page.getByText('Official sources / offline proof').click();
    await expect(page.getByText(/Authority references in controlled rationale/)).toBeVisible();
    await page.getByRole('button',{name:'New search'}).click();
    await pick(page,'Punta Gorda');
    await expect(page.locator('.traffic')).toContainText('NO-GO — DO NOT DEPLOY');
    await page.getByRole('button',{name:'New search'}).click();
    await pick(page,'Tarpon Springs');
    await expect(page.locator('.traffic')).toContainText('NO-GO — DO NOT DEPLOY');
    await page.getByRole('button',{name:'New search'}).click();

    await pick(page,'Dania');
    await page.getByRole('button',{name:/START COMMERCIAL CANVASS RELEASE/}).click();
    await page.getByPlaceholder('Manager name').fill('Offline Test Manager');
    await page.getByPlaceholder('Neighborhood / route').fill('Offline Route A');
    await page.getByPlaceholder('Exact street address or boundary').fill('789 Offline Test Route');
    await page.getByRole('checkbox').check();
    await page.getByRole('button',{name:/START 5 CHECKS/}).click();
    for(let i=0;i<5;i++)await page.getByRole('button',{name:/PASS/}).click();
    await expect(page.locator('.finalDecision')).toContainText('DEPLOY');
    await expect(page.locator('.savedBanner')).toContainText('SAVED ON THIS DEVICE');
    await expect(page.locator('.finalFacts')).toContainText('2026.08.14-v3.3');
    await page.getByRole('button',{name:'View history'}).click();
    await expect(page.locator('.historyCard').first()).toContainText('789 Offline Test Route');
    await expect(page.locator('.historyCard').first()).toContainText('Dania');
  }finally{
    if(server.exitCode===null)server.kill('SIGTERM');
  }
});
