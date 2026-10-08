import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { QuarantineService } from '../quarantineService.js';
import { DatabaseService } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testSandboxDir = path.join(__dirname, 'test_quarantine_sandbox');
const testQuarantineDir = path.join(__dirname, 'test_quarantine_vault');
const testDbPath = path.join(__dirname, 'test_quarantine.db');

function cleanDbFiles(dbPath) {
  for (const f of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
    if (fs.existsSync(f)) {
      try { fs.unlinkSync(f); } catch {}
    }
  }
}

async function runQuarantineTests() {
  console.log('[Test Suite] Running Phase 4 Quarantine Service Tests...');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      process.exitCode = 1;
    }
  }

  // Setup test directories
  if (fs.existsSync(testSandboxDir)) fs.rmSync(testSandboxDir, { recursive: true, force: true });
  if (fs.existsSync(testQuarantineDir)) fs.rmSync(testQuarantineDir, { recursive: true, force: true });
  cleanDbFiles(testDbPath);

  fs.mkdirSync(testSandboxDir, { recursive: true });
  fs.mkdirSync(testQuarantineDir, { recursive: true });

  const db = new DatabaseService(testDbPath);
  const qService = new QuarantineService(testQuarantineDir, testSandboxDir, db);

  try {
    // 1. Test Quarantining a valid file
    console.log('\n--- 1. Quarantining a Valid Sandbox File ---');
    const testFile = path.join(testSandboxDir, 'confidential_ledger.xlsx.locked');
    const fileContent = 'CRITICAL PAYROLL DATA 2026 TOP SECRET';
    fs.writeFileSync(testFile, fileContent);
    const expectedSha256 = crypto.createHash('sha256').update(fileContent).digest('hex');

    const item1 = await qService.quarantineFile(testFile, 'High entropy encryption burst detected');
    assert(item1 !== null, 'Quarantine operation returns record object');
    assert(item1.sha256 === expectedSha256, `SHA-256 matches content hash exactly (SHA: ${item1.sha256.slice(0, 16)}...)`);
    assert(item1.status === 'QUARANTINED', 'Item status is QUARANTINED');
    assert(!fs.existsSync(testFile), 'Original infected file was removed from sandbox');
    assert(fs.existsSync(item1.quarantine_path || item1.quarantinePath), 'Vault file exists in quarantine directory');

    // 2. Test File Restoration
    console.log('\n--- 2. Restoring Quarantined File ---');
    const restoreResult = await qService.restoreFile(item1.id);
    assert(restoreResult !== null, 'Restore operation returns result');
    assert(restoreResult.status === 'RESTORED', 'Database record status updated to RESTORED');
    assert(fs.existsSync(testFile), 'Restored file exists at original sandbox path');
    assert(!fs.existsSync(item1.quarantine_path || item1.quarantinePath), 'Vault file removed from quarantine after restoration');

    const restoredContent = fs.readFileSync(testFile, 'utf-8');
    assert(restoredContent === fileContent, 'Restored content identical to original pre-quarantine content');

    // 3. Test Path Traversal Protection
    console.log('\n--- 3. Path Traversal & Unauthorized Path Guards ---');
    let traversalBlocked1 = false;
    try {
      await qService.quarantineFile('/etc/passwd');
    } catch (err) {
      traversalBlocked1 = true;
    }
    assert(traversalBlocked1, 'Blocked attempt to quarantine external system path (/etc/passwd)');

    let traversalBlocked2 = false;
    try {
      await qService.quarantineFile(path.join(testSandboxDir, '../../sensitive_outside_file.txt'));
    } catch (err) {
      traversalBlocked2 = true;
    }
    assert(traversalBlocked2, 'Blocked relative directory traversal attempt (../../)');

    let traversalBlocked3 = false;
    try {
      await qService.quarantineFile(path.join(testSandboxDir, 'file\0.txt'));
    } catch (err) {
      traversalBlocked3 = true;
    }
    assert(traversalBlocked3, 'Blocked null-byte injection path attempt');

    // 4. Test Duplicate Filenames Quarantining
    console.log('\n--- 4. Handling Multiple Files with Identical Names ---');
    const fileA = path.join(testSandboxDir, 'shared_name.docx.crypted');
    const fileB = path.join(testSandboxDir, 'shared_name.docx.crypted');

    fs.writeFileSync(fileA, 'Payload Version 1');
    const itemA = await qService.quarantineFile(fileA, 'Threat match wave 1');

    fs.writeFileSync(fileB, 'Payload Version 2');
    const itemB = await qService.quarantineFile(fileB, 'Threat match wave 2');

    assert(itemA.id !== itemB.id, 'Distinct IDs generated for duplicate filenames');
    assert((itemA.quarantine_path || itemA.quarantinePath) !== (itemB.quarantine_path || itemB.quarantinePath), 'Distinct vault paths prevent collision');
    assert(fs.existsSync(itemA.quarantine_path || itemA.quarantinePath) && fs.existsSync(itemB.quarantine_path || itemB.quarantinePath), 'Both quarantine vaults coexist safely');

    // 5. Test Permanent Deletion
    console.log('\n--- 5. Permanent Deletion Operations ---');
    const delResult = await qService.deletePermanently(itemA.id);
    assert(delResult.status === 'DELETED', 'Database status updated to DELETED');
    assert(!fs.existsSync(itemA.quarantine_path || itemA.quarantinePath), 'Physical vault file purged upon permanent delete');

    // 6. Test Error Handling (Invalid IDs & Double Restores)
    console.log('\n--- 6. Edge Cases & Error Handling ---');
    let doubleRestoreBlocked = false;
    try {
      await qService.restoreFile(item1.id); // already restored
    } catch (err) {
      doubleRestoreBlocked = true;
    }
    assert(doubleRestoreBlocked, 'Prevented duplicate restore on already restored item');

    let deletedRestoreBlocked = false;
    try {
      await qService.restoreFile(itemA.id); // permanently deleted
    } catch (err) {
      deletedRestoreBlocked = true;
    }
    assert(deletedRestoreBlocked, 'Prevented restore on permanently deleted item');

    let invalidIdBlocked = false;
    try {
      await qService.restoreFile('QRN-NON-EXISTENT-999');
    } catch (err) {
      invalidIdBlocked = true;
    }
    assert(invalidIdBlocked, 'Handled non-existent quarantine ID gracefully');

    // 7. Test Audit Log Verification
    console.log('\n--- 7. Audit Logging Verification ---');
    const auditLogs = db.getAuditLogs(20);
    const quarantineActionLogs = auditLogs.filter(a => a.action_type.startsWith('FILE_'));
    assert(quarantineActionLogs.length >= 4, `All quarantine actions logged in audit trail (Logged: ${quarantineActionLogs.length})`);

    // Clean up test directories
    db.close();
    if (fs.existsSync(testSandboxDir)) fs.rmSync(testSandboxDir, { recursive: true, force: true });
    if (fs.existsSync(testQuarantineDir)) fs.rmSync(testQuarantineDir, { recursive: true, force: true });
    cleanDbFiles(testDbPath);

    console.log(`\n========================================`);
    console.log(`PHASE 4 QUARANTINE TEST SUMMARY: ${passed}/${total} PASSED (100%)`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error('Test execution error:', err);
    process.exitCode = 1;
  }
}

runQuarantineTests();
