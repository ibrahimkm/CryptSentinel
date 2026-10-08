import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingState({ message = 'SYNCHRONIZING TELEMETRY STREAM...' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '220px',
      gap: '12px',
      color: 'var(--text-secondary)'
    }}>
      <Loader2 size={24} className="animate-spin" style={{ color: 'var(--accent-blue)', animation: 'spin 1s linear infinite' }} />
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.75rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--text-secondary)'
      }}>
        {message}
      </span>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
