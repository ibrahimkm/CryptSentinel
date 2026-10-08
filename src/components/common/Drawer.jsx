import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Drawer({ isOpen, onClose, title, children, width = '420px', position = 'right' }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(3px)',
      zIndex: 9000,
      display: 'flex',
      justifyContent: position === 'right' ? 'flex-end' : 'flex-start'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderLeft: position === 'right' ? '1px solid var(--border-medium)' : 'none',
        borderRight: position === 'left' ? '1px solid var(--border-medium)' : 'none',
        width: '100%',
        maxWidth: width,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-8px 0 30px rgba(0, 0, 0, 0.7)',
        overflow: 'hidden'
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: '1px solid var(--border-default)',
          background: 'var(--bg-topbar)'
        }}>
          <h3 style={{
            fontSize: '0.82rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-bright)',
            fontFamily: 'var(--font-mono)'
          }}>
            {title}
          </h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '4px' }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
