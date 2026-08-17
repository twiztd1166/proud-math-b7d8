import {test,expect} from '@playwright/test';

test('service worker redteam7 only refreshes offline shell from exact queryless app entry',async({page})=>{
  await page.goto('/index.html');
  const sw=await page.evaluate(()=>fetch('/sw.js').then(r=>r.text()));
  expect(sw).toMatch(/const CACHE='[^']*trainingux5-experience3-redteam7';/);
  expect(sw).toContain("isAppEntry=(url.pathname===appIndex.pathname||url.pathname===appRoot.pathname)&&url.search==='' ".trim());
  expect(sw).toContain("if(isAppEntry&&r.ok&&html)");
  expect(sw).toContain("if(url.origin!==self.location.origin)return");
  expect(sw).not.toMatch(/drive\.google\.com|googleusercontent\.com/i);
});
