const PCM_BUILD_VERSION=window.PCM_PROVENANCE?.appVersion||'2026.08.14-v3.2';
const PCM_LATEST_META='https://raw.githubusercontent.com/twiztd1166/proud-math-b7d8/paradise-canvass-manager-public/latest.json';
let pcmLatest=null,pcmDeferredInstall=null;
function pcmStandalone(){return window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true}
function pcmVersionParts(v=''){const m=String(v).match(/^(\d{4})\.(\d{2})\.(\d{2})-v(\d+)(?:\.(\d+))?/);return m?m.slice(1).map(Number):null}
function pcmIsNewerVersion(candidate,current=PCM_BUILD_VERSION){const a=pcmVersionParts(candidate),b=pcmVersionParts(current);if(!a||!b)return false;for(let i=0;i<Math.max(a.length,b.length);i++){const x=a[i]||0,y=b[i]||0;if(x!==y)return x>y}return false}
function pcmValidatedDataUpdate(){return!!(pcmLatest&&pcmLatest.validated===true&&pcmLatest.datasetSha256&&pcmLatest.datasetSha256!==window.PCM_PROVENANCE?.datasetSha256)}
function pcmApplyDeployBlock(){window.PCM_DEPLOY_BLOCK_REASON=pcmValidatedDataUpdate()?'A newer validated controlled register is available. Update the app before any new DEPLOY decision.':''}
function pcmHealth(){
  const el=document.getElementById('appHealth');if(!el)return;
  const online=navigator.onLine,age=typeof pcmSnapshotAgeDays==='function'?pcmSnapshotAgeDays():null;
  const newerCode=pcmLatest&&pcmLatest.validated===true&&pcmIsNewerVersion(pcmLatest.version),newerData=pcmValidatedDataUpdate(),stale=age!==null&&age>30;
  el.className='appHealth '+(online?'online':'offline')+(newerCode?' update':'')+(newerData?' dataUpdate':'')+(stale&&!newerData?' stale':'');
  const ageText=age===null?'':` · ${age}d`;
  el.innerHTML=`<span class="healthNet">${online?'● ONLINE':'● OFFLINE'}</span><span>Snapshot ${esc(db?.meta?.snapshotDate||'—')}${ageText}</span><span>${esc(PCM_BUILD_VERSION)}</span>${newerData?'<span class="healthBlock">DEPLOY BLOCKED — VALIDATED DATA UPDATE</span>':''}${newerCode||newerData?`<a href="${esc(pcmLatest.url||'#')}" class="healthUpdate">UPDATE AVAILABLE</a>`:''}${!pcmStandalone()?'<button id="installApp" class="healthInstall">INSTALL</button>':''}`;
  const b=document.getElementById('installApp');if(b)b.onclick=pcmInstall;
}
async function pcmInstall(){
  if(pcmDeferredInstall){pcmDeferredInstall.prompt();try{await pcmDeferredInstall.userChoice}catch{}pcmDeferredInstall=null;pcmHealth();return}
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  const msg=ios?'On iPhone: tap the Share button in Safari, choose “Add to Home Screen,” then tap Add.':'Use your browser menu and choose Install app / Add to Home Screen.';
  pcmShowInstall(msg);
}
function pcmShowInstall(text){
  let old=document.getElementById('installSheet');if(old)old.remove();
  let d=document.createElement('div');d.id='installSheet';d.className='installSheet';d.innerHTML=`<div class="installCard"><div class="logo installLogo">P</div><h3>Add Canvass Manager</h3><p>${esc(text)}</p><button class="btn primary" id="closeInstall">GOT IT</button></div>`;document.body.appendChild(d);document.getElementById('closeInstall').onclick=()=>d.remove();d.onclick=e=>{if(e.target===d)d.remove()};
}
async function pcmCheckLatest(){
  if(!navigator.onLine){pcmApplyDeployBlock();pcmHealth();return}
  try{let r=await fetch(PCM_LATEST_META+'?t='+Date.now(),{cache:'no-store'});if(r.ok){let x=await r.json();if(x&&x.validated===true)pcmLatest=x}}catch{}
  const before=currentDeployBlock();pcmApplyDeployBlock();pcmHealth();
  if(before!==currentDeployBlock()&&typeof render==='function')render();
}
async function pcmRegisterSW(){
  if(!('serviceWorker'in navigator))return pcmHealth();
  try{await navigator.serviceWorker.register('./sw.js');await navigator.serviceWorker.ready}catch(e){console.warn('SW',e)}
  pcmHealth();
}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();pcmDeferredInstall=e;pcmHealth()});
window.addEventListener('appinstalled',()=>{pcmDeferredInstall=null;pcmHealth()});
window.addEventListener('online',()=>{pcmHealth();pcmCheckLatest()});
window.addEventListener('offline',pcmHealth);
window.PCM_BUILD_VERSION=PCM_BUILD_VERSION;
setTimeout(()=>{pcmApplyDeployBlock();pcmHealth();pcmRegisterSW();pcmCheckLatest()},80);
