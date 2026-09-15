import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const URL = Deno.env.get('SUPABASE_URL')!;
const KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const deploymentId = Deno.env.get('DENO_DEPLOYMENT_ID') || '';
const deploymentVersion = deploymentId.split('_').at(-1) || 'local';
const ORIGINS = new Set([
  'https://paradise-shows-pe12.vercel.app',
  'https://paradise-shows-1bas3du7d-pe12.vercel.app',
  'https://paradise-shows-open.anthonybeckner.chatgpt.site',
  'https://taxlrlfsobtnbasjcnuf.supabase.co',
  'https://twiztd1166.github.io',
  'https://paradise-shows-public.proud-math-b7d8.pages.dev',
  'https://paradise-shows-history-preview-pe12.vercel.app',
  'https://paradise-shows-history-preview-mm1r2q63x-pe12.vercel.app',
]);

const cors = (r: Request) => {
  const origin = r.headers.get('origin') || '';
  return {
    ...(ORIGINS.has(origin) ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Access-Control-Allow-Headers': 'content-type, authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Vary': 'Origin',
  };
};
const out = (r: Request, x: any, s = 200, extra: Record<string,string> = {}) => new Response(JSON.stringify(x), {
  status: s,
  headers: { ...cors(r), 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Paradise-Deployment-Version': deploymentVersion, ...extra },
});

const WRITE_SESSION_HOURS=12;
const LOGIN_WINDOW_MS=15*60*1000;
const LOGIN_BLOCK_MS=15*60*1000;
const LOGIN_MAX_FAILURES=5;
async function sha256Hex(value:string){
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
function constantTimeEqual(a:string,b:string){
  if(a.length!==b.length)return false;
  let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);
  return diff===0;
}
function writeBearer(r:Request){
  const value=String(r.headers.get('authorization')||'').trim();
  const match=value.match(/^Bearer\s+(.+)$/i);
  return match?match[1].trim():'';
}
function randomSessionToken(){
  const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);
  let raw='';for(const byte of bytes)raw+=String.fromCharCode(byte);
  return btoa(raw).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
async function activeWriteSession(r:Request){
  const token=writeBearer(r);if(!token)return null;
  const tokenHash=await sha256Hex(token);
  const now=new Date().toISOString();
  const session=await db.from('shows_app_sessions').select('id,expires_at').eq('token_hash',tokenHash).gt('expires_at',now).maybeSingle();
  if(session.error||!session.data)return null;
  return session.data;
}
async function loginClientHash(r:Request){
  const forwarded=String(r.headers.get('cf-connecting-ip')||r.headers.get('x-forwarded-for')||'').split(',')[0].trim();
  const ua=String(r.headers.get('user-agent')||'').slice(0,240);
  return sha256Hex('paradise-shows|'+forwarded+'|'+ua);
}

function plainObject(v: any) { return !!v && typeof v === 'object' && !Array.isArray(v); }
function same(a: any, b: any) { return String(a ?? '') === String(b ?? ''); }
const sourcePlaceholders = new Set(['n/a','na','n.a.','none','unknown','tbd','tba','—','-','not available','not applicable']);
function meaningfulSourceValue(v: any) {
  const text=String(v??'').trim();
  return !!text&&!sourcePlaceholders.has(text.toLowerCase());
}
function coiAffirmative(v: any) {
  return new Set(['y','yes','true','required','provided','on file']).has(String(v??'').trim().toLowerCase());
}
function coiStatusKnown(v: any) {
  const text=String(v??'').trim().toLowerCase();
  return meaningfulSourceValue(v)&&text!=='w-9';
}
function knownCostValue(v: any) {
  const text=String(v??'').trim();
  if(!text||sourceSemanticState(text)!=='VALUE')return false;
  return text.toLowerCase()==='free'||/[0-9]/.test(text);
}
function knownDateText(v:any){
  const text=String(v??'').trim();
  if(!text||sourceSemanticState(text)!=='VALUE')return false;
  return /(?:20\d{2}|\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b|\b\d{1,2}[\/-]\d{1,2}\b)/i.test(text);
}
function normalizeSourceFieldKey(key:any){return String(key??'').toLowerCase().replace(/\s+/g,' ').trim()}
function sourceFieldValue(row:any,keys:string[]){
  const fields=plainObject(row?.source_fields)?row.source_fields:{};
  for(const key of keys){const value=fields[key];if(value!==null&&value!==undefined&&String(value).trim())return String(value).trim()}
  const wanted=new Set(keys.map(normalizeSourceFieldKey));
  for(const [fieldKey,value] of Object.entries(fields)){
    if(wanted.has(normalizeSourceFieldKey(fieldKey))&&value!==null&&value!==undefined&&String(value).trim())return String(value).trim();
  }
  return '';
}
function sourceSemanticState(value:any){
  const text=String(value??'').trim();
  if(!text)return 'MISSING';
  const normalized=text.toLowerCase();
  const naTokens=['n/a','na','not applicable','none'];
  if(naTokens.some(token=>normalized===token||normalized.startsWith(token+' ')))return 'NA';
  const unknownTokens=['unknown','unk','not known','not found','not available','missing','tbd','unavailable','not calculated','not calculable','cannot calculate'];
  if(unknownTokens.some(token=>normalized===token||normalized.startsWith(token+' '))||['?','—','-'].includes(normalized))return 'UNKNOWN';
  return 'VALUE';
}
function historyContactValue(row:any){
  const named=String(row?.contact||sourceFieldValue(row,['CONTACT INFO','CONTACT_NAME','CONTACT'])||'').trim();
  if(named)return named;
  const phone=sourceFieldValue(row,['PHONE']);
  if(phone)return 'Phone: '+phone;
  const fields=plainObject(row?.source_fields)?row.source_fields:{};
  const booking=plainObject(fields.booking_evidence)?fields.booking_evidence:null;
  if(booking){
    const bookingContact=String(booking.contact||'').trim();
    if(bookingContact)return bookingContact;
    const bookingPhone=String(booking.phone||'').trim();
    if(bookingPhone)return 'Phone: '+bookingPhone;
    const bookingEmail=String(booking.email||'').trim();
    if(bookingEmail)return 'Email: '+bookingEmail;
  }
  return '';
}
function historyBoothValue(row:any){return String(row?.booth||sourceFieldValue(row,['BOOTH / SPACE LOCATION','BOOTH #'])||'').trim()}
function specificLpAttributedPlacementValue(value:any){
  const text=String(value??'').trim();
  if(!text||sourceSemanticState(text)!=='VALUE'||!/[0-9]/.test(text))return false;
  return !/(^N\/A$|^UNKNOWN|NUMBER NOT STATED|ASSIGNED (AT|ON)SITE|ASSIGNED AT SETUP|WOULD FOLLOW|NOT RECOVERED|UNVERIFIED|EXACT.{0,120}(NOT STATED|UNKNOWN|TBD|TO BE ASSIGNED)|SPACE ASSIGNED AT.{0,120}CHECK-IN|ASSIGNMENT (ISSUED|ASSIGNED) ONSITE)/i.test(text);
}
function informativeLpAttributedPlacementTypeValue(value:any){
  const text=String(value??'').replace(/\s+/g,' ').trim();
  if(!text||sourceSemanticState(text)!=='VALUE'||/[0-9]/.test(text))return false;
  if(/(^N\/A$|^UNKNOWN|NUMBER NOT STATED|ASSIGNED (AT|ON)SITE|ASSIGNED AT SETUP|WOULD FOLLOW|NOT RECOVERED|UNVERIFIED|EXACT.{0,120}(NOT STATED|UNKNOWN|TBD|TO BE ASSIGNED)|SPACE ASSIGNED AT.{0,120}CHECK-IN|ASSIGNMENT (ISSUED|ASSIGNED) ONSITE)/i.test(text))return false;
  return /\b(?:outside|outdoor|inside|indoor)\b.*\b(?:popup|pop-up)\b|\b(?:popup|pop-up)\b.*\b(?:outside|outdoor|inside|indoor)\b/i.test(text);
}
function historyCostValue(row:any){return String(row?.final_cost_text||row?.event_cost_text||sourceFieldValue(row,['FINAL / NEGOTIATED COST','FINAL NEGOTIATED COST','EVENT COST','COST'])||'').trim()}
function historyComValue(row:any){
  if(row?.com_percent!==null&&row?.com_percent!==undefined&&String(row.com_percent).trim()!=='')return String(row.com_percent).trim()+'%';
  return sourceFieldValue(row,['COM % (EVENT COST ÷ NET REV)']);
}
function governedStatusStateValue(value:any){
  const text=String(value??'').trim();
  if(!text)return '';
  const upper=text.toUpperCase();
  const naMarkers=['AGGREGATED','BUNDLE AGGREGATE','DO NOT DOUBLE COUNT','NO EVENT-SPECIFIC','DO NOT ALLOCATE','MONTH-RESOLVED ELSEWHERE','MAPS TO '];
  return naMarkers.some(marker=>upper.includes(marker))?'N/A — '+text:'UNKNOWN — '+text;
}
function historyCostStateValue(row:any){
  const value=historyCostValue(row);
  if(value)return value;
  const verification=sourceFieldValue(row,['VERIFICATION STATUS']);
  const upper=verification.toUpperCase();
  if(upper.includes('COST UNVERIFIED')||upper.includes('COST UNKNOWN')||upper.includes('COST NOT RECOVERED'))return 'UNKNOWN — '+verification;
  return '';
}
function sourceLabeledPerformanceValue(row:any){
  if(String(row?.source_kind||'')!=='SHOW_PERFORMANCE')return '';
  const fields=plainObject(row?.source_fields)?row.source_fields:{};
  const specs=[
    ['appts','Appts'],['contacts','Contacts'],['raw_leads','Raw leads'],['set_appts_unconfirmed','Set appts (unconfirmed)'],
    ['sets','Sets'],['sales','Sales'],['gross','Gross'],['gross_sale','Gross sale'],
  ];
  const values=[];
  for(const [key,label] of specs){
    const value=fields[key];
    if(value!==null&&value!==undefined&&String(value).trim()!=='')values.push(label+' '+String(value).trim());
  }
  return values.length?'SOURCE-LABELED PERFORMANCE — '+values.join(' · '):'';
}
function historyPerformanceStateValue(row:any,present:boolean){
  if(present)return 'PRESENT';
  const sourceLabeled=sourceLabeledPerformanceValue(row);
  if(sourceLabeled)return sourceLabeled;
  return governedStatusStateValue(sourceFieldValue(row,['PERFORMANCE MATCH STATUS']));
}
function historyComStateValue(row:any,performanceState:string){
  const value=historyComValue(row);
  if(value)return value;
  if(sourceSemanticState(performanceState)==='NA')return 'N/A — performance not separately attributable';
  if(sourceSemanticState(performanceState)==='UNKNOWN')return 'UNKNOWN — performance attribution unresolved';
  return governedStatusStateValue(sourceFieldValue(row,['FULL COM STATUS']));
}
function newStateCounts(){return {VALUE:0,UNKNOWN:0,NA:0,MISSING:0}}
function bumpState(bucket:any,key:string,value:any){
  if(!bucket[key])bucket[key]=newStateCounts();
  bucket[key][sourceSemanticState(value)]++;
}
function newYearFieldBucket(){
  return {
    records:0,contact:newStateCounts(),booth:newStateCounts(),cost:newStateCounts(),com:newStateCounts(),
    performance:newStateCounts(),payment:newStateCounts(),application:newStateCounts(),coi:newStateCounts(),
    coi_affirmative:0,coi_known_nonaffirmative:0,worked:{HAS:0,MISSING:0},nonparticipation:{HAS:0,MISSING:0},com_values:[] as number[],
  };
}
function sumStateCounts(target:any,source:any){for(const key of ['VALUE','UNKNOWN','NA','MISSING'])target[key]+=Number(source?.[key]||0)}
const CLEANUP_FIELD_KEYS=['contact','booth','cost','com','performance','payment','application','coi'];
const CLEANUP_FAMILY_MIN_CODED_RATIO=0.25;
function historyFieldStateValues(row:any){
  const performancePresent=[
    row.issued_appts,row.demos,row.net_sales_count,row.net_revenue,row.gross_sales_count,row.gross_sales_value,row.nsli,
  ].some((value:any)=>value!==null&&value!==undefined&&String(value)!=='');
  const performanceState=historyPerformanceStateValue(row,performancePresent);
  return {
    contact:historyContactValue(row),
    booth:historyBoothValue(row),
    cost:historyCostStateValue(row),
    com:historyComStateValue(row,performanceState),
    performance:performanceState,
    payment:String(row.payment_status_text||'').trim(),
    application:String(row.application_status_text||'').trim(),
    coi:String(row.coi||'').trim(),
  };
}
function cleanupFamilyKey(row:any){
  return [Number(row.source_year)||0,String(row.source_kind||''),String(row.source_workbook||'')].join('|');
}
function cleanupFieldFamilyKey(row:any,field:string){
  const base=cleanupFamilyKey(row);
  const fields=plainObject(row?.source_fields)?row.source_fields:{};
  if((field==='contact'||field==='payment')&&String(row?.source_kind||'')==='SHOW_PERFORMANCE'&&String(row?.source_workbook||'')==='SHOWS & EVENTS ANALYSIS.xlsx'){
    return plainObject(fields.booking_evidence)?base+'|SUPPLEMENT:BOOKING_EVIDENCE|FIELD:'+field:'';
  }
  if(field==='cost'&&String(row?.source_kind||'')==='ARCHIVED_SCHEDULE'&&Array.isArray(fields.cost_sources)){
    return fields.cost_sources.length?base+'|SUPPLEMENT:COST_REGISTER|FIELD:'+field:'';
  }
  return base+'|FIELD:'+field;
}
async function fetchAllRows(table:string,columns:string,configure:(query:any)=>any,orderColumn:string) {
  const rows:any[]=[];
  const requestedPageSize=1000;
  for(let start=0;;){
    let query=db.from(table).select(columns);
    query=configure(query).order(orderColumn,{ascending:true}).range(start,start+requestedPageSize-1);
    const page=await query;
    if(page.error)return {data:null,error:page.error};
    const batch=page.data||[];
    if(batch.length===0)return {data:rows,error:null};
    rows.push(...batch);
    start+=batch.length;
  }
}
function today() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
function dd(d?: string | null) {
  if (!d) return null;
  return Math.round((Date.parse(d + 'T12:00:00-04:00') - Date.parse(today() + 'T12:00:00-04:00')) / 86400000);
}

const showFields = new Set(['show_status','follow_up','owner','action_due','this_year','skip_reason']);
const statuses = new Set(['READY','RECONCILE','DATE ONLY','HOLD','OPEN']);
const years = new Set(['IN PLAY','SKIP THIS YEAR']);
const payFields = new Set(['posted_amount','posted_date','clearing','payment_owner','notes']);
const clears = new Set(['UNVERIFIED','PENDING','CLEARED']);
const publicShowColumns = [
  'mfc_id','event','restart_wave','decision','show_status','historical_direct_setup','max_booking_cost',
  'event_start','event_end','follow_up','owner','action_due','payment_due_text','booking_status','confirmation',
  'performance','payment_terms','next_payment','next_payment_due','source_text','cap_treatment','control_check',
  'yearly_status','this_year','skip_reason','source_sheet_row','source_sheet_url','updated_at','source_detail',
  'source_detail_checked_at',
].join(',');

function derive(old: any, u: any) {
  const amt = Number(old.amount || 0);
  const raw = u.posted_amount ?? old.posted_amount;
  const posted = raw === null || raw === '' || raw === undefined ? 0 : Number(raw);
  const date = u.posted_date ?? old.posted_date ?? null;
  const clear = u.clearing ?? old.clearing ?? null;
  if (!Number.isFinite(posted) || posted < 0 || posted > amt) throw Error('Posted amount must be between $0 and the contract amount.');
  if (posted > 0 && !date) throw Error('Posted date is required when a payment amount is entered.');
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(String(date))) throw Error('Posted date must be YYYY-MM-DD.');
  if (clear && !clears.has(String(clear))) throw Error('Invalid clearing state.');
  if (clear === 'CLEARED' && posted <= 0) throw Error('A cleared payment requires a posted amount.');
  const bal = Math.max(0, Math.round((amt - posted) * 100) / 100);
  const n = dd(old.due);
  let due = 'SCHEDULED';
  if (bal <= 0 && clear === 'CLEARED') due = 'PAID';
  else if (n !== null && n < 0) due = 'OVERDUE';
  else if (n === 0) due = 'DUE TODAY';
  else if (n !== null && n <= 7) due = 'DUE ≤7 DAYS';
  let status = 'SCHEDULED', approval = 'SCHEDULED — CONTROLS PASS';
  if (posted > 0 && bal > 0) { status = 'PARTIAL'; approval = clear === 'CLEARED' ? 'PARTIAL — BALANCE DUE' : 'PARTIAL — VERIFY CLEARING'; }
  else if (posted >= amt && amt > 0) {
    if (clear === 'CLEARED') { status = 'PAID'; approval = 'PAID — CLEARED'; }
    else { status = 'HOLD / REVIEW'; approval = 'HOLD — VERIFY CLEARING'; }
  } else if (n !== null && n <= 7) { status = 'HOLD / REVIEW'; approval = 'HOLD — VERIFY PRIOR PAYMENT'; }
  return { posted_amount: posted || null, posted_date: posted > 0 ? date : null, clearing: clear, balance: bal, due_status: due, status, approval };
}

Deno.serve(async r => {
  if (r.method === 'OPTIONS') return new Response('ok', { headers: cors(r) });
  if (r.method === 'GET') {
    const [a,b,c,d,rec,sync,review,recovery] = await Promise.all([
      db.from('shows_app_shows').select('mfc_id',{count:'exact',head:true}),
      db.from('shows_app_payments').select('payment_id',{count:'exact',head:true}),
      db.from('shows_app_audit').select('id',{count:'exact',head:true}),
      db.from('shows_app_payment_audit').select('id',{count:'exact',head:true}),
      db.from('shows_app_reconciliation_current').select('reconciliation_status,app_change_count'),
      db.from('shows_app_sync_runs').select('id,source_as_of,captured_at,status,summary').order('captured_at',{ascending:false}).limit(1),
      db.from('shows_app_source_review_current').select('mfc_id,field_name,baseline_value,source_value,app_value'),
      db.from('shows_app_checkpoint_health_current').select('integrity_status,hashes_valid,row_counts_valid,coverage_current').limit(1),
    ]);
    const rows = rec.data || [];
    return out(r,{ok:!a.error&&!b.error&&!c.error&&!d.error&&!rec.error&&!sync.error&&!review.error&&!recovery.error,service:'paradise-shows',version:17,shows:a.count,payments:b.count,auditChanges:(c.count||0)+(d.count||0),sourceAligned:rows.filter(x=>x.reconciliation_status==='ALIGNED').length,sourceDrift:rows.filter(x=>x.reconciliation_status!=='ALIGNED').length,refreshStatus:sync.data?.[0]?.status||null,sourceConflicts:(review.data||[]).length,recoveryStatus:recovery.data?.[0]?.integrity_status||null,recoveryCoverageCurrent:recovery.data?.[0]?.coverage_current??null});
  }
  if (r.method !== 'POST') return out(r,{ok:false,error:'POST required'},405);
  let body:any; try { body = await r.json(); } catch { return out(r,{ok:false,error:'Invalid JSON'},400); }
  const action = String(body.action || '');

  if(action==='login'){
    const accessCode=String(body.accessCode||'').trim();
    if(!accessCode||accessCode.length>128)return out(r,{ok:false,error:'Access code required'},400);
    const now=new Date(),nowIso=now.toISOString();
    const clientHash=await loginClientHash(r);
    const attempt=await db.from('shows_app_login_attempts').select('client_hash,window_started_at,failed_count,blocked_until').eq('client_hash',clientHash).maybeSingle();
    if(attempt.error)return out(r,{ok:false,error:'Write authentication unavailable'},500);
    const existing=attempt.data||null;
    if(existing?.blocked_until&&Date.parse(existing.blocked_until)>now.getTime())return out(r,{ok:false,error:'Too many failed attempts. Try again later.'},429);
    const setting=await db.from('shows_app_settings').select('value').eq('key','access_code_sha256').maybeSingle();
    if(setting.error||!setting.data?.value)return out(r,{ok:false,error:'Write authentication unavailable'},500);
    const candidate=await sha256Hex(accessCode);
    if(!constantTimeEqual(candidate,String(setting.data.value))){
      const inWindow=!!existing&&Date.parse(existing.window_started_at)>now.getTime()-LOGIN_WINDOW_MS;
      const failed=(inWindow?Number(existing.failed_count||0):0)+1;
      const blockedUntil=failed>=LOGIN_MAX_FAILURES?new Date(now.getTime()+LOGIN_BLOCK_MS).toISOString():null;
      const row={client_hash:clientHash,window_started_at:inWindow?existing.window_started_at:nowIso,failed_count:failed,blocked_until:blockedUntil,updated_at:nowIso};
      const saved=await db.from('shows_app_login_attempts').upsert(row,{onConflict:'client_hash'});
      if(saved.error)return out(r,{ok:false,error:'Write authentication unavailable'},500);
      return out(r,{ok:false,error:blockedUntil?'Too many failed attempts. Try again later.':'Invalid access code'},blockedUntil?429:401);
    }
    await db.from('shows_app_login_attempts').delete().eq('client_hash',clientHash);
    await db.from('shows_app_sessions').delete().lt('expires_at',nowIso);
    const token=randomSessionToken(),tokenHash=await sha256Hex(token);
    const expiresAt=new Date(now.getTime()+WRITE_SESSION_HOURS*60*60*1000).toISOString();
    const created=await db.from('shows_app_sessions').insert({token_hash:tokenHash,expires_at:expiresAt}).select('id,expires_at').single();
    if(created.error)return out(r,{ok:false,error:'Unable to start write session'},500);
    return out(r,{ok:true,token,expires_at:created.data.expires_at});
  }

  if(action==='authStatus'){
    const session=await activeWriteSession(r);
    return out(r,{ok:true,authorized:!!session,expires_at:session?.expires_at||null});
  }

  if(action==='logout'){
    const session=await activeWriteSession(r);
    if(session)await db.from('shows_app_sessions').delete().eq('id',session.id);
    return out(r,{ok:true});
  }

  let writeSession:any=null;
  if(new Set(['resolveConflict','updateShow','updatePayment']).has(action)){
    writeSession=await activeWriteSession(r);
    if(!writeSession)return out(r,{ok:false,error:'Edit access required'},401);
  }

  if(action==='bootstrap'){
    const [a,b,c,d,e,f,g,h,i,j,k]=await Promise.all([
      db.from('shows_app_shows').select(publicShowColumns).order('action_due',{ascending:true,nullsFirst:false}).order('event_start',{ascending:true,nullsFirst:false}),
      db.from('shows_app_payments').select('*').order('due',{ascending:true}),
      db.from('shows_app_settings').select('key,value').in('key',['monthly_cap','snapshot_as_of','source_sheet_url','last_source_refresh_at','last_source_refresh_status','last_source_refresh_summary']),
      db.from('shows_app_audit').select('id,mfc_id,field_name,old_value,new_value,changed_at,change_origin').order('changed_at',{ascending:false}).limit(20),
      db.from('shows_app_payment_audit').select('id,payment_id,field_name,old_value,new_value,changed_at').order('changed_at',{ascending:false}).limit(20),
      db.from('shows_app_reconciliation_current').select('mfc_id,event,source_sheet_row,source_as_of,source_captured_at,app_change_count,reconciliation_status,differences').order('app_change_count',{ascending:false}).order('event',{ascending:true}),
      db.from('shows_app_sync_runs').select('id,source_as_of,captured_at,status,summary,notes').order('captured_at',{ascending:false}).limit(1),
      db.from('shows_app_source_review_current').select('run_id,source_as_of,captured_at,status,summary,mfc_id,field_name,baseline_value,source_value,app_value,conflict_id,resolution,resolved_at').order('mfc_id',{ascending:true}).order('field_name',{ascending:true}),
      db.from('shows_app_checkpoint_health_current').select('created_at,reason,shows_count,payments_count,checkpoint_show_rows,checkpoint_payment_rows,row_counts_valid,hashes_valid,coverage_current,current_shows,current_payments,checkpoint_count,restore_count,integrity_status').limit(1),
      db.from('shows_app_rebook_opportunities').select('profile_id,event_label,event_start,event_end,venue_text,booking_cost_min,booking_cost_max,booking_cost_unit,current_cost_status,critical_deadline_date,critical_deadline_label,action_label,action_url,contact_name,contact_email,contact_phone').eq('active',true).eq('identity_status','VERIFIED'),
      db.from('shows_app_rebook_reviews').select('profile_id,disposition,booking_readiness,resolution_lane,action_timing,blockers_text,next_step').eq('active',true).eq('identity_status','VERIFIED'),
    ]);
    if(a.error||b.error||c.error||d.error||e.error||f.error||g.error||h.error||i.error||j.error||k.error){
      const failed_sources=[
        ['shows',a.error],['payments',b.error],['settings',c.error],['show_audit',d.error],['payment_audit',e.error],
        ['reconciliation',f.error],['sync_runs',g.error],['source_review',h.error],['checkpoint_health',i.error],
        ['rebook_opportunities',j.error],['rebook_reviews',k.error],
      ].filter(([,error])=>Boolean(error)).map(([source,error]:any)=>({source,code:error?.code||null}));
      return out(r,{ok:false,error:'Unable to load operating data',failed_sources},500);
    }
    const settings=Object.fromEntries((c.data||[]).map(x=>[x.key,x.value]));
    const activity=[...(d.data||[]).map(x=>({...x,kind:'show'})),...(e.data||[]).map(x=>({...x,kind:'payment'}))].sort((x,y)=>String(y.changed_at).localeCompare(String(x.changed_at))).slice(0,20);
    const rows=f.data||[];
    const reconciliation={summary:{rows:rows.length,aligned:rows.filter(x=>x.reconciliation_status==='ALIGNED').length,changed:rows.filter(x=>x.reconciliation_status!=='ALIGNED').length,changed_fields:rows.reduce((n,x)=>n+Number(x.app_change_count||0),0),source_as_of:rows[0]?.source_as_of||settings.snapshot_as_of||null,source_captured_at:rows[0]?.source_captured_at||null},rows};
    const sourceRefresh={latest:g.data?.[0]||null,conflicts:h.data||[]};
    const recoveryHealth=i.data?.[0]||null;
    const rebookReviewByProfile=new Map((k.data||[]).map((row:any)=>[row.profile_id,row]));
    const liveResolutionCounts=(k.data||[]).reduce((acc:any,row:any)=>{
      const lane=String(row.resolution_lane||'').trim().toUpperCase();
      if(lane)acc[lane]=(acc[lane]||0)+1;
      return acc;
    },{});
    const liveBookingActions=(j.data||[])
      .filter((row:any)=>String(rebookReviewByProfile.get(row.profile_id)?.resolution_lane||'').toUpperCase()==='PARADISE_ACTION')
      .map((row:any)=>({...row,review:rebookReviewByProfile.get(row.profile_id)}))
      .sort((x:any,y:any)=>String(x.critical_deadline_date||x.event_start||'9999-12-31').localeCompare(String(y.critical_deadline_date||y.event_start||'9999-12-31'))||String(x.event_label||'').localeCompare(String(y.event_label||'')));
    return out(r,{ok:true,version:17,shows:a.data||[],payments:b.data||[],settings,activity,reconciliation,sourceRefresh,recoveryHealth,liveBookingActions,liveResolutionCounts});
  }

  if(action==='annualPlan'){
    const year=Number(body.year||2027);
    if(!Number.isInteger(year)||year<2026||year>2035)return out(r,{ok:false,error:'Valid annual plan year required'},400);
    const latest=await db.from('shows_app_annual_plan_runs')
      .select('id,plan_year,status,created_at,source_scope,notes,row_count')
      .eq('plan_year',year).eq('status','READY')
      .order('created_at',{ascending:false}).limit(1);
    if(latest.error)return out(r,{ok:false,error:'Unable to load annual plan'},500);
    const run=latest.data?.[0]||null;
    if(!run)return out(r,{ok:true,version:1,year,run:null,summary:{rows:0,profiles:0,pursue:0,watch:0,research:0,exact:0,expected:0,conflicts:0},rows:[]});
    const plan=await db.from('shows_app_annual_plan')
      .select('plan_id,plan_year,profile_id,canonical_event,occurrence_label,coverage_class,plan_decision,priority,publication_status,date_confidence,event_start,event_end,expected_month,expected_window_text,action_start,action_due,action_window_text,cost_status,budget_min,budget_max,budget_basis,placement_reference,historical_signal,next_action,source_basis,source_refs,mfc_ids,schedule_type,conflict_notes')
      .eq('run_id',run.id)
      .order('event_start',{ascending:true,nullsFirst:false})
      .order('expected_month',{ascending:true,nullsFirst:false})
      .order('priority',{ascending:true})
      .order('canonical_event',{ascending:true});
    if(plan.error)return out(r,{ok:false,error:'Unable to load annual plan'},500);
    const rows=plan.data||[];
    const summary={
      rows:rows.length,
      profiles:new Set(rows.map((x:any)=>x.profile_id)).size,
      pursue:rows.filter((x:any)=>x.plan_decision==='PURSUE').length,
      watch:rows.filter((x:any)=>x.plan_decision==='WATCH').length,
      research:rows.filter((x:any)=>x.plan_decision==='RESEARCH_IDENTITY').length,
      exact:rows.filter((x:any)=>!!x.event_start).length,
      expected:rows.filter((x:any)=>!x.event_start&&!!x.expected_month).length,
      conflicts:rows.filter((x:any)=>!!String(x.conflict_notes||'').trim()).length,
    };
    return out(r,{ok:true,version:1,year,run,summary,rows});
  }

  if(action==='catalogUnlinked'){
    const latest=await db.from('shows_app_catalog_runs').select('id,captured_at,status,profile_count,occurrence_count,source_summary').eq('status','READY').order('captured_at',{ascending:false}).limit(1);
    if(latest.error)return out(r,{ok:false,error:'Unable to load unlinked LeadPerfection evidence'},500);
    const run=latest.data?.[0]||null;
    if(!run)return out(r,{ok:true,version:22,summary:{annual_rows:0,cumulative_rows:0,no_profile_identity_asserted:true,attendance_inference:false},annual:[],cumulative:[]});
    const [annual,cumulative]=await Promise.all([
      fetchAllRows(
        'shows_app_performance_evidence',
        'evidence_id,source_year,source_label,match_status,issued,opportunities,demos,close_sales_count,close_sales_volume,verification_status,source_fields',
        q=>q.eq('run_id',run.id).is('profile_id',null),
        'evidence_id'
      ),
      fetchAllRows(
        'shows_app_cumulative_performance_evidence',
        'evidence_id,source_year,source_label,match_status,annual_evidence_id,comparison_status,raw_count,set_count,issue_count,demo_count,gross_close_count,gross_close_volume,net_close_count,net_close_volume,source_report_url,verification_status,source_fields',
        q=>q.eq('run_id',run.id).is('profile_id',null),
        'evidence_id'
      ),
    ]);
    if(annual.error||cumulative.error)return out(r,{ok:false,error:'Unable to load unlinked LeadPerfection evidence'},500);
    const annualRows=(annual.data||[]).sort((a:any,b:any)=>Number(b.source_year||0)-Number(a.source_year||0)||String(a.evidence_id||'').localeCompare(String(b.evidence_id||'')));
    const cumulativeRows=(cumulative.data||[]).sort((a:any,b:any)=>Number(b.source_year||0)-Number(a.source_year||0)||String(a.evidence_id||'').localeCompare(String(b.evidence_id||'')));
    const residual=run.source_summary?.lp_residual_profile_match_exhaustion||{};
    const categorySets={
      ADMINISTRATIVE_AGGREGATE:new Set(residual.administrative_or_aggregate_ids||[]),
      GENERIC_LOCATIONLESS:new Set(residual.generic_or_locationless_ids||[]),
      COMPETING_IDENTITY:new Set(residual.competing_profile_ambiguity_ids||[]),
      INSUFFICIENT_IDENTITY:new Set(residual.distinctive_but_insufficient_identity_ids||[]),
    };
    const reasons={
      ADMINISTRATIVE_AGGREGATE:'Administrative or aggregate LeadPerfection bucket; not a defensible show identity.',
      GENERIC_LOCATIONLESS:'Generic or locationless source label; multiple real-world events could fit.',
      COMPETING_IDENTITY:'More than one governed show profile remains plausible; no profile is forced.',
      INSUFFICIENT_IDENTITY:'Distinctive source label, but available evidence is still insufficient to establish a governed identity.',
      CUMULATIVE_ONLY_UNMATCHED:'Cumulative-only LeadPerfection source with no defensible annual/profile identity.',
      UNRESOLVED_OTHER:'Unresolved source preserved without manufacturing a show identity.',
    };
    const categoryFor=(annualEvidenceId:string|null|undefined)=>{
      if(!annualEvidenceId)return 'CUMULATIVE_ONLY_UNMATCHED';
      for(const [category,ids] of Object.entries(categorySets))if((ids as Set<string>).has(annualEvidenceId))return category;
      return 'UNRESOLVED_OTHER';
    };
    const annualOut=annualRows.map(row=>{
      const resolution_category=categoryFor(row.evidence_id);
      return {...row,resolution_category,resolution_reason:reasons[resolution_category as keyof typeof reasons]};
    });
    const cumulativeOut=cumulativeRows.map(row=>{
      const resolution_category=categoryFor(row.annual_evidence_id);
      return {...row,resolution_category,resolution_reason:reasons[resolution_category as keyof typeof reasons]};
    });
    const logicalCategories=[...annualOut.map(x=>x.resolution_category),...cumulativeOut.filter(x=>!x.annual_evidence_id).map(x=>x.resolution_category)];
    const category_counts=logicalCategories.reduce((acc:any,category:string)=>{acc[category]=(acc[category]||0)+1;return acc},{});
    return out(r,{ok:true,version:24,run:{id:run.id,captured_at:run.captured_at,profile_count:run.profile_count,occurrence_count:run.occurrence_count},summary:{annual_rows:annualOut.length,cumulative_rows:cumulativeOut.length,source_groups:logicalCategories.length,category_counts,no_profile_identity_asserted:true,attendance_inference:false},annual:annualOut,cumulative:cumulativeOut});
  }

  if(action==='catalog'){
    const latest=await db.from('shows_app_catalog_runs').select('id,captured_at,status,profile_count,occurrence_count,source_summary').eq('status','READY').order('captured_at',{ascending:false}).limit(1);
    if(latest.error)return out(r,{ok:false,error:'Unable to load show catalog'},500);
    const run=latest.data?.[0]||null;
    if(!run)return out(r,{ok:true,version:20,summary:null,profiles:[]});
    const profiles=await fetchAllRows(
      'shows_app_catalog',
      'profile_id,canonical_event,source_type,tier_rank,tier,occurrences,history_count,issued,lifetime_net_sales,lifetime_net_volume,lifetime_close_sales,lifetime_close_volume,net_sales_2024,net_volume_2024,close_sales_2024,close_volume_2024,net_sales_2025,net_volume_2025,close_sales_2025,close_volume_2025,aliases,matched_mfc_ids,source_rows,dnd_count,payment_tracker_count',
      q=>q.eq('run_id',run.id),
      'profile_id'
    );
    const [historyRows,performanceRows,cumulativeRows,rebookOpportunities,rebookReviews,profileRelations]=await Promise.all([
      fetchAllRows(
        'shows_app_history_occurrences',
        'history_id,profile_id,source_year,source_row,dates_text,contact,booth,city,address,event_cost_text,final_cost_text,com_percent,issued_appts,demos,net_sales_count,net_revenue,gross_sales_count,gross_sales_value,nsli,coi,payment_status_text,application_status_text,participation_status,performance_match_status,source_kind,source_workbook,event,notes,source_fields',
        q=>q.eq('run_id',run.id),
        'history_id'
      ),
      fetchAllRows(
        'shows_app_performance_evidence',
        'evidence_id,profile_id,source_year,source_label,match_status,matched_history_ids,metrics_scope,verification_status,issued,opportunities,demos,close_sales_count,close_sales_volume',
        q=>q.eq('run_id',run.id).not('profile_id','is',null),
        'evidence_id'
      ),
      fetchAllRows(
        'shows_app_cumulative_performance_evidence',
        'evidence_id,profile_id,source_year,comparison_status',
        q=>q.eq('run_id',run.id).not('profile_id','is',null),
        'evidence_id'
      ),
      db.from('shows_app_rebook_opportunities')
        .select('opportunity_id,profile_id,event_label,event_start,event_end,opportunity_status,venue_text,current_placement_text,current_placement_status,current_schedule_text,current_schedule_status,current_schedule_source_url,current_schedule_source_label,current_schedule_checked_at,current_logistics_text,current_logistics_status,current_logistics_source_url,current_logistics_source_label,current_logistics_checked_at,price_text,prior_cost_text,booking_cost_min,booking_cost_max,booking_cost_unit,booking_cost_basis,current_cost_status,current_commitment_status,commitment_terms_text,critical_deadline_date,critical_deadline_type,critical_deadline_label,critical_deadline_basis,action_label,action_url,booking_window_text,contact_text,contact_name,contact_email,contact_phone,source_url,source_label,identity_status,checked_at,notes')
        .eq('active',true)
        .eq('identity_status','VERIFIED')
        .order('event_start',{ascending:true,nullsFirst:false}),
      db.from('shows_app_rebook_reviews')
        .select('review_id,profile_id,disposition,booking_readiness,resolution_lane,outreach_contact_name,outreach_contact_phone,outreach_contact_email,outreach_contact_source_url,outreach_contact_source_label,outreach_contact_checked_at,outreach_cycle_status,outreach_cycle_text,outreach_cycle_source_url,outreach_cycle_source_label,outreach_cycle_checked_at,rationale,next_step,action_timing,blockers_text,evidence_date,source_label,source_ref,source_url,identity_status,checked_at,notes')
        .eq('active',true)
        .eq('identity_status','VERIFIED'),
      db.from('shows_app_profile_relations')
        .select('relation_id,profile_id,related_profile_id,canonical_series_profile_id,relation_type,identity_status,evidence_summary,source_refs,checked_at')
        .eq('active',true)
        .eq('identity_status','VERIFIED'),
    ]);
    if(profiles.error||historyRows.error||performanceRows.error||cumulativeRows.error||rebookOpportunities.error||rebookReviews.error||profileRelations.error)return out(r,{ok:false,error:'Unable to load show catalog'},500);
    const rebookByProfile=new Map<string,any>();
    for(const opportunity of rebookOpportunities.data||[]){
      if(!rebookByProfile.has(opportunity.profile_id))rebookByProfile.set(opportunity.profile_id,opportunity);
    }
    const reviewByProfile=new Map<string,any>();
    for(const review of rebookReviews.data||[]){
      reviewByProfile.set(review.profile_id,review);
    }
    const relationsByProfile=new Map<string,any[]>();
    const canonicalSeriesForProfile=new Map<string,string>();
    for(const relation of profileRelations.data||[]){
      for(const id of [relation.profile_id,relation.related_profile_id]){
        if(!relationsByProfile.has(id))relationsByProfile.set(id,[]);
        relationsByProfile.get(id)!.push(relation);
        if(id!==relation.canonical_series_profile_id)canonicalSeriesForProfile.set(id,relation.canonical_series_profile_id);
      }
    }

    const coverage=new Map<string,any>();
    const ensure=(profileId:string)=>{
      if(!coverage.has(profileId))coverage.set(profileId,{
        years:new Set<number>(),contacts:new Set<string>(),booths:new Set<string>(),cities:new Set<string>(),
        has_cost:false,has_com:false,has_performance:false,has_payment:false,has_application:false,has_lp_performance:false,has_cumulative_lp_performance:false,has_coi:false,has_coi_status:false,
        lp_years:new Set<number>(),cumulative_years:new Set<number>(),com_values:[] as number[],booth_rows:[] as any[],outcome_rows:[] as any[],context_rows:[] as any[],lp_placement_rows:[] as any[],lp_placement_type_rows:[] as any[],worked_years:new Set<number>(),search_terms:new Set<string>(),year_fields:new Map<number,any>(),year_field_families:new Map<number,Map<string,Set<string>>>(),
      });
      return coverage.get(profileId);
    };

    const familyStats=new Map<string,any>();
    for(const row of historyRows.data||[]){
      const year=Number(row.source_year);
      if(!Number.isFinite(year))continue;
      const values=historyFieldStateValues(row);
      for(const field of CLEANUP_FIELD_KEYS){
        const key=cleanupFieldFamilyKey(row,field);
        if(!key)continue;
        if(!familyStats.has(key))familyStats.set(key,{total:0,coded:0});
        const stats=familyStats.get(key);stats.total++;
        if(sourceSemanticState((values as any)[field])!=='MISSING')stats.coded++;
      }
    }

    for(const row of historyRows.data||[]){
      const item=ensure(row.profile_id);
      const year=Number(row.source_year);
      const contact=historyContactValue(row);
      const booth=historyBoothValue(row);
      if(sourceSemanticState(booth)==='VALUE'){
        item.booth_rows.push({
          booth,
          source_year:row.source_year,
          source_row:row.source_row,
          dates_text:row.dates_text,
          net_revenue:row.net_revenue,
          net_sales_count:row.net_sales_count,
          com_percent:row.com_percent,
          issued_appts:row.issued_appts,
          demos:row.demos,
        });
      }
      const cost=historyCostValue(row);
      const costState=historyCostStateValue(row);
      item.context_rows.push({
        source_year:row.source_year,
        source_row:row.source_row,
        dates_text:String(row.dates_text||'').trim(),
        contact:sourceSemanticState(contact)==='VALUE'?contact:'',
        cost:knownCostValue(cost)?cost:'',
        city:String(row.city||'').trim(),
        address:String(row.address||'').trim(),
      });
      const comText=historyComValue(row);
      const city=String(row.city||'').trim();
      const performancePresent=[
        row.issued_appts,row.demos,row.net_sales_count,row.net_revenue,row.gross_sales_count,row.gross_sales_value,row.nsli,
      ].some(value=>value!==null&&value!==undefined&&String(value)!=='');
      const performanceState=historyPerformanceStateValue(row,performancePresent);
      const comState=historyComStateValue(row,performanceState);
      const payment=String(row.payment_status_text||'').trim();
      const application=String(row.application_status_text||'').trim();
      const participationText=String(row.participation_status||'').trim();
      if(performancePresent){
        item.outcome_rows.push({
          source_year:row.source_year,
          source_row:row.source_row,
          dates_text:String(row.dates_text||'').trim(),
          booth:sourceSemanticState(booth)==='VALUE'?booth:'',
          net_revenue:row.net_revenue,
          net_sales_count:row.net_sales_count,
          com_percent:row.com_percent,
          issued_appts:row.issued_appts,
          demos:row.demos,
          participation_status:participationText,
          performance_match_status:String(row.performance_match_status||'').trim(),
        });
      }
      const worked=/^(WORKED|ATTENDED)/i.test(participationText);
      const explicitNonparticipation=String(row.source_kind||'')==='DND_OPPORTUNITY'||/(DID NOT|CANCEL|NOT PARTICIPAT)/i.test(participationText);
      if(Number.isFinite(year)){
        item.years.add(year);
        if(!item.year_fields.has(year))item.year_fields.set(year,newYearFieldBucket());
        if(!item.year_field_families.has(year))item.year_field_families.set(year,new Map<string,Set<string>>());
        const fieldFamilies=item.year_field_families.get(year);
        for(const field of CLEANUP_FIELD_KEYS){
          const familyKey=cleanupFieldFamilyKey(row,field);
          if(!familyKey)continue;
          if(!fieldFamilies.has(field))fieldFamilies.set(field,new Set<string>());
          fieldFamilies.get(field).add(familyKey);
        }
        const y=item.year_fields.get(year);y.records++;
        bumpState(y,'contact',contact);bumpState(y,'booth',booth);bumpState(y,'cost',costState);bumpState(y,'com',comState);
        bumpState(y,'performance',performanceState);bumpState(y,'payment',payment);bumpState(y,'application',application);bumpState(y,'coi',row.coi);
        if(coiAffirmative(row.coi))y.coi_affirmative++;
        else if(coiStatusKnown(row.coi))y.coi_known_nonaffirmative++;
        y.worked[worked?'HAS':'MISSING']++;
        y.nonparticipation[explicitNonparticipation?'HAS':'MISSING']++;
      }
      if(meaningfulSourceValue(contact))item.contacts.add(contact);
      if(meaningfulSourceValue(booth))item.booths.add(booth);
      if(meaningfulSourceValue(city))item.cities.add(city);
      item.has_cost=item.has_cost||knownCostValue(cost);
      const comNumber=(row.com_percent!==null&&row.com_percent!==undefined&&String(row.com_percent).trim()!=='')?Number(row.com_percent):NaN;
      if(Number.isFinite(comNumber)){
        item.has_com=true;item.com_values.push(comNumber);
        if(Number.isFinite(year))item.year_fields.get(year).com_values.push(comNumber);
      }else if(sourceSemanticState(comText)==='VALUE'){
        const parsed=Number(String(comText).replace('%','').trim());
        if(Number.isFinite(parsed)){
          item.has_com=true;item.com_values.push(parsed);
          if(Number.isFinite(year))item.year_fields.get(year).com_values.push(parsed);
        }
      }
      item.has_performance=item.has_performance||sourceSemanticState(performanceState)==='VALUE';
      item.has_payment=item.has_payment||sourceSemanticState(payment)==='VALUE';
      item.has_application=item.has_application||sourceSemanticState(application)==='VALUE';
      item.has_coi=item.has_coi||coiAffirmative(row.coi);
      item.has_coi_status=item.has_coi_status||coiStatusKnown(row.coi);
      if(Number.isFinite(year)&&worked)item.worked_years.add(year);
      for(const value of [contact,booth,city,row.address,row.event,row.notes,payment,application]){
        const text=String(value||'').trim();
        if(meaningfulSourceValue(text))item.search_terms.add(text.slice(0,240));
      }
    }

    const historyById=new Map<string,any>();
    for(const historyRow of historyRows.data||[])historyById.set(String(historyRow.history_id||''),historyRow);

    for(const row of performanceRows.data||[]){
      const item=ensure(row.profile_id);
      const year=Number(row.source_year);
      if(Number.isFinite(year))item.lp_years.add(year);
      item.has_lp_performance=true;
      const matchedIds=Array.isArray(row.matched_history_ids)?row.matched_history_ids:[];
      if(String(row.match_status||'')==='OCCURRENCE_MATCH'&&matchedIds.length===1){
        const historyId=String(matchedIds[0]||'');
        const historyRow=historyById.get(historyId);
        if(historyRow&&String(historyRow.profile_id||'')===String(row.profile_id||'')){
          const booth=historyBoothValue(historyRow).replace(/\s+/g,' ').trim();
          const placementEvidence={
            booth,
            source_year:row.source_year,
            dates_text:String(historyRow.dates_text||'').trim(),
            history_id:historyId,
            participation_status:String(historyRow.participation_status||'').trim(),
            source_label:String(row.source_label||'').trim(),
            metrics_scope:String(row.metrics_scope||'').trim(),
            verification_status:String(row.verification_status||'').trim(),
            issued:row.issued,
            demos:row.demos,
            close_sales_count:row.close_sales_count,
            close_sales_volume:row.close_sales_volume,
          };
          if(specificLpAttributedPlacementValue(booth)){
            item.lp_placement_rows.push(placementEvidence);
          }else if(informativeLpAttributedPlacementTypeValue(booth)){
            item.lp_placement_type_rows.push(placementEvidence);
          }
        }
      }
    }

    for(const row of cumulativeRows.data||[]){
      if(!row.profile_id)continue;
      const item=ensure(row.profile_id);
      const year=Number(row.source_year);
      if(Number.isFinite(year))item.cumulative_years.add(year);
      item.has_cumulative_lp_performance=true;
    }

    const enriched=(profiles.data||[]).map(p=>{
      const item=ensure(p.profile_id);
      const years=[...item.years].sort((a:number,b:number)=>b-a);
      const lpYears=[...item.lp_years].sort((a:number,b:number)=>b-a);
      const comValues=(item.com_values as number[]).filter(Number.isFinite);
      const completeness=[
        item.contacts.size>0,item.booths.size>0,item.has_cost,item.has_com,item.has_performance,item.has_lp_performance,item.has_coi_status,
      ].filter(Boolean).length;
      const boothRows=(item.booth_rows||[]).slice().sort((a:any,b:any)=>Number(b.source_year||0)-Number(a.source_year||0)||Number(b.source_row||0)-Number(a.source_row||0));
      const latestBooth=boothRows[0]||null;
      const outcomeRows=(item.outcome_rows||[]).slice().sort((a:any,b:any)=>Number(b.source_year||0)-Number(a.source_year||0)||Number(b.source_row||0)-Number(a.source_row||0));
      const latestOutcome=outcomeRows[0]||null;
      const rankedOutcomes=outcomeRows.slice().sort((a:any,b:any)=>{
        const netA=a.net_revenue===null||a.net_revenue===undefined?-1:Number(a.net_revenue);
        const netB=b.net_revenue===null||b.net_revenue===undefined?-1:Number(b.net_revenue);
        if(netA!==netB)return netB-netA;
        const salesA=a.net_sales_count===null||a.net_sales_count===undefined?-1:Number(a.net_sales_count);
        const salesB=b.net_sales_count===null||b.net_sales_count===undefined?-1:Number(b.net_sales_count);
        if(salesA!==salesB)return salesB-salesA;
        const issuedA=a.issued_appts===null||a.issued_appts===undefined?-1:Number(a.issued_appts);
        const issuedB=b.issued_appts===null||b.issued_appts===undefined?-1:Number(b.issued_appts);
        if(issuedA!==issuedB)return issuedB-issuedA;
        const demosA=a.demos===null||a.demos===undefined?-1:Number(a.demos);
        const demosB=b.demos===null||b.demos===undefined?-1:Number(b.demos);
        if(demosA!==demosB)return demosB-demosA;
        const comA=a.com_percent===null||a.com_percent===undefined?Infinity:Number(a.com_percent);
        const comB=b.com_percent===null||b.com_percent===undefined?Infinity:Number(b.com_percent);
        if(comA!==comB)return comA-comB;
        return Number(b.source_year||0)-Number(a.source_year||0)||Number(b.source_row||0)-Number(a.source_row||0);
      });
      const bestOutcome=rankedOutcomes[0]||null;
      const outcomeBooths=boothRows.filter((row:any)=>[
        row.issued_appts,row.demos,row.net_sales_count,row.net_revenue,
      ].some((value:any)=>value!==null&&value!==undefined&&String(value).trim()!=='')).sort((a:any,b:any)=>{
        const netA=a.net_revenue===null||a.net_revenue===undefined?-1:Number(a.net_revenue);
        const netB=b.net_revenue===null||b.net_revenue===undefined?-1:Number(b.net_revenue);
        if(netA!==netB)return netB-netA;
        const salesA=a.net_sales_count===null||a.net_sales_count===undefined?-1:Number(a.net_sales_count);
        const salesB=b.net_sales_count===null||b.net_sales_count===undefined?-1:Number(b.net_sales_count);
        if(salesA!==salesB)return salesB-salesA;
        const comA=a.com_percent===null||a.com_percent===undefined?Infinity:Number(a.com_percent);
        const comB=b.com_percent===null||b.com_percent===undefined?Infinity:Number(b.com_percent);
        if(comA!==comB)return comA-comB;
        const issuedA=a.issued_appts===null||a.issued_appts===undefined?-1:Number(a.issued_appts);
        const issuedB=b.issued_appts===null||b.issued_appts===undefined?-1:Number(b.issued_appts);
        if(issuedA!==issuedB)return issuedB-issuedA;
        return Number(b.source_year||0)-Number(a.source_year||0);
      });
      const bestBooth=outcomeBooths[0]||null;
      const contextRows=(item.context_rows||[]).slice().sort((a:any,b:any)=>Number(b.source_year||0)-Number(a.source_year||0)||Number(b.source_row||0)-Number(a.source_row||0));
      const latestDates=contextRows.find((row:any)=>knownDateText(row.dates_text))||null;
      const latestContact=contextRows.find((row:any)=>meaningfulSourceValue(row.contact))||null;
      const latestCost=contextRows.find((row:any)=>knownCostValue(row.cost))||null;
      const latestLocation=contextRows.find((row:any)=>meaningfulSourceValue(row.address)||meaningfulSourceValue(row.city))||null;
      const bestSpecificBooth=outcomeBooths.find((row:any)=>{
        const text=String(row?.booth||'').trim();
        return !!text&&!/(^N\/A$|^UNKNOWN|NUMBER NOT STATED|ASSIGNED (AT|ON)SITE|ASSIGNED AT SETUP|WOULD FOLLOW|NOT RECOVERED|UNVERIFIED|EXACT.{0,120}(NOT STATED|UNKNOWN|TBD|TO BE ASSIGNED)|SPACE ASSIGNED AT.{0,120}CHECK-IN|ASSIGNMENT (ISSUED|ASSIGNED) ONSITE)/i.test(text);
      })||null;
      const lpAttributedSpecificRows=(item.lp_placement_rows||[]).slice().sort((a:any,b:any)=>{
        const salesA=a.close_sales_count===null||a.close_sales_count===undefined?-1:Number(a.close_sales_count);
        const salesB=b.close_sales_count===null||b.close_sales_count===undefined?-1:Number(b.close_sales_count);
        if(salesA!==salesB)return salesB-salesA;
        const volumeA=a.close_sales_volume===null||a.close_sales_volume===undefined?-1:Number(a.close_sales_volume);
        const volumeB=b.close_sales_volume===null||b.close_sales_volume===undefined?-1:Number(b.close_sales_volume);
        if(volumeA!==volumeB)return volumeB-volumeA;
        const issuedA=a.issued===null||a.issued===undefined?-1:Number(a.issued);
        const issuedB=b.issued===null||b.issued===undefined?-1:Number(b.issued);
        if(issuedA!==issuedB)return issuedB-issuedA;
        const demosA=a.demos===null||a.demos===undefined?-1:Number(a.demos);
        const demosB=b.demos===null||b.demos===undefined?-1:Number(b.demos);
        if(demosA!==demosB)return demosB-demosA;
        return Number(b.source_year||0)-Number(a.source_year||0);
      });
      const bestLpAttributedSpecificBooth=lpAttributedSpecificRows[0]||null;
      const lpAttributedPlacementTypeRows=(item.lp_placement_type_rows||[]).slice().sort((a:any,b:any)=>{
        const salesA=a.close_sales_count===null||a.close_sales_count===undefined?-1:Number(a.close_sales_count);
        const salesB=b.close_sales_count===null||b.close_sales_count===undefined?-1:Number(b.close_sales_count);
        if(salesA!==salesB)return salesB-salesA;
        const volumeA=a.close_sales_volume===null||a.close_sales_volume===undefined?-1:Number(a.close_sales_volume);
        const volumeB=b.close_sales_volume===null||b.close_sales_volume===undefined?-1:Number(b.close_sales_volume);
        if(volumeA!==volumeB)return volumeB-volumeA;
        const issuedA=a.issued===null||a.issued===undefined?-1:Number(a.issued);
        const issuedB=b.issued===null||b.issued===undefined?-1:Number(b.issued);
        if(issuedA!==issuedB)return issuedB-issuedA;
        const demosA=a.demos===null||a.demos===undefined?-1:Number(a.demos);
        const demosB=b.demos===null||b.demos===undefined?-1:Number(b.demos);
        if(demosA!==demosB)return demosB-demosA;
        return Number(b.source_year||0)-Number(a.source_year||0);
      });
      const bestLpAttributedPlacementType=lpAttributedPlacementTypeRows[0]||null;
      const historyFieldTotals={
        contact:newStateCounts(),booth:newStateCounts(),cost:newStateCounts(),com:newStateCounts(),performance:newStateCounts(),
        payment:newStateCounts(),application:newStateCounts(),coi:newStateCounts(),
      };
      const yearFieldStates:any={};
      const historyFieldSupport:any={};
      const historyCoiSummary={affirmative:0,known_nonaffirmative:0};
      for(const [year,y] of item.year_fields.entries()){
        for(const key of Object.keys(historyFieldTotals))sumStateCounts(historyFieldTotals[key],y[key]);
        historyCoiSummary.affirmative+=Number(y.coi_affirmative||0);
        historyCoiSummary.known_nonaffirmative+=Number(y.coi_known_nonaffirmative||0);
        const coms=(y.com_values as number[]).filter(Number.isFinite);
        yearFieldStates[String(year)]={
          records:y.records,contact:y.contact,booth:y.booth,cost:y.cost,com:y.com,performance:y.performance,payment:y.payment,application:y.application,coi:y.coi,
          coi_affirmative:y.coi_affirmative,coi_known_nonaffirmative:y.coi_known_nonaffirmative,worked:y.worked,nonparticipation:y.nonparticipation,
          com_min:coms.length?Math.min(...coms):null,com_max:coms.length?Math.max(...coms):null,
        };
        const fieldFamilies=item.year_field_families.get(year)||new Map<string,Set<string>>();
        historyFieldSupport[String(year)]=CLEANUP_FIELD_KEYS.filter(field=>[...(fieldFamilies.get(field)||new Set<string>())].some(key=>{
          const stats=familyStats.get(key);
          return stats&&stats.total>0&&Number(stats.coded||0)/Number(stats.total)>=CLEANUP_FAMILY_MIN_CODED_RATIO;
        }));
      }
      return {
        ...p,
        history_years:years,
        history_year_count:years.length,
        latest_history_year:years[0]||null,
        worked_year_count:item.worked_years.size,
        has_contact:item.contacts.size>0,
        has_booth:item.booths.size>0,
        current_rebook_opportunity:rebookByProfile.get(p.profile_id)||null,
        current_rebook_review:reviewByProfile.get(p.profile_id)||null,
        profile_relations:relationsByProfile.get(p.profile_id)||[],
        canonical_series_profile_id:canonicalSeriesForProfile.get(p.profile_id)||p.profile_id,
        related_current_profile_id:(()=>{const canonical=canonicalSeriesForProfile.get(p.profile_id);return canonical&&canonical!==p.profile_id?canonical:null})(),
        latest_preserved_dates:latestDates?.dates_text||null,
        latest_preserved_dates_year:latestDates?Number(latestDates.source_year)||null:null,
        latest_preserved_contact:latestContact?.contact||null,
        latest_preserved_contact_year:latestContact?Number(latestContact.source_year)||null:null,
        latest_preserved_cost:latestCost?.cost||null,
        latest_preserved_cost_year:latestCost?Number(latestCost.source_year)||null:null,
        latest_preserved_location:latestLocation?[latestLocation.address,latestLocation.city].filter(Boolean).join(' · '):null,
        latest_preserved_location_year:latestLocation?Number(latestLocation.source_year)||null:null,
        latest_preserved_booth:latestBooth?.booth||null,
        latest_preserved_booth_year:latestBooth?Number(latestBooth.source_year)||null:null,
        latest_preserved_booth_dates:latestBooth?.dates_text||null,
        best_observed_booth:bestBooth?.booth||null,
        best_observed_booth_year:bestBooth?Number(bestBooth.source_year)||null:null,
        best_observed_booth_dates:bestBooth?.dates_text||null,
        best_observed_booth_net_revenue:bestBooth?.net_revenue??null,
        best_observed_booth_net_sales:bestBooth?.net_sales_count??null,
        best_observed_booth_com:bestBooth?.com_percent??null,
        best_observed_booth_issued:bestBooth?.issued_appts??null,
        best_observed_booth_demos:bestBooth?.demos??null,
        best_observed_specific_booth:bestSpecificBooth?.booth||null,
        best_observed_specific_booth_year:bestSpecificBooth?Number(bestSpecificBooth.source_year)||null:null,
        best_observed_specific_booth_dates:bestSpecificBooth?.dates_text||null,
        best_observed_specific_booth_net_revenue:bestSpecificBooth?.net_revenue??null,
        best_observed_specific_booth_net_sales:bestSpecificBooth?.net_sales_count??null,
        best_observed_specific_booth_com:bestSpecificBooth?.com_percent??null,
        best_observed_specific_booth_issued:bestSpecificBooth?.issued_appts??null,
        best_observed_specific_booth_demos:bestSpecificBooth?.demos??null,
        lp_attributed_specific_placement_count:lpAttributedSpecificRows.length,
        best_lp_attributed_specific_booth:bestLpAttributedSpecificBooth?.booth||null,
        best_lp_attributed_specific_booth_year:bestLpAttributedSpecificBooth?Number(bestLpAttributedSpecificBooth.source_year)||null:null,
        best_lp_attributed_specific_booth_dates:bestLpAttributedSpecificBooth?.dates_text||null,
        best_lp_attributed_specific_booth_issued:bestLpAttributedSpecificBooth?.issued??null,
        best_lp_attributed_specific_booth_demos:bestLpAttributedSpecificBooth?.demos??null,
        best_lp_attributed_specific_booth_sales:bestLpAttributedSpecificBooth?.close_sales_count??null,
        best_lp_attributed_specific_booth_volume:bestLpAttributedSpecificBooth?.close_sales_volume??null,
        best_lp_attributed_specific_booth_history_id:bestLpAttributedSpecificBooth?.history_id||null,
        best_lp_attributed_specific_booth_source_label:bestLpAttributedSpecificBooth?.source_label||null,
        best_lp_attributed_specific_booth_metrics_scope:bestLpAttributedSpecificBooth?.metrics_scope||null,
        best_lp_attributed_specific_booth_verification_status:bestLpAttributedSpecificBooth?.verification_status||null,
        best_lp_attributed_specific_booth_participation_status:bestLpAttributedSpecificBooth?.participation_status||null,
        lp_attributed_placement_semantics:'Annual LeadPerfection performance attribution matched one-to-one to a date-aligned preserved history occurrence with a specific placement; not attendance proof and not same-row history performance.',
        lp_attributed_placement_type_count:lpAttributedPlacementTypeRows.length,
        best_lp_attributed_placement_type:bestLpAttributedPlacementType?.booth||null,
        best_lp_attributed_placement_type_year:bestLpAttributedPlacementType?Number(bestLpAttributedPlacementType.source_year)||null:null,
        best_lp_attributed_placement_type_dates:bestLpAttributedPlacementType?.dates_text||null,
        best_lp_attributed_placement_type_issued:bestLpAttributedPlacementType?.issued??null,
        best_lp_attributed_placement_type_demos:bestLpAttributedPlacementType?.demos??null,
        best_lp_attributed_placement_type_sales:bestLpAttributedPlacementType?.close_sales_count??null,
        best_lp_attributed_placement_type_volume:bestLpAttributedPlacementType?.close_sales_volume??null,
        best_lp_attributed_placement_type_history_id:bestLpAttributedPlacementType?.history_id||null,
        best_lp_attributed_placement_type_source_label:bestLpAttributedPlacementType?.source_label||null,
        best_lp_attributed_placement_type_metrics_scope:bestLpAttributedPlacementType?.metrics_scope||null,
        best_lp_attributed_placement_type_verification_status:bestLpAttributedPlacementType?.verification_status||null,
        best_lp_attributed_placement_type_participation_status:bestLpAttributedPlacementType?.participation_status||null,
        lp_attributed_placement_type_semantics:'Annual LeadPerfection performance attribution matched one-to-one to a date-aligned preserved history occurrence with an informative non-specific popup placement descriptor; not an exact booth, not attendance proof, and not same-row history performance.',
        outcome_evidence_status:latestOutcome?'OCCURRENCE_OUTCOME_AVAILABLE':(((p.lifetime_net_volume!==null&&p.lifetime_net_volume!==undefined)||(p.lifetime_net_sales!==null&&p.lifetime_net_sales!==undefined))?'LIFETIME_ONLY':'NO_COMPARABLE_OUTCOME_EVIDENCE'),
        latest_observed_outcome_year:latestOutcome?Number(latestOutcome.source_year)||null:null,
        latest_observed_outcome_dates:latestOutcome?.dates_text||null,
        latest_observed_outcome_booth:latestOutcome?.booth||null,
        latest_observed_outcome_net_revenue:latestOutcome?.net_revenue??null,
        latest_observed_outcome_net_sales:latestOutcome?.net_sales_count??null,
        latest_observed_outcome_com:latestOutcome?.com_percent??null,
        latest_observed_outcome_issued:latestOutcome?.issued_appts??null,
        latest_observed_outcome_demos:latestOutcome?.demos??null,
        latest_observed_outcome_participation_status:latestOutcome?.participation_status||null,
        latest_observed_outcome_match_status:latestOutcome?.performance_match_status||null,
        best_observed_outcome_year:bestOutcome?Number(bestOutcome.source_year)||null:null,
        best_observed_outcome_dates:bestOutcome?.dates_text||null,
        best_observed_outcome_booth:bestOutcome?.booth||null,
        best_observed_outcome_net_revenue:bestOutcome?.net_revenue??null,
        best_observed_outcome_net_sales:bestOutcome?.net_sales_count??null,
        best_observed_outcome_com:bestOutcome?.com_percent??null,
        best_observed_outcome_issued:bestOutcome?.issued_appts??null,
        best_observed_outcome_demos:bestOutcome?.demos??null,
        best_observed_outcome_participation_status:bestOutcome?.participation_status||null,
        best_observed_outcome_match_status:bestOutcome?.performance_match_status||null,
        has_cost:item.has_cost,
        has_com:item.has_com,
        has_performance:item.has_performance,
        has_payment:item.has_payment,
        has_application:item.has_application,
        history_field_totals:historyFieldTotals,
        history_field_states:yearFieldStates,
        history_field_support:historyFieldSupport,
        history_field_support_rule:{scope:'YEAR_SOURCE_FAMILY',min_coded_ratio:CLEANUP_FAMILY_MIN_CODED_RATIO,supplemental_provenance:true,field_scoped:true,source_labeled_performance:true,source_phone_contact:true,source_booking_contact:true,semantic_known_cost:true},
        history_coi_summary:historyCoiSummary,
        has_lp_performance:item.has_lp_performance,
        lp_years:lpYears,
        lp_year_count:lpYears.length,
        has_cumulative_lp_performance:item.has_cumulative_lp_performance,
        cumulative_years:[...item.cumulative_years].sort((a:number,b:number)=>b-a),
        cumulative_year_count:item.cumulative_years.size,
        has_coi:item.has_coi,
        has_coi_status:item.has_coi_status,
        lowest_preserved_com:comValues.length?Math.min(...comValues):null,
        highest_preserved_com:comValues.length?Math.max(...comValues):null,
        data_completeness_score:completeness,
        search_terms:[...item.search_terms].slice(0,120),
      };
    });
    return out(r,{ok:true,version:64,summary:run,coverage:{profile_rows:(profiles.data||[]).length,history_rows:(historyRows.data||[]).length,annual_lp_profiled_rows:(performanceRows.data||[]).length,cumulative_lp_profiled_rows:(cumulativeRows.data||[]).length},profiles:enriched});
  }

  if(action==='catalogHistory'){
    const profileId=String(body.profileId||'').trim();
    if(!/^(?:(?:LIFE|HIST|CURRENT)-\d{3}|LPONLY-\d{4}-\d{3})$/.test(profileId))return out(r,{ok:false,error:'Valid catalog profile required'},400);
    const latest=await db.from('shows_app_catalog_runs').select('id,captured_at,status,profile_count,occurrence_count,source_summary').eq('status','READY').order('captured_at',{ascending:false}).limit(1);
    if(latest.error)return out(r,{ok:false,error:'Unable to load show history'},500);
    const run=latest.data?.[0]||null;
    if(!run)return out(r,{ok:false,error:'Show catalog unavailable'},404);
    const [profile,history,performance,cumulativePerformance,rebookOpportunity,rebookReview,profileRelations]=await Promise.all([
      db.from('shows_app_catalog').select('*').eq('run_id',run.id).eq('profile_id',profileId).maybeSingle(),
      db.from('shows_app_history_occurrences').select('*').eq('run_id',run.id).eq('profile_id',profileId).order('source_year',{ascending:false}).order('source_row',{ascending:false}).limit(500),
      db.from('shows_app_performance_evidence').select('*').eq('run_id',run.id).eq('profile_id',profileId).order('source_year',{ascending:false}).order('close_sales_volume',{ascending:false}).limit(500),
      db.from('shows_app_cumulative_performance_evidence').select('*').eq('run_id',run.id).eq('profile_id',profileId).order('source_year',{ascending:false}).order('gross_close_volume',{ascending:false}).limit(500),
      db.from('shows_app_rebook_opportunities').select('opportunity_id,profile_id,event_label,event_start,event_end,opportunity_status,venue_text,current_placement_text,current_placement_status,current_schedule_text,current_schedule_status,current_schedule_source_url,current_schedule_source_label,current_schedule_checked_at,current_logistics_text,current_logistics_status,current_logistics_source_url,current_logistics_source_label,current_logistics_checked_at,price_text,prior_cost_text,booking_cost_min,booking_cost_max,booking_cost_unit,booking_cost_basis,current_cost_status,current_commitment_status,commitment_terms_text,critical_deadline_date,critical_deadline_type,critical_deadline_label,critical_deadline_basis,action_label,action_url,booking_window_text,contact_text,contact_name,contact_email,contact_phone,source_url,source_label,identity_status,checked_at,notes').eq('profile_id',profileId).eq('active',true).eq('identity_status','VERIFIED').order('event_start',{ascending:true,nullsFirst:false}).limit(1).maybeSingle(),
      db.from('shows_app_rebook_reviews').select('review_id,profile_id,disposition,booking_readiness,resolution_lane,outreach_contact_name,outreach_contact_phone,outreach_contact_email,outreach_contact_source_url,outreach_contact_source_label,outreach_contact_checked_at,outreach_cycle_status,outreach_cycle_text,outreach_cycle_source_url,outreach_cycle_source_label,outreach_cycle_checked_at,rationale,next_step,action_timing,blockers_text,evidence_date,source_label,source_ref,source_url,identity_status,checked_at,notes').eq('profile_id',profileId).eq('active',true).eq('identity_status','VERIFIED').limit(1).maybeSingle(),
      db.from('shows_app_profile_relations').select('relation_id,profile_id,related_profile_id,canonical_series_profile_id,relation_type,identity_status,evidence_summary,source_refs,checked_at').eq('active',true).eq('identity_status','VERIFIED').or(`profile_id.eq.${profileId},related_profile_id.eq.${profileId}`),
    ]);
    if(profile.error||history.error||performance.error||cumulativePerformance.error||rebookOpportunity.error||rebookReview.error||profileRelations.error)return out(r,{ok:false,error:'Unable to load show history'},500);
    if(!profile.data)return out(r,{ok:false,error:'Catalog show not found'},404);
    return out(r,{ok:true,version:42,summary:run,profile:profile.data,history:history.data||[],performance:performance.data||[],cumulativePerformance:cumulativePerformance.data||[],rebookOpportunity:rebookOpportunity.data||null,rebookReview:rebookReview.data||null,profileRelations:profileRelations.data||[]});
  }

  if(action==='showHistory'){
    const id=String(body.mfcId||'').trim();
    if(!/^MFC-\d{3}$/.test(id))return out(r,{ok:false,error:'Valid MFC ID required'},400);
    const [show,audit,reconciliation,baseline,snapshots,conflicts,payments]=await Promise.all([
      db.from('shows_app_shows').select(publicShowColumns).eq('mfc_id',id).maybeSingle(),
      db.from('shows_app_audit').select('id,mfc_id,field_name,old_value,new_value,changed_at,change_origin').eq('mfc_id',id).order('changed_at',{ascending:false}).limit(500),
      db.from('shows_app_reconciliation_current').select('mfc_id,source_sheet_row,source_as_of,source_captured_at,app_change_count,reconciliation_status,differences').eq('mfc_id',id).maybeSingle(),
      db.from('shows_app_source_baseline').select('mfc_id,source_sheet_row,show_status,follow_up,owner,action_due,this_year,skip_reason,source_as_of,updated_at').eq('mfc_id',id).maybeSingle(),
      db.from('shows_app_source_snapshots').select('run_id,mfc_id,source_sheet_row,show_status,follow_up,owner,action_due,this_year,skip_reason,captured_at').eq('mfc_id',id).order('captured_at',{ascending:false}).limit(500),
      db.from('shows_app_sync_conflicts').select('id,run_id,mfc_id,field_name,baseline_value,source_value,app_value,created_at,resolution,resolved_at').eq('mfc_id',id).order('created_at',{ascending:false}).limit(200),
      db.from('shows_app_payments').select('payment_id,source_instance_id,event,contract_year,installment,due,amount,posted_amount,posted_date,balance,due_status,cash_month,clearing,notes,control_check,approval,status,payment_owner,agreement_id,commitment_id,updated_at').eq('source_instance_id',id).order('due',{ascending:true}),
    ]);
    if(show.error||audit.error||reconciliation.error||baseline.error||snapshots.error||conflicts.error||payments.error)return out(r,{ok:false,error:'Unable to load show history'},500);
    if(!show.data)return out(r,{ok:false,error:'Show not found'},404);
    const paymentIds=(payments.data||[]).map(x=>x.payment_id);
    let paymentChanges:any[]=[];
    if(paymentIds.length){
      const history=await db.from('shows_app_payment_audit').select('id,payment_id,field_name,old_value,new_value,changed_at').in('payment_id',paymentIds).order('changed_at',{ascending:false}).limit(500);
      if(history.error)return out(r,{ok:false,error:'Unable to load payment history'},500);
      paymentChanges=history.data||[];
    }
    return out(r,{ok:true,version:17,show:show.data,history:{changes:audit.data||[],reconciliation:reconciliation.data||null,baseline:baseline.data||null,sourceCaptures:snapshots.data||[],conflicts:conflicts.data||[],relatedPayments:payments.data||[],paymentChanges}});
  }

  if(action==='resolveConflict'){
    const runId=String(body.runId||'').trim(),id=String(body.mfcId||'').trim(),field=String(body.fieldName||'').trim(),resolution=String(body.resolution||'').trim();
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(runId))return out(r,{ok:false,error:'Valid refresh run required'},400);
    if(!/^MFC-\d{3}$/.test(id))return out(r,{ok:false,error:'Valid MFC ID required'},400);
    if(!showFields.has(field))return out(r,{ok:false,error:'Only operating-field conflicts can be resolved in the app'},400);
    if(!new Set(['KEEP APP','USE SHEET']).has(resolution))return out(r,{ok:false,error:'Choose Keep App or Use Sheet'},400);
    const {data,error}=await db.rpc('shows_app_resolve_sync_conflict',{p_run_id:runId,p_mfc_id:id,p_field_name:field,p_resolution:resolution,p_session_id:writeSession?.id||null});
    if(error)return out(r,{ok:false,error:'Unable to resolve source conflict'},400);
    return out(r,{ok:true,result:data});
  }

  if(action==='updateShow'){
    const id=String(body.mfcId||'').trim(),p=plainObject(body.patch)?body.patch:null;
    if(!/^MFC-\d{3}$/.test(id))return out(r,{ok:false,error:'Valid MFC ID required'},400);
    if(!p)return out(r,{ok:false,error:'A valid show patch is required'},400);
    const unknown=Object.keys(p).filter(k=>!showFields.has(k));if(unknown.length)return out(r,{ok:false,error:`Protected or unknown show field: ${unknown[0]}`},400);
    const u:any={};for(const[k,v]of Object.entries(p))u[k]=typeof v==='string'?(v.trim()||null):v;
    if(!Object.keys(u).length)return out(r,{ok:false,error:'No writable changes'},400);
    if(String(u.follow_up||'').length>1000||String(u.owner||'').length>120||String(u.skip_reason||'').length>500)return out(r,{ok:false,error:'Show action, owner, or skip reason is too long'},400);
    if(u.show_status&&!statuses.has(u.show_status))return out(r,{ok:false,error:'Invalid show status'},400);
    if(u.this_year&&!years.has(u.this_year))return out(r,{ok:false,error:'Invalid current-year treatment'},400);
    if(u.action_due&&!/^\d{4}-\d{2}-\d{2}$/.test(String(u.action_due)))return out(r,{ok:false,error:'Action due date must be YYYY-MM-DD'},400);
    const {data:old}=await db.from('shows_app_shows').select('*').eq('mfc_id',id).maybeSingle();if(!old)return out(r,{ok:false,error:'Show not found'},404);
    const yr=u.this_year??old.this_year,reason=u.skip_reason??old.skip_reason;if(yr==='SKIP THIS YEAR'&&!String(reason||'').trim())return out(r,{ok:false,error:'Skip reason is required'},400);if(yr!=='SKIP THIS YEAR')u.skip_reason=null;
    const changed=Object.entries(u).filter(([k,v])=>!same(old[k],v));if(!changed.length)return out(r,{ok:true,show:old,noChange:true});
    const write:any=Object.fromEntries(changed);write.updated_at=new Date().toISOString();const {data:newrow,error}=await db.from('shows_app_shows').update(write).eq('mfc_id',id).select('*').single();if(error)return out(r,{ok:false,error:'Update failed'},500);
    const logs=changed.map(([k,v])=>({mfc_id:id,field_name:k,old_value:old[k]==null?null:String(old[k]),new_value:v==null?null:String(v),session_id:writeSession?.id||null}));if(logs.length)await db.from('shows_app_audit').insert(logs);
    return out(r,{ok:true,show:newrow});
  }

  if(action==='updatePayment'){
    const id=String(body.paymentId||'').trim(),p=plainObject(body.patch)?body.patch:null;if(!id)return out(r,{ok:false,error:'Payment ID required'},400);
    if(!p)return out(r,{ok:false,error:'A valid payment patch is required'},400);
    const unknown=Object.keys(p).filter(k=>!payFields.has(k));if(unknown.length)return out(r,{ok:false,error:`Protected or unknown payment field: ${unknown[0]}`},400);
    const u:any={};for(const[k,v]of Object.entries(p))u[k]=k==='posted_amount'?(v===''||v==null?null:Number(v)):(typeof v==='string'?(v.trim()||null):v);
    if(!Object.keys(u).length)return out(r,{ok:false,error:'No writable payment changes'},400);if(String(u.payment_owner||'').length>120||String(u.notes||'').length>1000)return out(r,{ok:false,error:'Payment owner or operating note is too long'},400);
    const {data:old}=await db.from('shows_app_payments').select('*').eq('payment_id',id).maybeSingle();if(!old)return out(r,{ok:false,error:'Payment not found'},404);
    let calc:any;try{calc=derive(old,u)}catch(e){return out(r,{ok:false,error:e instanceof Error?e.message:'Invalid payment update'},400)}
    const candidate:any={...u,...calc};const changed=Object.entries(candidate).filter(([k,v])=>!same(old[k],v));if(!changed.length)return out(r,{ok:true,payment:old,noChange:true});
    const write:any=Object.fromEntries(changed);write.updated_at=new Date().toISOString();const {data:newrow,error}=await db.from('shows_app_payments').update(write).eq('payment_id',id).select('*').single();if(error)return out(r,{ok:false,error:'Payment update failed'},500);
    const logs=changed.map(([k,v])=>({payment_id:id,field_name:k,old_value:old[k]==null?null:String(old[k]),new_value:v==null?null:String(v),session_id:writeSession?.id||null}));if(logs.length)await db.from('shows_app_payment_audit').insert(logs);
    return out(r,{ok:true,payment:newrow});
  }
  return out(r,{ok:false,error:'Unknown action'},400);
});
