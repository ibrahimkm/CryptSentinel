import React from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';

export function AlertItem({ alert, onAck, onDismiss }) {
  const isCritical = alert.severity === 'CRITICAL';
  const isHigh = alert.severity === 'HIGH';

  return (
    <div
      style={{
        backgroundColor: alert.read ? 'rgba(255, 255, 255, 0.01)' : 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border-default)',
        borderLeft: isCritical ? '3px solid var(--accent-critical)' : isHigh ? '3px solid var(--accent-danger)' : '3px solid var(--accent-warning)',
        borderRadius: 'var(--radius-sm)',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.68rem',
            fontWeight: 700,
            color: isCritical ? 'var(--accent-critical)' : isHigh ? 'var(--accent-danger)' : 'var(--accent-warning)'
          }}>
            {alert.severity}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            {alert.time}
          </span>
        </div>
        <p style={{
          fontSize: '0.8rem',
          color: alert.read ? 'var(--text-secondary)' : 'var(--text-bright)',
          fontWeight: alert.read ? 400 : 500
        }}>
          {alert.title}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '6px' }}>
        {!alert.read && (
          <button
            onClick={() => onAck && onAck(alert.id)}
            style={{
              padding: '6px',
              color: 'var(--accent-blue)',
              border: '1px solid var(--border-default)',
              borderRadius: '2px',
              backgroundColor: 'rgba(96, 165, 250, 0.05)'
            }}
            title="Acknowledge Alert"
          >
            <Check size={13} />
          </button>
        )}
        <button
          onClick={() => onDismiss && onDismiss(alert.id)}
          style={{
            padding: '6px',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-default)',
            borderRadius: '2px'
          }}
          title="Dismiss Alert"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
