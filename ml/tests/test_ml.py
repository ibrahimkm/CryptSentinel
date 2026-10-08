import pytest
import os
import json
from ml.predict import predictor

def test_schema_exists():
    assert os.path.exists('ml/feature_schema.json')
    with open('ml/feature_schema.json') as f:
        schema = json.load(f)
    assert 'features' in schema
    assert len(schema['features']) == 16

def test_model_artifact_exists():
    assert os.path.exists('ml/model/ransomware_detector.joblib')
    assert os.path.exists('ml/evaluation/metrics.json')
    assert os.path.exists('ml/evaluation/confusion_matrix.png')

def test_benign_prediction():
    benign_sample = {
        "files_modified": 1,
        "files_created": 0,
        "files_deleted": 0,
        "mutations_per_second": 0.2,
        "average_entropy": 4.1,
        "maximum_entropy": 4.2,
        "entropy_delta": -0.1,
        "high_entropy_file_ratio": 0.0,
        "suspicious_extension_count": 0,
        "extension_change_count": 0,
        "total_bytes_modified": 2048,
        "average_file_size": 2048.0,
        "process_cpu": 2.0,
        "process_memory": 50.0,
        "number_of_active_processes": 120,
        "burst_duration": 4.0
    }
    result = predictor.predict(benign_sample)
    assert result['classification'] == 'BENIGN'
    assert result['probability'] < 0.5

def test_ransomware_prediction():
    ransomware_sample = {
        "files_modified": 50,
        "files_created": 40,
        "files_deleted": 35,
        "mutations_per_second": 25.0,
        "average_entropy": 7.8,
        "maximum_entropy": 7.95,
        "entropy_delta": 3.6,
        "high_entropy_file_ratio": 0.95,
        "suspicious_extension_count": 40,
        "extension_change_count": 45,
        "total_bytes_modified": 5000000,
        "average_file_size": 100000.0,
        "process_cpu": 85.0,
        "process_memory": 400.0,
        "number_of_active_processes": 140,
        "burst_duration": 2.0
    }
    result = predictor.predict(ransomware_sample)
    assert result['classification'] == 'RANSOMWARE_LIKE'
    assert result['probability'] > 0.5
