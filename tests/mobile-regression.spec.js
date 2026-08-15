import {test,expect} from '@playwright/test';
async function pick(page,name){
  await page.getByPlaceholder('Start typing a city…').fill(name);
  await page.locator('.opt').filter({hasText:name}).first().click();
}
async function setupGo(page,address='123 Test Route'){
  await page.goto('/index.html');
  await pick(page,'Dania');
  await page.getByRole('button',{name:/RUN DAILY CHECK/}).click();
  await page.getByPlaceholder('Manager name').fill('Test Manager');
  await page.getByPlaceholder('Neighborhood / route').fill('Test Route A');
  await page.getByPlaceholder('Exact street address or boundary').fill(address);
  await page.getByRole('checkbox').check();
  await page.getByRole('button',{name:/START 5 CHECKS/}).click();
}
test('lookup renders canvass, hours hold, hanger, courtesy and both NO-GOs',async({page})=>{
  await page.goto('/index.html');
  await expect(page.getByRole('heading',{name:'Can I canvass here?'})).toBeVisible();
  await pick(page,'Boynton Beach');
  await expect(page.locator('.traffic')).toContainText('GO — HOURS ON HOLD');
  await expect(page.locator('.traffic')).toContainText('CANVASSING');
  await expect(page.locator('.blockBanner').filter({hasText:'HOURS NOT CLEARED.'})).toBeVisible();
  await expect(page.getByRole('button',{name:/HOURS NOT CLEARED — DO NOT START ROUTE/})).toBeVisible();
  const hangerSummary=page.locator('section.card.essentials').filter({hasText:'DOOR HANGER'});
  await expect(hangerSummary.getByText('DOOR HANGER',{exact:true})).toBeVisible();
  await expect(hangerSummary).toContainText('Leave it securely at the private front entry');
  await expect(hangerSummary).toContainText('Never put Paradise literature in, on, or attached to a USPS mailbox');
  const courtesySummary=page.locator('section.card.essentials').filter({hasText:'INSTALLATION-DAY COURTESY NOTICE'});
  await expect(courtesySummary.getByText('INSTALLATION-DAY COURTESY NOTICE',{exact:true})).toBeVisible();
  await expect(courtesySummary).toContainText('Leave it securely at the private front entry');
  await expect(courtesySummary).toContainText('Permission to work at one home does not give permission to distribute to neighbors');
  await page.locator('#nRel').click();
  await expect(page.getByRole('heading',{name:'Daily Check'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'HOURS NOT CLEARED'})).toBeVisible();
  await expect(page.getByText(/Do not start a commercial canvass route/).first()).toBeVisible();
  await page.getByRole('button',{name:'Back'}).click();
  await page.getByRole('button',{name:'New search'}).click();
  await pick(page,'Punta Gorda');
  await expect(page.locator('.traffic')).toContainText('NO-GO');
  await expect(page.locator('.traffic')).toContainText('DO NOT CANVASS');
  await page.getByRole('button',{name:'New search'}).click();
  await pick(page,'Tarpon Springs');
  await expect(page.locator('.traffic')).toContainText('NO-GO');
  await expect(page.getByRole('button',{name:/DO NOT CANVASS/})).toBeVisible();
  const tarponCourtesy=page.locator('section.card.essentials').filter({hasText:'INSTALLATION-DAY COURTESY NOTICE'});
  await expect(tarponCourtesy).toContainText('Leave it securely at the private front entry');
});
test('reference document links are exposed',async({page})=>{
  await page.goto('/index.html');
  await pick(page,'Apollo Beach');
  await page.getByText('Reference documents').click();
  await expect(page.getByRole('link',{name:'Courtesy notice'}).last()).toHaveAttribute('href',/1vGHFL0aXX0EmV65kPZRrUqs1ONupqRWi/);
  await expect(page.getByRole('link',{name:'Municipality master PDF'})).toHaveAttribute('href',/1GrHvdIupQiANktfoeC_9aEwnSGlzDOgl/);
  await expect(page.getByRole('link',{name:'Rules sheet'})).toHaveAttribute('href',/1IuiNXffS7cUOmZbW91IJ5L8J3jz_WX-czfueveIp4t8/);
  await expect(page.getByRole('link',{name:'Canvass Manager'})).toHaveAttribute('href','https://raw.githack.com/twiztd1166/proud-math-b7d8/paradise-canvass-manager-validated/index.html');
});
test('code-only approved update has a real target without triggering a rules-data block',async({page})=>{
  await page.goto('/index.html');
  const meta={validated:true,version:'2026.08.14-v3.6',snapshot:'2026-08-14',datasetSha256:'d347c695c7693cb9d0944a492d395f8c23c9d5af54c6a8aad59dc1cdbbf1caf0',url:'https://example.test/validated-v36/index.html'};
  const state=await page.evaluate(meta=>{
    eval('pcmLatest = meta');
    pcmApplyDeployBlock();
    pcmHealth();
    const link=document.querySelector('.healthUpdate');
    return{href:link?.getAttribute('href')||'',text:link?.textContent||'',block:window.PCM_DEPLOY_BLOCK_REASON||''};
  },meta);
  expect(state.href).toBe(meta.url);
  expect(state.text).toContain('UPDATE APP');
  expect(state.block).toBe('');
});
test('browse areas by county works',async({page})=>{
  await page.goto('/index.html');
  await page.getByRole('button',{name:'BROWSE ALL AREAS'}).click();
  await expect(page.getByRole('heading',{name:'Browse Areas'})).toBeVisible();
  await page.getByRole('button',{name:/Palm Beach County/}).click();
  await expect(page.getByRole('heading',{name:'Palm Beach County'})).toBeVisible();
  await page.getByRole('button',{name:/Boynton Beach/}).click();
  await expect(page.locator('.traffic')).toContainText('GO — HOURS ON HOLD');
  await expect(page.getByRole('button',{name:/HOURS NOT CLEARED — DO NOT START ROUTE/})).toBeVisible();
});
test('special material-placement rules stay visible in plain English',async({page})=>{
  await page.goto('/index.html');
  const samples=await page.evaluate(()=>{
    const records=window.PCM_DATA.records;
    const one=(predicate,label)=>{
      const r=records.find(predicate);
      if(!r)throw new Error(`No ${label} sample found`);
      return{name:r.name,hangerMode:r.hangerMode,hangerAction:hangerActionSummary(r),hangerWhere:hangerWhereSummary(r),courtesyFieldAction:r.courtesyFieldAction,courtesyAction:courtesyActionSummary(r),courtesyWhere:courtesyWhereSummary(r)};
    };
    return[
      one(r=>/DIRECT HANDOFF ONLY/.test(String(r.hangerMode||'')),'direct-handoff'),
      one(r=>/OWNER CONSENT/.test(String(r.hangerMode||'')),'owner-consent'),
      one(r=>/RECEPTACLE/.test(String(r.hangerMode||'')),'receptacle'),
      one(r=>/NON-AFFIXED/.test(String(r.hangerMode||'')),'non-affixed'),
      one(r=>String(r.courtesyFieldAction||'').startsWith('DO NOT LEAVE — COURTESY TEXT BLOCKER'),'courtesy-blocked')
    ];
  });
  for(const sample of samples){
    expect(sample.hangerMode).toBeTruthy();
    expect(sample.courtesyFieldAction).toBeTruthy();
    await page.goto('/index.html');
    await pick(page,sample.name);
    const hanger=page.locator('section.card.essentials').filter({hasText:'DOOR HANGER'});
    await expect(hanger).toContainText(sample.hangerAction);
    await expect(hanger).toContainText(sample.hangerWhere);
    const courtesy=page.locator('section.card.essentials').filter({hasText:'INSTALLATION-DAY COURTESY NOTICE'});
    await expect(courtesy).toContainText(sample.courtesyAction);
    await expect(courtesy).toContainText(sample.courtesyWhere);
  }
});
test('commercial hanger and courtesy-only rules stay distinct',async({page})=>{
  await page.goto('/index.html');
  const sample=await page.evaluate(()=>{
    const r=window.PCM_DATA.records.find(x=>x.name==='New Port Richey');
    if(!r)throw new Error('New Port Richey record missing');
    return{name:r.name,hangerRelease:r.hangerRelease,hangerMode:r.hangerMode,hangerAction:hangerActionSummary(r),courtesyRelease:r.courtesyRelease,courtesyFieldAction:r.courtesyFieldAction,courtesyAction:courtesyActionSummary(r)};
  });
  expect(`${sample.hangerRelease} ${sample.hangerMode}`).toMatch(/DO NOT|PROHIBIT|NO DISTRIBUT/i);
  expect(sample.courtesyFieldAction).toMatch(/^LEAVE\b/);
  await pick(page,sample.name);
  const hanger=page.locator('section.card.essentials').filter({hasText:'DOOR HANGER'});
  await expect(hanger).toContainText(sample.hangerAction);
  const courtesy=page.locator('section.card.essentials').filter({hasText:'INSTALLATION-DAY COURTESY NOTICE'});
  await expect(courtesy).toContainText(sample.courtesyAction);
  await page.getByRole('button',{name:'New search'}).click();
  await pick(page,'North Miami Beach');
  const nmbCourtesy=page.locator('section.card.essentials').filter({hasText:'INSTALLATION-DAY COURTESY NOTICE'});
  await expect(nmbCourtesy).toContainText('Do not issue the universal courtesy notice here.');
});
test('required route identity and five PASS checks produce an evidence-grade record',async({page})=>{
  await page.goto('/index.html');
  await pick(page,'Dania');
  await expect(page.getByText('Hours',{exact:true}).first()).toBeVisible();
  await expect(page.getByText(/9:00 AM–8:00 PM|9 AM–8 PM/).first()).toBeVisible();
  await page.getByRole('button',{name:/RUN DAILY CHECK/}).click();
  const start=page.getByRole('button',{name:/START 5 CHECKS/});
  await expect(start).toBeDisabled();
  await page.getByPlaceholder('Manager name').fill('Test Manager');
  await page.getByPlaceholder('Neighborhood / route').fill('Test Route A');
  await page.getByPlaceholder('Exact street address or boundary').fill('123 Test Route');
  await page.getByRole('checkbox').check();
  await expect(start).toBeEnabled();
  await start.click();
  for(let i=0;i<5;i++)await page.getByRole('button',{name:/PASS/}).click();
  await expect(page.locator('.finalDecision')).toContainText('APPROVED TO CANVASS');
  await expect(page.locator('.savedBanner')).toContainText('SAVED ON THIS PHONE');
  await expect(page.locator('.finalFacts')).toContainText('2026.08.14-v3.5');
  await expect(page.locator('.finalFacts')).toContainText(/Dataset SHA-256/);
  await expect(page.locator('.scopeBanner')).toContainText('For');
  await page.getByRole('button',{name:'History'}).click();
  await expect(page.getByRole('heading',{name:'Daily Check History'})).toBeVisible();
  await expect(page.locator('.historyCard').first()).toContainText('Dania');
});
test('STOP and REVIEW prevent canvassing with field guidance',async({page})=>{
  await setupGo(page);
  await page.getByRole('button',{name:/STOP/}).click();
  await expect(page.locator('.finalDecision')).toContainText('DO NOT CANVASS');
  await expect(page.locator('.fieldResponse')).toContainText('What to do now');
  await page.getByRole('button',{name:'START NEW ROUTE'}).click();
  await pick(page,'Dania');
  await page.getByRole('button',{name:/RUN DAILY CHECK/}).click();
  await page.getByPlaceholder('Manager name').fill('Test Manager');
  await page.getByPlaceholder('Neighborhood / route').fill('Test Route B');
  await page.getByPlaceholder('Exact street address or boundary').fill('456 Test Route');
  await page.getByRole('checkbox').check();
  await page.getByRole('button',{name:/START 5 CHECKS/}).click();
  await page.getByRole('button',{name:/REVIEW/}).click();
  await expect(page.locator('.finalDecision')).toContainText('DO NOT CANVASS');
  await expect(page.locator('.fieldResponse')).toContainText('manager/compliance');
});
test('manager-facing copy stays plain English',async({page})=>{
  await page.goto('/index.html');
  await pick(page,'Boynton Beach');
  const text=await page.locator('body').innerText();
  expect(text).not.toMatch(/controlled rationale|legal classification remains GO|ordinary uninvited route|DEPLOY BLOCKED|COMMERCIAL CANVASS RELEASE|SECURE PRIVATE-ENTRY|KNOB NOT SPECIFICALLY VERIFIED|COURTESY TEXT BLOCKER/i);
  await expect(page.getByText(/BEFORE YOU START/i).first()).toBeVisible();
  await expect(page.getByText('More canvassing details')).toBeVisible();
  await expect(page.getByText('If someone questions the rule')).toBeVisible();
  await page.getByText('More canvassing details').click();
  const expanded=await page.locator('details').filter({hasText:'More canvassing details'}).innerText();
  expect(expanded).not.toMatch(/targeted current|operative text|controlled audit|do not invent|noncontrolling/i);
});
test('PWA metadata, provenance and service worker are present',async({page})=>{
  await page.goto('/index.html');
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href','manifest.webmanifest');
  await expect.poll(async()=>page.evaluate(()=>navigator.serviceWorker?.ready.then(()=>true).catch(()=>false))).toBeTruthy();
  await expect(page.locator('#appHealth')).toContainText('Rules 2026-08-14');
  await expect.poll(async()=>page.evaluate(()=>window.PCM_PROVENANCE?.datasetSha256)).toMatch(/^[0-9a-f]{64}$/);
});
test('malformed phone storage fails safe instead of crashing',async({page})=>{
  await page.goto('/index.html');
  await page.evaluate(()=>{localStorage.pcmFavorites='{bad';localStorage.pcmRecent='not-json';localStorage.pcmReleaseHistoryV1='{broken'});
  await page.reload();
  await expect(page.getByRole('heading',{name:'Can I canvass here?'})).toBeVisible();
  await page.getByRole('button',{name:'History'}).click();
  await expect(page.getByText('No Daily Checks yet')).toBeVisible();
});