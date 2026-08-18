import {test,expect} from '@playwright/test';

test.beforeEach(async({page})=>{await page.goto('/index.html');await page.locator('#nTrain').click();await page.getByRole('button',{name:/Practice/}).first().click()});

test('Practice stays simple with four skill choices',async({page})=>{
  await expect(page.getByRole('heading',{name:'Practice'})).toBeVisible();
  for(const name of ['Practice Opening','Practice Objections','Practice Appointments','Practice Field Rules'])await expect(page.getByRole('button',{name:new RegExp(name,'i')})).toBeVisible();
  await expect(page.getByText(/Practice only/)).toBeVisible();
  await expect(page.getByText(/not an official certification or manager verification/i)).toBeVisible();
  await expect(page.locator('[data-practice-cat]')).toHaveCount(4);
  await expect(page.getByRole('button',{name:/Practice My Weak Areas/i})).toHaveCount(0);
});

test('Practice v2 data exposes 20 governed scenarios with five per category',async({page})=>{
  const model=await page.evaluate(()=>{
    const all=window.puPracticeScenarioPool();
    const categories=Object.fromEntries(['Opening','Objections','Appointments','Field Rules'].map(c=>[c,all.filter(x=>x.category===c).length]));
    return{count:all.length,categories,version:window.PU_PRACTICE_DATA_VERSION,complete:all.every(x=>x.id&&x.level&&Array.isArray(x.skillTags)&&x.skillTags.length&&Array.isArray(x.acceptedResponseConcepts)&&x.acceptedResponseConcepts.length&&Array.isArray(x.prohibitedResponseConcepts)&&x.prohibitedResponseConcepts.length&&typeof x.hardStop==='boolean'&&Array.isArray(x.scoreDimensions)&&x.scoreDimensions.length&&x.coachingNote&&Array.isArray(x.sourceLineage)&&x.sourceLineage.length&&x.trainingContentVersion),hardStops:all.filter(x=>x.hardStop).map(x=>x.id)};
  });
  expect(model.count).toBe(20);expect(model.categories).toEqual({'Opening':5,'Objections':5,'Appointments':5,'Field Rules':5});expect(model.version).toBe('2026.08.16-pu-practice-data-v2');expect(model.complete).toBeTruthy();expect(model.hardStops).toEqual(expect.arrayContaining(['opening-clean-exit','objection-leave-hardstop','field-no-go','field-leave','field-security','field-jurisdiction']));
});

test('field-rule scenario reveals governed coaching and records a practice attempt',async({page})=>{
  await page.getByRole('button',{name:/Practice Field Rules/}).click();
  const before=await page.evaluate(()=>window.puPracticeCurrentScenario());expect(before.category).toBe('Field Rules');expect(before.scoreDimensions).toContain('Compliance');
  await page.getByRole('button',{name:'SHOW COACHING ANSWER'}).click();
  await expect(page.locator('#puPracticeBox')).toContainText(/COACHING ANSWER/);await expect(page.locator('#puPracticeBox')).toContainText(/FOCUS:/);await expect(page.locator('#puPracticeBox')).toContainText(/Coaching focus:/);
  await page.getByRole('button',{name:'✓ GOT IT'}).click();
  await expect(page.locator('#puPracticeStats')).toContainText('1 today');await expect(page.locator('#puPracticeStats')).toContainText('1 total');
  const saved=await page.evaluate(()=>window.puPracticeStats());expect(saved.history).toHaveLength(1);expect(saved.history[0].scenarioId).toBe(before.id);expect(saved.history[0].category).toBe('Field Rules');expect(saved.history[0].trainingContentVersion).toBe('2026.08.16-pu-practice-data-v2');expect(saved.history[0].scoreDimensions).toContain('Compliance');
});

test('practice count persists on device and does not mark lessons complete',async({page})=>{
  await page.getByRole('button',{name:/Practice Objections/}).click();await page.getByRole('button',{name:'SHOW COACHING ANSWER'}).click();await page.getByRole('button',{name:'↻ NEED MORE PRACTICE'}).click();
  const before=await page.evaluate(()=>({practice:window.puPracticeStats(),progress:JSON.parse(localStorage.puProgress||'{}')}));
  expect(before.practice.total).toBe(1);expect(before.practice.history[0].outcome).toBe('NEEDS_PRACTICE');expect(before.practice.weakCount).toBe(1);expect(Object.keys(before.progress)).toHaveLength(0);
  await page.reload();await page.locator('#nTrain').click();await page.getByRole('button',{name:/Practice/}).first().click();await expect(page.locator('#puPracticeStats')).toContainText('1 total');await expect(page.getByRole('button',{name:/Practice My Weak Areas/i})).toBeVisible();
});

test('Needs Practice creates adaptive review and a correct retry clears the weak flag',async({page})=>{
  await page.getByRole('button',{name:/Practice Objections/}).click();const first=await page.evaluate(()=>window.puPracticeCurrentScenario().id);await page.getByRole('button',{name:'SHOW COACHING ANSWER'}).click();await page.getByRole('button',{name:'↻ NEED MORE PRACTICE'}).click();
  await expect(page.getByRole('button',{name:/Practice My Weak Areas/i})).toBeVisible();expect(await page.evaluate(()=>window.puPracticeWeakScenarioIds())).toEqual([first]);
  await page.getByRole('button',{name:/Practice My Weak Areas/i}).click();expect(await page.evaluate(()=>window.puPracticeCurrentScenario().id)).toBe(first);await page.getByRole('button',{name:'SHOW COACHING ANSWER'}).click();await page.getByRole('button',{name:'✓ GOT IT'}).click();
  expect(await page.evaluate(()=>window.puPracticeWeakScenarioIds())).toEqual([]);await expect(page.getByRole('button',{name:/Practice My Weak Areas/i})).toHaveCount(0);
});

test('next scenario remains inside selected practice category and avoids immediate repeat',async({page})=>{
  await page.getByRole('button',{name:/Practice Appointments/}).click();const first=await page.evaluate(()=>window.puPracticeCurrentScenario().id);await page.getByRole('button',{name:'SHOW COACHING ANSWER'}).click();await page.getByRole('button',{name:'NEXT SCENARIO'}).click();const second=await page.evaluate(()=>window.puPracticeCurrentScenario());expect(second.category).toBe('Appointments');expect(second.id).not.toBe(first);
});

test('hard-stop metadata prohibits continuation concepts',async({page})=>{
  const stops=await page.evaluate(()=>window.puPracticeScenarioPool().filter(x=>x.hardStop).map(x=>({id:x.id,prohibited:x.prohibitedResponseConcepts.join(' ').toLowerCase(),accepted:x.acceptedResponseConcepts.join(' ').toLowerCase()})));
  expect(stops.length).toBeGreaterThanOrEqual(6);
  for(const x of stops){expect(x.accepted).toMatch(/stop|leave|exit|does not canvass|verification|follows live lookup/);expect(x.prohibited).toMatch(/rebuttal|continue|argument|knock|workaround|delay|question|literature|ignore|guess|debate/)}
});

test('Practice engine and data versions are explicit',async({page})=>{
  await expect.poll(async()=>page.evaluate(()=>({engine:window.PU_PRACTICE_VERSION,data:window.PU_PRACTICE_DATA_VERSION}))).toEqual({engine:'2026.08.17-pu-practice-v3-adaptive',data:'2026.08.16-pu-practice-data-v2'});
});
