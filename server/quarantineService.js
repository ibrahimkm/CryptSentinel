import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dbService } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const defaultQuarantineDir = process.env.QUARANTINE_DIR || path.join(projectRoot, 'quarantine');
const defaultSandboxDir = process.env.SANDBOX_DIR || path.join(projectRoot, 'monitored_sandbox');

export class QuarantineService {
  constructor(quarantineDir = defaultQuarantineDir, sandboxDir = defaultSandboxDir, db = dbService) {
    this.quarantineDir = path.resolve(quarantineDir);
    this.sandboxDir = path.resolve(sandboxDir);
    this.db = db;
    this.init();
  }

  init() {
    if (!fs.existsSync(this.quarantineDir)) {
      fs.mkdirSync(this.quarantineDir, { recursive: true, mode: 0o700 });
    }
  }

  /**
   * Validate that a target path is strictly within the allowed sandbox directory
   * and contains no path traversal tricks.
   */
  validatePathSafety(targetPath) {
    if (!targetPath || typeof targetPath !== 'string') {
      throw new Error('Invalid file path: path must be a non-empty string');
    }

    if (targetPath.includes('\0')) {
      throw new Error('Path traversal rejected: null byte detected');
    }

    const resolved = path.resolve(targetPath);
    const normalizedSandbox = path.resolve(this.sandboxDir);

    // Path must strictly reside inside sandbox directory
    if (!resolved.startsWith(normalizedSandbox + path.sep) && resolved !== normalizedSandbox) {
      throw new Error(`Security Violation: Path '${targetPath}' is outside the authorized sandbox directory '${this.sandboxDir}'`);
    }

    return resolved;
  }

  /**
   * Compute SHA-256 checksum for a file or buffer
   */
  computeSha256(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  /**
   * Safely isolate a suspicious file into the quarantine repository
   */
  async quarantineFile(filePath, reason = 'Suspicious high-entropy mutation detected', incidentId = null) {
    const safeSourcePath = this.validatePathSafety(filePath);

    if (!fs.existsSync(safeSourcePath)) {
      throw new Error(`File not found at source path: ${filePath}`);
    }

    const stat = fs.statSync(safeSourcePath);
    if (!stat.isFile()) {
      throw new Error(`Target is not a regular file: ${filePath}`);
    }

    // 1. Calculate SHA-256 before moving
    const sha256 = this.computeSha256(safeSourcePath);
    const originalFilename = path.basename(safeSourcePath);

    // 2. Generate unique secure quarantine file vault name
    const timestamp = Date.now();
    const randomSuffix = crypto.randomBytes(4).toString('hex');
    const vaultFilename = `${path.parse(originalFilename).name}_${timestamp}_${randomSuffix}.vault`;
    const quarantinePath = path.join(this.quarantineDir, vaultFilename);

    // 3. Move file into quarantine directory
    fs.copyFileSync(safeSourcePath, quarantinePath);
    fs.unlinkSync(safeSourcePath);

    // 4. Store metadata in SQLite database
    const qrnId = `QRN-${timestamp}-${Math.floor(Math.random() * 1000)}`;
    const record = this.db.createQuarantineItem({
      id: qrnId,
      originalPath: safeSourcePath,
      quarantinePath,
      sha256,
      originalFilename,
      reason,
      incidentId,
      status: 'QUARANTINED'
    });

    // 5. Audit Log
    this.db.createAuditLog({
      actionType: 'FILE_QUARANTINE',
      actor: 'SENTINEL_SHIELD',
      details: {
        quarantineId: qrnId,
        originalPath: safeSourcePath,
        sha256,
        reason
      }
    });

    console.log(`[Quarantine] Safely quarantined '${originalFilename}' -> ${vaultFilename} [SHA-256: ${sha256.slice(0, 12)}...]`);
    return record;
  }

  /**
   * Restore a quarantined file back to its original location
   */
  async restoreFile(quarantineId) {
    const item = this.db.getQuarantineItemById(quarantineId);
    if (!item) {
      throw new Error(`Quarantine item not found with ID: ${quarantineId}`);
    }

    if (item.status === 'RESTORED') {
      throw new Error(`File has already been restored (ID: ${quarantineId})`);
    }

    if (item.status === 'DELETED') {
      throw new Error(`Cannot restore permanently deleted file (ID: ${quarantineId})`);
    }

    const quarantinePath = path.resolve(item.quarantine_path || item.quarantinePath);
    if (!fs.existsSync(quarantinePath)) {
      throw new Error(`Quarantine vault file not found on disk: ${quarantinePath}`);
    }

    // Validate original destination path safety
    const originalPath = path.resolve(item.original_path || item.originalPath);
    const safeDestPath = this.validatePathSafety(originalPath);

    // Ensure parent directory exists
    const parentDir = path.dirname(safeDestPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    // If destination already exists, generate non-destructive name
    let destinationPath = safeDestPath;
    if (fs.existsSync(destinationPath)) {
      const parsed = path.parse(safeDestPath);
      destinationPath = path.join(parsed.dir, `${parsed.name}_restored_${Date.now()}${parsed.ext}`);
    }

    // Move file back
    fs.copyFileSync(quarantinePath, destinationPath);
    fs.unlinkSync(quarantinePath);

    // Update database status
    const updated = this.db.updateQuarantineStatus(quarantineId, 'RESTORED');

    // Audit Log
    this.db.createAuditLog({
      actionType: 'FILE_RESTORE',
      actor: 'SOC_OPERATOR',
      details: {
        quarantineId,
        restoredTo: destinationPath,
        sha256: item.sha256
      }
    });

    console.log(`[Quarantine] Restored file (ID: ${quarantineId}) to '${destinationPath}'`);
    return {
      ...updated,
      restoredPath: destinationPath
    };
  }

  /**
   * Permanently delete a quarantined file upon explicit request
   */
  async deletePermanently(quarantineId) {
    const item = this.db.getQuarantineItemById(quarantineId);
    if (!item) {
      throw new Error(`Quarantine item not found with ID: ${quarantineId}`);
    }

    const quarantinePath = path.resolve(item.quarantine_path || item.quarantinePath);
    if (fs.existsSync(quarantinePath)) {
      fs.unlinkSync(quarantinePath);
    }

    const updated = this.db.updateQuarantineStatus(quarantineId, 'DELETED');

    // Audit Log
    this.db.createAuditLog({
      actionType: 'FILE_PERMANENT_DELETE',
      actor: 'SOC_OPERATOR',
      details: {
        quarantineId,
        deletedVault: quarantinePath,
        sha256: item.sha256
      }
    });

    console.log(`[Quarantine] Permanently deleted quarantined vault (ID: ${quarantineId})`);
    return updated;
  }

  /**
   * List quarantined items
   */
  getQuarantinedItems(limit = 50) {
    return this.db.getQuarantineItems(limit);
  }

  /**
   * Get single item
   */
  getQuarantineItem(quarantineId) {
    return this.db.getQuarantineItemById(quarantineId);
  }
}

export const quarantineService = new QuarantineService();
