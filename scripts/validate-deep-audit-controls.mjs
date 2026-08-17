import fs from 'node:fs';
import vm from 'node:vm';

const read=f=>fs.readFileSync(f,'utf8');
const must=(ok,msg)=>{if(!ok)throw new Error(msg)};
const pipeline=['training-content-v1.js','training-content-sourcefix-v1.js','training-manager-v1-data.js','training-sales-v1-data.js','training-media-expanded-v1.js','training-media-reconciliation-v1.js'];
const ctx={window:{}};vm.createContext(ctx);for(const f of pipeline)vm.runInContext(read(f),ctx);
const u=ctx.window.PU_CONTENT;must(u,'Training content missing');

// The retired unverified Tony ID may remain only as pre-sourcefix tombstoned source debt;
// it must never survive into active runtime content or later catalog layers.
must(!(u.media||[]).some(x=>x.id==='tony-audio-training'),'Retired unverified Tony media survived into active runtime');
must(!read('training-media-expanded-v1.js').includes('19CvExmu1fCyaq3SpLprsn8TVIQq-Bzt0'),'Retired Tony Drive ID leaked into expanded media layer');
must(read('training-content-sourcefix-v1.js').includes("!['tony-audio-training','tony-multiproduct-set'].includes(x.id)"),'Tony tombstone/removal control missing');

const fix=read('training-deep-audit-fixes-v1.js');
must(fix.includes('2026.08.17-pu-deep-audit-fixes-v1'),'Deep-audit runtime fix version missing');
must(fix.includes("x.trainingVersion===PU_VERSION"),'Current-curriculum completion gate missing');
must(fix.includes("canvasserStage.name='Canvasser'"),'Canvasser stage-label hardening missing');
must(fix.includes('current manager-approved canvass opening'),'Opener authority normalization missing');
must(fix.includes("puNextLesson=function(){return PU_LESSONS.find(x=>!trainingReady(x))||null}"),'Completed-curriculum next-lesson stop missing');

const checks=read('training-checks-v1.js');
must(checks.includes('2026.08.17-pu-checks-v3-versioned'),'Versioned Quick Check control missing');
must(checks.includes('x.checksVersion===VERSION&&x.trainingVersion===PU_VERSION'),'Quick Check current-version gate missing');
must(checks.includes('x.checksVersion=VERSION;x.trainingVersion=PU_VERSION'),'Quick Check version persistence missing');

const practice=read('training-practice-v1.js');
must(!practice.includes("toISOString().slice(0,10)"),'Practice today counter still uses UTC calendar date');
for(const token of ['getFullYear()','getMonth()+1','getDate()'])must(practice.includes(token),`Local-date practice control missing ${token}`);

const index=read('index.html'),sw=read('sw.js'),build=read('scripts/build-canvass-site.mjs');
for(const token of ['training-deep-audit-fixes-v1.js']){
  must(index.includes(token),`Index missing ${token}`);must(sw.includes(token),`Service worker missing ${token}`);must(build.includes(token),`Production build missing ${token}`);
}
must(sw.includes('deepaudit1'),'PWA cache identity was not bumped for deep-audit runtime changes');

const workflow=read('.github/workflows/validate-paradise-university-v1.yml');
for(const token of ['validate-training-reconciliation.mjs','validate-deep-audit-controls.mjs','deep-audit-regression.spec.js','training-deep-audit-fixes-v1.js'])must(workflow.includes(token),`Main validator blind spot remains: ${token}`);

const opener=read('training-currentness-v1.js');
const exact='I’m not here to sell you anything. I’m [Name] with Paradise Exteriors. We’re doing some work here in the neighborhood. Quick question—have you ever gotten an estimate to replace your [windows / doors / roof]?';
must(opener.includes(exact),'Exact existing Paradise candidate opener changed during deep-audit repair');

console.log({status:'PASS',deepAuditVersion:'2026.08.17-pu-deep-audit-fixes-v1',quickChecks:'CURRENT_VERSION_ONLY',completion:'CURRENT_CURRICULUM_ONLY',trainerMedia:(u.media||[]).length,retiredTonyActive:false});
