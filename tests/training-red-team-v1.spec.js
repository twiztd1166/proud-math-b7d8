import {test,expect} from '@playwright/test';

async function training(page){await page.goto('/index.html');await page.locator('#nTrain').click()}

async function noCheckCoreLesson(page){
  return page.evaluate(()=>{
    const stages=new Set(window.PU_DEFAULT_TRACK_STAGES||['foundation','field-ready','canvasser']);
    const x=PU_LESSONS.find(l=>stages.has(l.stage)&&!window.puQuickCheckRequired(l.id));
    if(!x)throw new Error('No core lesson without a Quick Check was found for stale-version red-team coverage');
    return{id:x.id,title:x.title};
  });
}

test('prior-version completion is history only and cannot satisfy current readiness',async({page})=>{
  await training(page);const lesson=await noCheckCoreLesson(page);
  await page.evaluate(({id})=>{localStorage.puProgress=JSON.stringify({[id]:{complete:true,trainingVersion:'prior-version',updatedAt:'2025-01-01T00:00:00.000Z'}})},lesson);
  expect(await page.evaluate(id=>puLessonDone(id),lesson.id)).toBe(true);
  expect(await page.evaluate(id=>window.puLessonCompletionCurrent(id),lesson.id)).toBe(false);
  expect(await page.evaluate(id=>window.puLessonTrainingReady(id),lesson.id)).toBe(false);
  await page.evaluate(id=>puSetPage('lesson:'+id),lesson.id);
  await expect(page.locator('.head .puBadge')).toHaveText('PRIOR VERSION');
  await expect(page.locator('#puNext')).toBeDisabled();
  await expect(page.locator('#puDone')).toHaveText('MARK COMPLETE FOR CURRENT VERSION');
  await page.locator('#puDone').click();
  expect(await page.evaluate(id=>window.puLessonCompletionCurrent(id),lesson.id)).toBe(true);
  expect(await page.evaluate(id=>window.puLessonTrainingReady(id),lesson.id)).toBe(true);
});

test('malformed transfer is rejected before any device progress is overwritten',async({page})=>{
  await training(page);
  const before=JSON.stringify({safe:{complete:true,trainingVersion:await page.evaluate(()=>PU_VERSION)}});
  await page.evaluate(v=>localStorage.puProgress=v,before);
  const result=await page.evaluate(()=>{try{window.puApplyProgressTransfer({type:'PARADISE_UNIVERSITY_PROGRESS_TRANSFER',data:{puProgress:'{bad'}});return{threw:false,value:localStorage.puProgress}}catch(e){return{threw:true,message:String(e.message||e),value:localStorage.puProgress}}});
  expect(result.threw).toBe(true);expect(result.message).toMatch(/Invalid stored progress data: puProgress/);expect(result.value).toBe(before);
});

test('transfer allowlist rejects unexpected fields and export does not leak unrelated localStorage',async({page})=>{
  await training(page);await page.evaluate(()=>{localStorage.secretToken='DO_NOT_EXPORT';localStorage.puLastMedia='tony-canvassing-101'});
  const exported=await page.evaluate(()=>window.puProgressTransferPayload());
  expect(exported.data.secretToken).toBeUndefined();expect(exported.data.puLastMedia).toBe('tony-canvassing-101');
  const result=await page.evaluate(()=>{try{window.puApplyProgressTransfer({type:'PARADISE_UNIVERSITY_PROGRESS_TRANSFER',data:{secretToken:'ATTACK'}});return false}catch{return true}});
  expect(result).toBe(true);expect(await page.evaluate(()=>localStorage.secretToken)).toBe('DO_NOT_EXPORT');
});

test('oversized transfer is rejected without changing existing device state',async({page})=>{
  await training(page);await page.evaluate(()=>localStorage.puLastMedia='safe-media');
  const result=await page.evaluate(()=>{try{window.puApplyProgressTransfer({type:'PARADISE_UNIVERSITY_PROGRESS_TRANSFER',data:{puLastMedia:'x'.repeat(501)}});return{threw:false,value:localStorage.puLastMedia}}catch(e){return{threw:true,message:String(e.message||e),value:localStorage.puLastMedia,max:window.PU_PROGRESS_TRANSFER_MAX_BYTES}}});
  expect(result.threw).toBe(true);expect(result.message).toMatch(/Invalid last-media value/);expect(result.value).toBe('safe-media');expect(result.max).toBeGreaterThan(1000);
});

test('imported media note is rendered inert and cannot inject markup or script',async({page})=>{
  await training(page);const attack='</textarea><img id="xssProbe" src=x onerror="window.__puXss=1">';
  await page.evaluate(note=>window.puApplyProgressTransfer({type:'PARADISE_UNIVERSITY_PROGRESS_TRANSFER',trainingVersion:PU_VERSION,data:{puMediaNotesV1:JSON.stringify({'grosso-tonality-audio':{note,updatedAt:'2026-08-17T00:00:00.000Z'}})}}),attack);
  await page.evaluate(()=>window.puPlayerOpen('grosso-tonality-audio'));
  await expect(page.locator('#puMediaNote')).toHaveValue(attack);
  await expect(page.locator('#xssProbe')).toHaveCount(0);
  expect(await page.evaluate(()=>window.__puXss||0)).toBe(0);
});

test('corrupt contextual-back state fails closed to a safe training page',async({page})=>{
  let dialogs=0;page.on('dialog',async d=>{dialogs++;await d.dismiss()});
  await training(page);await page.getByRole('button',{name:/Career Path/}).click();await page.getByRole('button',{name:/1\. Foundation/}).click();await page.locator('[data-lesson]').first().click();
  await page.evaluate(()=>sessionStorage.puTrainingNavV1=JSON.stringify([{page:'javascript:alert(1)',scrollY:'not-a-number'}]));
  await page.locator('.puBack').click();
  await expect(page.getByText('Train. Practice. Advance.')).toBeVisible();
  expect(dialogs).toBe(0);expect(await page.evaluate(()=>puPage)).toBe('home');
});

test('red-team invariants preserve field authority, exact pending opener, and iframe-free Drive playback',async({page})=>{
  await training(page);
  const opener="I’m not here to sell you anything. I’m [Name] with Paradise Exteriors. We’re doing some work here in the neighborhood. Quick question—have you ever gotten an estimate to replace your [windows / doors / roof]?";
  expect(await page.evaluate(text=>{const x=PU_LESSONS.find(l=>l.id==='field-opening');return JSON.stringify(x).includes(text)},opener)).toBe(true);
  await page.evaluate(()=>puSetPage('lesson:field-opening'));await expect(page.getByText(/CURRENT APPROVAL PENDING/i)).toBeVisible();
  await page.evaluate(()=>window.puPlayerOpen('tony-canvassing-101'));await expect(page.locator('iframe')).toHaveCount(0);await expect(page.getByRole('link',{name:/PLAY IN GOOGLE DRIVE/i})).toBeVisible();
});
