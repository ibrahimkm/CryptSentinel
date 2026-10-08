import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/layout/PageContainer.jsx';
import { Search, FileCode, HardDrive, Terminal, ShieldCheck, Database, ShieldAlert } from 'lucide-react';
import { fileService } from '../services/fileService.js';
import { incidentService } from '../services/incidentService.js';

export function Investigation() {
  const [iocQuery, setIocQuery] = useState('');
  const [quarantinedFiles, setQuarantinedFiles] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadArtifacts() {
      setLoading(true);
      try {
        const [qItems, incList] = await Promise.all([
          fileService.getQuarantinedFiles(),
          incidentService.getIncidents('ALL')
        ]);
        setQuarantinedFiles(Array.isArray(qItems) ? qItems : []);
        setIncidents(Array.isArray(incList) ? incList : []);
      } catch (err) {
        console.warn('Failed to load investigation evidence:', err);
      } finally {
        setLoading(false);
      }
    }
    loadArtifacts();
  }, []);

  const forensicArtifacts = quarantinedFiles.map(q => ({
    type: 'QUARANTINE_VAULT',
    name: q.original_filename || q.originalFilename || 'suspicious_payload',
    path: q.original_path || q.originalPath,
    sha256: q.sha256,
    reason: q.reason || 'High entropy mutation detected',
    status: q.status || 'QUARANTINED',
    timestamp: q.timestamp ? new Date(q.timestamp).toLocaleTimeString() : 'Recent'
  }));

  const filteredArtifacts = iocQuery.trim()
    ? forensicArtifacts.filter(a =>
        a.name.toLowerCase().includes(iocQuery.toLowerCase()) ||
        a.sha256.toLowerCase().includes(iocQuery.toLowerCase()) ||
        a.reason.toLowerCase().includes(iocQuery.toLowerCase())
      )
    : forensicArtifacts;

  return (
    <PageContainer
      title="Forensic Deep Investigation & Artifact Analysis"
      subtitle="Quarantine artifact extraction, SHA-256 validation, and telemetry correlation for sandbox incidents."
      breadcrumbs={['Root', 'Investigation', 'Deep Forensic']}
    >
      {/* IOC Search Bar */}
      <div className="sentinel-card">
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={iocQuery}
              onChange={(e) => setIocQuery(e.target.value)}
              placeholder="Search Hash SHA-256, file name, or detection reason..."
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-default)',
                borderRadius: '3px',
                padding: '10px 12px 10px 38px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                outline: 'none'
              }}
            />
          </div>
          <button className="btn-cyber-primary" onClick={() => {}}>
            FILTER FORENSIC EVIDENCE
          </button>
        </div>
      </div>

      {/* Forensic Artifacts Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', minHeight: '440px' }}>
        <div className="sentinel-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="sentinel-card-header">
            <span className="heading-section">Discovered Forensic Artifacts</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: '#93c5fd' }}>
              {filteredArtifacts.length} EVIDENCE ITEMS
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredArtifacts.length === 0 ? (
              <div style={{ padding: '30px 14px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                No quarantined forensic artifacts recorded
              </div>
            ) : (
              filteredArtifacts.map((art, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '3px',
                    padding: '12px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.66rem',
                        color: '#60a5fa',
                        backgroundColor: 'rgba(96, 165, 250, 0.1)',
                        border: '1px solid rgba(96, 165, 250, 0.2)',
                        padding: '2px 6px',
                        borderRadius: '2px'
                      }}>
                        {art.type}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-bright)', fontWeight: 600 }}>
                        {art.name}
                      </span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      SHA-256: {art.sha256}
                    </div>
                  </div>

                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    color: art.status === 'QUARANTINED' ? '#f87171' : 'var(--accent-safe)',
                    backgroundColor: art.status === 'QUARANTINED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(52, 211, 153, 0.1)',
                    border: `1px solid ${art.status === 'QUARANTINED' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(52, 211, 153, 0.3)'}`,
                    padding: '2px 8px',
                    borderRadius: '2px'
                  }}>
                    {art.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Incidents Reference Box */}
        <div className="sentinel-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="sentinel-card-header">
            <span className="heading-section">Correlated Incident Evidence</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: '#fb923c' }}>
              {incidents.length} INCIDENTS
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {incidents.length === 0 ? (
              <div style={{ padding: '30px 14px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                No active security incidents recorded in SQLite
              </div>
            ) : (
              incidents.slice(0, 5).map(inc => (
                <div
                  key={inc.id}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '3px',
                    padding: '12px 14px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-bright)', fontWeight: 600 }}>
                    <span>{inc.title}</span>
                    <span style={{ color: inc.severity === 'CRITICAL' ? '#f87171' : '#fb923c' }}>{inc.severity}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {inc.mitreTactics?.[0] || 'T1486 Data Encrypted for Impact'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
