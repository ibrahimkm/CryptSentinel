"""
CryptSentinel ML Training Pipeline
Trains a RandomForestClassifier on behavioral filesystem and telemetry features.
Saves model artifacts, calculated metrics, and confusion matrix visualizations.
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)

def train_model():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    schema_path = os.path.join(base_dir, 'feature_schema.json')
    data_path = os.path.join(base_dir, 'data', 'training_data.csv')
    model_dir = os.path.join(base_dir, 'model')
    eval_dir = os.path.join(base_dir, 'evaluation')

    os.makedirs(model_dir, exist_ok=True)
    os.makedirs(eval_dir, exist_ok=True)

    # 1. Load Feature Schema
    with open(schema_path, 'r') as f:
        schema = json.load(f)
    feature_names = [feat['name'] for feat in schema['features']]

    # 2. Check Data
    if not os.path.exists(data_path):
        print("[ML Train] training_data.csv not found, generating synthetic dataset...")
        from data.generate_dataset import generate_behavioral_dataset
        df = generate_behavioral_dataset(1500, seed=42)
        os.makedirs(os.path.dirname(data_path), exist_ok=True)
        df.to_csv(data_path, index=False)
    else:
        df = pd.read_csv(data_path)

    print(f"[ML Train] Loaded dataset with {len(df)} records.")

    # 3. Prepare X and y
    X = df[feature_names]
    y = df['label'].map({'BENIGN': 0, 'RANSOMWARE_LIKE': 1})

    # 4. Train/Test Split (80% Train, 20% Test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    print(f"[ML Train] Train split: {len(X_train)} samples | Test split: {len(X_test)} samples")

    # 5. Model Initialization & Training
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        min_samples_split=4,
        min_samples_leaf=2,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    )

    model.fit(X_train, y_train)

    # 6. Evaluation on Test Set
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred))
    rec = float(recall_score(y_test, y_pred))
    f1 = float(f1_score(y_test, y_pred))
    roc_auc = float(roc_auc_score(y_test, y_prob))
    cm = confusion_matrix(y_test, y_pred).tolist()

    # Feature Importances
    importances = model.feature_importances_
    feature_importance_dict = {
        name: float(round(imp, 4))
        for name, imp in sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)
    }

    metrics_payload = {
        "modelName": "RandomForestClassifier",
        "modelVersion": "1.0.0-academic",
        "trainedAt": pd.Timestamp.now().isoformat(),
        "dataset": {
            "totalSamples": len(df),
            "trainSamples": len(X_train),
            "testSamples": len(X_test),
            "synthetic": True,
            "description": "Synthetic behavioral telemetry dataset modeled for academic anti-ransomware research."
        },
        "metrics": {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1Score": round(f1, 4),
            "rocAuc": round(roc_auc, 4)
        },
        "confusionMatrix": {
            "trueNegative": cm[0][0],
            "falsePositive": cm[0][1],
            "falseNegative": cm[1][0],
            "truePositive": cm[1][1],
            "matrix": cm,
            "labels": ["BENIGN", "RANSOMWARE_LIKE"]
        },
        "featureImportances": feature_importance_dict,
        "hyperparameters": {
            "n_estimators": 100,
            "max_depth": 12,
            "class_weight": "balanced",
            "random_state": 42
        }
    }

    # 7. Save Model Artifact
    model_output_path = os.path.join(model_dir, 'ransomware_detector.joblib')
    joblib.dump(model, model_output_path)
    print(f"[ML Train] Saved trained model artifact to: {model_output_path}")

    # 8. Save Metrics JSON
    metrics_output_path = os.path.join(eval_dir, 'metrics.json')
    with open(metrics_output_path, 'w') as f:
        json.dump(metrics_payload, f, indent=2)
    print(f"[ML Train] Saved evaluation metrics to: {metrics_output_path}")

    # 9. Plot and Save Confusion Matrix Image
    fig, ax = plt.subplots(figsize=(6, 5))
    cax = ax.matshow(cm, cmap='Blues', alpha=0.85)

    for i in range(2):
        for j in range(2):
            val = cm[i][j]
            ax.text(x=j, y=i, s=f"{val}", va='center', ha='center', size='xx-large', weight='bold',
                    color='white' if val > (len(X_test) / 3) else 'black')

    plt.title('Confusion Matrix - CryptSentinel ML', pad=20, fontsize=12, weight='bold')
    fig.colorbar(cax)
    ax.set_xticks([0, 1])
    ax.set_yticks([0, 1])
    ax.set_xticklabels(['BENIGN (0)', 'RANSOMWARE (1)'], fontsize=10)
    ax.set_yticklabels(['BENIGN (0)', 'RANSOMWARE (1)'], fontsize=10)
    plt.xlabel('Predicted Label', fontsize=11, labelpad=10)
    plt.ylabel('Ground Truth Label', fontsize=11)
    plt.tight_layout()

    cm_image_path = os.path.join(eval_dir, 'confusion_matrix.png')
    plt.savefig(cm_image_path, dpi=150)
    plt.close()
    print(f"[ML Train] Saved confusion matrix plot to: {cm_image_path}")

    print("\n--- MODEL EVALUATION REPORT ---")
    print(classification_report(y_test, y_pred, target_names=['BENIGN', 'RANSOMWARE_LIKE']))
    print(f"Accuracy:  {acc * 100:.2f}%")
    print(f"Precision: {prec * 100:.2f}%")
    print(f"Recall:    {rec * 100:.2f}%")
    print(f"F1 Score:  {f1 * 100:.2f}%")
    print(f"ROC AUC:   {roc_auc:.4f}")
    print("--------------------------------\n")

    return metrics_payload

if __name__ == '__main__':
    train_model()
