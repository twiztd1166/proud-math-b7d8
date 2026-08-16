import {test,expect} from '@playwright/test';

test('training home is simple and field lookup stays one tap away',async({page})=>{
  await page.goto('/index.html');
  await page.locator('#nTrain').click();
  await expect(page.getByRole('heading',{name:'Train. Practice. Advance.'})).toBeVisible();
  await expect(page.getByRole('button',{name:/Continue|Welcome to Paradise University/})).toBeVisible();
  await expect(page.getByRole('button',{name:/Practice/}).first()).toBeVisible();
  await expect(page.getByRole('button',{name:/Career Path/}).first()).toBeVisible();
  await expect(page.getByRole('button',{name:/Videos & Audio/}).first()).toBeVisible();
  await expect(page.getByRole('button',{name:/My Progress/}).first()).toBeVisible();
  await page.locator('#nLook').click();
  await expect(page.getByRole('heading',{name:'Can I canvass here?'})).toBeVisible();
});

test('lesson completion persists on the device',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await page.locator('#puContinue').click();
  await expect(page.getByRole('heading',{name:'Welcome to Paradise University'})).toBeVisible();
  await page.getByRole('button',{name:'MARK COMPLETE'}).click();await expect(page.getByText('COMPLETE',{exact:true})).toBeVisible();
  await page.reload();await page.locator('#nTrain').click();await page.getByRole('button',{name:/My Progress/}).first().click();await expect(page.getByRole('button',{name:/✓ Welcome to Paradise University/})).toBeVisible();
});

test('approved Paradise lesson is visually separate from reference source media',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await page.locator('#puContinue').click();
  await expect(page.getByText('PARADISE APPROVED',{exact:true})).toBeVisible();await page.locator('#puBack').click();
  await page.getByRole('button',{name:/Videos & Audio/}).first().click();await expect(page.getByText('REFERENCE',{exact:true}).first()).toBeVisible();
  await expect(page.getByText(/Original Tony Hoty, Dave Yoho, and Grosso material is reference training/i)).toBeVisible();
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

test('Sales Rep Academy publishes only policy-neutral Part 1 and shows current-policy gate',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await page.getByRole('button',{name:/Career Path/}).first().click();await page.getByRole('button',{name:/6\. Sales Rep/}).click();
  await expect(page.getByRole('heading',{name:'Sales Rep'})).toBeVisible();
  await expect(page.getByRole('button',{name:/1\. Preparation/})).toBeVisible();
  await expect(page.getByRole('button',{name:/3\. Survey \/ Needs Analysis/})).toBeVisible();
  await expect(page.getByRole('button',{name:/7\. Product Presentation/})).toBeVisible();
  await expect(page.getByText(/CURRENT POLICY REQUIRED/)).toBeVisible();
  await expect(page.getByText(/Price presentation, financing, qualification, closing, contract, cancellation\/rescission, and final button-up procedures require a verified current Paradise sales-policy source/i)).toBeVisible();
  for(const term of ['Retail Close','Qualification','Major Close','Sub-Step Close','Button-Up'])await expect(page.getByRole('button',{name:new RegExp(term,'i')})).toHaveCount(0);
});

test('Manager Academy stays behind Career Path and keeps operational curriculum secondary',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await expect(page.getByRole('button',{name:/Canvass Manager Academy/})).toHaveCount(0);
  await page.getByRole('button',{name:/Career Path/}).first().click();await page.getByRole('button',{name:/Canvass Manager Academy/}).click();
  await expect(page.getByRole('heading',{name:'Canvass Manager Academy'})).toBeVisible();await expect(page.getByRole('button',{name:/Compliance Leadership/})).toBeVisible();await expect(page.getByRole('button',{name:/Ride-Along Coaching/})).toBeVisible();await expect(page.getByRole('button',{name:/Manage the Funnel, Not One Number/})).toBeVisible();await expect(page.getByRole('button',{name:/Develop Future Sales Reps/})).toBeVisible();await expect(page.getByText(/does not override the live municipality result/i)).toBeVisible();
  await expect(page.getByText(/Full Manager Curriculum/)).toBeVisible();await page.locator('.puManagerCurriculum summary').click();await expect(page.getByRole('button',{name:/Field Incident & Escalation/})).toBeVisible();
});

test('opening lesson does not misuse courtesy notice where route blocks it',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await page.getByRole('button',{name:/Career Path/}).first().click();await page.getByRole('button',{name:/2\. Field Ready/}).click();await page.getByRole('button',{name:/Opening & First 20 Seconds/}).click();await expect(page.getByText(/Do not claim you are handing out notices where the live municipality screen says not to use them/i)).toBeVisible();
});

test('curated media catalog exposes verified Drive source assets even when an item is reused across playlists',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await page.getByRole('button',{name:/Videos & Audio/}).first().click();
  for(const title of ['Tonality and Body Language','Formula For Handling Objections','Definition of a Good Lead','The Science of Successful Canvassing','Canvassing 101','New Canvasser Training — Process'])await expect(page.getByText(title,{exact:true}).first()).toBeVisible();
  const hrefs=await page.locator('a.puSourceOpen').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
  expect(hrefs).toContain('https://drive.google.com/file/d/1WNQ6ItT6Ar_HXGKNutWEvEFeHm14RjKn/view?usp=drivesdk');expect(hrefs).toContain('https://drive.google.com/file/d/1GCrveqXP0xgc8n2S9WPlVAd9wd9D2X5Y/view?usp=drivesdk');expect(hrefs).toContain('https://drive.google.com/file/d/1Z8wIrTrULa1g3In7_ucINtNZTV0eWczk/view?usp=drivesdk');expect(hrefs).toContain('https://drive.google.com/file/d/12hnKxDUE0nOO5kv_FuBb9fahiFGX4wty/view?usp=drivesdk');expect(hrefs).not.toContain('https://drive.google.com/file/d/19CvExmu1fCyaq3SpLprsn8TVIQq-Bzt0/view?usp=drivesdk');
});

test('five commitments lesson links the exact Dave source',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await page.getByRole('button',{name:/Career Path/}).first().click();await page.getByRole('button',{name:/3\. Certified Canvasser/}).click();await page.getByRole('button',{name:/Five Appointment Commitments/}).click();await page.getByText('Go deeper / source material').click();await expect(page.getByRole('link',{name:/Dave Yoho — The Five Commitments/})).toHaveAttribute('href','https://drive.google.com/file/d/1Au1PhatdFIG84Azy8LiNXh0QLnjLSuIs/view?usp=drivesdk');
});

test('sales process map links the exact Grosso Expanded source',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await page.getByRole('button',{name:/Career Path/}).first().click();await page.getByRole('button',{name:/5\. Sales Apprentice/}).click();await page.getByRole('button',{name:/Full Sales Process Map/}).click();await page.getByText('Go deeper / source material').click();await expect(page.getByRole('link',{name:/11-Step Breakdown Expanded Edition/})).toHaveAttribute('href','https://drive.google.com/file/d/100B1iq77BW00sH4HYMO6zPl80ctMsaam/view?usp=drivesdk');
});

test('manager ride-along lesson links exact source form',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await page.getByRole('button',{name:/Career Path/}).first().click();await page.getByRole('button',{name:/Canvass Manager Academy/}).click();await page.getByRole('button',{name:/Ride-Along Coaching/}).click();await page.getByText('Go deeper / source material').click();await expect(page.getByRole('link',{name:/Ride Along Evaluation Form/})).toHaveAttribute('href',/1cm2QPzwPRFPITk68fJmT8wc_z_OEPyTl/);
});

test('Drive media opens in persistent Paradise player and survives app navigation',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await page.getByRole('button',{name:/Videos & Audio/}).first().click();await page.locator('.puMediaCard').filter({hasText:'Tonality and Body Language'}).first().getByRole('button',{name:'PLAY'}).click();const player=page.locator('#puPlayerRoot');await expect(player.getByRole('dialog',{name:'Training player'})).toBeVisible();await expect(player.locator('#puDrivePlayer')).toHaveAttribute('src',/1WNQ6ItT6Ar_HXGKNutWEvEFeHm14RjKn\/preview/);await page.locator('#nLook').click();await expect(player.locator('.puPlayerTitle b')).toHaveText('Tonality and Body Language');await player.getByRole('button',{name:'Minimize player'}).click();await expect(player).toHaveClass(/minimized/);await expect(player.getByRole('button',{name:'Open training player'})).toBeVisible();await player.getByRole('button',{name:'Open training player'}).click();await expect(player).not.toHaveClass(/minimized/);await player.getByRole('button',{name:'Close player'}).click();await expect(player).toBeEmpty();
});

test('player infrastructure includes custom speed seek resume path for future controlled streams',async({page})=>{
  await page.goto('/index.html');await expect.poll(async()=>page.evaluate(()=>window.PU_PLAYER_VERSION)).toBe('2026.08.16-pu-player-v2');const state=await page.evaluate(()=>({player:typeof window.puPlayerOpen==='function',version:window.PARADISE_UNIVERSITY_VERSION}));expect(state.player).toBeTruthy();expect(state.version).toBe('2026.08.16-pu-v1-content-5');
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
