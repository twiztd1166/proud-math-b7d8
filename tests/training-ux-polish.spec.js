import {test,expect} from '@playwright/test';

async function training(page){await page.goto('/index.html');await page.locator('#nTrain').click()}

test('Continue Training shows lesson position, stage and next milestone',async({page})=>{
  await training(page);
  await expect.poll(async()=>page.evaluate(()=>window.PU_TRAINING_UX_POLISH_VERSION)).toBe('2026.08.17-pu-training-ux-polish-v1');
  const small=page.locator('#puContinue small'),detail=page.locator('#puContinue span');
  await expect(small).toContainText(/NEXT UP · \d+ MIN · 1 OF \d+ · FOUNDATION/i);
  await expect(detail).toContainText(/gate(s)? until Foundation device training complete/i);
  await expect(page.locator('.puCurrentPath')).toContainText(/device training complete/i);
  await expect(page.getByRole('button',{name:/My Progress/}).locator('small')).toContainText(/core gates · \d+ remaining/i);
});

test('My Progress exposes a concise next milestone without adding a new home destination',async({page})=>{
  await training(page);await page.getByRole('button',{name:/My Progress/}).click();
  await expect(page.getByText('NEXT MILESTONE',{exact:true})).toBeVisible();await expect(page.locator('.puNextMilestone')).toContainText(/device training complete/i);
  await page.locator('#puBack').click();await expect(page.getByRole('heading',{name:'Train. Practice. Advance.'})).toBeVisible();
  await expect(page.locator('.puGrid .puTile')).toHaveCount(4);
});

test('Back from a lesson returns to the exact prior stage instead of dumping the learner on Training home',async({page})=>{
  await training(page);await page.getByRole('button',{name:/Career Path/}).click();await page.getByRole('button',{name:/5\. Sales Apprentice/}).click();await page.getByRole('button',{name:/Full Sales Process Map/}).click();
  await expect(page.getByRole('heading',{name:/Full Sales Process Map/})).toBeVisible();await page.locator('#puBack').click();
  await expect(page.getByRole('heading',{name:'Sales Apprentice'})).toBeVisible();await expect(page.getByRole('button',{name:/Full Sales Process Map/})).toBeVisible();
});

test('Back restores the prior stage scroll position',async({page})=>{
  await training(page);await page.getByRole('button',{name:/Career Path/}).click();await page.getByRole('button',{name:/6\. Sales Rep/}).click();
  const target=page.locator('[data-lesson]').nth(5);await target.scrollIntoViewIfNeeded();const before=await page.evaluate(()=>window.scrollY);expect(before).toBeGreaterThan(0);await target.click();
  await expect(page.locator('#puBack')).toBeVisible();await page.locator('#puBack').click();await expect(page.getByRole('heading',{name:'Sales Rep'})).toBeVisible();
  await expect.poll(async()=>page.evaluate(()=>window.scrollY)).toBeGreaterThan(Math.max(0,before-160));
});

test('same-page lesson refresh preserves reading position',async({page})=>{
  await training(page);await page.getByRole('button',{name:/Career Path/}).click();await page.getByRole('button',{name:/1\. Foundation/}).click();await page.getByRole('button',{name:/Your Job at the Door/}).click();
  await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));const before=await page.evaluate(()=>window.scrollY);expect(before).toBeGreaterThan(0);await page.locator('#puDone').click();
  await expect.poll(async()=>page.evaluate(()=>window.scrollY)).toBeGreaterThan(Math.max(0,before-160));
});
