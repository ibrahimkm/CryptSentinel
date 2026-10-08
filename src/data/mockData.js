// CryptSentinel Baseline Data Templates (Used only when backend is initializing or disconnected)

export const initialSystemPosture = {
  status: 'PROTECTED',
  aggregateProbability: 0.0,
  behavioralScore: 0.0,
  escalationHorizonSeconds: '18-42s',
  escalationDescription: 'System operates normally under sandbox endpoint monitoring.',
  vector: 'SYSTEM_BASELINE',
  confidence: 'HI',
  activeNodes: 0,
  isolatedNodes: 0,
  systemArmed: true,
  threatProbability: 0
};

export const initialTelemetryLogs = [];

export const initialProcesses = [];

export const initialPrediction = {
  ransomwareProbability: 0,
  trendPercent: 0,
  trendSeconds: 0,
  status: 'PROTECTED',
  predictionHorizonMinutes: '42',
  predictionHorizonLabel: 'ESTIMATED TIME TO ANOMALY COMMENCEMENT',
  confidenceScore: 100,
  confidenceBars: 4,
  modelName: 'RandomForestClassifier',
  trajectoryHistory: [],
  attributions: []
};

export const initialCyberPulse = {
  threatTrajectoryStatus: 'BASELINE NOMINAL',
  currentRiskScore: 0.0,
  fileEntropyRate: '4.200',
  fileEntropyBase: '4.2',
  fileEntropyChange: '+0%',
  fileEntropyState: 'NOMINAL',
  abnormalDiskWrite: '0 KB/s',
  abnormalDiskWriteTarget: 'monitored_sandbox/*',
  abnormalDiskWriteChange: '+0%',
  abnormalDiskWriteState: 'NOMINAL',
  monitoredProcesses: [],
  trajectoryPoints: []
};

export const initialIncidents = [];

export const initialProtectedZones = [
  { id: 'zone-1', name: 'Monitored Sandbox', path: 'monitored_sandbox/*', status: 'ARMED', immutability: 'WATCHDOG', canaryCount: 3, violations24h: 0 },
  { id: 'zone-2', name: 'Quarantine Vault', path: 'quarantine/*', status: 'ARMED', immutability: 'ISOLATED', canaryCount: 0, violations24h: 0 }
];
