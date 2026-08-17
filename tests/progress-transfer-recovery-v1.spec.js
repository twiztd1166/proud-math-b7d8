import {test,expect} from '@playwright/test';

async function openProgress(page){
  await page.goto('/index.html');
  await page.locator('#nTrain').click();
  await page.evaluate(()=>puSetPage('progress'));
  await expect(page.locator('#puImportProgressFile')).toBeAttached();
}

function transferFile(data,trainingVersion='2026.08.16-pu-v1-content-5'){
  return{name:'paradise-university-progress-test.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({type:'PARADISE_UNIVERSITY_PROGRESS_TRANSFER',version:'2026.08.17-pu-progress-transfer-v2-hardened',trainingVersion,exportedAt:'2026-08-17T00:00:00.000Z',data}))};
}

test('canceling a destructive progress import preserves every existing transfer-domain value',async({page})=>{
  await openProgress(page);
  const before=await page.evaluate(()=>{
    const values={
      puProgress:JSON.stringify({'field-lookup':{complete:true,trainingVersion:PU_VERSION,updatedAt:'2026-08-17T00:00:00.000Z'}}),
      puQuickChecksV1:JSON.stringify({'field-lookup':{passed:true,checksVersion:window.PU_CHECKS_VERSION,trainingVersion:PU_VERSION,updatedAt:'2026-08-17T00:00:00.000Z'}}),
      puLastMedia:'tony-canvassing-101'
    };
    for(const [k,v] of Object.entries(values))localStorage[k]=v;
    return values;
  });
  let dialogs=0;
  page.on('dialog',async d=>{dialogs++;expect(d.type()).toBe('confirm');expect(d.message()).toContain('will replace Paradise University progress stored on this device');await d.dismiss()});
  await page.locator('#puImportProgressFile').setInputFiles(transferFile({}));
  await expect(page.locator('#puExperienceToast')).toContainText('Import canceled');
  const after=await page.evaluate(()=>({
    values:{puProgress:localStorage.puProgress,puQuickChecksV1:localStorage.puQuickChecksV1,puLastMedia:localStorage.puLastMedia},
    guard:window.PU_PROGRESS_IMPORT_GUARD_VERSION,
    needs:window.puProgressImportNeedsConfirmation(),
    input:document.getElementById('puImportProgressFile').value
  }));
  expect(dialogs).toBe(1);expect(after.guard).toBe('2026.08.17-pu-progress-import-guard-v1');expect(after.needs).toBe(true);expect(after.input).toBe('');expect(after.values).toEqual(before);
});

test('confirming a destructive progress import replaces rather than merges destination progress',async({page})=>{
  await openProgress(page);
  await page.evaluate(()=>{
    localStorage.puQuickChecksV1=JSON.stringify({'field-lookup':{passed:true,checksVersion:window.PU_CHECKS_VERSION,trainingVersion:PU_VERSION,updatedAt:'2026-08-17T00:00:00.000Z'}});
    localStorage.puLastMedia='destination-only-media';
  });
  let dialogs=0;
  page.on('dialog',async d=>{dialogs++;expect(d.type()).toBe('confirm');await d.accept()});
  const imported=JSON.stringify({'field-lookup':{complete:true,trainingVersion:'2026.08.16-pu-v1-content-5',updatedAt:'2026-08-17T00:00:00.000Z'}});
  await page.locator('#puImportProgressFile').setInputFiles(transferFile({puProgress:imported}));
  await expect(page.locator('#puExperienceToast')).toContainText('Progress imported');
  const after=await page.evaluate(()=>({progress:localStorage.puProgress,checks:localStorage.getItem('puQuickChecksV1'),lastMedia:localStorage.getItem('puLastMedia'),ready:window.puLessonTrainingReady('field-lookup')}));
  expect(dialogs).toBe(1);expect(after.progress).toBe(imported);expect(after.checks).toBeNull();expect(after.lastMedia).toBeNull();expect(after.ready).toBe(false);
});
