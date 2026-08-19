import fs from 'node:fs';
import path from 'node:path';
import { validatePhysicalAcceptanceGate } from '../performance/acceptance/physical-evidence-validator.mjs';

function usage() {
  console.error('Usage: node scripts/validate-performance-physical-acceptance-evidence.mjs <ios-evidence.json> <android-evidence.json> <cleanup-readback.json>');
}

const [, , iosPath, androidPath, cleanupPath] = process.argv;
if (!iosPath || !androidPath || !cleanupPath) {
  usage();
  process.exit(2);
}

function readJson(file) {
  const resolved = path.resolve(file);
  return JSON.parse(fs.readFileSync(resolved, 'utf8'));
}

try {
  const result = validatePhysicalAcceptanceGate(readJson(iosPath), readJson(androidPath), readJson(cleanupPath));
  if (!result.pass) {
    console.error('Paradise Performance physical-device acceptance evidence: NOT PASS');
    for (const item of result.issues) console.error(`- [${item.platform}] ${item.code} ${item.field}: ${item.message}`);
    process.exit(1);
  }
  console.log('Paradise Performance physical-device acceptance evidence: PASS');
  console.log('Both real-phone A-L evidence documents pass and the isolated backend cleanup readback is zero.');
} catch (error) {
  console.error('Paradise Performance physical-device acceptance evidence: INVALID');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(2);
}
