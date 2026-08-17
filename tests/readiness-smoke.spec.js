import {test,expect} from '@playwright/test';
// Progress-state acceptance coverage for the isolated Paradise University v1 build.

test('My Progress separates device training evidence from official certification',async({page})=>{
  await page.goto('/index.html');
  await page.locator('#nTrain').click();
  await page.getByRole('button',{name:/My Progress/}).first().click();
  await expect(page.getByRole('heading',{name:'My Progress'})).toBeVisible();
  await expect(page.getByText(/Device progress only/)).toBeVisible();
  await expect(page.getByText(/not an official Paradise certification/i)).toBeVisible();
  await expect(page.getByText('DEVICE TRAINING GATES',{exact:true})).toBeVisible();
  await expect(page.getByText('CONTENT MARKED COMPLETE',{exact:true})).toBeVisible();
  await expect(page.getByText('REQUIRED KNOWLEDGE CHECKS',{exact:true})).toBeVisible();
  await expect(page.getByText('OFFICIAL CERTIFICATION',{exact:true})).toBeVisible();
  await expect(page.getByText('Not stored on this device',{exact:true})).toBeVisible();
  await expect(page.getByText('NEXT CAREER STAGE',{exact:true})).toBeVisible();
  for(const label of ['Foundation','Field Ready','Canvasser','Senior Canvasser','Sales Apprentice','Sales Rep Academy — Part 1','Canvass Manager Academy'])await expect(page.getByText(label,{exact:true}).first()).toBeVisible();
  await expect(page.getByText(/manager role-play and field verification required/i)).toBeVisible();
  await expect(page.getByText(/current Paradise policy modules are still required before full Sales Rep certification/i)).toBeVisible();
});

test('opening a lesson creates in-progress state without completing it',async({page})=>{
  await page.goto('/index.html');
  await page.locator('#nTrain').click();await page.locator('#puContinue').click();
  await expect(page.getByRole('heading',{name:'Welcome to Paradise University'})).toBeVisible();
  const stored=await page.evaluate(()=>JSON.parse(localStorage.puProgress||'{}')['foundation-welcome']);
  expect(stored?.startedAt).toBeTruthy();expect(stored?.complete).not.toBeTruthy();
  await expect.poll(async()=>page.evaluate(()=>window.puLessonProgressState?.('foundation-welcome'))).toBe('in-progress');
  await page.locator('#puBack').click();await page.getByRole('button',{name:/My Progress/}).first().click();
  await expect(page.getByText(/1 in progress/)).toBeVisible();
  await expect(page.locator('#puInProgressList').getByRole('button',{name:/Welcome to Paradise University/})).toBeVisible();
});

test('content marked complete does not satisfy a required knowledge gate',async({page})=>{
  await page.goto('/index.html');
  await page.evaluate(()=>{localStorage.puProgress=JSON.stringify({'field-lookup':{complete:true,startedAt:new Date().toISOString(),updatedAt:new Date().toISOString(),trainingVersion:window.PARADISE_UNIVERSITY_VERSION}})});
  await page.reload();await page.locator('#nTrain').click();await page.getByRole('button',{name:/My Progress/}).first().click();
  await expect(page.getByText(/1 of \d+/).first()).toBeVisible();
  await expect(page.getByText(/0 of \d+ passed/)).toBeVisible();
  await expect(page.getByText(/knowledge check pending/i)).toBeVisible();
});

test('Career Path guidance covers every stage and preserves sales and manager boundaries',async({page})=>{
  await page.goto('/index.html');
  const keys=await page.evaluate(()=>Object.keys(window.PU_CAREER_GUIDANCE||{}).sort());
  expect(keys).toEqual(['canvasser','field-ready','foundation','manager','sales-apprentice','sales-rep','senior']);
  await page.locator('#nTrain').click();await page.getByRole('button',{name:/Career Path/}).first().click();
  await page.getByRole('button',{name:/1\. Foundation/}).click();
  let guide=page.locator('.puCareerGuide');
  for(const label of ['ROLE','SKILLS LEARNED','CERTIFICATION',"WHAT'S NEXT"])await expect(guide.getByText(label,{exact:true})).toBeVisible();
  await expect(guide).toContainText('Field Ready');
  await page.locator('#puBack').click();await page.getByRole('button',{name:/5\. Sales Apprentice/}).click();guide=page.locator('.puCareerGuide');
  await expect(guide).toContainText(/not authorization to quote, price, finance, contract, take payment, or sell at the door/i);
  await page.locator('#puBack').click();await page.getByRole('button',{name:/6\. Sales Rep/}).click();guide=page.locator('.puCareerGuide');
  await expect(guide).toContainText(/Full Sales Rep certification is not available from Part 1 alone/i);
  await expect(page.getByText(/CURRENT POLICY REQUIRED/)).toBeVisible();
  await page.locator('#puBack').click();await page.getByRole('button',{name:/Canvass Manager Academy/}).click();guide=page.locator('.puCareerGuide');
  await expect(guide).toContainText(/Manager certification remains separate from device completion/i);
  await expect(page.getByText(/manager does not override the live municipality result/i)).toBeVisible();
});

test('readiness infrastructure loads at the expected version',async({page})=>{
  await page.goto('/index.html');
  await expect.poll(async()=>page.evaluate(()=>window.PU_READINESS_VERSION)).toBe('2026.08.16-pu-readiness-v3');
  await expect.poll(async()=>page.evaluate(()=>window.PU_CAREER_GUIDANCE_VERSION)).toBe('2026.08.16-pu-career-guidance-v1');
  await expect.poll(async()=>page.evaluate(()=>window.PU_PROGRESS_STATE_VERSION)).toBe('2026.08.16-pu-progress-state-v1');
  await expect.poll(async()=>page.evaluate(()=>window.PARADISE_UNIVERSITY_VERSION)).toBe('2026.08.16-pu-v1-content-5');
});
