import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const brandRoot = path.join(root, 'store', 'paradise-performance', 'brand');
const sourceDir = path.join(brandRoot, 'source');
const manifestPath = path.join(brandRoot, 'brand-source-manifest.json');
const outRoot = path.resolve(root, process.env.PARADISE_STORE_ASSET_WORKDIR || '.paradise-store-assets');
const assetsDir = path.join(outRoot, 'assets');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const parts = fs.readdirSync(sourceDir)
  .filter((name) => /^paradise-favicon-528\.b64\.part\d+$/.test(name))
  .sort();

if (parts.length === 0) throw new Error('No controlled Paradise favicon source chunks found');

const encoded = parts.map((name) => fs.readFileSync(path.join(sourceDir, name), 'utf8').trim()).join('');
if (!encoded || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
  throw new Error('Controlled Paradise favicon source is not valid base64 text');
}

const bytes = Buffer.from(encoded, 'base64');
const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');

if (bytes.length !== manifest.source.bytes) {
  throw new Error(`Paradise favicon byte-length mismatch: expected ${manifest.source.bytes}, received ${bytes.length}`);
}
if (sha256 !== manifest.source.sha256) {
  throw new Error(`Paradise favicon SHA-256 mismatch: expected ${manifest.source.sha256}, received ${sha256}`);
}

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
if (!bytes.subarray(0, 8).equals(pngSignature)) throw new Error('Controlled Paradise favicon is not a PNG');
if (bytes.subarray(12, 16).toString('ascii') !== 'IHDR') throw new Error('Controlled Paradise favicon is missing PNG IHDR');

const width = bytes.readUInt32BE(16);
const height = bytes.readUInt32BE(20);
const bitDepth = bytes[24];
const colorType = bytes[25];
if (width !== manifest.source.width || height !== manifest.source.height) {
  throw new Error(`Paradise favicon dimensions mismatch: expected ${manifest.source.width}x${manifest.source.height}, received ${width}x${height}`);
}
if (bitDepth !== 8 || colorType !== 6) {
  throw new Error(`Paradise favicon PNG format changed unexpectedly: bitDepth=${bitDepth}, colorType=${colorType}`);
}

fs.rmSync(outRoot, { recursive: true, force: true });
fs.mkdirSync(assetsDir, { recursive: true });
fs.writeFileSync(path.join(outRoot, 'paradise-favicon-528.png'), bytes);

const svg = `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1024" height="1024" viewBox="0 0 1024 1024">\n` +
  `  <image x="0" y="0" width="1024" height="1024" preserveAspectRatio="xMidYMid meet" href="data:image/png;base64,${encoded}"/>\n` +
  `</svg>\n`;
fs.writeFileSync(path.join(assetsDir, 'logo.svg'), svg);

const generatedControl = {
  sourceSha256: sha256,
  sourceBytes: bytes.length,
  sourceDimensions: `${width}x${height}`,
  workingCanvas: '1024x1024',
  background: manifest.brandGuidelines.iconBackground,
  sourceChunks: parts,
};
fs.writeFileSync(path.join(outRoot, 'materialization.json'), JSON.stringify(generatedControl, null, 2) + '\n');

console.log(`Materialized Paradise store brand source ${width}x${height} (${bytes.length} bytes, sha256:${sha256}) into ${path.relative(root, outRoot)}.`);
