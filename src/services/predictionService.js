import { apiClient } from './api.js';

export const predictionService = {
  async getLatestPrediction() {
    try {
      return await apiClient('/prediction/latest');
    } catch {
      return null;
    }
  },

  async getModelInfo() {
    try {
      return await apiClient('/prediction/model');
    } catch {
      return {
        model: 'RandomForestClassifier',
        version: '1.0.0-academic',
        status: 'UNAVAILABLE',
        error: 'ML Service Unavailable'
      };
    }
  },

  async getEvaluation() {
    try {
      return await apiClient('/prediction/evaluation');
    } catch {
      return null;
    }
  },

  async analyzeFeatures(features) {
    try {
      return await apiClient('/prediction/analyze', {
        method: 'POST',
        body: JSON.stringify({ features })
      });
    } catch (err) {
      return {
        available: false,
        error: 'ML Service Unavailable',
        classification: 'UNAVAILABLE'
      };
    }
  }
};
