const PCM_SPREADSHEET_ID='1IuiNXffS7cUOmZbW91IJ5L8J3jz_WX-czfueveIp4t8';
const PCM_LOG_SHEET='Daily Release Log';
const PCM_LOOKUP_SHEET='Manager Lookup';
const PCM_EXPECTED_SNAPSHOT='2026-08-14';
const PCM_DAILY_LIMIT=2000;
const PCM_ALLOWED_CHECKS=['','PASS','STOP','ESCALATE'];

function doGet(){
  return pcmReply_({type:'PCM_CENTRAL_HEALTH',ok:true,snapshot:PCM_EXPECTED_SNAPSHOT,message:'Paradise Canvass Central Intake is online.'});
}

function doPost(e){
  let id='';
  try{
    if(!e||!e.parameter||typeof e.parameter.payload!=='string')throw new Error('MISSING_PAYLOAD');
    if(e.parameter.payload.length>20000)throw new Error('PAYLOAD_TOO_LARGE');
    const r=JSON.parse(e.parameter.payload);
    id=pcmText_(r.id,300,true);
    const lock=LockService.getScriptLock();
    if(!lock.tryLock(10000))throw new Error('INTAKE_BUSY_RETRY');
    try{return pcmReply_(pcmSave_(r,id));}
    finally{lock.releaseLock();}
  }catch(err){
    return pcmReply_({type:'PCM_CENTRAL_SAVE',ok:false,id:id,error:pcmError_(err)});
  }
}

function pcmSave_(r,id){
  if(Number(r.schema)!==1)throw new Error('SCHEMA_MISMATCH');
  if(String(r.snapshot||'')!==PCM_EXPECTED_SNAPSHOT)throw new Error('STALE_SNAPSHOT');
  const completedAt=new Date(r.completedAt);
  if(isNaN(completedAt.getTime()))throw new Error('INVALID_COMPLETED_TIME');
  const manager=pcmText_(r.manager,100,false);
  const office=pcmText_(r.office,100,false);
  const route=pcmText_(r.route,250,false);
  const address=pcmText_(r.address,500,true);
  const municipality=pcmText_(r.municipality,100,true);
  const notes=pcmText_(r.notes,1500,false);
  const checks=r.checks||{};
  const vals=['time','signs','materials','permit','appointment'].map(k=>String(checks[k]||'').toUpperCase());
  vals.forEach(v=>{if(!PCM_ALLOWED_CHECKS.includes(v))throw new Error('INVALID_CHECK_VALUE');});

  const ss=SpreadsheetApp.openById(PCM_SPREADSHEET_ID);
  const lookup=ss.getSheetByName(PCM_LOOKUP_SHEET);
  const log=ss.getSheetByName(PCM_LOG_SHEET);
  if(!lookup||!log)throw new Error('CONTROL_SHEET_MISSING');

  const lookupValues=lookup.getRange(2,1,Math.max(1,lookup.getLastRow()-1),16).getDisplayValues();
  const lookupIndex=lookupValues.findIndex(x=>String(x[0]).trim()===municipality);
  if(lookupIndex<0)throw new Error('MUNICIPALITY_NOT_CONTROLLED');
  const currentRelease=String(lookupValues[lookupIndex][6]||'').trim();
  const currentManagerClass=String(lookupValues[lookupIndex][15]||'').trim();
  if(String(r.currentRelease||'').trim()!==currentRelease)throw new Error('CURRENT_RELEASE_CHANGED');
  if(r.managerClass&&String(r.managerClass).trim()!==currentManagerClass)throw new Error('MANAGER_CLASS_CHANGED');

  const expectedDecision=(currentRelease==='GO'&&vals.every(v=>v==='PASS'))?'DEPLOY':'DO NOT DEPLOY';
  if(String(r.decision||'').trim()!==expectedDecision)throw new Error('DECISION_MISMATCH');

  const existing=pcmFindExisting_(log,id);
  if(existing){
    pcmValidateDuplicate_(log,existing,{manager,office,route,address,municipality,vals,expectedDecision});
    const updateNote=['APP-ID='+id,'APP-SNAPSHOT='+PCM_EXPECTED_SNAPSHOT,'APP-UPDATED='+new Date().toISOString(),notes].filter(Boolean).join(' | ');
    log.getRange(existing,16).setValue(pcmCell_(updateNote));
    SpreadsheetApp.flush();
    return{type:'PCM_CENTRAL_SAVE',ok:true,id:id,duplicate:true,row:existing,decision:String(log.getRange(existing,15).getDisplayValue()||expectedDecision),receipt:pcmReceipt_(completedAt,existing)};
  }

  pcmEnforceDailyLimit_();
  const row=pcmFirstOpenRow_(log);
  pcmEnsureFormulaRow_(log,row);
  log.getRange(row,1,1,6).setValues([[completedAt,pcmCell_(manager),pcmCell_(office),pcmCell_(route),pcmCell_(address),pcmCell_(municipality)]]);
  log.getRange(row,10,1,5).setValues([vals]);
  const auditNote=['APP-ID='+id,'APP-SNAPSHOT='+PCM_EXPECTED_SNAPSHOT,'APP-SAVED='+new Date().toISOString(),notes].filter(Boolean).join(' | ');
  log.getRange(row,16).setValue(pcmCell_(auditNote));
  SpreadsheetApp.flush();

  const sheetRelease=String(log.getRange(row,9).getDisplayValue()||'').trim();
  const sheetDecision=String(log.getRange(row,15).getDisplayValue()||'').trim();
  if(sheetRelease!==currentRelease||sheetDecision!==expectedDecision){
    log.getRange(row,16).setValue(pcmCell_('SERVER-VALIDATION-ERROR | '+auditNote));
    throw new Error('SHEET_FORMULA_VALIDATION_FAILED');
  }
  return{type:'PCM_CENTRAL_SAVE',ok:true,id:id,row:row,decision:sheetDecision,receipt:pcmReceipt_(completedAt,row)};
}

function pcmValidateDuplicate_(sheet,row,x){
  const fixed=sheet.getRange(row,2,1,5).getDisplayValues()[0].map(v=>String(v||'').trim());
  const expectedFixed=[x.manager,x.office,x.route,x.address,x.municipality].map(v=>String(v||'').trim());
  if(JSON.stringify(fixed)!==JSON.stringify(expectedFixed))throw new Error('DUPLICATE_ID_CONFLICT');
  const oldChecks=sheet.getRange(row,10,1,5).getDisplayValues()[0].map(v=>String(v||'').trim().toUpperCase());
  if(JSON.stringify(oldChecks)!==JSON.stringify(x.vals))throw new Error('DUPLICATE_ID_CONFLICT');
  const oldDecision=String(sheet.getRange(row,15).getDisplayValue()||'').trim();
  if(oldDecision!==x.expectedDecision)throw new Error('DUPLICATE_ID_CONFLICT');
}

function pcmFirstOpenRow_(sheet){
  const max=sheet.getMaxRows();
  const values=sheet.getRange(2,1,Math.max(1,max-1),6).getValues();
  for(let i=0;i<values.length;i++){
    if(values[i].every(v=>v===''||v===null))return i+2;
  }
  sheet.insertRowsAfter(max,100);
  return max+1;
}

function pcmEnsureFormulaRow_(sheet,row){
  sheet.getRange(2,7,1,3).copyTo(sheet.getRange(row,7,1,3),SpreadsheetApp.CopyPasteType.PASTE_FORMULA,false);
  sheet.getRange(2,15).copyTo(sheet.getRange(row,15),SpreadsheetApp.CopyPasteType.PASTE_FORMULA,false);
}

function pcmFindExisting_(sheet,id){
  const last=Math.max(2,sheet.getLastRow());
  const found=sheet.getRange(2,16,last-1,1).createTextFinder('APP-ID='+id).matchCase(true).findNext();
  return found?found.getRow():0;
}

function pcmEnforceDailyLimit_(){
  const props=PropertiesService.getScriptProperties();
  const key='PCM_COUNT_'+Utilities.formatDate(new Date(),Session.getScriptTimeZone()||'America/New_York','yyyyMMdd');
  const n=Number(props.getProperty(key)||0);
  if(n>=PCM_DAILY_LIMIT)throw new Error('DAILY_INTAKE_LIMIT');
  props.setProperty(key,String(n+1));
}

function pcmReceipt_(date,row){
  return 'DL-'+Utilities.formatDate(date,Session.getScriptTimeZone()||'America/New_York','yyyyMMdd-HHmm')+'-R'+row;
}

function pcmText_(v,max,required){
  const s=String(v==null?'':v).trim();
  if(required&&!s)throw new Error('REQUIRED_FIELD_MISSING');
  if(s.length>max)throw new Error('FIELD_TOO_LONG');
  return s;
}

function pcmCell_(s){
  s=String(s==null?'':s);
  return /^[=+\-@]/.test(s)?"'"+s:s;
}

function pcmError_(err){
  const m=String(err&&err.message?err.message:err||'UNKNOWN_ERROR');
  return m.replace(/[^A-Z0-9_ .:-]/gi,'').slice(0,160)||'UNKNOWN_ERROR';
}

function pcmReply_(obj){
  const json=JSON.stringify(obj).replace(/</g,'\\u003c');
  const html='<!doctype html><meta charset="utf-8"><body style="font-family:system-ui;padding:18px"><b>Paradise Canvass Central Intake</b><div>'+(obj.ok?'OK':'ERROR')+'</div><script>window.parent.postMessage('+json+',"*");<\/script></body>';
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
