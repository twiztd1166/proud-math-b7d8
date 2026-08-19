import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const requireText = (text, needle, label) => {
  if (!text.includes(needle)) throw new Error(`${label} missing required control: ${needle}`);
};
const forbidText = (text, needle, label) => {
  if (text.includes(needle)) throw new Error(`${label} contains forbidden control: ${needle}`);
};

const config = JSON.parse(read('capacitor.config.json'));
if (config.appId !== 'com.paradiseexteriors.performance') throw new Error(`Unexpected production appId: ${config.appId}`);
if (config.appName !== 'Paradise Performance') throw new Error(`Unexpected production appName: ${config.appName}`);
if (config.webDir !== 'canvass-dist') throw new Error(`Unexpected production webDir: ${config.webDir}`);

const iosPlugin = read('performance/native/ios/PerformanceLocationPlugin.swift');
for (const control of [
  'manager.requestWhenInUseAuthorization()',
  'call.getBool("initiatedByUser") == true',
  'manager.allowsBackgroundLocationUpdates = true',
  'manager.showsBackgroundLocationIndicator = true',
  'manager.stopUpdatingLocation()',
]) requireText(iosPlugin, control, 'iOS location plugin');

const iosPrep = read('scripts/prepare-performance-ios-shell.rb');
for (const control of [
  "privacy_name = 'PrivacyInfo.xcprivacy'",
  'target.resources_build_phase',
  "background_modes << 'location'",
  "plist['NSLocationWhenInUseUsageDescription']",
]) requireText(iosPrep, control, 'iOS native preparation');

const privacy = read('performance/native/ios/PrivacyInfo.xcprivacy');
for (const control of [
  'NSPrivacyCollectedDataTypePreciseLocation',
  'NSPrivacyCollectedDataTypeCoarseLocation',
  'NSPrivacyCollectedDataTypeUserID',
  'NSPrivacyCollectedDataTypeDeviceID',
  'NSPrivacyCollectedDataTypeOtherDataTypes',
  'NSPrivacyCollectedDataTypePurposeAppFunctionality',
  'NSPrivacyAccessedAPICategoryUserDefaults',
  'CA92.1',
  '<key>NSPrivacyTracking</key>',
  '<false/>',
]) requireText(privacy, control, 'iOS privacy manifest');

const androidPlugin = read('performance/native/android/PerformanceLocationPlugin.kt');
for (const control of [
  'call.getBoolean("initiatedByUser", false) != true',
  'ContextCompat.startForegroundService',
  'Manifest.permission.ACCESS_FINE_LOCATION',
  'Manifest.permission.ACCESS_COARSE_LOCATION',
  'Manifest.permission.POST_NOTIFICATIONS',
]) requireText(androidPlugin, control, 'Android location plugin');

const androidPrep = read('scripts/prepare-performance-android-shell.mjs');
for (const control of [
  'android.permission.FOREGROUND_SERVICE_LOCATION',
  'android:foregroundServiceType="location"',
]) requireText(androidPrep, control, 'Android native preparation');
forbidText(androidPrep, 'android.permission.ACCESS_BACKGROUND_LOCATION', 'Android native preparation');

const androidStore = read('scripts/prepare-performance-android-store.mjs');
for (const control of [
  'const targetApi = 36;',
  "PARADISE_STORE_VERSION || '1.0.0'",
  "PARADISE_STORE_BUILD || '1'",
  'ACCESS_BACKGROUND_LOCATION',
  'signing intentionally external to repository',
]) requireText(androidStore, control, 'Android store preparation');

const iosStore = read('scripts/prepare-performance-ios-store.rb');
for (const control of [
  "bundle_id = 'com.paradiseexteriors.performance'",
  "ENV.fetch('PARADISE_STORE_VERSION', '1.0.0')",
  "ENV.fetch('PARADISE_STORE_BUILD', '1')",
  "settings['PRODUCT_BUNDLE_IDENTIFIER'] = bundle_id",
  'signing intentionally external to repository',
]) requireText(iosStore, control, 'iOS store preparation');

const workflow = read('.github/workflows/validate-paradise-native-store-distribution.yml');
for (const control of [
  'bundleRelease',
  '-configuration Release',
  '-sdk iphoneos',
  'CODE_SIGNING_ALLOWED=NO',
  'xcrun --sdk iphoneos --show-sdk-version',
  'Validate iOS 26+ SDK',
  'UNSIGNED-NOT-FOR-DISTRIBUTION',
]) requireText(workflow, control, 'Store candidate workflow');
for (const forbidden of ['ANDROID_UPLOAD_KEYSTORE', 'APPLE_CERTIFICATE', 'APP_STORE_CONNECT_API_KEY']) {
  forbidText(workflow, forbidden, 'Store candidate workflow');
}

const doc = read('docs/PARADISE_NATIVE_STORE_DISTRIBUTION_V1.md');
for (const control of [
  'Google Play Internal Testing',
  'Unlisted App Store',
  'NO TESTFLIGHT DEPENDENCY',
  'com.paradiseexteriors.performance',
  'https://www.paradiseexteriors.com/privacy-policy/',
]) requireText(doc, control, 'Distribution control record');

console.log('Paradise native store distribution controls PASS: production identity pinned; iOS privacy manifest present; Android API 36 and visible FGS boundary enforced; signing/publication remain external and fail closed.');
