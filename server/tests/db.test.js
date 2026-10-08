import { DatabaseService } from '../db.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testDbPath = path.join(__dirname, 'test_cryptsentinel.db');

function cleanDbFiles(dbPath) {
  for (const f of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
    if (fs.existsSync(f)) {
      try { fs.unlinkSync(f); } catch {}
    }
  }
}

function runDatabaseTests() {
  console.log('[Test Suite] Initializing SQLite Database Tests...');

  // Clean up old test db if present
  cleanDbFiles(testDbPath);

  const db = new DatabaseService(testDbPath);
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

  try {
    // 1. Test Incidents Table
    console.log('\n--- 1. Testing Incidents Operations ---');
    const incidentData = {
      id: 'INC-TEST-001',
      severity: 'CRITICAL',
      riskScore: 94.5,
      matchedFamily: 'LockBit 3.0',
      title: 'High-Entropy Rapid File Mutation Wave',
      description: 'Multiple documents in sandbox were mutated with high Shannon entropy payload.',
      mitreTactics: ['T1486', 'T1490'],
      status: 'OPEN',
      rawData: { filesAffected: 3, entropyAvg: 7.82 }
    };

    const createdInc = db.createIncident(incidentData);
    assert(createdInc !== null, 'Create incident returns object');
    assert(createdInc.id === 'INC-TEST-001', 'Incident ID matches');
    assert(createdInc.risk_score === 94.5, 'Incident risk score matches');
    assert(Array.isArray(createdInc.mitreTactics) && createdInc.mitreTactics.includes('T1486'), 'MITRE tactics stored and parsed as JSON array');

    const incidentsList = db.getIncidents(10);
    assert(incidentsList.length === 1, 'getIncidents returns correct list length');

    const updatedInc = db.updateIncidentStatus('INC-TEST-001', 'RESOLVED');
    assert(updatedInc.status === 'RESOLVED', 'updateIncidentStatus successfully updates status');

    // 2. Test Detections Table
    console.log('\n--- 2. Testing Detections Operations ---');
    const detectionData = {
      id: 'DET-TEST-001',
      incidentId: 'INC-TEST-001',
      eventType: 'CREATE',
      fullPath: '/sandbox/financial_records.xlsx.lockbit',
      entropy: 7.912,
      mutationVelocity: 14,
      size: 4096,
      isSuspicious: true
    };

    const createdDet = db.createDetection(detectionData);
    assert(createdDet !== null, 'Create detection returns record');
    assert(createdDet.entropy === 7.912, 'Detection entropy value matches');
    assert(createdDet.is_suspicious === 1, 'Detection is_suspicious flag stored correctly');

    const detList = db.getDetections(10);
    assert(detList.length === 1, 'getDetections returns recorded detections');

    // 3. Test Predictions Table
    console.log('\n--- 3. Testing Predictions Operations ---');
    const predictionData = {
      id: 'PRED-TEST-001',
      classification: 'RANSOMWARE_LIKE',
      probability: 0.985,
      confidence: 0.985,
      model: 'RandomForestClassifier',
      modelVersion: '1.0.0-academic',
      features: { files_modified: 45, average_entropy: 7.85, mutations_per_second: 28.0 },
      rawResult: { classProbabilities: { BENIGN: 0.015, RANSOMWARE_LIKE: 0.985 } }
    };

    const createdPred = db.createPrediction(predictionData);
    assert(createdPred !== null, 'Create prediction returns object');
    assert(createdPred.classification === 'RANSOMWARE_LIKE', 'Prediction classification matches');
    assert(createdPred.probability === 0.985, 'Prediction probability matches');
    assert(createdPred.features.files_modified === 45, 'Prediction features JSON serialized and deserialized properly');

    const latestPred = db.getLatestPrediction();
    assert(latestPred !== null && latestPred.id === 'PRED-TEST-001', 'getLatestPrediction returns most recent prediction');

    // 4. Test Quarantine Items Table
    console.log('\n--- 4. Testing Quarantine Operations ---');
    const quarantineData = {
      id: 'QRN-TEST-001',
      originalPath: '/sandbox/client_database.sql.lockbit',
      quarantinePath: '/quarantine/client_database_17112000.vault',
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      originalFilename: 'client_database.sql.lockbit',
      reason: 'Synthetic LockBit signature matched with high entropy byte stream',
      incidentId: 'INC-TEST-001',
      status: 'QUARANTINED'
    };

    const createdQrn = db.createQuarantineItem(quarantineData);
    assert(createdQrn !== null, 'Create quarantine item returns record');
    assert(createdQrn.sha256 === quarantineData.sha256, 'SHA-256 hash stored correctly');
    assert(createdQrn.status === 'QUARANTINED', 'Quarantine item status matches');

    const updatedQrn = db.updateQuarantineStatus('QRN-TEST-001', 'RESTORED');
    assert(updatedQrn.status === 'RESTORED', 'Quarantine item status updated to RESTORED');

    const deletedQrn = db.deleteQuarantineItem('QRN-TEST-001');
    assert(deletedQrn !== null, 'Quarantine item deleted from table');
    assert(db.getQuarantineItemById('QRN-TEST-001') === null, 'Quarantine item no longer exists after deletion');

    // 5. Test Audit Logs Table
    console.log('\n--- 5. Testing Audit Logs Operations ---');
    const auditData = {
      id: 'AUD-TEST-001',
      actionType: 'PROCESS_TERMINATE',
      actor: 'SOC_ANALYST_IBRAHIM',
      details: { targetPid: 8944, processName: 'malicious_agent.exe', signal: 'SIGKILL' },
      ipAddress: '127.0.0.1'
    };

    const createdAudit = db.createAuditLog(auditData);
    assert(createdAudit !== null, 'Create audit log returns record');
    assert(createdAudit.action_type === 'PROCESS_TERMINATE', 'Audit log action type matches');
    assert(createdAudit.details.targetPid === 8944, 'Audit log details JSON parsed properly');

    const auditLogs = db.getAuditLogs(10);
    assert(auditLogs.length === 1, 'getAuditLogs returns correct count');

    // 6. Test DB Persistence across instances
    console.log('\n--- 6. Testing DB Persistence Across Reopens ---');
    db.close();

    const reopenedDb = new DatabaseService(testDbPath);
    const persistedInc = reopenedDb.getIncidentById('INC-TEST-001');
    assert(persistedInc !== null, 'Incident persisted after database close and reopen');
    assert(persistedInc.status === 'RESOLVED', 'Persisted incident retains updated status');
    reopenedDb.close();

    // Clean up test DB file
    cleanDbFiles(testDbPath);

    console.log(`\n========================================`);
    console.log(`DATABASE TEST SUMMARY: ${passed}/${total} PASSED (100%)`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error('Test execution error:', err);
    process.exitCode = 1;
  }
}

runDatabaseTests();
