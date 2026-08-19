import fs from 'node:fs';
import path from 'node:path';
import { validateEvidenceAttachments, validatePhysicalAcceptanceGate } from '../performance/acceptance/physical-evidence-validator.mjs';

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
  const iosDoc = readJson(iosPath);
  const androidDoc = readJson(androidPath);
  const result = validatePhysicalAcceptanceGate(iosDoc, androidDoc, readJson(cleanupPath));
  const iosAttachments = validateEvidenceAttachments(iosDoc, iosPath);
  const androidAttachments = validateEvidenceAttachments(androidDoc, androidPath);
  const allIssues = [
    ...result.issues,
    ...iosAttachments.issues.map(v => ({ ...v, platform: 'ios-attachment' })),
    ...androidAttachments.issues.map(v => ({ ...v, platform: 'android-attachment' })),
  ];
  if (!result.pass || !iosAttachments.pass || !androidAttachments.pass) {
    console.error('Paradise Performance physical-device acceptance evidence: NOT PASS');
    for (const item of allIssues) console.error(`- [${item.platform}] ${item.code} ${item.field}: ${item.message}`);
    process.exit(1);
  }
  console.log('Paradise Performance physical-device acceptance evidence: PASS');
  console.log('Both real-phone A-L evidence documents, retained attachments, exact artifacts, and isolated backend cleanup satisfy the controlled gate.');
} catch (error) {
  console.error('Paradise Performance physical-device acceptance evidence: INVALID');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(2);
}
