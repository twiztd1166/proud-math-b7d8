import {test,expect} from '@playwright/test';

test('training home is simple and field lookup stays one tap away',async({page})=>{
  await page.goto('/index.html');
  await page.getByRole('button',{name:/Training/}).click();
  await expect(page.getByRole('heading',{name:'Train. Practice. Advance.'})).toBeVisible();
  await expect(page.getByRole('button',{name:/Continue|Welcome to Paradise University/})).toBeVisible();
  await expect(page.getByRole('button',{name:/Practice/}).first()).toBeVisible();
  await expect(page.getByRole('button',{name:/Career Path/}).first()).toBeVisible();
  await expect(page.getByRole('button',{name:/Videos & Audio/}).first()).toBeVisible();
  await expect(page.getByRole('button',{name:/My Progress/}).first()).toBeVisible();
  await page.getByRole('button',{name:/Lookup/}).click();
  await expect(page.getByRole('heading',{name:'Can I canvass here?'})).toBeVisible();
});

test('starter lesson completion persists on the device',async({page})=>{
  await page.goto('/index.html');
  await page.getByRole('button',{name:/Training/}).click();
  await page.locator('#puContinue').click();
  await expect(page.getByRole('heading',{name:'Welcome to Paradise University'})).toBeVisible();
  await page.getByRole('button',{name:'MARK COMPLETE'}).click();
  await expect(page.getByText('COMPLETE',{exact:true})).toBeVisible();
  await page.reload();
  await page.getByRole('button',{name:/Training/}).click();
  await page.getByRole('button',{name:/My Progress/}).first().click();
  await expect(page.getByText('1 complete')).toBeVisible();
});

test('training distinguishes approved lesson from source reference',async({page})=>{
  await page.goto('/index.html');
  await page.getByRole('button',{name:/Training/}).click();
  await page.getByRole('button',{name:/Videos & Audio/}).first().click();
  await expect(page.getByText('PARADISE APPROVED',{exact:true})).toBeVisible();
  await expect(page.getByText('REFERENCE',{exact:true}).first()).toBeVisible();
  await expect(page.getByText(/Original source material is reference/)).toBeVisible();
});

test('sales apprentice training preserves doorstep boundary',async({page})=>{
  await page.goto('/index.html');
  await page.getByRole('button',{name:/Training/}).click();
  await page.getByRole('button',{name:/Career Path/}).first().click();
  await page.getByRole('button',{name:/5\. Sales Apprentice/}).click();
  await expect(page.getByText(/not authorization to price or sell at the door/i)).toBeVisible();
});

test('training does not weaken NO-GO field result',async({page})=>{
  await page.goto('/index.html');
  await page.getByRole('button',{name:/Training/}).click();
  await page.getByRole('button',{name:/Lookup/}).click();
  await page.getByPlaceholder('Start typing a city…').fill('Tarpon Springs');
  await page.locator('.opt').filter({hasText:'Tarpon Springs'}).first().click();
  await expect(page.locator('.traffic')).toContainText(/NO — DO NOT CANVASS|NO-GO/);
});