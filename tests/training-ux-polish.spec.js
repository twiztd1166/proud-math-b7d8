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

test('v4 Today card persists same-day progress and resumes the next activity',async({page})=>{
  await training(page);await expect.poll(async()=>page.evaluate(()=>window.PU_TRAINING_EXPERIENCE_V4_VERSION)).toBe('2026.08.17-pu-training-experience-v4');
  const daily=page.locator('.puDailyTraining');await expect(daily).toContainText("Today's Training · 0 of 3 complete");
  await daily.locator('[data-daily-done="0"]').click();await expect(daily).toContainText("Today's Training · 1 of 3 complete");await expect(daily.locator('#puStartDaily')).toHaveText("CONTINUE TODAY'S TRAINING");
  const saved=await page.evaluate(()=>window.puDailyExperienceV4State());expect(saved.done).toEqual([true,false,false]);
  await page.reload();await page.locator('#nTrain').click();await expect(page.locator('.puDailyTraining')).toContainText("Today's Training · 1 of 3 complete");expect((await page.evaluate(()=>window.puDailyExperienceV4State())).done).toEqual([true,false,false]);
});

test('v4 lesson flow remembers the active lesson step on this device',async({page})=>{
  await training(page);await page.evaluate(()=>puSetPage('lesson:foundation-welcome'));await expect(page.locator('.puLessonFocusNav')).toBeVisible();await expect(page.locator('.puLessonFocusMeta')).toContainText(/Step 1 of/);
  await page.locator('#puFocusNext').click();await page.locator('#puFocusNext').click();expect((await page.evaluate(()=>window.puLessonFocusState('foundation-welcome'))).index).toBe(2);
  await page.evaluate(()=>puSetPage('home'));await page.evaluate(()=>puSetPage('lesson:foundation-welcome'));await expect(page.locator('.puLessonFocusMeta')).toContainText(/Step 3 of/);expect((await page.evaluate(()=>window.puLessonFocusState('foundation-welcome'))).index).toBe(2);
});

test('v4 focused lesson navigation cannot bypass a required Quick Check',async({page})=>{
  await training(page);await page.evaluate(()=>puSetPage('lesson:field-lookup'));await page.locator('.puLessonFocusSteps [data-pu-focus]').filter({hasText:'Quick Check'}).click();await expect(page.locator('#puFocusNext')).toBeDisabled();await expect(page.locator('#puFocusNext')).toHaveText(/PASS QUICK CHECK TO CONTINUE/);
  await page.getByRole('button',{name:'The live municipality lookup'}).click();await expect(page.locator('#puFocusNext')).toBeEnabled();await expect(page.locator('#puFocusNext')).toHaveText('CONTINUE →');
});

test('v4 wrong Quick Check offers an immediate retry on the same step',async({page})=>{
  await training(page);await page.evaluate(()=>puSetPage('lesson:field-lookup'));await page.locator('.puLessonFocusSteps [data-pu-focus]').filter({hasText:'Quick Check'}).click();
  await page.getByRole('button',{name:'The training lesson'}).click();await expect(page.getByRole('button',{name:'TRY QUICK CHECK AGAIN'})).toBeVisible();await expect(page.locator('#puFocusNext')).toBeDisabled();
  const before=await page.evaluate(()=>window.puLessonFocusState('field-lookup').index);await page.getByRole('button',{name:'TRY QUICK CHECK AGAIN'}).click();await expect(page.locator('.puLessonFocusMeta')).toContainText(/Step \d+ of/);expect((await page.evaluate(()=>window.puLessonFocusState('field-lookup'))).index).toBe(before);await expect(page.getByRole('button',{name:'The live municipality lookup'})).toBeEnabled();await expect(page.getByRole('button',{name:'TRY QUICK CHECK AGAIN'})).toHaveCount(0);
});

test('v4 Practice retry repeats the same scenario without inventing another attempt',async({page})=>{
  await training(page);await page.getByRole('button',{name:/Practice/}).first().click();await expect.poll(async()=>page.evaluate(()=>window.PU_PRACTICE_RETRY_VERSION)).toBe('2026.08.17-pu-practice-v4-retry');await page.getByRole('button',{name:/Practice Objections/}).click();const first=await page.evaluate(()=>window.puPracticeCurrentScenario().id);await page.getByRole('button',{name:'SHOW COACHING ANSWER'}).click();await page.getByRole('button',{name:/NEED MORE PRACTICE/}).click();expect((await page.evaluate(()=>window.puPracticeStats())).total).toBe(1);await page.getByRole('button',{name:'TRY THIS ONE AGAIN'}).click();expect(await page.evaluate(()=>window.puPracticeCurrentScenario().id)).toBe(first);await expect(page.getByRole('button',{name:'SHOW COACHING ANSWER'})).toBeVisible();expect((await page.evaluate(()=>window.puPracticeStats())).total).toBe(1);
});

test('v4 critical training controls meet 44px minimum target size',async({page})=>{
  await training(page);const geometry=await page.evaluate(()=>({daily:[...document.querySelectorAll('.puDailyOpen,.puDailyMark')].map(x=>x.getBoundingClientRect().height),start:document.getElementById('puStartDaily')?.getBoundingClientRect().height||0,back:[...document.querySelectorAll('.puBack')].map(x=>x.getBoundingClientRect().height)}));expect(geometry.daily.length).toBeGreaterThanOrEqual(3);expect(geometry.daily.every(h=>h>=44)).toBeTruthy();expect(geometry.start).toBeGreaterThanOrEqual(44);expect(geometry.back.every(h=>h>=44)).toBeTruthy();
});
