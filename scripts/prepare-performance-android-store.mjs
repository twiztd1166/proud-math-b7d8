import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const androidRoot = path.join(root, 'android');
const variablesPath = path.join(androidRoot, 'variables.gradle');
const appBuildPath = path.join(androidRoot, 'app', 'build.gradle');
const manifestPath = path.join(androidRoot, 'app', 'src', 'main', 'AndroidManifest.xml');

for (const required of [variablesPath, appBuildPath, manifestPath]) {
  if (!fs.existsSync(required)) throw new Error(`Generated Android store shell is missing: ${required}`);
}

const versionName = String(process.env.PARADISE_STORE_VERSION || '1.0.0');
const versionCode = Number(process.env.PARADISE_STORE_BUILD || '1');
const targetApi = 36;

if (!/^\d+\.\d+\.\d+$/.test(versionName)) {
  throw new Error(`PARADISE_STORE_VERSION must use x.y.z form; received ${versionName}`);
}
if (!Number.isSafeInteger(versionCode) || versionCode < 1 || versionCode > 2100000000) {
  throw new Error(`PARADISE_STORE_BUILD must be an integer from 1 to 2100000000; received ${process.env.PARADISE_STORE_BUILD || '1'}`);
}

let variables = fs.readFileSync(variablesPath, 'utf8');
const setSdk = (name, value) => {
  const rx = new RegExp(`(${name}\\s*=\\s*)\\d+`);
  if (!rx.test(variables)) throw new Error(`Unable to locate ${name} in generated variables.gradle`);
  variables = variables.replace(rx, `$1${value}`);
};
setSdk('compileSdkVersion', targetApi);
setSdk('targetSdkVersion', targetApi);
fs.writeFileSync(variablesPath, variables);

let appBuild = fs.readFileSync(appBuildPath, 'utf8');
if (!/versionCode\s+\d+/.test(appBuild)) throw new Error('Unable to locate versionCode in generated app/build.gradle');
if (!/versionName\s+["'][^"']+["']/.test(appBuild)) throw new Error('Unable to locate versionName in generated app/build.gradle');
appBuild = appBuild.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
appBuild = appBuild.replace(/versionName\s+["'][^"']+["']/, `versionName "${versionName}"`);
fs.writeFileSync(appBuildPath, appBuild);

const manifest = fs.readFileSync(manifestPath, 'utf8');
for (const required of [
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_LOCATION',
  'android:foregroundServiceType="location"',
]) {
  if (!manifest.includes(required)) throw new Error(`Generated Android store manifest missing ${required}`);
}
if (manifest.includes('android.permission.ACCESS_BACKGROUND_LOCATION')) {
  throw new Error('Store candidate must not request ACCESS_BACKGROUND_LOCATION; Paradise uses an employee-started visible location foreground service');
}

const finalVariables = fs.readFileSync(variablesPath, 'utf8');
const finalBuild = fs.readFileSync(appBuildPath, 'utf8');
for (const expected of [`compileSdkVersion = ${targetApi}`, `targetSdkVersion = ${targetApi}`]) {
  if (!finalVariables.includes(expected)) throw new Error(`Android store SDK control missing: ${expected}`);
}
if (!finalBuild.includes(`versionCode ${versionCode}`) || !finalBuild.includes(`versionName "${versionName}"`)) {
  throw new Error('Android store version controls were not applied');
}

console.log(`Prepared unsigned Android store candidate: API ${targetApi}, version ${versionName} (${versionCode}); signing intentionally external to repository.`);
