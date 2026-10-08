/**
 * CryptSentinel Correlated Risk Engine
 * Calculates a transparent, mathematically grounded 0-100 risk score
 * combining Shannon entropy dynamics, filesystem mutation velocity,
 * suspicious extensions, and ML model inference probabilities.
 */

export class RiskEngine {
  /**
   * Evaluate behavioral features and return transparent risk breakdown
   */
  calculateRiskScore(features, mlProbability = null) {
    let entropyPoints = 0;
    let velocityPoints = 0;
    let extensionPoints = 0;
    let mlPoints = 0;

    const avgEntropy = features.average_entropy || 4.2;
    const maxEntropy = features.maximum_entropy || 4.2;
    const mutPerSec = features.mutations_per_second || 0.0;
    const suspExtCount = features.suspicious_extension_count || 0;
    const extChangeCount = features.extension_change_count || 0;
    const highEntropyRatio = features.high_entropy_file_ratio || 0.0;

    // 1. Shannon Entropy Contribution (Max 35 points)
    if (avgEntropy >= 7.5 || highEntropyRatio >= 0.7) {
      entropyPoints = 35;
    } else if (avgEntropy >= 7.0 || highEntropyRatio >= 0.4) {
      entropyPoints = 25;
    } else if (avgEntropy >= 6.0) {
      entropyPoints = 12;
    } else if (avgEntropy > 5.0) {
      entropyPoints = 5;
    }

    // 2. Mutation Velocity & Burst Contribution (Max 25 points)
    if (mutPerSec >= 20.0) {
      velocityPoints = 25;
    } else if (mutPerSec >= 10.0) {
      velocityPoints = 18;
    } else if (mutPerSec >= 4.0) {
      velocityPoints = 10;
    } else if (mutPerSec >= 1.5) {
      velocityPoints = 4;
    }

    // 3. Extension Modifications & Ransomware Extensions (Max 20 points)
    if (suspExtCount > 0) {
      extensionPoints += 15;
    }
    if (extChangeCount > 0) {
      extensionPoints += 5;
    }
    extensionPoints = Math.min(20, extensionPoints);

    // 4. ML Model Probability Contribution (Max 20 points)
    let mlStatus = 'NOT_APPLIED';
    if (typeof mlProbability === 'number') {
      mlStatus = 'ACTIVE';
      mlPoints = Math.round(mlProbability * 20);
    } else {
      // Re-distribute 20 points proportionately to heuristics if ML is offline
      mlStatus = 'FALLBACK_HEURISTIC';
      const heuristicSum = entropyPoints + velocityPoints + extensionPoints;
      if (heuristicSum > 30) {
        entropyPoints = Math.min(45, Math.round(entropyPoints * 1.25));
        velocityPoints = Math.min(35, Math.round(velocityPoints * 1.25));
      }
    }

    const rawTotal = entropyPoints + velocityPoints + extensionPoints + mlPoints;
    const normalizedScore = Math.min(100, Math.max(0, rawTotal));

    let tier = 'LOW';
    let vector = 'SYSTEM_BASELINE';
    let status = 'PROTECTED';

    if (normalizedScore >= 75) {
      tier = 'CRITICAL';
      status = 'CRITICAL';
      vector = suspExtCount > 0 ? 'RANSOMWARE_MUTATION_BURST' : 'HIGH_ENTROPY_ENCRYPTION_SPIKE';
    } else if (normalizedScore >= 50) {
      tier = 'HIGH';
      status = 'HIGH';
      vector = 'ANOMALOUS_MUTATION_VELOCITY';
    } else if (normalizedScore >= 25) {
      tier = 'GUARDED';
      status = 'GUARDED';
      vector = 'ELEVATED_DISK_IO';
    }

    return {
      riskScore: normalizedScore,
      tier,
      status,
      vector,
      mlStatus,
      breakdown: {
        entropyPoints,
        velocityPoints,
        extensionPoints,
        mlPoints,
        maxPossible: 100
      },
      metricsSnapshot: {
        averageEntropy: avgEntropy,
        maximumEntropy: maxEntropy,
        mutationsPerSecond: mutPerSec,
        suspiciousExtensionCount: suspExtCount,
        highEntropyRatio,
        mlProbability: typeof mlProbability === 'number' ? mlProbability : null
      }
    };
  }
}

export const riskEngine = new RiskEngine();
