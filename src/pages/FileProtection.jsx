import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/layout/PageContainer.jsx';
import { FileEventTable } from '../components/security/FileEventTable.jsx';
import { fileService } from '../services/fileService.js';
import { ShieldCheck, ShieldAlert, FileText, Lock, RefreshCw, Trash2, Undo } from 'lucide-react';
import { LoadingState } from '../components/common/LoadingState.jsx';

export function FileProtection() {
  const [stats, setStats] = useState(null);
  const [quarantined, setQuarantined] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [s, q] = await Promise.all([
          fileService.getFileProtectionStats(),
          fileService.getQuarantinedFiles()
        ]);
        setStats(s);
        setQuarantined(q);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleRestore = async (id) => {
    await fileService.restoreFile(id);
    setQuarantined(prev => prev.filter(item => item.id !== id));
  };

  if (isLoading || !stats) {
    return <LoadingState message="INSPECTING FILE SYSTEM KERNEL HOOKS..." />;
  }

  return (
    <PageContainer
      title="File System Protection & Entropy Watchdog"
      subtitle="Kernel-level file modification rate interception, canary tripwires, and autonomous ransomware file-lock prevention."
      breadcrumbs={['Root', 'Endpoint', 'File Protection']}
    >
      {/* Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div className="sentinel-card">
          <span className="heading-section">ENTROPY VELOCITY</span>
          <div style={{ fontSize: '2rem', fontFamily: 'var(--font-mono)', color: '#fb923c', fontWeight: 600, margin: '6px 0' }}>
            {stats.entropyRate}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            BASELINE: {stats.entropyBaseline} / TARGET BURST
          </span>
        </div>

        <div className="sentinel-card">
          <span className="heading-section">MUTATION RATE</span>
          <div style={{ fontSize: '2rem', fontFamily: 'var(--font-mono)', color: '#f87171', fontWeight: 600, margin: '6px 0' }}>
            {stats.mutationRatePerSec} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>ops/s</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#fca5a5', fontFamily: 'var(--font-mono)' }}>
            CRITICAL ENCRYPTION PATTERN
          </span>
        </div>

        <div className="sentinel-card">
          <span className="heading-section">CANARY STATUS</span>
          <div style={{ fontSize: '1.4rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-safe)', fontWeight: 600, margin: '10px 0' }}>
            {stats.canaryStatus}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {stats.tripwiresTripped} TRIPWIRES ENGAGED
          </span>
        </div>

        <div className="sentinel-card">
          <span className="heading-section">QUARANTINED ARTIFACTS</span>
          <div style={{ fontSize: '2rem', fontFamily: 'var(--font-mono)', color: '#93c5fd', fontWeight: 600, margin: '6px 0' }}>
            {quarantined.length}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            ISOLATED IN SECURE VAULT
          </span>
        </div>
      </div>

      {/* Main Grid: File Events Table & Quarantined Items */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px', minHeight: '400px' }}>
        <FileEventTable events={stats.recentMutations} />

        {/* Quarantined Files Vault */}
        <div className="sentinel-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="sentinel-card-header">
            <span className="heading-section">QUARANTINED ARTIFACTS</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {quarantined.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '3px',
                  padding: '10px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--text-bright)', fontWeight: 600 }}>
                    {item.filename}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {item.path} ({item.size})
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => handleRestore(item.id)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: 'rgba(96, 165, 250, 0.1)',
                      border: '1px solid rgba(96, 165, 250, 0.3)',
                      color: '#93c5fd',
                      fontSize: '0.68rem',
                      fontFamily: 'var(--font-mono)',
                      borderRadius: '2px'
                    }}
                    title="Restore File"
                  >
                    <Undo size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
