import {test,expect} from '@playwright/test';

test('training home is simple and field lookup stays one tap away',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();
  await expect(page.getByRole('heading',{name:'Train. Practice. Advance.'})).toBeVisible();
  for(const name of [/Continue|Welcome to Paradise University/,/Practice/,/Career Path/,/Videos & Audio/,/My Progress/])await expect(page.getByRole('button',{name}).first()).toBeVisible();
  await page.locator('#nLook').click();await expect(page.getByRole('heading',{name:'Can I canvass here?'})).toBeVisible();
});

test('lesson completion persists on the device',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await page.locator('#puContinue').click();
  await expect(page.getByRole('heading',{name:'Welcome to Paradise University'})).toBeVisible();
  await page.getByRole('button',{name:'MARK COMPLETE'}).click();await expect(page.getByText('COMPLETE',{exact:true})).toBeVisible();
  await page.reload();await page.locator('#nTrain').click();await page.getByRole('button',{name:/My Progress/}).first().click();await expect(page.getByRole('button',{name:/✓ Welcome to Paradise University/})).toBeVisible();
});

test('approved Paradise lessons stay separate from reference media and media rights',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await page.locator('#puContinue').click();
  await expect(page.getByText('PARADISE APPROVED',{exact:true})).toBeVisible();await page.locator('#puBack').click();
  await page.getByRole('button',{name:/Videos & Audio/}).first().click();
  await expect(page.getByText(/MEDIA RIGHTS GATE/i)).toBeVisible();
  await expect(page.getByText('REFERENCE',{exact:true}).first()).toBeVisible();
  await expect(page.getByText(/not launch-ready because the audit did not recover an explicit Paradise internal re-hosting grant/i)).toBeVisible();
});

test('foundation field-ready and canvasser stages contain real curriculum',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await page.getByRole('button',{name:/Career Path/}).first().click();
  await page.getByRole('button',{name:/1\. Foundation/}).click();await expect(page.getByRole('button',{name:/Your Job at the Door/})).toBeVisible();
  await page.getByRole('button',{name:/Career Path/}).click();await page.getByRole('button',{name:/2\. Field Ready/}).click();await expect(page.getByRole('button',{name:/Opening & First 20 Seconds/})).toBeVisible();
  await page.getByRole('button',{name:/Career Path/}).click();await page.getByRole('button',{name:/3\. Certified Canvasser/}).click();await expect(page.getByRole('button',{name:/Appointment Quality/})).toBeVisible();await expect(page.getByRole('button',{name:/Certified Canvasser Readiness/})).toBeVisible();
});

test('senior and sales apprentice stages are fully populated',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await page.getByRole('button',{name:/Career Path/}).first().click();
  await page.getByRole('button',{name:/4\. Senior Canvasser/}).click();await expect(page.getByRole('button',{name:/Advanced Listening & Questioning/})).toBeVisible();await expect(page.getByRole('button',{name:/Sales Readiness Check/})).toBeVisible();
  await page.getByRole('button',{name:/Career Path/}).click();await page.getByRole('button',{name:/5\. Sales Apprentice/}).click();await expect(page.getByRole('button',{name:/Advanced Needs Analysis/})).toBeVisible();await expect(page.getByRole('button',{name:/Full Sales Process Map/})).toBeVisible();await expect(page.getByRole('button',{name:/Sales Shadowing/})).toBeVisible();await expect(page.getByText(/not authorization to price or sell at the door/i)).toBeVisible();
});

test('Sales Rep Academy publishes only bounded Part 1 and preserves procedure gate',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await page.getByRole('button',{name:/Career Path/}).first().click();await page.getByRole('button',{name:/6\. Sales Rep/}).click();
  await expect(page.getByRole('heading',{name:'Sales Rep'})).toBeVisible();
  await expect(page.getByRole('button',{name:/1\. Preparation/})).toBeVisible();await expect(page.getByRole('button',{name:/3\. Survey \/ Needs Analysis/})).toBeVisible();await expect(page.getByRole('button',{name:/7\. Product Presentation/})).toBeVisible();
  await expect(page.getByText(/CURRENT POLICY REQUIRED/)).toBeVisible();
  for(const term of ['Retail Close','Qualification','Major Close','Sub-Step Close','Button-Up'])await expect(page.getByRole('button',{name:new RegExp(term,'i')})).toHaveCount(0);
});

test('Manager Academy stays behind Career Path and keeps operational curriculum secondary',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await expect(page.getByRole('button',{name:/Canvass Manager Academy/})).toHaveCount(0);
  await page.getByRole('button',{name:/Career Path/}).first().click();await page.getByRole('button',{name:/Canvass Manager Academy/}).click();
  await expect(page.getByRole('heading',{name:'Canvass Manager Academy'})).toBeVisible();for(const name of [/Compliance Leadership/,/Ride-Along Coaching/,/Manage the Funnel, Not One Number/,/Develop Future Sales Reps/])await expect(page.getByRole('button',{name})).toBeVisible();
  await expect(page.getByText(/does not override the live municipality result/i)).toBeVisible();await expect(page.getByText(/Full Manager Curriculum/)).toBeVisible();await page.locator('.puManagerCurriculum summary').click();await expect(page.getByRole('button',{name:/Field Incident & Escalation/})).toBeVisible();
});

test('opening lesson does not misuse courtesy notice where route blocks it',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await page.getByRole('button',{name:/Career Path/}).first().click();await page.getByRole('button',{name:/2\. Field Ready/}).click();await page.getByRole('button',{name:/Opening & First 20 Seconds/}).click();await expect(page.getByText(/Do not claim you are handing out notices where the live municipality screen says not to use them/i)).toBeVisible();
});

test('12 curated third-party media records remain visible for lineage but cannot expose copied Drive links',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await page.getByRole('button',{name:/Videos & Audio/}).first().click();
  for(const title of ['Tonality and Body Language','Formula For Handling Objections','Definition of a Good Lead','The Science of Successful Canvassing','Canvassing 101','New Canvasser Training — Process'])await expect(page.getByText(title,{exact:true}).first()).toBeVisible();
  await expect(page.locator('[data-playlist="Rights Review — Not Release Ready"] .puMediaCard')).toHaveCount(12);
  await expect(page.getByRole('button',{name:'RIGHTS REVIEW'})).toHaveCount(12);
  await expect(page.locator('a.puSourceOpen')).toHaveCount(0);
  const state=await page.evaluate(()=>({playable:window.PU_CURATED_MEDIA_IDS.length,hold:window.PU_RIGHTS_REVIEW_MEDIA_IDS.length,status:window.PU_MEDIA_RIGHTS_CONTROL.status}));
  expect(state).toEqual({playable:0,hold:12,status:'RELEASE_BLOCKED_PENDING_RIGHTS'});
});

test('Dave Five Commitments source lineage is retained but copied-file link is withheld pending rights',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await page.getByRole('button',{name:/Career Path/}).first().click();await page.getByRole('button',{name:/3\. Certified Canvasser/}).click();await page.getByRole('button',{name:/Five Appointment Commitments/}).click();await page.getByText('Go deeper / source material').click();
  const row=page.locator('.puMoreRow').filter({hasText:'Dave Yoho — The Five Commitments'});
  await expect(row).toBeVisible();await expect(row).toContainText(/RIGHTS REVIEW/);await expect(page.getByRole('link',{name:/Dave Yoho — The Five Commitments/})).toHaveCount(0);
});

test('Grosso expanded source lineage is retained but copied-file link is withheld pending rights',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await page.getByRole('button',{name:/Career Path/}).first().click();await page.getByRole('button',{name:/5\. Sales Apprentice/}).click();await page.getByRole('button',{name:/Full Sales Process Map/}).click();await page.getByText('Go deeper / source material').click();
  const row=page.locator('.puMoreRow').filter({hasText:/Grosso University — 11-Step Breakdown Expanded Edition/});
  await expect(row).toBeVisible();await expect(row).toContainText(/RIGHTS REVIEW/);await expect(page.getByRole('link',{name:/11-Step Breakdown Expanded Edition/})).toHaveCount(0);
});

test('manager ride-along Paradise source remains available when not part of trainer media rights hold',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await page.getByRole('button',{name:/Career Path/}).first().click();await page.getByRole('button',{name:/Canvass Manager Academy/}).click();await page.getByRole('button',{name:/Ride-Along Coaching/}).click();await page.getByText('Go deeper / source material').click();await expect(page.getByRole('link',{name:/Ride Along Evaluation Form/})).toHaveAttribute('href',/1cm2QPzwPRFPITk68fJmT8wc_z_OEPyTl/);
});

test('direct player call cannot bypass copied trainer media rights hold',async({page})=>{
  await page.goto('/index.html');await page.evaluate(()=>window.puPlayerOpen('grosso-tonality-audio'));
  const player=page.locator('#puPlayerRoot');await expect(player.getByRole('dialog',{name:'Media rights hold'})).toBeVisible();await expect(player.getByText(/PLAYBACK BLOCKED/)).toBeVisible();await expect(player.locator('iframe,video,audio')).toHaveCount(0);await expect(player.getByRole('link')).toHaveCount(0);
  await page.locator('#nLook').click();await expect(player.getByRole('dialog',{name:'Media rights hold'})).toBeVisible();await player.getByRole('button',{name:'Close player'}).click();await expect(player).toBeEmpty();
});

test('player infrastructure remains available for future rights-cleared controlled streams',async({page})=>{
  await page.goto('/index.html');await expect.poll(async()=>page.evaluate(()=>window.PU_PLAYER_VERSION)).toBe('2026.08.16-pu-player-v2');
  const state=await page.evaluate(()=>({player:typeof window.puPlayerOpen==='function',version:window.PARADISE_UNIVERSITY_VERSION,rights:window.PU_MEDIA_RIGHTS_VERSION,gate:window.PU_MEDIA_PLAYER_RIGHTS_GATE_VERSION}));
  expect(state).toEqual({player:true,version:'2026.08.16-pu-v1-content-5',rights:'2026.08.16-pu-media-rights-v1',gate:'2026.08.16-pu-media-player-rights-v1'});
});

test('practice hard stop says leave rather than rebut',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await page.getByRole('button',{name:/Practice/}).first().click();await page.getByRole('button',{name:/Field Rules/}).click();await page.getByRole('button',{name:/SHOW COACHING ANSWER/}).click();await expect(page.getByText(/Stop immediately and leave|Do not canvass/i)).toBeVisible();
});

test('sales apprentice training preserves doorstep boundary',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await page.getByRole('button',{name:/Career Path/}).first().click();await page.getByRole('button',{name:/5\. Sales Apprentice/}).click();await expect(page.getByText(/not authorization to price or sell at the door/i)).toBeVisible();
});

test('training does not weaken NO-GO field result',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await page.locator('#nLook').click();await page.getByPlaceholder('Start typing a city…').fill('Tarpon Springs');await page.locator('.opt').filter({hasText:'Tarpon Springs'}).first().click();await expect(page.locator('.traffic')).toContainText(/NO — DO NOT CANVASS|NO-GO/);
});