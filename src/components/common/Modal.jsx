import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children, maxWidth = '540px' }) {
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
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-md)',
        width: '100%',
        maxWidth,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8)',
        position: 'relative'
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
            fontSize: '0.85rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-bright)',
            fontFamily: 'var(--font-mono)'
          }}>
            {title}
          </h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: '18px', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
