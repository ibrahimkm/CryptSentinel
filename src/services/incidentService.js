import { apiClient } from './api.js';

export const incidentService = {
  async getIncidents(filter = 'ALL') {
    try {
      const data = await apiClient(`/incidents?filter=${filter}`);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  async getIncidentById(id) {
    try {
      return await apiClient(`/incidents/${id}`);
    } catch {
      return null;
    }
  },

  async updateIncidentStatus(id, status) {
    try {
      return await apiClient(`/incidents/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    } catch {
      return { success: false, id, status, error: 'Backend offline' };
    }
  }
};
