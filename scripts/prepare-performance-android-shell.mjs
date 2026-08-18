import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const androidRoot = path.join(root, 'android');
const appRoot = path.join(androidRoot, 'app');
if (!fs.existsSync(appRoot)) throw new Error('Generated Capacitor Android project is missing; run npx cap add android first');

const packageDir = path.join(appRoot, 'src', 'main', 'java', 'com', 'paradise', 'performance');
fs.mkdirSync(packageDir, { recursive: true });
for (const name of [
  'PerformanceLocationPlugin.kt',
  'PerformanceLocationService.kt',
  'PerformanceLocationSpool.kt',
  'PerformanceSecureStoragePlugin.kt',
]) {
  fs.copyFileSync(
    path.join(root, 'performance', 'native', 'android', name),
    path.join(packageDir, name),
  );
}

const mainActivity = path.join(appRoot, 'src', 'main', 'java', 'com', 'paradiseexteriors', 'performance', 'MainActivity.java');
fs.mkdirSync(path.dirname(mainActivity), { recursive: true });
fs.writeFileSync(mainActivity, `package com.paradiseexteriors.performance;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.paradise.performance.PerformanceLocationPlugin;
import com.paradise.performance.PerformanceSecureStoragePlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PerformanceLocationPlugin.class);
        registerPlugin(PerformanceSecureStoragePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
`);

const rootBuildPath = path.join(androidRoot, 'build.gradle');
let rootBuild = fs.readFileSync(rootBuildPath, 'utf8');
if (!rootBuild.includes('kotlin-gradle-plugin')) {
  rootBuild = rootBuild.replace(
    /(dependencies\s*\{\s*\n\s*classpath\s+['"]com\.android\.tools\.build:gradle:[^'"]+['"])/,
    `$1\n        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:2.3.21"`,
  );
}
if (!rootBuild.includes('kotlin-gradle-plugin:2.3.21')) throw new Error('Unable to add controlled Kotlin Gradle plugin');
fs.writeFileSync(rootBuildPath, rootBuild);

const appBuildPath = path.join(appRoot, 'build.gradle');
let appBuild = fs.readFileSync(appBuildPath, 'utf8');
if (!appBuild.includes("apply plugin: 'kotlin-android'")) {
  appBuild = appBuild.replace("apply plugin: 'com.android.application'", "apply plugin: 'com.android.application'\napply plugin: 'kotlin-android'");
}
if (!appBuild.includes('jvmToolchain(21)')) {
  appBuild = appBuild.replace(/\nandroid\s*\{/, '\n\nkotlin {\n    jvmToolchain(21)\n}\n\nandroid {');
}
fs.writeFileSync(appBuildPath, appBuild);

const manifestPath = path.join(appRoot, 'src', 'main', 'AndroidManifest.xml');
let manifest = fs.readFileSync(manifestPath, 'utf8');
const permissions = [
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_LOCATION',
];
for (const permission of permissions) {
  if (!manifest.includes(permission)) {
    manifest = manifest.replace(/\n\s*<application/, `\n    <uses-permission android:name="${permission}" />\n\n    <application`);
  }
}
if (!manifest.includes('com.paradise.performance.PerformanceLocationService')) {
  manifest = manifest.replace(
    /\n\s*<\/application>/,
    `\n        <service\n            android:name="com.paradise.performance.PerformanceLocationService"\n            android:exported="false"\n            android:stopWithTask="false"\n            android:foregroundServiceType="location" />\n    </application>`,
  );
}
fs.writeFileSync(manifestPath, manifest);

for (const required of [
  mainActivity,
  path.join(packageDir, 'PerformanceLocationPlugin.kt'),
  path.join(packageDir, 'PerformanceLocationService.kt'),
  path.join(packageDir, 'PerformanceLocationSpool.kt'),
  path.join(packageDir, 'PerformanceSecureStoragePlugin.kt'),
]) {
  if (!fs.existsSync(required)) throw new Error(`Missing integrated Android source: ${required}`);
}

console.log('Prepared generated Android shell with registered Performance location + durable spool + secure-storage plugins.');
