import {test,expect} from '@playwright/test';

test.beforeEach(async({page})=>{await page.goto('/index.html');await page.locator('#nTrain').click();await page.getByRole('button',{name:/Practice/}).first().click()});

test('Practice stays simple with four skill choices',async({page})=>{
  await expect(page.getByRole('heading',{name:'Practice'})).toBeVisible();
  for(const name of ['Practice Opening','Practice Objections','Practice Appointments','Practice Field Rules'])await expect(page.getByRole('button',{name:new RegExp(name,'i')})).toBeVisible();
  await expect(page.getByText(/Practice only/)).toBeVisible();
  await expect(page.getByText(/not an official certification or manager verification/i)).toBeVisible();
});

test('field-rule scenario reveals coaching answer and records a practice attempt',async({page})=>{
  await page.getByRole('button',{name:/Practice Field Rules/}).click();
  await expect(page.locator('#puPracticeBox')).toContainText(/Resident Says Leave|NO-GO Area/);
  await page.getByRole('button',{name:'SHOW COACHING ANSWER'}).click();
  await expect(page.locator('#puPracticeBox')).toContainText(/Stop immediately and leave|Do not canvass/);
  await page.getByRole('button',{name:'✓ GOT IT'}).click();
  await expect(page.locator('#puPracticeStats')).toContainText('1 today');
  await expect(page.locator('#puPracticeStats')).toContainText('1 total');
});

test('practice count persists on device and does not mark lessons complete',async({page})=>{
  await page.getByRole('button',{name:/Practice Objections/}).click();
  await page.getByRole('button',{name:'SHOW COACHING ANSWER'}).click();
  await page.getByRole('button',{name:'↻ NEED MORE PRACTICE'}).click();
  const before=await page.evaluate(()=>({practice:window.puPracticeStats(),progress:JSON.parse(localStorage.puProgress||'{}')}));
  expect(before.practice.total).toBe(1);expect(Object.keys(before.progress)).toHaveLength(0);
  await page.reload();await page.locator('#nTrain').click();await page.getByRole('button',{name:/Practice/}).first().click();
  await expect(page.locator('#puPracticeStats')).toContainText('1 total');
});

test('next scenario remains inside selected practice category',async({page})=>{
  await page.getByRole('button',{name:/Practice Appointments/}).click();
  await page.getByRole('button',{name:'SHOW COACHING ANSWER'}).click();
  await page.getByRole('button',{name:'NEXT SCENARIO'}).click();
  await expect(page.locator('#puPracticeBox')).toContainText(/How Much Does It Cost\?|Appointment Close/);
});

test('practice engine version is explicit',async({page})=>{
  await expect.poll(async()=>page.evaluate(()=>window.PU_PRACTICE_VERSION)).toBe('2026.08.16-pu-practice-v1');
});
