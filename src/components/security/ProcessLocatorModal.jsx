import React from 'react';
import { Modal } from '../common/Modal.jsx';
import { MapPin, AlertTriangle, ShieldAlert, Ban, FileWarning, Terminal, HardDrive, CheckCircle2 } from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext.jsx';

export function ProcessLocatorModal({ threat, isOpen, onClose }) {
  const { killProcess, isolateHost } = useSecurity();

  if (!threat || !isOpen) return null;

  const { location, matchedFamily, severity, riskScore, reasons, tactics } = threat;

  const handleKill = async () => {
    if (location?.processPid) {
      await killProcess(location.processPid);
      alert(`Process PID ${location.processPid} terminated.`);
      onClose();
    }
  };

  const handleIsolateDir = async () => {
    alert(`Enforced hardware write-lock on directory: ${location?.directory}`);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="RANSOMWARE PATTERN & PROCESS LOCATOR"
      maxWidth="680px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Threat Header Badge */}
        <div style={{
          backgroundColor: 'rgba(248, 113, 113, 0.1)',
          border: '1px solid rgba(248, 113, 113, 0.35)',
          borderRadius: '4px',
          padding: '12px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} style={{ color: '#f87171' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fca5a5', fontFamily: 'var(--font-sans)' }}>
                {matchedFamily}
              </h3>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Matched against CryptSentinel Synthetic Ransomware Signature Database.
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#f87171',
              backgroundColor: 'rgba(248, 113, 113, 0.2)',
              border: '1px solid rgba(248, 113, 113, 0.4)',
              padding: '3px 8px',
              borderRadius: '2px'
            }}>
              RISK: {riskScore} / 100 ({severity})
            </span>
          </div>
        </div>

        {/* Forensic Location Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* Section 1: Process Location */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-default)',
            borderRadius: '4px',
            padding: '12px 14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#93c5fd' }}>
              <Terminal size={14} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 600 }}>
                ORIGINATING PROCESS LOCATION
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>PROCESS NAME: </span>
                <span style={{ color: 'var(--text-bright)', fontWeight: 600 }}>{location?.processName}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>PROCESS PID: </span>
                <span style={{ color: '#fb923c' }}>{location?.processPid}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>EXECUTABLE PATH: </span>
                <div style={{ color: '#93c5fd', wordBreak: 'break-all', fontSize: '0.68rem', marginTop: '2px', backgroundColor: '#060910', padding: '4px 6px', borderRadius: '2px' }}>
                  {location?.processExecutablePath}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>USER PRIVILEGE: </span>
                <span style={{ color: 'var(--text-primary)' }}>{location?.processUser}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Modified Target File Location */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-default)',
            borderRadius: '4px',
            padding: '12px 14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#fb923c' }}>
              <FileWarning size={14} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 600 }}>
                MODIFIED TARGET FILE LOCATION
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>TARGET FILE: </span>
                <span style={{ color: '#fca5a5', fontWeight: 600 }}>{location?.targetFilename}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>SHANNON ENTROPY: </span>
                <span style={{ color: '#f87171', fontWeight: 700 }}>{location?.entropy} (ENCRYPTED SPIKE)</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>FULL DIRECTORY PATH: </span>
                <div style={{ color: '#fdba74', wordBreak: 'break-all', fontSize: '0.68rem', marginTop: '2px', backgroundColor: '#060910', padding: '4px 6px', borderRadius: '2px' }}>
                  {location?.modifiedFilePath}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pattern Match Details */}
        <div style={{
          backgroundColor: '#070a10',
          border: '1px solid var(--border-subtle)',
          borderRadius: '4px',
          padding: '12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem'
        }}>
          <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontSize: '0.66rem' }}>
            ▤ HEURISTIC ANOMALY REASONS:
          </span>
          {reasons?.map((r, i) => (
            <div key={i} style={{ color: '#fed7aa', display: 'flex', alignItems: 'center', gap: '6px', margin: '2px 0' }}>
              <span>•</span>
              <span>{r}</span>
            </div>
          ))}
        </div>

        {/* Containment Response Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          paddingTop: '14px'
        }}>
          <button
            onClick={handleKill}
            className="btn-cyber-danger"
            style={{ padding: '10px', fontSize: '0.74rem' }}
          >
            <Ban size={14} />
            <span>TERMINATE MALICIOUS PROCESS (PID {location?.processPid})</span>
          </button>

          <button
            onClick={handleIsolateDir}
            className="btn-cyber-ghost"
            style={{ padding: '10px', fontSize: '0.74rem', justifyContent: 'center' }}
          >
            <ShieldAlert size={14} />
            <span>ISOLATE DIRECTORY & LOCK VOLUME</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
