import {test,expect} from '@playwright/test';
// Progress-state acceptance coverage for the role-aware Paradise University Training Experience v2.

test('My Progress puts the current canvasser track first and keeps certification evidence secondary',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await page.getByRole('button',{name:/My Progress/}).first().click();
  await expect(page.getByRole('heading',{name:'My Progress'})).toBeVisible();
  await expect(page.getByText('MY TRACK',{exact:true})).toBeVisible();await expect(page.getByText('Canvasser Core',{exact:true})).toBeVisible();
  await expect(page.getByText('CURRENT STAGE',{exact:true})).toBeVisible();await expect(page.getByText('NEXT STEP',{exact:true})).toBeVisible();await expect(page.getByText('CORE PROGRESS',{exact:true})).toBeVisible();
  await expect(page.getByText('Senior Canvasser',{exact:true})).toHaveCount(0);await expect(page.getByText('Sales Rep Academy — Part 1',{exact:true})).toHaveCount(0);await expect(page.getByText('Canvass Manager Academy',{exact:true})).toHaveCount(0);
  const details=page.locator('details').filter({hasText:/Advancement & certification details/});await expect(details).toBeVisible();await details.locator('summary').click();
  await expect(details.getByText('OFFICIAL CERTIFICATION',{exact:true})).toBeVisible();await expect(details).toContainText(/Manager demonstration, field verification/i);await expect(details.getByText('FUTURE TRAINING',{exact:true})).toBeVisible();await expect(details).toContainText(/Senior, Sales Apprentice, Sales Rep, and Manager content is available under Career Path/i);
  for(const label of ['Foundation','Field Ready','Canvasser'])await expect(details.getByText(label,{exact:true}).first()).toBeVisible();
});

test('opening a lesson creates in-progress state without completing it',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await page.locator('#puContinue').click();
  await expect(page.getByRole('heading',{name:'Welcome to Paradise University'})).toBeVisible();
  const stored=await page.evaluate(()=>JSON.parse(localStorage.puProgress||'{}')['foundation-welcome']);expect(stored?.startedAt).toBeTruthy();expect(stored?.complete).not.toBeTruthy();
  await expect.poll(async()=>page.evaluate(()=>window.puLessonProgressState?.('foundation-welcome'))).toBe('in-progress');
  await page.locator('#puBack').click();await page.getByRole('button',{name:/My Progress/}).first().click();
  await expect(page.getByText('Continue where you stopped',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:/Welcome to Paradise University/})).toBeVisible();
});

test('content marked complete does not satisfy a required knowledge gate',async({page})=>{
  await page.goto('/index.html');
  await page.evaluate(()=>{localStorage.puProgress=JSON.stringify({'field-lookup':{complete:true,startedAt:new Date().toISOString(),updatedAt:new Date().toISOString(),trainingVersion:window.PARADISE_UNIVERSITY_VERSION}})});
  await page.reload();await page.locator('#nTrain').click();await page.getByRole('button',{name:/My Progress/}).first().click();
  await expect(page.getByText(/0 of \d+ gates/)).toBeVisible();await expect(page.getByText(/knowledge check pending/i)).toBeVisible();
  await expect(page.getByRole('button',{name:/Check the Municipality Before You Knock/})).toBeVisible();
});

test('Career Path guidance covers every stage and preserves sales and manager boundaries',async({page})=>{
  await page.goto('/index.html');const keys=await page.evaluate(()=>Object.keys(window.PU_CAREER_GUIDANCE||{}).sort());expect(keys).toEqual(['canvasser','field-ready','foundation','manager','sales-apprentice','sales-rep','senior']);
  await page.locator('#nTrain').click();await page.getByRole('button',{name:/Career Path/}).first().click();
  await page.getByRole('button',{name:/1\. Foundation/}).click();let guide=page.locator('.puCareerGuide');for(const label of ['ROLE','SKILLS LEARNED','CERTIFICATION',"WHAT'S NEXT"])await expect(guide.getByText(label,{exact:true})).toBeVisible();await expect(guide).toContainText('Field Ready');
  await page.locator('#puBack').click();await page.getByRole('button',{name:/5\. Sales Apprentice/}).click();guide=page.locator('.puCareerGuide');await expect(guide).toContainText(/not authorization to quote, price, finance, contract, take payment, or sell at the door/i);await expect(guide).toContainText(/full sales-process map, supervised shadowing/i);
  await page.locator('#puBack').click();await page.getByRole('button',{name:/6\. Sales Rep/}).click();guide=page.locator('.puCareerGuide');await expect(guide).toContainText(/Full Sales Rep certification is not available from Part 1 alone/i);const controls=page.locator('details.puSalesControls');await controls.locator('summary').click();await expect(page.getByText(/CURRENT POLICY REQUIRED/)).toBeVisible();
  await page.locator('#puBack').click();await page.getByRole('button',{name:/Canvass Manager Academy/}).click();guide=page.locator('.puCareerGuide');await expect(guide).toContainText(/Manager certification remains separate from device completion/i);await expect(page.getByText(/manager does not override the live municipality result/i)).toBeVisible();
});

test('readiness infrastructure loads at the expected version',async({page})=>{
  await page.goto('/index.html');
  await expect.poll(async()=>page.evaluate(()=>window.PU_READINESS_VERSION)).toBe('2026.08.16-pu-readiness-v3');await expect.poll(async()=>page.evaluate(()=>window.PU_CAREER_GUIDANCE_VERSION)).toBe('2026.08.16-pu-career-guidance-v1');await expect.poll(async()=>page.evaluate(()=>window.PU_PROGRESS_STATE_VERSION)).toBe('2026.08.16-pu-progress-state-v1');await expect.poll(async()=>page.evaluate(()=>window.PARADISE_UNIVERSITY_VERSION)).toBe('2026.08.16-pu-v1-content-5');await expect.poll(async()=>page.evaluate(()=>window.PU_TRAINING_EXPERIENCE_VERSION)).toBe('2026.08.17-pu-training-experience-v2');
});