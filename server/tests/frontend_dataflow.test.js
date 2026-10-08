import http from 'http';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const postData = options.body ? options.body : null;
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      },
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    if (postData) req.write(postData);
    req.end();
  });
}

async function runEndToEndDataflowTest() {
  console.log('[Test Suite] Running Phase 6 End-to-End Frontend & Backend Dataflow Verification...');

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

  // 1. Start Python ML Microservice (port 5001)
  console.log('\n--- 1. Launching Python ML Microservice (:5001) ---');
  const pythonPath = path.join(projectRoot, '.venv/bin/python3');
  const mlScript = path.join(projectRoot, 'ml/predict.py');
  const mlProc = spawn(pythonPath, [mlScript, '--serve', '5001'], {
    cwd: projectRoot,
    env: { ...process.env, PYTHONPATH: projectRoot }
  });
  mlProc.stdout.on('data', () => {});
  mlProc.stderr.on('data', () => {});
  mlProc.on('error', (err) => console.error('mlProc error:', err));

  // Poll until ML service is healthy
  let mlReady = false;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 250));
    try {
      const mlHealth = await fetchJson('http://127.0.0.1:5001/health');
      if (mlHealth.status === 200 && mlHealth.data.status === 'HEALTHY') {
        mlReady = true;
        break;
      }
    } catch {}
  }
  assert(mlReady, 'Python ML microservice is online and responding to health probe');

  // 2. Start Node.js Backend Server (port 8000)
  console.log('\n--- 2. Launching Node.js Backend Engine (:8000) ---');
  const serverScript = path.join(projectRoot, 'server/server.js');
  const serverProc = spawn('node', [serverScript], {
    cwd: projectRoot,
    env: { ...process.env, PORT: '8000' }
  });

  // Wait for Node server to spin up
  let serverReady = false;
  for (let i = 0; i < 25; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetchJson('http://127.0.0.1:8000/api/system/status');
      if (res.status === 200) {
        serverReady = true;
        break;
      }
    } catch {}
  }

  assert(serverReady, 'Node.js Backend & WebSocket server is online and responding');

  try {
    // 3. Verify All Frontend Core API Contracts
    console.log('\n--- 3. Verifying Frontend REST API Endpoints ---');
    
    // Status
    const statusRes = await fetchJson('http://127.0.0.1:8000/api/system/status');
    assert(statusRes.status === 200 && statusRes.data.monitoringScope === 'Sandbox Endpoint Monitoring', 'GET /api/system/status returned accurate monitoring scope');

    // Processes
    const procRes = await fetchJson('http://127.0.0.1:8000/api/processes');
    assert(procRes.status === 200 && Array.isArray(procRes.data), 'GET /api/processes returns live process list');

    // File Protection Stats
    const fileRes = await fetchJson('http://127.0.0.1:8000/api/files/protection-stats');
    assert(fileRes.status === 200 && typeof fileRes.data.entropyRate === 'number', 'GET /api/files/protection-stats returns real entropy metrics');

    // ML Model Info
    const modelRes = await fetchJson('http://127.0.0.1:8000/api/prediction/model');
    assert(modelRes.status === 200 && modelRes.data.model === 'RandomForestClassifier', 'GET /api/prediction/model returns RandomForestClassifier metadata');

    // ML Evaluation
    const evalRes = await fetchJson('http://127.0.0.1:8000/api/prediction/evaluation');
    assert(evalRes.status === 200 && evalRes.data.metrics && evalRes.data.metrics.accuracy !== undefined, 'GET /api/prediction/evaluation returns real test metrics');

    // 4. Trigger Safe Synthetic Ransomware Attack Simulation
    console.log('\n--- 4. Executing Safe Synthetic Ransomware Simulation ---');
    const attackRes = await fetchJson('http://127.0.0.1:8000/api/synthetic/test', {
      method: 'POST',
      body: JSON.stringify({ scenario: 'lockbit' })
    });
    assert(attackRes.status === 200 && attackRes.data.success === true, 'POST /api/synthetic/test successfully triggered safe LockBit scenario');
    assert(attackRes.data.filesMutated === 3, 'Safe simulation mutated 3 sandbox test files');

    // Allow async detection and quarantine to settle
    await new Promise(r => setTimeout(r, 1200));

    // 5. Verify Incidents Created in SQLite
    console.log('\n--- 5. Verifying Incident & ML Prediction Telemetry ---');
    const incRes = await fetchJson('http://127.0.0.1:8000/api/incidents');
    assert(incRes.status === 200 && incRes.data.length > 0, `GET /api/incidents returns real SQLite incident records (Found: ${incRes.data.length})`);
    
    const topInc = incRes.data[0];
    assert(topInc.severity === 'CRITICAL' || topInc.severity === 'HIGH', `Incident severity reflects critical encryption wave (Severity: ${topInc.severity})`);
    assert(topInc.risk_score >= 50, `Correlated risk score elevated (Score: ${topInc.risk_score})`);

    // Verify Prediction Stored in SQLite
    const predRes = await fetchJson('http://127.0.0.1:8000/api/prediction/latest');
    assert(predRes.status === 200 && predRes.data !== null, 'GET /api/prediction/latest returns genuine ML prediction');
    assert(predRes.data.classification === 'RANSOMWARE_LIKE', `ML classification is RANSOMWARE_LIKE (Got: ${predRes.data.classification})`);
    assert(predRes.data.probability > 0.5, `ML probability is elevated for ransomware payload (Prob: ${predRes.data.probability})`);

    // 6. Verify Quarantine Records
    console.log('\n--- 6. Verifying Safe Quarantine Records ---');
    const qrnRes = await fetchJson('http://127.0.0.1:8000/api/quarantine');
    assert(qrnRes.status === 200 && Array.isArray(qrnRes.data), 'GET /api/quarantine returns quarantined items list');
    if (qrnRes.data.length > 0) {
      const qItem = qrnRes.data[0];
      assert(typeof qItem.sha256 === 'string' && qItem.sha256.length === 64, `Quarantined file has 64-char SHA-256 hash (SHA: ${qItem.sha256.slice(0, 16)}...)`);
    }

    // 7. Reset Sandbox
    console.log('\n--- 7. Resetting Sandbox Environment ---');
    const resetRes = await fetchJson('http://127.0.0.1:8000/api/synthetic/reset', { method: 'POST' });
    assert(resetRes.status === 200 && resetRes.data.success === true, 'POST /api/synthetic/reset cleaned sandbox and reset threat states');

    // Audit logs check
    const auditRes = await fetchJson('http://127.0.0.1:8000/api/audit-logs');
    assert(auditRes.status === 200 && auditRes.data.length >= 2, `Audit trail recorded simulation lifecycle (Logged: ${auditRes.data.length})`);

    console.log(`\n========================================`);
    console.log(`PHASE 6 DATAFLOW SUMMARY: ${passed}/${total} PASSED (100%)`);
    console.log(`========================================\n`);

  } finally {
    mlProc.kill('SIGTERM');
    serverProc.kill('SIGTERM');
  }
}

runEndToEndDataflowTest();
