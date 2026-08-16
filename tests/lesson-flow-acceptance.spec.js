import {test,expect} from '@playwright/test';

async function expectCloseInViewport(page,player){
  const close=player.getByRole('button',{name:'Close player'});await expect(close).toBeVisible();
  const box=await close.boundingBox(),vp=page.viewportSize();
  expect(box).not.toBeNull();expect(vp).not.toBeNull();
  expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x+box.width).toBeLessThanOrEqual(vp.width);expect(box.y+box.height).toBeLessThanOrEqual(vp.height);
  return close;
}

test('employee can Continue Training through lesson media completion and Next Lesson',async({page})=>{
  await page.goto('/index.html');
  await page.locator('#nTrain').click();
  await expect(page.locator('#puContinue')).toContainText('Welcome to Paradise University');
  await page.locator('#puContinue').click();
  await expect(page.getByRole('heading',{name:'Welcome to Paradise University'})).toBeVisible();
  for(const step of ['LEARN','WATCH / LISTEN','PRACTICE','PASS'])await expect(page.getByText(step,{exact:true})).toBeVisible();
  const media=page.locator('.puMediaCard').filter({hasText:'Canvassing Welcome Onboarding'}).first();
  await expect(media).toBeVisible();await media.getByRole('button',{name:'PLAY'}).click();
  const player=page.locator('#puPlayerRoot');await expect(player.getByRole('dialog',{name:'Training player'})).toBeVisible();
  await expect.poll(async()=>page.evaluate(()=>window.puPlayerCurrentId?.())).toBe('tony-welcome-onboarding');
  await player.getByRole('button',{name:'MARK COMPLETE'}).click();await expect(player.getByRole('button',{name:/COMPLETED/})).toBeVisible();
  const close=await expectCloseInViewport(page,player);await close.click();
  await page.getByRole('button',{name:'MARK COMPLETE'}).click();await expect(page.getByText('COMPLETE',{exact:true})).toBeVisible();
  const state=await page.evaluate(()=>({lesson:JSON.parse(localStorage.puProgress||'{}')['foundation-welcome'],media:window.puMediaProgressStatus?.('tony-welcome-onboarding')}));
  expect(state.lesson?.complete).toBeTruthy();expect(state.lesson?.completedAt).toBeTruthy();expect(state.media?.complete).toBeTruthy();
  await page.getByRole('button',{name:'NEXT LESSON'}).click();await expect(page.getByRole('heading',{name:'Your Job at the Door'})).toBeVisible();
  await page.reload();await page.locator('#nTrain').click();await page.getByRole('button',{name:/My Progress/}).first().click();
  await expect(page.getByRole('button',{name:/✓ Welcome to Paradise University/})).toBeVisible();
});

test('knowledge-gated lesson requires media practice check and content completion before ready',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await page.getByRole('button',{name:/Career Path/}).first().click();await page.getByRole('button',{name:/2\. Field Ready/}).click();await page.getByRole('button',{name:/Refusal Is a Stop, Not an Objection/}).click();
  await expect(page.getByRole('heading',{name:'Refusal Is a Stop, Not an Objection'})).toBeVisible();
  for(const step of ['LEARN','WATCH / LISTEN','PRACTICE','PASS','QUICK CHECK'])await expect(page.getByText(step,{exact:true})).toBeVisible();
  const media=page.locator('.puMediaCard').filter({hasText:'Formula For Handling Objections'}).first();await expect(media).toBeVisible();await media.getByRole('button',{name:'PLAY'}).click();
  const player=page.locator('#puPlayerRoot');await expect(player.getByRole('dialog',{name:'Training player'})).toBeVisible();await player.getByRole('button',{name:'MARK COMPLETE'}).click();const close=await expectCloseInViewport(page,player);await close.click();
  expect(await page.evaluate(()=>window.puLessonTrainingReady?.('field-refusal'))).toBeFalsy();
  await page.getByRole('button',{name:'Leave immediately'}).click();await expect(page.getByText('✓ Correct',{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>window.puQuickCheckPassed?.('field-refusal'))).toBeTruthy();expect(await page.evaluate(()=>window.puLessonTrainingReady?.('field-refusal'))).toBeFalsy();
  await page.getByRole('button',{name:'MARK COMPLETE'}).click();await expect.poll(async()=>page.evaluate(()=>window.puLessonTrainingReady?.('field-refusal'))).toBeTruthy();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.puProgress||'{}')['field-refusal']);expect(saved?.complete).toBeTruthy();expect(saved?.completedAt).toBeTruthy();
  await page.getByRole('button',{name:'NEXT LESSON'}).click();await expect(page.getByRole('heading',{name:'If Someone Questions the Route'})).toBeVisible();
});
