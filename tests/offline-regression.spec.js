import {test,expect} from '@playwright/test';
import {spawn} from 'node:child_process';

test.describe.configure({retries:0});
async function pick(page,name){await page.getByPlaceholder('Start typing a city…').fill(name);await page.locator('.opt').filter({hasText:name}).first().click()}
async function waitForServer(url,timeout=10000){const end=Date.now()+timeout;while(Date.now()<end){try{const r=await fetch(url);if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,150))}throw new Error('Offline-test origin did not start')}

test('cached iPhone app keeps the v3.11 field dashboard and safe hours/placement answers offline',async({page})=>{
  const origin='http://127.0.0.1:4183';
  const server=spawn('python3',['-m','http.server','4183','--bind','127.0.0.1'],{cwd:process.cwd(),stdio:'ignore'});
  try{
    await waitForServer(origin+'/index.html');
    await page.goto(origin+'/index.html');
    await expect.poll(async()=>page.evaluate(async()=>{await navigator.serviceWorker.ready;const keys=await caches.keys();const key=keys.find(k=>k.startsWith('pcm-field-'));if(!key)return{index:false,key:null};const cache=await caches.open(key);return{index:!!(await cache.match('./index.html')),key}}),{timeout:15000}).toMatchObject({index:true,key:'pcm-field-v3-11-2026-08-14'});
    await page.reload({waitUntil:'domcontentloaded'});
    await expect.poll(async()=>page.evaluate(()=>!!navigator.serviceWorker.controller),{timeout:10000}).toBeTruthy();
    server.kill('SIGTERM');await new Promise(r=>setTimeout(r,750));
    await expect.poll(async()=>{try{await fetch(origin+'/index.html');return false}catch{return true}},{timeout:5000}).toBeTruthy();
    await page.reload({waitUntil:'domcontentloaded',timeout:15000});

    await pick(page,'Boca Raton');
    const d=page.locator('section.card.essentials');
    await expect(page.locator('.traffic h3')).toHaveText('YES — CANVASSING ALLOWED');
    await expect(d.locator('[data-field="hours"] .val')).toHaveText('Use Paradise’s normal route schedule.');
    await expect(d.locator('[data-field="door-hanger"] .val')).toHaveText('YES — HANG ON FRONT DOORKNOB / HANDLE.');
    await expect(d.locator('[data-field="courtesy-notice"] .val')).toHaveText('YES — HANG ON FRONT DOORKNOB / HANDLE.');
    await page.getByRole('button',{name:'New search'}).click();

    await pick(page,'Miami Gardens');
    await expect(page.locator('[data-field="hours"] .val')).toHaveText('8:00 AM - 7:00 PM unless prior consent');
    await expect(page.locator('[data-field="door-hanger"] .val')).toContainText('DO NOT ATTACH');
    await page.getByRole('button',{name:'New search'}).click();

    await pick(page,'Deerfield Beach');
    await expect(page.locator('[data-field="hours"] .val')).toHaveText('Use Paradise’s normal route schedule.');
    await page.getByRole('button',{name:'New search'}).click();

    await pick(page,'Boynton Beach');
    await expect(page.locator('[data-field="hours"] .val')).toHaveText('Hours not confirmed - use Paradise’s normal route schedule.');
    await page.getByRole('button',{name:'New search'}).click();

    await pick(page,'Dania');
    await page.getByRole('button',{name:/RUN DAILY CHECK/}).click();
    await page.getByPlaceholder('Manager name').fill('Offline Test Manager');
    await page.getByPlaceholder('Neighborhood / route').fill('Offline Route A');
    await page.getByPlaceholder('Exact street address or boundary').fill('789 Offline Test Route');
    await page.getByRole('checkbox').check();
    await page.getByRole('button',{name:/START 5 CHECKS/}).click();
    for(let i=0;i<5;i++)await page.getByRole('button',{name:/PASS/}).click();
    await expect(page.locator('.finalDecision')).toContainText('APPROVED TO CANVASS');
    await expect(page.locator('.finalFacts')).toContainText('2026.08.14-v3.11');
  }finally{if(server.exitCode===null)server.kill('SIGTERM')}
});
