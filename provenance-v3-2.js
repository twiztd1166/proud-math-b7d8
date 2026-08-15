const PCM_PROVENANCE=Object.freeze({
  schemaVersion:2,
  appVersion:'2026.08.14-v3.7',
  snapshot:'2026-08-14',
  datasetSha256:'d347c695c7693cb9d0944a492d395f8c23c9d5af54c6a8aad59dc1cdbbf1caf0',
  records:78,
  go:76,
  noGo:2,
  noGoNames:['Punta Gorda','Tarpon Springs']
});
function pcmBuildCommit(){
  const m=location.pathname.match(/\/([0-9a-f]{40})(?:\/|$)/i);
  return m?m[1]:'UNPINNED-HOST';
}
function pcmNewReleaseId(){
  try{if(crypto&&typeof crypto.randomUUID==='function')return crypto.randomUUID()}catch{}
  return 'rel-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12);
}
function pcmSnapshotAgeDays(){
  const d=new Date(PCM_PROVENANCE.snapshot+'T12:00:00');
  if(Number.isNaN(d.getTime()))return null;
  return Math.max(0,Math.floor((Date.now()-d.getTime())/86400000));
}
function pcmSourceDescriptor(raw,index=0){
  try{
    const u=new URL(raw),host=u.hostname.replace(/^www\./,'');
    let ref=u.searchParams.get('nodeId')||u.searchParams.get('section')||decodeURIComponent((u.hash||'').replace(/^#/,''));
    if(!ref){const parts=u.pathname.split('/').filter(Boolean);ref=decodeURIComponent(parts[parts.length-1]||'')}
    ref=String(ref||'').replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim();
    if(/^code of ordinances$/i.test(ref)||/^codes$/i.test(ref)||ref.length<3)ref='';
    return `Official source ${index+1} · ${host}${ref?' · '+ref.slice(0,72):''}`;
  }catch{return `Official source ${index+1}`}
}
function pcmAuthorityRefs(r){
  const text=[r?.why,r?.doFirst,r?.hours,r?.refusal,r?.access,r?.hssEscalation,r?.hangerPlacement,r?.courtesyPlacement].filter(Boolean).join(' ');
  const hits=text.match(/§\s*\d+(?:\.\d+)+(?:\([A-Za-z0-9]+\))*/g)||[];
  return [...new Set(hits.map(x=>x.replace(/\s+/g,'')))].slice(0,10);
}
window.PCM_PROVENANCE=PCM_PROVENANCE;
window.PCM_BUILD_COMMIT=pcmBuildCommit();
window.PCM_DEPLOY_BLOCK_REASON='';