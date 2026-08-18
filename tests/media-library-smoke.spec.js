import {test,expect} from '@playwright/test';

async function training(page){await page.goto('/index.html');await page.locator('#nTrain').click()}
async function sourceLibrary(page){await training(page);await page.locator('#puMoreButton').click();await page.getByRole('button',{name:/Source Library/}).click()}
const playlist=(page,title)=>page.locator(`[data-playlist="${title}"]`);

test('Videos & Audio exposes prioritized internal trainer media while preserving authority labels',async({page})=>{
  await training(page);await page.getByRole('button',{name:/Videos & Audio/}).first().click();
  await expect(page.getByRole('heading',{name:'Videos & Audio'})).toBeVisible();
  for(const title of ['Continue Listening','Canvasser Essentials','Future Role Training'])await expect(page.locator('.puSection').filter({hasText:new RegExp(`^${title}$`)})).toBeVisible();
  for(const old of ['Required for You','Manager Training','Tony Hoty','Dave Yoho','Rick Grosso / Grosso University','Paradise Training'])await expect(page.locator('.puSection').filter({hasText:new RegExp(`^${old.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`)})).toHaveCount(0);
  await expect(page.getByText('REFERENCE MEDIA:',{exact:true})).toBeVisible();
  await expect(page.getByText(/Paradise-approved lessons, current manager direction, and live municipality instructions control/i)).toBeVisible();
  await expect(page.getByRole('button',{name:/COMPLETE CANVASSING LIBRARY/})).toBeVisible();
  await expect(page.getByRole('button',{name:/FULL SOURCE LIBRARY/})).toBeVisible();
  await expect.poll(async()=>page.evaluate(()=>window.PU_MEDIA_UI_VERSION)).toBe('2026.08.16-pu-media-ui-v5');
  await expect.poll(async()=>page.evaluate(()=>window.PU_MEDIA_RIGHTS_VERSION)).toBe('2026.08.16-pu-media-internal-v2');
  await expect.poll(async()=>page.evaluate(()=>window.PU_TRAINING_EXPERIENCE_VERSION)).toBe('2026.08.17-pu-training-experience-v2');
});

test('all 12 curated trainer recordings remain available without duplicate curated-screen cards',async({page})=>{
  await training(page);await page.getByRole('button',{name:/Videos & Audio/}).first().click();
  const state=await page.evaluate(()=>({control:window.PU_MEDIA_RIGHTS_CONTROL,launch:window.PU_CURATED_MEDIA_IDS,hold:window.PU_RIGHTS_REVIEW_MEDIA_IDS}));
  expect(state.control?.status).toBe('INTERNAL_USE_NON_BLOCKING');
  expect(state.control?.curatedReviewedCount).toBe(12);expect(state.control?.curatedPlayableCount).toBe(12);expect(state.control?.curatedRightsHoldCount).toBe(0);
  expect(state.launch).toHaveLength(12);expect(state.hold).toHaveLength(0);
  const ids=await page.locator('[data-media]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-media')));expect(ids.length).toBeGreaterThan(0);expect(new Set(ids).size).toBe(ids.length);
  const essentials=playlist(page,'Canvasser Essentials').locator('[data-media]');await expect(essentials.first()).toHaveAttribute('data-media','tony-new-canvasser-process');
});

test('full source library retains trainer lineage and internal source access',async({page})=>{
  await sourceLibrary(page);
  for(const title of ['Canvassing DVD — Main','Extreme Sales Leadership','Sales Training'])await expect(page.getByText(title,{exact:true})).toBeVisible();
  const links=page.locator('.puLibraryGroup a.puLibraryItem[href]');await expect(links.first()).toBeVisible();
  const hrefs=await links.evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));expect(hrefs.some(h=>/drive\.google\.com|docs\.google\.com/.test(h||''))).toBeTruthy();
  await expect(page.locator('.puLibraryItem.puRightsHold')).toHaveCount(0);
});

test('direct player invocation uses top-level Drive launch with no embedded Google iframe',async({page})=>{
  await page.goto('/index.html');await page.evaluate(()=>window.puPlayerOpen('grosso-tonality-audio'));
  const root=page.locator('#puPlayerRoot');await expect(root.getByRole('dialog',{name:'Training player'})).toBeVisible();
  await expect(root.locator('iframe')).toHaveCount(0);await expect(root.locator('[data-provider="drive-top-level"]')).toBeVisible();
  const launch=root.getByRole('link',{name:/Play Tonality and Body Language in Google Drive/i});await expect(launch).toBeVisible();await expect(launch).toHaveAttribute('target','_blank');await expect(launch).toHaveAttribute('href',/drive\.google\.com\/file\/d\/1WNQ6ItT6Ar_HXGKNutWEvEFeHm14RjKn/);
  await expect(root.locator('.puPlayerAuthority')).toHaveText('SOURCE / REFERENCE');
  await expect(root.getByRole('button',{name:/MARK COMPLETE|COMPLETED/})).toBeVisible();await expect(root.getByRole('button',{name:/SAVE FOR LATER|SAVED/})).toBeVisible();
  await root.getByRole('button',{name:'Close player'}).click();await expect(root).toBeEmpty();
});

test('all Drive-backed trainer media avoid embedded Google playback',async({page})=>{
  await page.goto('/index.html');
  const ids=await page.evaluate(()=>window.PU_CONTENT.media.filter(x=>/drive\.google\.com\/file\//.test(x.url||'')&&!x.streamUrl).map(x=>x.id));
  expect(ids.length).toBeGreaterThan(0);
  for(const id of ids){await page.evaluate(mediaId=>window.puPlayerOpen(mediaId),id);const root=page.locator('#puPlayerRoot');await expect(root.locator('iframe')).toHaveCount(0);await expect(root.locator('[data-provider="drive-top-level"]')).toBeVisible();await expect(root.locator('#puDriveLaunch')).toHaveAttribute('target','_blank');await page.evaluate(()=>window.puPlayerOpen(''))}
});

test('internal-use control remains separate from Paradise authority classification',async({page})=>{
  await page.goto('/index.html');
  const result=await page.evaluate(()=>{const m=window.PU_CONTENT.media.find(x=>x.id==='grosso-tonality-audio');return{rights:window.puMediaRightsStatus(m),authority:m.authority}});
  expect(result.rights.playAllowed).toBeTruthy();expect(result.rights.status).toBe('INTERNAL_TRAINING_USE');expect(result.authority).toBe('REFERENCE');
});

test('expanded source catalog remains metadata-only in PWA bundle',async({page})=>{
  await page.goto('/index.html');const state=await page.evaluate(()=>({version:window.PU_CONTENT?.mediaCatalogVersion,count:window.PU_CONTENT?.media?.length||0,sourceOnly:window.PU_CONTENT?.media?.filter(x=>x.priority==='SOURCE_LIBRARY').length||0,streamed:window.PU_CONTENT?.media?.filter(x=>x.streamUrl).length||0}));
  expect(state.version).toBe('2026.08.16-pu-media-expanded-v1');expect(state.count).toBeGreaterThanOrEqual(30);expect(state.sourceOnly).toBeGreaterThanOrEqual(15);expect(state.streamed).toBe(0);
});

test('trainer library reconciliation accounts for all confirmed canonical media without expanding required playlists',async({page})=>{
  await page.goto('/index.html');
  const state=await page.evaluate(()=>{
    const media=window.PU_CONTENT?.media||[];
    const byTrainer=name=>media.filter(x=>x.trainer===name);
    const expected=[
      'tony-video-process','tony-video-no-luck-senior','tony-video-canvass-set','tony-video-callback','tony-soundbite-solara','tony-soundbite-storm','tony-soundbite-patio-door','tony-soundbite-multiproduct','tony-soundbite-gutter','tony-soundbite-french-doors','tony-soundbite-entry-doors',
      'dave-advertising-video','dave-website-video','dave-leads-audio',
      'grosso-objection-school-rbo','grosso-objection-school-reflex','grosso-objection-school-brush-offs','grosso-objection-school-true-objections','grosso-virtual-closers-needs-analysis','grosso-advanced-objections','grosso-advanced-ignore-objections','grosso-advanced-assume-vs-ask','grosso-advanced-tonality','grosso-advanced-tie-downs','grosso-advanced-calling-home','grosso-product-sales-academy-11','grosso-product-rick-step6','grosso-product-10-step','grosso-product-11-step','grosso-product-sherwin-williams','grosso-rick-goals','grosso-rick-objections-close','grosso-rick-overcoming-objections','grosso-rick-isolating-objections','grosso-rick-button-up','grosso-rick-good-lead','grosso-rick-retail-closes','grosso-rick-qualification','grosso-rick-needs-analysis','grosso-rick-overview','grosso-rick-introduction','grosso-rick-system-selling','grosso-company-11-step-story','grosso-company-rick-step4','grosso-company-11-step-demo','grosso-thermal-full-demo','grosso-thermal-measure','grosso-thermal-needs','grosso-thermal-intro'
    ];
    const added=expected.map(id=>media.find(x=>x.id===id));
    return{reconciliation:window.PU_CONTENT?.libraryReconciliationVersion,total:media.length,sourceOnly:media.filter(x=>x.priority==='SOURCE_LIBRARY').length,curated:media.filter(x=>x.priority!=='SOURCE_LIBRARY').length,expectedCount:expected.length,missing:expected.filter(id=>!media.some(x=>x.id===id)),wrongPriority:added.filter(x=>x&&x.priority!=='SOURCE_LIBRARY').map(x=>x.id),paradiseApproved:added.filter(x=>x&&x.authority==='PARADISE_APPROVED').map(x=>x.id),trainers:{tony:byTrainer('Tony Hoty').length,dave:byTrainer('Dave Yoho').length,grosso:byTrainer('Grosso University').length}};
  });
  expect(state.reconciliation).toBe('2026.08.16-pu-trainer-library-reconciliation-v1');
  expect(state.total).toBe(79);expect(state.sourceOnly).toBe(67);expect(state.curated).toBe(12);
  expect(state.expectedCount).toBe(49);expect(state.missing).toEqual([]);expect(state.wrongPriority).toEqual([]);expect(state.paradiseApproved).toEqual([]);
  expect(state.trainers).toEqual({tony:24,dave:4,grosso:51});
});

test('Canvassing Library visibly exposes every indexed Tony recording and manuals',async({page})=>{
  await training(page);await page.getByRole('button',{name:/Videos & Audio/}).first().click();
  await expect(page.getByRole('button',{name:/COMPLETE CANVASSING LIBRARY/})).toBeVisible();await page.getByRole('button',{name:/COMPLETE CANVASSING LIBRARY/}).click();
  await expect(page.getByRole('heading',{name:'Canvassing Library'})).toBeVisible();
  await expect.poll(async()=>page.evaluate(()=>window.PU_CANVASSING_LIBRARY_VERSION)).toBe('2026.08.16-pu-canvassing-library-v1');
  const model=await page.evaluate(()=>window.puCanvassingLibraryModel());
  expect(model.tonyTotal).toBe(24);expect(model.daveTotal).toBe(4);expect(model.grossoSupportTotal).toBeGreaterThan(0);expect(model.tonySourceTotal).toBeGreaterThanOrEqual(2);
  const tony=page.locator('[data-trainer-group="Tony Hoty"]');
  await expect(tony.locator('[data-media]')).toHaveCount(24);
  const ids=await tony.locator('[data-media]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-media')));expect(new Set(ids).size).toBe(24);
  await expect(tony.getByText(/Tony Hoty Canvassing Manual/i).first()).toBeVisible();await expect(tony.getByText(/Tony Hoty Master Training Manual/i).first()).toBeVisible();
  await expect(tony.getByText('PARADISE APPROVED',{exact:true})).toHaveCount(0);await expect(page.getByText(/current manager-approved canvass opening/i).first()).toBeVisible();await expect(page.getByText(/existing Paradise canvass script/i)).toHaveCount(0);await expect(page.getByText(/Advanced sales training does not authorize pricing/i)).toBeVisible();
  await page.getByRole('button',{name:/VIEW ALL TRAINER SOURCE MATERIAL/}).click();await expect(page.getByRole('heading',{name:'Source Library'})).toBeVisible();
});