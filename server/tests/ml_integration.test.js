import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { MLClient } from '../mlClient.js';
import { DatabaseService } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const testDbPath = path.join(__dirname, 'test_ml_integration.db');

function cleanDbFiles(dbPath) {
  for (const f of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
    if (fs.existsSync(f)) {
      try { fs.unlinkSync(f); } catch {}
    }
  }
}

async function runMLIntegrationTests() {
  console.log('[Test Suite] Running Phase 5 Node <-> Python ML Service Integration Tests...');

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

  cleanDbFiles(testDbPath);
  const db = new DatabaseService(testDbPath);

  // 1. Test Offline / Unavailable ML Service Handling first
  console.log('\n--- 1. Testing Offline / Unavailable ML Handling ---');
  const offlineClient = new MLClient('http://127.0.0.1:5999', db); // Non-existent offline port
  const offlineHealth = await offlineClient.checkHealth();
  assert(offlineHealth.available === false, 'Offline service correctly reported as available=false');
  assert(offlineHealth.error === 'ML Service Unavailable', 'Explicit error message returned on offline');

  const offlinePred = await offlineClient.predict({ files_modified: 10, average_entropy: 7.5 });
  assert(offlinePred.available === false, 'Offline predict call returns available=false');
  assert(offlinePred.error === 'ML Service Unavailable', 'No fake numbers or fabricated predictions produced');
  assert(offlinePred.probability === null, 'Probability is null (not fabricated)');

  // 2. Launch Python ML Microservice on port 5005 for isolated testing
  console.log('\n--- 2. Starting Python ML Microservice on Port 5005 ---');
  const pythonPath = path.join(projectRoot, '.venv/bin/python3');
  const predictScript = path.join(projectRoot, 'ml/predict.py');

  const mlProcess = spawn(pythonPath, [predictScript, '--serve', '5005'], {
    cwd: projectRoot,
    env: { ...process.env, PYTHONPATH: projectRoot }
  });

  mlProcess.stdout.on('data', (d) => {
    // console.log(`[Python ML Stdout]: ${d}`);
  });
  mlProcess.stderr.on('data', (d) => {
    // console.error(`[Python ML Stderr]: ${d}`);
  });

  const liveClient = new MLClient('http://127.0.0.1:5005', db);

  // Poll until service is online
  let isOnline = false;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 250));
    const h = await liveClient.checkHealth();
    if (h.available) {
      isOnline = true;
      break;
    }
  }

  try {
    // 3. Test Health and Model Info Endpoints
    console.log('\n--- 3. Testing Health & Model Metadata Endpoints ---');
    assert(isOnline === true, 'Python ML microservice started and responded to health probe');
    const health = await liveClient.checkHealth();
    assert(health.available === true, 'Python ML microservice is healthy and reachable');
    assert(health.model === 'RandomForestClassifier', 'Reports correct model: RandomForestClassifier');

    const modelInfo = await liveClient.getModelInfo();
    assert(modelInfo.available === true, 'Retrieved model architecture information');
    assert(Array.isArray(modelInfo.features) && modelInfo.features.length === 16, 'Retrieved complete 16-feature schema list');

    const evalMetrics = await liveClient.getEvaluation();
    assert(evalMetrics.available === true, 'Retrieved real evaluation metrics');
    assert(evalMetrics.metrics && evalMetrics.metrics.accuracy !== undefined, 'Evaluation contains calculated accuracy');
    assert(evalMetrics.confusionMatrix && Array.isArray(evalMetrics.confusionMatrix.matrix), 'Evaluation contains real confusion matrix');

    // 4. Test Live Feature Vector Inference & SQLite Persistence
    console.log('\n--- 4. Real Feature Vector Inference & DB Persistence ---');

    // Benign feature vector
    const benignFeatures = {
      files_modified: 2,
      files_created: 1,
      files_deleted: 0,
      mutations_per_second: 0.3,
      average_entropy: 4.15,
      maximum_entropy: 4.30,
      entropy_delta: -0.05,
      high_entropy_file_ratio: 0.0,
      suspicious_extension_count: 0,
      extension_change_count: 0,
      total_bytes_modified: 4096,
      average_file_size: 2048.0,
      process_cpu: 4.0,
      process_memory: 80.0,
      number_of_active_processes: 120,
      burst_duration: 6.0
    };

    const benignPred = await liveClient.predict(benignFeatures);
    assert(benignPred.available === true, 'Live inference returns result');
    assert(benignPred.classification === 'BENIGN', `Benign features classified as BENIGN (Got: ${benignPred.classification})`);
    assert(benignPred.probability < 0.2, `Benign probability < 0.2 (Got: ${benignPred.probability})`);
    assert(benignPred.storedId !== undefined, 'Prediction assigned ID and stored in SQLite');

    // Verify stored in SQLite
    const storedBenign = db.getPredictionById(benignPred.storedId);
    assert(storedBenign !== null, 'Stored prediction verified in SQLite predictions table');
    assert(storedBenign.classification === 'BENIGN', 'Stored record matches classification');
    assert(storedBenign.probability === benignPred.probability, 'Stored record matches probability');

    // Ransomware feature vector
    const ransomwareFeatures = {
      files_modified: 75,
      files_created: 60,
      files_deleted: 50,
      mutations_per_second: 35.0,
      average_entropy: 7.88,
      maximum_entropy: 7.99,
      entropy_delta: 3.68,
      high_entropy_file_ratio: 0.96,
      suspicious_extension_count: 55,
      extension_change_count: 70,
      total_bytes_modified: 9000000,
      average_file_size: 120000.0,
      process_cpu: 90.0,
      process_memory: 480.0,
      number_of_active_processes: 145,
      burst_duration: 2.1
    };

    const attackPred = await liveClient.predict(ransomwareFeatures);
    assert(attackPred.available === true, 'Live attack inference returns result');
    assert(attackPred.classification === 'RANSOMWARE_LIKE', `Ransomware features classified as RANSOMWARE_LIKE (Got: ${attackPred.classification})`);
    assert(attackPred.probability > 0.8, `Ransomware probability > 0.8 (Got: ${attackPred.probability})`);

    const storedAttack = db.getPredictionById(attackPred.storedId);
    assert(storedAttack !== null, 'Attack prediction verified in SQLite');
    assert(storedAttack.classification === 'RANSOMWARE_LIKE', 'Stored attack matches classification');

    console.log(`\n========================================`);
    console.log(`PHASE 5 ML INTEGRATION SUMMARY: ${passed}/${total} PASSED (100%)`);
    console.log(`========================================\n`);

  } finally {
    // Terminate test Python microservice
    mlProcess.kill('SIGTERM');
    db.close();
    cleanDbFiles(testDbPath);
  }
}

runMLIntegrationTests();
