import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/layout/PageContainer.jsx';
import { analyticsService } from '../services/analyticsService.js';
import { History, Download, ShieldCheck, Filter } from 'lucide-react';
import { LoadingState } from '../components/common/LoadingState.jsx';
import { ThreatBadge } from '../components/security/ThreatBadge.jsx';

export function ThreatHistory() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await analyticsService.getThreatHistory();
        setHistory(res);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleExport = () => {
    const jsonStr = JSON.stringify(history, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cryptsentinel-threat-history-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <LoadingState message="RETRIEVING HISTORICAL THREAT RECORDS..." />;

  return (
    <PageContainer
      title="Historical Threat Ledger & Resolution Audit"
      subtitle="Complete immutable log of all neutralized ransomware vectors, containment latency, and remediation outcomes."
      breadcrumbs={['Root', 'Analytics', 'Threat History']}
      actions={
        <button onClick={handleExport} className="btn-cyber-primary" style={{ padding: '6px 12px' }}>
          <Download size={13} />
          <span>EXPORT FORENSIC LEDGER</span>
        </button>
      }
    >
      <div className="sentinel-card">
        <div className="sentinel-card-header">
          <span className="heading-section">Historical Intercept Records</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            SHOWING LATEST {history.length} ENTRIES
          </span>
        </div>

        <table className="sentinel-table">
          <thead>
            <tr>
              <th>INCIDENT ID</th>
              <th>TIMESTAMP (UTC)</th>
              <th>VECTOR VARIANT</th>
              <th>TARGET ENDPOINT</th>
              <th style={{ textAlign: 'center' }}>RISK</th>
              <th>STATUS</th>
              <th style={{ textAlign: 'right' }}>TIME TO BLOCK</th>
            </tr>
          </thead>
          <tbody>
            {history.map((row) => (
              <tr key={row.id}>
                <td style={{ color: '#93c5fd', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{row.id}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{row.timestamp}</td>
                <td style={{ color: 'var(--text-bright)', fontWeight: 500 }}>{row.vector}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{row.target}</td>
                <td style={{ textAlign: 'center' }}>
                  <ThreatBadge score={row.risk} />
                </td>
                <td>
                  <span style={{
                    backgroundColor: 'rgba(52, 211, 153, 0.12)',
                    color: 'var(--accent-safe)',
                    border: '1px solid rgba(52, 211, 153, 0.3)',
                    padding: '2px 6px',
                    borderRadius: '2px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem'
                  }}>
                    {row.action}
                  </span>
                </td>
                <td style={{ textAlign: 'right', color: '#60a5fa', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {row.timeToBlock}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
}
