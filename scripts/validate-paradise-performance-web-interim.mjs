import fs from 'node:fs';
import path from 'node:path';

const built = process.argv.includes('--built');
const root = built ? 'performance-web-dist' : '.';

function read(rel) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) throw new Error(`Missing ${built ? 'built ' : ''}${rel}`);
  return fs.readFileSync(file, 'utf8');
}

const sourceApp = fs.readFileSync('performance/client/performance-web-app.mjs', 'utf8');
const sourceLocation = fs.readFileSync('performance/client/performance-web-location.mjs', 'utf8');
const builder = fs.readFileSync('scripts/build-performance-web-site.mjs', 'utf8');

for (const required of [
  "platform: 'web-test'",
  'validateTrustedDeviceSession',
  'performance_devices',
  'Paradise Performance Web Interim',
  'RESUME LIVE GPS',
  'CLEAR WEB ACCESS',
]) if (!sourceApp.includes(required)) throw new Error(`Web interim source missing control: ${required}`);

for (const required of [
  'getCurrentPosition',
  'watchPosition',
  'clearWatch',
  'wakeLock',
  'WEB_FOREGROUND_CONTINUOUS',
  'WEB_FOREGROUND_PAUSED',
  'continuousBackgroundTracking: false',
  'visibilitychange',
  'web-foreground-watch',
]) {
  if (!sourceLocation.includes(required)) throw new Error(`Web location source missing control: ${required}`);
}
for (const prohibited of ['service_role', 'sb_secret_', 'ACCESS_BACKGROUND_LOCATION']) {
  if (sourceApp.includes(prohibited) || sourceLocation.includes(prohibited)) throw new Error(`Web interim client contains prohibited privileged/background marker: ${prohibited}`);
}
if (!builder.includes("outDir = 'performance-web-dist'")) throw new Error('Web builder must remain isolated from canvass-dist');
if (!builder.includes('base Canvass index remained byte-identical')) throw new Error('Web builder must verify public Canvass isolation');

if (built) {
  const index = read('index.html');
  const manifest = JSON.parse(read('manifest.webmanifest'));
  const sw = read('sw.js');
  const bundle = read('performance-web-app.js');
  const data = read('plain-data.js');

  for (const required of ['Paradise Performance — Web Interim', 'id="nPerf"', 'performance-web.css', 'performance-web-app.js']) {
    if (!index.includes(required)) throw new Error(`Built web index missing ${required}`);
  }
  if (manifest.name !== 'Paradise Performance' || manifest.short_name !== 'Performance' || manifest.display !== 'standalone') {
    throw new Error('Built web manifest is not the controlled Paradise Performance PWA manifest');
  }
  for (const asset of ["'./performance-web-app.js'", "'./performance-web.css'"]) {
    if (!sw.includes(asset)) throw new Error(`Service worker CORE missing ${asset}`);
  }
  for (const required of [
    'web-test',
    'web-foreground-sample',
    'web-foreground-watch',
    'watchPosition',
    'wakeLock',
    'WEB_FOREGROUND_CONTINUOUS',
    'START MY DAY',
    'FINISH DAY',
    'RESUME LIVE GPS',
  ]) {
    if (!bundle.includes(required)) throw new Error(`Built web bundle missing ${required}`);
  }
  if (/sb_secret_[A-Za-z0-9_-]{20,}/.test(bundle)) throw new Error('Built web bundle contains Supabase secret-key material');
  if (bundle.includes('performance_sets')) throw new Error('Built web bundle contains dormant customer SET material');
  for (const required of ['"goCount":76', '"noGoCount":2', '"recordCount":78']) {
    if (!data.includes(required)) throw new Error(`Built field baseline missing ${required}`);
  }
}

console.log(`Paradise Performance Web Interim ${built ? 'built ' : ''}validation PASS`);
