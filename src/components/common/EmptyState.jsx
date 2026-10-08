import React from 'react';
import { ShieldCheck } from 'lucide-react';

export function EmptyState({
  title = 'NO ACTIVE ANOMALIES DETECTED',
  description = 'Endpoint behavioral heuristics within nominal bounds. No pending alerts or containment actions.',
  icon: Icon = ShieldCheck
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
      border: '1px dashed var(--border-default)',
      borderRadius: 'var(--radius-md)',
      backgroundColor: 'rgba(14, 19, 32, 0.4)',
      gap: '8px'
    }}>
      <div style={{
        padding: '12px',
        borderRadius: '50%',
        backgroundColor: 'rgba(52, 211, 153, 0.1)',
        color: 'var(--accent-safe)',
        marginBottom: '6px'
      }}>
        <Icon size={28} />
      </div>
      <h4 style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.8rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--text-primary)'
      }}>
        {title}
      </h4>
      <p style={{
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        maxWidth: '400px',
        lineHeight: 1.5
      }}>
        {description}
      </p>
    </div>
  );
}
