import {test,expect} from '@playwright/test';

test('employee can Continue Training through a lesson with optional internal reference media',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await expect(page.locator('#puContinue')).toContainText('Welcome to Paradise University');await page.locator('#puContinue').click();
  await expect(page.getByRole('heading',{name:'Welcome to Paradise University'})).toBeVisible();
  for(const step of ['LEARN','WATCH / LISTEN','PRACTICE','PASS'])await expect(page.getByText(step,{exact:true})).toBeVisible();
  const media=page.locator('.puMediaCard').filter({hasText:'Canvassing Welcome Onboarding'}).first();await expect(media).toBeVisible();
  const mediaPolicy=await page.evaluate(()=>{const m=window.PU_CONTENT.media.find(x=>x.id==='tony-welcome-onboarding');return window.puMediaRightsStatus(m)});expect(mediaPolicy.playAllowed).toBeTruthy();expect(mediaPolicy.status).toBe('INTERNAL_TRAINING_USE');
  await page.getByRole('button',{name:'MARK COMPLETE'}).click();await expect(page.getByText('COMPLETE',{exact:true})).toBeVisible();
  const state=await page.evaluate(()=>({lesson:JSON.parse(localStorage.puProgress||'{}')['foundation-welcome'],media:window.puMediaProgressStatus?.('tony-welcome-onboarding'),ready:window.puLessonTrainingReady?.('foundation-welcome')}));
  expect(state.lesson?.complete).toBeTruthy();expect(state.lesson?.completedAt).toBeTruthy();expect(state.media?.complete).toBeFalsy();expect(state.ready).toBeTruthy();
  await page.getByRole('button',{name:'NEXT LESSON'}).click();await expect(page.getByRole('heading',{name:'Your Job at the Door'})).toBeVisible();
  await page.reload();await page.locator('#nTrain').click();await page.getByRole('button',{name:/My Progress/}).first().click();await expect(page.getByRole('button',{name:/✓ Welcome to Paradise University/})).toBeVisible();
});

test('knowledge-gated lesson requires content plus Quick Check but not optional internal reference media completion',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await page.getByRole('button',{name:/Career Path/}).first().click();await page.getByRole('button',{name:/2\. Field Ready/}).click();await page.getByRole('button',{name:/Refusal Is a Stop, Not an Objection/}).click();
  await expect(page.getByRole('heading',{name:'Refusal Is a Stop, Not an Objection'})).toBeVisible();for(const step of ['LEARN','WATCH / LISTEN','PRACTICE','PASS','QUICK CHECK'])await expect(page.getByText(step,{exact:true})).toBeVisible();
  const media=page.locator('.puMediaCard').filter({hasText:'Formula For Handling Objections'}).first();await expect(media).toBeVisible();
  const mediaPolicy=await page.evaluate(()=>{const m=window.PU_CONTENT.media.find(x=>x.id==='grosso-objections-audio');return window.puMediaRightsStatus(m)});expect(mediaPolicy.playAllowed).toBeTruthy();expect(mediaPolicy.status).toBe('INTERNAL_TRAINING_USE');
  expect(await page.evaluate(()=>window.puLessonTrainingReady?.('field-refusal'))).toBeFalsy();
  await page.getByRole('button',{name:'Leave immediately'}).click();await expect(page.getByText('✓ Correct',{exact:true})).toBeVisible();expect(await page.evaluate(()=>window.puQuickCheckPassed?.('field-refusal'))).toBeTruthy();expect(await page.evaluate(()=>window.puLessonTrainingReady?.('field-refusal'))).toBeFalsy();
  await page.getByRole('button',{name:'MARK COMPLETE'}).click();await expect.poll(async()=>page.evaluate(()=>window.puLessonTrainingReady?.('field-refusal'))).toBeTruthy();
  const saved=await page.evaluate(()=>({lesson:JSON.parse(localStorage.puProgress||'{}')['field-refusal'],media:window.puMediaProgressStatus?.('grosso-objections-audio')}));expect(saved.lesson?.complete).toBeTruthy();expect(saved.lesson?.completedAt).toBeTruthy();expect(saved.media?.complete).toBeFalsy();
  await page.getByRole('button',{name:'NEXT LESSON'}).click();await expect(page.getByRole('heading',{name:'If Someone Questions the Route'})).toBeVisible();
});