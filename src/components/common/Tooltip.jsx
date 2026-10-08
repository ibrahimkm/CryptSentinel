import React, { useState } from 'react';

export function Tooltip({ text, children, position = 'top' }) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && text && (
        <div style={{
          position: 'absolute',
          bottom: position === 'top' ? 'calc(100% + 6px)' : undefined,
          top: position === 'bottom' ? 'calc(100% + 6px)' : undefined,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#0a0d14',
          color: '#cbd5e1',
          border: '1px solid #2a3b5c',
          padding: '4px 8px',
          fontSize: '0.68rem',
          fontFamily: 'var(--font-mono)',
          borderRadius: '3px',
          whiteSpace: 'nowrap',
          zIndex: 10000,
          pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
        }}>
          {text}
        </div>
      )}
    </div>
  );
}
