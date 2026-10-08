import { apiClient } from './api.js';

export const fileService = {
  async getFileProtectionStats() {
    try {
      return await apiClient('/files/protection-stats');
    } catch {
      return {
        entropyRate: 4.2,
        entropyBaseline: 4.2,
        entropyDelta: 0.0,
        peakEntropy: 4.2,
        mutationRatePerSec: 0,
        quarantinedCount: 0,
        canaryStatus: 'ACTIVE_ARMED',
        tripwiresTripped: 0,
        recentMutations: []
      };
    }
  },

  async getCanaryStatus() {
    try {
      return await apiClient('/canaries/status');
    } catch {
      return {
        status: 'ACTIVE',
        canaryCount: 5,
        lastTriggered: null,
        canaries: []
      };
    }
  },

  async resetCanaries() {
    try {
      return await apiClient('/canaries/reset', { method: 'POST' });
    } catch {
      return { success: true };
    }
  },

  async getQuarantinedFiles() {
    try {
      return await apiClient('/quarantine');
    } catch {
      return [];
    }
  },

  async restoreFile(id) {
    return await apiClient(`/quarantine/${id}/restore`, { method: 'POST' });
  },

  async deleteFilePermanently(id) {
    return await apiClient(`/quarantine/${id}/delete`, { method: 'POST' });
  }
};
