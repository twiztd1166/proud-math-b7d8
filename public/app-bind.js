function render(){
  persistShowViewState();
  $$('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===state.tab));
  $('#content').innerHTML=state.tab==='today'?renderToday():state.tab==='calendar'?(typeof window.renderCalendarV2==='function'?window.renderCalendarV2():renderCalendar()):state.tab==='shows'?renderShows():state.tab==='payments'?renderPayments():renderControl();bindDynamic();
}
function currentMfcForProfile(profileId){
  const profile=state.catalog.find(p=>p.profile_id===profileId);
  const ids=Array.isArray(profile?.matched_mfc_ids)?profile.matched_mfc_ids:[];
  const today=new Date().toISOString().slice(0,10);
  const candidates=ids.map(id=>state.shows.find(s=>s.mfc_id===id)).filter(Boolean);
  candidates.sort((a,b)=>{
    const aSkip=a.this_year==='SKIP THIS YEAR'?1:0,bSkip=b.this_year==='SKIP THIS YEAR'?1:0;
    if(aSkip!==bSkip)return aSkip-bSkip;
    const aFuture=a.event_start&&a.event_start>=today?0:1,bFuture=b.event_start&&b.event_start>=today?0:1;
    if(aFuture!==bFuture)return aFuture-bFuture;
    return String(a.event_start||'9999-12-31').localeCompare(String(b.event_start||'9999-12-31'))||String(a.mfc_id).localeCompare(String(b.mfc_id));
  });
  return candidates[0]?.mfc_id||'';
}
async function openProfileShow(profile){
  if(!profile)return;
  if(!state.catalogLoaded)await loadCatalog();
  const mfc=currentMfcForProfile(profile);
  if(mfc){openDetail(mfc);return}
  state.deepLinkedProfile=profile;state.deepLinkedYear=null;syncLocationView();
  if(state.catalogLoaded)openCatalog(profile);
}
function bindDynamic(){
  $$('.card[data-id]').forEach(c=>c.onclick=()=>openDetail(c.dataset.id));
  document.querySelectorAll('.catalogCard[data-profile]').forEach(c=>c.onclick=e=>{if(e.target.closest('a,button,details'))return;const focusYear=Number(c.dataset.focusYear||0)||null;state.deepLinkedProfile=c.dataset.profile;state.deepLinkedYear=focusYear;syncLocationView();openCatalog(c.dataset.profile,focusYear)});
  document.querySelectorAll('.liveCompareOpen[data-profile]').forEach(b=>b.onclick=async()=>{const profile=String(b.dataset.profile||'').trim();await openProfileShow(profile)});
  $$('[data-show-mode]').forEach(b=>b.onclick=()=>{state.deepLinkedProfile=null;state.deepLinkedYear=null;state.showMode=b.dataset.showMode;state.search='';state.showQuickView='NONE';state.catalogLimit=60;syncLocationView();if(['ALL','CURRENT'].includes(state.showMode)&&!state.catalogLoaded)loadCatalog();if(state.showMode==='UNLINKED'&&!state.unlinkedLp.loaded)loadUnlinkedLp();if(state.showMode==='PLAN2027'&&!state.annualPlan.loaded)loadAnnualPlan();render()});
  $$('[data-quick-view]').forEach(b=>b.onclick=()=>applyQuickView(b.dataset.quickView));
  $$('.activeFilterChip[data-active-filter-key]').forEach(b=>b.onclick=()=>removeActiveShowFilter(b.dataset.activeFilterKey));
  const sf=$('#showFilterBtn');if(sf)sf.onclick=openShowFilters;
  const ss=$('#showSortSelect');if(ss)ss.onchange=()=>{state.showQuickView='NONE';if(state.showMode==='ALL')state.catalogSort=ss.value;else state.currentSort=ss.value;state.catalogLimit=60;render()};
  const sr=$('#showResetBtn');if(sr)sr.onclick=resetShowView;
  const cr=$('#catalogRetry');if(cr)cr.onclick=()=>loadCatalog(true);
  const ur=$('#unlinkedRetry');if(ur)ur.onclick=()=>loadUnlinkedLp(true);
  const ar=$('#annualPlanRetry');if(ar)ar.onclick=()=>loadAnnualPlan(true);
  $$('[data-annual-filter]').forEach(b=>b.onclick=()=>{state.annualPlan.filter=b.dataset.annualFilter||'ALL';state.search='';render()});
  document.querySelectorAll('[data-annual-profile]').forEach(b=>b.onclick=async e=>{e.stopPropagation();const profile=String(b.dataset.annualProfile||'').trim();if(!profile)return;state.showMode='ALL';await openProfileShow(profile)});
  document.querySelectorAll('[data-annual-call-script]').forEach(b=>b.onclick=e=>{e.stopPropagation();const plan=String(b.dataset.annualCallScript||'').trim();if(plan&&typeof openAnnualPlanCallScript==='function')openAnnualPlanCallScript(plan)});
  document.querySelectorAll('[data-calendar-show]').forEach(b=>b.onclick=e=>{e.stopPropagation();const mfc=String(b.dataset.calendarShow||'').trim();if(mfc)openDetail(mfc)});
  document.querySelectorAll('[data-calendar-research]').forEach(b=>b.onclick=e=>{e.stopPropagation();const control=String(b.dataset.calendarResearch||'').trim();if(control&&typeof openResearchDetail==='function')openResearchDetail(control)});
  document.querySelectorAll('[data-research-call-script]').forEach(b=>b.onclick=e=>{e.stopPropagation();const control=String(b.dataset.researchCallScript||'').trim();if(control&&typeof openResearchCallScript==='function')openResearchCallScript(control)});
  $$('[data-calendar-year]').forEach(b=>b.onclick=()=>{const year=Number(b.dataset.calendarYear);if(![2026,2027].includes(year))return;state.calendarYear=year;state.search='';syncLocationView();if(year===2027&&!state.annualPlan.loaded&&!state.annualPlan.loading)loadAnnualPlan();render();});
  const cp=$('#calendarOpenPlan');if(cp)cp.onclick=()=>{state.tab='shows';state.showMode='PLAN2027';state.search='';state.showQuickView='NONE';syncLocationView();if(!state.annualPlan.loaded&&!state.annualPlan.loading)loadAnnualPlan();render();};
  const cc=$('#calendarOpenCurrent');if(cc)cc.onclick=()=>{state.tab='shows';state.showMode='CURRENT';state.search='';state.showQuickView='NONE';syncLocationView();render();};
  $$('[data-unlinked-category]').forEach(b=>b.onclick=()=>{state.unlinkedLp.category=b.dataset.unlinkedCategory||'ALL';state.search='';render()});
  const cm=$('#catalogMore');if(cm)cm.onclick=()=>{state.catalogLimit+=60;render()};
  $$('.paymentCard[data-payment]').forEach(c=>c.onclick=()=>openPayment(c.dataset.payment));
  $$('.chip[data-filter]').forEach(c=>c.onclick=()=>{state.filter=c.dataset.filter;render()});
  $$('.chip[data-year]').forEach(c=>c.onclick=()=>{state.yearFilter=c.dataset.year;render()});
  const si=$('#searchInput');if(si)si.oninput=e=>{const pos=e.target.selectionStart??e.target.value.length;state.search=e.target.value;state.showQuickView='NONE';state.catalogLimit=60;render();const next=$('#searchInput');if(next){next.focus({preventScroll:true});try{next.setSelectionRange(pos,pos)}catch{}}};
  $$('.activityItem[data-recon]').forEach(x=>x.onclick=()=>openDetail(x.dataset.recon));
  $$('.conflictChoice').forEach(b=>b.onclick=()=>resolveConflict(b));

}
async function resolveConflict(btn){
const resolution=btn.dataset.resolution,field=btn.dataset.field,mfc=btn.dataset.mfc,run=btn.dataset.run;
  const verb=resolution==='KEEP APP'?'Keep the app value and accept the Sheet as the new baseline?':'Replace the app value with the current Sheet value?';
  if(!confirm(`${fieldLabel(field)} · ${mfc}\n\n${verb}`))return;
  const peers=$$('.conflictChoice').filter(x=>x.dataset.run===run&&x.dataset.mfc===mfc&&x.dataset.field===field);peers.forEach(x=>x.disabled=true);
  try{await callWrite('resolveConflict',{runId:run,mfcId:mfc,fieldName:field,resolution});toast(resolution==='KEEP APP'?'App value kept':'Sheet value applied');await bootstrap();state.tab='control';render();}
  catch(e){toast(e.message);peers.forEach(x=>x.disabled=false)}
}

