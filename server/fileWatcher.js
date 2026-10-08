import fs from 'fs';
import path from 'path';

/**
 * Calculates Shannon Entropy H(X) = -sum(p(x) * log2(p(x))) for a given byte buffer.
 * Returns a float between 0.0 (uniform byte) and 8.0 (pure random/ciphertext).
 */
export function calculateShannonEntropy(buffer) {
  if (!buffer || buffer.length === 0) return 0;

  const frequencies = new Array(256).fill(0);
  for (let i = 0; i < buffer.length; i++) {
    frequencies[buffer[i]]++;
  }

  let entropy = 0;
  const len = buffer.length;
  for (let i = 0; i < 256; i++) {
    if (frequencies[i] > 0) {
      const p = frequencies[i] / len;
      entropy -= p * Math.log2(p);
    }
  }

  return parseFloat(entropy.toFixed(3));
}

// Known suspicious/ransomware-associated file extensions
export const SUSPICIOUS_EXTENSIONS = new Set([
  '.lockbit', '.locked', '.crypted', '.crypto', '.enc',
  '.blackcat', '.alphv', '.wncry', '.wannacry', '.darkbit',
  '.encrypt', '.paycrypt', '.mallox', '.phobos', '.makop',
  '.aes', '.vault', '.key'
]);

export class FileWatcherService {
  constructor() {
    this.watchers = new Map();
    this.listeners = new Set();
    this.monitoredDirectories = new Set();
    this.mutationLog = [];
    this.recentMutationsWindow = [];
    this.baselineEntropy = 4.2;
    this.peakEntropyObserved = 4.2;
    this.knownOriginalExtensions = new Map(); // Track original extensions to detect extension changes
  }

  initSandbox(baseDir) {
    const sandboxPath = path.resolve(baseDir, 'monitored_sandbox');
    if (!fs.existsSync(sandboxPath)) {
      fs.mkdirSync(sandboxPath, { recursive: true });
      fs.writeFileSync(path.join(sandboxPath, 'financial_records.xlsx'), 'Quarterly Financial Statement 2026 Corporate Ledger Data');
      fs.writeFileSync(path.join(sandboxPath, 'client_database.sql'), 'CREATE TABLE clients (id INT, name VARCHAR(255), balance NUMERIC);');
      fs.writeFileSync(path.join(sandboxPath, 'corporate_passwords.kdbx'), 'Encrypted KeePass Vault Header Signature v2');
    }
    this.watchDirectory(sandboxPath);
    return sandboxPath;
  }

  watchDirectory(dirPath) {
    if (!fs.existsSync(dirPath) || this.watchers.has(dirPath)) return;

    try {
      const watcher = fs.watch(dirPath, { recursive: true }, async (eventType, filename) => {
        if (!filename) return;
        const fullPath = path.join(dirPath, filename);
        await this.handleFileEvent(eventType, fullPath, filename);
      });

      this.watchers.set(dirPath, watcher);
      this.monitoredDirectories.add(dirPath);
      console.log(`[FileWatcher] Active Sandbox Endpoint Monitoring on: ${dirPath}`);
    } catch (err) {
      console.warn(`[FileWatcher] Failed to watch ${dirPath}:`, err.message);
    }
  }

  async handleFileEvent(eventType, fullPath, filename) {
    let entropy = this.baselineEntropy;
    let size = 0;
    let exists = false;

    try {
      if (fs.existsSync(fullPath)) {
        exists = true;
        const stat = fs.statSync(fullPath);
        if (stat.isFile()) {
          size = stat.size;
          // Read up to 64KB for quick entropy calculation
          const sampleSize = Math.min(stat.size, 65536);
          const buffer = Buffer.alloc(sampleSize);
          const fd = fs.openSync(fullPath, 'r');
          fs.readSync(fd, buffer, 0, sampleSize, 0);
          fs.closeSync(fd);
          entropy = calculateShannonEntropy(buffer);
        }
      }
    } catch (err) {
      // file may have been rapidly unlinked or renamed
    }

    if (entropy > this.peakEntropyObserved) {
      this.peakEntropyObserved = entropy;
    }

    const ext = path.extname(filename).toLowerCase();
    const isSuspiciousExt = SUSPICIOUS_EXTENSIONS.has(ext);

    // Track extension modifications (e.g. file.docx -> file.docx.lockbit)
    const baseNameWithoutExt = path.basename(filename, ext);
    let isExtensionChanged = false;
    if (ext && isSuspiciousExt) {
      isExtensionChanged = true;
    } else if (this.knownOriginalExtensions.has(baseNameWithoutExt)) {
      const prevExt = this.knownOriginalExtensions.get(baseNameWithoutExt);
      if (prevExt !== ext) isExtensionChanged = true;
    } else {
      this.knownOriginalExtensions.set(baseNameWithoutExt, ext);
    }

    // Rolling mutation velocity (mutations in last 5 seconds)
    const now = Date.now();
    this.recentMutationsWindow.push(now);
    this.recentMutationsWindow = this.recentMutationsWindow.filter(t => now - t <= 5000);
    const mutationVelocity = this.recentMutationsWindow.length;

    const event = {
      id: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      eventType,
      fullPath,
      filename,
      extension: ext,
      size,
      exists,
      entropy,
      baselineEntropy: this.baselineEntropy,
      entropyDelta: parseFloat((entropy - this.baselineEntropy).toFixed(3)),
      peakEntropy: this.peakEntropyObserved,
      isSuspiciousExtension: isSuspiciousExt,
      isExtensionChanged,
      mutationVelocity,
      monitoringScope: 'Sandbox Endpoint Monitoring',
      processAttribution: 'Process attribution unavailable',
      pid: null
    };

    this.mutationLog.unshift(event);
    if (this.mutationLog.length > 200) this.mutationLog.pop();

    this.notify(event);
    return event;
  }

  onEvent(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(event) {
    this.listeners.forEach(cb => {
      try {
        cb(event);
      } catch (err) {
        console.error('[FileWatcher] Listener error:', err);
      }
    });
  }

  getRecentLogs(limit = 30) {
    return this.mutationLog.slice(0, limit);
  }

  getRollingEntropyStats(windowSize = 20) {
    const slice = this.mutationLog.slice(0, windowSize);
    if (slice.length === 0) {
      return {
        baseline: this.baselineEntropy,
        current: this.baselineEntropy,
        peak: this.peakEntropyObserved,
        average: this.baselineEntropy,
        delta: 0.0
      };
    }
    const current = slice[0].entropy;
    const avg = slice.reduce((sum, e) => sum + e.entropy, 0) / slice.length;
    return {
      baseline: this.baselineEntropy,
      current,
      peak: this.peakEntropyObserved,
      average: parseFloat(avg.toFixed(3)),
      delta: parseFloat((current - this.baselineEntropy).toFixed(3))
    };
  }

  closeAll() {
    this.watchers.forEach(w => w.close());
    this.watchers.clear();
    this.monitoredDirectories.clear();
  }
}

export const fileWatcher = new FileWatcherService();
