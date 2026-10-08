import React from 'react';

export function RiskIndicator({ score = 0, max = 100, showLabel = true }) {
  const getFillColor = (val) => {
    if (val >= 80) return '#f87171';
    if (val >= 50) return '#fb923c';
    if (val >= 25) return '#fbbf24';
    return '#34d399';
  };

  const percentage = Math.min(100, Math.max(0, (score / max) * 100));
  const color = getFillColor(score);

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        width: '45px',
        height: '4px',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: '2px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: '2px'
        }} />
      </div>
      {showLabel && (
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          fontWeight: 600,
          color
        }}>
          {score}
        </span>
      )}
    </div>
  );
}
