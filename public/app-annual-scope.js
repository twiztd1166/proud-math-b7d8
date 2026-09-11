// Annual-plan geography/category scope + historical coverage controller.
// The annual-plan database fields are authoritative when the API returns them. The explicit
// fallback keeps the v91 annualPlan contract compatible while historical coverage stays read-only.
(()=>{
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
  const HISTORY_API='https://taxlrlfsobtnbasjcnuf.supabase.co/functions/v1/shows-history-api';
  const HISTORY_DEFAULT_FILTER='CONSUMER';
  const HISTORY_FILTER_KEYS=['CONSUMER','ALL','DIRECT_R8_PROFILE','VERIFIED_ROUTE','PUBLICATION_WATCH','CURRENT_IDENTITY_WATCH','LOCAL_POPUP_HISTORY','ARCHIVE_CONTINUITY_UNVERIFIED','B2B_SEPARATE'];
  const HISTORY_FILTER_LABELS={
    CONSUMER:'East Coast consumer',
    ALL:'All East Coast history',
    DIRECT_R8_PROFILE:'Direct in 2027 plan',
    VERIFIED_ROUTE:'Verified canonical route',
    PUBLICATION_WATCH:'Publication watch',
    CURRENT_IDENTITY_WATCH:'Current identity watch',
    LOCAL_POPUP_HISTORY:'Local popup history',
    ARCHIVE_CONTINUITY_UNVERIFIED:'Archive / continuity unverified',
    B2B_SEPARATE:'B2B',
  };
  const HISTORY_CLASS_LABELS={
    DIRECT_R8_PROFILE:'Direct R8 profile',
    VERIFIED_CANONICAL_ROUTE_ACTIVE:'Verified route · active',
    VERIFIED_CANONICAL_ROUTE_STAGED:'Verified route · staged',
    PUBLICATION_WATCH:'Publication watch',
    CURRENT_SUCCESSOR_WATCH:'Current successor watch',
    CURRENT_SIMILAR_EVENT_IDENTITY_UNPROVEN:'Current similar event · identity unproven',
    LOCAL_POPUP_HISTORY:'Local popup history',
    B2B_SEPARATE:'B2B separate',
    ARCHIVE_CONTINUITY_UNVERIFIED:'Archive · continuity unverified',
  };

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

  function historicalCoverageMatch(row,filter){
    const classification=String(row?.classification||'');
    if(filter==='ALL')return true;
    if(filter==='CONSUMER')return classification!=='B2B_SEPARATE';
    if(filter==='VERIFIED_ROUTE')return classification==='VERIFIED_CANONICAL_ROUTE_ACTIVE'||classification==='VERIFIED_CANONICAL_ROUTE_STAGED';
    if(filter==='CURRENT_IDENTITY_WATCH')return classification==='CURRENT_SUCCESSOR_WATCH'||classification==='CURRENT_SIMILAR_EVENT_IDENTITY_UNPROVEN';
    return classification===filter;
  }
  function historicalCoverageRows(filter,rows,search=''){
    const q=String(search||'').trim().toLowerCase();
    return (rows||[]).filter(row=>{
      if(!historicalCoverageMatch(row,filter))return false;
      if(!q)return true;
      return [row.profile_id,row.canonical_event,row.classification,row.canonical_profile_id,row.current_2027_status,row.evidence_summary]
        .map(v=>String(v||'').toLowerCase()).some(v=>v.includes(q));
    });
  }
  function historicalCoverageCounts(rows){
    return Object.fromEntries(HISTORY_FILTER_KEYS.map(key=>[key,historicalCoverageRows(key,rows).length]));
  }
  function historicalClassificationLabel(value){
    const key=String(value||'');
    return HISTORY_CLASS_LABELS[key]||key.replaceAll('_',' ');
  }
  function historicalStatusLabel(value){return String(value||'Not classified').replaceAll('_',' ')}
  function historicalSourceRefs(row){
    const refs=Array.isArray(row?.source_refs)?row.source_refs:[];
    if(!refs.length)return '';
    const body=refs.map(ref=>{
      const text=String(ref||'');
      if(/^https?:\/\//i.test(text))return `<a target="_blank" rel="noopener noreferrer" href="${esc(text)}">${esc(text)}</a>`;
      return `<span>${esc(text)}</span>`;
    }).join('<br>');
    return `<details><summary>Evidence refs ${refs.length}</summary><div class="mfc">${body}</div></details>`;
  }
  function historicalCoverageCard(row){
    const canonical=String(row.canonical_profile_id||'').trim();
    const route=canonical&&canonical!==String(row.profile_id||'')?canonical:'Direct / no canonical route';
    const latest=row.latest_history_year?String(row.latest_history_year):'Not stated';
    const lifetimeSales=row.lifetime_net_sales===null||row.lifetime_net_sales===undefined||row.lifetime_net_sales===''?'—':String(row.lifetime_net_sales);
    const lifetimeVolume=row.lifetime_net_volume===null||row.lifetime_net_volume===undefined||row.lifetime_net_volume===''?'—':money(row.lifetime_net_volume);
    return `<article class="card" data-historical-coverage-profile="${esc(row.profile_id)}">
      <div class="row"><div><div class="event">${esc(row.canonical_event||row.profile_id)}</div><div class="mfc">${esc(row.profile_id)} · latest participation-supported history ${esc(latest)}</div></div><span class="pill review">${esc(historicalClassificationLabel(row.classification))}</span></div>
      <div class="bookingGrid"><div><span>2027 treatment</span><b>${esc(historicalStatusLabel(row.current_2027_status))}</b></div><div><span>Canonical route</span><b>${esc(route)}</b></div><div><span>Lifetime net sales</span><b>${esc(lifetimeSales)}</b></div><div><span>Lifetime net volume</span><b>${esc(lifetimeVolume)}</b></div></div>
      <div class="action">${esc(row.evidence_summary||'No evidence summary recorded.')}</div>
      ${historicalSourceRefs(row)}
      <div class="actions"><button type="button" class="btn secondary" data-annual-profile="${esc(row.profile_id)}">Open full show history</button></div>
    </article>`;
  }
  function historicalCoverageSummaryHtml(a){
    const s=a.summary||{};
    const preview=a.preview&&a.run&&a.requestedRun&&a.run.id!==a.requestedRun.id;
    const runStatus=String(a.run?.status||'UNKNOWN');
    const checked=String(s.checked_at||'').slice(0,10);
    const context=preview
      ?`Showing the latest audited annual-plan run because the current live annual plan has no historical ledger. This is a ${esc(runStatus)} preview and does not make that run current.`
      :`Historical coverage is tied to the selected annual-plan run (${esc(runStatus)}).`;
    return `<div class="sourceWarn" data-historical-coverage-context><b>East Coast Historical Coverage:</b> ${context} ${esc(s.participation_semantics||'')}</div>
      <div class="stats" data-historical-coverage-summary>
        <div class="stat"><div class="v">${Number(s.rows||0)}</div><div class="l">East Coast identities</div></div>
        <div class="stat"><div class="v">${Number(s.consumer_rows||0)}</div><div class="l">Consumer identities</div></div>
        <div class="stat"><div class="v">${Number(s.direct_profiles||0)}</div><div class="l">Direct 2027 profiles</div></div>
        <div class="stat"><div class="v">${Number(s.active_routes||0)+Number(s.staged_routes||0)}</div><div class="l">Verified routes</div></div>
        <div class="stat"><div class="v">${Number(s.gap_dispositions||0)}</div><div class="l">Fully dispositioned gaps</div></div>
        <div class="stat"><div class="v">${Number(s.b2b_rows||0)}</div><div class="l">B2B separate</div></div>
      </div>
      <div class="mfc">Coverage equation: ${Number(s.direct_profiles||0)} direct + ${Number(s.active_routes||0)} active verified routes + ${Number(s.staged_routes||0)} staged verified routes + ${Number(s.gap_dispositions||0)} gap dispositions = ${Number(s.rows||0)} East Coast identities.${checked?` · checked ${esc(checked)}`:''}</div>`;
  }
  function historicalCoverageFilterBar(a){
    const rows=Array.isArray(a.rows)?a.rows:[];
    const counts=historicalCoverageCounts(rows);
    const active=HISTORY_FILTER_KEYS.includes(a.filter)?a.filter:HISTORY_DEFAULT_FILTER;
    return `<div class="filterbar modebar" data-historical-coverage-filters>${HISTORY_FILTER_KEYS.map(key=>`<button class="chip ${active===key?'active':''}" data-history-filter="${key}">${esc(HISTORY_FILTER_LABELS[key])} ${counts[key]}</button>`).join('')}</div>`;
  }
  function renderHistoricalCoverage(){
    const a=state.annualProfileAudit;
    if(a.loading&&!a.loaded)return '<div class="loading">Loading East Coast historical coverage…</div>';
    if(a.error&&!a.loaded)return `<div class="alert"><div class="event">Historical coverage unavailable</div><div class="action">${esc(a.error)}</div><div class="actions"><button class="btn primary" data-history-retry>Try again</button></div></div>`;
    if(!a.loaded)return '<div class="loading">Opening East Coast historical coverage…</div>';
    if(!a.run)return '<div class="empty">No audited East Coast historical coverage is available for this planning cycle.</div>';
    const filter=HISTORY_FILTER_KEYS.includes(a.filter)?a.filter:HISTORY_DEFAULT_FILTER;
    const rows=historicalCoverageRows(filter,a.rows,state.search);
    return `${historicalCoverageSummaryHtml(a)}${historicalCoverageFilterBar(a)}<div class="sectionTitle"><span>${esc(HISTORY_FILTER_LABELS[filter])}</span><span>${rows.length} profile${rows.length===1?'':'s'}</span></div>${rows.length?rows.map(historicalCoverageCard).join(''):'<div class="empty">No historical profiles match this view / search.</div>'}`;
  }
  function annualViewBar(){
    const a=state.annualProfileAudit;
    const historyCount=Number(a.summary?.rows||0);
    return `<div class="filterbar modebar" data-annual-view-bar><button class="chip ${a.view==='PLAN'?'active':''}" data-annual-view="PLAN">2027 Operational Plan</button><button class="chip ${a.view==='HISTORY'?'active':''}" data-annual-view="HISTORY">East Coast Historical Coverage${historyCount?' '+historyCount:''}</button></div>`;
  }
  async function callHistoricalCoverage(payload){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),15000);
    try{
      const response=await fetch(HISTORY_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
      const data=await response.json().catch(()=>({ok:false,error:'Invalid response'}));
      if(!response.ok||!data.ok)throw new Error(data.error||'Request failed');
      return data;
    }catch(error){
      if(error&&error.name==='AbortError')throw new Error('Request timed out. Tap Try again.');
      throw error;
    }finally{clearTimeout(timer)}
  }
  async function loadHistoricalCoverage(force=false){
    const a=state.annualProfileAudit;
    const requestedRunId=String(state.annualPlan?.run?.id||'');
    if(a.loading||(!force&&a.loaded&&a.requestedRunId===requestedRunId))return;
    a.loading=true;a.error=null;a.requestedRunId=requestedRunId;
    if(state.tab==='shows'&&state.showMode==='PLAN2027'&&a.view==='HISTORY')render();
    try{
      const data=await callHistoricalCoverage({year:Number(state.annualPlan?.year||2027),runId:requestedRunId||undefined,allowLatestAuditPreview:true});
      a.rows=data.rows||[];a.summary=data.summary||null;a.run=data.run||null;a.requestedRun=data.requested_run||null;a.preview=Boolean(data.preview);a.previewSource=data.preview_source||null;a.loaded=true;
    }catch(error){
      a.error=error.message||'Unable to load East Coast historical coverage.';
      if(typeof toast==='function')toast('Historical coverage unavailable');
    }finally{
      a.loading=false;
      if(state.tab==='shows'&&state.showMode==='PLAN2027'&&a.view==='HISTORY')render();
    }
  }

  if(typeof window==='undefined')return;
  if(!state.annualPlan.scope)state.annualPlan.scope=ANNUAL_SCOPE_DEFAULT;
  if(!state.annualProfileAudit)state.annualProfileAudit={rows:[],summary:null,run:null,requestedRun:null,requestedRunId:'',preview:false,previewSource:null,view:'PLAN',filter:HISTORY_DEFAULT_FILTER,loaded:false,loading:false,error:null};
  window.__PARADISE_ANNUAL_SCOPE_TEST__={annualScopeKey,annualScopeRows,annualScopeSummary,ANNUAL_SCOPE_KEYS,historicalCoverageRows,historicalCoverageCounts,HISTORY_FILTER_KEYS};

  // Intentionally do not replace window.renderAnnualPlan. Browser global-function bindings
  // can alias an assigned window property and recurse. The PLAN2027 route calls this separate
  // renderer, which invokes the untouched base renderer exactly once for the operational view.
  window.renderAnnualPlanScoped=function renderAnnualPlanScoped(){
    const p=state.annualPlan;
    const a=state.annualProfileAudit;
    if(!p.loaded||!p.run)return renderAnnualPlan();
    if(a.view==='HISTORY')return annualViewBar()+renderHistoricalCoverage();
    const allRows=Array.isArray(p.rows)?p.rows:[];
    const allSummary=p.summary;
    const scope=ANNUAL_SCOPE_KEYS.includes(p.scope)?p.scope:ANNUAL_SCOPE_DEFAULT;
    const scopedRows=annualScopeRows(scope,allRows);
    p.rows=scopedRows;
    p.summary=annualScopeSummary(scopedRows);
    let html;
    try{html=renderAnnualPlan()}
    finally{p.rows=allRows;p.summary=allSummary}
    return annualViewBar()+annualScopeBar(allRows,scope)+html;
  };

  if(!window.__PARADISE_ANNUAL_SCOPE_LISTENER_INSTALLED__){
    window.__PARADISE_ANNUAL_SCOPE_LISTENER_INSTALLED__=true;
    document.addEventListener('click',event=>{
      const viewButton=event.target.closest?.('[data-annual-view]');
      if(viewButton){
        const view=String(viewButton.dataset.annualView||'');
        if(view==='PLAN'||view==='HISTORY'){
          state.annualProfileAudit.view=view;
          state.search='';
          render();
          if(view==='HISTORY')loadHistoricalCoverage();
        }
        return;
      }
      const historyButton=event.target.closest?.('[data-history-filter]');
      if(historyButton){
        const filter=String(historyButton.dataset.historyFilter||'');
        if(HISTORY_FILTER_KEYS.includes(filter)){
          state.annualProfileAudit.filter=filter;
          state.search='';
          render();
        }
        return;
      }
      if(event.target.closest?.('[data-history-retry]')){loadHistoricalCoverage(true);return;}
      const button=event.target.closest?.('[data-annual-scope]');
      if(!button)return;
      const scope=String(button.dataset.annualScope||'');
      if(!ANNUAL_SCOPE_KEYS.includes(scope))return;
      state.annualPlan.scope=scope;
      state.annualPlan.filter='ALL';
      state.search='';
      render();
    });
  }
})();
