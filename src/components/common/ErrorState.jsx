import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button.jsx';

export function ErrorState({
  title = 'TELEMETRY CONNECTION ANOMALY',
  message = 'Unable to establish secure telemetry channel with endpoint sensors.',
  onRetry
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
      border: '1px solid rgba(248, 113, 113, 0.3)',
      borderRadius: 'var(--radius-md)',
      backgroundColor: 'rgba(248, 113, 113, 0.05)',
      gap: '10px'
    }}>
      <div style={{
        padding: '12px',
        borderRadius: '50%',
        backgroundColor: 'rgba(248, 113, 113, 0.15)',
        color: 'var(--accent-danger)'
      }}>
        <AlertTriangle size={28} />
      </div>
      <h4 style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.82rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--accent-danger)'
      }}>
        {title}
      </h4>
      <p style={{
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
        maxWidth: '440px',
        lineHeight: 1.5
      }}>
        {message}
      </p>
      {onRetry && (
        <Button variant="danger" size="sm" icon={RefreshCw} onClick={onRetry} className="mt-2">
          RETRY CONNECTION
        </Button>
      )}
    </div>
  );
}
