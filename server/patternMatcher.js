import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class RansomwarePatternMatcher {
  constructor() {
    this.syntheticData = null;
    this.loadSyntheticData();
  }

  loadSyntheticData() {
    try {
      const dataPath = path.join(__dirname, 'syntheticRansomwareData.json');
      const raw = fs.readFileSync(dataPath, 'utf-8');
      this.syntheticData = JSON.parse(raw);
    } catch (err) {
      console.warn('[PatternMatcher] Could not load synthetic dataset:', err.message);
      this.syntheticData = {
        entropyThresholds: { criticalEncrypted: 7.5 },
        suspiciousExtensions: ['.locked', '.crypto', '.crypt', '.crypted', '.enc', '.lockbit', '.blackcat', '.WNCRY'],
        ransomwareFamilies: []
      };
    }
  }

  /**
   * Evaluate a file mutation event against synthetic ransomware signatures
   */
  evaluateFileEvent(fileEvent, activeProcess = null) {
    if (!fileEvent) return null;

    const { entropy, extension, fullPath, filename, mutationVelocity } = fileEvent;
    const { suspiciousExtensions, entropyThresholds, ransomwareFamilies } = this.syntheticData;

    let matchedFamily = null;
    let matchReasons = [];
    let riskScore = 0;

    // 1. Check for suspicious ransomware extension
    const isSuspiciousExt = suspiciousExtensions.some(ext => extension === ext || filename.toLowerCase().endsWith(ext));
    if (isSuspiciousExt) {
      riskScore += 45;
      matchReasons.push(`File extension matched known ransomware pattern (${extension})`);
      matchedFamily = ransomwareFamilies.find(f => f.outputExtension === extension) || ransomwareFamilies[0];
    }

    // 2. Check for high Shannon entropy (encrypted data distribution)
    if (entropy >= entropyThresholds.criticalEncrypted) {
      riskScore += 40;
      matchReasons.push(`Critical Shannon entropy spike detected (H=${entropy} / threshold: ${entropyThresholds.criticalEncrypted})`);
    } else if (entropy >= 6.8) {
      riskScore += 20;
      matchReasons.push(`Elevated file entropy (H=${entropy})`);
    }

    // 3. Check for high velocity mutation bursts
    if (mutationVelocity && mutationVelocity >= 4) {
      riskScore += 25;
      matchReasons.push(`High mutation velocity burst (${mutationVelocity} file ops in 5s window)`);
    }

    // 4. Correlate with active process if provided
    if (activeProcess) {
      const cmd = (activeProcess.command || activeProcess.name || '').toLowerCase();
      const matchedSignature = ransomwareFamilies.some(f => 
        (f.processSignatures && f.processSignatures.some(sig => cmd.includes(sig.toLowerCase()))) ||
        (f.macSignatures && f.macSignatures.some(sig => cmd.includes(sig.toLowerCase())))
      );

      if (matchedSignature) {
        riskScore += 35;
        matchReasons.push(`Process execution signature matched synthetic ransomware behavior (${activeProcess.name})`);
      }
    }

    // Determine final threat posture
    if (riskScore >= 40) {
      const severity = riskScore >= 75 ? 'CRITICAL' : riskScore >= 50 ? 'HIGH' : 'ELEVATED';

      return {
        id: `THREAT-MATCH-${Date.now()}`,
        timestamp: new Date().toISOString(),
        severity,
        riskScore: Math.min(99, riskScore),
        matchedFamily: matchedFamily ? matchedFamily.name : 'Synthetic High-Entropy Threat Pattern',
        vector: matchedFamily ? matchedFamily.vector : 'Autonomous High-Entropy Mutation',
        reasons: matchReasons,
        // Detailed Process & File Location Mapping
        location: {
          modifiedFilePath: fullPath,
          targetFilename: filename,
          entropy: entropy,
          processPid: activeProcess ? activeProcess.pid : process.pid,
          processName: activeProcess ? activeProcess.name : 'Unknown/Direct File System Writer',
          processExecutablePath: activeProcess ? activeProcess.path : (fileEvent.processPath || 'Kernel / Direct I/O Driver'),
          processUser: activeProcess ? activeProcess.user : 'system',
          directory: path.dirname(fullPath)
        },
        tactics: matchedFamily ? matchedFamily.tactics : ['T1486 Data Encrypted for Impact']
      };
    }

    return null;
  }
}

export const patternMatcher = new RansomwarePatternMatcher();
