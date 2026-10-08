import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer.jsx';
import { ProcessTable } from '../components/security/ProcessTable.jsx';
import { AttackGraph } from '../components/visualizations/AttackGraph.jsx';
import { useSecurity } from '../context/SecurityContext.jsx';
import { AlertTriangle, X, ShieldAlert, Ban, Globe } from 'lucide-react';
import { ThreatBadge } from '../components/security/ThreatBadge.jsx';

export function ProcessObservatory() {
  const { systemPosture, processes, selectedProcess, setSelectedProcess, killProcess, isolateHost } = useSecurity();
  const [detailVisible, setDetailVisible] = useState(true);

  const activeProcess = selectedProcess || processes[0] || null;
  const hostLabel = systemPosture?.host ? `${systemPosture.host.platform} Host: ${systemPosture.host.hostname}` : 'macOS Host';

  const handleKill = async () => {
    if (activeProcess) {
      await killProcess(activeProcess.pid);
    }
  };

  const handleIsolate = async () => {
    await isolateHost(systemPosture?.host?.hostname || 'localhost');
  };

  return (
    <PageContainer breadcrumbs={['Root', systemPosture?.host?.hostname || 'macOS-Host', 'Process Observatory']}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: detailVisible && activeProcess ? '1fr 1.2fr 1.1fr' : '1fr 1.8fr',
        gap: '16px',
        height: 'calc(100vh - 130px)',
        minHeight: '560px'
      }}>
        {/* Left Column: Active Processes Table */}
        <ProcessTable
          processes={processes}
          selectedPid={activeProcess?.pid}
          onSelectProcess={(proc) => {
            setSelectedProcess(proc);
            setDetailVisible(true);
          }}
        />

        {/* Middle Column: Execution Graph */}
        <AttackGraph
          processes={processes}
          selectedNode={activeProcess?.name}
          onSelectNode={(node) => {
            const found = processes.find(p => p.name === node.label || String(p.pid) === node.pid);
            if (found) setSelectedProcess(found);
          }}
          depth={3}
        />

        {/* Right Column: Process Details Inspector */}
        {detailVisible && activeProcess && (
          <div className="sentinel-card" style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            {/* Header */}
            <div className="sentinel-card-header">
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  OBJ-ID: PROC-{activeProcess.pid}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  <AlertTriangle size={18} style={{ color: activeProcess.riskScore > 80 ? '#f87171' : '#fb923c' }} />
                  <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    color: 'var(--text-bright)',
                    fontFamily: 'var(--font-sans)'
                  }}>
                    {activeProcess.name}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setDetailVisible(false)}
                style={{ color: 'var(--text-muted)', padding: '4px' }}
                aria-label="Close Inspector"
              >
                <X size={16} />
              </button>
            </div>

            {/* Risk Level & Metadata */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '8px 0 14px 0' }}>
              <div>
                <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  RISK LEVEL
                </span>
                <div style={{
                  fontSize: '1.1rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: activeProcess.riskScore > 80 ? '#f87171' : (activeProcess.riskScore > 0 ? '#fb923c' : 'var(--accent-safe)'),
                  marginTop: '2px'
                }}>
                  {activeProcess.riskScore} / {activeProcess.riskScore > 80 ? 'CRITICAL' : activeProcess.riskScore > 0 ? 'ELEVATED' : 'NORMAL'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  FIRST SEEN
                </span>
                <div style={{
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-primary)',
                  marginTop: '4px'
                }}>
                  {activeProcess.startTime || activeProcess.firstSeen || 'Live Session'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  USER
                </span>
                <div style={{
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-bright)',
                  marginTop: '4px'
                }}>
                  {activeProcess.user || 'root'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  PATH
                </span>
                <div style={{
                  fontSize: '0.74rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  marginTop: '4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {activeProcess.path || `/proc/${activeProcess.pid}`}
                </div>
              </div>
            </div>

            {/* Process Lineage Tree */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-default)',
              borderRadius: '3px',
              padding: '10px 12px',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <span style={{ color: '#fb923c', fontSize: '0.8rem' }}>☊</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: '#fb923c', fontWeight: 600 }}>
                  PROCESS LINEAGE
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.74rem' }}>
                {(activeProcess.lineage || [
                  `PID 1: launchd`,
                  `PID ${activeProcess.pid}: ${activeProcess.name}`
                ]).map((item, idx) => {
                  const isCurrent = item.includes(activeProcess.name);
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '2px',
                        backgroundColor: isCurrent ? 'rgba(96, 165, 250, 0.12)' : 'transparent',
                        border: isCurrent ? '1px solid rgba(96, 165, 250, 0.3)' : '1px solid transparent',
                        color: isCurrent ? '#93c5fd' : 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginLeft: `${idx * 12}px`
                      }}
                    >
                      {isCurrent ? <AlertTriangle size={12} style={{ color: '#60a5fa' }} /> : <span>↳</span>}
                      <span>{item}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Connections */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-default)',
              borderRadius: '3px',
              padding: '10px 12px',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Globe size={13} style={{ color: 'var(--accent-blue)' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: '#93c5fd', fontWeight: 600 }}>
                  ACTIVE CONNECTIONS
                </span>
              </div>

              <table className="sentinel-table">
                <thead>
                  <tr>
                    <th>PROTO</th>
                    <th>REMOTE ADDRESS</th>
                    <th style={{ textAlign: 'right' }}>STATE</th>
                  </tr>
                </thead>
                <tbody>
                  {activeProcess.connections?.length > 0 ? (
                    activeProcess.connections.map((conn, idx) => (
                      <tr key={idx}>
                        <td style={{ color: 'var(--text-secondary)' }}>{conn.proto}</td>
                        <td style={{ color: conn.state === 'SYN_SENT' ? '#f87171' : 'var(--text-primary)' }}>{conn.remote}</td>
                        <td style={{ textAlign: 'right', color: conn.state === 'SYN_SENT' ? '#f87171' : 'var(--text-muted)' }}>{conn.state}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No active socket connections</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Behavioral Events Terminal */}
            <div style={{
              backgroundColor: '#05070c',
              border: '1px solid var(--border-subtle)',
              borderRadius: '3px',
              padding: '10px 12px',
              marginBottom: '14px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <span style={{ color: 'var(--text-muted)', marginBottom: '4px', fontSize: '0.66rem' }}>
                ▤ BEHAVIORAL EVENTS
              </span>
              {(activeProcess.events && activeProcess.events.length > 0 ? activeProcess.events : [
                `Endpoint monitoring active for PID ${activeProcess.pid}`,
                `Entropy state within nominal threshold`
              ]).map((evt, idx) => {
                const isWarn = evt.includes('Suspicious') || evt.includes('High entropy');
                return (
                  <div key={idx} style={{ color: isWarn ? '#fed7aa' : 'var(--text-secondary)' }}>
                    {evt}
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: 'auto' }}>
              <button
                onClick={handleKill}
                className="btn-cyber-danger"
                style={{ width: '100%', padding: '10px', fontSize: '0.74rem' }}
              >
                <Ban size={14} />
                <span>KILL PROCESS</span>
              </button>

              <button
                onClick={handleIsolate}
                className="btn-cyber-ghost"
                style={{ width: '100%', padding: '10px', fontSize: '0.74rem', justifyContent: 'center' }}
              >
                <ShieldAlert size={14} />
                <span>ISOLATE HOST</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
