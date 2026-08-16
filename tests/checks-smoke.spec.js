import {test,expect} from '@playwright/test';

async function careerLesson(page,stageButton,lessonButton){
  await page.goto('/index.html');await page.locator('#nTrain').click();await page.getByRole('button',{name:/Career Path/}).first().click();await page.getByRole('button',{name:stageButton}).click();await page.getByRole('button',{name:lessonButton}).click();
}

test('field lookup Quick Check reinforces live-rule override',async({page})=>{
  await careerLesson(page,/2\. Field Ready/,/Check the Municipality Before You Knock/);
  await expect(page.getByText('QUICK CHECK',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'The live municipality lookup'}).click();
  await expect(page.getByText('✓ Correct',{exact:true})).toBeVisible();
  await expect(page.getByText(/Do not canvass a NO-GO area/)).toBeVisible();
});

test('clear refusal Quick Check marks continued questioning wrong',async({page})=>{
  await careerLesson(page,/2\. Field Ready/,/Refusal Is a Stop, Not an Objection/);
  await page.getByRole('button',{name:'Ask one more qualifying question'}).click();
  await expect(page.getByText('Review this one',{exact:true})).toBeVisible();
  await expect(page.getByText(/clear refusal is a stop/i)).toBeVisible();
});

test('Sales Apprentice Quick Check preserves doorstep boundary',async({page})=>{
  await careerLesson(page,/5\. Sales Apprentice/,/Sales Apprentice: What Changes and What Does Not/);
  await page.getByRole('button',{name:'No',{exact:true}).click();
  await expect(page.getByText('✓ Correct',{exact:true})).toBeVisible();
  await expect(page.getByText(/does not expand doorstep authority/i)).toBeVisible();
});

test('Manager Quick Check prevents NO-GO override',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await page.getByRole('button',{name:/Career Path/}).first().click();await page.getByRole('button',{name:/Canvass Manager Academy/}).click();await page.getByRole('button',{name:/Compliance Leadership/}).click();
  await expect(page.getByText('QUICK CHECK',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:/Do not canvass; verify through the current compliance process/}).click();
  await expect(page.getByText('✓ Correct',{exact:true})).toBeVisible();
  await expect(page.getByText(/Managers do not override NO-GO/)).toBeVisible();
});

test('Quick Check attempts persist but do not certify or complete lessons',async({page})=>{
  await careerLesson(page,/3\. Certified Canvasser/,/Certified Canvasser Readiness/);
  await page.getByRole('button',{name:/No — manager demonstration and field verification still matter/}).click();
  const state=await page.evaluate(()=>({checks:window.puQuickCheckStats(),progress:JSON.parse(localStorage.puProgress||'{}')}));
  expect(state.checks['canvass-cert-ready'].correct).toBe(1);
  expect(Object.keys(state.progress)).toHaveLength(0);
});

test('Quick Check version is explicit',async({page})=>{
  await page.goto('/index.html');await expect.poll(async()=>page.evaluate(()=>window.PU_CHECKS_VERSION)).toBe('2026.08.16-pu-checks-v1');
});
