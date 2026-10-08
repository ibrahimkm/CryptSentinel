import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { systemMonitor } from './systemMonitor.js';
import { fileWatcher } from './fileWatcher.js';
import { patternMatcher } from './patternMatcher.js';
import { SyntheticTestRunner } from './testRunner.js';
import { dbService } from './db.js';
import { featureExtractor } from './featureExtractor.js';
import { riskEngine } from './riskEngine.js';
import { quarantineService } from './quarantineService.js';
import { mlClient } from './mlClient.js';
import { canaryService } from './canaryService.js';
import { processAttribution } from './processAttribution.js';
import { policyService } from './policyService.js';
import { incidentCorrelator } from './incidentCorrelator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws/telemetry' });

app.use(cors());
app.use(express.json());

// Initialize Sandbox Directory, Canary Decoys, and File Watcher
const sandboxPath = process.env.SANDBOX_DIR || path.resolve(projectRoot, 'monitored_sandbox');
if (!fs.existsSync(sandboxPath)) {
  fs.mkdirSync(sandboxPath, { recursive: true });
}
// Deploy canaries before watcher starts
canaryService.initCanaries(sandboxPath);
const testRunner = new SyntheticTestRunner(sandboxPath);

// Start watching sandbox
fileWatcher.watchDirectory(sandboxPath);

console.log(`[CryptSentinel Core] Initialized on ${systemMonitor.getPlatformInfo().platform}`);
console.log(`[CryptSentinel Core] Monitored Sandbox Directory: ${sandboxPath}`);

// Broadcast helper for connected WebSockets
function broadcast(type, payload) {
  const message = JSON.stringify({ type, payload });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (err) {
        console.error('[WebSocket] Send error:', err);
      }
    }
  });
}

// Hook FileWatcher events into FeatureExtractor, ProcessAttribution, CanaryService, PatternMatcher, ML & SQLite
fileWatcher.onEvent(async (fileEvent) => {
  const eventStartHrTime = process.hrtime.bigint();

  // 1. Process attribution check using real OS APIs
  const procInfo = await processAttribution.attributeFileEvent(fileEvent.fullPath);
  fileEvent.pid = procInfo.pid;
  fileEvent.processAttribution = procInfo.processAttribution;
  fileEvent.process = procInfo.name || 'Sandbox Watchdog';

  // 2. Check if a Canary decoy file was touched
  const canaryInfo = canaryService.isCanaryFile(fileEvent.fullPath)
    ? canaryService.getCanaryMetadata(fileEvent.fullPath)
    : null;

  // 3. Add to feature extractor sliding window buffer
  featureExtractor.addEvent(fileEvent);

  // 4. Persist detection record into SQLite
  dbService.createDetection({
    eventType: fileEvent.eventType,
    fullPath: fileEvent.fullPath,
    filename: fileEvent.filename,
    extension: fileEvent.extension,
    entropy: fileEvent.entropy,
    mutationVelocity: fileEvent.mutationVelocity,
    size: fileEvent.size,
    isSuspicious: fileEvent.isSuspiciousExtension || fileEvent.entropy >= 7.2 || !!canaryInfo
  });

  // 5. Broadcast raw file event over WebSocket
  broadcast('FILE_EVENT', {
    timestamp: fileEvent.timestamp,
    pid: procInfo.pid,
    process: procInfo.name || 'Sandbox Endpoint Monitoring',
    processAttribution: procInfo.processAttribution,
    path: fileEvent.fullPath,
    entropy: fileEvent.entropy,
    entropyDelta: fileEvent.entropyDelta,
    eventType: fileEvent.eventType,
    isSuspiciousExtension: fileEvent.isSuspiciousExtension,
    isCanary: !!canaryInfo
  });

  // 6. Extract current behavioral feature vector
  const features = await featureExtractor.extractFeatures();

  // 7. Evaluate against ML service (with heuristic fallback)
  let mlResult = await mlClient.predict(features);

  // 8. Calculate transparent correlated risk score
  const riskAnalysis = riskEngine.calculateRiskScore(
    features,
    mlResult.available ? mlResult.probability : null
  );

  // 9. Check heuristic signature match
  const threatMatch = patternMatcher.evaluateFileEvent(fileEvent, procInfo.attributed ? procInfo : null);

  // 10. Check if Canary Tripwire should be tripped (requires high entropy, suspicious extension, signature, or sharp delta)
  const isCanaryBreach = !!(canaryInfo && (fileEvent.entropy >= 6.5 || fileEvent.isSuspiciousExtension || threatMatch || fileEvent.entropyDelta >= 1.5));
  if (isCanaryBreach) {
    canaryService.triggerCanary(canaryInfo.name, {
      riskScore: Math.max(riskAnalysis.riskScore, 94),
      threatFamily: threatMatch ? threatMatch.matchedFamily : 'Ransomware Mutation Wave'
    });
    dbService.createAuditLog({
      actionType: 'CANARY_TRIPWIRE_TRIGGERED',
      actor: 'CANARY_WATCHDOG',
      details: {
        canary: canaryInfo.name,
        filePath: fileEvent.fullPath,
        entropy: fileEvent.entropy,
        process: procInfo.processAttribution
      }
    });
  }

  // 11. If critical risk, high risk, threat match, or canary breach: evaluate policies and correlate incident
  if (isCanaryBreach || riskAnalysis.tier === 'CRITICAL' || riskAnalysis.tier === 'HIGH' || threatMatch) {
    const severity = isCanaryBreach
      ? 'CRITICAL'
      : (threatMatch ? (threatMatch.severity === 'ELEVATED' ? 'HIGH' : threatMatch.severity) : riskAnalysis.status);
    
    // Evaluate automated response policy
    const policy = policyService.evaluatePolicy(severity);

    // Automated Policy: Quarantine
    let quarantineResult = null;
    if (policy.quarantine && (fileEvent.entropy >= 7.5 || isCanaryBreach) && fileEvent.exists) {
      try {
        quarantineResult = await quarantineService.quarantineFile(
          fileEvent.fullPath,
          isCanaryBreach 
            ? `Auto-quarantine: Canary honeypot tripped (${canaryInfo.name})`
            : `Auto-quarantine: ${threatMatch ? threatMatch.matchedFamily : 'High entropy burst'} (${fileEvent.entropy})`
        );
        dbService.createAuditLog({
          actionType: 'AUTOMATED_QUARANTINE',
          actor: 'AUTONOMOUS_POLICY',
          details: {
            filePath: fileEvent.fullPath,
            vaultPath: quarantineResult.quarantinePath,
            sha256: quarantineResult.sha256
          }
        });
      } catch (qErr) {
        console.warn('[Auto-Quarantine] Skipped or file already moved:', qErr.message);
      }
    }

    // Automated Policy: Process Termination
    let terminatedProc = null;
    if (policy.terminateProcess && procInfo.attributed && procInfo.pid && procInfo.pid !== process.pid && procInfo.pid !== 1) {
      try {
        const killRes = await systemMonitor.killProcess(procInfo.pid);
        if (killRes.success) {
          terminatedProc = { pid: procInfo.pid, name: procInfo.name };
          dbService.createAuditLog({
            actionType: 'AUTOMATED_PROCESS_KILL',
            actor: 'AUTONOMOUS_POLICY',
            details: { pid: procInfo.pid, name: procInfo.name }
          });
        }
      } catch (kErr) {
        console.warn('[Auto-ProcessKill] Failed to terminate:', kErr.message);
      }
    }

    // Correlate threat event into Incident and track timeline & latency
    const correlationResult = incidentCorrelator.correlateThreatEvent({
      fileEvent,
      features,
      riskAnalysis,
      threatMatch,
      canaryInfo: isCanaryBreach ? canaryInfo : null,
      processInfo: procInfo,
      quarantineResult,
      terminatedProcess: terminatedProc,
      mlResult,
      eventStartHrTime
    });

    const incident = correlationResult.incident;

    // Broadcast unified SECURITY_NOTIFICATION event (respecting desktopNotification policy)
    if (policy.desktopNotification !== false) {
      broadcast('SECURITY_NOTIFICATION', {
        incidentId: incident.id,
        severity: incident.severity,
        title: incident.title,
        message: isCanaryBreach 
          ? `Honeypot canary tripped on ${canaryInfo.name}. Autonomous containment active.`
          : (threatMatch ? threatMatch.reasons.join('. ') : `Observed ${features.files_modified + features.files_created} file operations with average entropy ${features.average_entropy}`),
        riskScore: incident.risk_score || incident.riskScore || riskAnalysis.riskScore,
        threatFamily: isCanaryBreach ? `Canary (${canaryInfo.name})` : (threatMatch ? threatMatch.matchedFamily : 'Ransomware Mutation Wave'),
        filePath: fileEvent.fullPath,
        action: quarantineResult ? 'QUARANTINED' : 'MONITORED',
        quarantineItem: quarantineResult,
        timestamp: incident.timestamp,
        canaryTriggered: isCanaryBreach,
        canaryName: isCanaryBreach ? canaryInfo.name : null,
        processInfo: procInfo,
        location: {
          modifiedFilePath: fileEvent.fullPath,
          sandboxPath,
          processName: procInfo.name || 'Sandbox Watchdog',
          processPid: procInfo.pid || 0,
          processAttribution: procInfo.processAttribution,
          entropy: fileEvent.entropy
        },
        mitreTactics: incident.mitreTactics,
        filesAffected: correlationResult.filesAffected,
        mutationRate: correlationResult.mutationRate
      });
    }

    // Broadcast instant alert & risk update
    broadcast('ALERT', {
      id: incident.id,
      incidentId: incident.id,
      title: incident.title,
      time: new Date().toLocaleTimeString('en-GB') + ' UTC',
      severity: incident.severity,
      location: {
        modifiedFilePath: fileEvent.fullPath,
        sandboxPath,
        processAttribution: procInfo.processAttribution
      },
      mitreTactics: incident.mitreTactics
    });

    broadcast('THREAT_MATCH', {
      id: incident.id,
      incidentId: incident.id,
      timestamp: incident.timestamp,
      severity: incident.severity,
      riskScore: incident.risk_score || incident.riskScore,
      matchedFamily: isCanaryBreach ? `Canary Tripwire (${canaryInfo.name})` : (threatMatch ? threatMatch.matchedFamily : 'High Entropy Threat Pattern'),
      title: incident.title,
      action: quarantineResult ? 'QUARANTINED' : 'MONITORED',
      canaryTriggered: isCanaryBreach,
      location: {
        modifiedFilePath: fileEvent.fullPath,
        targetFilename: fileEvent.filename,
        processName: procInfo.name || 'Sandbox Watchdog',
        processPid: procInfo.pid || 0,
        processAttribution: procInfo.processAttribution,
        entropy: fileEvent.entropy
      },
      reasons: isCanaryBreach ? [`Canary decoy file modified (${canaryInfo.name})`] : (threatMatch ? threatMatch.reasons : ['High entropy burst'])
    });

    broadcast('RISK_UPDATE', {
      status: incident.severity,
      aggregateProbability: incident.risk_score || incident.riskScore,
      threatProbability: incident.risk_score || incident.riskScore,
      vector: isCanaryBreach ? 'CANARY_TRIPWIRE' : riskAnalysis.vector,
      mlStatus: riskAnalysis.mlStatus
    });

    if (correlationResult.isNew) {
      broadcast('INCIDENT_CREATED', incident);
    } else {
      broadcast('INCIDENT_UPDATED', incident);
    }

    broadcast('CANARY_UPDATE', canaryService.getStatus());
  }
});

// WebSocket Connection Lifecycle
wss.on('connection', async (ws) => {
  console.log('[WebSocket] Client connected');
  const latestPred = dbService.getLatestPrediction();
  const mlHealth = await mlClient.checkHealth();
  const canaries = canaryService.getStatus();
  const activeIncidents = dbService.getActiveIncidents(1);
  const now = Date.now();
  const isLiveThreat = canaries.status === 'TRIGGERED' || (activeIncidents.length > 0 && (now - new Date(activeIncidents[0].timestamp).getTime() <= 30000));

  // Send initial system status & engine health (defaults to PROTECTED when no active threat is unfolding)
  ws.send(JSON.stringify({
    type: 'SYSTEM_STATUS',
    payload: {
      status: isLiveThreat ? (canaries.status === 'TRIGGERED' ? 'CRITICAL' : activeIncidents[0].severity) : 'PROTECTED',
      host: systemMonitor.getPlatformInfo(),
      sandboxPath,
      latestPrediction: latestPred,
      canaryStatus: canaries,
      mlEngineStatus: mlHealth.available ? 'ONLINE' : 'OFFLINE',
      mlFallback: mlHealth.available ? 'FULL_AI_HEURISTIC' : 'HEURISTIC_ACTIVE'
    }
  }));

  ws.on('close', () => {
    console.log('[WebSocket] Client disconnected');
  });
});

// Periodic Telemetry Loop
setInterval(async () => {
  try {
    const processes = await systemMonitor.getLiveProcesses(15);
    const hostInfo = systemMonitor.getPlatformInfo();

    broadcast('PROCESS_UPDATE_BATCH', {
      processes: processes.slice(0, 10),
      host: hostInfo
    });
  } catch {}
}, 3500);

// --- REST API ENDPOINTS ---

// 1. Host Info & System Status
app.get('/api/system/status', async (req, res) => {
  const host = systemMonitor.getPlatformInfo();
  const latestPred = dbService.getLatestPrediction();
  const liveProcs = await systemMonitor.getLiveProcesses(50);
  const quarantinedItems = quarantineService.getQuarantinedItems(100);
  const isolatedCount = quarantinedItems.filter(q => q.status === 'QUARANTINED').length;
  const features = await featureExtractor.extractFeatures();
  const riskAnalysis = riskEngine.calculateRiskScore(
    features,
    latestPred ? latestPred.probability : null
  );
  const mlHealth = await mlClient.checkHealth();
  const canaries = canaryService.getStatus();
  const activeIncidents = dbService.getActiveIncidents(5);
  const now = Date.now();
  const recentActiveIncident = activeIncidents.find(inc => {
    const incTime = new Date(inc.timestamp).getTime();
    return (now - incTime) <= 30000;
  });

  const isLiveThreat = canaries.status === 'TRIGGERED' || !!recentActiveIncident || riskAnalysis.tier === 'CRITICAL' || riskAnalysis.tier === 'HIGH';

  const currentStatus = isLiveThreat
    ? (canaries.status === 'TRIGGERED' ? 'CRITICAL' : (recentActiveIncident ? recentActiveIncident.severity : riskAnalysis.status))
    : 'PROTECTED';

  const currentProbability = isLiveThreat
    ? (canaries.status === 'TRIGGERED' ? Math.max(92, riskAnalysis.riskScore) : (recentActiveIncident ? recentActiveIncident.riskScore : riskAnalysis.riskScore))
    : 0.0;

  res.json({
    status: currentStatus,
    aggregateProbability: currentProbability,
    behavioralScore: currentProbability / 100,
    escalationHorizonSeconds: isLiveThreat ? '02-08s' : '18-42s',
    escalationDescription: isLiveThreat
      ? 'Ransomware mutation pattern actively matched in sandbox.'
      : 'System operates normally under sandbox endpoint monitoring.',
    vector: isLiveThreat ? (canaries.status === 'TRIGGERED' ? 'CANARY_TRIPWIRE' : riskAnalysis.vector) : 'SYSTEM_BASELINE',
    confidence: 'HI',
    activeNodes: liveProcs.length > 0 ? liveProcs.length : 1,
    isolatedNodes: isolatedCount,
    systemArmed: true,
    threatProbability: currentProbability,
    host,
    sandboxPath,
    monitoringScope: 'Sandbox Endpoint Monitoring',
    riskBreakdown: isLiveThreat ? riskAnalysis.breakdown : { baseline: 0, entropy: 0, mutationRate: 0, extensionAnomaly: 0, mlInference: 0 },
    mlEngine: mlHealth.available ? 'ONLINE' : 'OFFLINE',
    mlFallback: mlHealth.available ? 'FULL_AI_HEURISTIC' : 'HEURISTIC_ACTIVE',
    protectionMode: mlHealth.available ? 'FULL_PROTECTION' : 'HEURISTIC_ACTIVE',
    canaryStatus: canaries.status
  });
});

// 1.1 Security Engine Health Endpoint (Phase 2)
app.get('/api/system/health', async (req, res) => {
  const mlHealth = await mlClient.checkHealth();
  const canaryStatus = canaryService.getStatus();

  const health = {
    backend: 'ONLINE',
    fileWatcher: fileWatcher.watchers.size > 0 ? 'ONLINE' : 'DEGRADED',
    mlEngine: mlHealth.available ? 'ONLINE' : 'OFFLINE',
    mlFallback: mlHealth.available ? 'FULL_AI_HEURISTIC' : 'HEURISTIC_ACTIVE',
    protectionMode: mlHealth.available ? 'FULL_PROTECTION' : 'HEURISTIC_ACTIVE',
    database: dbService.db ? 'ONLINE' : 'OFFLINE',
    websocket: 'ONLINE',
    notifications: 'ONLINE',
    quarantine: 'ONLINE',
    canaries: canaryStatus.status === 'ACTIVE' ? 'ONLINE' : 'TRIGGERED',
    timestamp: new Date().toISOString()
  };

  res.json(health);
});

// Telemetry Stream Endpoint
app.get('/api/telemetry/stream', (req, res) => {
  const limit = parseInt(req.query.limit || '50', 10);
  const detections = dbService.getDetections(limit);
  const formattedLogs = detections.map(d => ({
    id: d.id,
    timestamp: new Date(d.timestamp).toLocaleTimeString('en-GB') + '.' + String(new Date(d.timestamp).getMilliseconds()).padStart(3, '0'),
    level: d.entropy >= 7.2 ? 'CRITICAL' : (d.is_suspicious ? 'WARN' : 'INFO'),
    pid: null,
    process: 'Sandbox Watchdog',
    message: `${d.event_type}: ${d.full_path} (Entropy: ${d.entropy})`
  }));
  res.json(formattedLogs);
});

// 2. Real-time Process List
app.get('/api/processes', async (req, res) => {
  const query = req.query.q ? req.query.q.toLowerCase() : '';
  const list = await systemMonitor.getLiveProcesses(50);
  if (!query) return res.json(list);
  res.json(list.filter(p => p.name.toLowerCase().includes(query) || String(p.pid).includes(query)));
});

// 3. Process Details & Kill
app.get('/api/processes/:pid', async (req, res) => {
  const details = await systemMonitor.getProcessDetails(req.params.pid);
  res.json(details);
});

app.post('/api/processes/:pid/kill', async (req, res) => {
  const result = await systemMonitor.killProcess(req.params.pid);
  dbService.createAuditLog({
    actionType: 'PROCESS_TERMINATE',
    actor: 'SOC_OPERATOR',
    details: { pid: req.params.pid, result }
  });
  if (result.success) {
    broadcast('SECURITY_NOTIFICATION', {
      incidentId: null,
      severity: 'INFO',
      title: 'Process Terminated',
      message: `Process PID ${req.params.pid} terminated by operator action.`,
      riskScore: 0,
      threatFamily: 'Process Control',
      action: 'TERMINATED',
      processInfo: { pid: req.params.pid, name: result.name || `PID ${req.params.pid}` },
      timestamp: new Date().toISOString()
    });
  }
  res.json(result);
});

// 4. File Protection & Entropy Stats
app.get('/api/files/protection-stats', (req, res) => {
  const recentLogs = fileWatcher.getRecentLogs(15);
  const entropyStats = fileWatcher.getRollingEntropyStats(20);
  const quarantinedItems = quarantineService.getQuarantinedItems(50);
  const incidents = dbService.getIncidents(10);
  const canaryStatus = canaryService.getStatus();

  res.json({
    entropyRate: entropyStats.current,
    entropyBaseline: entropyStats.baseline,
    entropyDelta: entropyStats.delta,
    peakEntropy: entropyStats.peak,
    mutationRatePerSec: recentLogs.length > 0 ? (recentLogs[0].mutationVelocity || 1) * 2 : 0,
    quarantinedCount: quarantinedItems.filter(q => q.status === 'QUARANTINED').length,
    canaryStatus: canaryStatus.status === 'ACTIVE' ? 'ACTIVE_ARMED' : 'CANARY_TRIGGERED',
    canaries: canaryStatus,
    tripwiresTripped: canaryStatus.status === 'TRIGGERED' ? 1 : 0,
    monitoringScope: 'Sandbox Endpoint Monitoring',
    recentMutations: recentLogs.map(l => ({
      path: l.fullPath,
      entropy: l.entropy,
      entropyDelta: l.entropyDelta,
      pid: l.pid || null,
      processAttribution: l.processAttribution || 'Process attribution unavailable',
      action: l.entropy >= 7.2 ? 'QUARANTINED' : 'MONITORED'
    }))
  });
});

// 4.1 Canary Honeypot Endpoints
app.get('/api/canaries/status', (req, res) => {
  res.json(canaryService.getStatus());
});

app.post('/api/canaries/reset', (req, res) => {
  canaryService.resetCanaries(sandboxPath);
  broadcast('CANARY_UPDATE', canaryService.getStatus());
  res.json({ success: true, status: canaryService.getStatus() });
});

// 4.2 Automated Response Policies Endpoints
app.get('/api/policies', (req, res) => {
  res.json(policyService.getPolicies());
});

app.post('/api/policies', (req, res) => {
  const updated = policyService.updatePolicies(req.body);
  dbService.createAuditLog({
    actionType: 'POLICY_UPDATE',
    actor: 'SOC_OPERATOR',
    details: updated
  });
  broadcast('POLICY_UPDATE', updated);
  res.json(updated);
});

// 5. ML Prediction Endpoints (Phase 5)
// 5.1 Latest Prediction
app.get('/api/prediction/latest', async (req, res) => {
  const latest = dbService.getLatestPrediction();
  if (latest) {
    return res.json(latest);
  }
  // If no stored prediction yet, run on current feature window
  const features = await featureExtractor.extractFeatures();
  const pred = await mlClient.predict(features);
  res.json(pred);
});

// 5.2 Model Metadata & Status
app.get('/api/prediction/model', async (req, res) => {
  const info = await mlClient.getModelInfo();
  res.json(info);
});

// 5.3 Real Evaluation Metrics from Test Set
app.get('/api/prediction/evaluation', async (req, res) => {
  const evalMetrics = await mlClient.getEvaluation();
  res.json(evalMetrics);
});

// 5.4 Analyze Feature Vector via ML Model
app.post('/api/prediction/analyze', async (req, res) => {
  try {
    const inputFeatures = req.body.features || req.body;
    const result = await mlClient.predict(inputFeatures);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Quarantine Endpoints
app.get('/api/quarantine', (req, res) => {
  const items = quarantineService.getQuarantinedItems(100);
  res.json(items);
});

app.post('/api/quarantine/:id/restore', async (req, res) => {
  try {
    const restored = await quarantineService.restoreFile(req.params.id);
    res.json({ success: true, item: restored });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/quarantine/:id/delete', async (req, res) => {
  try {
    const deleted = await quarantineService.deletePermanently(req.params.id);
    res.json({ success: true, item: deleted });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 7. Incidents & Audit Logs
app.get('/api/incidents', (req, res) => {
  const list = dbService.getIncidents(100);
  res.json(list);
});

app.get('/api/incidents/:id', (req, res) => {
  const incident = dbService.getIncidentById(req.params.id);
  if (!incident) return res.status(404).json({ error: 'Incident not found' });
  res.json(incident);
});

app.patch('/api/incidents/:id/status', (req, res) => {
  const { status } = req.body;
  const updated = dbService.updateIncidentStatus(req.params.id, status || 'CONTAINED');
  if (!updated) return res.status(404).json({ error: 'Incident not found' });

  dbService.createAuditLog({
    actionType: 'INCIDENT_STATUS_UPDATE',
    actor: 'SOC_OPERATOR',
    details: { incidentId: req.params.id, status: status || 'CONTAINED' }
  });

  // If no remaining active live threats or canaries, return system posture to PROTECTED
  const canaries = canaryService.getStatus();
  const activeIncidents = dbService.getActiveIncidents(5);
  const now = Date.now();
  const remainingLive = canaries.status === 'TRIGGERED' || activeIncidents.some(i => (now - new Date(i.timestamp).getTime()) <= 30000);

  if (!remainingLive) {
    broadcast('RISK_UPDATE', {
      status: 'PROTECTED',
      aggregateProbability: 0,
      threatProbability: 0,
      vector: 'SYSTEM_BASELINE',
      mlStatus: 'READY'
    });
  }

  broadcast('INCIDENT_UPDATED', updated);
  res.json(updated);
});

app.get('/api/audit-logs', (req, res) => {
  const limit = parseInt(req.query.limit || '100', 10);
  const logs = dbService.getAuditLogs(limit);
  res.json(logs);
});

// 8. Synthetic Ransomware Patterns Dataset
app.get('/api/synthetic/patterns', (req, res) => {
  res.json(patternMatcher.syntheticData);
});

// 9. Trigger Safe Synthetic Ransomware Scenario
app.post('/api/synthetic/test', async (req, res) => {
  const scenario = req.body.scenario || 'lockbit';
  try {
    dbService.createAuditLog({
      actionType: 'SIMULATION_START',
      actor: 'SOC_OPERATOR',
      details: { scenario, sandboxPath }
    });
    const result = await testRunner.runSyntheticAttack(scenario);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Reset Sandbox
app.post('/api/synthetic/reset', (req, res) => {
  testRunner.resetSandbox();
  canaryService.resetCanaries(sandboxPath);
  incidentCorrelator.resetCorrelationState();
  dbService.resolveOpenIncidents();
  featureExtractor.clear();
  dbService.createAuditLog({
    actionType: 'SIMULATION_RESET',
    actor: 'SOC_OPERATOR',
    details: { message: 'Sandbox restored, canaries re-armed, and test incidents resolved' }
  });
  broadcast('CANARY_UPDATE', canaryService.getStatus());
  broadcast('RISK_UPDATE', {
    status: 'PROTECTED',
    aggregateProbability: 0,
    threatProbability: 0,
    vector: 'SYSTEM_BASELINE',
    mlStatus: 'READY'
  });
  res.json({ success: true, message: 'Sandbox restored to clean state' });
});

// Root Health Probe for Container / Orchestrator Liveness
app.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'CryptSentinel-Backend',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime())
  });
});

// Static Production Assets & SPA Fallback
const distPath = path.resolve(projectRoot, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/ws')) {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
    }
    next();
  });
}

const HOST = process.env.HOST || '0.0.0.0';
const PORT = parseInt(process.env.PORT || '8000', 10);

server.listen(PORT, HOST, () => {
  console.log(`[CryptSentinel Server] Listening on http://${HOST}:${PORT}`);
  console.log(`[CryptSentinel Server] Telemetry WebSocket at ws://${HOST}:${PORT}/ws/telemetry`);
});

// Graceful shutdown handling
function handleShutdown(signal) {
  console.log(`\n[CryptSentinel Server] Received ${signal}. Starting graceful shutdown...`);
  try { fileWatcher.closeAll(); } catch {}

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try { client.close(1001, 'Server shutting down'); } catch {}
    }
  });

  server.close(() => {
    console.log('[CryptSentinel Server] HTTP/WS server closed.');
    try {
      dbService.close();
      console.log('[CryptSentinel Server] SQLite database closed.');
    } catch {}
    process.exit(0);
  });

  setTimeout(() => {
    console.error('[CryptSentinel Server] Forced shutdown after timeout.');
    process.exit(1);
  }, 5000).unref();
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

