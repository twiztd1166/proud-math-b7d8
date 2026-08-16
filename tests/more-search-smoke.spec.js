import {test,expect} from '@playwright/test';

async function training(page){await page.goto('/index.html');await page.locator('#nTrain').click()}
async function more(page){await training(page);await page.locator('#puMoreButton').click()}
async function search(page,q){await more(page);await page.getByRole('button',{name:/Search Training/}).click();await page.getByPlaceholder(/Try: not interested/).fill(q);return page.locator('.puSearchResult')}

test('five primary training actions remain simple and More stays secondary',async({page})=>{
  await training(page);
  await expect(page.getByRole('button',{name:/Practice/}).first()).toBeVisible();
  await expect(page.getByRole('button',{name:/Career Path/}).first()).toBeVisible();
  await expect(page.getByRole('button',{name:/Videos & Audio/}).first()).toBeVisible();
  await expect(page.getByRole('button',{name:/My Progress/}).first()).toBeVisible();
  await expect(page.locator('#puContinue')).toBeVisible();
  await expect(page.locator('#puMoreButton')).toBeVisible();
});

test('More exposes only secondary training tools',async({page})=>{
  await more(page);
  await expect(page.getByRole('heading',{name:'More'})).toBeVisible();
  await expect(page.getByRole('button',{name:/Search Training/})).toBeVisible();
  await expect(page.getByRole('button',{name:/Source Library/})).toBeVisible();
  await expect(page.getByRole('button',{name:/Manager Training/})).toBeVisible();
  await expect(page.getByRole('button',{name:/Current Reference Documents/})).toBeVisible();
});

test('training search ranks a Paradise lesson before reference material',async({page})=>{
  const results=await search(page,'permit');
  await expect(results.first()).toContainText('PARADISE LESSON');
  await expect(page.getByText(/Training search never replaces the live municipality result/)).toBeVisible();
});

test('operational search authority is deterministic across high-risk queries',async({page})=>{
  for(const q of ['price','financing','no go','courtesy notice','refusal']){
    const results=await search(page,q);
    await expect(results.first(),`Expected Paradise lesson first for ${q}`).toContainText('PARADISE LESSON');
    await page.locator('#puBack').click();
  }
});

test('source-name searches remain relevance-first when the query is not operational',async({page})=>{
  const results=await search(page,'Tony Hoty');
  await expect(results.first()).toContainText(/SOURCE \/ REFERENCE|MEDIA/);
});

test('search source results cannot expose rights-unverified trainer Drive links',async({page})=>{
  await search(page,'Tony Hoty');
  await expect(page.locator('.puSearchResult.source.puRightsHold').first()).toBeVisible();
  await expect(page.locator('.puSearchResult.source.puRightsHold').first()).toContainText(/RIGHTS REVIEW/);
  const hrefs=await page.locator('a.puSearchResult.source[href]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
  expect(hrefs.some(h=>/drive\.google\.com|docs\.google\.com/.test(h||''))).toBeFalsy();
  await expect.poll(async()=>page.evaluate(()=>window.PU_MORE_RIGHTS_GATE_VERSION)).toBe('2026.08.16-pu-more-rights-v1');
});

test('training search can find practice content',async({page})=>{
  await more(page);await page.getByRole('button',{name:/Search Training/}).click();
  await page.getByPlaceholder(/Try: not interested/).fill('not interested');
  await expect(page.locator('.puSearchResult.drill').first()).toBeVisible();
});

test('source library visibly separates all source groups from current controls',async({page})=>{
  await more(page);await page.getByRole('button',{name:/Source Library/}).click();
  await expect(page.getByRole('heading',{name:'Source Library'})).toBeVisible();
  await expect(page.getByText(/SOURCE \/ REFERENCE MATERIAL:/)).toBeVisible();
  await expect(page.locator('.puSection').filter({hasText:/^Tony Hoty$/})).toBeVisible();
  await expect(page.locator('.puSection').filter({hasText:/^Dave Yoho$/})).toBeVisible();
  await expect(page.locator('.puSection').filter({hasText:/^Rick Grosso \/ Grosso University$/})).toBeVisible();
  await expect(page.locator('.puSection').filter({hasText:/^Paradise Historical Training$/})).toBeVisible();
  await expect(page.getByText(/No controlled historical Paradise training source is loaded in this build/)).toBeVisible();
  await expect(page.locator('.puSection').filter({hasText:/^Paradise Current Reference$/})).toBeVisible();
  await expect(page.getByRole('button',{name:/Live Municipality Lookup/})).toBeVisible();
});

test('Source Library retains trainer lineage but blocks copied-file anchors',async({page})=>{
  await more(page);await page.getByRole('button',{name:/Source Library/}).click();
  for(const name of ['Tony Hoty','Dave Yoho','Rick Grosso / Grosso University']){
    const heading=page.locator('.puSection').filter({hasText:new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`)});
    await expect(heading).toBeVisible();
  }
  await expect(page.locator('.puLibraryItem.puRightsHold').first()).toBeVisible();
  await expect(page.locator('.puLibraryItem.puRightsHold').first()).toContainText(/RIGHTS REVIEW/);
  const trainerHrefs=await page.locator('.puLibraryGroup a.puLibraryItem[href]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
  expect(trainerHrefs.some(h=>/drive\.google\.com|docs\.google\.com/.test(h||''))).toBeFalsy();
  await expect(page.getByRole('button',{name:/Live Municipality Lookup/})).toBeVisible();
});

test('More can open Manager Training without permissions or lock screens',async({page})=>{
  await more(page);await page.getByRole('button',{name:/Manager Training/}).click();
  await expect(page.getByRole('heading',{name:'Canvass Manager Academy'})).toBeVisible();
  await expect(page.getByText(/manager does not override the live municipality result/i)).toBeVisible();
});

test('current reference documents keep Lookup one tap away',async({page})=>{
  await more(page);await page.getByRole('button',{name:/Current Reference Documents/}).click();
  await page.getByRole('button',{name:/Live Municipality Lookup/}).click();
  await expect(page.getByRole('heading',{name:'Can I canvass here?'})).toBeVisible();
});
