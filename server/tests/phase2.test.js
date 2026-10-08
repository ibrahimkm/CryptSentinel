import http from 'http';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { WebSocket } from 'ws';
import { CanaryService, CANARY_FILES } from '../canaryService.js';
import { PolicyService, DEFAULT_RESPONSE_POLICIES } from '../policyService.js';
import { ProcessAttributionService } from '../processAttribution.js';
import { IncidentCorrelator } from '../incidentCorrelator.js';
import { DatabaseService } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const testDbPath = path.join(__dirname, 'test_phase2.db');
const testSandboxDir = path.join(__dirname, 'phase2_sandbox');

function cleanDbFiles(dbPath) {
  for (const f of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
    if (fs.existsSync(f)) {
      try { fs.unlinkSync(f); } catch {}
    }
  }
}

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

async function runPhase2TestSuite() {
  console.log('[Test Suite] Running Phase 2 Endpoint Protection & Incident Response Tests...\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
    }
  }

  // Ensure clean test sandbox
  if (!fs.existsSync(testSandboxDir)) {
    fs.mkdirSync(testSandboxDir, { recursive: true });
  }

  // ==========================================
  // Section 1: Canary / Honeypot Unit Tests
  // ==========================================
  console.log('--- Section 1: Canary / Honeypot Protection ---');
  const canaryService = new CanaryService();
  canaryService.initCanaries(testSandboxDir);

  const canaryNames = CANARY_FILES.map(c => c.name);
  assert(CANARY_FILES.length === 5, 'Canary registry contains exactly 5 decoy files');
  assert(canaryNames.includes('financial_report.xlsx'), 'Includes financial_report.xlsx decoy');
  assert(canaryNames.includes('payroll.xlsx'), 'Includes payroll.xlsx decoy');
  assert(canaryNames.includes('employee_database.sql'), 'Includes employee_database.sql decoy');
  assert(canaryNames.includes('customer_records.csv'), 'Includes customer_records.csv decoy');
  assert(canaryNames.includes('company_strategy.docx'), 'Includes company_strategy.docx decoy');

  assert(canaryService.isCanaryFile(path.join(testSandboxDir, 'financial_report.xlsx')) === true, 'isCanaryFile correctly identifies decoy file');
  assert(canaryService.isCanaryFile(path.join(testSandboxDir, 'financial_report.xlsx.lockbit')) === true, 'isCanaryFile identifies renamed encrypted decoy');
  assert(canaryService.isCanaryFile(path.join(testSandboxDir, 'normal_user_document.docx')) === false, 'isCanaryFile correctly rejects non-canary file');
  assert(canaryService.getStatus().status === 'ACTIVE', 'Initial canary status is ACTIVE');

  canaryService.triggerCanary('financial_report.xlsx', { riskScore: 95 });
  assert(canaryService.getStatus().status === 'TRIGGERED', 'Canary status transitions to TRIGGERED upon tripwire breach');
  assert(canaryService.getStatus().lastTriggered.canary === 'financial_report.xlsx', 'Tripwire records correct compromised decoy');

  canaryService.resetCanaries(testSandboxDir);
  assert(canaryService.getStatus().status === 'ACTIVE', 'Canary status resets to ACTIVE on operator reset');
  assert(canaryService.getStatus().lastTriggered === null, 'Last triggered info cleared on reset');

  // ==========================================
  // Section 2: Process Attribution Unit Tests
  // ==========================================
  console.log('\n--- Section 2: Process-to-File Attribution ---');
  const processAttributor = new ProcessAttributionService();

  const fallbackAttr = await processAttributor.attributeFileEvent(null);
  assert(fallbackAttr.processAttribution === 'Process attribution unavailable', 'Honest fallback when process cannot be determined');
  assert(fallbackAttr.attributed === false, 'Attributed boolean flag is false for fallback');

  // Simulated attribution with context
  const testPid = process.pid;
  processAttributor.setSimulatorContext(testPid, 'SandboxRansomwareSimulator');
  const simulatedAttr = await processAttributor.attributeFileEvent(path.join(testSandboxDir, 'financial_report.xlsx'));
  assert(simulatedAttr.name === 'SandboxRansomwareSimulator', 'Attributes known process simulator name');
  assert(simulatedAttr.pid === testPid, 'Attributes valid simulator PID');
  assert(simulatedAttr.attributed === true, 'Attributed boolean flag is true when determined');
  processAttributor.clearSimulatorContext();

  // ==========================================
  // Section 3: Automated Response Policy Unit Tests
  // ==========================================
  console.log('\n--- Section 3: Automated Response Policies ---');
  const policyService = new PolicyService();

  const policies = policyService.getPolicies();
  assert(policies.CRITICAL.quarantine === true, 'CRITICAL default policy has quarantine enabled');
  assert(policies.CRITICAL.desktopNotification === true, 'CRITICAL default policy has desktopNotification enabled');
  assert(policies.CRITICAL.terminateProcess === false, 'CRITICAL default policy has terminateProcess off by default for safety');
  assert(policies.HIGH.quarantine === false, 'HIGH default policy has quarantine configurable (default false)');
  assert(policies.MEDIUM.quarantine === false, 'MEDIUM default policy has quarantine disabled');

  const updatedPolicies = policyService.updatePolicies({
    HIGH: { createIncident: true, quarantine: true, desktopNotification: true, terminateProcess: false }
  });
  assert(updatedPolicies.HIGH.quarantine === true, 'Policy updates persist correctly');

  // Evaluate action
  assert(policyService.evaluatePolicy('CRITICAL').quarantine === true, 'evaluatePolicy returns quarantine=true for CRITICAL');
  assert(policyService.evaluatePolicy('HIGH').quarantine === true, 'evaluatePolicy returns updated quarantine=true for HIGH');
  assert(policyService.evaluatePolicy('MEDIUM').quarantine === false, 'evaluatePolicy returns quarantine=false for MEDIUM');

  // ==========================================
  // Section 4: Incident Correlation & Latency Tests
  // ==========================================
  console.log('\n--- Section 4: Incident Correlation & Timeline ---');
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  const testDb = new DatabaseService(testDbPath);
  testDb.init();

  const correlator = new IncidentCorrelator(5000, testDb);

  // Add 1st event
  const corr1 = correlator.correlateThreatEvent({
    fileEvent: { fullPath: path.join(testSandboxDir, 'file1.txt'), filename: 'file1.txt', entropy: 7.8, size: 4096 },
    features: { average_entropy: 7.8, suspicious_extension_count: 0 },
    riskAnalysis: { riskScore: 88, status: 'HIGH', breakdown: {} },
    threatMatch: { matchedFamily: 'WannaCry', severity: 'HIGH', riskScore: 88, reasons: ['High entropy encryption wave'] },
    canaryInfo: null,
    processInfo: { name: 'Simulator', pid: 1234 }
  });
  assert(corr1.isNew === true, 'First event creates a new correlated incident candidate');
  assert(corr1.filesAffected === 1, 'Correlated incident has 1 file initially');
  assert(corr1.incident.rawData.timeline.length >= 4, 'Timeline contains initial analysis steps');

  // Add 2nd event in burst
  const corr2 = correlator.correlateThreatEvent({
    fileEvent: { fullPath: path.join(testSandboxDir, 'file2.txt'), filename: 'file2.txt', entropy: 7.9, size: 8192 },
    features: { average_entropy: 7.85, suspicious_extension_count: 0 },
    riskAnalysis: { riskScore: 94, status: 'CRITICAL', breakdown: {} },
    threatMatch: { matchedFamily: 'WannaCry', severity: 'CRITICAL', riskScore: 94, reasons: ['Rapid file encryption'] },
    canaryInfo: null,
    processInfo: { name: 'Simulator', pid: 1234 },
    quarantineResult: { id: 'Q-001', sha256: 'abc1234567890abcdef1234567890' }
  });
  assert(corr2.isNew === false, 'Second burst event correlates into existing incident');
  assert(corr2.filesAffected === 2, 'filesAffected increments to 2');
  assert(corr2.incident.rawData.affectedFiles.length === 2, 'affectedFiles retains evidence of both files');
  assert(corr2.incident.riskScore === 94, 'Incident risk score updates to highest detected risk (94)');
  assert(corr2.incident.rawData.mutationRate > 0, 'Mutation rate is calculated for burst');

  // Timeline verification
  const stages = corr2.incident.rawData.timeline.map(t => t.step);
  assert(stages.includes('FILE_MODIFICATION'), 'Timeline includes FILE_MODIFICATION step');
  assert(stages.includes('ENTROPY_ANALYSIS'), 'Timeline includes ENTROPY_ANALYSIS step');
  assert(stages.includes('RISK_CALCULATED'), 'Timeline includes RISK_CALCULATED step');
  assert(stages.includes('INCIDENT_CREATED'), 'Timeline includes INCIDENT_CREATED step');
  assert(stages.includes('FILE_MUTATION_BURST'), 'Timeline includes correlated FILE_MUTATION_BURST step');

  // Latency calculation verification
  assert(corr2.incident.rawData.detectionLatencyMs >= 0, 'Detection latency is non-negative number');
  assert(corr2.incident.rawData.containmentLatencyMs >= 0, 'Containment latency is non-negative number');
  assert(corr2.incident.rawData.totalResponseTimeMs >= corr2.incident.rawData.detectionLatencyMs, 'Total response time encompasses detection time');

  testDb.close();
  cleanDbFiles(testDbPath);

  // ==========================================
  // Section 5: Integration with Backend Server Endpoints
  // ==========================================
  console.log('\n--- Section 5: Backend Server API & Health Integration ---');
  const testServerPort = 8009;
  const serverProcess = spawn('node', ['server/server.js'], {
    env: {
      ...process.env,
      PORT: String(testServerPort),
      DB_PATH: testDbPath,
      SANDBOX_DIR: testSandboxDir,
      NODE_ENV: 'test'
    },
    cwd: projectRoot,
    stdio: 'pipe'
  });
  serverProcess.stdout.on('data', () => {});
  serverProcess.stderr.on('data', () => {});

  // Wait for server to start with polling
  let serverReady = false;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetchJson(`http://127.0.0.1:${testServerPort}/api/system/health`);
      if (res.status === 200) {
        serverReady = true;
        break;
      }
    } catch {}
  }
  assert(serverReady === true, 'Test server started and responded on port 8009');

  try {
    // Test Health Endpoint
    const healthRes = await fetchJson(`http://localhost:${testServerPort}/api/system/health`);
    assert(healthRes.status === 200, 'Health endpoint returns 200 OK');
    assert(healthRes.data.backend === 'ONLINE', 'Backend service health is ONLINE');
    assert(healthRes.data.database === 'ONLINE', 'Database service health is ONLINE');
    assert(healthRes.data.fileWatcher === 'ONLINE', 'File watcher service health is ONLINE');
    assert(healthRes.data.quarantine === 'ONLINE', 'Quarantine service health is ONLINE');
    assert(healthRes.data.notifications === 'ONLINE', 'Notification service health is ONLINE');
    assert(['ONLINE', 'OFFLINE'].includes(healthRes.data.mlEngine), 'ML Engine health reflects real microservice state');
    assert(['FULL_PROTECTION', 'HEURISTIC_ACTIVE'].includes(healthRes.data.protectionMode), 'Protection mode reflects AI + heuristic or heuristic-fallback state');

    // Test Canaries Status API
    const canariesRes = await fetchJson(`http://localhost:${testServerPort}/api/canaries/status`);
    assert(canariesRes.status === 200, 'Canaries status endpoint returns 200 OK');
    assert(canariesRes.data.status === 'ACTIVE' || canariesRes.data.status === 'TRIGGERED', 'Canaries status has valid state');
    assert(Array.isArray(canariesRes.data.canaries) && canariesRes.data.canaries.length === 5, 'Canaries endpoint returns all 5 decoy files');

    // Test Policies API
    const policiesGetRes = await fetchJson(`http://localhost:${testServerPort}/api/policies`);
    assert(policiesGetRes.status === 200, 'GET /api/policies returns 200 OK');
    assert(policiesGetRes.data.CRITICAL.quarantine === true, 'CRITICAL policy quarantine is true');

    const policiesPostRes = await fetchJson(`http://localhost:${testServerPort}/api/policies`, {
      method: 'POST',
      body: JSON.stringify({
        policies: {
          HIGH: { createIncident: true, quarantine: true, desktopNotification: true, terminateProcess: false }
        }
      })
    });
    assert(policiesPostRes.status === 200, 'POST /api/policies returns 200 OK');
    const returnedHighPolicy = policiesPostRes.data.HIGH || policiesPostRes.data.policies?.HIGH;
    assert(returnedHighPolicy?.quarantine === true, 'Policy updated successfully via API');

    // ==========================================
    // Section 6: End-to-End Synthetic Attack -> Canary -> Correlated Incident -> Response
    // ==========================================
    console.log('\n--- Section 6: End-to-End Simulation Flow & Timeline Validation ---');
    const ws = new WebSocket(`ws://localhost:${testServerPort}/ws/telemetry`);
    let receivedSecNotification = null;

    ws.on('message', (msg) => {
      try {
        const parsed = JSON.parse(msg.toString());
        if (parsed.type === 'SECURITY_NOTIFICATION') {
          receivedSecNotification = parsed.payload || parsed.data;
        }
      } catch (err) {}
    });

    await new Promise((resolve) => {
      ws.on('open', resolve);
      setTimeout(resolve, 500);
    });

    // Trigger synthetic canary attack scenario via test endpoint
    const synthRes = await fetchJson(`http://localhost:${testServerPort}/api/synthetic/test`, {
      method: 'POST',
      body: JSON.stringify({ scenario: 'canary' })
    });
    assert(synthRes.status === 200, 'POST /api/synthetic/test triggered canary scenario');

    // Allow event pipeline propagation
    await new Promise(r => setTimeout(r, 1500));

    // Verify Canary Status
    const tripCanariesRes = await fetchJson(`http://localhost:${testServerPort}/api/canaries/status`);
    assert(tripCanariesRes.data.status === 'TRIGGERED', 'Canaries status transitioned to TRIGGERED on file modification');

    // Verify Correlated Incident Created
    const incidentsRes = await fetchJson(`http://localhost:${testServerPort}/api/incidents`);
    assert(incidentsRes.status === 200 && incidentsRes.data.length > 0, 'Incident created in SQLite database');
    const canaryInc = incidentsRes.data.find(i => i.title.includes('CANARY') || (i.rawData && i.rawData.canaryTriggered));
    assert(canaryInc != null, 'Found canary-triggered incident in incident list');
    assert(canaryInc.severity === 'CRITICAL', 'Canary incident has CRITICAL severity');
    assert(canaryInc.riskScore >= 90, 'Canary incident has risk score >= 90 (Got: ' + canaryInc.riskScore + ')');
    assert(canaryInc.rawData.canaryTriggered === true, 'Incident rawData has canaryTriggered=true');
    assert(canaryInc.rawData.timeline && canaryInc.rawData.timeline.length >= 4, 'Incident contains complete timestamped timeline');
    assert(canaryInc.rawData.detectionLatencyMs >= 0, 'Incident contains detection latency');

    // Verify Notification Sent
    assert(receivedSecNotification != null, 'SECURITY_NOTIFICATION WebSocket event received for canary incident');
    assert(receivedSecNotification?.severity === 'CRITICAL', 'Notification severity is CRITICAL');

    ws.close();

    // Reset canaries via API
    const resetRes = await fetchJson(`http://localhost:${testServerPort}/api/canaries/reset`, {
      method: 'POST'
    });
    assert(resetRes.status === 200, 'POST /api/canaries/reset returns 200 OK');
    assert(resetRes.data.status.status === 'ACTIVE', 'Canaries status is ACTIVE after reset');
  } finally {
    serverProcess.kill('SIGTERM');
    cleanDbFiles(testDbPath);
    if (fs.existsSync(testSandboxDir)) {
      try { fs.rmSync(testSandboxDir, { recursive: true, force: true }); } catch (e) {}
    }
  }

  // Summary
  console.log(`\n[Test Summary] ${passed}/${total} Phase 2 Tests Passed.`);
  if (passed === total) {
    console.log('🎉 All Phase 2 Endpoint Protection & Incident Response tests PASSED!');
    process.exit(0);
  } else {
    console.error(`💥 ${total - passed} test(s) FAILED!`);
    process.exit(1);
  }
}

runPhase2TestSuite().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
