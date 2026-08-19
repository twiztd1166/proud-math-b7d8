import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';

const baseDir = 'canvass-dist';
const outDir = 'performance-dist';
const sourceIndex = path.join(baseDir, 'index.html');

if (!fs.existsSync(sourceIndex)) throw new Error('Build canvass-dist before building the native Performance bundle');
fs.rmSync(outDir, { recursive: true, force: true });
fs.cpSync(baseDir, outDir, { recursive: true });

let index = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
if (index.includes('performance-native-app.js') || index.includes('id="nPerf"')) throw new Error('Base Canvass bundle unexpectedly already contains native Performance integration');

index = index
  .replace('apple-mobile-web-app-title" content="Canvass Manager"', 'apple-mobile-web-app-title" content="Paradise Performance"')
  .replace('<title>Paradise Canvass Manager</title>', '<title>Paradise Performance</title>')
  .replace('<b>Canvass Manager</b>', '<b>Paradise Performance</b>')
  .replace('</head>', '<link rel="stylesheet" href="performance-native.css"></head>')
  .replace('<nav class="nav">', '<nav class="nav"><button id="nPerf" type="button"><b>◆</b>Performance</button>')
  .replace('</body>', '<script type="module" src="performance-native-app.js"></script></body>');

for (const required of ['Paradise Performance', 'performance-native.css', 'id="nPerf"', 'performance-native-app.js']) {
  if (!index.includes(required)) throw new Error(`Native Performance index injection failed: ${required}`);
}
fs.writeFileSync(path.join(outDir, 'index.html'), index);
fs.copyFileSync('performance/client/performance-native-app.css', path.join(outDir, 'performance-native.css'));

await build({
  entryPoints: ['performance/client/performance-native-app.mjs'],
  outfile: path.join(outDir, 'performance-native-app.js'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['safari16.4', 'chrome120'],
  minify: false,
  sourcemap: false,
  treeShaking: true,
  legalComments: 'none',
});

for (const file of ['index.html', 'performance-native.css', 'performance-native-app.js']) {
  const target = path.join(outDir, file);
  if (!fs.existsSync(target) || fs.statSync(target).size === 0) throw new Error(`Native Performance bundle missing ${file}`);
}

const bundle = fs.readFileSync(path.join(outDir, 'performance-native-app.js'), 'utf8');
for (const required of [
  'START MY DAY',
  'FINISH DAY',
  'performance-enrollment-redeem',
  'PerformanceLocation',
  'PerformanceSecureStorage',
  'performance_location_points',
  'performance_events',
]) {
  if (!bundle.includes(required)) throw new Error(`Native Performance bundle missing runtime control: ${required}`);
}
for (const forbidden of ['service_role', 'SUPABASE_SERVICE_ROLE_KEY', 'performance_sets\").insert']) {
  if (bundle.includes(forbidden)) throw new Error(`Native Performance bundle contains forbidden material: ${forbidden}`);
}

console.log(`Built controlled native Performance bundle in ${outDir}; public ${baseDir} remained unchanged.`);
