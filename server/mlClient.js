import http from 'http';
import { dbService } from './db.js';

export class MLClient {
  constructor(baseUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5001', db = dbService) {
    this.baseUrl = baseUrl;
    this.db = db;
    this.isAvailable = false;
    this.lastChecked = 0;
  }

  /**
   * Internal HTTP request helper
   */
  async _request(endpoint, method = 'GET', payload = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.baseUrl);
      const postData = payload ? JSON.stringify(payload) : null;

      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        timeout: 3000,
        headers: {
          'Content-Type': 'application/json',
          ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
        }
      };

      const req = http.request(options, (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(rawData);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              this.isAvailable = true;
              resolve(parsed);
            } else {
              reject(new Error(parsed.error || `HTTP error ${res.statusCode}`));
            }
          } catch (err) {
            reject(new Error(`Failed to parse ML service response: ${err.message}`));
          }
        });
      });

      req.on('error', (err) => {
        this.isAvailable = false;
        reject(err);
      });

      req.on('timeout', () => {
        req.destroy();
        this.isAvailable = false;
        reject(new Error('ML service connection timeout'));
      });

      if (postData) {
        req.write(postData);
      }
      req.end();
    });
  }

  /**
   * Check if Python ML Service is online and healthy
   */
  async checkHealth() {
    try {
      const result = await this._request('/health');
      this.isAvailable = result.status === 'HEALTHY' && result.modelLoaded;
      return {
        available: this.isAvailable,
        status: this.isAvailable ? 'HEALTHY' : 'UNINITIALIZED',
        model: result.model || 'RandomForestClassifier'
      };
    } catch (err) {
      this.isAvailable = false;
      return {
        available: false,
        status: 'UNAVAILABLE',
        error: 'ML Service Unavailable',
        details: err.message
      };
    }
  }

  /**
   * Get Model Architecture & Schema Metadata
   */
  async getModelInfo() {
    try {
      const result = await this._request('/api/model');
      return {
        available: true,
        ...result
      };
    } catch (err) {
      return {
        available: false,
        model: 'RandomForestClassifier',
        version: '1.0.0-academic',
        status: 'UNAVAILABLE',
        error: 'ML Service Unavailable'
      };
    }
  }

  /**
   * Get Real Evaluation Metrics from Test Split
   */
  async getEvaluation() {
    try {
      const result = await this._request('/api/evaluation');
      return {
        available: true,
        ...result
      };
    } catch (err) {
      return {
        available: false,
        error: 'ML Service Unavailable: Unable to retrieve live model metrics'
      };
    }
  }

  /**
   * Perform live ML inference on 16-feature behavioral vector
   * Automatically persists genuine predictions in SQLite
   */
  async predict(features) {
    try {
      const response = await this._request('/predict', 'POST', { features });
      
      // Store real prediction in SQLite persistence layer
      const storedPrediction = this.db.createPrediction({
        classification: response.classification,
        probability: response.probability,
        confidence: response.confidence,
        model: response.model,
        modelVersion: response.modelVersion,
        features: response.features,
        rawResult: response
      });

      return {
        available: true,
        storedId: storedPrediction.id,
        classification: response.classification,
        probability: response.probability,
        confidence: response.confidence,
        classProbabilities: response.classProbabilities,
        model: response.model,
        modelVersion: response.modelVersion,
        features: response.features
      };
    } catch (err) {
      this.isAvailable = false;
      return {
        available: false,
        error: 'ML Service Unavailable',
        classification: 'UNAVAILABLE',
        probability: null,
        confidence: null,
        model: 'RandomForestClassifier',
        fallbackMode: 'HEURISTIC_ONLY'
      };
    }
  }
}

export const mlClient = new MLClient();
