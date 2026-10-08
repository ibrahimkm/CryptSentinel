import { exec } from 'child_process';
import util from 'util';
import os from 'os';
import { systemMonitor } from './systemMonitor.js';

const execAsync = util.promisify(exec);
const platform = os.platform();

export class ProcessAttributionService {
  constructor() {
    this.activeSimulatorPid = null;
    this.activeSimulatorName = null;
  }

  setSimulatorContext(pid, name) {
    this.activeSimulatorPid = pid;
    this.activeSimulatorName = name;
  }

  clearSimulatorContext() {
    this.activeSimulatorPid = null;
    this.activeSimulatorName = null;
  }

  /**
   * Attempt to find the real process responsible for a file modification
   * Returns a complete process descriptor or fallback if unavailable
   */
  async attributeFileEvent(filePath) {
    if (!filePath) {
      return this.getFallbackAttribution();
    }

    // 1. If explicit simulator context is active, return that real process
    if (this.activeSimulatorPid) {
      const details = await systemMonitor.getProcessDetails(this.activeSimulatorPid);
      return {
        attributed: true,
        pid: this.activeSimulatorPid,
        name: this.activeSimulatorName || details.name || 'SyntheticSimulator',
        path: details.path || process.execPath,
        user: details.user || os.userInfo().username,
        command: details.command || `${details.name} (pid: ${this.activeSimulatorPid})`,
        cpu: details.cpu || 0.0,
        memory: details.memory || '24 MB',
        processAttribution: `${this.activeSimulatorName || details.name} (PID: ${this.activeSimulatorPid})`
      };
    }

    // 2. Query OS for processes with open handles on the file (where platform allows)
    try {
      if (platform === 'darwin' || platform === 'linux') {
        const { stdout } = await execAsync(`lsof -t "${filePath}" 2>/dev/null || true`);
        const pidStr = stdout.trim().split('\n')[0];
        if (pidStr && !isNaN(parseInt(pidStr, 10))) {
          const pid = parseInt(pidStr, 10);
          const details = await systemMonitor.getProcessDetails(pid);
          return {
            attributed: true,
            pid,
            name: details.name || `proc-${pid}`,
            path: details.path || `/usr/local/bin/${details.name}`,
            user: details.user || os.userInfo().username,
            command: details.command || details.name,
            cpu: details.cpu || 0.0,
            memory: details.memory || '32 MB',
            processAttribution: `${details.name} (PID: ${pid})`
          };
        }
      }
    } catch {
      // Gracefully fall through to fallback
    }

    return this.getFallbackAttribution();
  }

  getFallbackAttribution() {
    return {
      attributed: false,
      pid: null,
      name: null,
      path: null,
      user: null,
      command: null,
      cpu: null,
      memory: null,
      processAttribution: 'Process attribution unavailable'
    };
  }
}

export const processAttribution = new ProcessAttributionService();
