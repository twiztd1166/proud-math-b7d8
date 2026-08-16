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
  await page.getByRole('button',{name:'No',exact:true}).click();
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

test('knowledge evidence persists but remains separate from content progress and certification',async({page})=>{
  await careerLesson(page,/3\. Certified Canvasser/,/Certified Canvasser Readiness/);
  await page.getByRole('button',{name:/No — manager demonstration and field verification still matter/}).click();
  let state=await page.evaluate(()=>({checks:window.puQuickCheckStats(),progress:JSON.parse(localStorage.puProgress||'{}'),required:window.puQuickCheckRequired('canvass-cert-ready'),passed:window.puQuickCheckPassed('canvass-cert-ready'),ready:window.puLessonTrainingReady('canvass-cert-ready')}));
  expect(state.checks['canvass-cert-ready'].correct).toBe(1);
  expect(state.checks['canvass-cert-ready'].passed).toBeTruthy();
  expect(state.required).toBeTruthy();expect(state.passed).toBeTruthy();expect(state.ready).toBeFalsy();
  expect(Object.keys(state.progress)).toHaveLength(0);
  await page.getByRole('button',{name:'MARK COMPLETE'}).click();
  state=await page.evaluate(()=>({progress:JSON.parse(localStorage.puProgress||'{}'),ready:window.puLessonTrainingReady('canvass-cert-ready')}));
  expect(state.progress['canvass-cert-ready'].complete).toBeTruthy();
  expect(state.ready).toBeTruthy();
  await expect(page.getByText(/Official certification remains separate|does not create official certification/i).first()).toBeVisible();
});

test('content completion alone leaves a required knowledge gate pending',async({page})=>{
  await careerLesson(page,/2\. Field Ready/,/Check the Municipality Before You Knock/);
  await page.getByRole('button',{name:'MARK COMPLETE'}).click();
  await expect(page.getByText(/required Quick Check still pending/i)).toBeVisible();
  const state=await page.evaluate(()=>({done:!!JSON.parse(localStorage.puProgress||'{}')['field-lookup']?.complete,passed:window.puQuickCheckPassed('field-lookup'),ready:window.puLessonTrainingReady('field-lookup')}));
  expect(state.done).toBeTruthy();expect(state.passed).toBeFalsy();expect(state.ready).toBeFalsy();
});

test('Quick Check version is explicit',async({page})=>{
  await page.goto('/index.html');await expect.poll(async()=>page.evaluate(()=>window.PU_CHECKS_VERSION)).toBe('2026.08.16-pu-checks-v2');
});
