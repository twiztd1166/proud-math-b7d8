import {test,expect} from '@playwright/test';

async function training(page){await page.goto('/index.html');await page.locator('#nTrain').click()}
async function sourceLibrary(page){await training(page);await page.locator('#puMoreButton').click();await page.getByRole('button',{name:/Source Library/}).click()}
const playlist=(page,title)=>page.locator(`[data-playlist="${title}"]`);

test('Videos & Audio keeps playlist architecture but separates rights-review assets from launch-ready media',async({page})=>{
  await training(page);await page.getByRole('button',{name:/Videos & Audio/}).first().click();
  await expect(page.getByRole('heading',{name:'Videos & Audio'})).toBeVisible();
  for(const title of ['Continue Listening','Required for You','Canvasser Essentials','Future Sales Rep','Manager Training','Tony Hoty','Dave Yoho','Rick Grosso / Grosso University','Paradise Training','Rights Review — Not Release Ready'])await expect(page.locator('.puSection').filter({hasText:new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`)})).toBeVisible();
  await expect(page.getByText(/MEDIA RIGHTS GATE/i)).toBeVisible();
  await expect(page.getByRole('button',{name:/BROWSE FULL SOURCE LIBRARY/})).toBeVisible();
  await expect.poll(async()=>page.evaluate(()=>window.PU_MEDIA_UI_VERSION)).toBe('2026.08.16-pu-media-ui-v4');
  await expect.poll(async()=>page.evaluate(()=>window.PU_MEDIA_RIGHTS_VERSION)).toBe('2026.08.16-pu-media-rights-v1');
});

test('all 12 current curated third-party recordings stay on rights hold and none are launch-playable',async({page})=>{
  await training(page);await page.getByRole('button',{name:/Videos & Audio/}).first().click();
  const state=await page.evaluate(()=>({control:window.PU_MEDIA_RIGHTS_CONTROL,launch:window.PU_CURATED_MEDIA_IDS,hold:window.PU_RIGHTS_REVIEW_MEDIA_IDS}));
  expect(state.control?.status).toBe('RELEASE_BLOCKED_PENDING_RIGHTS');
  expect(state.control?.curatedReviewedCount).toBe(12);
  expect(state.control?.curatedPlayableCount).toBe(0);
  expect(state.control?.curatedRightsHoldCount).toBe(12);
  expect(state.launch).toHaveLength(0);
  expect(state.hold).toHaveLength(12);
  await expect(playlist(page,'Canvasser Essentials')).toContainText(/No rights-cleared canvasser-essential media/i);
  await expect(playlist(page,'Future Sales Rep')).toContainText(/No rights-cleared sales-development media/i);
  await expect(playlist(page,'Manager Training')).toContainText(/No rights-cleared manager media/i);
  await expect(playlist(page,'Tony Hoty')).toContainText(/No rights-cleared Tony Hoty media/i);
  await expect(playlist(page,'Dave Yoho')).toContainText(/No rights-cleared Dave Yoho media/i);
  await expect(playlist(page,'Rick Grosso / Grosso University')).toContainText(/No rights-cleared Grosso University media/i);
  await expect(playlist(page,'Paradise Training')).toContainText(/No Paradise-owned \/ rights-cleared media file/i);
  await expect(playlist(page,'Rights Review — Not Release Ready').locator('.puMediaCard')).toHaveCount(12);
  await expect(playlist(page,'Rights Review — Not Release Ready').getByRole('button',{name:'RIGHTS REVIEW'})).toHaveCount(12);
  await expect(page.locator('a.puSourceOpen')).toHaveCount(0);
});

test('full source library retains third-party media lineage but disables copied-file playback',async({page})=>{
  await sourceLibrary(page);
  for(const title of ['Canvassing DVD — Main','Extreme Sales Leadership','Sales Training'])await expect(page.getByText(title,{exact:true})).toBeVisible();
  const historical=page.locator('.puLibraryItem').filter({hasText:'Canvassing DVD — Main'}).first();
  const reference=page.locator('.puLibraryItem').filter({hasText:'Extreme Sales Leadership'}).first();
  await expect(historical).toBeDisabled();await expect(reference).toBeDisabled();
  await expect(historical).toHaveAttribute('data-rights-hold','1');await expect(reference).toHaveAttribute('data-rights-hold','1');
  await expect(historical).toContainText(/RIGHTS REVIEW/i);await expect(reference).toContainText(/RIGHTS REVIEW/i);
});

test('direct player invocation cannot bypass rights hold for copied third-party media',async({page})=>{
  await page.goto('/index.html');
  await page.evaluate(()=>window.puPlayerOpen('grosso-tonality-audio'));
  const root=page.locator('#puPlayerRoot');
  await expect(root.getByRole('dialog',{name:'Media rights hold'})).toBeVisible();
  await expect(root.getByText(/PLAYBACK BLOCKED/i)).toBeVisible();
  await expect(root.getByText(/has not verified an internal reproduction \/ re-hosting right/i)).toBeVisible();
  await expect(root.locator('iframe,video,audio')).toHaveCount(0);
  await expect(root.getByRole('link')).toHaveCount(0);
  await root.getByRole('button',{name:'Close player'}).click();
  await expect(root).toBeEmpty();
});

test('rights gate supports explicit future internal-hosting metadata without changing default-deny',async({page})=>{
  await page.goto('/index.html');
  const result=await page.evaluate(()=>{const m=window.PU_CONTENT.media.find(x=>x.id==='grosso-tonality-audio');const before=window.puMediaRightsStatus(m);m.rightsStatus='APPROVED_INTERNAL_HOSTING';m.rightsBasis='Test-only controlled permission';const after=window.puMediaRightsStatus(m);delete m.rightsStatus;delete m.rightsBasis;return{before,after}});
  expect(result.before.playAllowed).toBeFalsy();expect(result.before.status).toBe('RIGHTS_UNVERIFIED');
  expect(result.after.playAllowed).toBeTruthy();expect(result.after.status).toBe('APPROVED_INTERNAL_HOSTING');
});

test('expanded source catalog remains metadata-only in PWA bundle',async({page})=>{
  await page.goto('/index.html');
  const state=await page.evaluate(()=>({version:window.PU_CONTENT?.mediaCatalogVersion,count:window.PU_CONTENT?.media?.length||0,sourceOnly:window.PU_CONTENT?.media?.filter(x=>x.priority==='SOURCE_LIBRARY').length||0,streamed:window.PU_CONTENT?.media?.filter(x=>x.streamUrl).length||0}));
  expect(state.version).toBe('2026.08.16-pu-media-expanded-v1');
  expect(state.count).toBeGreaterThanOrEqual(30);
  expect(state.sourceOnly).toBeGreaterThanOrEqual(15);
  expect(state.streamed).toBe(0);
});