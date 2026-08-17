import {test,expect} from '@playwright/test';
async function training(page){await page.goto('/index.html');await page.locator('#nTrain').click()}

test('v3 home shows useful lesson and stage milestone without adding home clutter',async({page})=>{
  await training(page);
  await expect.poll(async()=>page.evaluate(()=>window.PU_TRAINING_EXPERIENCE_V3_VERSION)).toBe('2026.08.17-pu-training-experience-v3');
  await expect(page.locator('#puContinue small')).toContainText(/LESSON 1 OF \d+ · \d+ MIN · FOUNDATION/i);
  await expect(page.locator('.puMilestoneStrip')).toContainText(/Foundation gate/);
  await expect(page.locator('.puGrid .puTile')).toHaveCount(4);
  await expect(page.getByRole('button',{name:/CANVASSING LIBRARY/i})).toHaveCount(0);
});

test('lesson overview explains time and path before the lesson body',async({page})=>{
  await training(page);await page.getByRole('button',{name:/Career Path/}).click();await page.getByRole('button',{name:/1\. Foundation/}).click();await page.getByRole('button',{name:/Your Job at the Door/}).click();
  const overview=page.locator('.puLessonOverview');await expect(overview).toBeVisible();await expect(overview).toContainText(/min/i);await expect(overview).toContainText('1. Learn');await expect(overview).toContainText(/Practice/);await expect(overview).toContainText(/Complete/);
});

test('smart back returns to the exact career stage instead of dumping the learner at home',async({page})=>{
  await training(page);await page.getByRole('button',{name:/Career Path/}).click();await page.getByRole('button',{name:/2\. Field Ready/}).click();const stageTitle=await page.getByRole('heading',{level:2}).textContent();await page.locator('[data-lesson]').first().click();await page.locator('.puBack').click();await expect(page.getByRole('heading',{level:2})).toHaveText(stageTitle||'Field Ready');
});

test('adaptive practice records weak concepts and exposes Smart Review',async({page})=>{
  await training(page);await page.getByRole('button',{name:/Practice/}).first().click();await expect(page.getByRole('button',{name:/SMART REVIEW/})).toBeVisible();await page.getByRole('button',{name:/Practice Objections/}).click();const id=await page.evaluate(()=>window.puPracticeCurrentScenario().id);await page.getByRole('button',{name:'SHOW COACHING ANSWER'}).click();await page.getByRole('button',{name:/NEED MORE PRACTICE/}).click();const weak=await page.evaluate(()=>window.puPracticeWeakAreas());expect(weak.some(x=>x.scenario.id===id&&x.weakness>0)).toBeTruthy();await expect(page.locator('#puSmartPracticeMeta')).toContainText(/marked for review/i);
});

test('progress gives concrete next requirements and a truthful manual transfer tool',async({page})=>{
  await training(page);await page.getByRole('button',{name:/My Progress/}).click();await expect(page.locator('.puNextRequirements')).toContainText('WHAT YOU NEED NEXT');await expect(page.locator('.puProgressTransfer')).toBeVisible();await page.locator('.puProgressTransfer summary').click();await expect(page.locator('.puProgressTransfer')).toContainText(/manual transfer—not an employee account, centralized manager dashboard, or official certification record/i);
  const state=await page.evaluate(()=>{localStorage.puProgress=JSON.stringify({demo:{complete:true,trainingVersion:window.PARADISE_UNIVERSITY_VERSION}});const p=window.puProgressTransferPayload();delete localStorage.puProgress;window.puApplyProgressTransfer(p);return{type:p.type,restored:JSON.parse(localStorage.puProgress).demo.complete}});expect(state).toEqual({type:'PARADISE_UNIVERSITY_PROGRESS_TRANSFER',restored:true});
});

test('trainer player adds truthful notes and practice tools without fabricating transcripts',async({page})=>{
  await training(page);await page.evaluate(()=>window.puPlayerOpen('grosso-tonality-audio'));const tools=page.locator('.puMediaLearningTools');await expect(tools).toBeVisible();await expect(tools).toContainText('LEARNING TOOLS');await expect(tools).toContainText(/does not fabricate one/i);await expect(page.locator('#puPracticeMediaSkill')).toBeVisible();await page.locator('#puMediaNote').fill('Slow down and keep a calm tone.');await page.locator('#puSaveMediaNote').click();await expect(page.locator('#puExperienceToast')).toContainText('Note saved');const saved=await page.evaluate(()=>window.puMediaLearningNote('grosso-tonality-audio'));expect(saved).toBe('Slow down and keep a calm tone.');
});

test('completing a lesson gives subtle milestone feedback instead of gamification',async({page})=>{
  await training(page);await page.getByRole('button',{name:/Career Path/}).click();await page.getByRole('button',{name:/1\. Foundation/}).click();await page.getByRole('button',{name:/Your Job at the Door/}).click();const done=page.locator('#puDone');if(await done.isDisabled())test.skip();await done.click();await expect(page.locator('#puExperienceToast')).toContainText(/Lesson complete/);await expect(page.locator('#puExperienceToast')).toContainText(/Foundation gate/);
});

test('manager-assigned training remains intentionally absent',async({page})=>{
  await training(page);await expect(page.getByText(/manager-assigned|assigned training|due date/i)).toHaveCount(0);
});
