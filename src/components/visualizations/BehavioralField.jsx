import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext.jsx';

export function BehavioralField({
  entropyRate = '7.994',
  baseEntropy = '4.2',
  entropyChange = '+89%',
  diskWriteRate = '450 MB/s',
  diskTarget = 'C:\\Users\\*',
  diskChange = '+428%',
  processes = [
    { name: 'vssadmin.exe', status: 'EXEC' },
    { name: 'powershell.exe', status: 'ENCODED' }
  ]
}) {
  const { triggerContainment } = useSecurity();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', maxWidth: '380px' }}>
      <div className="sentinel-card">
        <div className="sentinel-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#fb923c', fontSize: '0.9rem' }}>📊</span>
            <span className="heading-section">Live Telemetry</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* File Entropy Rate Card */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-default)',
            borderRadius: '3px',
            padding: '12px 14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                FILE ENTROPY RATE
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: '#fb923c', fontWeight: 600 }}>
                SPIKING
              </span>
            </div>

            <div style={{
              fontSize: '2rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-bright)',
              fontWeight: 400,
              margin: '4px 0'
            }}>
              {entropyRate}
            </div>

            {/* Progress bar */}
            <div style={{ height: '3px', width: '100%', backgroundColor: '#182236', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '92%', backgroundColor: '#fb923c' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--text-muted)' }}>
              <span>BASE: {baseEntropy}</span>
              <span style={{ color: '#fb923c' }}>▲ {entropyChange}</span>
            </div>
          </div>

          {/* Abnormal Disk Write Card */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-default)',
            borderRadius: '3px',
            padding: '12px 14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                ABNORMAL DISK WRITE
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: '#f87171', fontWeight: 600 }}>
                CRITICAL
              </span>
            </div>

            <div style={{
              fontSize: '2rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-bright)',
              fontWeight: 400,
              margin: '4px 0'
            }}>
              {diskWriteRate}
            </div>

            {/* Progress bar */}
            <div style={{ height: '3px', width: '100%', backgroundColor: '#182236', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '88%', backgroundColor: '#f87171' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--text-muted)' }}>
              <span>TARGET: {diskTarget}</span>
              <span style={{ color: '#f87171' }}>▲ {diskChange}</span>
            </div>
          </div>

          {/* Process Behavior Card */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-default)',
            borderRadius: '3px',
            padding: '12px 14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                PROCESS BEHAVIOR
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: '#93c5fd' }}>
                MONITORING
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {processes.map((proc) => (
                <div
                  key={proc.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.74rem'
                  }}
                >
                  <span style={{ color: 'var(--text-bright)' }}>{proc.name}</span>
                  <span style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-default)',
                    padding: '2px 8px',
                    borderRadius: '2px',
                    color: 'var(--text-secondary)',
                    fontSize: '0.68rem'
                  }}>
                    {proc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Containment Button matching Screenshot 4 */}
      <button
        onClick={triggerContainment}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: 'rgba(248, 113, 113, 0.06)',
          border: '1px solid rgba(248, 113, 113, 0.4)',
          borderRadius: '3px',
          color: '#fca5a5',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.78rem',
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        <ShieldAlert size={16} />
        <span>INITIATE CONTAINMENT</span>
      </button>
    </div>
  );
}
