import {test,expect} from '@playwright/test';
async function pick(page,name){await page.getByPlaceholder('Start typing a city…').fill(name);await page.locator('.opt').filter({hasText:name}).first().click()}

test('core lookup remains usable across device matrix',async({page})=>{await page.goto('/index.html');await pick(page,'Boynton Beach');await expect(page.locator('.traffic h3')).toHaveText('YES — CANVASSING ALLOWED');expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(2)});

test('200 percent text including script remains contained',async({page})=>{await page.goto('/index.html');await page.evaluate(()=>document.documentElement.style.fontSize='200%');await pick(page,'Boca Raton');await page.getByRole('button',{name:'Permit / permission'}).click();expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(2);await expect(page.locator('#say')).toContainText('IF THEY ASK ABOUT A PERMIT')});

test('Daily Training remains contained and usable at 200 percent text across device matrix',async({page})=>{
  await page.goto('/index.html');await page.evaluate(()=>document.documentElement.style.fontSize='200%');await page.locator('#nTrain').click();
  const daily=page.locator('.puDailyTraining');await expect(daily).toBeVisible();await expect(daily.locator('[data-daily-index]')).toHaveCount(3);await expect(daily.getByRole('button',{name:/START TODAY'S TRAINING/i})).toBeVisible();
  const geometry=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,activities:[...document.querySelectorAll('.puDailyActivity')].map(x=>x.getBoundingClientRect().height),start:document.getElementById('puStartDaily')?.getBoundingClientRect().height||0}));
  expect(geometry.overflow).toBeLessThanOrEqual(2);expect(geometry.activities.every(h=>h>=44)).toBeTruthy();expect(geometry.start).toBeGreaterThanOrEqual(44);
});

test('all 78 records resolve to explicit field and objection answers',async({page})=>{
  await page.goto('/index.html');
  const audit=await page.evaluate(()=>window.PCM_DATA.records.map(r=>({name:r.name,release:r.release,decision:fieldCanvass(r).title,hoursRaw:String(r.hours||''),hours:fieldHours(r),hangerMode:String(r.hangerMode||''),courtesyMode:String(r.courtesyMode||''),hanger:fieldHanger(r),courtesy:fieldCourtesy(r),script:String(r.script||''),challenge:String(r.challenge||''),permit:fieldPermitResponse(r),permission:fieldPermissionResponse(r),courtesyResponse:fieldCourtesyResponse(r),challengeResponse:fieldChallengeResponse(r)})));
  expect(audit).toHaveLength(78);
  expect(audit.filter(x=>!x.script.trim()||!x.challenge.trim()),'Every record must retain the controlled IF ASKED and challenge text').toEqual([]);
  expect(audit.filter(x=>x.release==='GO'&&x.decision!=='YES — CANVASSING ALLOWED')).toEqual([]);
  expect(audit.filter(x=>x.release==='NO-GO'&&x.decision!=='NO — DO NOT CANVASS')).toEqual([]);
  expect(audit.filter(x=>x.release==='GO'&&x.permit!==x.script),'GO permit response must use controlled approved response verbatim').toEqual([]);
  expect(audit.filter(x=>x.release==='NO-GO'&&/does not require a separate route-specific canvasser permit/i.test(x.permit)),'NO-GO must never claim permit is unnecessary').toEqual([]);
  expect(audit.filter(x=>!/resident, property, HOA, security, gate, or private-access direction|not approved for canvassing/i.test(x.permission))).toEqual([]);
  expect(audit.filter(x=>!x.challengeResponse.trim())).toEqual([]);
  const blockers=audit.filter(x=>/HOURS TEXT BLOCKER/i.test(x.hoursRaw));expect(blockers).toHaveLength(12);expect(blockers.every(x=>x.hours==='Hours not confirmed - use Paradise’s normal route schedule.')).toBeTruthy();
  expect(audit.filter(x=>/FOLLOW THE PLACEMENT RULE IN DETAILS/i.test(`${x.hanger} ${x.courtesy}`))).toEqual([]);
  expect(audit.filter(x=>/KNOB NOT SPECIFICALLY VERIFIED|SECURE PRIVATE-ENTRY/i.test(`${x.hangerMode} ${x.courtesyMode}`))).toEqual([]);
  const byName=Object.fromEntries(audit.map(x=>[x.name,x]));
  expect(byName['Boca Raton'].permit).toContain('Our compliance review for Boca Raton does not require a separate route-specific canvasser permit');
  expect(byName['Boca Raton'].courtesyResponse).toContain('installation-day courtesy notice, not a sales offer');
  expect(byName['Bradenton'].courtesyResponse).toContain('if you are okay receiving it');
  expect(byName['Fort Pierce'].courtesyResponse).toContain('I can hand it directly to you; I will not leave it unattended');
  expect(byName['Deerfield Beach'].courtesyResponse).toContain('Do not use the courtesy notice here');
  expect(byName['Punta Gorda'].permit).not.toMatch(/does not require a separate route-specific canvasser permit/i);
  expect(byName['Tarpon Springs'].permit).not.toMatch(/does not require a separate route-specific canvasser permit/i);
});
