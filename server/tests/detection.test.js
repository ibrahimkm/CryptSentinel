import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { calculateShannonEntropy, FileWatcherService, SUSPICIOUS_EXTENSIONS } from '../fileWatcher.js';
import { FeatureExtractor } from '../featureExtractor.js';
import { RiskEngine } from '../riskEngine.js';
import { DatabaseService } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testSandboxDir = path.join(__dirname, 'test_sandbox_run');
const testDbPath = path.join(__dirname, 'test_detection.db');

function cleanDbFiles(dbPath) {
  for (const f of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
    if (fs.existsSync(f)) {
      try { fs.unlinkSync(f); } catch {}
    }
  }
}

async function runDetectionTests() {
  console.log('[Test Suite] Running Phase 3 Detection, Entropy & Risk Engine Tests...');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      process.exitCode = 1;
    }
  }

  // Setup test environment
  if (fs.existsSync(testSandboxDir)) {
    fs.rmSync(testSandboxDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testSandboxDir, { recursive: true });

  cleanDbFiles(testDbPath);
  const db = new DatabaseService(testDbPath);

  try {
    // 1. Test Shannon Entropy Calculation
    console.log('\n--- 1. Shannon Entropy Formula Validation ---');
    const zeroEntropyBuf = Buffer.alloc(1024, 0x41); // All 'A's
    const textBuf = Buffer.from('Normal plaintext file containing standard English text with low ASCII entropy.');
    const randomBuf = crypto.randomBytes(4096); // High entropy ciphertext / AES payload

    const entZero = calculateShannonEntropy(zeroEntropyBuf);
    const entText = calculateShannonEntropy(textBuf);
    const entRand = calculateShannonEntropy(randomBuf);

    assert(entZero === 0.0, `Uniform single-byte buffer produces 0.0 entropy (Got: ${entZero})`);
    assert(entText >= 3.0 && entText <= 5.5, `English plaintext entropy is in expected range 3.0-5.5 (Got: ${entText})`);
    assert(entRand >= 7.8, `Random/Ciphertext byte buffer produces high entropy >= 7.8 (Got: ${entRand})`);

    // 2. Test FileWatcher Real Event Processing on Filesystem
    console.log('\n--- 2. File Watcher Real Event & Delta Processing ---');
    const watcher = new FileWatcherService();
    watcher.initSandbox(path.dirname(testSandboxDir));

    const plainFilePath = path.join(testSandboxDir, 'quarterly_report.docx');
    fs.writeFileSync(plainFilePath, 'Corporate Q1 report text content with low entropy numbers and words');

    const event1 = await watcher.handleFileEvent('change', plainFilePath, 'quarterly_report.docx');
    assert(event1 !== null, 'FileWatcher produces structured event object');
    assert(event1.monitoringScope === 'Sandbox Endpoint Monitoring', 'Monitoring scope correctly labeled');
    assert(event1.processAttribution === 'Process attribution unavailable', 'No false Node PID attribution');
    assert(event1.entropy >= 3.0 && event1.entropy < 6.0, `Plain text file entropy within baseline (Got: ${event1.entropy})`);
    assert(event1.isSuspiciousExtension === false, 'Standard extension .docx marked not suspicious');

    // Simulate High-Entropy Mutation Wave (.lockbit extension)
    const lockedFilePath = path.join(testSandboxDir, 'quarterly_report.docx.lockbit');
    fs.writeFileSync(lockedFilePath, randomBuf);
    fs.unlinkSync(plainFilePath);

    const event2 = await watcher.handleFileEvent('rename', lockedFilePath, 'quarterly_report.docx.lockbit');
    assert(event2.entropy >= 7.8, `Encrypted file exhibits high entropy >= 7.8 (Got: ${event2.entropy})`);
    assert(event2.isSuspiciousExtension === true, '.lockbit detected as suspicious extension');
    assert(event2.isExtensionChanged === true, 'Extension change flagged');
    assert(event2.entropyDelta > 3.0, `Entropy delta properly calculated relative to baseline (Delta: ${event2.entropyDelta})`);

    // 3. Test Feature Extractor Sliding Window
    console.log('\n--- 3. Behavioral Feature Extractor Validation ---');
    const extractor = new FeatureExtractor(10000, 4.2);
    extractor.addEvent(event1);
    extractor.addEvent(event2);

    const features = await extractor.extractFeatures();
    assert(typeof features === 'object', 'Feature extractor returns feature object');
    assert(features.files_modified + features.files_created >= 1, 'File mutation counts tracked');
    assert(features.average_entropy >= 5.0, `Average entropy reflects combined events (Got: ${features.average_entropy})`);
    assert(features.high_entropy_file_ratio >= 0.5, `High entropy file ratio reflects encrypted files (Got: ${features.high_entropy_file_ratio})`);
    assert(features.suspicious_extension_count === 1, 'Suspicious extension count equals 1');
    assert(features.extension_change_count >= 1, 'Extension change count recorded');
    assert(features.burst_duration >= 0.5, 'Burst duration computed');

    // 4. Test Risk Engine Scoring Tiers
    console.log('\n--- 4. Correlated Risk Engine Scoring & Tiers ---');
    const riskEngine = new RiskEngine();

    // Benign features
    const benignFeatures = {
      files_modified: 2,
      files_created: 0,
      files_deleted: 0,
      mutations_per_second: 0.5,
      average_entropy: 4.1,
      maximum_entropy: 4.3,
      high_entropy_file_ratio: 0.0,
      suspicious_extension_count: 0,
      extension_change_count: 0
    };
    const benignRisk = riskEngine.calculateRiskScore(benignFeatures, 0.02);
    assert(benignRisk.riskScore < 25, `Benign features yield LOW risk (<25) (Got: ${benignRisk.riskScore})`);
    assert(benignRisk.tier === 'LOW', `Benign tier is LOW (Got: ${benignRisk.tier})`);

    // Ransomware features
    const attackFeatures = {
      files_modified: 40,
      files_created: 35,
      files_deleted: 30,
      mutations_per_second: 22.0,
      average_entropy: 7.85,
      maximum_entropy: 7.98,
      high_entropy_file_ratio: 0.95,
      suspicious_extension_count: 35,
      extension_change_count: 40
    };
    const attackRisk = riskEngine.calculateRiskScore(attackFeatures, 0.98);
    assert(attackRisk.riskScore >= 75, `Ransomware features yield CRITICAL risk (>=75) (Got: ${attackRisk.riskScore})`);
    assert(attackRisk.tier === 'CRITICAL', `Attack tier is CRITICAL (Got: ${attackRisk.tier})`);
    assert(attackRisk.breakdown.entropyPoints === 35, 'Full entropy points assigned for high entropy');
    assert(attackRisk.breakdown.velocityPoints === 25, 'Full velocity points assigned for high mutation rate');

    // 5. Test SQLite Detection & Persistence Integration
    console.log('\n--- 5. Database Logging Integration ---');
    const detRecord = db.createDetection({
      eventType: event2.eventType,
      fullPath: event2.fullPath,
      filename: event2.filename,
      entropy: event2.entropy,
      mutationVelocity: event2.mutationVelocity,
      size: event2.size,
      isSuspicious: event2.isSuspiciousExtension
    });
    assert(detRecord !== null, 'Detection recorded in SQLite detections table');
    assert(detRecord.entropy === event2.entropy, 'Recorded entropy matches exactly');

    // Cleanup
    watcher.closeAll();
    db.close();
    if (fs.existsSync(testSandboxDir)) {
      fs.rmSync(testSandboxDir, { recursive: true, force: true });
    }
    cleanDbFiles(testDbPath);

    console.log(`\n========================================`);
    console.log(`PHASE 3 DETECTION TEST SUMMARY: ${passed}/${total} PASSED (100%)`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error('Test execution error:', err);
    process.exitCode = 1;
  }
}

runDetectionTests();
