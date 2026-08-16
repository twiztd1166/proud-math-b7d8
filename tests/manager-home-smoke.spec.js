import {test,expect} from '@playwright/test';

test('Manager Academy opens with seven simple manager jobs and keeps full curriculum secondary',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await page.getByRole('button',{name:/Career Path/}).first().click();await page.getByRole('button',{name:/Canvass Manager Academy/}).click();
  await expect(page.getByRole('heading',{name:'Canvass Manager Academy'})).toBeVisible();
  for(const label of ['Train a Rep','Coach in the Field','Run Today’s Huddle','Review Appointments','Review Numbers','Compliance Help','Develop Future Sales Reps'])await expect(page.getByRole('button',{name:new RegExp(label,'i')})).toBeVisible();
  await expect(page.getByText(/manager does not override the live municipality result/i)).toBeVisible();
  await expect(page.getByText(/Full Manager Curriculum/)).toBeVisible();
  await expect(page.getByRole('button',{name:/The Canvass Manager’s Job/})).toHaveCount(0);
});

test('manager action opens the underlying operational lesson and returns to simple manager home',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await page.getByRole('button',{name:/Career Path/}).first().click();await page.getByRole('button',{name:/Canvass Manager Academy/}).click();
  await page.getByRole('button',{name:/Compliance Help/}).click();await expect(page.getByRole('heading',{name:'Compliance Leadership'})).toBeVisible();
  await page.getByRole('button',{name:/Manager Academy/}).click();
  await expect(page.getByRole('button',{name:/Compliance Help/})).toBeVisible();
  await expect.poll(async()=>page.evaluate(()=>window.PU_MANAGER_UI_VERSION)).toBe('2026.08.16-pu-manager-ui-v2');
});
