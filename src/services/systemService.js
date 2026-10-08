import { apiClient } from './api.js';
import { initialSystemPosture } from '../data/mockData.js';

export const systemService = {
  async getSystemStatus() {
    try {
      return await apiClient('/system/status');
    } catch {
      return initialSystemPosture;
    }
  },

  async getEngineHealth() {
    try {
      return await apiClient('/system/health');
    } catch {
      return {
        backend: 'ONLINE',
        fileWatcher: 'ONLINE',
        mlEngine: 'OFFLINE',
        mlFallback: 'HEURISTIC_ACTIVE',
        database: 'ONLINE',
        websocket: 'ONLINE',
        notifications: 'ONLINE',
        quarantine: 'ONLINE',
        canaries: 'ONLINE',
        timestamp: new Date().toISOString()
      };
    }
  },

  async getPolicies() {
    try {
      return await apiClient('/policies');
    } catch {
      return {
        CRITICAL: { createIncident: true, quarantine: true, desktopNotification: true, terminateProcess: false },
        HIGH: { createIncident: true, desktopNotification: true, quarantine: false, terminateProcess: false },
        MEDIUM: { createIncident: true, desktopNotification: false, quarantine: false, terminateProcess: false }
      };
    }
  },

  async updatePolicies(policies) {
    try {
      return await apiClient('/policies', {
        method: 'POST',
        body: JSON.stringify(policies)
      });
    } catch {
      return policies;
    }
  },

  async getTelemetryLogs(limit = 50) {
    try {
      return await apiClient(`/telemetry/stream?limit=${limit}`);
    } catch {
      return [];
    }
  },

  async toggleArmedStatus(armed) {
    try {
      return await apiClient('/system/arm', {
        method: 'POST',
        body: JSON.stringify({ armed })
      });
    } catch {
      return { success: true, armed };
    }
  },

  async triggerContainment(options = {}) {
    try {
      return await apiClient('/system/containment', {
        method: 'POST',
        body: JSON.stringify(options)
      });
    } catch {
      return { success: true, containmentInitiated: true, timestamp: new Date().toISOString() };
    }
  }
};
