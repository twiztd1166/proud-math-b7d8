const API='https://taxlrlfsobtnbasjcnuf.supabase.co/functions/v1/shows-api';
const SHEET='https://docs.google.com/spreadsheets/d/1Fyyypme7AYFEUwLbIPPNaixYR7Lwiwegs2hRTu02wYk/edit';
let state={
  shows:[],payments:[],activity:[],settings:{},
  reconciliation:{summary:{rows:0,aligned:0,changed:0,changed_fields:0},rows:[]},
  sourceRefresh:{latest:null,conflicts:[]},recoveryHealth:null,
  catalog:[],catalogSummary:null,catalogLoaded:false,catalogLoading:false,catalogError:null,catalogLimit:60,deepLinkedProfile:null,
  unlinkedLp:{annual:[],cumulative:[],summary:null,category:'ALL',loaded:false,loading:false,error:null},
  showMode:'ALL',tab:'today',search:'',showQuickView:'NONE',
  catalogSort:'RECOMMENDED',
  catalogFilters:{
    profileState:'ALL',historyYear:'ALL',lpYear:'ALL',cumulativeLpYear:'ALL',tier:'ALL',historyDepth:'ALL',
    contact:'ANY',booth:'ANY',cost:'ANY',com:'ANY',performance:'ANY',lp:'ANY',cumulativeLp:'ANY',coi:'ANY',worked:'ANY',
    comBand:'ALL',lifetimeNetBand:'ALL',
    currentStatus:'ALL',currentTreatment:'ALL',confirmation:'ALL',currentEventYear:'ALL',
  },
  currentSort:'PRIORITY',
  currentFilters:{
    status:'ALL',treatment:'IN PLAY',eventYear:'ALL',timing:'ALL',
    confirmation:'ALL',owner:'ALL',evidence:'ALL',payment:'ALL',costBand:'ALL',followUp:'ANY',
  },
};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function isLpSourceOnly(p){
  return Array.isArray(p?.source_rows)&&p.source_rows.some(r=>r&&r.source_kind==='LP_SOURCE_ONLY');
}

const SHOW_VIEW_STORAGE='paradise-shows-view-v1';
const SHOW_SEARCH_SESSION='paradise-shows-search-v1';
const SHOW_CATALOG_FILTER_KEYS=['profileState','historyYear','lpYear','cumulativeLpYear','tier','historyDepth','contact','booth','cost','com','performance','lp','cumulativeLp','coi','worked','comBand','lifetimeNetBand','currentStatus','currentTreatment','confirmation','currentEventYear'];
const SHOW_CURRENT_FILTER_KEYS=['status','treatment','eventYear','timing','confirmation','owner','evidence','payment','costBand','followUp'];
const SHOW_CATALOG_SORTS=['RECOMMENDED','CURRENT_FIRST','NAME_ASC','NAME_DESC','LATEST_HISTORY','HISTORY_DEPTH','HISTORY_RECORDS','OCCURRENCES','WORKED_YEARS','LOWEST_COM','HIGHEST_COM','LIFETIME_NET','LIFETIME_SALES','CLOSE_VOLUME','ISSUED','NET_2025','NET_2024','DATA_COMPLETE','MISSING_DATA'];
const SHOW_CURRENT_SORTS=['PRIORITY','EVENT_ASC','EVENT_DESC','ACTION_DUE','STATUS','COST_LOW','COST_HIGH','NAME_ASC','NAME_DESC','OWNER','CONFIRMATION','EVIDENCE','PAYMENT'];
const SHOW_QUICK_VIEWS=['NONE','ALL_TOP_NET','ALL_LOW_COM','ALL_MISSING','ALL_HIST_ONLY','ALL_LP_SOURCE_ONLY','ALL_CURRENT_LINKED','CURRENT_IN_PLAY','CURRENT_DUE7','CURRENT_EVIDENCE','CURRENT_NO_DATE','CURRENT_COST_HIGH'];

function persistedString(v,max=120){return typeof v==='string'?v.slice(0,max):null}
function restoreShowViewState(){
  try{
    const raw=localStorage.getItem(SHOW_VIEW_STORAGE);
    const saved=raw?JSON.parse(raw):null;
    if(saved&&saved.v===1){
      if(['ALL','CURRENT','UNLINKED'].includes(saved.showMode))state.showMode=saved.showMode;
      if(SHOW_QUICK_VIEWS.includes(saved.showQuickView))state.showQuickView=saved.showQuickView;
      if(state.showQuickView.startsWith('ALL_')&&state.showMode!=='ALL')state.showQuickView='NONE';
      if(state.showQuickView.startsWith('CURRENT_')&&state.showMode!=='CURRENT')state.showQuickView='NONE';
      if(state.showMode==='UNLINKED')state.showQuickView='NONE';
      if(SHOW_CATALOG_SORTS.includes(saved.catalogSort))state.catalogSort=saved.catalogSort;
      if(SHOW_CURRENT_SORTS.includes(saved.currentSort))state.currentSort=saved.currentSort;
      if(saved.catalogFilters&&typeof saved.catalogFilters==='object'){
        for(const key of SHOW_CATALOG_FILTER_KEYS){
          const value=persistedString(saved.catalogFilters[key]);
          if(value!==null)state.catalogFilters[key]=value;
        }
      }
      if(saved.currentFilters&&typeof saved.currentFilters==='object'){
        for(const key of SHOW_CURRENT_FILTER_KEYS){
          const value=persistedString(saved.currentFilters[key]);
          if(value!==null)state.currentFilters[key]=value;
        }
      }
    }
  }catch{}
  try{
    const search=sessionStorage.getItem(SHOW_SEARCH_SESSION);
    if(search!==null)state.search=search.slice(0,240);
  }catch{}
}
function persistShowViewState(){
  try{
    localStorage.setItem(SHOW_VIEW_STORAGE,JSON.stringify({
      v:1,
      showMode:state.showMode,
      showQuickView:state.showQuickView,
      catalogSort:state.catalogSort,
      currentSort:state.currentSort,
      catalogFilters:Object.fromEntries(SHOW_CATALOG_FILTER_KEYS.map(key=>[key,state.catalogFilters[key]])),
      currentFilters:Object.fromEntries(SHOW_CURRENT_FILTER_KEYS.map(key=>[key,state.currentFilters[key]])),
    }));
  }catch{}
  try{sessionStorage.setItem(SHOW_SEARCH_SESSION,String(state.search||'').slice(0,240))}catch{}
}
restoreShowViewState();
function applyLocationView(){
  const raw=String(location.hash||'').replace(/^#/,'');
  const hash=raw.toLowerCase();
  const profileMatch=raw.match(/^show\/((?:LIFE|HIST|CURRENT)-\d{3}|LPONLY-\d{4}-\d{3})$/i);
  if(profileMatch){state.tab='shows';state.showMode='ALL';state.deepLinkedProfile=profileMatch[1].toUpperCase()}
  else if(hash==='shows'){state.tab='shows';state.showMode='ALL';state.deepLinkedProfile=null}
  else if(hash==='current'){state.tab='shows';state.showMode='CURRENT';state.deepLinkedProfile=null}
  else if(hash==='unlinked'){state.tab='shows';state.showMode='UNLINKED';state.deepLinkedProfile=null}
  else if(['today','payments','control'].includes(hash)){state.tab=hash;state.deepLinkedProfile=null}
}
function syncLocationView(){
  const hash=state.deepLinkedProfile
    ?'show/'+state.deepLinkedProfile
    :(state.tab==='shows'
      ?(state.showMode==='CURRENT'?'current':state.showMode==='UNLINKED'?'unlinked':'shows')
      :state.tab);
  try{history.replaceState(null,'','#'+hash)}catch{}
}
applyLocationView();

async function call(action,payload={}){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),15000);
  try{
    const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...payload}),signal:controller.signal});
    const j=await r.json().catch(()=>({ok:false,error:'Invalid response'}));
    if(!r.ok||!j.ok) throw new Error(j.error||'Request failed');
    return j;
  }catch(e){
    if(e&&e.name==='AbortError')throw new Error('Request timed out. Tap Reload to try again.');
    throw e;
  }finally{clearTimeout(timer)}
}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
function esc(v){return String(v??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
function money(v){if(v===null||v===undefined||v==='')return '—';const n=Number(v);return Number.isFinite(n)?n.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}):v}
function date(v){if(!v)return '—';const d=new Date(v+'T12:00:00');return isNaN(d)?v:d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
function badgeClass(s){return ({'RECONCILE':'reconcile','DATE ONLY':'dateonly','HOLD':'hold','READY':'ready','OPEN':'open'})[s]||'hold'}
function daysFromToday(v){if(!v)return null;const t=new Date();t.setHours(0,0,0,0);const d=new Date(v+'T12:00:00');return Math.round((d-t)/86400000)}
function dueClass(v){const n=daysFromToday(v);return n===null?'':n<0?'over':n<=3?'soon':''}
function dueLabel(v){const n=daysFromToday(v);if(n===null)return 'No action date';if(n<0)return `Overdue · ${Math.abs(n)}d`;if(n===0)return 'Today';if(n===1)return 'Tomorrow';return date(v)}
function activeActions(){return state.shows.filter(s=>{const n=daysFromToday(s.action_due);return s.action_due&&s.follow_up&&s.follow_up!=='—'&&s.this_year!=='SKIP THIS YEAR'&&n!==null&&n<=7}).sort((a,b)=>a.action_due.localeCompare(b.action_due))}
function paymentAttention(){return state.payments.filter(p=>p.status!=='PAID'&&(p.due_status==='OVERDUE'||p.due_status==='DUE TODAY'||p.due_status==='DUE ≤7 DAYS'||p.status==='PARTIAL'||p.status==='HOLD / REVIEW')).sort((a,b)=>String(a.due||'9999').localeCompare(String(b.due||'9999')))}
function paymentPill(p){const s=String(p.status||'SCHEDULED');const c=s==='PAID'?'paid':s==='PARTIAL'?'partial':s.includes('HOLD')?'review':'';return `<span class="pill ${c}">${esc(s)}</span>`}
function activityName(a){if(a.kind==='show'){const s=state.shows.find(x=>x.mfc_id===a.mfc_id);return s?`${s.event} · ${a.mfc_id}`:a.mfc_id}const p=state.payments.find(x=>x.payment_id===a.payment_id);return p?`${p.event} · ${p.installment}`:'Payment'}
function fieldLabel(f){return ({show_status:'Status',follow_up:'Next action',owner:'Owner',action_due:'Action due',this_year:'This year',skip_reason:'Skip reason',posted_amount:'Posted amount',posted_date:'Posted date',clearing:'Clearing',payment_owner:'Payment owner',notes:'Operating note',balance:'Balance',status:'Payment status',approval:'Approval',due_status:'Due status',__NEW_SOURCE_ROW__:'New Sheet row',__MISSING_SOURCE_ROW__:'Missing Sheet row',__BASELINE_MISSING__:'Baseline missing'})[f]||f}



async function loadUnlinkedLp(force=false){
  const u=state.unlinkedLp;
  if(u.loading||(!force&&u.loaded))return;
  u.loading=true;u.error=null;
  if(state.tab==='shows'&&state.showMode==='UNLINKED')render();
  try{
    const d=await call('catalogUnlinked');
    u.annual=d.annual||[];u.cumulative=d.cumulative||[];u.summary=d.summary||null;if(!state.catalogSummary&&d.run)state.catalogSummary=d.run;u.loaded=true;
  }catch(e){
    u.error=e.message||'Unable to load unlinked LeadPerfection evidence.';
    toast('Unlinked LeadPerfection evidence unavailable');
  }finally{
    u.loading=false;
    if(state.tab==='shows'&&state.showMode==='UNLINKED')render();
  }
}
async function loadCatalog(force=false){
  if(state.catalogLoading||(!force&&state.catalogLoaded))return;
  state.catalogLoading=true;state.catalogError=null;
  if(state.tab==='shows')render();
  try{
    const d=await call('catalog');
    state.catalog=d.profiles||[];state.catalogSummary=d.summary||null;state.catalogLoaded=true;state.catalogLimit=60;
  }catch(e){
    state.catalogError=e.message||'Unable to load full show database.';
    toast('Full show database unavailable');
  }finally{
    state.catalogLoading=false;
    if(state.tab==='shows')render();
    if(state.catalogLoaded&&state.deepLinkedProfile&&typeof openCatalog==='function')openCatalog(state.deepLinkedProfile);
  }
}

async function bootstrap(){
  try{
    const d=await call('bootstrap');state.shows=d.shows;state.payments=d.payments;state.activity=d.activity||[];state.settings=d.settings||{};state.reconciliation=d.reconciliation||{summary:{rows:0,aligned:0,changed:0,changed_fields:0},rows:[]};state.sourceRefresh=d.sourceRefresh||{latest:null,conflicts:[]};state.recoveryHealth=d.recoveryHealth||null;
    const sr=state.sourceRefresh.latest;$('#asOf').textContent=sr?`Operating DB · Sheet checked ${sr.source_as_of}`:`Operating DB · source snapshot ${state.settings.snapshot_as_of||'not set'}`;render();
    if(state.tab==='shows'&&state.showMode==='ALL'&&!state.catalogLoaded&&!state.catalogLoading)loadCatalog();
    if(state.tab==='shows'&&state.showMode==='UNLINKED'&&!state.unlinkedLp.loaded&&!state.unlinkedLp.loading)loadUnlinkedLp();
  }catch(e){toast(e.message);$('#content').innerHTML='<div class="empty">Unable to load current operating data.</div>'}
}

