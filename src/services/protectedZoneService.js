import { apiClient } from './api.js';
import { initialProtectedZones } from '../data/mockData.js';

export const protectedZoneService = {
  async getProtectedZones() {
    try {
      return await apiClient('/zones');
    } catch {
      return initialProtectedZones;
    }
  },

  async toggleZoneLock(zoneId, locked) {
    try {
      return await apiClient(`/zones/${zoneId}/lock`, {
        method: 'POST',
        body: JSON.stringify({ locked })
      });
    } catch {
      return { success: true, zoneId, locked };
    }
  },

  async addProtectedZone(zone) {
    try {
      return await apiClient('/zones', {
        method: 'POST',
        body: JSON.stringify(zone)
      });
    } catch {
      return { id: `zone-${Date.now()}`, ...zone, status: 'ARMED', canaryCount: 10, violations24h: 0 };
    }
  }
};
