import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const platform = process.argv.includes('--ios') ? 'ios' : process.argv.includes('--android') ? 'android' : null;
if (!platform) throw new Error('Usage: node scripts/apply-paradise-store-assets.mjs --ios|--android');

const run = (command, args) => {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} exited with status ${result.status}`);
};

run(process.execPath, [path.join('scripts', 'materialize-paradise-store-brand-assets.mjs')]);

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const background = '#FFFFFF';
run(npx, [
  '--no-install',
  '@capacitor/assets',
  'generate',
  `--${platform}`,
  '--assetPath', '.paradise-store-assets/assets',
  '--iconBackgroundColor', background,
  '--iconBackgroundColorDark', background,
  '--splashBackgroundColor', background,
  '--splashBackgroundColorDark', background,
]);

run(process.execPath, [path.join('scripts', 'validate-paradise-store-assets.mjs'), `--${platform}-generated`]);
console.log(`Applied controlled Paradise store assets to generated ${platform} shell.`);
