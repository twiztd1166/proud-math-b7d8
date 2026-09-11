// R6 annual-plan geography/category scope controller.
// The database fields are authoritative when the API returns them. The explicit fallback
// keeps the v91 annualPlan contract compatible during the R6 rollout.
const ANNUAL_SCOPE_DEFAULT='EAST_COAST_FLORIDA';
const ANNUAL_SCOPE_KEYS=['EAST_COAST_FLORIDA','WEST_COAST_FLORIDA','CENTRAL_FLORIDA','NORTHERN_FLORIDA','PANHANDLE_FLORIDA','B2B'];
const ANNUAL_SCOPE_LABELS={
  EAST_COAST_FLORIDA:'East Coast Florida',
  WEST_COAST_FLORIDA:'West Coast Florida',
  CENTRAL_FLORIDA:'Central Florida',
  NORTHERN_FLORIDA:'Northern Florida',
  PANHANDLE_FLORIDA:'Panhandle',
  B2B:'B2B',
};
const ANNUAL_SCOPE_WEST_FALLBACK=new Set(['LIFE-017','LIFE-025','LIFE-032','LIFE-044','LIFE-062','LIFE-071','LIFE-099','LIFE-109','LIFE-124','LIFE-172']);
const ANNUAL_SCOPE_B2B_FALLBACK=new Set(['HIST-108']);

function annualScopeKey(row){
  const category=String(row?.planning_category||'').trim().toUpperCase();
  const region=String(row?.geographic_region||'').trim().toUpperCase();
  if(category==='B2B')return 'B2B';
  if(ANNUAL_SCOPE_KEYS.includes(region)&&region!=='B2B')return region;
  const profile=String(row?.profile_id||'').trim().toUpperCase();
  if(ANNUAL_SCOPE_B2B_FALLBACK.has(profile))return 'B2B';
  if(ANNUAL_SCOPE_WEST_FALLBACK.has(profile))return 'WEST_COAST_FLORIDA';
  return 'EAST_COAST_FLORIDA';
}
function annualScopeRows(scope,rows){return (rows||[]).filter(row=>annualScopeKey(row)===scope)}
function annualScopeSummary(rows){
  const list=rows||[];
  return {
    rows:list.length,
    profiles:new Set(list.map(row=>row.profile_id)).size,
    pursue:list.filter(row=>row.plan_decision==='PURSUE').length,
    watch:list.filter(row=>row.plan_decision==='WATCH').length,
    research:list.filter(row=>row.plan_decision==='RESEARCH_IDENTITY').length,
    exact:list.filter(row=>!!row.event_start).length,
    expected:list.filter(row=>!row.event_start&&!!row.expected_month).length,
    conflicts:list.filter(row=>!!String(row.conflict_notes||'').trim()).length,
  };
}
function annualScopeBar(allRows,scope){
  const buttons=ANNUAL_SCOPE_KEYS.map(key=>{
    const count=annualScopeRows(key,allRows).length;
    return `<button class="chip ${scope===key?'active':''}" data-annual-scope="${key}">${esc(ANNUAL_SCOPE_LABELS[key])} ${count}</button>`;
  }).join('');
  return `<div class="sourceWarn"><b>2027 working scope:</b> East Coast Florida consumer events are the default. Other Florida regions remain preserved and parked; B2B is isolated from the consumer plan.</div><div class="filterbar modebar annualScopeBar">${buttons}</div>`;
}

if(!state.annualPlan.scope)state.annualPlan.scope=ANNUAL_SCOPE_DEFAULT;
const baseRenderAnnualPlan=renderAnnualPlan;
renderAnnualPlan=function(){
  const p=state.annualPlan;
  if(!p.loaded||!p.run)return baseRenderAnnualPlan();
  const allRows=Array.isArray(p.rows)?p.rows:[];
  const allSummary=p.summary;
  const scope=ANNUAL_SCOPE_KEYS.includes(p.scope)?p.scope:ANNUAL_SCOPE_DEFAULT;
  const scopedRows=annualScopeRows(scope,allRows);
  p.rows=scopedRows;
  p.summary=annualScopeSummary(scopedRows);
  let html;
  try{html=baseRenderAnnualPlan()}
  finally{p.rows=allRows;p.summary=allSummary}
  return annualScopeBar(allRows,scope)+html;
};

document.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-annual-scope]');
  if(!button)return;
  const scope=String(button.dataset.annualScope||'');
  if(!ANNUAL_SCOPE_KEYS.includes(scope))return;
  state.annualPlan.scope=scope;
  state.annualPlan.filter='ALL';
  state.search='';
  render();
});

if(typeof window!=='undefined')window.__PARADISE_ANNUAL_SCOPE_TEST__={annualScopeKey,annualScopeRows,annualScopeSummary,ANNUAL_SCOPE_KEYS};
