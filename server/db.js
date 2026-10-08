import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const defaultDbPath = process.env.DB_PATH || path.join(projectRoot, 'cryptsentinel.db');

export class DatabaseService {
  constructor(dbPath = defaultDbPath) {
    this.dbPath = dbPath;
    this.db = null;
    this.init();
  }

  init() {
    this.db = new DatabaseSync(this.dbPath);
    try {
      this.db.exec(`
        PRAGMA journal_mode = WAL;
        PRAGMA busy_timeout = 5000;
        PRAGMA synchronous = NORMAL;
      `);
    } catch {}
    this.createTables();
  }

  createTables() {
    // 1. Incidents Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        severity TEXT NOT NULL,
        risk_score REAL NOT NULL,
        matched_family TEXT,
        title TEXT NOT NULL,
        description TEXT,
        mitre_tactics TEXT,
        status TEXT DEFAULT 'OPEN',
        raw_data TEXT
      )
    `);

    // 2. Detections / File Events Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS detections (
        id TEXT PRIMARY KEY,
        incident_id TEXT,
        timestamp TEXT NOT NULL,
        event_type TEXT NOT NULL,
        full_path TEXT NOT NULL,
        filename TEXT NOT NULL,
        extension TEXT,
        entropy REAL NOT NULL,
        mutation_velocity INTEGER DEFAULT 0,
        size INTEGER DEFAULT 0,
        is_suspicious INTEGER DEFAULT 0,
        FOREIGN KEY (incident_id) REFERENCES incidents(id)
      )
    `);

    // 3. Predictions Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS predictions (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        classification TEXT NOT NULL,
        probability REAL NOT NULL,
        confidence REAL NOT NULL,
        model_name TEXT NOT NULL,
        model_version TEXT NOT NULL,
        features TEXT,
        raw_result TEXT
      )
    `);

    // 4. Quarantine Items Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS quarantine_items (
        id TEXT PRIMARY KEY,
        original_path TEXT NOT NULL,
        quarantine_path TEXT NOT NULL,
        sha256 TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        reason TEXT,
        incident_id TEXT,
        status TEXT DEFAULT 'QUARANTINED',
        FOREIGN KEY (incident_id) REFERENCES incidents(id)
      )
    `);

    // 5. Audit Logs Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        action_type TEXT NOT NULL,
        actor TEXT DEFAULT 'SYSTEM',
        details TEXT,
        ip_address TEXT DEFAULT '127.0.0.1'
      )
    `);

    // 6. Model Versions Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS model_versions (
        id TEXT PRIMARY KEY,
        model_name TEXT NOT NULL,
        version TEXT NOT NULL,
        trained_at TEXT NOT NULL,
        metrics TEXT,
        is_active INTEGER DEFAULT 1
      )
    `);

    // Create indexes for faster queries
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_incidents_timestamp ON incidents(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_detections_timestamp ON detections(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_predictions_timestamp ON predictions(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_quarantine_timestamp ON quarantine_items(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
    `);
  }

  // --- Incident CRUD ---
  createIncident(incident) {
    const stmt = this.db.prepare(`
      INSERT INTO incidents (id, timestamp, severity, risk_score, matched_family, title, description, mitre_tactics, status, raw_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const id = incident.id || `INC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = incident.timestamp || new Date().toISOString();
    const tactics = typeof incident.mitreTactics === 'object' ? JSON.stringify(incident.mitreTactics) : (incident.mitreTactics || '[]');
    const rawData = typeof incident.rawData === 'object' ? JSON.stringify(incident.rawData) : (incident.rawData || '{}');

    stmt.run(
      id,
      timestamp,
      incident.severity || 'HIGH',
      incident.riskScore || incident.risk_score || 75.0,
      incident.matchedFamily || incident.matched_family || 'UNKNOWN',
      incident.title || 'Security Incident Detected',
      incident.description || '',
      tactics,
      incident.status || 'OPEN',
      rawData
    );
    return this.getIncidentById(id);
  }

  getIncidents(limit = 50) {
    const stmt = this.db.prepare(`SELECT * FROM incidents ORDER BY timestamp DESC LIMIT ?`);
    const rows = stmt.all(limit);
    return rows.map(r => ({
      ...r,
      riskScore: r.risk_score,
      matchedFamily: r.matched_family,
      mitreTactics: JSON.parse(r.mitre_tactics || '[]'),
      rawData: JSON.parse(r.raw_data || '{}')
    }));
  }

  getIncidentById(id) {
    const stmt = this.db.prepare(`SELECT * FROM incidents WHERE id = ?`);
    const row = stmt.get(id);
    if (!row) return null;
    return {
      ...row,
      riskScore: row.risk_score,
      matchedFamily: row.matched_family,
      mitreTactics: JSON.parse(row.mitre_tactics || '[]'),
      rawData: JSON.parse(row.raw_data || '{}')
    };
  }

  getActiveIncidents(limit = 10) {
    const stmt = this.db.prepare(`SELECT * FROM incidents WHERE status = 'OPEN' ORDER BY timestamp DESC LIMIT ?`);
    const rows = stmt.all(limit);
    return rows.map(r => ({
      ...r,
      riskScore: r.risk_score,
      matchedFamily: r.matched_family,
      mitreTactics: JSON.parse(r.mitre_tactics || '[]'),
      rawData: JSON.parse(r.raw_data || '{}')
    }));
  }

  resolveOpenIncidents() {
    const stmt = this.db.prepare(`UPDATE incidents SET status = 'CONTAINED' WHERE status = 'OPEN'`);
    stmt.run();
  }

  updateIncidentStatus(id, status) {
    const stmt = this.db.prepare(`UPDATE incidents SET status = ? WHERE id = ?`);
    stmt.run(status, id);
    return this.getIncidentById(id);
  }

  updateIncident(id, updates = {}) {
    const current = this.getIncidentById(id);
    if (!current) return null;

    const severity = updates.severity || current.severity;
    const riskScore = updates.riskScore !== undefined ? updates.riskScore : (updates.risk_score !== undefined ? updates.risk_score : current.risk_score);
    const title = updates.title || current.title;
    const description = updates.description || current.description;
    const rawData = updates.rawData ? (typeof updates.rawData === 'object' ? JSON.stringify(updates.rawData) : updates.rawData) : JSON.stringify(current.rawData || {});

    const stmt = this.db.prepare(`
      UPDATE incidents 
      SET severity = ?, risk_score = ?, title = ?, description = ?, raw_data = ?
      WHERE id = ?
    `);
    stmt.run(severity, riskScore, title, description, rawData, id);
    return this.getIncidentById(id);
  }

  // --- Detection CRUD ---
  createDetection(det) {
    const stmt = this.db.prepare(`
      INSERT INTO detections (id, incident_id, timestamp, event_type, full_path, filename, extension, entropy, mutation_velocity, size, is_suspicious)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const id = det.id || `DET-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = det.timestamp || new Date().toISOString();

    stmt.run(
      id,
      det.incidentId || det.incident_id || null,
      timestamp,
      det.eventType || det.event_type || 'MODIFY',
      det.fullPath || det.full_path || '',
      det.filename || path.basename(det.fullPath || ''),
      det.extension || path.extname(det.fullPath || '').toLowerCase(),
      det.entropy || 4.2,
      det.mutationVelocity || det.mutation_velocity || 0,
      det.size || 0,
      det.isSuspicious || det.is_suspicious ? 1 : 0
    );
    return this.getDetectionById(id);
  }

  getDetections(limit = 50) {
    const stmt = this.db.prepare(`SELECT * FROM detections ORDER BY timestamp DESC LIMIT ?`);
    return stmt.all(limit);
  }

  getDetectionById(id) {
    const stmt = this.db.prepare(`SELECT * FROM detections WHERE id = ?`);
    const row = stmt.get(id);
    return row || null;
  }

  // --- Prediction CRUD ---
  createPrediction(pred) {
    const stmt = this.db.prepare(`
      INSERT INTO predictions (id, timestamp, classification, probability, confidence, model_name, model_version, features, raw_result)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const id = pred.id || `PRED-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = pred.timestamp || new Date().toISOString();
    const features = typeof pred.features === 'object' ? JSON.stringify(pred.features) : (pred.features || '{}');
    const rawResult = typeof pred.rawResult === 'object' ? JSON.stringify(pred.rawResult) : (pred.rawResult || '{}');

    stmt.run(
      id,
      timestamp,
      pred.classification || 'BENIGN',
      pred.probability || 0.0,
      pred.confidence || 1.0,
      pred.model || pred.modelName || 'RandomForestClassifier',
      pred.modelVersion || '1.0.0-academic',
      features,
      rawResult
    );
    return this.getPredictionById(id);
  }

  getPredictions(limit = 20) {
    const stmt = this.db.prepare(`SELECT * FROM predictions ORDER BY timestamp DESC LIMIT ?`);
    const rows = stmt.all(limit);
    return rows.map(r => ({
      ...r,
      features: JSON.parse(r.features || '{}'),
      rawResult: JSON.parse(r.raw_result || '{}')
    }));
  }

  getLatestPrediction() {
    const stmt = this.db.prepare(`SELECT * FROM predictions ORDER BY timestamp DESC LIMIT 1`);
    const row = stmt.get();
    if (!row) return null;
    return {
      ...row,
      features: JSON.parse(row.features || '{}'),
      rawResult: JSON.parse(row.raw_result || '{}')
    };
  }

  getPredictionById(id) {
    if (!id) return null;
    const stmt = this.db.prepare(`SELECT * FROM predictions WHERE id = ?`);
    const row = stmt.get(id);
    if (!row) return null;
    return {
      ...row,
      features: JSON.parse(row.features || '{}'),
      rawResult: JSON.parse(row.raw_result || '{}')
    };
  }

  // --- Quarantine CRUD ---
  createQuarantineItem(item) {
    const stmt = this.db.prepare(`
      INSERT INTO quarantine_items (id, original_path, quarantine_path, sha256, original_filename, timestamp, reason, incident_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const id = item.id || `QRN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = item.timestamp || new Date().toISOString();

    stmt.run(
      id,
      item.originalPath || item.original_path,
      item.quarantinePath || item.quarantine_path,
      item.sha256,
      item.originalFilename || item.original_filename || path.basename(item.originalPath || ''),
      timestamp,
      item.reason || 'High entropy and suspicious extension pattern detected',
      item.incidentId || item.incident_id || null,
      item.status || 'QUARANTINED'
    );
    return this.getQuarantineItemById(id);
  }

  getQuarantineItems(limit = 50) {
    const stmt = this.db.prepare(`SELECT * FROM quarantine_items ORDER BY timestamp DESC LIMIT ?`);
    return stmt.all(limit);
  }

  getQuarantineItemById(id) {
    const stmt = this.db.prepare(`SELECT * FROM quarantine_items WHERE id = ?`);
    const row = stmt.get(id);
    return row || null;
  }

  updateQuarantineStatus(id, status) {
    const stmt = this.db.prepare(`UPDATE quarantine_items SET status = ? WHERE id = ?`);
    stmt.run(status, id);
    return this.getQuarantineItemById(id);
  }

  deleteQuarantineItem(id) {
    const item = this.getQuarantineItemById(id);
    if (!item) return null;
    const stmt = this.db.prepare(`DELETE FROM quarantine_items WHERE id = ?`);
    stmt.run(id);
    return item;
  }

  // --- Audit Logs CRUD ---
  createAuditLog(log) {
    const stmt = this.db.prepare(`
      INSERT INTO audit_logs (id, timestamp, action_type, actor, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const id = log.id || `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = log.timestamp || new Date().toISOString();
    const details = typeof log.details === 'object' ? JSON.stringify(log.details) : (log.details || '');

    stmt.run(
      id,
      timestamp,
      log.actionType || log.action_type || 'SYSTEM_EVENT',
      log.actor || 'SYSTEM',
      details,
      log.ipAddress || log.ip_address || '127.0.0.1'
    );
    return this.getAuditLogById(id);
  }

  getAuditLogs(limit = 50) {
    const stmt = this.db.prepare(`SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?`);
    const rows = stmt.all(limit);
    return rows.map(r => {
      let detailsParsed = r.details;
      try { detailsParsed = JSON.parse(r.details); } catch {}
      return { ...r, details: detailsParsed };
    });
  }

  getAuditLogById(id) {
    const stmt = this.db.prepare(`SELECT * FROM audit_logs WHERE id = ?`);
    const row = stmt.get(id);
    if (!row) return null;
    let detailsParsed = row.details;
    try { detailsParsed = JSON.parse(row.details); } catch {}
    return { ...row, details: detailsParsed };
  }

  // --- Reset Sandbox / Clear Temporary Test Data ---
  clearTestData() {
    this.db.exec(`
      DELETE FROM detections;
      DELETE FROM quarantine_items;
      DELETE FROM incidents WHERE id LIKE 'INC-%';
      DELETE FROM predictions WHERE id LIKE 'PRED-%';
    `);
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const dbService = new DatabaseService();
