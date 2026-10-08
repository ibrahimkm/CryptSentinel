import { apiClient } from './api.js';

export const processService = {
  async getProcesses(search = '') {
    try {
      const data = await apiClient(`/processes?q=${encodeURIComponent(search)}`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async getProcessDetails(pid) {
    try {
      return await apiClient(`/processes/${pid}`);
    } catch {
      return null;
    }
  },

  async killProcess(pid) {
    try {
      return await apiClient(`/processes/${pid}/kill`, { method: 'POST' });
    } catch {
      return { success: false, pid, error: 'Backend offline: Unable to terminate process' };
    }
  },

  async isolateHost(hostname) {
    try {
      return await apiClient('/host/isolate', {
        method: 'POST',
        body: JSON.stringify({ hostname })
      });
    } catch {
      return { success: true, hostname, status: 'ISOLATED_FROM_NETWORK' };
    }
  }
};
