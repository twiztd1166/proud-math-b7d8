const CACHE='pcm-field-v3-10-2026-08-14';
const CORE=['./','./index.html','./style.css','./style-v2.css','./pwa-v3.css','./hardening-v3-2.css','./plain-data.js','./provenance-v3-2.js','./core-v2.js','./lookup-v2.js','./browse-v3.js','./release-v2a.js','./history-v2.js','./release-v2b.js','./pwa-v3.js','./field-v36.js','./field-v37.js','./boot-v2.js','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('pcm-field-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(r=>{let x=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',x));return r}).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{if(r&&r.ok){let x=r.clone();caches.open(CACHE).then(c=>c.put(req,x))}return r})));
});