"""
CryptSentinel ML Inference Engine & Prediction Service
Loads the trained RandomForestClassifier artifact and performs inference on behavioral feature vectors.
Can be executed as a standalone CLI tool or run as a lightweight HTTP microservice.
"""

import os
import sys
import json
import joblib
import pandas as pd
import numpy as np
from http.server import HTTPServer, BaseHTTPRequestHandler

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'model', 'ransomware_detector.joblib')
SCHEMA_PATH = os.path.join(BASE_DIR, 'feature_schema.json')
METRICS_PATH = os.path.join(BASE_DIR, 'evaluation', 'metrics.json')

class RansomwarePredictor:
    def __init__(self, model_path=MODEL_PATH, schema_path=SCHEMA_PATH):
        self.model_path = model_path
        self.schema_path = schema_path
        self.model = None
        self.feature_names = []
        self._load_schema()
        self._load_model()

    def _load_schema(self):
        if not os.path.exists(self.schema_path):
            raise FileNotFoundError(f"Feature schema not found at {self.schema_path}")
        with open(self.schema_path, 'r') as f:
            schema = json.load(f)
        self.feature_names = [feat['name'] for feat in schema['features']]

    def _load_model(self):
        if not os.path.exists(self.model_path):
            print(f"[ML Predictor] Model file not found at {self.model_path}. Please run train.py first.")
            return
        self.model = joblib.load(self.model_path)
        print(f"[ML Predictor] Successfully loaded model from {self.model_path}")

    def predict(self, feature_input):
        """
        Accepts a dict of feature values or list of feature dicts.
        Returns detailed prediction dictionary.
        """
        if self.model is None:
            self._load_model()
            if self.model is None:
                raise RuntimeError("ML model is not loaded. Train the model first.")

        # Ensure all features present with fallback defaults
        defaults = {
            'files_modified': 0,
            'files_created': 0,
            'files_deleted': 0,
            'mutations_per_second': 0.0,
            'average_entropy': 4.2,
            'maximum_entropy': 4.2,
            'entropy_delta': 0.0,
            'high_entropy_file_ratio': 0.0,
            'suspicious_extension_count': 0,
            'extension_change_count': 0,
            'total_bytes_modified': 0,
            'average_file_size': 0.0,
            'process_cpu': 0.0,
            'process_memory': 0.0,
            'number_of_active_processes': 100,
            'burst_duration': 1.0
        }

        if isinstance(feature_input, dict):
            features_dict = {feat: feature_input.get(feat, defaults.get(feat, 0)) for feat in self.feature_names}
            df = pd.DataFrame([features_dict])
        elif isinstance(feature_input, list):
            rows = [{feat: item.get(feat, defaults.get(feat, 0)) for feat in self.feature_names} for item in feature_input]
            df = pd.DataFrame(rows)
        else:
            raise ValueError("Input must be a feature dictionary or list of dictionaries")

        # Perform inference
        pred_class_idx = int(self.model.predict(df)[0])
        probabilities = self.model.predict_proba(df)[0]
        ransomware_prob = float(probabilities[1])
        benign_prob = float(probabilities[0])

        classification = "RANSOMWARE_LIKE" if pred_class_idx == 1 else "BENIGN"
        confidence = float(max(probabilities))

        return {
            "classification": classification,
            "probability": round(ransomware_prob, 4),
            "confidence": round(confidence, 4),
            "classProbabilities": {
                "BENIGN": round(benign_prob, 4),
                "RANSOMWARE_LIKE": round(ransomware_prob, 4)
            },
            "model": "RandomForestClassifier",
            "modelVersion": "1.0.0-academic",
            "features": df.iloc[0].to_dict()
        }

predictor = RansomwarePredictor()

class MLServiceHTTPHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200, content_type='application/json'):
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(204)

    def do_GET(self):
        if self.path == '/health' or self.path == '/api/health':
            self._set_headers(200)
            self.wfile.write(json.dumps({
                "status": "HEALTHY",
                "modelLoaded": predictor.model is not None,
                "model": "RandomForestClassifier"
            }).encode('utf-8'))
        elif self.path == '/api/evaluation' or self.path == '/evaluation':
            if os.path.exists(METRICS_PATH):
                with open(METRICS_PATH, 'r') as f:
                    data = json.load(f)
                self._set_headers(200)
                self.wfile.write(json.dumps(data).encode('utf-8'))
            else:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "Metrics not found"}).encode('utf-8'))
        elif self.path == '/api/model' or self.path == '/model':
            self._set_headers(200)
            self.wfile.write(json.dumps({
                "model": "RandomForestClassifier",
                "version": "1.0.0-academic",
                "features": predictor.feature_names,
                "targetClasses": ["BENIGN", "RANSOMWARE_LIKE"],
                "status": "READY" if predictor.model is not None else "UNINITIALIZED"
            }).encode('utf-8'))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode('utf-8'))

    def do_POST(self):
        if self.path in ['/predict', '/api/predict', '/api/prediction/analyze']:
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length)
                payload = json.loads(body.decode('utf-8'))
                features = payload.get('features', payload)
                result = predictor.predict(features)
                self._set_headers(200)
                self.wfile.write(json.dumps(result).encode('utf-8'))
            except Exception as e:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode('utf-8'))

def run_server(port=5001):
    server_address = ('127.0.0.1', port)
    httpd = HTTPServer(server_address, MLServiceHTTPHandler)
    print(f"[CryptSentinel ML Service] Running HTTP Microservice on http://127.0.0.1:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[CryptSentinel ML Service] Shutting down...")
        httpd.server_close()

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--serve':
        port = int(sys.argv[2]) if len(sys.argv) > 2 else 5001
        run_server(port)
    else:
        # Standalone Test Execution
        print("\n--- STANDALONE ML PREDICTION TEST ---")
        
        # Test 1: Benign Sample (Normal office document editing)
        benign_sample = {
            "files_modified": 2,
            "files_created": 1,
            "files_deleted": 0,
            "mutations_per_second": 0.4,
            "average_entropy": 4.12,
            "maximum_entropy": 4.35,
            "entropy_delta": -0.08,
            "high_entropy_file_ratio": 0.0,
            "suspicious_extension_count": 0,
            "extension_change_count": 0,
            "total_bytes_modified": 4096,
            "average_file_size": 2048.0,
            "process_cpu": 3.5,
            "process_memory": 85.0,
            "number_of_active_processes": 120,
            "burst_duration": 5.0
        }
        
        # Test 2: Ransomware-like Sample (Rapid encryption burst with .lockbit extension)
        ransomware_sample = {
            "files_modified": 65,
            "files_created": 50,
            "files_deleted": 45,
            "mutations_per_second": 32.5,
            "average_entropy": 7.85,
            "maximum_entropy": 7.98,
            "entropy_delta": 3.65,
            "high_entropy_file_ratio": 0.98,
            "suspicious_extension_count": 50,
            "extension_change_count": 65,
            "total_bytes_modified": 8500000,
            "average_file_size": 130769.0,
            "process_cpu": 88.0,
            "process_memory": 450.0,
            "number_of_active_processes": 140,
            "burst_duration": 1.8
        }
        
        try:
            res_benign = predictor.predict(benign_sample)
            print("\n[Test 1] Benign Workload Prediction:")
            print(json.dumps(res_benign, indent=2))

            res_ransomware = predictor.predict(ransomware_sample)
            print("\n[Test 2] Ransomware Burst Workload Prediction:")
            print(json.dumps(res_ransomware, indent=2))
        except Exception as e:
            print(f"Error during prediction: {e}")
