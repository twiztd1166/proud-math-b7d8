import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';

const root = process.cwd();
const sourceDir = path.join(root, 'performance', 'acceptance');
const outDir = path.join(root, 'performance-acceptance-dist');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const name of ['index.html', 'acceptance.css']) {
  const source = path.join(sourceDir, name);
  if (!fs.existsSync(source)) throw new Error(`Missing acceptance source: ${name}`);
  fs.copyFileSync(source, path.join(outDir, name));
}

await build({
  entryPoints: [path.join(sourceDir, 'acceptance-app.mjs')],
  outfile: path.join(outDir, 'acceptance-app.js'),
  bundle: true,
  platform: 'browser',
  format: 'esm',
  target: ['es2022'],
  sourcemap: false,
  minify: false,
  legalComments: 'none',
  logLevel: 'info',
});

const html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
for (const ref of ['acceptance.css', 'acceptance-app.js']) {
  if (!html.includes(ref)) throw new Error(`Acceptance HTML does not reference ${ref}`);
  if (!fs.existsSync(path.join(outDir, ref))) throw new Error(`Acceptance build missing ${ref}`);
}

const js = fs.readFileSync(path.join(outDir, 'acceptance-app.js'), 'utf8');
if (!js.includes('NON-PRODUCTION') && !html.includes('NON-PRODUCTION')) {
  throw new Error('Acceptance build is missing a visible non-production control');
}

console.log(`Built Paradise Performance physical acceptance bundle in ${path.relative(root, outDir)}.`);
