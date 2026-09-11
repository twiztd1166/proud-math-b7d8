// Read-only annual-plan adapter. The dedicated annual/history endpoint returns governed geography/category fields.
(()=>{
  const ANNUAL_READ_API='https://taxlrlfsobtnbasjcnuf.supabase.co/functions/v1/shows-history-api';

  async function callAnnualPlanRead(year){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),15000);
    try{
      const response=await fetch(ANNUAL_READ_API,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'annualPlan',year}),
        signal:controller.signal,
      });
      const data=await response.json().catch(()=>({ok:false,error:'Invalid response'}));
      if(!response.ok||!data.ok)throw new Error(data.error||'Request failed');
      return data;
    }catch(error){
      if(error&&error.name==='AbortError')throw new Error('Request timed out. Tap Reload to try again.');
      throw error;
    }finally{clearTimeout(timer)}
  }

  if(typeof window==='undefined')return;
  window.__PARADISE_ANNUAL_READ_TEST__={ANNUAL_READ_API,callAnnualPlanRead};
  window.loadAnnualPlan=async function loadAnnualPlanDirect(force=false){
    const p=state.annualPlan;
    if(p.loading||(!force&&p.loaded))return;
    p.loading=true;p.error=null;
    if(state.tab==='shows'&&state.showMode==='PLAN2027')render();
    try{
      const d=await callAnnualPlanRead(p.year);
      p.rows=d.rows||[];p.summary=d.summary||null;p.run=d.run||null;p.loaded=true;
    }catch(error){
      p.error=error.message||'Unable to load the 2027 annual plan.';
      toast('2027 annual plan unavailable');
    }finally{
      p.loading=false;
      if(state.tab==='shows'&&state.showMode==='PLAN2027')render();
    }
  };
})();
