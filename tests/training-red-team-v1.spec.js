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

test('prior-version completion is preserved as history but cannot satisfy current readiness',async({page})=>{
  await training(page);const lesson=await noCheckCoreLesson(page);
  await page.evaluate(({id})=>{localStorage.setItem('puProgress',JSON.stringify({[id]:{complete:true,trainingVersion:'prior-version',updatedAt:'2025-01-01T00:00:00.000Z'}}))},lesson);
  const seeded=await page.evaluate(id=>({raw:puRead()[id],done:puLessonDone(id),rawDone:window.puLessonRawCompletion(id),current:window.puLessonCompletionCurrent(id),ready:window.puLessonTrainingReady(id)}),lesson.id);
  expect(seeded.raw.complete).toBe(true);expect(seeded.raw.trainingVersion).toBe('prior-version');expect(seeded.rawDone).toBe(true);
  expect(seeded.done).toBe(false);expect(seeded.current).toBe(false);expect(seeded.ready).toBe(false);
  await page.evaluate(id=>puSetPage('lesson:'+id),lesson.id);
  await expect(page.locator('.head .puBadge')).toHaveText('PRIOR VERSION');
  await expect(page.locator('.puCompletionNote')).toContainText('Prior-version content completion is preserved as history');
  await expect(page.locator('#puNext')).toBeDisabled();
  await expect(page.locator('#puDone')).toHaveText('MARK COMPLETE FOR CURRENT VERSION');
  await page.locator('#puDone').click();
  expect(await page.evaluate(id=>window.puLessonCompletionCurrent(id),lesson.id)).toBe(true);
  expect(await page.evaluate(id=>window.puLessonTrainingReady(id),lesson.id)).toBe(true);
  const history=await page.evaluate(id=>puRead()[id].completionHistory||[],lesson.id);expect(history.some(x=>x.trainingVersion==='prior-version')).toBe(true);
});

test('prior-version Quick Check cannot satisfy a current-version completed lesson',async({page})=>{
  await training(page);const id='field-lookup';
  await page.evaluate(id=>{
    localStorage.puProgress=JSON.stringify({[id]:{complete:true,trainingVersion:PU_VERSION,updatedAt:new Date().toISOString()}});
    localStorage.puQuickChecksV1=JSON.stringify({[id]:{passed:true,checksVersion:'prior-check-version',trainingVersion:PU_VERSION,updatedAt:new Date().toISOString()}});
  },id);
  expect(await page.evaluate(id=>window.puLessonCompletionCurrent(id),id)).toBe(true);
  expect(await page.evaluate(id=>window.puQuickCheckPassed(id),id)).toBe(false);
  expect(await page.evaluate(id=>window.puLessonTrainingReady(id),id)).toBe(false);
  await page.evaluate(id=>puSetPage('lesson:'+id),id);await expect(page.locator('#puNext')).toBeDisabled();
  const choices=page.locator('[data-pu-check]');await expect(choices).toHaveCount(3);await choices.nth(1).click();
  expect(await page.evaluate(id=>window.puQuickCheckPassed(id),id)).toBe(true);expect(await page.evaluate(id=>window.puLessonTrainingReady(id),id)).toBe(true);
});

test('malformed transfer is rejected before any device progress is overwritten',async({page})=>{
  await training(page);
  const before=JSON.stringify({safe:{complete:true,trainingVersion:await page.evaluate(()=>PU_VERSION)}});
  await page.evaluate(v=>localStorage.puProgress=v,before);
  const result=await page.evaluate(()=>{try{window.puApplyProgressTransfer({type:'PARADISE_UNIVERSITY_PROGRESS_TRANSFER',data:{puProgress:'{bad'}});return{threw:false,value:localStorage.puProgress}}catch(e){return{threw:true,message:String(e.message||e),value:localStorage.puProgress}}});
  expect(result.threw).toBe(true);expect(result.message).toMatch(/Invalid stored progress data: puProgress/);expect(result.value).toBe(before);
});

test('progress transfer replaces the transfer snapshot instead of merging destination-only readiness state',async({page})=>{
  await training(page);const id='field-lookup';
  const result=await page.evaluate(id=>{
    localStorage.puQuickChecksV1=JSON.stringify({[id]:{passed:true,checksVersion:window.PU_CHECKS_VERSION,trainingVersion:PU_VERSION,updatedAt:new Date().toISOString()}});
    localStorage.puLastMedia='destination-only-media';
    const imported=JSON.stringify({[id]:{complete:true,trainingVersion:PU_VERSION,updatedAt:new Date().toISOString()}});
    window.puApplyProgressTransfer({type:'PARADISE_UNIVERSITY_PROGRESS_TRANSFER',version:window.PU_PROGRESS_TRANSFER_VERSION,trainingVersion:PU_VERSION,data:{puProgress:imported}});
    return{progress:localStorage.puProgress,checks:localStorage.getItem('puQuickChecksV1'),lastMedia:localStorage.getItem('puLastMedia'),ready:window.puLessonTrainingReady(id),checkPassed:window.puQuickCheckPassed(id)};
  },id);
  expect(result.progress).toContain(id);expect(result.checks).toBeNull();expect(result.lastMedia).toBeNull();expect(result.checkPassed).toBe(false);expect(result.ready).toBe(false);
});

test('transfer allowlist rejects unexpected fields and export does not leak unrelated localStorage',async({page})=>{
  await training(page);await page.evaluate(()=>{localStorage.secretToken='DO_NOT_EXPORT';localStorage.puLastMedia='tony-canvassing-101'});
  const exported=await page.evaluate(()=>window.puProgressTransferPayload());
  expect(exported.data.secretToken).toBeUndefined();expect(exported.data.puLastMedia).toBe('tony-canvassing-101');
  const result=await page.evaluate(()=>{try{window.puApplyProgressTransfer({type:'PARADISE_UNIVERSITY_PROGRESS_TRANSFER',data:{secretToken:'ATTACK'}});return false}catch{return true}});
  expect(result).toBe(true);expect(await page.evaluate(()=>localStorage.secretToken)).toBe('DO_NOT_EXPORT');
});

test('prototype-pollution style transfer key is rejected without object pollution',async({page})=>{
  await training(page);
  const result=await page.evaluate(()=>{const payload=JSON.parse('{"type":"PARADISE_UNIVERSITY_PROGRESS_TRANSFER","data":{"__proto__":"polluted"}}');try{window.puApplyProgressTransfer(payload);return{threw:false,polluted:Object.prototype.polluted}}catch(e){return{threw:true,message:String(e.message||e),polluted:Object.prototype.polluted}}});
  expect(result.threw).toBe(true);expect(result.message).toMatch(/Unexpected progress field: __proto__/);expect(result.polluted).toBeUndefined();
});

test('oversized transfer is rejected without changing existing device state',async({page})=>{
  await training(page);await page.evaluate(()=>localStorage.puLastMedia='safe-media');
  const result=await page.evaluate(()=>{try{window.puApplyProgressTransfer({type:'PARADISE_UNIVERSITY_PROGRESS_TRANSFER',data:{puLastMedia:'x'.repeat(501)}});return{threw:false,value:localStorage.puLastMedia}}catch(e){return{threw:true,message:String(e.message||e),value:localStorage.puLastMedia,max:window.PU_PROGRESS_TRANSFER_MAX_BYTES}}});
  expect(result.threw).toBe(true);expect(result.message).toMatch(/Invalid last-media value/);expect(result.value).toBe('safe-media');expect(result.max).toBeGreaterThan(1000);
});

test('forged device progress cannot create an official certification claim',async({page})=>{
  await training(page);
  await page.evaluate(()=>{
    const progress={},checks={};for(const x of PU_LESSONS){progress[x.id]={complete:true,trainingVersion:PU_VERSION,updatedAt:new Date().toISOString()};if(window.puQuickCheckRequired(x.id))checks[x.id]={passed:true,checksVersion:window.PU_CHECKS_VERSION,trainingVersion:PU_VERSION,updatedAt:new Date().toISOString()}}
    window.puApplyProgressTransfer({type:'PARADISE_UNIVERSITY_PROGRESS_TRANSFER',version:window.PU_PROGRESS_TRANSFER_VERSION,trainingVersion:PU_VERSION,data:{puProgress:JSON.stringify(progress),puQuickChecksV1:JSON.stringify(checks)}});
    puSetPage('progress');
  });
  const certification=page.locator('details.puSources').filter({hasText:/Advancement & certification details/i});
  await expect(certification).toBeVisible();await certification.locator('summary').click();
  await expect(certification.getByText('OFFICIAL CERTIFICATION',{exact:true})).toBeVisible();
  await expect(certification.getByText(/Manager demonstration, field verification, and current Paradise requirements remain separate from device progress/i)).toBeVisible();
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

test('trainer catalog denominator is exact and public RawGitHack media mirroring is absent',async({page})=>{
  await training(page);
  const audit=await page.evaluate(()=>{const media=window.PU_CONTENT.media||[],counts={};for(const m of media)counts[m.trainer]=(counts[m.trainer]||0)+1;const ids=media.map(x=>x.id);return{total:media.length,unique:new Set(ids).size,tony:counts['Tony Hoty']||0,dave:counts['Dave Yoho']||0,grosso:counts['Grosso University']||0,source:media.filter(x=>x.priority==='SOURCE_LIBRARY').length,curated:media.filter(x=>x.priority!=='SOURCE_LIBRARY').length,badProtocol:media.filter(x=>x.url&&!/^https:\/\//i.test(x.url)).map(x=>x.id),publicMirror:media.filter(x=>/raw(?:cdn\.)?githack|raw\.githubusercontent/i.test(`${x.url||''} ${x.streamUrl||''}`)).map(x=>x.id)}});
  expect(audit).toEqual({total:79,unique:79,tony:24,dave:4,grosso:51,source:67,curated:12,badProtocol:[],publicMirror:[]});
});

test('catalog URL-bearing fields contain no active-content or insecure absolute schemes',async({page})=>{
  await training(page);
  const bad=await page.evaluate(()=>{
    const hits=[];
    const walk=(v,path='PU_CONTENT')=>{if(!v||typeof v!=='object')return;for(const [k,x] of Object.entries(v)){const p=`${path}.${k}`;if(typeof x==='string'&&/url$/i.test(k)){const s=x.trim();if(/^\w+:/i.test(s)&&!/^https:/i.test(s))hits.push(`${p}=${s}`);if(/^\s*(?:javascript|data|vbscript|file):/i.test(s))hits.push(`${p}=ACTIVE:${s}`)}else if(x&&typeof x==='object')walk(x,p)}};
    walk(window.PU_CONTENT);return hits;
  });
  expect(bad).toEqual([]);
});

test('service worker excludes external Drive and only refreshes offline index from the actual app entry',async({page})=>{
  await training(page);const sw=await page.evaluate(()=>fetch('/sw.js').then(r=>r.text()));
  expect(sw).toContain("if(url.origin!==self.location.origin)return");expect(sw).not.toMatch(/drive\.google\.com|googleusercontent\.com/i);expect(sw).toContain('trainingux5-experience3-redteam3');
  expect(sw).toContain("isAppEntry=url.pathname===appIndex.pathname||url.pathname===appRoot.pathname");expect(sw).toContain('if(isAppEntry&&r.ok&&html)');
});

test('red-team invariants preserve field authority, exact pending opener, and iframe-free Drive playback',async({page})=>{
  await training(page);
  const opener="I’m not here to sell you anything. I’m [Name] with Paradise Exteriors. We’re doing some work here in the neighborhood. Quick question—have you ever gotten an estimate to replace your [windows / doors / roof]?";
  expect(await page.evaluate(text=>{const x=PU_LESSONS.find(l=>l.id==='field-opening');return JSON.stringify(x).includes(text)},opener)).toBe(true);
  await page.evaluate(()=>puSetPage('lesson:field-opening'));await expect(page.getByText(/CURRENT APPROVAL PENDING/i)).toBeVisible();
  await page.evaluate(()=>window.puPlayerOpen('tony-canvassing-101'));const player=page.locator('#puPlayerRoot');await expect(player.locator('iframe')).toHaveCount(0);
  const drive=player.locator('#puDriveLaunch');await expect(drive).toBeVisible();await expect(drive).toHaveText(/PLAY IN GOOGLE DRIVE/i);await expect(drive).toHaveAttribute('target','_blank');await expect(drive).toHaveAttribute('rel',/noopener/);await expect(drive).toHaveAttribute('href',/drive\.google\.com\/file\/d\/1Z8wIrTrULa1g3In7_ucINtNZTV0eWczk/);
});
