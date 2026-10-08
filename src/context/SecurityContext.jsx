import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { systemService } from '../services/systemService.js';
import { processService } from '../services/processService.js';
import { predictionService } from '../services/predictionService.js';
import { incidentService } from '../services/incidentService.js';
import { fileService } from '../services/fileService.js';
import { telemetryWS } from '../services/websocket.js';
import { notificationService } from '../services/notificationService.js';
import { WS_EVENTS } from '../utils/constants.js';
import { formatTimestamp } from '../utils/formatters.js';
import { ThreatAlertNotification } from '../components/security/ThreatAlertNotification.jsx';
import { ProcessLocatorModal } from '../components/security/ProcessLocatorModal.jsx';

const SecurityContext = createContext(null);

export function SecurityProvider({ children }) {
  const navigate = useNavigate();

  // Global States
  const [systemPosture, setSystemPosture] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [telemetryLogs, setTelemetryLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  
  // Phase 2: Engine Health, Canaries, and Policies
  const [engineHealth, setEngineHealth] = useState({
    backend: 'ONLINE',
    fileWatcher: 'ONLINE',
    mlEngine: 'ONLINE',
    mlFallback: 'FULL_AI_HEURISTIC',
    database: 'ONLINE',
    websocket: 'ONLINE',
    notifications: 'ONLINE',
    quarantine: 'ONLINE',
    canaries: 'ONLINE',
    timestamp: new Date().toISOString()
  });
  const [canaryStatus, setCanaryStatus] = useState({
    status: 'ACTIVE',
    canaryCount: 5,
    lastTriggered: null,
    canaries: []
  });
  const [policies, setPolicies] = useState({
    CRITICAL: { createIncident: true, quarantine: true, desktopNotification: true, terminateProcess: false },
    HIGH: { createIncident: true, desktopNotification: true, quarantine: false, terminateProcess: false },
    MEDIUM: { createIncident: true, desktopNotification: false, quarantine: false, terminateProcess: false }
  });

  // Real-time Threat Match & Location Alert States
  const [activeThreatMatch, setActiveThreatMatch] = useState(null);
  const [locatorModalOpen, setLocatorModalOpen] = useState(false);

  // UI & Network States
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);

  // Initialize data from real SQLite backend
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statusData, procData, predData, incData, logsData, healthData, canData, polData] = await Promise.all([
        systemService.getSystemStatus(),
        processService.getProcesses(),
        predictionService.getLatestPrediction(),
        incidentService.getIncidents('ALL'),
        systemService.getTelemetryLogs(),
        systemService.getEngineHealth(),
        fileService.getCanaryStatus(),
        systemService.getPolicies()
      ]);

      setSystemPosture(statusData);
      setProcesses(Array.isArray(procData) ? procData : []);
      if (Array.isArray(procData) && procData.length > 0) {
        setSelectedProcess(procData.find(p => p.riskScore > 80) || procData[0]);
      }
      setPrediction(predData);
      setIncidents(Array.isArray(incData) ? incData : []);
      setTelemetryLogs(Array.isArray(logsData) ? logsData : []);
      if (healthData) setEngineHealth(healthData);
      if (canData) setCanaryStatus(canData);
      if (polData) setPolicies(polData);

      // Real persistent alerts from SQLite incidents
      if (Array.isArray(incData) && incData.length > 0) {
        setAlerts(incData.map(inc => ({
          id: inc.id,
          title: inc.title,
          time: new Date(inc.timestamp).toLocaleTimeString('en-GB') + ' UTC',
          severity: inc.severity,
          read: false,
          location: inc.rawData?.fileLocation ? { modifiedFilePath: inc.rawData.fileLocation } : null,
          mitreTactics: inc.mitreTactics
        })));
      } else {
        setAlerts([]);
      }
    } catch (err) {
      setError('Backend disconnected. Live protection engine is offline.');
      setSystemPosture(prev => prev ? { ...prev, status: 'DISCONNECTED' } : { status: 'DISCONNECTED', threatProbability: 0, aggregateProbability: 0 });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handle cross-component / notification-click navigation
  useEffect(() => {
    const handleNavEvent = (e) => {
      const { path, incidentId } = e.detail || {};
      if (path) {
        navigate(path);
      }
      if (incidentId) {
        const found = incidents.find(i => i.id === incidentId);
        if (found) {
          setSelectedIncident(found);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('cryptsentinel:navigate', handleNavEvent);
      return () => window.removeEventListener('cryptsentinel:navigate', handleNavEvent);
    }
  }, [navigate, incidents]);

  // WebSocket Connection & Real-time Dispatching
  useEffect(() => {
    telemetryWS.connect();
    const unsubStatus = telemetryWS.onStatusChange(setIsWsConnected);

    const unsubRisk = telemetryWS.on(WS_EVENTS.RISK_UPDATE, (payload) => {
      setSystemPosture(prev => prev ? ({ ...prev, ...payload }) : payload);
    });

    const unsubProc = telemetryWS.on(WS_EVENTS.PROCESS_UPDATE, (payload) => {
      setProcesses(prev => prev.map(p => p.pid === payload.pid ? { ...p, ...payload } : p));
      setSelectedProcess(prev => prev && prev.pid === payload.pid ? { ...prev, ...payload } : prev);
    });

    const unsubProcBatch = telemetryWS.on('PROCESS_UPDATE_BATCH', (payload) => {
      if (payload && payload.processes && payload.processes.length > 0) {
        setProcesses(payload.processes);
      }
    });

    const unsubFile = telemetryWS.on(WS_EVENTS.FILE_EVENT, (payload) => {
      const isHighEntropy = payload.entropy >= 7.0;
      const newLog = {
        id: String(Date.now()),
        timestamp: formatTimestamp(new Date()),
        level: isHighEntropy || payload.isCanary ? 'CRITICAL' : 'INFO',
        pid: payload.pid || 0,
        process: payload.process || (payload.isCanary ? 'Canary Tripwire' : 'Sandbox Watchdog'),
        message: `${payload.eventType || 'Mutation'}: ${payload.path} (Entropy: ${payload.entropy})${payload.isCanary ? ' [CANARY DECOY]' : ''}`
      };
      setTelemetryLogs(prev => [newLog, ...prev.slice(0, 49)]);
    });

    // Real-time Synthetic Ransomware Match Event
    const unsubThreatMatch = telemetryWS.on('THREAT_MATCH', (threatMatch) => {
      setActiveThreatMatch(threatMatch);
      setSystemPosture(prev => prev ? {
        ...prev,
        status: threatMatch.severity,
        aggregateProbability: threatMatch.riskScore,
        threatProbability: threatMatch.riskScore
      } : prev);
    });

    // Canary updates over WebSocket
    const unsubCanary = telemetryWS.on('CANARY_UPDATE', (canData) => {
      if (canData) setCanaryStatus(canData);
    });

    // Policy updates over WebSocket
    const unsubPolicy = telemetryWS.on('POLICY_UPDATE', (polData) => {
      if (polData) setPolicies(polData);
    });

    // Health updates over WebSocket
    const unsubHealth = telemetryWS.on('HEALTH_UPDATE', (hData) => {
      if (hData) setEngineHealth(hData);
    });

    // Unified Real-Time Security Notification Handler (OS Notification + In-App Sync)
    const unsubSecurityNotif = telemetryWS.on(WS_EVENTS.SECURITY_NOTIFICATION, (payload) => {
      if (!payload) return;

      // 1. Update system posture
      if (payload.severity) {
        setSystemPosture(prev => prev ? {
          ...prev,
          status: payload.severity,
          aggregateProbability: payload.riskScore ?? prev.aggregateProbability,
          threatProbability: payload.riskScore ?? prev.threatProbability
        } : {
          status: payload.severity,
          aggregateProbability: payload.riskScore || 80,
          threatProbability: payload.riskScore || 80
        });
      }

      // 2. Update alerts
      const alertId = payload.incidentId || `ALT-${Date.now()}`;
      setAlerts(prev => {
        const exists = prev.some(a => a.id === alertId);
        if (exists) {
          return prev.map(a => a.id === alertId ? {
            ...a,
            severity: payload.severity || a.severity,
            title: payload.title || a.title
          } : a);
        }
        return [{
          id: alertId,
          title: payload.title || 'Security Notification',
          time: new Date(payload.timestamp || Date.now()).toLocaleTimeString('en-GB') + ' UTC',
          severity: payload.severity || 'HIGH',
          read: false,
          location: payload.location,
          mitreTactics: payload.mitreTactics
        }, ...prev];
      });

      // 3. Update active threat match for in-app toast locator
      if (payload.severity === 'CRITICAL' || payload.severity === 'HIGH') {
        setActiveThreatMatch({
          id: payload.incidentId || `TM-${Date.now()}`,
          incidentId: payload.incidentId,
          timestamp: payload.timestamp || new Date().toISOString(),
          severity: payload.severity,
          riskScore: payload.riskScore || 80,
          matchedFamily: payload.threatFamily || 'Ransomware',
          title: payload.title,
          canaryTriggered: payload.canaryTriggered,
          location: payload.location || {
            modifiedFilePath: payload.filePath,
            targetFilename: payload.filePath ? payload.filePath.split('/').pop() : 'Suspicious mutation',
            processName: payload.location?.processName || 'Sandbox Watchdog',
            processPid: payload.location?.processPid || 0,
            processAttribution: payload.location?.processAttribution || 'Process attribution unavailable',
            entropy: payload.location?.entropy || 7.8
          }
        });
      }

      // 4. Update incidents list
      if (payload.incidentId) {
        setIncidents(prev => {
          const idx = prev.findIndex(i => i.id === payload.incidentId);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = {
              ...copy[idx],
              severity: payload.severity || copy[idx].severity,
              risk_score: payload.riskScore || copy[idx].risk_score,
              title: payload.title || copy[idx].title,
              rawData: {
                ...copy[idx].rawData,
                filesAffected: payload.filesAffected || (copy[idx].rawData?.filesAffected || 1) + 1,
                mutationRate: payload.mutationRate || copy[idx].rawData?.mutationRate || 1.0
              }
            };
            return copy;
          } else {
            const newIncident = {
              id: payload.incidentId,
              timestamp: payload.timestamp || new Date().toISOString(),
              severity: payload.severity || 'HIGH',
              risk_score: payload.riskScore || 80,
              matched_family: payload.threatFamily || 'Ransomware',
              title: payload.title || 'Ransomware Activity Detected',
              description: payload.message || '',
              mitreTactics: payload.mitreTactics || ['T1486 Data Encrypted for Impact'],
              status: 'OPEN',
              rawData: {
                fileLocation: payload.filePath,
                action: payload.action,
                processInfo: payload.processInfo,
                canaryTriggered: payload.canaryTriggered,
                filesAffected: payload.filesAffected || 1,
                mutationRate: payload.mutationRate || 1.0
              }
            };
            return [newIncident, ...prev];
          }
        });
      }

      // 5. Trigger Centralized Notification Service (OS desktop notification, deduplication, sound)
      notificationService.notifySecurityEvent(payload);
    });

    const unsubAlert = telemetryWS.on(WS_EVENTS.ALERT, (payload) => {
      setAlerts(prev => {
        const id = payload.id || `ALT-${Date.now()}`;
        if (prev.some(a => a.id === id)) return prev;
        return [{ id, ...payload, read: false }, ...prev];
      });
    });

    const unsubIncCreated = telemetryWS.on(WS_EVENTS.INCIDENT_CREATED, (incident) => {
      if (!incident) return;
      setIncidents(prev => {
        if (prev.some(i => i.id === incident.id)) return prev;
        return [incident, ...prev];
      });
    });

    const unsubIncUpdated = telemetryWS.on(WS_EVENTS.INCIDENT_UPDATED, (incident) => {
      if (!incident) return;
      setIncidents(prev => prev.map(i => i.id === incident.id ? { ...i, ...incident } : i));
    });

    return () => {
      unsubStatus();
      unsubRisk();
      unsubProc();
      unsubProcBatch();
      unsubFile();
      unsubThreatMatch();
      unsubCanary();
      unsubPolicy();
      unsubHealth();
      unsubSecurityNotif();
      unsubAlert();
      unsubIncCreated();
      unsubIncUpdated();
      telemetryWS.disconnect();
    };
  }, []);

  // Toggle Simulation Mode
  const toggleSimulationMode = useCallback(() => {
    setIsSimulationMode(prev => {
      const next = !prev;
      telemetryWS.setSimulationMode(next);
      return next;
    });
  }, []);

  // Trigger Safe Synthetic Scenario via backend
  const triggerSyntheticAttack = useCallback(async (scenario = 'lockbit') => {
    try {
      const response = await fetch('http://localhost:8000/api/synthetic/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario })
      });
      const result = await response.json();
      await loadInitialData();
      return result;
    } catch (err) {
      console.warn('Synthetic attack trigger failed (backend offline):', err.message);
      return { error: 'Backend offline: Unable to execute sandbox simulation' };
    }
  }, [loadInitialData]);

  const resetSandbox = useCallback(async () => {
    try {
      await fetch('http://localhost:8000/api/synthetic/reset', { method: 'POST' });
    } catch {}
    setActiveThreatMatch(null);
    notificationService.resetDeduplicationState();
    await loadInitialData();
  }, [loadInitialData]);

  const updateResponsePolicies = useCallback(async (newPolicies) => {
    const updated = await systemService.updatePolicies(newPolicies);
    setPolicies(updated);
    return updated;
  }, []);

  const resetCanaryTripwires = useCallback(async () => {
    await fileService.resetCanaries();
    const status = await fileService.getCanaryStatus();
    setCanaryStatus(status);
  }, []);

  // Quick Actions
  const killProcess = useCallback(async (pid) => {
    try {
      const res = await processService.killProcess(pid);
      setProcesses(prev => prev.filter(p => p.pid !== pid));
      if (selectedProcess && selectedProcess.pid === pid) {
        setSelectedProcess(null);
      }
      setTelemetryLogs(prev => [
        {
          id: String(Date.now()),
          timestamp: formatTimestamp(new Date()),
          level: 'INFO',
          pid,
          process: 'SENTINEL_EDR',
          message: `Process PID ${pid} terminated by operator action.`
        },
        ...prev.slice(0, 49)
      ]);
      return res;
    } catch {
      return false;
    }
  }, [selectedProcess]);

  const isolateHost = useCallback(async (hostname) => {
    try {
      await processService.isolateHost(hostname);
      setSystemPosture(prev => prev ? { ...prev, isolatedNodes: (prev.isolatedNodes || 0) + 1 } : prev);
      setTelemetryLogs(prev => [
        {
          id: String(Date.now()),
          timestamp: formatTimestamp(new Date()),
          level: 'WARN',
          pid: 0,
          process: 'NETWORK_CONTAINMENT',
          message: `Host ${hostname} quarantined from lateral subnet.`
        },
        ...prev.slice(0, 49)
      ]);
      return true;
    } catch {
      return false;
    }
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const markAlertRead = useCallback((alertId) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, read: true } : a));
  }, []);

  const dismissAlert = useCallback((alertId) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  }, []);

  const ackAllAlerts = useCallback(() => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
  }, []);

  const mitigateIncident = useCallback(async (incidentId) => {
    try {
      await incidentService.updateIncidentStatus(incidentId, 'CONTAINED');
      setIncidents(prev => prev.map(inc => inc.id === incidentId ? { ...inc, status: 'CONTAINED', mitigationStatus: 'BLOCKED' } : inc));
      setActiveThreatMatch(null);
      const statusData = await systemService.getSystemStatus();
      setSystemPosture(statusData);
      return true;
    } catch {
      return false;
    }
  }, []);

  const refreshAllData = useCallback(() => {
    loadInitialData();
  }, [loadInitialData]);

  const openIncidentDetails = useCallback((incident) => {
    if (typeof incident === 'string') {
      const found = incidents.find(i => i.id === incident);
      if (found) setSelectedIncident(found);
    } else {
      setSelectedIncident(incident);
    }
  }, [incidents]);

  const contextValue = {
    systemPosture,
    processes,
    selectedProcess,
    setSelectedProcess,
    prediction,
    incidents,
    setIncidents,
    selectedIncident,
    setSelectedIncident,
    openIncidentDetails,
    mitigateIncident,
    telemetryLogs,
    alerts,
    setAlerts,
    clearAlerts,
    markAlertRead,
    dismissAlert,
    ackAllAlerts,
    activeThreatMatch,
    setActiveThreatMatch,
    locatorModalOpen,
    setLocatorModalOpen,
    engineHealth,
    canaryStatus,
    policies,
    updateResponsePolicies,
    resetCanaryTripwires,
    isWsConnected,
    isSimulationMode,
    isLoading,
    error,
    notificationDrawerOpen,
    setNotificationDrawerOpen,
    toggleSimulationMode,
    triggerSyntheticAttack,
    resetSandbox,
    killProcess,
    isolateHost,
    refreshAllData
  };

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
      {/* Real-time Threat Alert Toast */}
      {activeThreatMatch && (
        <ThreatAlertNotification
          threat={activeThreatMatch}
          onLocate={() => setLocatorModalOpen(true)}
          onInspect={() => setLocatorModalOpen(true)}
          onDismiss={() => setActiveThreatMatch(null)}
        />
      )}
      {/* Visual Process/File Locator Modal */}
      {locatorModalOpen && activeThreatMatch && (
        <ProcessLocatorModal
          threat={activeThreatMatch}
          isOpen={locatorModalOpen}
          onClose={() => setLocatorModalOpen(false)}
        />
      )}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}
