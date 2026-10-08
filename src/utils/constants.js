export const SYSTEM_STATUS = {
  PROTECTED: 'PROTECTED',
  ELEVATED: 'ELEVATED',
  CRITICAL: 'CRITICAL',
  OFFLINE: 'OFFLINE'
};

export const THREAT_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

export const WS_EVENTS = {
  SYSTEM_STATUS: 'SYSTEM_STATUS',
  PROCESS_UPDATE: 'PROCESS_UPDATE',
  FILE_EVENT: 'FILE_EVENT',
  BEHAVIOR_UPDATE: 'BEHAVIOR_UPDATE',
  RISK_UPDATE: 'RISK_UPDATE',
  PREDICTION_UPDATE: 'PREDICTION_UPDATE',
  ALERT: 'ALERT',
  SECURITY_NOTIFICATION: 'SECURITY_NOTIFICATION',
  THREAT_MATCH: 'THREAT_MATCH',
  INCIDENT_CREATED: 'INCIDENT_CREATED',
  INCIDENT_UPDATED: 'INCIDENT_UPDATED'
};

export const NAVIGATION_ROUTES = [
  { path: '/command-center', label: 'Command Center', icon: 'LayoutDashboard', shortKey: '1' },
  { path: '/threat-radar', label: 'Threat Radar', icon: 'Radio', shortKey: '2' },
  { path: '/ai-prediction', label: 'AI Prediction', icon: 'BrainCircuit', shortKey: '3' },
  { path: '/file-protection', label: 'File Protection', icon: 'ShieldAlert', shortKey: '4' },
  { path: '/process-observatory', label: 'Process Observatory', icon: 'Eye', shortKey: '5' },
  { path: '/attack-graph', label: 'Attack Graph', icon: 'Network', shortKey: '6' },
  { path: '/incidents', label: 'Incidents', icon: 'AlertOctagon', shortKey: '7' },
  { path: '/investigation', label: 'Investigation', icon: 'SearchCode', shortKey: '8' },
  { path: '/security-analytics', label: 'Security Analytics', icon: 'BarChart3', shortKey: '9' },
  { path: '/threat-history', label: 'Threat History', icon: 'History', shortKey: '0' },
  { path: '/ai-observatory', label: 'AI Observatory', icon: 'Cpu', shortKey: 'A' },
  { path: '/cyberpulse', label: 'CyberPulse', icon: 'Activity', shortKey: 'P' },
  { path: '/protection', label: 'Protection', icon: 'Shield', shortKey: 'T' },
  { path: '/protected-zones', label: 'Protected Zones', icon: 'FolderLock', shortKey: 'Z' },
  { path: '/alerts', label: 'Alerts', icon: 'Bell', shortKey: 'E' },
  { path: '/security-report', label: 'Security Report', icon: 'FileText', shortKey: 'R' },
  { path: '/settings', label: 'Settings', icon: 'Settings', shortKey: 'S' }
];
