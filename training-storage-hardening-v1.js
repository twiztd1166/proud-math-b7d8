(()=>{
  if(typeof renderTraining!=='function')return;
  const VERSION='2026.08.17-pu-storage-hardening-v1';
  const OBJECT_STORES=['puProgress','puQuickChecksV1','puMediaProgressV2','puMediaResume','puPracticeStatsV1','puMediaNotesV1'];
  const plainObject=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
  if(!Array.isArray(window.PU_STORAGE_RECOVERY_LAST))window.PU_STORAGE_RECOVERY_LAST=Object.freeze([]);
  function sanitize(){
    const removed=[];
    for(const key of OBJECT_STORES){
      const raw=localStorage.getItem(key);if(raw==null)continue;
      let parsed;try{parsed=JSON.parse(raw)}catch{parsed=null}
      if(!plainObject(parsed)){try{localStorage.removeItem(key);removed.push(key)}catch{}}
    }
    if(removed.length)window.PU_STORAGE_RECOVERY_LAST=Object.freeze(removed.slice());
    return removed;
  }
  sanitize();
  const baseRender=renderTraining;
  renderTraining=function(){sanitize();return baseRender()};
  if(typeof window.puPlayerOpen==='function'){
    const baseOpen=window.puPlayerOpen;
    window.puPlayerOpen=function(id){sanitize();return baseOpen(id)};
    if(typeof puPlayerOpen==='function')puPlayerOpen=window.puPlayerOpen;
  }
  window.PU_STORAGE_HARDENING_VERSION=VERSION;
  window.puSanitizeTrainingStorage=sanitize;
})();
