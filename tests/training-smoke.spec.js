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

test('approved Paradise lessons stay separate from internal reference media',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await page.locator('#puContinue').click();
  await expect(page.getByText('PARADISE APPROVED',{exact:true})).toBeVisible();await page.locator('#puBack').click();
  await page.getByRole('button',{name:/Videos & Audio/}).first().click();
  await expect(page.getByText('INTERNAL TRAINING MEDIA:',{exact:true})).toBeVisible();
  await expect(page.getByText('REFERENCE',{exact:true}).first()).toBeVisible();
  await expect(page.getByText(/do not override current Paradise policy or the live municipality Lookup/i)).toBeVisible();
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

test('12 curated third-party media records are visible and internally playable',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await page.getByRole('button',{name:/Videos & Audio/}).first().click();
  for(const title of ['Tonality and Body Language','Formula For Handling Objections','Definition of a Good Lead','The Science of Successful Canvassing','Canvassing 101','New Canvasser Training — Process'])await expect(page.getByText(title,{exact:true}).first()).toBeVisible();
  const state=await page.evaluate(()=>({playable:window.PU_CURATED_MEDIA_IDS.length,hold:window.PU_RIGHTS_REVIEW_MEDIA_IDS.length,status:window.PU_MEDIA_RIGHTS_CONTROL.status}));
  expect(state).toEqual({playable:12,hold:0,status:'INTERNAL_USE_NON_BLOCKING'});
});

test('Dave Five Commitments source lineage is retained with internal source access',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await page.getByRole('button',{name:/Career Path/}).first().click();await page.getByRole('button',{name:/3\. Certified Canvasser/}).click();await page.getByRole('button',{name:/Five Appointment Commitments/}).click();await page.getByText('Go deeper / source material').click();
  const link=page.getByRole('link',{name:/Dave Yoho — The Five Commitments/});await expect(link).toBeVisible();await expect(link).toHaveAttribute('href',/drive\.google\.com|docs\.google\.com/);
});

test('Grosso expanded source lineage is retained with internal source access',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await page.getByRole('button',{name:/Career Path/}).first().click();await page.getByRole('button',{name:/5\. Sales Apprentice/}).click();await page.getByRole('button',{name:/Full Sales Process Map/}).click();await page.getByText('Go deeper / source material').click();
  const link=page.getByRole('link',{name:/11-Step Breakdown Expanded Edition/});await expect(link).toBeVisible();await expect(link).toHaveAttribute('href',/drive\.google\.com|docs\.google\.com/);
});

test('Grosso ride-along source lineage is retained with internal source access',async({page})=>{
  await page.goto('/index.html');await page.locator('#nTrain').click();await page.getByRole('button',{name:/Career Path/}).first().click();await page.getByRole('button',{name:/Canvass Manager Academy/}).click();await page.getByRole('button',{name:/Ride-Along Coaching/}).click();await page.getByText('Go deeper / source material').click();
  const link=page.getByRole('link',{name:/Ride Along Evaluation Form/});await expect(link).toBeVisible();await expect(link).toHaveAttribute('href',/drive\.google\.com|docs\.google\.com/);
});

test('direct player call opens internal trainer media while preserving reference authority',async({page})=>{
  await page.goto('/index.html');await page.evaluate(()=>window.puPlayerOpen('grosso-tonality-audio'));
  const player=page.locator('#puPlayerRoot');await expect(player.getByRole('dialog',{name:'Training player'})).toBeVisible();await expect(player.locator('iframe')).toHaveCount(0);await expect(player.locator('[data-provider="drive-top-level"]')).toBeVisible();await expect(player.getByRole('link',{name:/Play Tonality and Body Language in Google Drive/i})).toHaveAttribute('target','_blank');await expect(player.locator('.puPlayerAuthority')).toHaveText('SOURCE / REFERENCE');
  await page.locator('#nLook').click();await expect(player.getByRole('dialog',{name:'Training player'})).toBeVisible();await player.getByRole('button',{name:'Close player'}).click();await expect(player).toBeEmpty();
});

test('player infrastructure remains available for internal media and future controlled streams',async({page})=>{
  await page.goto('/index.html');await expect.poll(async()=>page.evaluate(()=>window.PU_PLAYER_VERSION)).toBe('2026.08.17-pu-player-v3-drive-top-level');
  const state=await page.evaluate(()=>({player:typeof window.puPlayerOpen==='function',version:window.PARADISE_UNIVERSITY_VERSION,mediaPolicy:window.PU_MEDIA_RIGHTS_VERSION,gate:window.PU_MEDIA_PLAYER_RIGHTS_GATE_VERSION,control:window.PU_MEDIA_RIGHTS_CONTROL.status}));
  expect(state).toEqual({player:true,version:'2026.08.16-pu-v1-content-5',mediaPolicy:'2026.08.16-pu-media-internal-v2',gate:'2026.08.16-pu-media-player-rights-v1',control:'INTERNAL_USE_NON_BLOCKING'});
});

test('practice hard-stop model requires stopping instead of rebutting',async({page})=>{
  await page.goto('/index.html');const state=await page.evaluate(()=>{const x=window.puPracticeScenarioPool().find(s=>s.id==='field-no-go');return{id:x?.id,hardStop:x?.hardStop,answer:x?.answer,accepted:x?.acceptedResponseConcepts||[],prohibited:x?.prohibitedResponseConcepts||[]}});expect(state.id).toBe('field-no-go');expect(state.hardStop).toBeTruthy();expect(state.answer).toMatch(/Do not canvass/i);expect(state.accepted.join(' ')).toMatch(/does not canvass|follows live lookup/i);expect(state.prohibited.join(' ')).toMatch(/knocks anyway|manager override|workaround/i);
});

test('sales apprentice training preserves doorstep boundary',async({page})=>{await page.goto('/index.html');await page.locator('#nTrain').click();await page.getByRole('button',{name:/Career Path/}).first().click();await page.getByRole('button',{name:/5\. Sales Apprentice/}).click();await expect(page.getByText(/not authorization to price or sell at the door/i)).toBeVisible()});

test('training does not weaken NO-GO field result',async({page})=>{await page.goto('/index.html');await page.locator('#nTrain').click();await page.locator('#nLook').click();await page.getByPlaceholder('Start typing a city…').fill('Tarpon Springs');await page.locator('.opt').filter({hasText:'Tarpon Springs'}).first().click();await expect(page.locator('.traffic')).toContainText(/NO — DO NOT CANVASS|NO-GO/)});
