import {test,expect} from '@playwright/test';

test('service worker redteam6 only refreshes offline shell from exact queryless app entry',async({page})=>{
  await page.goto('/index.html');
  const sw=await page.evaluate(()=>fetch('/sw.js').then(r=>r.text()));
  expect(sw).toContain("trainingux5-experience3-redteam6");
  expect(sw).toContain("isAppEntry=(url.pathname===appIndex.pathname||url.pathname===appRoot.pathname)&&url.search==='' ".trim());
  expect(sw).toContain("if(isAppEntry&&r.ok&&html)");
  expect(sw).toContain("if(url.origin!==self.location.origin)return");
  expect(sw).not.toMatch(/drive\.google\.com|googleusercontent\.com/i);
});

test('service worker core keeps validated field assets and adds only training assets',async({page})=>{
  await page.goto('/index.html');
  const audit=await page.evaluate(async()=>{
    const sw=await fetch('/sw.js').then(r=>r.text());
    const m=sw.match(/const CORE=\[(.*?)\];/s);if(!m)throw new Error('CORE not found');
    const core=[...m[1].matchAll(/'([^']+)'/g)].map(x=>x[1]);
    const field=['./','./index.html','./style.css','./style-v2.css','./pwa-v3.css','./hardening-v3-2.css','./plain-data.js','./provenance-v3-2.js','./core-v2.js','./lookup-v2.js','./browse-v3.js','./release-v2a.js','./history-v2.js','./release-v2b.js','./pwa-v3.js','./field-v36.js','./field-v37.js','./boot-v2.js','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
    const missing=field.filter(x=>!core.includes(x));
    const extras=core.filter(x=>!field.includes(x));
    return{missing,duplicates:core.filter((x,i)=>core.indexOf(x)!==i),badExtras:extras.filter(x=>!/^\.\/training-[^/]+\.(?:js|css)$/.test(x)),extras:extras.length};
  });
  expect(audit.missing).toEqual([]);
  expect(audit.duplicates).toEqual([]);
  expect(audit.badExtras).toEqual([]);
  expect(audit.extras).toBeGreaterThan(0);
});
