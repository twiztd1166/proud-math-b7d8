import {test,expect} from '@playwright/test';

async function pick(page,name){
  await page.getByPlaceholder('Start typing a city…').fill(name);
  await page.locator('.opt').filter({hasText:name}).first().click();
}

test('core lookup remains usable across the device matrix',async({page})=>{
  await page.goto('/index.html');
  await expect(page.getByRole('heading',{name:'Can I canvass here?'})).toBeVisible();
  await pick(page,'Boynton Beach');
  await expect(page.locator('section.card.essentials').getByText('FIELD ANSWERS')).toBeVisible();
  await expect(page.getByRole('button',{name:/RUN DAILY CHECK/})).toBeVisible();
  await page.getByRole('button',{name:'New search'}).click();
  await pick(page,'Punta Gorda');
  await expect(page.locator('.traffic')).toContainText('DO NOT CANVASS');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});

test('200 percent text remains horizontally contained',async({page})=>{
  await page.goto('/index.html');
  await page.evaluate(()=>document.documentElement.style.fontSize='200%');
  await pick(page,'Boynton Beach');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await expect(page.locator('section.card.essentials').getByText('FIELD ANSWERS')).toBeVisible();
});

test('keyboard-only exact lookup works',async({page})=>{
  await page.goto('/index.html');
  const search=page.getByPlaceholder('Start typing a city…');
  await search.focus();
  await search.fill('Boynton Beach');
  await search.press('Enter');
  await expect(page.locator('section.card.essentials').getByText('FIELD ANSWERS')).toBeVisible();
});

test('verified knob placement stays explicit across devices',async({page})=>{
  await page.goto('/index.html');
  const name=await page.evaluate(()=>{
    const r=window.PCM_DATA.records.find(x=>/HANG ON (?:FRONT )?KNOB/i.test(String(x.hangerMode||'')));
    if(!r)throw new Error('No verified knob sample found');
    return r.name;
  });
  await pick(page,name);
  await expect(page.locator('[data-field="door-hanger"] .val')).toHaveText('YES — HANG ON FRONT DOORKNOB / HANDLE.');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});

test('all 78 controlled records resolve to first-screen placement answers',async({page})=>{
  await page.goto('/index.html');
  const audit=await page.evaluate(()=>window.PCM_DATA.records.map(r=>({
    name:r.name,
    hangerMode:String(r.hangerMode||''),
    courtesyFieldAction:String(r.courtesyFieldAction||''),
    hanger:fieldHanger(r),
    courtesy:fieldCourtesy(r)
  })));
  expect(audit).toHaveLength(78);
  const fallback=audit.filter(x=>/FOLLOW THE PLACEMENT RULE IN DETAILS/i.test(`${x.hanger} ${x.courtesy}`));
  expect(fallback,`Records requiring manager interpretation:\n${JSON.stringify(fallback,null,2)}`).toEqual([]);
  const knobMismatch=audit.filter(x=>/HANG ON (?:FRONT )?KNOB/i.test(x.hangerMode)&&x.hanger!=='YES — HANG ON FRONT DOORKNOB / HANDLE.');
  expect(knobMismatch,`Verified knob records without explicit knob answer:\n${JSON.stringify(knobMismatch,null,2)}`).toEqual([]);
  const privateEntryMismatch=audit.filter(x=>/SECURE PRIVATE-ENTRY/i.test(x.hangerMode)&&x.hanger!=='YES — LEAVE AT FRONT ENTRY. DO NOT USE THE KNOB / HANDLE.');
  expect(privateEntryMismatch,`Private-entry records without explicit no-knob answer:\n${JSON.stringify(privateEntryMismatch,null,2)}`).toEqual([]);
  const rawAuditLeak=audit.filter(x=>/KNOB NOT SPECIFICALLY VERIFIED|SECURE PRIVATE-ENTRY|COURTESY TEXT BLOCKER|DO NOT DISTRIBUTE COMMERCIAL DOOR HANGERS/i.test(`${x.hanger} ${x.courtesy}`));
  expect(rawAuditLeak,`Internal audit wording leaked into manager answers:\n${JSON.stringify(rawAuditLeak,null,2)}`).toEqual([]);
});
