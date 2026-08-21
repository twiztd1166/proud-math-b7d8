import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';

const baseDir = 'canvass-dist';
const outDir = 'performance-web-dist';
const sourceIndex = path.join(baseDir, 'index.html');
const WEB_JS = 'performance-web-app.js';
const WEB_CSS = 'performance-web.css';

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function assertNoPrivilegedSupabaseCredentialValue(text, label) {
  if (/sb_secret_[A-Za-z0-9_-]{20,}/.test(text)) throw new Error(`${label} contains a Supabase secret-key value`);
  const jwtPattern = /\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;
  for (const token of text.match(jwtPattern) || []) {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
      if (payload?.role === 'service_role') throw new Error(`${label} contains a service-role JWT literal`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('service-role JWT literal')) throw error;
    }
  }
}

if (!fs.existsSync(sourceIndex)) throw new Error('Build canvass-dist before building Paradise Performance Web Interim');
const baseIndexBefore = fs.readFileSync(sourceIndex, 'utf8');
const baseIndexHash = sha256(baseIndexBefore);

fs.rmSync(outDir, { recursive: true, force: true });
fs.cpSync(baseDir, outDir, { recursive: true });

let index = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
if (index.includes(WEB_JS) || index.includes('id="nPerf"')) throw new Error('Base Canvass bundle unexpectedly already contains web Performance integration');
index = index
  .replace('apple-mobile-web-app-title" content="Canvass Manager"', 'apple-mobile-web-app-title" content="Paradise Performance"')
  .replace('<title>Paradise Canvass Manager</title>', '<title>Paradise Performance — Web Interim</title>')
  .replace('<b>Canvass Manager</b>', '<b>Paradise Performance</b>')
  .replace('</head>', `<link rel="stylesheet" href="${WEB_CSS}"></head>`)
  .replace('<nav class="nav">', '<nav class="nav"><button id="nPerf" type="button"><b>◆</b>Performance</button>')
  .replace('</body>', `<script type="module" src="${WEB_JS}"></script></body>`);
for (const required of ['Paradise Performance', 'Web Interim', WEB_CSS, 'id="nPerf"', WEB_JS]) {
  if (!index.includes(required)) throw new Error(`Web Performance index injection failed: ${required}`);
}
fs.writeFileSync(path.join(outDir, 'index.html'), index);
fs.copyFileSync('performance/client/performance-web-app.css', path.join(outDir, WEB_CSS));

const manifestPath = path.join(outDir, 'manifest.webmanifest');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.name = 'Paradise Performance';
manifest.short_name = 'Performance';
manifest.description = 'Paradise Performance web interim for authorized Paradise team members.';
manifest.display = 'standalone';
manifest.start_url = './';
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

await build({
  entryPoints: ['performance/client/performance-web-app.mjs'],
  outfile: path.join(outDir, WEB_JS),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['safari16.4', 'chrome120'],
  minify: false,
  sourcemap: false,
  treeShaking: true,
  legalComments: 'none',
});

const swPath = path.join(outDir, 'sw.js');
let sw = fs.readFileSync(swPath, 'utf8');
if (!sw.includes(`'./${WEB_JS}'`) || !sw.includes(`'./${WEB_CSS}'`)) {
  sw = sw.replace(/const CORE=\[(.*?)\];/s, (whole, body) => {
    const additions = [`'./${WEB_JS}'`, `'./${WEB_CSS}'`].filter(item => !body.includes(item));
    if (!additions.length) return whole;
    const joiner = body.trim().endsWith(',') || !body.trim() ? '' : ',';
    return `const CORE=[${body}${joiner}${additions.join(',')}];`;
  });
}
if (!sw.includes(`'./${WEB_JS}'`) || !sw.includes(`'./${WEB_CSS}'`)) throw new Error('Unable to add web interim assets to service-worker CORE');
fs.writeFileSync(swPath, sw);

for (const file of ['index.html', 'manifest.webmanifest', 'sw.js', WEB_CSS, WEB_JS, 'plain-data.js']) {
  const target = path.join(outDir, file);
  if (!fs.existsSync(target) || fs.statSync(target).size === 0) throw new Error(`Web Performance bundle missing ${file}`);
}

const bundle = fs.readFileSync(path.join(outDir, WEB_JS), 'utf8');
for (const required of [
  'START MY DAY',
  'FINISH DAY',
  'CAPTURE LOCATION NOW',
  'performance-enrollment-redeem',
  'web-test',
  'web-foreground-sample',
  'performance_location_points',
  'performance_events',
]) {
  if (!bundle.includes(required)) throw new Error(`Web Performance bundle missing runtime control: ${required}`);
}
if (/\.watchPosition\s*\(/.test(bundle)) throw new Error('Web interim bundle must not enable continuous browser location tracking');
if (bundle.includes('performance_sets')) throw new Error('Web interim bundle contains dormant customer SET transport material');
assertNoPrivilegedSupabaseCredentialValue(bundle, 'Web Performance bundle');

const builtData = fs.readFileSync(path.join(outDir, 'plain-data.js'), 'utf8');
for (const required of ['"goCount":76', '"noGoCount":2']) {
  if (!builtData.includes(required)) throw new Error(`Web interim field baseline missing ${required}`);
}
if (sha256(fs.readFileSync(sourceIndex, 'utf8')) !== baseIndexHash) throw new Error('Web interim builder mutated canvass-dist/index.html');

console.log(`Built isolated Paradise Performance Web Interim in ${outDir}; base Canvass index remained byte-identical.`);