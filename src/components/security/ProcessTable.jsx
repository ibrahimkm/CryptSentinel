import React, { useState } from 'react';
import { Search, Eye } from 'lucide-react';

export function ProcessTable({
  processes = [],
  selectedPid = null,
  onSelectProcess
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = processes.filter((proc) => {
    const q = searchTerm.toLowerCase();
    return proc.name.toLowerCase().includes(q) || String(proc.pid).includes(q);
  });

  return (
    <div className="sentinel-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Table Toolbar Header */}
      <div className="sentinel-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Eye size={16} style={{ color: 'var(--text-secondary)' }} />
          <span className="heading-section">Active Processes</span>
        </div>

        <div style={{ position: 'relative', width: '180px' }}>
          <Search size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Filter PID/Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-default)',
              borderRadius: '3px',
              padding: '4px 8px 4px 26px',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Table Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table className="sentinel-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>STATUS</th>
              <th style={{ width: '65px' }}>PID</th>
              <th>PROCESS NAME</th>
              <th style={{ width: '70px', textAlign: 'right' }}>CPU %</th>
              <th style={{ width: '85px', textAlign: 'center' }}>RISK SCORE</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((proc) => {
              const isSelected = selectedPid === proc.pid;
              const isCritical = proc.riskScore >= 80;
              const isElevated = proc.riskScore >= 30 && proc.riskScore < 80;

              return (
                <tr
                  key={proc.pid}
                  className={isSelected ? 'selected' : ''}
                  onClick={() => onSelectProcess && onSelectProcess(proc)}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: isSelected ? 'rgba(30, 42, 66, 0.7)' : 'transparent'
                  }}
                >
                  <td>
                    <span style={{
                      display: 'inline-block',
                      width: '7px',
                      height: '7px',
                      borderRadius: '1px',
                      backgroundColor: isCritical ? '#f87171' : isElevated ? '#fb923c' : '#60a5fa'
                    }} />
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{proc.pid}</td>
                  <td style={{
                    color: isCritical ? '#fca5a5' : 'var(--text-bright)',
                    fontWeight: isCritical ? 600 : 400
                  }}>
                    {proc.name}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                    {proc.cpu.toFixed(1)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {proc.riskScore > 0 ? (
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '2px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        backgroundColor: isCritical ? 'rgba(248, 113, 113, 0.15)' : isElevated ? 'rgba(251, 146, 60, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                        color: isCritical ? '#f87171' : isElevated ? '#fb923c' : 'var(--text-secondary)',
                        border: isCritical ? '1px solid rgba(248, 113, 113, 0.4)' : isElevated ? '1px solid rgba(251, 146, 60, 0.3)' : '1px solid var(--border-default)'
                      }}>
                        {String(proc.riskScore).padStart(2, '0')}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>--</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
