import {test,expect} from '@playwright/test';

test('closing layer uses recovered current TO while preserving remaining procedure gates',async({page})=>{
  await page.goto('/index.html');
  const ctl=await page.evaluate(()=>window.PU_SALES_CLOSING_SUPPORT_CONTROL);
  expect(ctl?.status).toBe('PARTIAL_SOURCE_CLOSURE');
  expect(ctl?.toSourceStatus).toBe('CURRENT_SOURCE_CLOSED');
  expect(ctl?.asOf).toBe('2026-08-16');
  expect(ctl?.sources?.map(x=>x.id)).toEqual(expect.arrayContaining([
    'sales-rep-policy-2026','sales-manager-plan-2026','current-to-script-2026-02-16','commitments-worksheet-2026-02-16','sales-meeting-2026-03-16'
  ]));
  expect(ctl?.sources?.find(x=>x.id==='current-to-script-2026-02-16')?.authority).toBe('PARADISE_APPROVED');
  expect(ctl?.sources?.find(x=>x.id==='commitments-worksheet-2026-02-16')?.authority).toBe('PARADISE_APPROVED');
  expect(ctl?.sources?.find(x=>x.id==='sales-meeting-2026-03-16')?.authority).toBe('REFERENCE');
  expect(ctl?.rules).toEqual(expect.arrayContaining([
    expect.stringMatching(/proper TO every time/i),
    expect.stringMatching(/use this every appointment/i),
    expect.stringMatching(/cash versus finance/i),
    expect.stringMatching(/three states/i),
    expect.stringMatching(/Company Commitment, Product Commitment, Pre-Close Commitment \/ If No, and Holy Grail Commitment/i),
    expect.stringMatching(/Do not discount without the required move-forward/i),
    expect.stringMatching(/never memorize a rate, term, fee, discount/i),
    expect.stringMatching(/NRP and situational drops/i),
    expect.stringMatching(/result\/disposition before leaving the driveway/i),
    expect.stringMatching(/former TO-trigger\/script gap/i)
  ]));
  expect(ctl?.unresolved).toEqual(expect.arrayContaining([
    expect.stringMatching(/TO contact\/fallback path/i),
    expect.stringMatching(/lender application workflow/i),
    expect.stringMatching(/qualification criteria/i),
    expect.stringMatching(/NRP, situational drops, rehash, and cancel-save/i),
    expect.stringMatching(/manager approval authority/i),
    expect.stringMatching(/CRM \/ POS \/ DNS entries/i)
  ]));
  expect((ctl?.unresolved||[]).join(' ')).not.toMatch(/TO trigger points|TO \/ manager-assist script/i);
  await page.locator('#nTrain').click();
  await page.getByRole('button',{name:/Career Path/}).first().click();
  await page.getByRole('button',{name:/6\. Sales Rep/}).click();
  await expect(page.getByText(/Closing & manager-support control path/i)).toBeVisible();
  await expect(page.getByText(/TO SOURCE CLOSED \/ BROADER CLOSE PARTIAL/i)).toBeVisible();
  await expect(page.getByText(/proper TO every time/i)).toBeVisible();
  await expect(page.getByText(/Company Commitment, Product Commitment, Pre-Close Commitment \/ If No, and Holy Grail Commitment/i)).toBeVisible();
  await expect(page.getByText(/never memorize a rate, term, fee, discount/i)).toBeVisible();
  await expect(page.getByText(/CURRENT POLICY REQUIRED — PROCEDURE GATE — HOLD/i)).toBeVisible();
  await expect(page.getByRole('button',{name:/Retail Close|Qualification|Major Close|Button-Up/i})).toHaveCount(0);
});