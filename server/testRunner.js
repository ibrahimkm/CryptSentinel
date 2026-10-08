import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export class SyntheticTestRunner {
  constructor(sandboxDir) {
    this.sandboxDir = sandboxDir;
  }

  /**
   * Run a safe synthetic ransomware attack simulation in the isolated sandbox
   */
  async runSyntheticAttack(scenario = 'lockbit') {
    if (!this.sandboxDir || !fs.existsSync(this.sandboxDir)) {
      throw new Error('Sandbox directory not initialized');
    }

    const isCanaryScenario = scenario === 'canary';

    const testFiles = isCanaryScenario
      ? [
          { name: 'financial_report.xlsx', content: 'CONFIDENTIAL FINANCIAL QUARTERLY AUDIT SPREADSHEET 2026 - CANARY DECOY' },
          { name: 'q4_financials.xlsx', content: 'CONFIDENTIAL FINANCIAL QUARTERLY AUDIT SPREADSHEET 2026' }
        ]
      : [
          { name: 'q4_financials.xlsx', content: 'CONFIDENTIAL FINANCIAL QUARTERLY AUDIT SPREADSHEET 2026' },
          { name: 'hr_payroll_database.sql', content: 'EMPLOYEE PAYROLL TABLE ID SALARY SSN ENCRYPTED=FALSE' },
          { name: 'patent_blueprints.pdf', content: 'PROPRIETARY INTELLECTUAL PROPERTY AND ARCHITECTURE DESIGN SCHEMATICS' }
        ];

    const results = [];

    // 1. Create target dummy test files
    for (const item of testFiles) {
      const targetPath = path.join(this.sandboxDir, item.name);
      fs.writeFileSync(targetPath, item.content);
    }

    // 2. Perform synthetic encryption mutation with random high-entropy byte streams
    for (const item of testFiles) {
      const originalPath = path.join(this.sandboxDir, item.name);
      const extension = scenario === 'lockbit' ? '.lockbit' : scenario === 'blackcat' ? '.crypted' : (scenario === 'canary' ? '.lockbit' : '.locked');
      const lockedPath = path.join(this.sandboxDir, `${item.name}${extension}`);

      // Generate high-entropy pseudo-random bytes (simulating AES/ChaCha20 encryption payload)
      const randomPayload = crypto.randomBytes(4096);

      // Write locked file and remove original
      fs.writeFileSync(lockedPath, randomPayload);
      if (fs.existsSync(originalPath)) {
        fs.unlinkSync(originalPath);
      }

      results.push({
        original: originalPath,
        modifiedTo: lockedPath,
        scenario
      });

      // Small delay between mutations to simulate rapid encryption burst
      await new Promise(r => setTimeout(r, 120));
    }

    return {
      success: true,
      scenario,
      filesMutated: results.length,
      sandboxPath: this.sandboxDir,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Reset sandbox dummy files
   */
  resetSandbox() {
    if (!this.sandboxDir || !fs.existsSync(this.sandboxDir)) return;
    const files = fs.readdirSync(this.sandboxDir);
    for (const file of files) {
      try {
        fs.unlinkSync(path.join(this.sandboxDir, file));
      } catch {}
    }
    // Recreate clean files
    fs.writeFileSync(path.join(this.sandboxDir, 'financial_records.xlsx'), 'Clean corporate finance ledger');
    fs.writeFileSync(path.join(this.sandboxDir, 'client_database.sql'), 'Clean SQL database structure');
  }
}
