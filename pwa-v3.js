const PCM_BUILD_VERSION='2026.08.14-v3.1';
const PCM_LATEST_META='https://raw.githubusercontent.com/twiztd1166/proud-math-b7d8/paradise-canvass-manager-public/latest.json';
let pcmLatest=null,pcmDeferredInstall=null;
function pcmStandalone(){return window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true}
function pcmHealth(){
  const el=document.getElementById('appHealth');if(!el)return;
  const online=navigator.onLine;
  const newer=pcmLatest&&pcmLatest.version&&pcmLatest.version!==PCM_BUILD_VERSION;
  el.className='appHealth '+(online?'online':'offline')+(newer?' update':'');
  el.innerHTML=`<span class="healthNet">${online?'● ONLINE':'● OFFLINE'}</span><span>Snapshot ${esc(db?.meta?.snapshotDate||'—')}</span><span>${esc(PCM_BUILD_VERSION)}</span>${newer?`<a href="${esc(pcmLatest.url||'#')}" class="healthUpdate">UPDATE AVAILABLE</a>`:''}${!pcmStandalone()?'<button id="installApp" class="healthInstall">INSTALL</button>':''}`;
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
  if(!navigator.onLine)return pcmHealth();
  try{let r=await fetch(PCM_LATEST_META+'?t='+Date.now(),{cache:'no-store'});if(r.ok)pcmLatest=await r.json()}catch{}
  pcmHealth();
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
setTimeout(()=>{pcmHealth();pcmRegisterSW();pcmCheckLatest()},80);
