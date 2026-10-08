import React from 'react';

export function ThreatTimeline({
  status = 'CONVERSING TOWARD RANSOMWARE',
  currentScore = 0.86
}) {
  return (
    <div className="sentinel-card sentinel-dense-grid" style={{ flex: 1, minHeight: '440px', display: 'flex', flexDirection: 'column' }}>
      <div className="sentinel-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#93c5fd', fontSize: '0.9rem' }}>📈</span>
          <span className="heading-section">Threat Trajectory</span>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.68rem',
          color: '#fb923c',
          backgroundColor: 'rgba(251, 146, 60, 0.1)',
          border: '1px solid rgba(251, 146, 60, 0.3)',
          padding: '2px 8px',
          borderRadius: '2px'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#fb923c' }} />
          <span>{status}</span>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <svg viewBox="0 0 700 400" style={{ width: '100%', height: '100%' }}>
          {/* Y Level Guidelines & Labels */}
          <g>
            <text x="30" y="80" fill="#64748b" fontFamily="var(--font-mono)" fontSize="10">CRITICAL</text>
            <line x1="30" y1="85" x2="670" y2="85" stroke="rgba(30, 42, 66, 0.6)" strokeDasharray="3 3" />

            <text x="30" y="160" fill="#64748b" fontFamily="var(--font-mono)" fontSize="10">HIGH RISK</text>
            <line x1="30" y1="165" x2="670" y2="165" stroke="rgba(30, 42, 66, 0.6)" strokeDasharray="3 3" />

            <text x="30" y="240" fill="#64748b" fontFamily="var(--font-mono)" fontSize="10">SUSPICIOUS</text>
            <line x1="30" y1="245" x2="670" y2="245" stroke="rgba(30, 42, 66, 0.6)" strokeDasharray="3 3" />

            <text x="30" y="320" fill="#64748b" fontFamily="var(--font-mono)" fontSize="10">NORMAL</text>
            <line x1="30" y1="325" x2="670" y2="325" stroke="rgba(30, 42, 66, 0.6)" strokeDasharray="3 3" />
          </g>

          {/* X Axis Time Labels */}
          <g>
            <text x="120" y="355" fill="#64748b" fontFamily="var(--font-mono)" fontSize="10" textAnchor="middle">T-120M</text>
            <text x="240" y="355" fill="#64748b" fontFamily="var(--font-mono)" fontSize="10" textAnchor="middle">T-60M</text>
            <text x="360" y="355" fill="#64748b" fontFamily="var(--font-mono)" fontSize="10" textAnchor="middle">T-30M</text>
            <text x="480" y="355" fill="#93c5fd" fontFamily="var(--font-mono)" fontSize="10" textAnchor="middle" fontWeight="600">NOW</text>
            <text x="600" y="355" fill="#f87171" fontFamily="var(--font-mono)" fontSize="10" textAnchor="middle">PREDICTED</text>
          </g>

          {/* Actual Historical Curve */}
          <path
            d="M 120 320 Q 240 310 320 270 T 480 145"
            fill="none"
            stroke="#93c5fd"
            strokeWidth="2.5"
          />

          {/* Future Projected Dashed Curve */}
          <path
            d="M 480 145 Q 540 100 600 75"
            fill="none"
            stroke="#f87171"
            strokeWidth="2"
            strokeDasharray="4 4"
          />

          {/* Current State Marker at NOW (480, 145) */}
          <circle cx="480" cy="145" r="7" fill="none" stroke="#60a5fa" strokeWidth="2" />
          <circle cx="480" cy="145" r="3" fill="#60a5fa" />

          {/* Callout box for Current State */}
          <g transform="translate(492, 130)">
            <rect x="0" y="0" width="105" height="24" fill="#0c101a" stroke="#2a3b5c" rx="2" />
            <text x="6" y="11" fill="#94a3b8" fontFamily="var(--font-mono)" fontSize="8">CURRENT STATE</text>
            <text x="6" y="20" fill="#93c5fd" fontFamily="var(--font-mono)" fontSize="8" fontWeight="bold">RISK_SCORE: {currentScore.toFixed(2)}</text>
          </g>

          {/* Projected Target Node at PREDICTED (600, 75) */}
          <g transform="translate(565, 62)">
            <rect x="0" y="0" width="70" height="22" fill="#1b1218" stroke="#f87171" rx="2" />
            <text x="35" y="14" fill="#f87171" fontFamily="var(--font-mono)" fontSize="8" fontWeight="bold" textAnchor="middle">ENCRYPTION</text>
          </g>
        </svg>
      </div>
    </div>
  );
}
