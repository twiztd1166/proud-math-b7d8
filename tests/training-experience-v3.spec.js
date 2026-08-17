import {test,expect} from '@playwright/test';
async function training(page){await page.goto('/index.html');await page.locator('#nTrain').click()}

test('polished home keeps four actions and adds useful milestone context',async({page})=>{
  await training(page);await expect.poll(async()=>page.evaluate(()=>({polish:window.PU_TRAINING_UX_POLISH_VERSION,v3:window.PU_TRAINING_EXPERIENCE_V3_VERSION}))).toEqual({polish:'2026.08.17-pu-training-ux-polish-v1',v3:'2026.08.17-pu-training-experience-v3'});
  await expect(page.locator('#puContinue small')).toContainText(/NEXT UP · \d+ MIN · 1 OF \d+ · FOUNDATION/i);await expect(page.locator('.puGrid .puTile')).toHaveCount(4);await expect(page.getByRole('button',{name:/CANVASSING LIBRARY/i})).toHaveCount(0);
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
  await training(page);await page.getByRole('button',{name:/Career Path/}).click();await page.getByRole('button',{name:/1\. Foundation/}).click();await page.getByRole('button',{name:/Your Job at the Door/}).click();await page.locator('#puDone').click();await expect(page.locator('#puExperienceToast')).toContainText(/Lesson complete/);await expect(page.getByText(/XP|streak|leaderboard/i)).toHaveCount(0);
});

test('manager-assigned training remains excluded',async({page})=>{await training(page);await expect(page.getByText(/manager-assigned|assigned training|due date/i)).toHaveCount(0)});
