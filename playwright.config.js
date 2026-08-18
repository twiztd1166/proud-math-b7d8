import {defineConfig,devices} from '@playwright/test';
const iphone=devices['iPhone 13'];
export default defineConfig({
  testDir:'./tests',
  timeout:45000,
  retries:1,
  reporter:'line',
  use:{baseURL:'http://127.0.0.1:4173',serviceWorkers:'allow',trace:'retain-on-failure'},
  projects:[
    {name:'webkit-iphone',use:{...iphone}},
    {name:'webkit-small-iphone',use:{...iphone,viewport:{width:320,height:568}}},
    {name:'webkit-iphone-landscape',use:{...iphone,viewport:{width:844,height:390}}},
    {name:'webkit-ipad',use:{browserName:'webkit',viewport:{width:820,height:1180},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'}},
    {name:'chromium-android',use:{browserName:'chromium',channel:'chromium',viewport:{width:393,height:852},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36'}}
  ]
});
