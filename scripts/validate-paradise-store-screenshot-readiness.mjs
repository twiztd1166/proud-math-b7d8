import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const fail = message => { throw new Error(message); };

const planPath = 'store/paradise-performance/store-screenshot-plan-v1.json';
if (!fs.existsSync(planPath)) fail(`Screenshot plan missing: ${planPath}`);
const plan = JSON.parse(read(planPath));

if (plan.status !== 'CONTROLLED_CAPTURE_PLAN_NOT_YET_CAPTURED') fail(`Unexpected screenshot-plan status: ${plan.status}`);
if (plan.app !== 'Paradise Performance') fail('Screenshot plan app identity drift');
if (plan.bundleId !== 'com.paradiseexteriors.performance') fail('Screenshot plan bundle identity drift');
if (plan.apple?.deviceFamily !== 'IPHONE_ONLY') fail('Apple screenshot plan must remain iPhone-only');
if (plan.apple?.targetedDeviceFamilyBuildSetting !== '1') fail('Apple TARGETED_DEVICE_FAMILY plan must remain 1');
if (plan.apple?.targetPixels?.width !== 1320 || plan.apple?.targetPixels?.height !== 2868) fail('Apple primary screenshot target must remain 1320x2868 portrait');
if (plan.apple?.alphaAllowed !== false) fail('Apple submitted screenshots must not allow alpha');
if (plan.apple?.ipadScreenshotSetRequiredByThisBuild !== false) fail('iPad screenshot set must remain out of scope only while the store build is iPhone-only');
if (plan.apple?.appleSiliconMacAvailability !== 'OPT_OUT_UNLESS_SEPARATELY_VALIDATED') fail('Apple Silicon Mac availability must fail closed');

if (plan.googlePlay?.deviceType !== 'PHONE') fail('Google Play screenshot plan must remain phone-only for this tranche');
if (plan.googlePlay?.targetPixels?.width !== 1080 || plan.googlePlay?.targetPixels?.height !== 1920) fail('Google Play screenshot target must remain 1080x1920 portrait');
if (plan.googlePlay?.aspectRatio !== '9:16') fail('Google Play screenshot aspect ratio must remain 9:16');
if (plan.googlePlay?.alphaAllowed !== false) fail('Google Play submitted screenshots must not allow alpha');
if (plan.googlePlay?.controlledSetCount !== 6) fail('Controlled screenshot story must remain six screens');
if (plan.googlePlay?.altTextRequiredByParadiseControl !== true) fail('Google Play screenshot alt text must remain required by Paradise control');

const expectedIds = ['secure-welcome', 'performance-today-idle', 'start-my-day', 'lookup', 'university', 'finish-day'];
const story = Array.isArray(plan.story) ? plan.story : [];
if (story.length !== expectedIds.length) fail(`Expected exactly ${expectedIds.length} screenshot states; got ${story.length}`);
for (let i = 0; i < expectedIds.length; i += 1) {
  if (story[i]?.order !== i + 1 || story[i]?.id !== expectedIds[i]) fail(`Screenshot story order drift at position ${i + 1}`);
  if (!story[i]?.altText || story[i].altText.length > 140) fail(`Screenshot alt text missing or too long for ${expectedIds[i]}`);
}

const forbidden = JSON.stringify(plan.forbiddenScreenshotContent || []);
for (const required of ['real customer', 'real employee', 'enrollment QR', 'KPI', 'pay', 'physical-device acceptance']) {
  if (!forbidden.includes(required)) fail(`Screenshot forbidden-content control missing: ${required}`);
}

if (plan.captureAuthority?.finalScreenshotsRequireSignedCandidate !== true) fail('Final screenshots must require the signed candidate');
if (plan.captureAuthority?.unsignedCiShellMayBeUsedAsFinalScreenshotSource !== false) fail('Unsigned CI shell must remain forbidden as a final screenshot source');
if (plan.captureAuthority?.simulatorOnlyMayBeUsedAsFinalScreenshotSource !== false) fail('Simulator-only capture must remain forbidden as a final screenshot source');
if (plan.captureAuthority?.syntheticReviewDataRequired !== true) fail('Synthetic review data must remain required');
if (plan.captureAuthority?.realProductionEmployeeOrCustomerDataAllowed !== false) fail('Production employee/customer data must remain forbidden');

const iosStore = read('scripts/prepare-performance-ios-store.rb');
for (const needle of [
  "targeted_device_family = '1'",
  "settings['TARGETED_DEVICE_FAMILY'] = targeted_device_family",
  "settings['TARGETED_DEVICE_FAMILY'] == targeted_device_family",
  'iPhone-only',
]) {
  if (!iosStore.includes(needle)) fail(`iOS store device-family control missing: ${needle}`);
}

const metadata = JSON.parse(read('store/paradise-performance/store-metadata-v1.json'));
if (metadata.apple?.distribution !== 'UNLISTED_APP_STORE') fail('Apple distribution route drift');
if (metadata.googlePlay?.track !== 'INTERNAL_TESTING') fail('Google Play route drift');

console.log('Paradise store screenshot readiness controls PASS: iPhone-only device family locked; six-state synthetic capture story pinned; final capture remains blocked on the signed candidate.');
