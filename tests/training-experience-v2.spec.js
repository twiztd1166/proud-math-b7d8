import {test,expect} from '@playwright/test';

async function training(page){await page.goto('/index.html');await page.locator('#nTrain').click()}

test('Training home keeps one dominant queue and four primary employee tools',async({page})=>{
  await training(page);
  await expect.poll(async()=>page.evaluate(()=>window.PU_TRAINING_EXPERIENCE_VERSION)).toBe('2026.08.17-pu-training-experience-v2');
  await expect(page.locator('#puContinue')).toBeVisible();
  const tiles=page.locator('.puGrid .puTile');await expect(tiles).toHaveCount(4);
  for(const name of ['Practice','Videos & Audio','Career Path','My Progress'])await expect(page.getByRole('button',{name:new RegExp(name,'i')}).first()).toBeVisible();
  await expect(page.getByRole('button',{name:/CANVASSING LIBRARY/i})).toHaveCount(0);
  await expect(page.locator('.puPath')).toHaveCount(0);
  await expect(page.getByText('Canvasser Core',{exact:true})).toBeVisible();
});

test('default Continue Training stops at Canvasser core and excludes future-role lessons',async({page})=>{
  await page.goto('/index.html');
  const state=await page.evaluate(()=>({track:window.PU_DEFAULT_TRACK,stages:window.PU_DEFAULT_TRACK_STAGES,next:window.puNextLesson?.()?.id,all:window.PU_CONTENT.lessons.length,core:window.PU_CONTENT.lessons.filter(x=>window.PU_DEFAULT_TRACK_STAGES.includes(x.stage)).length}));
  expect(state.track).toBe('CANVASSER_CORE');expect(state.stages).toEqual(['foundation','field-ready','canvasser']);expect(state.core).toBeGreaterThan(0);expect(state.core).toBeLessThan(state.all);
  await page.evaluate(()=>{
    const p={},q={};
    for(const x of window.PU_CONTENT.lessons.filter(x=>window.PU_DEFAULT_TRACK_STAGES.includes(x.stage))){
      p[x.id]={complete:true,trainingVersion:window.PARADISE_UNIVERSITY_VERSION};
      if(window.puQuickCheckRequired?.(x.id))q[x.id]={passed:true,checksVersion:window.PU_CHECKS_VERSION,trainingVersion:window.PARADISE_UNIVERSITY_VERSION};
    }
    localStorage.puProgress=JSON.stringify(p);localStorage.puQuickChecksV1=JSON.stringify(q);
  });
  await page.reload();await page.locator('#nTrain').click();await expect(page.locator('#puContinue')).toContainText(/Core Training Complete/i);await expect(page.locator('#puContinue')).not.toContainText(/Senior|Sales Apprentice|Preparation/i);
});

test('Sales Apprentice is a short bridge and detailed sales process stays in Sales Rep Academy',async({page})=>{
  await training(page);await page.getByRole('button',{name:/Career Path/}).click();await page.getByRole('button',{name:/5\. Sales Apprentice/}).click();
  const buttons=page.locator('[data-lesson]');await expect(buttons).toHaveCount(4);
  for(const title of [/What Changes and What Does Not/,/Full Sales Process Map/,/Sales Shadowing/,/Sales Apprentice Readiness/])await expect(page.getByRole('button',{name:title})).toBeVisible();
  for(const duplicate of [/Sales Preparation/,/Advanced Needs Analysis/,/Company Story & Credibility/,/From Product Knowledge to Product Presentation/])await expect(page.getByRole('button',{name:duplicate})).toHaveCount(0);
  await page.getByRole('button',{name:/Career Path/}).click();await page.getByRole('button',{name:/6\. Sales Rep/}).click();await expect(page.getByRole('button',{name:/1\. Preparation/})).toBeVisible();await expect(page.getByRole('button',{name:/3\. Survey \/ Needs Analysis/})).toBeVisible();await expect(page.getByRole('button',{name:/7\. Product Presentation/})).toBeVisible();
});

test('Sales Apprentice bridge Next never enters hidden duplicate lessons',async({page})=>{
  await training(page);await page.getByRole('button',{name:/Career Path/}).click();await page.getByRole('button',{name:/5\. Sales Apprentice/}).click();await page.getByRole('button',{name:/What Changes and What Does Not/}).click();
  await page.getByRole('button',{name:'MARK COMPLETE'}).click();await expect(page.locator('#puNext')).toHaveText('NEXT BRIDGE LESSON');await page.locator('#puNext').click();await expect(page.getByRole('heading',{name:'The Full Sales Process Map'})).toBeVisible();
});

test('Videos & Audio shows each media item at most once and puts canvasser essentials first',async({page})=>{
  await training(page);await page.getByRole('button',{name:/Videos & Audio/}).click();
  for(const title of ['Continue Listening','Canvasser Essentials','Future Role Training'])await expect(page.locator('.puSection').filter({hasText:new RegExp(`^${title}$`)})).toBeVisible();
  for(const removed of ['Required for You','Manager Training','Tony Hoty','Dave Yoho','Rick Grosso / Grosso University','Paradise Training'])await expect(page.locator('.puSection').filter({hasText:new RegExp(`^${removed}$`)})).toHaveCount(0);
  const ids=await page.locator('[data-media]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-media')));expect(new Set(ids).size).toBe(ids.length);
  const essentials=page.locator('[data-playlist="Canvasser Essentials"] [data-media]');await expect(essentials).toHaveCount(6);const essentialIds=await essentials.evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-media')));expect(essentialIds.slice(0,2)).toEqual(['tony-new-canvasser-process','tony-canvassing-101']);
  await expect(page.getByRole('button',{name:/COMPLETE CANVASSING LIBRARY/})).toBeVisible();await expect(page.getByRole('button',{name:/FULL SOURCE LIBRARY/})).toBeVisible();
});

test('Continue Listening does not duplicate the same recording in another playlist',async({page})=>{
  await page.goto('/index.html');await page.evaluate(()=>localStorage.puLastMedia='tony-canvassing-101');await page.reload();await page.locator('#nTrain').click();await page.getByRole('button',{name:/Videos & Audio/}).click();
  await expect(page.locator('[data-playlist="Continue Listening"] [data-media="tony-canvassing-101"]')).toHaveCount(1);await expect(page.locator('[data-playlist="Canvasser Essentials"] [data-media="tony-canvassing-101"]')).toHaveCount(0);
  const ids=await page.locator('[data-media]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-media')));expect(new Set(ids).size).toBe(ids.length);
});

test('required Quick Check sits in PASS and completion sequence cannot skip it',async({page})=>{
  await training(page);await page.getByRole('button',{name:/Career Path/}).click();await page.getByRole('button',{name:/2\. Field Ready/}).click();await page.getByRole('button',{name:/Refusal Is a Stop, Not an Objection/}).click();
  const passStep=page.locator('.puLessonStep').filter({has:page.getByText('PASS',{exact:true})});await expect(passStep.locator('.puQuickCheck')).toBeVisible();
  await expect(page.locator('#puDone')).toBeDisabled();await expect(page.locator('#puNext')).toBeDisabled();await expect(page.locator('#puDone')).toHaveText('PASS QUICK CHECK FIRST');
  await page.getByRole('button',{name:'Leave immediately'}).click();await expect(page.locator('#puDone')).toBeEnabled();await expect(page.locator('#puNext')).toBeDisabled();
  await page.locator('#puDone').click();await expect(page.getByText('COMPLETE',{exact:true})).toBeVisible();await expect(page.locator('#puNext')).toBeEnabled();
});

test('manager required Quick Check also blocks forward navigation until passed and completed',async({page})=>{
  await training(page);await page.getByRole('button',{name:/Career Path/}).click();await page.getByRole('button',{name:/Canvass Manager Academy/}).click();await page.getByRole('button',{name:/Compliance Leadership/}).click();
  await expect(page.getByText('QUICK CHECK',{exact:true})).toBeVisible();await expect(page.locator('#puDone')).toBeDisabled();await expect(page.locator('#puNext')).toBeDisabled();
  await page.getByRole('button',{name:/Do not canvass; verify through the current compliance process/}).click();await expect(page.locator('#puDone')).toBeEnabled();await expect(page.locator('#puNext')).toBeDisabled();
  await page.locator('#puDone').click();await expect(page.locator('#puNext')).toBeEnabled();
});

test('lesson with no media removes empty WATCH LISTEN block',async({page})=>{
  await training(page);await page.getByRole('button',{name:/Career Path/}).click();await page.getByRole('button',{name:/1\. Foundation/}).click();await page.getByRole('button',{name:/Your Job at the Door/}).click();
  await expect(page.getByText('No media is required for this lesson.')).toHaveCount(0);await expect(page.getByText('WATCH / LISTEN',{exact:true})).toHaveCount(0);
});

test('practice lineage contains only valid lesson references for appointment scheduling',async({page})=>{
  await page.goto('/index.html');const state=await page.evaluate(()=>{const x=window.PU_PRACTICE_SCENARIOS.find(s=>s.id==='appointment-two-choices');return{x:x?.sourceLineage||[],exists:(x?.sourceLineage||[]).filter(v=>v.startsWith('lesson:')).every(v=>window.PU_CONTENT.lessons.some(l=>l.id===v.slice(7))||(window.PU_CONTENT.managerLessons||[]).some(l=>l.id===v.slice(7)))}});expect(state.x).toContain('lesson:canvass-close');expect(state.x).not.toContain('lesson:canvass-appointment');expect(state.exists).toBeTruthy();
});

test('Search hides archived duplicate Sales Apprentice lessons',async({page})=>{
  await training(page);await page.locator('#puMoreButton').click();await page.getByRole('button',{name:/Search Training/}).click();const input=page.locator('#puSearchInput');await input.fill('Advanced Needs Analysis');await page.waitForTimeout(25);await expect(page.locator('[data-result-id="sales-needs-analysis"]')).toHaveCount(0);expect(await page.evaluate(()=>window.PU_HIDDEN_DUPLICATE_LESSON_IDS.includes('sales-needs-analysis'))).toBeTruthy();
});

test('Sales Rep keeps lessons visible and collapses control evidence below them',async({page})=>{
  await training(page);await page.getByRole('button',{name:/Career Path/}).click();await page.getByRole('button',{name:/6\. Sales Rep/}).click();
  await expect(page.getByRole('button',{name:/1\. Preparation/})).toBeVisible();const controls=page.locator('details.puSalesControls');await expect(controls).toBeVisible();await expect(controls).not.toHaveAttribute('open','');await expect(controls.locator('summary')).toHaveText('Sales Controls & References');
});