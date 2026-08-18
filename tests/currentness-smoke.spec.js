import {test,expect} from '@playwright/test';

test('first-20-seconds candidate opener is visibly pending current approval',async({page})=>{
  await page.goto('/index.html');
  await page.locator('#nTrain').click();
  await page.getByRole('button',{name:/Career Path/}).first().click();
  await page.getByRole('button',{name:/2\. Field Ready/}).click();
  await page.getByRole('button',{name:/Opening & First 20 Seconds/}).click();
  await expect(page.locator('.puAuthority')).toContainText('CURRENT APPROVAL PENDING');
  await expect(page.locator('.puAuthority')).not.toContainText('PARADISE APPROVED');
  await expect(page.getByText(/Do not deploy this candidate script yet/i)).toBeVisible();
  await expect(page.getByText(/use only the current manager-approved canvass opening in the field/i).first()).toBeVisible();
  const state=await page.evaluate(()=>({version:window.PU_CURRENTNESS_VERSION,opening:window.PU_OPENING_APPROVAL_STATUS}));
  expect(state).toEqual({version:'2026.08.16-pu-currentness-v1',opening:'PENDING_CURRENT_HUMAN_APPROVAL'});
});

test('manager appointment QA uses current Missing Parties policy without a blanket spouse rule',async({page})=>{
  await page.goto('/index.html');
  await page.locator('#nTrain').click();
  await page.getByRole('button',{name:/Career Path/}).first().click();
  await page.getByRole('button',{name:/Canvass Manager Academy/}).click();
  await page.getByRole('button',{name:/Review Appointments/}).click();
  await expect(page.getByText(/Missing Parties/i).first()).toBeVisible();
  await expect(page.getByText(/one or more homeowners or decision makers/i).first()).toBeVisible();
  await expect(page.getByText(/blanket “spouse must be present”/i).first()).toBeVisible();
  await page.getByText('Go deeper / source material').click();
  const policy=page.getByRole('link',{name:/Final 2026 Sales Representative Policies & Compensation Plan/});
  await expect(policy).toBeVisible();
  await expect(policy).toHaveAttribute('href',/docs\.google\.com/);
  const state=await page.evaluate(()=>({status:window.PU_MISSING_PARTIES_POLICY_STATUS,lesson:window.PU_CONTENT.managerLessons.find(x=>x.id==='manager-appointment-qa')?.currentPolicyStatus}));
  expect(state).toEqual({status:'SUPPORTED_BY_2026_PARADISE_POLICY',lesson:'SUPPORTED_2026_MISSING_PARTIES'});
});