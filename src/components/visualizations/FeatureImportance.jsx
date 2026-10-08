import React from 'react';

export function FeatureImportance({ attributions = [] }) {
  const defaultAttributions = [
    { name: 'FILE_MOD_RATE_BURST', weight: 0.45, impact: '+42%', color: '#f87171' },
    { name: 'DISK_WRITE_IOPS_ANOMALY', weight: 0.30, impact: '+21%', color: '#fb923c' },
    { name: 'FILE_ENTROPY_SPIKE', weight: 0.15, impact: '+8%', color: '#60a5fa' },
    { name: 'SHADOW_COPY_DELETE_ATTEMPT', weight: 0.10, impact: '+3%', color: '#818cf8' }
  ];

  const list = attributions.length > 0 ? attributions : defaultAttributions;

  return (
    <div className="sentinel-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="sentinel-card-header">
        <span className="heading-section">ATTRIBUTION BREAKDOWN</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
        {list.map((item) => (
          <div
            key={item.name}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-default)',
              borderRadius: '3px',
              padding: '12px 14px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  color: 'var(--text-bright)',
                  letterSpacing: '0.04em'
                }}>
                  {item.name}
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.66rem',
                  color: 'var(--text-muted)',
                  marginTop: '2px'
                }}>
                  Weight: {item.weight.toFixed(2)}
                </div>
              </div>

              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.92rem',
                fontWeight: 700,
                color: item.color || '#f87171'
              }}>
                {item.impact}
              </div>
            </div>

            {/* Progress bar */}
            <div style={{
              height: '4px',
              width: '100%',
              backgroundColor: '#121826',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: item.impact.replace('+', ''),
                backgroundColor: item.color || '#f87171',
                borderRadius: '2px'
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
