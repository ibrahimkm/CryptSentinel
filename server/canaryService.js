import fs from 'fs';
import path from 'path';

export const CANARY_FILES = [
  { name: 'payroll.xlsx', description: 'HR Corporate Payroll & Salary Ledger 2026', initialContent: 'CONFIDENTIAL HR PAYROLL RECORD 2026 - SALARY MATRIX' },
  { name: 'financial_report.xlsx', description: 'Corporate Quarterly Earnings & Audit Report', initialContent: 'Q4 CORPORATE FINANCIAL AUDIT SPREADSHEET 2026' },
  { name: 'employee_database.sql', description: 'Relational User & Authentication Database Dump', initialContent: 'CREATE TABLE auth_users (id INT PRIMARY KEY, ssn VARCHAR(11), password_hash TEXT);' },
  { name: 'customer_records.csv', description: 'PII Customer Account & Billing Registry', initialContent: 'account_id,first_name,last_name,email,card_token\n1001,John,Doe,john@corp.net,tok_99182' },
  { name: 'company_strategy.docx', description: 'Confidential Strategic Architecture Roadmap 2026', initialContent: 'CRYPTOSENTINEL CORPORATE PRODUCT ROADMAP - STRICTLY CONFIDENTIAL' }
];

export class CanaryService {
  constructor() {
    this.canaryNames = new Set(CANARY_FILES.map(c => c.name.toLowerCase()));
    this.status = 'ACTIVE'; // 'ACTIVE' | 'TRIGGERED'
    this.lastTriggered = null;
    this.sandboxPath = null;
  }

  /**
   * Initialize canary decoy files in the sandbox directory
   */
  initCanaries(sandboxPath) {
    this.sandboxPath = sandboxPath;
    if (!fs.existsSync(sandboxPath)) {
      fs.mkdirSync(sandboxPath, { recursive: true });
    }

    CANARY_FILES.forEach(canary => {
      const targetPath = path.join(sandboxPath, canary.name);
      if (!fs.existsSync(targetPath)) {
        try {
          fs.writeFileSync(targetPath, canary.initialContent);
        } catch (err) {
          console.warn(`[CanaryService] Failed to write canary file ${canary.name}:`, err.message);
        }
      }
    });

    console.log(`[CanaryService] Deployed ${CANARY_FILES.length} active honeypot canary files in ${sandboxPath}`);
    return this.getCanaryList();
  }

  /**
   * Check if a filename or path corresponds to a canary file (including ransomware extension renames)
   */
  isCanaryFile(filenameOrPath) {
    if (!filenameOrPath) return false;
    const base = path.basename(filenameOrPath).toLowerCase();
    
    // Exact match
    if (this.canaryNames.has(base)) return true;

    // Check if original base was a canary (e.g. payroll.xlsx.lockbit, customer_records.csv.crypted)
    for (const canary of CANARY_FILES) {
      if (base.startsWith(canary.name.toLowerCase())) {
        return true;
      }
    }

    return false;
  }

  /**
   * Retrieve the matched canary metadata for a file
   */
  getCanaryMetadata(filenameOrPath) {
    if (!filenameOrPath) return null;
    const base = path.basename(filenameOrPath).toLowerCase();

    for (const canary of CANARY_FILES) {
      if (base.startsWith(canary.name.toLowerCase())) {
        return {
          ...canary,
          currentPath: filenameOrPath
        };
      }
    }
    return null;
  }

  /**
   * Mark canary tripwire as triggered
   */
  triggerCanary(filename, threatDetails = {}) {
    this.status = 'TRIGGERED';
    this.lastTriggered = {
      canary: filename,
      timestamp: new Date().toISOString(),
      riskScore: threatDetails.riskScore || 95,
      threatFamily: threatDetails.threatFamily || 'Ransomware Mutation Wave',
      action: threatDetails.action || 'QUARANTINED',
      incidentId: threatDetails.incidentId || null
    };
    return this.lastTriggered;
  }

  /**
   * Reset canaries to clean untampered state
   */
  resetCanaries(sandboxPath = this.sandboxPath) {
    this.status = 'ACTIVE';
    this.lastTriggered = null;

    if (sandboxPath && fs.existsSync(sandboxPath)) {
      CANARY_FILES.forEach(canary => {
        const targetPath = path.join(sandboxPath, canary.name);
        try {
          fs.writeFileSync(targetPath, canary.initialContent);
        } catch {}
      });
    }
  }

  /**
   * Get list of deployed canaries with status
   */
  getCanaryList() {
    return CANARY_FILES.map(c => {
      const exists = this.sandboxPath ? fs.existsSync(path.join(this.sandboxPath, c.name)) : true;
      return {
        ...c,
        exists,
        status: this.status === 'TRIGGERED' && this.lastTriggered?.canary?.includes(c.name) ? 'COMPROMISED' : 'ARMED'
      };
    });
  }

  getStatus() {
    return {
      status: this.status,
      canaryCount: CANARY_FILES.length,
      lastTriggered: this.lastTriggered,
      canaries: this.getCanaryList()
    };
  }
}

export const canaryService = new CanaryService();
