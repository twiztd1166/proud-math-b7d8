import {test,expect} from '@playwright/test';
import {spawn} from 'node:child_process';

test.describe.configure({retries:0});
const EXPECTED_CACHE='pcm-field-v3-12-pu-v1-content5-readiness2-practice1-checks2-more1-media1-mediaui2-player3-progress1-managerhome1-governance1-2026-08-17-playerlayout1-mediaplaylists1-salespolicy1-pricingfinance1-contracthandoff1-salesgrad1-salesclose2-salesui7-financeimpl1-financeoffice1-handoff2-assessref1-mediarights1-morelinkrights1-practice2-internalmedia1-currentness1-canvasslib1-drivetoplevel1-deepaudit1-trainingux3';
async function pick(page,name){await page.getByPlaceholder('Start typing a city…').fill(name);await page.locator('.opt').filter({hasText:name}).first().click()}
async function waitForServer(url,timeout=10000){const end=Date.now()+timeout;while(Date.now()<end){try{const r=await fetch(url);if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,150))}throw new Error('Offline-test origin did not start')}

test('cached iPhone v3.12 keeps field answers and role-aware Paradise University core offline',async({page})=>{
  const origin='http://127.0.0.1:4183';
  const server=spawn('python3',['-m','http.server','4183','--bind','127.0.0.1'],{cwd:process.cwd(),stdio:'ignore'});
  try{
    await waitForServer(origin+'/index.html');await page.goto(origin+'/index.html');
    await expect.poll(async()=>page.evaluate(async expected=>{
      await navigator.serviceWorker.ready;const keys=await caches.keys(),key=keys.find(k=>k.startsWith('pcm-field-'));if(!key)return{key:null};const cache=await caches.open(key),has=async p=>!!(await cache.match(p));
      const required=['./index.html','./training-v1.js','./training-content-v1.js','./training-content-sourcefix-v1.js','./training-manager-v1-data.js','./training-sales-v1-data.js','./training-media-expanded-v1.js','./training-media-reconciliation-v1.js','./training-governance-v1.js','./training-currentness-v1.js','./training-readiness-v1.js','./training-practice-data-v2.js','./training-practice-v1.js','./training-checks-v1.js','./training-progress-state-v1.js','./training-player-v1.js','./training-media-player-gate-v1.js','./training-more-v1.js','./training-more-rights-gate-v1.js','./training-deep-audit-fixes-v1.js','./training-experience-v2.js','./plain-data.js','./field-v37.js'];
      const missing=[];for(const p of required)if(!(await has(p)))missing.push(p);return{key,expected,missing};
    },EXPECTED_CACHE),{timeout:15000}).toEqual({key:EXPECTED_CACHE,expected:EXPECTED_CACHE,missing:[]});

    await page.reload({waitUntil:'domcontentloaded'});await expect.poll(async()=>page.evaluate(()=>!!navigator.serviceWorker.controller),{timeout:10000}).toBeTruthy();server.kill('SIGTERM');await new Promise(r=>setTimeout(r,750));await expect.poll(async()=>{try{await fetch(origin+'/index.html');return false}catch{return true}},{timeout:5000}).toBeTruthy();await page.reload({waitUntil:'domcontentloaded',timeout:15000});

    const runtime=await page.evaluate(()=>({records:window.PCM_DATA.records.length,go:window.PCM_DATA.meta.goCount,noGo:window.PCM_DATA.meta.noGoCount,training:window.PARADISE_UNIVERSITY_VERSION,deep:window.PU_DEEP_AUDIT_FIXES_VERSION,experience:window.PU_TRAINING_EXPERIENCE_VERSION,track:window.PU_DEFAULT_TRACK,completion:window.PU_COMPLETION_MODEL_VERSION,checks:window.PU_CHECKS_VERSION,reconciliation:window.PU_CONTENT.libraryReconciliationVersion,media:window.PU_CONTENT.media.length,tony:window.PU_CONTENT.media.filter(x=>x.trainer==='Tony Hoty').length,player:window.PU_PLAYER_VERSION}));
    expect(runtime).toEqual({records:78,go:76,noGo:2,training:'2026.08.16-pu-v1-content-5',deep:'2026.08.17-pu-deep-audit-fixes-v1',experience:'2026.08.17-pu-training-experience-v2',track:'CANVASSER_CORE',completion:'2026.08.17-current-curriculum-only-v1',checks:'2026.08.17-pu-checks-v3-versioned',reconciliation:'2026.08.16-pu-trainer-library-reconciliation-v1',media:79,tony:24,player:'2026.08.17-pu-player-v3-drive-top-level'});

    await page.locator('#nTrain').click();await expect(page.getByRole('heading',{name:'Train. Practice. Advance.'})).toBeVisible();await expect(page.locator('.puProgressText')).toContainText('Core device training gates');await expect(page.locator('.puGrid .puTile')).toHaveCount(4);
    await page.getByRole('button',{name:/Videos & Audio/}).click();await page.getByRole('button',{name:/COMPLETE CANVASSING LIBRARY/}).click();await expect(page.getByRole('heading',{name:'Canvassing Library'})).toBeVisible();await expect(page.locator('[data-trainer-group="Tony Hoty"] [data-media]')).toHaveCount(24);await expect(page.getByText(/current manager-approved canvass opening/i).first()).toBeVisible();

    await page.evaluate(()=>window.puPlayerOpen('grosso-tonality-audio'));const player=page.locator('#puPlayerRoot');await expect(player.getByRole('dialog',{name:'Training player'})).toBeVisible();await expect(player.locator('iframe')).toHaveCount(0);await expect(player.locator('[data-provider="drive-top-level"]')).toBeVisible();await expect(player.getByRole('link',{name:/Play Tonality and Body Language in Google Drive/i})).toHaveAttribute('target','_blank');await player.getByRole('button',{name:'Close player'}).click();

    await page.locator('#nLook').click();await pick(page,'Boca Raton');await expect(page.locator('.traffic h3')).toHaveText('YES — CANVASSING ALLOWED');await expect(page.locator('[data-field="door-hanger"] .val')).toHaveText('YES — HANG ON FRONT DOORKNOB / HANDLE.');await page.getByRole('button',{name:'New search'}).click();await pick(page,'Tarpon Springs');await expect(page.locator('.traffic')).toContainText(/NO — DO NOT CANVASS|NO-GO/);

    await page.getByRole('button',{name:'New search'}).click();await pick(page,'Dania');await page.getByRole('button',{name:/RUN DAILY CHECK/}).click();await page.getByPlaceholder('Manager name').fill('Offline Test Manager');await page.getByPlaceholder('Neighborhood / route').fill('Offline Route A');await page.getByPlaceholder('Exact street address or boundary').fill('789 Offline Test Route');await page.getByRole('checkbox').check();await page.getByRole('button',{name:/START 5 CHECKS/}).click();for(let i=0;i<5;i++)await page.getByRole('button',{name:/PASS/}).click();await expect(page.locator('.finalDecision')).toContainText('APPROVED TO CANVASS');await expect(page.locator('.finalFacts')).toContainText('2026.08.14-v3.12');
  }finally{if(server.exitCode===null)server.kill('SIGTERM')}
});