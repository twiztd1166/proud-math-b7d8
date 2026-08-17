import {test,expect} from '@playwright/test';
async function training(page){await page.goto('/index.html');await page.locator('#nTrain').click()}

test('polished home keeps four actions and adds useful milestone context',async({page})=>{
  await training(page);await expect.poll(async()=>page.evaluate(()=>({polish:window.PU_TRAINING_UX_POLISH_VERSION,v3:window.PU_TRAINING_EXPERIENCE_V3_VERSION,daily:window.PU_DAILY_TRAINING_VERSION}))).toEqual({polish:'2026.08.17-pu-training-ux-polish-v1',v3:'2026.08.17-pu-training-experience-v3',daily:'2026.08.17-pu-daily-training-v1'});
  await expect(page.locator('#puContinue small')).toContainText(/NEXT UP · \d+ MIN · 1 OF \d+ · FOUNDATION/i);await expect(page.locator('.puGrid .puTile')).toHaveCount(4);await expect(page.getByRole('button',{name:/CANVASSING LIBRARY/i})).toHaveCount(0);
});

test('daily training is recommendation-only and gives three useful activities',async({page})=>{
  await training(page);const daily=page.locator('.puDailyTraining');await expect(daily).toBeVisible();await expect(daily).toContainText('RECOMMENDED FOR TODAY');await expect(daily).toContainText(/Training Day 1/i);await expect(daily.locator('[data-daily-index]')).toHaveCount(3);await expect(daily.getByRole('button',{name:/START TODAY'S TRAINING/i})).toBeVisible();await expect(daily).toContainText(/Recommendation only/i);await expect(daily).not.toContainText(/overdue|required today|deadline assigned/i);
});

test('daily sequence counts distinct training days instead of calendar weekdays',async({page})=>{
  await page.goto('/index.html');await page.evaluate(()=>localStorage.setItem('puDailyTrainingV1',JSON.stringify({days:['2000-01-01','2000-01-02']})));await page.locator('#nTrain').click();const p=await page.evaluate(()=>window.puDailyTrainingPlan());expect(p.dayNumber).toBe(3);expect(p.cycleDay).toBe(3);expect(p.theme).toBe('Field Compliance');
});

test('daily current skill stays inside the controlled core track',async({page})=>{
  await training(page);const p=await page.evaluate(()=>window.puDailyTrainingPlan());expect(['foundation','field-ready','canvasser']).toContain(p.skill.stage);expect(String(p.skill.stage)).not.toMatch(/sales|manager/i);
});

test('daily application prefers actual weak-area evidence without fabricating it',async({page})=>{
  await training(page);let p=await page.evaluate(()=>window.puDailyTrainingPlan());expect(p.application.weak).toBe(false);await page.getByRole('button',{name:/Practice/}).first().click();await page.getByRole('button',{name:/Practice Objections/}).click();await page.getByRole('button',{name:'SHOW COACHING ANSWER'}).click();await page.getByRole('button',{name:/NEED MORE PRACTICE/}).click();await page.locator('#puBack').click();p=await page.evaluate(()=>window.puDailyTrainingPlan());expect(p.application.kind).toBe('practice');expect(p.application.weak).toBe(true);expect(p.application.title).toBe('Practice My Weak Areas');
});

test('daily day six uses curated coaching rather than auto-queuing future curriculum',async({page})=>{
  await page.goto('/index.html');await page.evaluate(()=>localStorage.setItem('puDailyTrainingV1',JSON.stringify({days:['2000-01-01','2000-01-02','2000-01-03','2000-01-04','2000-01-05']})));await page.locator('#nTrain').click();const p=await page.evaluate(()=>window.puDailyTrainingPlan());expect(p.dayNumber).toBe(6);expect(p.theme).toBe('Coaching & Library');expect(p.application.kind).toBe('media');
});

test('lesson overview shows time and learning steps before content',async({page})=>{
  await training(page);await page.getByRole('button',{name:/Career Path/}).click();await page.getByRole('button',{name:/1\. Foundation/}).click();await page.getByRole('button',{name:/Your Job at the Door/}).click();const o=page.locator('.puLessonOverview');await expect(o).toBeVisible();await expect(o).toContainText(/min/i);await expect(o).toContainText('1. Learn');await expect(o).toContainText(/Practice/);await expect(o).toContainText(/Complete/);
});

test('context back returns to the exact stage',async({page})=>{
  await training(page);await page.getByRole('button',{name:/Career Path/}).click();await page.getByRole('button',{name:/2\. Field Ready/}).click();const title=await page.getByRole('heading',{level:2}).textContent();await page.locator('[data-lesson]').first().click();await page.locator('.puBack').click();await expect(page.getByRole('heading',{level:2})).toHaveText(title||'Field Ready');
});

test('adaptive weak-area review appears only after Needs Practice and clears on correct retry',async({page})=>{
  await training(page);await page.getByRole('button',{name:/Practice/}).first().click();await expect(page.getByRole('button',{name:/Practice My Weak Areas/i})).toHaveCount(0);await page.getByRole('button',{name:/Practice Objections/}).click();const id=await page.evaluate(()=>window.puPracticeCurrentScenario().id);await page.getByRole('button',{name:'SHOW COACHING ANSWER'}).click();await page.getByRole('button',{name:/NEED MORE PRACTICE/}).click();expect(await page.evaluate(()=>window.puPracticeWeakScenarioIds())).toContain(id);await page.getByRole('button',{name:/Practice My Weak Areas/i}).click();await page.getByRole('button',{name:'SHOW COACHING ANSWER'}).click();await page.getByRole('button',{name:'✓ GOT IT'}).click();expect(await page.evaluate(()=>window.puPracticeWeakScenarioIds())).not.toContain(id);
});

test('progress explains concrete next requirements and supports truthful manual transfer',async({page})=>{
  await training(page);await page.getByRole('button',{name:/My Progress/}).click();await expect(page.locator('.puNextRequirements')).toContainText('WHAT YOU NEED NEXT');const t=page.locator('.puProgressTransfer');await expect(t).toBeVisible();await t.locator('summary').click();await expect(t).toContainText(/manual transfer—not an employee account, centralized manager dashboard, or official certification record/i);const result=await page.evaluate(()=>{localStorage.puProgress=JSON.stringify({demo:{complete:true,trainingVersion:window.PARADISE_UNIVERSITY_VERSION}});const p=window.puProgressTransferPayload();delete localStorage.puProgress;window.puApplyProgressTransfer(p);return[p.type,JSON.parse(localStorage.puProgress).demo.complete]});expect(result).toEqual(['PARADISE_UNIVERSITY_PROGRESS_TRANSFER',true]);
});

test('media adds local notes and a Practice-this-skill bridge without invented transcripts',async({page})=>{
  await training(page);await page.evaluate(()=>window.puPlayerOpen('grosso-tonality-audio'));const tools=page.locator('.puMediaLearningTools');await expect(tools).toBeVisible();await expect(tools).toContainText('LEARNING TOOLS');await expect(tools).toContainText(/does not fabricate one/i);await expect(page.locator('#puPracticeMediaSkill')).toBeVisible();await page.locator('#puMediaNote').fill('Slow down and keep a calm tone.');await page.locator('#puSaveMediaNote').click();await expect(page.locator('#puExperienceToast')).toContainText('Note saved');expect(await page.evaluate(()=>window.puMediaLearningNote('grosso-tonality-audio'))).toBe('Slow down and keep a calm tone.');
});

test('lesson completion gives subtle feedback and no gamification',async({page})=>{
  await training(page);await page.getByRole('button',{name:/Career Path/}).click();await page.getByRole('button',{name:/1\. Foundation/}).click();await page.getByRole('button',{name:/Your Job at the Door/}).click();await page.locator('#puDone').click();await expect(page.locator('#puExperienceToast')).toContainText(/Lesson complete/);await expect(page.getByText(/\bXP\b|\bstreaks?\b|\bleaderboards?\b/i)).toHaveCount(0);
});

test('manager-assigned training remains excluded',async({page})=>{await training(page);await expect(page.getByText(/manager-assigned|assigned training|due date/i)).toHaveCount(0)});
