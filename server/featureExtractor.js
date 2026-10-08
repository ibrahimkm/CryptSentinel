import { systemMonitor } from './systemMonitor.js';

export class FeatureExtractor {
  constructor(windowDurationMs = 10000, baselineEntropy = 4.2) {
    this.windowDurationMs = windowDurationMs;
    this.baselineEntropy = baselineEntropy;
    this.eventBuffer = [];
  }

  /**
   * Push a file watcher event into the sliding window buffer
   */
  addEvent(event) {
    const timestamp = event.timestamp ? new Date(event.timestamp).getTime() : Date.now();
    this.eventBuffer.push({ ...event, _time: timestamp });
    this.cleanupOldEvents();
  }

  /**
   * Remove events outside the current sliding window
   */
  cleanupOldEvents() {
    const cutoff = Date.now() - this.windowDurationMs;
    this.eventBuffer = this.eventBuffer.filter(e => e._time >= cutoff);
  }

  /**
   * Extract complete 16-dimensional behavioral feature vector
   */
  async extractFeatures(customEvents = null) {
    this.cleanupOldEvents();
    const events = customEvents || this.eventBuffer;

    // Default neutral feature vector if no events
    if (events.length === 0) {
      let activeProcesses = 100;
      try {
        const live = await systemMonitor.getLiveProcesses(10);
        activeProcesses = live.length > 0 ? live.length * 10 : 100;
      } catch {}

      return {
        files_modified: 0,
        files_created: 0,
        files_deleted: 0,
        mutations_per_second: 0.0,
        average_entropy: this.baselineEntropy,
        maximum_entropy: this.baselineEntropy,
        entropy_delta: 0.0,
        high_entropy_file_ratio: 0.0,
        suspicious_extension_count: 0,
        extension_change_count: 0,
        total_bytes_modified: 0,
        average_file_size: 0.0,
        process_cpu: 1.5,
        process_memory: 65.0,
        number_of_active_processes: activeProcesses,
        burst_duration: 1.0
      };
    }

    let filesModified = 0;
    let filesCreated = 0;
    let filesDeleted = 0;
    let suspiciousExtCount = 0;
    let extChangeCount = 0;
    let highEntropyCount = 0;
    let totalBytes = 0;
    let entropySum = 0;
    let maxEntropy = 0;

    const timestamps = events.map(e => e._time || new Date(e.timestamp).getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    const burstDuration = Math.max(0.5, (maxTime - minTime) / 1000);

    for (const evt of events) {
      const type = (evt.eventType || '').toLowerCase();
      if (type.includes('create') || type === 'rename') {
        filesCreated++;
      } else if (type.includes('delete') || type.includes('unlink')) {
        filesDeleted++;
      } else {
        filesModified++;
      }

      const ent = typeof evt.entropy === 'number' ? evt.entropy : this.baselineEntropy;
      entropySum += ent;
      if (ent > maxEntropy) maxEntropy = ent;
      if (ent >= 7.2) highEntropyCount++;

      if (evt.isSuspiciousExtension) suspiciousExtCount++;
      if (evt.isExtensionChanged) extChangeCount++;

      const size = evt.size || 0;
      totalBytes += size;
    }

    const totalCount = events.length;
    const avgEntropy = parseFloat((entropySum / totalCount).toFixed(3));
    const entropyDelta = parseFloat((avgEntropy - this.baselineEntropy).toFixed(3));
    const highEntropyRatio = parseFloat((highEntropyCount / totalCount).toFixed(3));
    const mutationsPerSec = parseFloat((totalCount / burstDuration).toFixed(2));
    const avgFileSize = parseFloat((totalBytes / totalCount).toFixed(1));

    // Get system process telemetry
    let cpu = 12.0;
    let mem = 120.0;
    let activeProcesses = 120;

    try {
      const live = await systemMonitor.getLiveProcesses(30);
      activeProcesses = live.length;
      const topProc = live[0];
      if (topProc) {
        cpu = parseFloat(topProc.cpu || 15.0);
        mem = parseFloat(topProc.memory || 140.0);
      }
    } catch {}

    return {
      files_modified: filesModified,
      files_created: filesCreated,
      files_deleted: filesDeleted,
      mutations_per_second: mutationsPerSec,
      average_entropy: avgEntropy,
      maximum_entropy: parseFloat(maxEntropy.toFixed(3)),
      entropy_delta: entropyDelta,
      high_entropy_file_ratio: highEntropyRatio,
      suspicious_extension_count: suspiciousExtCount,
      extension_change_count: extChangeCount,
      total_bytes_modified: totalBytes,
      average_file_size: avgFileSize,
      process_cpu: cpu,
      process_memory: mem,
      number_of_active_processes: activeProcesses,
      burst_duration: parseFloat(burstDuration.toFixed(2))
    };
  }

  clear() {
    this.eventBuffer = [];
  }
}

export const featureExtractor = new FeatureExtractor();
