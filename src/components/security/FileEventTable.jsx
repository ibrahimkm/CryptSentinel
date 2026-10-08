import React from 'react';
import { FileWarning, ShieldAlert } from 'lucide-react';

export function FileEventTable({ events = [] }) {
  return (
    <div className="sentinel-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="sentinel-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileWarning size={16} style={{ color: '#fb923c' }} />
          <span className="heading-section">HIGH-ENTROPY FILE MUTATIONS</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table className="sentinel-table">
          <thead>
            <tr>
              <th>FILE TARGET PATH</th>
              <th style={{ width: '80px', textAlign: 'center' }}>ENTROPY</th>
              <th style={{ width: '65px' }}>PID</th>
              <th style={{ width: '90px', textAlign: 'right' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {events.map((evt, idx) => (
              <tr key={idx}>
                <td style={{ color: '#fca5a5', fontFamily: 'var(--font-mono)' }}>
                  {evt.path}
                </td>
                <td style={{ textAlign: 'center', color: '#fb923c', fontWeight: 600 }}>
                  {evt.entropy}
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>
                  {evt.pid}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span style={{
                    backgroundColor: evt.action === 'BLOCKED' ? 'rgba(248, 113, 113, 0.15)' : 'rgba(251, 146, 60, 0.15)',
                    color: evt.action === 'BLOCKED' ? '#f87171' : '#fb923c',
                    border: '1px solid rgba(248, 113, 113, 0.3)',
                    padding: '2px 6px',
                    borderRadius: '2px',
                    fontSize: '0.66rem',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {evt.action}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
