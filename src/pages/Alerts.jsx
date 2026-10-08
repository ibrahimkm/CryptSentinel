import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer.jsx';
import { AlertItem } from '../components/security/AlertItem.jsx';
import { useSecurity } from '../context/SecurityContext.jsx';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';

export function Alerts() {
  const { alerts, setAlerts } = useSecurity();
  const [filter, setFilter] = useState('ALL');

  const handleAck = (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  };

  const handleDismiss = (id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleAckAll = () => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
  };

  const filtered = filter === 'ALL'
    ? alerts
    : filter === 'UNREAD'
    ? alerts.filter(a => !a.read)
    : alerts.filter(a => a.severity === filter);

  return (
    <PageContainer
      title="Alert Triage Stream & Telemetry Feed"
      subtitle="Real-time heuristic signal triage, event correlation, and operational notification rules."
      breadcrumbs={['Root', 'SecOps', 'Alerts']}
      actions={
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleAckAll} className="btn-cyber-ghost" style={{ padding: '4px 10px', fontSize: '0.7rem' }}>
            <CheckCheck size={13} />
            <span>ACKNOWLEDGE ALL</span>
          </button>
        </div>
      }
    >
      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        {['ALL', 'UNREAD', 'CRITICAL', 'HIGH', 'MEDIUM'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              padding: '4px 10px',
              borderRadius: '2px',
              backgroundColor: filter === f ? 'rgba(96, 165, 250, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              color: filter === f ? '#93c5fd' : 'var(--text-secondary)',
              border: filter === f ? '1px solid #3b82f6' : '1px solid var(--border-default)'
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Alert Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map(alert => (
          <AlertItem
            key={alert.id}
            alert={alert}
            onAck={handleAck}
            onDismiss={handleDismiss}
          />
        ))}

        {filtered.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
            NO ALERTS IN THIS QUEUE
          </div>
        )}
      </div>
    </PageContainer>
  );
}
