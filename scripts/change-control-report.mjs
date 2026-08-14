import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const current=JSON.parse(fs.readFileSync('controlled-register-source.json','utf8'));
let previous=null;
try{previous=JSON.parse(execFileSync('git',['show','HEAD^:controlled-register-source.json'],{encoding:'utf8'}))}catch{}
const hash=o=>crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
const counts=o=>({records:o?.records?.length||0,go:o?.records?.filter(r=>r.release==='GO').length||0,noGo:o?.records?.filter(r=>r.release==='NO-GO').length||0});
const fields=['jurisdiction','release','addressCheck','hours','refusal','access','hssEscalation','nextAction','managerClass','doFirst','why','script','challenge','lastVerified'];
const byName=o=>new Map((o?.records||[]).map(r=>[r.name,r]));
const oldMap=byName(previous),newMap=byName(current),names=[...new Set([...oldMap.keys(),...newMap.keys()])].sort();
const changes=[];
for(const name of names){
  const before=oldMap.get(name),after=newMap.get(name);
  if(!before){changes.push({jurisdiction:name,type:'ADDED',after});continue}
  if(!after){changes.push({jurisdiction:name,type:'REMOVED',before});continue}
  const changedFields=[];
  for(const f of fields)if(JSON.stringify(before[f]??null)!==JSON.stringify(after[f]??null))changedFields.push({field:f,before:before[f]??null,after:after[f]??null});
  const oldSources=Array.isArray(before.sources)?before.sources:[],newSources=Array.isArray(after.sources)?after.sources:[];
  const sourceAdded=newSources.filter(x=>!oldSources.includes(x)),sourceRemoved=oldSources.filter(x=>!newSources.includes(x));
  if(sourceAdded.length||sourceRemoved.length)changedFields.push({field:'sources',added:sourceAdded,removed:sourceRemoved,before:oldSources,after:newSources});
  if(changedFields.length)changes.push({jurisdiction:name,type:'MODIFIED',changes:changedFields});
}
const report={schemaVersion:1,generatedForCommit:process.env.GITHUB_SHA||'',generatedAt:new Date().toISOString(),previousAvailable:!!previous,previousDatasetSha256:previous?hash(previous):null,currentDatasetSha256:hash(current),previousCounts:previous?counts(previous):null,currentCounts:counts(current),datasetChanged:previous?hash(previous)!==hash(current):null,jurisdictionChangeCount:changes.length,classificationChanges:changes.filter(x=>x.type==='MODIFIED'&&x.changes?.some(c=>c.field==='release')).map(x=>({jurisdiction:x.jurisdiction,change:x.changes.find(c=>c.field==='release')})),changes};
fs.writeFileSync('change-control-report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({datasetChanged:report.datasetChanged,jurisdictionChangeCount:report.jurisdictionChangeCount,classificationChanges:report.classificationChanges.length},null,2));
