import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const manifestPath = path.join(root, 'store', 'paradise-performance', 'brand', 'store-brand-assets-v1.json');
if (!fs.existsSync(manifestPath)) throw new Error(`Store brand manifest is missing: ${manifestPath}`);
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const flags = new Set(process.argv.slice(2));
const supported = new Set(['--source', '--ios', '--android']);
for (const flag of flags) if (!supported.has(flag)) throw new Error(`Unsupported store-assets flag: ${flag}`);
if (flags.size === 0) flags.add('--source');

const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const ensureDir = filePath => fs.mkdirSync(path.dirname(filePath), { recursive: true });
const pngInfo = buffer => {
  const signature = '89504e470d0a1a0a';
  if (buffer.length < 33 || buffer.subarray(0, 8).toString('hex') !== signature) throw new Error('Controlled brand source is not a valid PNG signature');
  if (buffer.subarray(12, 16).toString('ascii') !== 'IHDR') throw new Error('Controlled brand source is missing PNG IHDR');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    bitDepth: buffer[24],
    colorType: buffer[25],
  };
};

function reconstructSource() {
  const source = manifest.source;
  if (!Array.isArray(source.chunks) || source.chunks.length !== 17) {
    throw new Error('Controlled Paradise favicon must remain split into exactly 17 ordered source segments');
  }
  const encoded = source.chunks.map(relative => {
    const target = path.join(root, relative);
    if (!fs.existsSync(target)) throw new Error(`Controlled brand source chunk is missing: ${relative}`);
    return fs.readFileSync(target, 'utf8').replace(/\s+/g, '');
  }).join('');
  if (encoded.length !== source.encodedChars) {
    throw new Error(`Controlled Paradise favicon encoded-length mismatch: expected ${source.encodedChars}, got ${encoded.length}`);
  }
  const buffer = Buffer.from(encoded, 'base64');
  if (buffer.toString('base64') !== encoded) throw new Error('Controlled Paradise favicon base64 is not canonical or was truncated');
  if (buffer.length !== source.bytes) throw new Error(`Controlled Paradise favicon byte count mismatch: expected ${source.bytes}, got ${buffer.length}`);
  const digest = sha256(buffer);
  if (digest !== source.sha256) throw new Error(`Controlled Paradise favicon SHA-256 mismatch: expected ${source.sha256}, got ${digest}`);
  const info = pngInfo(buffer);
  if (info.width !== source.width || info.height !== source.height) throw new Error(`Controlled Paradise favicon dimensions mismatch: expected ${source.width}x${source.height}, got ${info.width}x${info.height}`);
  const materialized = path.join(root, 'store-build', 'paradise-performance', 'brand', 'source', 'paradise-favicon-528.png');
  ensureDir(materialized);
  fs.writeFileSync(materialized, buffer);
  return { buffer, digest, info, materialized };
}

async function loadSharp() {
  try {
    return (await import('sharp')).default;
  } catch (error) {
    throw new Error(`Store asset generation requires the pinned sharp dependency: ${error.message}`);
  }
}

async function writeIos(sharp, sourceBuffer, report) {
  const target = path.join(root, manifest.derivation.ios.generatedShellPath);
  const contents = path.join(path.dirname(target), 'Contents.json');
  if (!fs.existsSync(target) || !fs.existsSync(contents)) throw new Error('Generated Capacitor iOS AppIcon set is missing; generate the iOS shell before applying store assets');
  const contentsJson = JSON.parse(fs.readFileSync(contents, 'utf8'));
  const declared = (contentsJson.images || []).some(image => image.filename === path.basename(target) && image.size === '1024x1024');
  if (!declared) throw new Error('Generated iOS AppIcon Contents.json no longer declares the expected universal 1024x1024 AppIcon');
  await sharp(sourceBuffer)
    .resize(1024, 1024, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
    .flatten({ background: manifest.derivation.android.background })
    .removeAlpha()
    .png({ compressionLevel: 9, adaptiveFiltering: false })
    .toFile(target);
  const metadata = await sharp(target).metadata();
  if (metadata.width !== 1024 || metadata.height !== 1024 || metadata.hasAlpha) throw new Error('Generated iOS AppIcon must be opaque 1024x1024');
  const review = path.join(root, 'store-build', 'paradise-performance', 'brand', 'review', 'apple-app-icon-1024.png');
  ensureDir(review);
  fs.copyFileSync(target, review);
  report.ios = { path: manifest.derivation.ios.generatedShellPath, width: metadata.width, height: metadata.height, hasAlpha: metadata.hasAlpha, sha256: sha256(fs.readFileSync(target)), reviewPath: path.relative(root, review) };
}

async function writeAndroid(sharp, sourceBuffer, report) {
  const res = path.join(root, 'android', 'app', 'src', 'main', 'res');
  if (!fs.existsSync(res)) throw new Error('Generated Capacitor Android resources are missing; generate the Android shell before applying store assets');
  const legacy = manifest.derivation.android.legacyLauncherPx;
  const adaptive = manifest.derivation.android.adaptiveForegroundCanvasPx;
  const generated = [];
  for (const [density, size] of Object.entries(legacy)) {
    const dir = path.join(res, `mipmap-${density}`);
    fs.mkdirSync(dir, { recursive: true });
    const image = await sharp(sourceBuffer).resize(size, size, { fit: 'fill', kernel: sharp.kernel.lanczos3 }).png({ compressionLevel: 9, adaptiveFiltering: false }).toBuffer();
    for (const name of ['ic_launcher.png', 'ic_launcher_round.png']) {
      const target = path.join(dir, name);
      fs.writeFileSync(target, image);
      generated.push({ path: path.relative(root, target), size });
    }
  }
  for (const [density, canvas] of Object.entries(adaptive)) {
    const dir = path.join(res, `mipmap-${density}`);
    fs.mkdirSync(dir, { recursive: true });
    const mark = Math.round(canvas * manifest.derivation.android.adaptiveSafeMarkRatio);
    const resized = await sharp(sourceBuffer).resize(mark, mark, { fit: 'fill', kernel: sharp.kernel.lanczos3 }).png({ compressionLevel: 9, adaptiveFiltering: false }).toBuffer();
    const left = Math.floor((canvas - mark) / 2);
    const top = Math.floor((canvas - mark) / 2);
    const target = path.join(dir, 'ic_launcher_foreground.png');
    await sharp({ create: { width: canvas, height: canvas, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: resized, left, top }])
      .png({ compressionLevel: 9, adaptiveFiltering: false })
      .toFile(target);
    const metadata = await sharp(target).metadata();
    if (metadata.width !== canvas || metadata.height !== canvas || !metadata.hasAlpha) throw new Error(`Android adaptive foreground invalid for ${density}`);
    generated.push({ path: path.relative(root, target), canvas, mark, hasAlpha: metadata.hasAlpha });
  }
  const valuesDir = path.join(res, 'values');
  const anydpiDir = path.join(res, 'mipmap-anydpi-v26');
  fs.mkdirSync(valuesDir, { recursive: true });
  fs.mkdirSync(anydpiDir, { recursive: true });
  fs.writeFileSync(path.join(valuesDir, 'ic_launcher_background.xml'), `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${manifest.derivation.android.background}</color>\n</resources>\n`);
  const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n    <background android:drawable="@color/ic_launcher_background"/>\n    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n</adaptive-icon>\n`;
  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), adaptiveXml);
  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), adaptiveXml);

  const play = path.join(root, 'store-build', 'paradise-performance', 'brand', 'review', 'google-play-icon-512.png');
  ensureDir(play);
  await sharp(sourceBuffer).resize(512, 512, { fit: 'fill', kernel: sharp.kernel.lanczos3 }).png({ compressionLevel: 9, adaptiveFiltering: false }).toFile(play);
  const playMeta = await sharp(play).metadata();
  if (playMeta.width !== 512 || playMeta.height !== 512 || !playMeta.hasAlpha) throw new Error('Google Play review icon must be a 512x512 PNG with alpha');
  report.android = { generated, background: manifest.derivation.android.background, playReviewPath: path.relative(root, play), playHasAlpha: playMeta.hasAlpha, playSha256: sha256(fs.readFileSync(play)) };
}

const source = reconstructSource();
const report = {
  schemaVersion: 1,
  source: {
    driveFileId: manifest.source.driveFileId,
    chunks: manifest.source.chunks.length,
    encodedChars: manifest.source.encodedChars,
    bytes: source.buffer.length,
    sha256: source.digest,
    width: source.info.width,
    height: source.info.height,
    bitDepth: source.info.bitDepth,
    colorType: source.info.colorType,
    materializedPath: path.relative(root, source.materialized),
  },
  controls: {
    redraw: false,
    recolor: false,
    cropIntoNewMark: false,
    deterministicResizeOnly: true,
    launchArtworkGenerated: false,
  },
};

if (flags.has('--ios') || flags.has('--android')) {
  const sharp = await loadSharp();
  if (flags.has('--ios')) await writeIos(sharp, source.buffer, report);
  if (flags.has('--android')) await writeAndroid(sharp, source.buffer, report);
}

const reportPath = path.join(root, 'store-build', 'paradise-performance', 'brand', 'store-brand-assets-report.json');
ensureDir(reportPath);
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Paradise store brand source verified: ${source.info.width}x${source.info.height}, ${source.buffer.length} bytes, sha256 ${source.digest}.`);
if (report.ios) console.log('Applied deterministic Paradise iOS AppIcon assets to generated shell.');
if (report.android) console.log('Applied deterministic Paradise Android launcher assets to generated shell.');
