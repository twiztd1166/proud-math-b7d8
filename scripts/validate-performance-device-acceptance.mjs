import fs from 'node:fs';

function text(path) {
  if (!fs.existsSync(path)) throw new Error(`Missing required acceptance file: ${path}`);
  return fs.readFileSync(path, 'utf8');
}
function requireText(haystack, needle, label) {
  if (!haystack.includes(needle)) throw new Error(`Acceptance control missing: ${label}`);
}
function forbid(haystack, pattern, label) {
  if (pattern.test(haystack)) throw new Error(`Acceptance control violation: ${label}`);
}

const app = text('performance/acceptance/acceptance-app.mjs');
const html = text('performance/acceptance/index.html');
const performanceSession = text('performance/client/performance-session.mjs');
const nativeSession = text('performance/client/performance-native-session.mjs');
const secureStorage = text('performance/native/capacitor-secure-storage.mjs');
const locationBridge = text('performance/native/capacitor-location-bridge.mjs');
const androidPlugin = text('performance/native/android/PerformanceLocationPlugin.kt');
const androidSpool = text('performance/native/android/PerformanceLocationSpool.kt');
const iosSpool = text('performance/native/ios/PerformanceLocationSpool.swift');
const androidManifestFragment = text('performance/native/android/AndroidManifest.performance-location.xml');
const androidPrep = text('scripts/prepare-performance-android-shell.mjs');
const iosPrep = text('scripts/prepare-performance-ios-shell.rb');
const plan = text('docs/PARADISE_PERFORMANCE_V1_PHYSICAL_DEVICE_ACCEPTANCE.md');
const config = JSON.parse(text('capacitor.acceptance.config.json'));
const productionIndex = text('index.html');

for (const [needle, label] of [
  ["from '../client/performance-session.mjs'", 'real trusted-device session module'],
  ["from '../client/performance-native-session.mjs'", 'native session safety module'],
  ["from '../client/performance-sync.mjs'", 'real idempotent sync module'],
  ["from '../client/performance-today.mjs'", 'real Today controller module'],
  ["from '../client/performance-today-ui.mjs'", 'real Today UI module'],
  ["from '../native/capacitor-location-bridge.mjs'", 'real native location bridge'],
  ["from '../native/capacitor-performance-plugin.mjs'", 'real Capacitor location plugin adapter'],
  ["from '../native/capacitor-secure-storage.mjs'", 'real secure-storage adapter'],
  ['createPerformanceSupabaseOptions(secureStorage)', 'Supabase Auth uses OS-protected storage'],
  ['validateNativePerformanceSession({', 'revocation-aware native session validation'],
  ['ensureNativeInstallEnrollmentBoundary({', 'reinstall re-enrollment boundary'],
  ['new CapacitorPerformanceLocationBridge({', 'actual native location bridge construction'],
  ['createSupabaseShiftTransport(supabase)', 'actual authoritative shift transport'],
  ['new PerformanceTodayController({', 'actual Today controller construction'],
  ['mountPerformanceToday({', 'actual Today UI mount'],
  ['redeemTrustedDevice({', 'actual deployed enrollment client path'],
  ['createJsonStorageQueueStore(window.localStorage, QUEUE_KEY)', 'offline field queue persistence'],
  ['locationBridge.ensureStoppedWhenNoActiveShift()', 'explicit no-session/off-shift native stop path'],
  ["state.status === 'UNVERIFIED_TRANSIENT'", 'transient validation state is handled separately from revoke'],
  ['SESSION_TRANSIENT_PRESERVED', 'transient outage evidence marker'],
  ['supabase.auth.refreshSession()', 'explicit protected-session refresh acceptance control'],
  ['INSTALL_BOUNDARY_CHECKED', 'install-boundary evidence marker'],
]) requireText(app, needle, label);

requireText(performanceSession, "status: 'UNVERIFIED_TRANSIENT'", 'session validator preserves transient outage state');
requireText(performanceSession, 'isDefinitiveAuthRejection', 'structured Auth rejection classifier');
requireText(performanceSession, 'isDefinitiveDatabaseAuthRejection', 'structured Data API authorization classifier');
requireText(performanceSession, 'transient network or Supabase service failure never masquerades as device revocation', 'offline/revocation invariant');
requireText(nativeSession, "PERFORMANCE_INVALID_SESSION_STATES = Object.freeze(['NO_SESSION', 'REVOKED_OR_UNENROLLED'])", 'only definitive invalid states force native stop');
requireText(nativeSession, 'FRESH_INSTALL_REENROLL_REQUIRED', 'reinstall requires re-enrollment when protected session survived');
requireText(nativeSession, "supabase.auth.signOut({ scope: 'local' })", 'fresh-install boundary clears protected Auth session');
requireText(nativeSession, 'await locationBridge.ensureStoppedWhenNoActiveShift()', 'invalid session forces native stop');
requireText(nativeSession, 'UNVERIFIED_TRANSIENT preserves an already-running native location session', 'transient outage preserves native tracking');
requireText(nativeSession, 'could not force native location stopped', 'native stop failure is visible');
requireText(secureStorage, 'browser localStorage is never used by this adapter', 'secure Auth storage forbids browser localStorage');

for (const [needle, label] of [
  ['drainPendingLocations', 'native spool drain contract'],
  ['ackPendingLocations', 'native spool acknowledgement contract'],
  ['await this.onQueuedLocation(write)', 'JavaScript durable queue boundary'],
  ['await this.plugin.ackPendingLocations', 'native ACK happens after JavaScript queue acceptance'],
  ['allowEmbeddedContext: true', 'crash-left historical GPS recovery'],
]) requireText(locationBridge, needle, label);
for (const [haystack, needle, label] of [
  [androidSpool, 'output.fd.sync()', 'Android fsynced native spool'],
  [androidSpool, 'clientPointId', 'Android stable native point ID'],
  [androidSpool, 'refusing to discard pending GPS', 'Android corrupt spool fails closed'],
  [iosSpool, '.atomic', 'iOS atomic native spool'],
  [iosSpool, 'clientPointId', 'iOS stable native point ID'],
  [iosSpool, 'refusing to discard pending GPS', 'iOS corrupt spool fails closed'],
  [androidPrep, 'PerformanceLocationSpool.kt', 'generated Android acceptance shell includes durable spool'],
  [iosPrep, 'PerformanceLocationSpool.swift', 'generated iOS acceptance shell includes durable spool'],
]) requireText(haystack, needle, label);

for (const [needle, label] of [
  ['Manifest.permission.POST_NOTIFICATIONS', 'Android notification runtime permission alias'],
  ['alias = "notifications"', 'Android notification permission alias is declared'],
  ['requestPermissionForAliases(aliases.toTypedArray()', 'Android requests location and disclosure permissions together'],
  ['Notification permission is required for visible active-shift location', 'Android tracking refuses hidden notification state'],
  ['notificationVisiblePermission', 'Android native status exposes notification visibility permission'],
  ['activeEmployeeId', 'Android persisted employee context'],
  ['activeDeviceId', 'Android persisted device context'],
  ['drainPendingLocations', 'Android native pending-drain API'],
]) requireText(androidPlugin, needle, label);
requireText(androidManifestFragment, 'android.permission.POST_NOTIFICATIONS', 'Android manifest fragment declares notification permission');
requireText(androidPrep, "'android.permission.POST_NOTIFICATIONS'", 'generated Android manifest receives notification permission');

requireText(plan, 'c1af14d7c1f8f8ce7b8decf1e12a02bf370b0367', 'acceptance plan is pinned to current GREEN parent');
requireText(plan, 'native durable spool', 'hardware plan includes durable native handoff validation');
requireText(plan, 'NOT YET PHYSICALLY RUN', 'hardware plan may not claim PASS before phones are tested');

requireText(html, 'NON-PRODUCTION DEVICE ACCEPTANCE', 'visible non-production banner');
requireText(html, 'does not authorize field activity', 'visible field-authority disclaimer');
requireText(html, 'REFRESH AUTH SESSION', 'visible Auth refresh proof control');
requireText(html, 'No access token, refresh token, hidden password, or enrollment token is written to this log.', 'visible evidence-secret control');

if (config.appId !== 'com.paradiseexteriors.performance.acceptance') throw new Error('Acceptance appId must remain isolated from production app identity');
if (config.appName !== 'Paradise Performance TEST') throw new Error('Acceptance appName must remain visibly test-only');
if (config.webDir !== 'performance-acceptance-dist') throw new Error('Acceptance webDir must remain isolated');

forbid(app, /service[_-]?role/i, 'service-role material must never be present in acceptance client');
forbid(app, /SUPABASE_(?:SECRET|SERVICE_ROLE)/, 'secret environment names must never be present in acceptance client');
forbid(app, /sb_secret_[A-Za-z0-9_-]+/, 'Supabase secret key literal must never be present');
forbid(app, /accessToken\s*:/, 'access token must never be written to acceptance evidence');
forbid(app, /refreshToken\s*:/, 'refresh token must never be written to acceptance evidence');
if (!/PUBLISHABLE_KEY\s*=\s*'sb_publishable_[A-Za-z0-9_-]+'/.test(app)) throw new Error('Acceptance client must use only a Supabase publishable key');
for (const forbidden of ['performance/acceptance', 'acceptance-app.js', 'Paradise Performance TEST']) {
  if (productionIndex.includes(forbidden)) throw new Error(`Production index must not mount acceptance harness: ${forbidden}`);
}
console.log('Paradise Performance physical-device acceptance static controls: PASS');
