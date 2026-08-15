import {test,expect} from '@playwright/test';
import {spawn} from 'node:child_process';
test.describe.configure({retries:0});
async function pick(page,name){await page.getByPlaceholder('Start typing a city…').fill(name);await page.locator('.opt').filter({hasText:name}).first().click()}
async function waitForServer(url,timeout=10000){const end=Date.now()+timeout;while(Date.now()<end){try{const r=await fetch(url);if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,150))}throw new Error('Offline-test origin did not start')}

test('cached iPhone v3.12 keeps field answers and permit permission scripts offline',async({page})=>{
  const origin='http://127.0.0.1:4183';const server=spawn('python3',['-m','http.server','4183','--bind','127.0.0.1'],{cwd:process.cwd(),stdio:'ignore'});
  try{
    await waitForServer(origin+'/index.html');await page.goto(origin+'/index.html');
    await expect.poll(async()=>page.evaluate(async()=>{await navigator.serviceWorker.ready;const keys=await caches.keys();const key=keys.find(k=>k.startsWith('pcm-field-'));if(!key)return{index:false,key:null};const cache=await caches.open(key);return{index:!!(await cache.match('./index.html')),key}}),{timeout:15000}).toMatchObject({index:true,key:'pcm-field-v3-12-2026-08-14'});
    await page.reload({waitUntil:'domcontentloaded'});await expect.poll(async()=>page.evaluate(()=>!!navigator.serviceWorker.controller),{timeout:10000}).toBeTruthy();server.kill('SIGTERM');await new Promise(r=>setTimeout(r,750));await expect.poll(async()=>{try{await fetch(origin+'/index.html');return false}catch{return true}},{timeout:5000}).toBeTruthy();await page.reload({waitUntil:'domcontentloaded',timeout:15000});
    await pick(page,'Boca Raton');await expect(page.locator('[data-field="door-hanger"] .val')).toHaveText('YES — HANG ON FRONT DOORKNOB / HANDLE.');await page.getByRole('button',{name:'Permit / permission'}).click();const panel=page.locator('#say');await expect(panel).toContainText('Our compliance review for Boca Raton does not require a separate route-specific canvasser permit');await expect(panel).toContainText('installation-day courtesy notice, not a sales offer');await expect(panel).toContainText('Government or law enforcement: do not argue or debate the law');
    await page.getByRole('button',{name:'New search'}).click();await pick(page,'Boynton Beach');await expect(page.locator('[data-field="hours"] .val')).toHaveText('Hours not confirmed - use Paradise’s normal route schedule.');
    await page.getByRole('button',{name:'New search'}).click();await pick(page,'Dania');await page.getByRole('button',{name:/RUN DAILY CHECK/}).click();await page.getByPlaceholder('Manager name').fill('Offline Test Manager');await page.getByPlaceholder('Neighborhood / route').fill('Offline Route A');await page.getByPlaceholder('Exact street address or boundary').fill('789 Offline Test Route');await page.getByRole('checkbox').check();await page.getByRole('button',{name:/START 5 CHECKS/}).click();for(let i=0;i<5;i++)await page.getByRole('button',{name:/PASS/}).click();await expect(page.locator('.finalDecision')).toContainText('APPROVED TO CANVASS');await expect(page.locator('.finalFacts')).toContainText('2026.08.14-v3.12');
  }finally{if(server.exitCode===null)server.kill('SIGTERM')}
});
