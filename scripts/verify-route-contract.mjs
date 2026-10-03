import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync('public/app-core.js','utf8');
const start=source.indexOf('function applyLocationView(){');
const end=source.indexOf('function appRequestHeaders(){',start);
assert.ok(start>=0&&end>start,'router block not found in public/app-core.js');
const routerSource=source.slice(start,end);

function harness(hash='#today'){
  const listeners={};
  const calls={render:0,catalog:0,annual:0,unlinked:0,open:[],scroll:0,replace:[]};
  const state={
    tab:'today',
    showMode:'ALL',
    calendarYear:2026,
    deepLinkedProfile:null,
    deepLinkedYear:null,
    deepLinkRenderedProfile:null,
    catalogLoaded:false,
    catalogLoading:false,
    unlinkedLp:{loaded:false,loading:false},
    annualPlan:{loaded:false,loading:false,rows:[]},
  };
  const location={hash};
  const detailModal={classList:{contains:()=>false}};
  const sandbox={
    state,
    location,
    history:{replaceState(_a,_b,url){
      calls.replace.push(String(url));
      if(String(url).startsWith('#'))location.hash=String(url);
    }},
    window:{
      addEventListener(name,fn){listeners[name]=fn},
      scrollTo(){calls.scroll++},
    },
    document:{querySelector(sel){return sel==='#detailModal'?detailModal:null}},
    render(){calls.render++},
    loadCatalog(){calls.catalog++;state.catalogLoading=true},
    loadUnlinkedLp(){calls.unlinked++;state.unlinkedLp.loading=true},
    loadAnnualPlan(){calls.annual++;state.annualPlan.loading=true},
    openCatalog(id,year){calls.open.push([id,year??null])},
    console,
  };
  vm.createContext(sandbox);
  vm.runInContext(routerSource,sandbox,{filename:'app-core-router.js'});
  return {sandbox,state,location,listeners,calls};
}

function invoke(h,expr){return vm.runInContext(expr,h.sandbox)}

{
  const h=harness('#show/PROSPECT-BOCA-CITY-SEAFOOD-FEST');
  assert.equal(h.state.tab,'shows','cold prospect route must select Shows');
  assert.equal(h.state.showMode,'ALL','cold prospect route must use all-show detail mode');
  assert.equal(h.state.deepLinkedProfile,'PROSPECT-BOCA-CITY-SEAFOOD-FEST','cold prospect route must parse PROSPECT-* ids');
  assert.equal(h.state.deepLinkedYear,null,'prospect route without /year must preserve null year');
  invoke(h,'ensureActiveRouteData()');
  assert.equal(h.calls.annual,1,'cold prospect route must force annual-plan loading');
  h.state.annualPlan.loaded=true;
  h.state.annualPlan.loading=false;
  invoke(h,'openDeepLinkedProfileIfReady()');
  assert.deepEqual(h.calls.open,[['PROSPECT-BOCA-CITY-SEAFOOD-FEST',null]],'prospect detail must open when annual plan is ready even without catalog readiness');
  invoke(h,'syncLocationView()');
  assert.equal(h.location.hash,'#show/PROSPECT-BOCA-CITY-SEAFOOD-FEST','null prospect year must not serialize as /year/0');
}

{
  const h=harness('#today');
  assert.equal(typeof h.listeners.hashchange,'function','router must register an in-session hashchange listener');

  h.location.hash='#calendar/2027';
  h.listeners.hashchange();
  assert.equal(h.state.tab,'calendar','warm hash change must update tab');
  assert.equal(h.state.calendarYear,2027,'warm hash change must update calendar year');
  assert.equal(h.calls.annual,1,'warm 2027 route must trigger annual-plan loading');
  assert.ok(h.calls.render>=1,'warm hash change must re-render');

  h.state.annualPlan.loaded=true;
  h.state.annualPlan.loading=false;
  h.location.hash='#control';
  h.listeners.hashchange();
  assert.equal(h.state.tab,'control','second warm hash change must update state again');

  h.state.annualPlan.loaded=false;
  h.state.annualPlan.loading=false;
  h.location.hash='#show/PROSPECT-BOCA-CITY-SEAFOOD-FEST';
  h.listeners.hashchange();
  assert.equal(h.state.deepLinkedProfile,'PROSPECT-BOCA-CITY-SEAFOOD-FEST','warm prospect hash must parse');
  assert.equal(h.calls.annual,2,'warm prospect hash must request annual-plan data');

  h.state.annualPlan.loaded=true;
  h.state.annualPlan.loading=false;
  invoke(h,'openDeepLinkedProfileIfReady()');
  assert.deepEqual(h.calls.open.at(-1),['PROSPECT-BOCA-CITY-SEAFOOD-FEST',null],'warm prospect route must open prospect detail after annual data arrives');

  h.state.catalogLoaded=false;
  h.state.catalogLoading=false;
  h.location.hash='#show/LIFE-009/year/2025';
  h.listeners.hashchange();
  assert.equal(h.state.deepLinkedProfile,'LIFE-009','warm historical hash must parse');
  assert.equal(h.state.deepLinkedYear,2025,'warm historical hash must preserve explicit year');
  assert.ok(h.calls.catalog>=1,'warm historical route must request catalog data');
  h.state.catalogLoaded=true;
  h.state.catalogLoading=false;
  invoke(h,'openDeepLinkedProfileIfReady()');
  assert.deepEqual(h.calls.open.at(-1),['LIFE-009',2025],'historical detail must open once catalog is ready');
}

console.log(JSON.stringify({
  route_contract:'PASS',
  cold_prospect:'PASS',
  warm_hash_sync:'PASS',
  lazy_route_data:'PASS',
  null_year_serialization:'PASS',
}));
