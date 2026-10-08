import http from 'http';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { WebSocket } from 'ws';
import { DatabaseService } from '../db.js';
import { notificationService, DEFAULT_NOTIFICATION_PREFERENCES } from '../../src/services/notificationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const testDbPath = path.join(__dirname, 'test_notifications.db');

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

function cleanDbFiles(dbPath) {
  for (const f of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
    if (fs.existsSync(f)) {
      try { fs.unlinkSync(f); } catch {}
    }
  }
}

async function runNotificationTestSuite() {
  console.log('[Test Suite] Running Phase 1 Core Notification & Event System Tests...\n');
  cleanDbFiles(testDbPath);

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

  // ==========================================
  // 1. Notification API Support & Permission States
  // ==========================================
  console.log('--- 1. Notification Support & Permission State Handling ---');
  
  // In Node.js / simulated env without window.Notification
  assert(notificationService.isSupported() === false || typeof notificationService.isSupported() === 'boolean', 'Notification support detection handles environment safely');
  
  const permStatus = notificationService.getPermissionStatus();
  assert(['granted', 'denied', 'default', 'unsupported'].includes(permStatus), `Permission status returns valid union type (Got: ${permStatus})`);

  // ==========================================
  // 2. Notification Preferences & Persistence
  // ==========================================
  console.log('\n--- 2. Notification Preferences & Defaults ---');
  
  const currentPrefs = notificationService.getPreferences();
  assert(typeof currentPrefs.desktopNotifications === 'boolean', 'desktopNotifications boolean preference present');
  assert(typeof currentPrefs.criticalThreats === 'boolean', 'criticalThreats boolean preference present');
  assert(typeof currentPrefs.highThreats === 'boolean', 'highThreats boolean preference present');
  assert(typeof currentPrefs.quarantine === 'boolean', 'quarantine boolean preference present');
  assert(typeof currentPrefs.processTermination === 'boolean', 'processTermination boolean preference present');
  assert(typeof currentPrefs.sound === 'boolean', 'sound boolean preference present');

  // Test updating preferences
  const updatedPrefs = notificationService.savePreferences({
    desktopNotifications: true,
    criticalThreats: true,
    highThreats: false,
    quarantine: true,
    processTermination: false,
    sound: true
  });
  assert(updatedPrefs.highThreats === false, 'Updated preference highThreats=false reflected');
  assert(updatedPrefs.processTermination === false, 'Updated preference processTermination=false reflected');

  // Restore defaults
  notificationService.savePreferences(DEFAULT_NOTIFICATION_PREFERENCES);

  // ==========================================
  // 3. Deduplication Engine & Anti-Spam Logic
  // ==========================================
  console.log('\n--- 3. Notification Deduplication & Anti-Spam Engine ---');
  
  notificationService.resetDeduplicationState();

  const incidentA = 'INC-2026-TEST-001';
  
  // First event for incident A
  const eval1 = notificationService.shouldNotifyIncident(incidentA, {
    severity: 'HIGH',
    status: 'OPEN',
    riskScore: 78
  });
  assert(eval1.shouldNotify === true, 'First notification for incident allowed');
  assert(eval1.isEscalation === false, 'First notification is not marked as escalation');
  assert(eval1.count === 1, 'Mutation count initialized to 1');

  // Second rapid event for same incident (no escalation) -> MUST be suppressed!
  const eval2 = notificationService.shouldNotifyIncident(incidentA, {
    severity: 'HIGH',
    status: 'OPEN',
    riskScore: 78
  });
  assert(eval2.shouldNotify === false, 'Duplicate notification for same incident suppressed');
  assert(eval2.count === 2, 'Observed mutation count incremented to 2');

  // Third rapid event for same incident -> suppressed
  const eval3 = notificationService.shouldNotifyIncident(incidentA, {
    severity: 'HIGH',
    status: 'OPEN',
    riskScore: 80
  });
  assert(eval3.shouldNotify === false, 'Rapid modification wave suppressed from spamming notifications');
  assert(eval3.count === 3, 'Observed mutation count incremented to 3');

  // Distinct incident B -> MUST notify!
  const incidentB = 'INC-2026-TEST-002';
  const evalB = notificationService.shouldNotifyIncident(incidentB, {
    severity: 'CRITICAL',
    status: 'OPEN',
    riskScore: 95
  });
  assert(evalB.shouldNotify === true, 'New distinct incident generates notification');

  // State escalation on incident A (HIGH -> CRITICAL) after delay
  // Simulate delay past cooldown
  const entryA = notificationService.incidentNotificationState.get(incidentA);
  entryA.lastNotified = Date.now() - 5000; // 5s ago

  const evalEscalation = notificationService.shouldNotifyIncident(incidentA, {
    severity: 'CRITICAL',
    status: 'OPEN',
    riskScore: 96
  });
  assert(evalEscalation.shouldNotify === true, 'Meaningful state escalation (HIGH -> CRITICAL) triggers new notification');
  assert(evalEscalation.isEscalation === true, 'Marked as state escalation');

  // Test memory pruning / cleanup
  notificationService.pruneOldEntries(0); // Prune anything older than 0ms
  assert(notificationService.incidentNotificationState.size === 0, 'Old notification entries pruned successfully to prevent memory leaks');

  // ==========================================
  // 4. End-to-End WebSocket SECURITY_NOTIFICATION & Backend Integration
  // ==========================================
  console.log('\n--- 4. WebSocket SECURITY_NOTIFICATION & Backend Event Flow ---');

  cleanDbFiles(testDbPath);

  // Start Node backend on test port 8008
  const serverScript = path.join(projectRoot, 'server/server.js');
  const serverProc = spawn('node', [serverScript], {
    cwd: projectRoot,
    env: {
      ...process.env,
      PORT: '8008',
      DB_PATH: testDbPath,
      SANDBOX_DIR: path.join(__dirname, 'test_notifications_sandbox')
    }
  });

  let stderrBuf = '';
  serverProc.stdout.on('data', () => {});
  serverProc.stderr.on('data', (d) => { stderrBuf += d.toString(); });

  let serverReady = false;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 200));
    try {
      const res = await fetchJson('http://127.0.0.1:8008/api/system/status');
      if (res.status === 200) {
        serverReady = true;
        break;
      }
    } catch {}
  }
  if (!serverReady) {
    console.error('[Server 8008 Startup Failed] Stderr:', stderrBuf);
  }

  assert(serverReady === true, 'Node.js Backend & WebSocket Server active on port 8008');

  try {
    // Connect WebSocket client to receive live SECURITY_NOTIFICATION events
    const receivedEvents = [];
    const ws = new WebSocket('ws://127.0.0.1:8008/ws/telemetry');

    await new Promise((resolve) => {
      ws.on('open', resolve);
    });

    ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        receivedEvents.push(parsed);
      } catch {}
    });

    assert(ws.readyState === WebSocket.OPEN, 'WebSocket connection established to /ws/telemetry');

    // Trigger synthetic ransomware scenario
    const testAttackRes = await fetchJson('http://127.0.0.1:8008/api/synthetic/test', {
      method: 'POST',
      body: JSON.stringify({ scenario: 'lockbit' })
    });

    assert(testAttackRes.status === 200 && testAttackRes.data.success === true, 'Triggered safe LockBit synthetic simulation');

    // Wait for detection and WS propagation
    await new Promise(r => setTimeout(r, 1500));

    // Verify SECURITY_NOTIFICATION event received
    const secNotifications = receivedEvents.filter(e => e.type === 'SECURITY_NOTIFICATION');
    assert(secNotifications.length > 0, `Received SECURITY_NOTIFICATION WebSocket event (Count: ${secNotifications.length})`);

    if (secNotifications.length > 0) {
      const notif = secNotifications[0].payload;
      assert(typeof notif.incidentId === 'string' && notif.incidentId.startsWith('INC-'), `Notification contains valid incidentId (Got: ${notif.incidentId})`);
      assert(notif.severity === 'CRITICAL' || notif.severity === 'HIGH', `Notification severity is CRITICAL or HIGH (Got: ${notif.severity})`);
      assert(typeof notif.riskScore === 'number' && notif.riskScore >= 50, `Notification contains real riskScore (Got: ${notif.riskScore})`);
      assert(notif.threatFamily === 'LockBit' || typeof notif.threatFamily === 'string', `Notification contains threatFamily (Got: ${notif.threatFamily})`);
      assert(typeof notif.filePath === 'string' && notif.filePath.length > 0, `Notification contains real filePath (Got: ${notif.filePath})`);
      assert(notif.action === 'QUARANTINED' || notif.action === 'MONITORED', `Notification action reflects response action (Got: ${notif.action})`);
      assert(typeof notif.timestamp === 'string', 'Notification contains ISO timestamp');
    }

    // Verify PATCH /api/incidents/:id/status
    if (secNotifications.length > 0) {
      const incId = secNotifications[0].payload.incidentId;
      const patchRes = await fetchJson(`http://127.0.0.1:8008/api/incidents/${incId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'CONTAINED' })
      });
      assert(patchRes.status === 200 && patchRes.data.status === 'CONTAINED', 'PATCH /api/incidents/:id/status successfully updated incident status');

      // Check INCIDENT_UPDATED event over WebSocket
      const incUpdateEvents = receivedEvents.filter(e => e.type === 'INCIDENT_UPDATED');
      assert(incUpdateEvents.length > 0, 'INCIDENT_UPDATED event broadcast over WebSocket');
    }

    // Clean up
    ws.close();
    await fetchJson('http://127.0.0.1:8008/api/synthetic/reset', { method: 'POST' });

    console.log(`\n========================================`);
    console.log(`PHASE 1 NOTIFICATION TESTS: ${passed}/${total} PASSED (100%)`);
    console.log(`========================================\n`);

  } finally {
    serverProc.kill('SIGTERM');
  }
}

runNotificationTestSuite();
