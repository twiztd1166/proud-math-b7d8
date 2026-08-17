import {test,expect} from '@playwright/test';

async function openTraining(page){await page.goto('/index.html');await page.locator('#nTrain').click()}

test('opener authority is consistent outside the pending-currentness lesson',async({page})=>{
  await openTraining(page);
  await page.getByRole('button',{name:/CANVASSING LIBRARY/i}).click();
  await expect(page.getByText(/current manager-approved canvass opening/i).first()).toBeVisible();
  await expect(page.getByText(/existing Paradise canvass script/i)).toHaveCount(0);
  const scenarios=await page.evaluate(()=>window.puPracticeScenarioPool().filter(x=>x.category==='Opening').map(x=>`${x.prompt} ${x.answer} ${x.coachingNote||''}`));
  const scenarioText=scenarios.join(' ');
  expect(scenarioText).not.toMatch(/Paradise base opening|base Paradise opening|approved neutral project question|Fix observable delivery before rewriting approved words/i);
  expect(scenarioText).toMatch(/current manager-approved/i);
  await page.getByRole('button',{name:/← Training/}).click();
  await page.getByRole('button',{name:/Career Path/}).first().click();
  await page.getByRole('button',{name:/Canvass Manager Academy/}).click();
  await page.locator('.puManagerCurriculum summary').click();
  await page.getByRole('button',{name:/Coach the Opening & Conversation/}).click();
  await expect(page.getByText(/current manager-approved Paradise opening/i).first()).toBeVisible();
  await expect(page.getByText(/approved Paradise script/i)).toHaveCount(0);
});

test('stale lesson completion does not satisfy current curriculum and is retained as history on recompletion',async({page})=>{
  await page.goto('/index.html');
  const current=await page.evaluate(()=>window.PARADISE_UNIVERSITY_VERSION);
  await page.evaluate(()=>localStorage.puProgress=JSON.stringify({'foundation-welcome':{complete:true,startedAt:'2026-01-01T00:00:00.000Z',completedAt:'2026-01-01T00:05:00.000Z',updatedAt:'2026-01-01T00:05:00.000Z',trainingVersion:'old-version'}}));
  await page.reload();
  expect(await page.evaluate(()=>puLessonDone('foundation-welcome'))).toBeFalsy();
  expect(await page.evaluate(()=>window.puLessonProgressState('foundation-welcome'))).toBe('in-progress');
  await page.locator('#nTrain').click();
  await page.getByRole('button',{name:/Welcome to Paradise University/}).click();
  await page.getByRole('button',{name:'MARK COMPLETE'}).click();
  const record=await page.evaluate(()=>JSON.parse(localStorage.puProgress)['foundation-welcome']);
  expect(record.complete).toBeTruthy();expect(record.trainingVersion).toBe(current);
  expect(record.completionHistory).toEqual(expect.arrayContaining([expect.objectContaining({trainingVersion:'old-version'})]));
});

test('stale Quick Check pass is invalid until answered under current versions',async({page})=>{
  await page.goto('/index.html');
  const trainingVersion=await page.evaluate(()=>window.PARADISE_UNIVERSITY_VERSION);
  await page.evaluate(v=>localStorage.puQuickChecksV1=JSON.stringify({'field-lookup':{attempts:1,correct:1,passed:true,checksVersion:'old-checks',trainingVersion:v,updatedAt:'2026-01-01T00:00:00.000Z'}}),trainingVersion);
  await page.reload();
  expect(await page.evaluate(()=>window.puQuickCheckPassed('field-lookup'))).toBeFalsy();
  await page.locator('#nTrain').click();await page.getByRole('button',{name:/Career Path/}).first().click();await page.getByRole('button',{name:/2\. Field Ready/}).click();await page.getByRole('button',{name:/Check the Municipality Before You Knock/}).click();
  await page.getByRole('button',{name:'The live municipality lookup'}).click();
  const state=await page.evaluate(()=>({record:JSON.parse(localStorage.puQuickChecksV1)['field-lookup'],checksVersion:window.PU_CHECKS_VERSION}));
  expect(state.record.passed).toBeTruthy();expect(state.record.checksVersion).toBe(state.checksVersion);expect(state.record.trainingVersion).toBe(trainingVersion);
  expect(state.record.versionHistory).toEqual(expect.arrayContaining([expect.objectContaining({checksVersion:'old-checks'})]));
});

test('home progress uses readiness gates and completed curriculum has a clean terminal state',async({page})=>{
  await page.goto('/index.html');
  await page.evaluate(()=>{
    const now=new Date().toISOString(),p={};for(const x of PU_LESSONS)p[x.id]={complete:true,startedAt:now,completedAt:now,updatedAt:now,trainingVersion:PU_VERSION};localStorage.puProgress=JSON.stringify(p);localStorage.removeItem('puQuickChecksV1');
  });
  await page.reload();await page.locator('#nTrain').click();
  await expect(page.locator('.puProgressText')).toContainText('Device training gates');
  await expect(page.locator('.puProgressText')).not.toContainText('100%');
  expect(await page.evaluate(()=>puNextLesson()?.id||null)).not.toBeNull();
  await page.evaluate(()=>{
    const checks=window.puQuickCheckStats(),ids=PU_LESSONS.filter(x=>window.puQuickCheckRequired(x.id)).map(x=>x.id),now=new Date().toISOString();for(const id of ids)checks[id]={attempts:1,correct:1,passed:true,lastCorrect:true,updatedAt:now,checksVersion:window.PU_CHECKS_VERSION,trainingVersion:PU_VERSION};localStorage.puQuickChecksV1=JSON.stringify(checks)
  });
  await page.reload();await page.locator('#nTrain').click();
  expect(await page.evaluate(()=>puNextLesson())).toBeNull();
  await expect(page.getByRole('button',{name:/Training Complete/})).toBeVisible();
  await expect(page.locator('.puProgressText')).toContainText('100%');
});

test('final lesson exits to progress instead of looping and career stage is Canvasser',async({page})=>{
  await openTraining(page);
  await page.getByRole('button',{name:/Career Path/}).first().click();
  await expect(page.getByRole('button',{name:/3\. Canvasser/})).toBeVisible();
  await expect(page.getByRole('button',{name:/3\. Certified Canvasser/})).toHaveCount(0);
  const last=await page.evaluate(()=>PU_LESSONS[PU_LESSONS.length-1].id);
  await page.evaluate(id=>puSetPage('lesson:'+id),last);
  await expect(page.getByRole('button',{name:'VIEW PROGRESS'})).toBeVisible();
  await page.getByRole('button',{name:'VIEW PROGRESS'}).click();
  await expect(page.getByRole('heading',{name:'My Progress'})).toBeVisible();
});

test('deep-audit runtime marker is explicit',async({page})=>{
  await page.goto('/index.html');
  const state=await page.evaluate(()=>({fix:window.PU_DEEP_AUDIT_FIXES_VERSION,completion:window.PU_COMPLETION_MODEL_VERSION,checks:window.PU_CHECKS_VERSION}));
  expect(state).toEqual({fix:'2026.08.17-pu-deep-audit-fixes-v1',completion:'2026.08.17-current-curriculum-only-v1',checks:'2026.08.17-pu-checks-v3-versioned'});
});
