import {test,expect} from '@playwright/test';

async function training(page){await page.goto('/index.html');await page.locator('#nTrain').click()}
async function sourceLibrary(page){await training(page);await page.locator('#puMoreButton').click();await page.getByRole('button',{name:/Source Library/}).click()}

test('curated Videos & Audio does not dump full source archive',async({page})=>{
  await training(page);await page.getByRole('button',{name:/Videos & Audio/}).first().click();
  await expect(page.getByRole('heading',{name:'Videos & Audio'})).toBeVisible();
  await expect(page.getByText('Tonality and Body Language',{exact:true}).first()).toBeVisible();
  await expect(page.getByText('Canvassing DVD — Main',{exact:true})).toHaveCount(0);
  await expect(page.getByText('Extreme Sales Leadership',{exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:/BROWSE FULL SOURCE LIBRARY/})).toBeVisible();
});

test('full source library exposes verified Tony and Grosso media',async({page})=>{
  await sourceLibrary(page);
  await expect(page.getByText('Canvassing DVD — Main',{exact:true})).toBeVisible();
  await expect(page.getByText('Extreme Sales Leadership',{exact:true})).toBeVisible();
  await expect(page.getByText('Sales Training',{exact:true})).toBeVisible();
});

test('historical source opens with visible historical authority in player',async({page})=>{
  await sourceLibrary(page);
  const card=page.locator('.puLibraryItem').filter({hasText:'Canvassing DVD — Main'}).first();
  await card.click();
  await expect(page.locator('.puPlayerAuthority')).toHaveText('HISTORICAL SOURCE');
  await expect(page.locator('.puPlayerNote')).toContainText(/Paradise-approved curriculum and current field instructions control/i);
});

test('reference source opens with visible source reference authority in player',async({page})=>{
  await sourceLibrary(page);
  const card=page.locator('.puLibraryItem').filter({hasText:'Extreme Sales Leadership'}).first();
  await card.click();
  await expect(page.locator('.puPlayerAuthority')).toHaveText('SOURCE / REFERENCE');
  await expect(page.locator('.puPlayerNote')).toContainText(/Source\/reference training/i);
});

test('expanded source catalog remains metadata-only in PWA bundle',async({page})=>{
  await page.goto('/index.html');
  const state=await page.evaluate(()=>({version:window.PU_CONTENT?.mediaCatalogVersion,count:window.PU_CONTENT?.media?.length||0,sourceOnly:window.PU_CONTENT?.media?.filter(x=>x.priority==='SOURCE_LIBRARY').length||0,streamed:window.PU_CONTENT?.media?.filter(x=>x.streamUrl).length||0}));
  expect(state.version).toBe('2026.08.16-pu-media-expanded-v1');
  expect(state.count).toBeGreaterThanOrEqual(30);
  expect(state.sourceOnly).toBeGreaterThanOrEqual(15);
  expect(state.streamed).toBe(0);
});
