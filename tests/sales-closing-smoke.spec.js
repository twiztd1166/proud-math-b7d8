import {test,expect} from '@playwright/test';

test('closing and manager support layer preserves exact TO and qualification hold',async({page})=>{
  await page.goto('/index.html');
  const ctl=await page.evaluate(()=>window.PU_SALES_CLOSING_SUPPORT_CONTROL);
  expect(ctl?.status).toBe('PARTIAL_SOURCE_CLOSURE');
  expect(ctl?.asOf).toBe('2026-08-16');
  expect(ctl?.sources?.map(x=>x.id)).toEqual(expect.arrayContaining(['sales-rep-policy-2026','sales-manager-plan-2026','sales-meeting-2026-03-16']));
  expect(ctl?.sources?.find(x=>x.id==='sales-rep-policy-2026')?.authority).toBe('PARADISE_APPROVED');
  expect(ctl?.sources?.find(x=>x.id==='sales-manager-plan-2026')?.authority).toBe('PARADISE_APPROVED');
  expect(ctl?.sources?.find(x=>x.id==='sales-meeting-2026-03-16')?.authority).toBe('REFERENCE');
  expect(ctl?.rules).toEqual(expect.arrayContaining([
    expect.stringMatching(/pre-close only after the presentation/i),
    expect.stringMatching(/live Paradise tools and manager controls govern anything dynamic/i),
    expect.stringMatching(/full TO compliance/i),
    expect.stringMatching(/NRP and situational drops/i),
    expect.stringMatching(/result\/disposition before leaving the driveway/i),
    expect.stringMatching(/exact TO trigger, script, routing, qualification criteria/i)
  ]));
  expect(ctl?.unresolved).toEqual(expect.arrayContaining([
    expect.stringMatching(/TO trigger points/i),
    expect.stringMatching(/TO call routing/i),
    expect.stringMatching(/TO \/ manager-assist script/i),
    expect.stringMatching(/qualification criteria/i),
    expect.stringMatching(/NRP, situational drops, rehash, and cancel-save/i),
    expect.stringMatching(/manager approval authority/i),
    expect.stringMatching(/CRM \/ POS \/ DNS entries/i)
  ]));
  await page.locator('#nTrain').click();
  await page.getByRole('button',{name:/Career Path/}).first().click();
  await page.getByRole('button',{name:/6\. Sales Rep/}).click();
  await expect(page.getByText(/Closing & manager-support control path/i)).toBeVisible();
  await expect(page.getByText(/The exact TO and qualification procedure is still gated/i)).toBeVisible();
  await expect(page.getByText(/do not invent a substitute TO/i)).toBeVisible();
  await expect(page.getByText(/A close attempt, manager support call, or customer delay does not remove that requirement/i)).toBeVisible();
  await expect(page.getByText(/Do not infer them from historical trainer material/i)).toBeVisible();
  await expect(page.getByText(/CURRENT POLICY REQUIRED — PROCEDURE GATE — HOLD/i)).toBeVisible();
  await expect(page.getByRole('button',{name:/Retail Close|Qualification|Major Close|Button-Up/i})).toHaveCount(0);
});
