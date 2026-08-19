import fs from 'node:fs';
import path from 'node:path';

const read = file => fs.readFileSync(file, 'utf8');
const requireText = (text, needle, label) => {
  if (!text.includes(needle)) throw new Error(`${label} missing required control: ${needle}`);
};
const forbidText = (text, needle, label) => {
  if (text.includes(needle)) throw new Error(`${label} contains forbidden control: ${needle}`);
};
function assertNoPrivilegedSupabaseCredential(text, label) {
  if (/sb_secret_[A-Za-z0-9_-]{20,}/.test(text)) throw new Error(`${label} contains a Supabase secret-key value`);
  if (/SUPABASE_(?:SERVICE_ROLE|SECRET)_KEY/.test(text)) throw new Error(`${label} contains a privileged Supabase credential environment name`);
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

const config = JSON.parse(read('capacitor.config.json'));
if (config.appId !== 'com.paradiseexteriors.performance') throw new Error(`Unexpected appId: ${config.appId}`);
if (config.appName !== 'Paradise Performance') throw new Error(`Unexpected appName: ${config.appName}`);
if (config.webDir !== 'performance-dist') throw new Error(`Native store shell must use performance-dist, found ${config.webDir}`);

const sourceIndex = read('index.html');
forbidText(sourceIndex, 'performance-native-app.js', 'Public source index');
forbidText(sourceIndex, 'id="nPerf"', 'Public source index');

const builder = read('scripts/build-performance-native-site.mjs');
for (const control of [
  "const baseDir = 'canvass-dist'",
  "const outDir = 'performance-dist'",
  'performance-native-app.js',
  'performance-native.css',
  'id="nPerf"',
  "entryPoints: ['performance/client/performance-native-app.mjs']",
  'bundle: true',
  'treeShaking: true',
  'sb_secret_[A-Za-z0-9_-]{20,}',
  "payload?.role === 'service_role'",
]) requireText(builder, control, 'Native Performance builder');

const entry = read('performance/client/performance-native-app.mjs');
for (const control of [
  "from '@capacitor/core'",
  "from '@supabase/supabase-js'",
  'createNativePerformanceSupabaseOptions',
  'validateNativePerformanceSession',
  'redeemTrustedDevice',
  'createSupabaseOperationalSyncTransport',
  'PerformanceTodayController',
  'mountPerformanceToday',
  'registerCapacitorPerformanceLocation',
  'ensureNativeInstallEnrollmentBoundary',
  "const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_",
  'Capacitor.isNativePlatform()',
  'Performance data never authorizes canvassing',
]) requireText(entry, control, 'Native Performance entrypoint');
for (const forbidden of [
  'service_role',
  'SUPABASE_SERVICE_ROLE_KEY',
  'createSupabaseSyncTransport',
  'customerName',
  'confirmedCustomerAddress',
  'quickSet',
  'ON PACE',
  'BELOW STANDARD',
  'ABOVE STANDARD',
]) forbidText(entry, forbidden, 'Native Performance entrypoint');
assertNoPrivilegedSupabaseCredential(entry, 'Native Performance entrypoint');

const operational = read('performance/client/performance-operational-sync.mjs');
for (const control of [
  "PERFORMANCE_OPERATIONAL_WRITE_KINDS = Object.freeze(['EVENT', 'LOCATION'])",
  "supabase.from('performance_events')",
  "supabase.from('performance_location_points')",
  'does not enable ${String(record?.kind',
]) requireText(operational, control, 'Operational sync transport');
for (const forbidden of ['performance_sets', 'customer_name', 'customer_phone', 'confirmed_customer_address']) {
  forbidText(operational, forbidden, 'Operational sync transport');
}

const storeWorkflow = read('.github/workflows/validate-paradise-native-store-distribution.yml');
for (const control of [
  "SUPABASE_JS_VERSION: '2.112.3'",
  "ESBUILD_VERSION: '0.28.2'",
  'build-performance-native-site.mjs',
  'validate-paradise-native-performance-integration.mjs --built',
  '@supabase/supabase-js@${SUPABASE_JS_VERSION}',
  'esbuild@${ESBUILD_VERSION}',
]) requireText(storeWorkflow, control, 'Native store workflow');

const shellWorkflow = read('.github/workflows/validate-paradise-performance-native.yml');
for (const control of [
  "SUPABASE_JS_VERSION: '2.112.3'",
  "ESBUILD_VERSION: '0.28.2'",
  'build-performance-native-site.mjs',
  'validate-paradise-native-performance-integration.mjs --built',
  '@supabase/supabase-js@${SUPABASE_JS_VERSION}',
  'esbuild@${ESBUILD_VERSION}',
  'npx cap add android',
  'npx cap add ios --packagemanager SPM',
]) requireText(shellWorkflow, control, 'Native shell workflow');

if (process.argv.includes('--built')) {
  const out = config.webDir;
  const builtIndexPath = path.join(out, 'index.html');
  const builtAppPath = path.join(out, 'performance-native-app.js');
  const builtCssPath = path.join(out, 'performance-native.css');
  for (const file of [builtIndexPath, builtAppPath, builtCssPath]) {
    if (!fs.existsSync(file) || fs.statSync(file).size === 0) throw new Error(`Built native Performance asset missing: ${file}`);
  }
  const builtIndex = read(builtIndexPath);
  for (const control of ['Paradise Performance', 'id="nPerf"', 'performance-native-app.js', 'performance-native.css']) {
    requireText(builtIndex, control, 'Built native Performance index');
  }
  const bundle = read(builtAppPath);
  for (const control of ['START MY DAY', 'FINISH DAY', 'performance-enrollment-redeem', 'performance_location_points', 'performance_events']) {
    requireText(bundle, control, 'Built native Performance app');
  }
  assertNoPrivilegedSupabaseCredential(bundle, 'Built native Performance app');
  forbidText(bundle, 'performance_sets', 'Built native Performance app');
}

console.log('Paradise native Performance integration controls PASS: native bundle is separate, trusted-device Today runtime is mounted, EVENT/LOCATION-only sync enforced, real privileged Supabase credentials are rejected, both native workflows build the real Performance candidate, and the public field bundle remains isolated.');
