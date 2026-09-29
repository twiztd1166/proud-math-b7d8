import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const URL = Deno.env.get('SUPABASE_URL')!;
const KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const deploymentId = Deno.env.get('DENO_DEPLOYMENT_ID') || '';
const deploymentVersion = deploymentId.split('_').at(-1) || 'local';
const ORIGINS = new Set([
  'https://paradise-shows-public.proud-math-b7d8.pages.dev',
  'capacitor://localhost',
  'https://paradise-shows-pe12.vercel.app',
  'https://paradise-shows-open.anthonybeckner.chatgpt.site',
  'https://taxlrlfsobtnbasjcnuf.supabase.co',
  'https://twiztd1166.github.io',
]);
const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cors(r:Request){
  const origin=r.headers.get('origin')||'';
  return {
    ...(ORIGINS.has(origin)?{'Access-Control-Allow-Origin':origin}:{}),
    'Access-Control-Allow-Headers':'content-type, authorization',
    'Access-Control-Allow-Methods':'POST,OPTIONS',
    'Vary':'Origin',
  };
}
function out(r:Request,x:any,status=200){
  return new Response(JSON.stringify(x),{status,headers:{...cors(r),'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Paradise-Deployment-Version':deploymentVersion}});
}
async function fetchAuditRows(runId:string){
  const rows:any[]=[];
  const pageSize=1000;
  for(let start=0;;){
    const page=await db.from('shows_app_annual_profile_audit')
      .select('run_id,profile_id,canonical_event,tier,lifetime_net_sales,lifetime_net_volume,latest_history_year,classification,canonical_profile_id,current_2027_status,evidence_summary,source_refs,checked_at')
      .eq('run_id',runId)
      .order('classification',{ascending:true})
      .order('canonical_event',{ascending:true})
      .range(start,start+pageSize-1);
    if(page.error)return {data:null,error:page.error};
    const batch=page.data||[];
    rows.push(...batch);
    if(batch.length<pageSize)return {data:rows,error:null};
    start+=batch.length;
  }
}
async function runMeta(runId:string,year:number){
  const result=await db.from('shows_app_annual_plan_runs')
    .select('id,plan_year,status,created_at,source_scope,notes,row_count')
    .eq('id',runId).eq('plan_year',year).maybeSingle();
  return result;
}
async function annualPlanPayload(year:number){
  const publication=await db.from('shows_app_annual_plan_publication')
    .select('run_id')
    .eq('plan_year',year)
    .maybeSingle();
  if(publication.error)return {error:'Unable to load annual plan'};
  const runId=String(publication.data?.run_id||'');
  if(!runId)return {ok:true,version:2,year,run:null,summary:{rows:0,profiles:0,pursue:0,watch:0,research:0,exact:0,expected:0,conflicts:0},rows:[]};
  const selected=await runMeta(runId,year);
  if(selected.error)return {error:'Unable to load annual plan'};
  const run=selected.data&&selected.data.status==='READY'?selected.data:null;
  if(!run)return {error:'Unable to load annual plan'};
  const plan=await db.from('shows_app_annual_plan')
    .select('plan_id,plan_year,profile_id,canonical_event,occurrence_label,coverage_class,plan_decision,priority,publication_status,date_confidence,event_start,event_end,expected_month,expected_window_text,action_start,action_due,action_window_text,cost_status,budget_min,budget_max,budget_basis,placement_reference,historical_signal,next_action,source_basis,source_refs,mfc_ids,schedule_type,conflict_notes,geographic_region,planning_category')
    .eq('run_id',run.id)
    .order('event_start',{ascending:true,nullsFirst:false})
    .order('expected_month',{ascending:true,nullsFirst:false})
    .order('priority',{ascending:true})
    .order('canonical_event',{ascending:true});
  if(plan.error)return {error:'Unable to load annual plan'};
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
  return {ok:true,version:2,year,run,summary,rows};
}


async function sha256Hex(value:string){
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
function bearer(r:Request){
  const value=String(r.headers.get('authorization')||'').trim();
  const match=value.match(/^Bearer\s+(.+)$/i);
  return match?match[1].trim():'';
}
async function activeAppSession(r:Request){
  const token=bearer(r);if(!token)return null;
  const tokenHash=await sha256Hex(token);
  const now=new Date().toISOString();
  const session=await db.from('shows_app_sessions').select('id,expires_at').eq('token_hash',tokenHash).gt('expires_at',now).maybeSingle();
  if(session.error||!session.data)return null;
  return session.data;
}

Deno.serve(async r=>{
  if(r.method==='OPTIONS')return new Response('ok',{headers:cors(r)});
  if(r.method!=='POST')return out(r,{ok:false,error:'POST required'},405);
  if(!await activeAppSession(r))return out(r,{ok:false,error:'App access required'},401);
  let body:any;try{body=await r.json()}catch{return out(r,{ok:false,error:'Invalid JSON'},400)}
  const year=Number(body.year||2027);
  if(!Number.isInteger(year)||year<2026||year>2035)return out(r,{ok:false,error:'Valid annual plan year required'},400);
  const action=String(body.action||'historicalCoverage');
  if(action==='annualPlan'){
    const payload=await annualPlanPayload(year);
    if(payload.error)return out(r,{ok:false,error:payload.error},500);
    return out(r,payload);
  }
  if(action!=='historicalCoverage')return out(r,{ok:false,error:'Unknown action'},400);
  const requestedRunId=String(body.runId||'').trim();
  if(requestedRunId&&!UUID_RE.test(requestedRunId))return out(r,{ok:false,error:'Valid annual plan run required'},400);
  const allowLatestAuditPreview=body.allowLatestAuditPreview===true;

  let requestedRun:any=null;
  let selectedRun:any=null;
  let previewSource='REQUESTED_RUN';

  if(requestedRunId){
    const requested=await runMeta(requestedRunId,year);
    if(requested.error)return out(r,{ok:false,error:'Unable to load requested annual plan run'},500);
    if(!requested.data)return out(r,{ok:false,error:'Annual plan run not found'},404);
    requestedRun=requested.data;
    const count=await db.from('shows_app_annual_profile_audit').select('profile_id',{count:'exact',head:true}).eq('run_id',requestedRunId);
    if(count.error)return out(r,{ok:false,error:'Unable to inspect historical coverage'},500);
    if((count.count||0)>0)selectedRun=requestedRun;
  }

  if(!selectedRun&&allowLatestAuditPreview){
    const latestAudit=await db.from('shows_app_annual_profile_audit')
      .select('run_id,checked_at')
      .order('checked_at',{ascending:false})
      .limit(1);
    if(latestAudit.error)return out(r,{ok:false,error:'Unable to locate historical coverage run'},500);
    const latestRunId=String(latestAudit.data?.[0]?.run_id||'');
    if(latestRunId){
      const latest=await runMeta(latestRunId,year);
      if(latest.error)return out(r,{ok:false,error:'Unable to load historical coverage run'},500);
      if(latest.data){selectedRun=latest.data;previewSource='LATEST_AUDITED_RUN';}
    }
  }

  if(!selectedRun){
    return out(r,{ok:true,version:1,year,requested_run:requestedRun,run:null,preview:false,preview_source:null,summary:{rows:0,consumer_rows:0,b2b_rows:0,classifications:{}},rows:[]});
  }

  const audit=await fetchAuditRows(selectedRun.id);
  if(audit.error)return out(r,{ok:false,error:'Unable to load historical coverage'},500);
  const rows=audit.data||[];
  const classifications=rows.reduce((acc:any,row:any)=>{const key=String(row.classification||'UNCLASSIFIED');acc[key]=(acc[key]||0)+1;return acc;},{});
  const b2b=Number(classifications.B2B_SEPARATE||0);
  const direct=rows.filter((row:any)=>/^DIRECT_R\d+_PROFILE$/.test(String(row.classification||''))).length;
  const active=Number(classifications.VERIFIED_CANONICAL_ROUTE_ACTIVE||0);
  const staged=Number(classifications.VERIFIED_CANONICAL_ROUTE_STAGED||0);
  const gaps=rows.length-direct-active-staged;
  const checkedAt=rows.map((row:any)=>String(row.checked_at||'')).filter(Boolean).sort().at(-1)||null;
  return out(r,{
    ok:true,version:1,year,
    requested_run:requestedRun,
    run:selectedRun,
    preview:Boolean(requestedRun&&selectedRun.id!==requestedRun.id),
    preview_source:previewSource,
    summary:{
      rows:rows.length,
      consumer_rows:rows.length-b2b,
      b2b_rows:b2b,
      direct_profiles:direct,
      active_routes:active,
      staged_routes:staged,
      gap_dispositions:gaps,
      classifications,
      checked_at:checkedAt,
      participation_semantics:'Historical coverage contains participation-supported East Coast identities. LeadPerfection attribution, schedules, applications, contracts, booth assignments, and pre-event records alone are not treated as proof that Paradise worked an event.'
    },
    rows,
  });
});
