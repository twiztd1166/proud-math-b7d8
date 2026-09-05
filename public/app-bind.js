function render(){
  persistShowViewState();
  $('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===state.tab));
  $('#content').innerHTML=state.tab==='today'?renderToday():state.tab==='shows'?renderShows():state.tab==='payments'?renderPayments():renderControl();bindDynamic();
}
function bindDynamic(){
  $('.card[data-id]').forEach(c=>c.onclick=()=>openDetail(c.dataset.id));
  $('.catalogCard[data-profile]').forEach(c=>c.onclick=()=>openCatalog(c.dataset.profile));
  $('[data-show-mode]').forEach(b=>b.onclick=()=>{state.showMode=b.dataset.showMode;state.search='';state.showQuickView='NONE';state.catalogLimit=60;if(state.showMode==='ALL'&&!state.catalogLoaded)loadCatalog();render()});
  $('[data-quick-view]').forEach(b=>b.onclick=()=>applyQuickView(b.dataset.quickView));
  $$('.activeFilterChip[data-active-filter-key]').forEach(b=>b.onclick=()=>removeActiveShowFilter(b.dataset.activeFilterKey));
  const sf=$('#showFilterBtn');if(sf)sf.onclick=openShowFilters;
  const ss=$('#showSortSelect');if(ss)ss.onchange=()=>{state.showQuickView='NONE';if(state.showMode==='ALL')state.catalogSort=ss.value;else state.currentSort=ss.value;state.catalogLimit=60;render()};
  const sr=$('#showResetBtn');if(sr)sr.onclick=resetShowView;
  const cr=$('#catalogRetry');if(cr)cr.onclick=()=>loadCatalog(true);
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
  try{await call('resolveConflict',{runId:run,mfcId:mfc,fieldName:field,resolution});toast(resolution==='KEEP APP'?'App value kept':'Sheet value applied');await bootstrap();state.tab='control';render();}
  catch(e){toast(e.message);peers.forEach(x=>x.disabled=false)}
}

