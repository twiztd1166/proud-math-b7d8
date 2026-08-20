import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { build } from 'esbuild';

const args = process.argv.slice(2);
const variantIndex = args.indexOf('--variant');
const variant = variantIndex >= 0 ? String(args[variantIndex + 1] || '').trim() : '';
if (!['controls', 'android', 'ios'].includes(variant)) throw new Error('Use --variant controls|android|ios');

const entryPoint = 'performance/client/performance-native-app.mjs';
const builtBundlePath = 'performance-dist/performance-native-app.js';
const evidenceDir = path.join('store-build', 'paradise-performance', 'dependency-evidence', variant);
const reportPath = path.join(evidenceDir, 'dependency-evidence.json');
const packageJsonPath = 'package.json';
const packageLockPath = 'package-lock.json';
const hiddenLockPath = path.join('node_modules', '.package-lock.json');

function sha256Bytes(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}
function sha256File(file) {
  return sha256Bytes(fs.readFileSync(file));
}
function npmCommand(args, options = {}) {
  return spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    ...options,
  });
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
  return { name: value.name ?? null, version: value.version ?? null, isSemVerMajor: value.isSemVerMajor ?? null };
}
function parseAuditResult(result, label) {
  if (!result.stdout?.trim()) return { available: false, label, exitCode: result.status, error: String(result.stderr || '').slice(0, 500) || 'no JSON output' };
  let json;
  try {
    json = JSON.parse(result.stdout);
  } catch (error) {
    return { available: false, label, exitCode: result.status, error: `invalid JSON: ${error instanceof Error ? error.message : String(error)}` };
  }
  if (!json || typeof json !== 'object' || (!json.metadata && !json.vulnerabilities)) {
    return { available: false, label, exitCode: result.status, error: json?.error?.summary || json?.error?.code || 'npm audit did not return an audit report' };
  }
  return { available: true, label, exitCode: result.status, json };
}
function normalizeAudit(parsed, bundledPackageSet, packageInputs) {
  if (!parsed.available) return parsed;
  const vulnerabilities = Object.entries(parsed.json.vulnerabilities || {}).sort(([a], [b]) => a.localeCompare(b)).map(([name, item]) => ({
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
  return {
    available: true,
    label: parsed.label,
    exitCode: parsed.exitCode,
    metadata: parsed.json.metadata ?? null,
    vulnerabilityPackageCount: vulnerabilities.length,
    vulnerabilities,
    exactPackageNameMatchesToEsbuildInputs: vulnerabilities.filter(item => item.esbuildInputMatch).map(item => item.name),
  };
}
function installedVersions() {
  const result = npmCommand(['ls', '--all', '--json']);
  if (!result.stdout?.trim()) return { available: false, exitCode: result.status, error: String(result.stderr || '').slice(0, 500) };
  let tree;
  try { tree = JSON.parse(result.stdout); } catch (error) {
    return { available: false, exitCode: result.status, error: `invalid npm ls JSON: ${error instanceof Error ? error.message : String(error)}` };
  }
  const versions = new Map();
  const walk = dependencies => {
    for (const [name, node] of Object.entries(dependencies || {})) {
      const values = versions.get(name) || new Set();
      if (node?.version) values.add(String(node.version));
      versions.set(name, values);
      walk(node?.dependencies);
    }
  };
  walk(tree.dependencies);
  return {
    available: true,
    exitCode: result.status,
    packageCount: versions.size,
    versions: Object.fromEntries([...versions.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, values]) => [name, [...values].sort()])),
    problems: Array.isArray(tree.problems) ? tree.problems : [],
  };
}

if (!fs.existsSync(builtBundlePath)) throw new Error(`Build ${builtBundlePath} before dependency evidence capture`);

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
if (!builtBundle.equals(rebuiltBundle)) throw new Error(`Dependency-evidence rebuild does not byte-match built web bundle: built=${builtBundleSha256} rebuilt=${rebuiltBundleSha256}`);

const inputPaths = Object.keys(evidenceBuild.metafile?.inputs || {}).sort();
const packageInputs = new Map();
const projectInputs = [];
for (const input of inputPaths) {
  const packageName = packageNameFromInput(input);
  if (!packageName) { projectInputs.push(input); continue; }
  const paths = packageInputs.get(packageName) || [];
  paths.push(input);
  packageInputs.set(packageName, paths);
}
const bundledPackages = [...packageInputs.keys()].sort();
const bundledPackageSet = new Set(bundledPackages);

const committedLockAudit = normalizeAudit(
  parseAuditResult(npmCommand(['audit', '--json']), 'COMMITTED_ROOT_LOCKFILE_AUDIT'),
  bundledPackageSet,
  packageInputs,
);

let installedHiddenLockAudit = { available: false, label: 'POST_INSTALL_HIDDEN_LOCK_AUDIT', error: 'node_modules/.package-lock.json unavailable' };
if (fs.existsSync(packageLockPath) && fs.existsSync(hiddenLockPath)) {
  const originalRootLock = fs.readFileSync(packageLockPath);
  const hiddenLock = fs.readFileSync(hiddenLockPath);
  try {
    fs.writeFileSync(packageLockPath, hiddenLock);
    installedHiddenLockAudit = normalizeAudit(
      parseAuditResult(npmCommand(['audit', '--json', '--package-lock-only']), 'POST_INSTALL_HIDDEN_LOCK_AUDIT'),
      bundledPackageSet,
      packageInputs,
    );
  } finally {
    fs.writeFileSync(packageLockPath, originalRootLock);
  }
}

const exactInstalledTree = installedVersions();
const npmVersionResult = npmCommand(['--version']);
const report = {
  schemaVersion: 2,
  status: 'EVIDENCE_CAPTURE_ONLY_NOT_A_SECURITY_CLEARANCE',
  variant,
  sourceCommit: process.env.GITHUB_SHA || null,
  nodeVersion: process.version,
  npmVersion: npmVersionResult.status === 0 ? String(npmVersionResult.stdout || '').trim() || null : null,
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
  exactInstalledTree,
  audits: {
    committedLockAudit,
    installedHiddenLockAudit,
    interpretationBoundary: 'The committed-lock audit and post-install hidden-lock audit are separate evidence surfaces. Only an available POST_INSTALL_HIDDEN_LOCK_AUDIT may be treated as advisory identity evidence for the current no-save installed tree. esbuildInputMatch means the advisory package name appears in the exact byte-matched Performance browser bundle input graph; it is not exploitability proof. A non-match does not clear native shells, build tools, servers, repository dependencies, or other transitive/platform risks.',
  },
  sourceIntegrity: {
    packageJsonSha256: fs.existsSync(packageJsonPath) ? sha256File(packageJsonPath) : null,
    committedPackageLockSha256: fs.existsSync(packageLockPath) ? sha256File(packageLockPath) : null,
    postInstallHiddenLockSha256: fs.existsSync(hiddenLockPath) ? sha256File(hiddenLockPath) : null,
  },
  controls: [
    'No dependency version is modified in source control by this evidence capture.',
    'The evidence rebuild must byte-match the already-built Performance JavaScript bundle.',
    'Committed-lock audit identities must not be mislabeled as post-install no-save audit identities.',
    'An unavailable hidden-lock audit remains OPEN rather than being inferred from aggregate install counts.',
    'npm advisory findings are evidence and are not automatically classified as exploitable or non-exploitable.',
    'No secret, token, password, signing material, or environment-variable value is intentionally recorded.',
    'Final signed-binary dependency, secret, and platform review remains a separate submission gate.',
  ],
};

fs.mkdirSync(evidenceDir, { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
const postInstallSummary = installedHiddenLockAudit.available
  ? `${installedHiddenLockAudit.vulnerabilityPackageCount} post-install advisory package records; ${installedHiddenLockAudit.exactPackageNameMatchesToEsbuildInputs.length} exact bundle matches`
  : `post-install advisory identities unavailable (${installedHiddenLockAudit.error || 'unknown'})`;
console.log(`Paradise native dependency evidence captured for ${variant}: exact bundle byte-match PASS; ${postInstallSummary}; report ${reportPath}.`);
