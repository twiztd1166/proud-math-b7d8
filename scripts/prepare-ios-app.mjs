import fs from 'node:fs';
import path from 'node:path';

const roots = [
  path.resolve('dist/client'),
  path.resolve('dist')
];
const source = roots.find(p => fs.existsSync(path.join(p, 'index.html')));
if (!source) {
  throw new Error('No built index.html found. Run npm run build first.');
}

const target = path.resolve('ios/App/App/public');
fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(target, { recursive: true });
fs.cpSync(source, target, { recursive: true });

const required = ['index.html', 'app.css', 'app-core.js', 'app-shows.js', 'app-calendar.js', 'app-control.js', 'app-bind.js', 'app-modals.js'];
for (const file of required) {
  if (!fs.existsSync(path.join(target, file))) {
    throw new Error(`Native bundle missing required asset: ${file}`);
  }
}

console.log(`Copied native web bundle from ${source} to ${target}`);
