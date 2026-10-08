import React from 'react';
import { AlertTriangle, MapPin, X, ShieldAlert, ArrowRight } from 'lucide-react';

export function ThreatAlertNotification({ threat, onInspect, onLocate, onDismiss }) {
  if (!threat) return null;

  const handleAction = onLocate || onInspect;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        maxWidth: '480px',
        width: 'calc(100vw - 48px)',
        backgroundColor: '#130d14',
        border: '1.5px solid #f87171',
        borderRadius: '6px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(248, 113, 113, 0.4)',
        padding: '16px',
        animation: 'pulseThreat 2s infinite ease-in-out'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            padding: '8px',
            borderRadius: '4px',
            backgroundColor: 'rgba(248, 113, 113, 0.2)',
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.66rem',
                fontWeight: 700,
                color: '#fff',
                backgroundColor: '#dc2626',
                padding: '2px 6px',
                borderRadius: '2px',
                letterSpacing: '0.08em'
              }}>
                RANSOMWARE PATTERN MATCHED
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {new Date(threat.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <h4 style={{
              fontSize: '0.92rem',
              fontWeight: 700,
              color: '#fca5a5',
              marginTop: '4px',
              fontFamily: 'var(--font-sans)'
            }}>
              {threat.matchedFamily}
            </h4>
          </div>
        </div>

        <button
          onClick={onDismiss}
          style={{ color: 'var(--text-muted)', padding: '2px' }}
          aria-label="Dismiss Alert"
        >
          <X size={16} />
        </button>
      </div>

      <div style={{
        margin: '12px 0',
        padding: '8px 10px',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: '3px',
        border: '1px solid rgba(248, 113, 113, 0.25)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.72rem',
        color: '#fecdd3'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', color: '#fda4af' }}>
          <MapPin size={12} />
          <span style={{ fontWeight: 600 }}>MODIFICATION LOCATOR:</span>
        </div>
        <div style={{ color: '#fff', wordBreak: 'break-all', fontSize: '0.7rem' }}>
          {threat.location?.modifiedFilePath || threat.location?.targetFilename}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.66rem', color: 'var(--text-muted)' }}>
          <span>PROCESS: {threat.location?.processName} (PID: {threat.location?.processPid})</span>
          <span style={{ color: '#fb923c', fontWeight: 600 }}>ENTROPY: {threat.location?.entropy}</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <button
          onClick={handleAction}
          className="btn-cyber-danger"
          style={{ padding: '6px 14px', fontSize: '0.72rem', width: '100%' }}
        >
          <ShieldAlert size={14} />
          <span>LOCATE & ISOLATE MODIFICATION</span>
          <ArrowRight size={13} />
        </button>
      </div>

      <style>{`
        @keyframes pulseThreat {
          0%, 100% { box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8), 0 0 15px rgba(248, 113, 113, 0.3); }
          50% { box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8), 0 0 30px rgba(248, 113, 113, 0.6); }
        }
      `}</style>
    </div>
  );
}
