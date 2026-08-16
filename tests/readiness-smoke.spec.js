import {test,expect} from '@playwright/test';

test('My Progress shows advancement readiness without claiming official certification',async({page})=>{
  await page.goto('/index.html');
  await page.locator('#nTrain').click();
  await page.getByRole('button',{name:/My Progress/}).first().click();
  await expect(page.getByRole('heading',{name:'My Progress'})).toBeVisible();
  await expect(page.getByText(/Device progress only/)).toBeVisible();
  await expect(page.getByText(/not an official Paradise certification/i)).toBeVisible();
  for(const label of ['Foundation','Field Ready','Certified Canvasser','Senior Canvasser','Sales Apprentice','Sales Rep Academy — Part 1','Canvass Manager Academy'])await expect(page.getByText(label,{exact:true}).first()).toBeVisible();
  await expect(page.getByText(/manager role-play and field verification required/i)).toBeVisible();
  await expect(page.getByText(/current Paradise policy modules are still required before full Sales Rep certification/i)).toBeVisible();
});

test('readiness infrastructure loads at the expected version',async({page})=>{
  await page.goto('/index.html');
  await expect.poll(async()=>page.evaluate(()=>window.PU_READINESS_VERSION)).toBe('2026.08.16-pu-readiness-v1');
  await expect.poll(async()=>page.evaluate(()=>window.PARADISE_UNIVERSITY_VERSION)).toBe('2026.08.16-pu-v1-content-5');
});
