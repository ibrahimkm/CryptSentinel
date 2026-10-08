import React from 'react';
import { Shield } from 'lucide-react';
import { formatPercent } from '../../utils/formatters.js';

export function ThreatScore({
  status = 'PROTECTED',
  probability = 12.04,
  behavioralScore = 0.12
}) {
  const getStatusColor = () => {
    switch (status) {
      case 'CRITICAL': return { text: '#fb7185', glow: 'rgba(251, 113, 133, 0.3)' };
      case 'ELEVATED': return { text: '#fbbf24', glow: 'rgba(251, 191, 36, 0.3)' };
      case 'PROTECTED':
      default:
        return { text: '#60a5fa', glow: 'rgba(96, 165, 250, 0.25)' };
    }
  };

  const statusColor = getStatusColor();

  return (
    <div className="sentinel-card" style={{ flex: 1, minWidth: '320px' }}>
      <div className="sentinel-card-header">
        <span className="heading-section">CURRENT SYSTEM POSTURE</span>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            AGGREGATE PROBABILITY
          </span>
          <div style={{
            fontSize: '1.3rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: '#fb923c',
            lineHeight: 1
          }}>
            {formatPercent(probability)}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '14px 0 24px 0' }}>
        <div style={{
          width: '54px',
          height: '54px',
          borderRadius: '6px',
          border: `1.5px solid ${statusColor.text}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: statusColor.text,
          boxShadow: `0 0 20px ${statusColor.glow}`
        }}>
          <Shield size={32} />
        </div>
        <div style={{
          fontSize: '3.2rem',
          fontWeight: 300,
          letterSpacing: '-0.03em',
          color: statusColor.text,
          fontFamily: 'var(--font-sans)',
          lineHeight: 1
        }}>
          {status}
        </div>
      </div>

      {/* Behavioral Trajectory Slider Track */}
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '6px',
          fontSize: '0.68rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-secondary)'
        }}>
          <span className="tracking-wider-technical">BEHAVIORAL TRAJECTORY</span>
        </div>

        <div style={{
          height: '6px',
          width: '100%',
          backgroundColor: '#121927',
          borderRadius: '3px',
          position: 'relative',
          border: '1px solid #1c2638'
        }}>
          {/* Active fill indicator */}
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${Math.min(100, Math.max(0, behavioralScore * 100))}%`,
            background: 'linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)',
            borderRadius: '3px'
          }} />
          {/* Thumb marker */}
          <div style={{
            position: 'absolute',
            top: '-4px',
            left: `calc(${Math.min(100, Math.max(0, behavioralScore * 100))}% - 4px)`,
            width: '8px',
            height: '14px',
            backgroundColor: '#60a5fa',
            borderRadius: '2px',
            boxShadow: '0 0 8px #3b82f6'
          }} />
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '6px',
          fontSize: '0.66rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)'
        }}>
          <span>NORMAL (0.00)</span>
          <span>ELEVATED (0.30)</span>
          <span>CRITICAL (0.80)</span>
        </div>
      </div>
    </div>
  );
}
