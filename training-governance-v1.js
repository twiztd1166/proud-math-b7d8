(()=>{
  const base=window.PU_CONTENT;
  if(!base)return;
  const version=String(base.version||'');
  const publish=x=>({...x,contentStatus:x.contentStatus||'Published',trainingVersion:x.trainingVersion||version,changeClass:x.changeClass||'Training Update'});
  window.PU_CONTENT=Object.freeze({...base,lessons:(base.lessons||[]).map(publish),managerLessons:(base.managerLessons||[]).map(publish),governanceVersion:'2026.08.16-pu-governance-v1'});
})();
