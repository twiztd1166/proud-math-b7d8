import {test,expect} from '@playwright/test';

async function pick(page,name){await page.getByPlaceholder('Start typing a city…').fill(name);await page.locator('.opt').filter({hasText:name}).first().click()}

test('core lookup remains usable across the device matrix',async({page})=>{
  await page.goto('/index.html');
  await pick(page,'Boynton Beach');
  await expect(page.locator('.traffic h3')).toHaveText('YES — CANVASSING ALLOWED');
  await expect(page.locator('[data-field="hours"] .val')).toHaveText('Hours not confirmed - use Paradise’s normal route schedule.');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});

test('200 percent text remains horizontally contained',async({page})=>{
  await page.goto('/index.html');await page.evaluate(()=>document.documentElement.style.fontSize='200%');await pick(page,'Boynton Beach');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(2);
});

test('all 78 records resolve to explicit canvass, hours and placement answers',async({page})=>{
  await page.goto('/index.html');
  const audit=await page.evaluate(()=>window.PCM_DATA.records.map(r=>({
    name:r.name,release:r.release,addressCheck:String(r.addressCheck||''),needsAddress:fieldNeedsAddress(r),hoursRaw:String(r.hours||''),hours:fieldHours(r),
    hangerMode:String(r.hangerMode||''),courtesyMode:String(r.courtesyMode||''),hanger:fieldHanger(r),courtesy:fieldCourtesy(r)
  })));
  expect(audit).toHaveLength(78);
  expect(audit.filter(x=>x.release==='GO'&&fieldCanvass(window.PCM_DATA.records.find(r=>r.name===x.name)).title!=='YES — CANVASSING ALLOWED')).toEqual([]);
  expect(audit.filter(x=>x.release==='NO-GO'&&x.hours!=='Do not canvass.')).toEqual([]);
  const blockers=audit.filter(x=>/HOURS TEXT BLOCKER/i.test(x.hoursRaw));
  expect(blockers).toHaveLength(12);
  expect(blockers.every(x=>x.hours==='Hours not confirmed - use Paradise’s normal route schedule.')).toBeTruthy();
  const overrideNames=['Dania','Fort Lauderdale','Hallandale','Hialeah','Homestead','Jupiter','Largo','Miami','Miami Beach','Miami Gardens','North Miami Beach','North Palm Beach','Opa Locka','Palm Beach','Pembroke Pines','Plant City','Port Saint Lucie','Saint Petersburg','Satellite Beach'].sort();
  const actualOverrides=await page.evaluate(()=>Object.keys(FIELD_HOURS_OVERRIDES).sort());
  expect(actualOverrides).toEqual(overrideNames);
  const wrongDefault=audit.filter(x=>x.release==='GO'&&!/HOURS TEXT BLOCKER/i.test(x.hoursRaw)&&!overrideNames.includes(x.name)&&x.hours!=='Use Paradise’s normal route schedule.');
  expect(wrongDefault,`Unexpected default hours outputs:\n${JSON.stringify(wrongDefault,null,2)}`).toEqual([]);
  const danger=audit.filter(x=>['Deerfield Beach','Hudson','Land O Lakes','Lutz','Palmetto','Spring Hill','Wesley Chapel'].includes(x.name)&&/7:00 AM|8:00 PM|9:00 AM|10:00 PM/.test(x.hours));
  expect(danger,`Out-of-scope/historical time leaked into manager hours:\n${JSON.stringify(danger,null,2)}`).toEqual([]);
  const overnight=audit.filter(x=>['Miami Gardens','Opa Locka'].includes(x.name)&&/7:00 PM.*8:00 AM/.test(x.hours));
  expect(overnight).toEqual([]);
  const fallback=audit.filter(x=>/FOLLOW THE PLACEMENT RULE IN DETAILS/i.test(`${x.hanger} ${x.courtesy}`));
  expect(fallback).toEqual([]);
  const obsolete=audit.filter(x=>/KNOB NOT SPECIFICALLY VERIFIED|SECURE PRIVATE-ENTRY/i.test(`${x.hangerMode} ${x.courtesyMode}`));
  expect(obsolete).toEqual([]);
  const byName=Object.fromEntries(audit.map(x=>[x.name,x]));
  expect(byName['Boca Raton'].hanger).toBe('YES — HANG ON FRONT DOORKNOB / HANDLE.');
  expect(byName['Miami Gardens'].hangerMode).toBe('NON-AFFIXED ONLY');
  expect(byName['New Port Richey'].hangerMode).toBe('DO NOT DISTRIBUTE');
  expect(byName['Tarpon Springs'].hangerMode).toBe('NO FRONT-ENTRY DISTRIBUTION');
});
