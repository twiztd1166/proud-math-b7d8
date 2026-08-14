import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
  testDir:'./tests',
  timeout:45000,
  retries:1,
  reporter:'line',
  use:{baseURL:'http://127.0.0.1:4173',serviceWorkers:'allow',trace:'retain-on-failure'},
  projects:[{name:'webkit-iphone',use:{...devices['iPhone 13']}}]
});
