import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const brandRoot = path.join(root, 'store', 'paradise-performance', 'brand');
const manifestPath = path.join(brandRoot, 'brand-source-manifest.json');
const materializerPath = path.join(root, 'scripts', 'materialize-paradise-store-brand-assets.mjs');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const fail = (message) => { throw new Error(message); };
const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const pngInfo = (file) => {
  const bytes = fs.readFileSync(file);
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!bytes.subarray(0, 8).equals(signature) || bytes.subarray(12, 16).toString('ascii') !== 'IHDR') {
    fail(`Expected PNG with IHDR: ${file}`);
  }
  return {
    bytes,
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    bitDepth: bytes[24],
    colorType: bytes[25],
    sha256: sha256(bytes),
  };
};

if (manifest.schemaVersion !== 1) fail('Unexpected Paradise brand manifest schema');
if (manifest.product !== 'Paradise Performance') fail('Paradise brand manifest product drift');
if (manifest.source.driveFileId !== '1CsDZmKJWC6BUgszGD3NZ8BKG_m_B5Wz8') fail('Paradise favicon Drive identity drift');
if (manifest.source.sha256 !== '75e563729b9d0771335930a9e0c97eed3c2f37dd3b4a855f998201a8009f0c13') fail('Paradise favicon source hash control drift');
if (manifest.source.bytes !== 44927 || manifest.source.width !== 528 || manifest.source.height !== 528) fail('Paradise favicon source geometry/size control drift');
if (manifest.playListingSource.driveFileId !== '1dRJ6LZYtf24bKwCYnApLTHkeI8NFYDmw') fail('Google Play listing-icon Drive identity drift');
if (manifest.playListingSource.sha256 !== '29ae4b61e9ee3269092b75e489f572e5aac3afe3b03c722eb5dc659ff037ca33') fail('Google Play listing-icon source hash control drift');
if (manifest.brandGuidelines.driveFileId !== '1FePJBk-RGlT3gtl15v2eiMaWo1iOt9ii') fail('Paradise brand-guidelines Drive identity drift');
if (manifest.brandGuidelines.iconBackground !== '#FFFFFF' || manifest.brandGuidelines.splashBackground !== '#FFFFFF') fail('Paradise approved white-background control drift');
if (manifest.generation.capacitorAssetsVersion !== '3.0.5') fail('Pinned @capacitor/assets version drift');
if (!manifest.generation.noCrop || !manifest.generation.noRecolor || !manifest.generation.noRedraw || !manifest.generation.noVectorization) fail('Paradise no-redraw/no-recolor brand controls weakened');

const sourceDir = path.join(brandRoot, 'source');
const parts = fs.readdirSync(sourceDir).filter((name) => /^paradise-favicon-528\.b64\.part\d+$/.test(name)).sort();
if (parts.length === 0) fail('No encoded Paradise favicon source chunks found');
const encoded = parts.map((name) => fs.readFileSync(path.join(sourceDir, name), 'utf8').trim()).join('');
const sourceBytes = Buffer.from(encoded, 'base64');
if (sourceBytes.length !== manifest.source.bytes) fail(`Encoded Paradise favicon reconstructed to ${sourceBytes.length} bytes; expected ${manifest.source.bytes}`);
if (sha256(sourceBytes) !== manifest.source.sha256) fail('Encoded Paradise favicon does not match the controlled Drive-source SHA-256');
const sourceInfo = (() => {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!sourceBytes.subarray(0, 8).equals(signature) || sourceBytes.subarray(12, 16).toString('ascii') !== 'IHDR') fail('Encoded Paradise favicon is not a PNG');
  return { width: sourceBytes.readUInt32BE(16), height: sourceBytes.readUInt32BE(20), bitDepth: sourceBytes[24], colorType: sourceBytes[25] };
})();
if (sourceInfo.width !== 528 || sourceInfo.height !== 528 || sourceInfo.bitDepth !== 8 || sourceInfo.colorType !== 6) fail('Encoded Paradise favicon PNG geometry/format drift');

const materializer = fs.readFileSync(materializerPath, 'utf8');
for (const required of ['manifest.source.sha256', 'manifest.source.bytes', "assetsDir, 'logo.svg'", 'no controlled Paradise favicon source chunks']) {
  if (!materializer.toLowerCase().includes(required.toLowerCase())) fail(`Materializer control missing: ${required}`);
}
if (!materializer.includes('preserveAspectRatio="xMidYMid meet"')) fail('Materializer may crop or distort the approved Paradise mark');

if (process.argv.includes('--ios-generated')) {
  const icon = path.join(root, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset', 'AppIcon-512@2x.png');
  const splash = path.join(root, 'ios', 'App', 'App', 'Assets.xcassets', 'Splash.imageset', 'splash-2732x2732.png');
  if (!fs.existsSync(icon)) fail('Generated iOS Paradise AppIcon missing');
  if (!fs.existsSync(splash)) fail('Generated iOS Paradise launch image missing');
  const iconInfo = pngInfo(icon);
  const splashInfo = pngInfo(splash);
  if (iconInfo.width !== 1024 || iconInfo.height !== 1024) fail(`Generated iOS AppIcon is ${iconInfo.width}x${iconInfo.height}; expected 1024x1024`);
  if (iconInfo.bitDepth !== 8 || iconInfo.colorType !== 2) fail(`Generated iOS AppIcon must be opaque 8-bit RGB; bitDepth=${iconInfo.bitDepth}, colorType=${iconInfo.colorType}`);
  if (iconInfo.sha256 === '29e4777e319de3ee5a52c3a8004ec19d0568414004257e36d7c94a077d71c93b') fail('Generated iOS AppIcon is still the default Capacitor icon');
  if (splashInfo.width !== 2732 || splashInfo.height !== 2732) fail(`Generated iOS launch image is ${splashInfo.width}x${splashInfo.height}; expected 2732x2732`);
  if (splashInfo.sha256 === '1b5002b74a5500e697298ced06ca2811ac33f2771f236f3c720ff23243890530') fail('Generated iOS launch image is still the default Capacitor splash');
  console.log(`iOS Paradise store assets PASS: AppIcon sha256:${iconInfo.sha256}; launch sha256:${splashInfo.sha256}`);
}

if (process.argv.includes('--android-generated')) {
  const launcher = path.join(root, 'android', 'app', 'src', 'main', 'res', 'mipmap-xxxhdpi', 'ic_launcher.png');
  const round = path.join(root, 'android', 'app', 'src', 'main', 'res', 'mipmap-xxxhdpi', 'ic_launcher_round.png');
  const foreground = path.join(root, 'android', 'app', 'src', 'main', 'res', 'mipmap-xxxhdpi', 'ic_launcher_foreground.png');
  const adaptive = path.join(root, 'android', 'app', 'src', 'main', 'res', 'mipmap-anydpi-v26', 'ic_launcher.xml');
  for (const required of [launcher, round, foreground, adaptive]) if (!fs.existsSync(required)) fail(`Generated Android Paradise launcher resource missing: ${path.relative(root, required)}`);
  const launcherInfo = pngInfo(launcher);
  const roundInfo = pngInfo(round);
  const foregroundInfo = pngInfo(foreground);
  if (launcherInfo.width !== 192 || launcherInfo.height !== 192) fail(`Android xxxhdpi launcher is ${launcherInfo.width}x${launcherInfo.height}; expected 192x192`);
  if (roundInfo.width !== 192 || roundInfo.height !== 192) fail(`Android xxxhdpi round launcher is ${roundInfo.width}x${roundInfo.height}; expected 192x192`);
  if (foregroundInfo.width < 192 || foregroundInfo.height < 192) fail('Android adaptive foreground is unexpectedly small');
  const adaptiveText = fs.readFileSync(adaptive, 'utf8');
  if (!adaptiveText.includes('<adaptive-icon') || !adaptiveText.includes('ic_launcher_foreground')) fail('Android adaptive launcher XML is not wired to generated foreground resources');
  console.log(`Android Paradise store assets PASS: launcher sha256:${launcherInfo.sha256}; round sha256:${roundInfo.sha256}; foreground ${foregroundInfo.width}x${foregroundInfo.height}`);
}

console.log(`Paradise store brand controls PASS: source sha256:${manifest.source.sha256}; ${parts.length} encoded source chunk(s).`);
