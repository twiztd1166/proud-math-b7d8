import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { build } from 'esbuild';

const args = process.argv.slice(2);
const variantIndex = args.indexOf('--variant');
const variant = variantIndex >= 0 ? String(args[variantIndex + 1] || '').trim() : '';
if (!['controls', 'android', 'ios'].includes(variant)) {
  throw new Error('Use --variant controls|android|ios');
}

const entryPoint = 'performance/client/performance-native-app.mjs';
const builtBundlePath = 'performance-dist/performance-native-app.js';
const evidenceDir = path.join('store-build', 'paradise-performance', 'dependency-evidence', variant);
const reportPath = path.join(evidenceDir, 'dependency-evidence.json');

function sha256Bytes(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function sha256File(file) {
  return sha256Bytes(fs.readFileSync(file));
}

function packageNameFromInput(inputPath) {
  const normalized = inputPath.replaceAll('\\', '/');
  const marker = '/node_modules/';
  const markerIndex = normalized.lastIndexOf(marker);
  const relative = markerIndex >= 0 ? normalized.slice(markerIndex + marker.length) : normalized.startsWith('node_modules/') ? normalized.slice('node_modules/'.length) : null;
  if (!relative) return null;
  const parts = relative.split('/').filter(Boolean);
  if (!parts.length) return null;
  return parts[0].startsWith('@') && parts.length >= 2 ? `${parts[0]}/${parts[1]}` : parts[0];
}

function normalizeVia(via) {
  if (typeof via === 'string') return { dependency: via };
  if (!via || typeof via !== 'object') return { type: typeof via };
  return {
    source: via.source ?? null,
    name: via.name ?? null,
    dependency: via.dependency ?? null,
    title: via.title ?? null,
    url: via.url ?? null,
    severity: via.severity ?? null,
    range: via.range ?? null,
  };
}

function normalizeFixAvailable(value) {
  if (value === true || value === false || value == null) return value ?? null;
  if (typeof value !== 'object') return String(value);
  return {
    name: value.name ?? null,
    version: value.version ?? null,
    isSemVerMajor: value.isSemVerMajor ?? null,
  };
}

if (!fs.existsSync(builtBundlePath)) {
  throw new Error(`Build ${builtBundlePath} before dependency evidence capture`);
}

const evidenceBuild = await build({
  entryPoints: [entryPoint],
  outfile: builtBundlePath,
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['safari16.4', 'chrome120'],
  minify: false,
  sourcemap: false,
  treeShaking: true,
  legalComments: 'none',
  metafile: true,
  write: false,
});

if (!evidenceBuild.outputFiles?.length) throw new Error('Esbuild evidence rebuild produced no output');
const rebuiltBundle = Buffer.from(evidenceBuild.outputFiles[0].contents);
const builtBundle = fs.readFileSync(builtBundlePath);
const builtBundleSha256 = sha256Bytes(builtBundle);
const rebuiltBundleSha256 = sha256Bytes(rebuiltBundle);
if (!builtBundle.equals(rebuiltBundle)) {
  throw new Error(`Dependency-evidence rebuild does not byte-match shipped web bundle: built=${builtBundleSha256} rebuilt=${rebuiltBundleSha256}`);
}

const inputPaths = Object.keys(evidenceBuild.metafile?.inputs || {}).sort();
const packageInputs = new Map();
const projectInputs = [];
for (const input of inputPaths) {
  const packageName = packageNameFromInput(input);
  if (!packageName) {
    projectInputs.push(input);
    continue;
  }
  const paths = packageInputs.get(packageName) || [];
  paths.push(input);
  packageInputs.set(packageName, paths);
}
const bundledPackages = [...packageInputs.keys()].sort();
const bundledPackageSet = new Set(bundledPackages);

const audit = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['audit', '--json'], {
  encoding: 'utf8',
  maxBuffer: 32 * 1024 * 1024,
});
if (!audit.stdout?.trim()) {
  throw new Error(`npm audit produced no JSON output (exit ${audit.status ?? 'unknown'}): ${String(audit.stderr || '').slice(0, 500)}`);
}
let auditJson;
try {
  auditJson = JSON.parse(audit.stdout);
} catch (error) {
  throw new Error(`npm audit output was not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
}

const vulnerabilities = Object.entries(auditJson.vulnerabilities || {}).sort(([a], [b]) => a.localeCompare(b)).map(([name, item]) => ({
  name,
  severity: item?.severity ?? null,
  isDirect: item?.isDirect ?? null,
  range: item?.range ?? null,
  nodes: Array.isArray(item?.nodes) ? [...item.nodes].sort() : [],
  fixAvailable: normalizeFixAvailable(item?.fixAvailable),
  via: Array.isArray(item?.via) ? item.via.map(normalizeVia) : [],
  esbuildInputMatch: bundledPackageSet.has(name),
  matchedBundleInputPaths: packageInputs.get(name) || [],
}));

const packageLockPath = 'package-lock.json';
const packageJsonPath = 'package.json';
const report = {
  schemaVersion: 1,
  status: 'EVIDENCE_CAPTURE_ONLY_NOT_A_SECURITY_CLEARANCE',
  variant,
  sourceCommit: process.env.GITHUB_SHA || null,
  nodeVersion: process.version,
  npmVersion: null,
  exactBundleByteMatch: true,
  bundle: {
    entryPoint,
    path: builtBundlePath,
    sha256: builtBundleSha256,
    bytes: builtBundle.length,
    inputCount: inputPaths.length,
    projectInputs,
    bundledPackages,
    packageInputs: Object.fromEntries([...packageInputs.entries()].sort(([a], [b]) => a.localeCompare(b))),
  },
  audit: {
    command: 'npm audit --json',
    exitCode: audit.status,
    metadata: auditJson.metadata ?? null,
    vulnerabilityCount: vulnerabilities.length,
    vulnerabilities,
    exactPackageNameMatchesToEsbuildInputs: vulnerabilities.filter(item => item.esbuildInputMatch).map(item => item.name),
    interpretationBoundary: 'esbuildInputMatch means the advisory package name appears in the exact byte-matched browser bundle input graph. A non-match is evidence about this JavaScript bundle only; it does not by itself prove a native shell, build tool, server, repository, or transitive security issue is irrelevant.',
  },
  sourceIntegrity: {
    packageJsonSha256: fs.existsSync(packageJsonPath) ? sha256File(packageJsonPath) : null,
    packageLockSha256: fs.existsSync(packageLockPath) ? sha256File(packageLockPath) : null,
  },
  controls: [
    'No dependency version is modified by this evidence capture.',
    'The evidence rebuild must byte-match the already-built Performance JavaScript bundle.',
    'npm audit findings are preserved as evidence and are not automatically classified as exploitable or non-exploitable.',
    'No secret, token, password, signing material, or environment-variable value is intentionally recorded.',
    'Final signed-binary dependency, secret, and platform review remains a separate submission gate.',
  ],
};

const npmVersionResult = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['--version'], { encoding: 'utf8' });
if (npmVersionResult.status === 0) report.npmVersion = String(npmVersionResult.stdout || '').trim() || null;

fs.mkdirSync(evidenceDir, { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Paradise native dependency evidence captured for ${variant}: ${vulnerabilities.length} npm advisory package records; ${report.audit.exactPackageNameMatchesToEsbuildInputs.length} exact package-name matches in the byte-matched Performance browser bundle; report ${reportPath}.`);
