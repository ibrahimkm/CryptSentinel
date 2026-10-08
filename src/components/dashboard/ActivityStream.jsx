import React, { useState } from 'react';
import { Circle, Filter } from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext.jsx';

export function ActivityStream({ logs = [], maxHeight = '360px' }) {
  const { isWsConnected } = useSecurity();
  const [filter, setFilter] = useState('ALL');

  const filteredLogs = filter === 'ALL'
    ? logs
    : logs.filter(l => l.level === filter);

  return (
    <div className="sentinel-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="sentinel-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--accent-blue)' }}>▤</span>
          <span className="heading-section">RAW TELEMETRY STREAM</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.68rem',
            color: isWsConnected ? '#60a5fa' : 'var(--text-muted)'
          }}>
            <Circle size={6} fill={isWsConnected ? '#60a5fa' : 'transparent'} color={isWsConnected ? '#60a5fa' : 'var(--text-muted)'} />
            <span>{isWsConnected ? 'LIVE' : 'DISCONNECTED'}</span>
          </div>
          <button
            onClick={() => setFilter(f => f === 'ALL' ? 'WARN' : f === 'WARN' ? 'INFO' : 'ALL')}
            style={{
              color: filter !== 'ALL' ? '#60a5fa' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.68rem',
              fontFamily: 'var(--font-mono)',
              padding: '2px 6px',
              border: '1px solid var(--border-default)',
              borderRadius: '2px'
            }}
          >
            <Filter size={11} />
            <span>{filter}</span>
          </button>
        </div>
      </div>

      <div style={{
        flex: 1,
        maxHeight,
        overflowY: 'auto',
        backgroundColor: '#06080d',
        border: '1px solid var(--border-subtle)',
        borderRadius: '3px',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.74rem'
      }}>
        {filteredLogs.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            minHeight: '180px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem'
          }}>
            No live telemetry available
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isWarn = log.level === 'WARN' || log.level === 'CRITICAL';
            const pidDisplay = log.pid !== null && log.pid !== undefined && log.pid !== 0 ? `[${log.pid}]` : '[SBOX]';
            return (
              <div
                key={log.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '110px 48px 65px 120px 1fr',
                  gap: '8px',
                  padding: '4px 8px',
                  borderRadius: '2px',
                  backgroundColor: isWarn ? 'rgba(251, 146, 60, 0.08)' : 'transparent',
                  borderLeft: isWarn ? '2px solid #fb923c' : '2px solid transparent',
                  color: isWarn ? '#fed7aa' : 'var(--text-secondary)',
                  alignItems: 'baseline'
                }}
              >
                <span style={{ color: isWarn ? '#fdba74' : 'var(--text-muted)' }}>{log.timestamp}</span>
                <span style={{
                  color: isWarn ? '#fb923c' : '#60a5fa',
                  fontWeight: 600
                }}>
                  {log.level}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>{pidDisplay}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{log.process || 'Sandbox'}</span>
                <span style={{
                  color: isWarn ? '#ffedd5' : 'var(--text-secondary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {log.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
