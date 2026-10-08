import React from 'react';

export function SystemStatus({
  horizon = '18-42s',
  description = 'Estimated time to threshold breach based on current vector velocity.',
  vector = 'MEM_INJECT',
  confidence = 'HI'
}) {
  return (
    <div className="sentinel-card" style={{ flex: '0 0 340px', minWidth: '280px' }}>
      <div className="sentinel-card-header">
        <span className="heading-section">ESCALATION HORIZON</span>
        <div style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          backgroundColor: '#fb923c',
          boxShadow: '0 0 8px #fb923c'
        }} />
      </div>

      <div style={{ margin: '14px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{
            fontSize: '3rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 400,
            color: 'var(--text-bright)',
            lineHeight: 1
          }}>
            {horizon.replace(/[^0-9-]/g, '')}
          </span>
          <span style={{
            fontSize: '1.4rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)'
          }}>
            s
          </span>
        </div>
        <p style={{
          fontSize: '0.74rem',
          color: 'var(--text-secondary)',
          marginTop: '8px',
          lineHeight: 1.4
        }}>
          {description}
        </p>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.04)',
        paddingTop: '12px'
      }}>
        <span style={{
          backgroundColor: 'rgba(251, 146, 60, 0.12)',
          color: '#fb923c',
          border: '1px solid rgba(251, 146, 60, 0.3)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.68rem',
          fontWeight: 600,
          padding: '3px 8px',
          borderRadius: '2px',
          letterSpacing: '0.05em'
        }}>
          VECTOR: {vector}
        </span>
        <span style={{
          backgroundColor: 'rgba(96, 165, 250, 0.12)',
          color: '#93c5fd',
          border: '1px solid rgba(96, 165, 250, 0.3)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.68rem',
          fontWeight: 600,
          padding: '3px 8px',
          borderRadius: '2px',
          letterSpacing: '0.05em'
        }}>
          CONFIDENCE: {confidence}
        </span>
      </div>
    </div>
  );
}
