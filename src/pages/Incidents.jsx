import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer.jsx';
import { IncidentCard } from '../components/security/IncidentCard.jsx';
import { useSecurity } from '../context/SecurityContext.jsx';
import { AlertOctagon, Filter, Plus, ShieldCheck, Activity, Clock, Cpu, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Modal } from '../components/common/Modal.jsx';

export function Incidents() {
  const { incidents, setIncidents, selectedIncident, setSelectedIncident, mitigateIncident } = useSecurity();
  const [filter, setFilter] = useState('ALL');

  const filteredIncidents = filter === 'ALL'
    ? incidents
    : incidents.filter(i => i.severity === filter || i.status === filter);

  const handleMitigate = async (id) => {
    if (mitigateIncident) {
      await mitigateIncident(id);
    } else {
      setIncidents(prev => prev.map(inc => inc.id === id ? { ...inc, status: 'CONTAINED', mitigationStatus: 'BLOCKED' } : inc));
    }
  };

  const rawData = selectedIncident?.rawData || {};
  const timeline = rawData.timeline || [];
  const affectedFiles = rawData.affectedFiles || [];
  const processAttr = rawData.processAttribution || (selectedIncident?.processInfo ? {
    processName: selectedIncident.processInfo.name,
    pid: selectedIncident.processInfo.pid,
    path: selectedIncident.processInfo.path,
    user: selectedIncident.processInfo.user,
    cpuPercent: selectedIncident.processInfo.cpu,
    memoryMB: selectedIncident.processInfo.memory
  } : null);

  const detectionLatency = rawData.detectionLatencyMs ?? selectedIncident?.detectionLatencyMs;
  const containmentLatency = rawData.containmentLatencyMs ?? selectedIncident?.containmentLatencyMs;
  const totalResponseTime = rawData.totalResponseTimeMs ?? selectedIncident?.totalResponseTimeMs;

  return (
    <PageContainer
      title="Incident Response Queue & Threat Remediation"
      subtitle="Autonomous incident triage, MITRE ATT&CK correlation, and automated containment response playbooks."
      breadcrumbs={['Root', 'SecOps', 'Incidents']}
      actions={
        <div style={{ display: 'flex', gap: '8px' }}>
          {['ALL', 'CRITICAL', 'HIGH', 'ACTIVE', 'CONTAINED'].map(f => (
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
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredIncidents.map((incident) => (
          <IncidentCard
            key={incident.id}
            incident={incident}
            onSelect={(inc) => setSelectedIncident(inc)}
            onMitigate={handleMitigate}
          />
        ))}
        {filteredIncidents.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
            No incident records match the selected filter query.
          </div>
        )}
      </div>

      {/* Incident Detail Modal */}
      <Modal
        isOpen={!!selectedIncident}
        onClose={() => setSelectedIncident(null)}
        title={selectedIncident ? `INCIDENT DOSSIER: ${selectedIncident.id}` : ''}
        maxWidth="740px"
      >
        {selectedIncident && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header / Summary */}
            <div style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ fontSize: '1.05rem', color: 'var(--text-bright)', fontWeight: 600 }}>
                  {selectedIncident.title}
                </h4>
                {selectedIncident.canaryTriggered && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '2px',
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.6)',
                    color: '#f87171',
                    fontSize: '0.68rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700
                  }}>
                    <ShieldAlert size={12} /> CANARY TRIGGERED
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <span>HOST: <strong style={{ color: 'var(--text-primary)' }}>{selectedIncident.affectedHost || 'localhost'}</strong></span>
                <span>SEVERITY: <strong style={{ color: selectedIncident.severity === 'CRITICAL' ? '#f87171' : '#fbbf24' }}>{selectedIncident.severity}</strong></span>
                <span>RISK SCORE: <strong style={{ color: selectedIncident.riskScore >= 80 ? '#f87171' : '#fbbf24' }}>{selectedIncident.riskScore}/100</strong></span>
                <span>STATUS: <strong style={{ color: selectedIncident.status === 'ACTIVE' ? '#f87171' : '#34d399' }}>{selectedIncident.status}</strong></span>
                {rawData.threatFamily && (
                  <span>FAMILY: <strong style={{ color: '#60a5fa' }}>{rawData.threatFamily}</strong></span>
                )}
              </div>
            </div>

            {/* Latency Metrics Grid */}
            <div>
              <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={12} color="#60a5fa" /> Detection & Containment Latency
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '10px 12px', borderRadius: '3px', border: '1px solid var(--border-default)' }}>
                  <div style={{ fontSize: '0.64rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>DETECTION LATENCY</div>
                  <div style={{ fontSize: '1rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#93c5fd', marginTop: '2px' }}>
                    {detectionLatency != null ? `${detectionLatency} ms` : 'N/A'}
                  </div>
                </div>
                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '10px 12px', borderRadius: '3px', border: '1px solid var(--border-default)' }}>
                  <div style={{ fontSize: '0.64rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>CONTAINMENT LATENCY</div>
                  <div style={{ fontSize: '1rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#34d399', marginTop: '2px' }}>
                    {containmentLatency != null ? `${containmentLatency} ms` : 'N/A'}
                  </div>
                </div>
                <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '10px 12px', borderRadius: '3px', border: '1px solid var(--border-default)' }}>
                  <div style={{ fontSize: '0.64rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>TOTAL RESPONSE TIME</div>
                  <div style={{ fontSize: '1rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f59e0b', marginTop: '2px' }}>
                    {totalResponseTime != null ? `${totalResponseTime} ms` : (detectionLatency != null ? `${detectionLatency} ms` : 'N/A')}
                  </div>
                </div>
              </div>
            </div>

            {/* Process Attribution */}
            <div>
              <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Cpu size={12} color="#a78bfa" /> Process Attribution
              </div>
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '10px 12px', borderRadius: '3px', border: '1px solid var(--border-default)', fontFamily: 'var(--font-mono)', fontSize: '0.74rem' }}>
                {processAttr && processAttr.processName ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    <div>PROCESS: <strong style={{ color: 'var(--text-bright)' }}>{processAttr.processName}</strong></div>
                    <div>PID: <strong style={{ color: '#93c5fd' }}>{processAttr.pid || 'N/A'}</strong></div>
                    <div>USER: <strong style={{ color: 'var(--text-secondary)' }}>{processAttr.user || 'system'}</strong></div>
                    <div>STATUS: <strong style={{ color: processAttr.terminated ? '#f87171' : '#34d399' }}>{processAttr.terminated ? 'TERMINATED' : 'ACTIVE'}</strong></div>
                    {processAttr.path && (
                      <div style={{ gridColumn: 'span 2', wordBreak: 'break-all', color: 'var(--text-muted)', fontSize: '0.68rem' }}>
                        EXE PATH: {processAttr.path}
                      </div>
                    )}
                    {(processAttr.cpuPercent != null || processAttr.memoryMB != null) && (
                      <div style={{ gridColumn: 'span 2', color: 'var(--text-muted)', fontSize: '0.68rem' }}>
                        RESOURCES: CPU {processAttr.cpuPercent || 0}% | Memory {processAttr.memoryMB || 0} MB
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Process attribution unavailable
                  </div>
                )}
              </div>
            </div>

            {/* Correlated File Events */}
            {affectedFiles.length > 0 && (
              <div>
                <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={12} color="#34d399" /> Correlated Files Evidence ({affectedFiles.length} files)
                </div>
                <div style={{ maxHeight: '140px', overflowY: 'auto', backgroundColor: 'rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-default)', borderRadius: '3px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.68rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', textAlign: 'left' }}>
                        <th style={{ padding: '6px 10px' }}>FILE</th>
                        <th style={{ padding: '6px 10px' }}>ENTROPY</th>
                        <th style={{ padding: '6px 10px' }}>ACTION</th>
                        <th style={{ padding: '6px 10px' }}>TIMESTAMP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {affectedFiles.map((file, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                          <td style={{ padding: '6px 10px', color: file.isCanary ? '#f87171' : 'var(--text-bright)' }}>
                            {file.isCanary && '🎯 '}{file.filePath ? file.filePath.split('/').pop() : file.fileName || 'file'}
                          </td>
                          <td style={{ padding: '6px 10px', color: file.entropy > 7 ? '#fbbf24' : 'var(--text-secondary)' }}>
                            {file.entropy ? Number(file.entropy).toFixed(2) : 'N/A'}
                          </td>
                          <td style={{ padding: '6px 10px', color: file.quarantined ? '#f87171' : '#93c5fd' }}>
                            {file.quarantined ? 'QUARANTINED' : 'LOGGED'}
                          </td>
                          <td style={{ padding: '6px 10px', color: 'var(--text-muted)' }}>
                            {file.timestamp ? new Date(file.timestamp).toLocaleTimeString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Real Timestamped Incident Timeline */}
            <div>
              <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={12} color="#60a5fa" /> Incident Lifecycle Timeline
              </div>
              <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)', padding: '12px', borderRadius: '3px', border: '1px solid var(--border-default)', maxHeight: '180px', overflowY: 'auto' }}>
                {timeline.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {timeline.map((step, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontFamily: 'var(--font-mono)', fontSize: '0.68rem' }}>
                        <span style={{ color: 'var(--text-muted)', minWidth: '95px' }}>
                          {step.timestamp ? step.timestamp.split('T')[1]?.replace('Z', '') : ''}
                        </span>
                        <span style={{
                          color: step.stage.includes('QUARANTINE') || step.stage.includes('TERMINAT') || step.stage.includes('CANARY') ? '#f87171' :
                                 step.stage.includes('INCIDENT') || step.stage.includes('THREAT') ? '#fbbf24' : '#93c5fd',
                          fontWeight: 700,
                          minWidth: '150px'
                        }}>
                          {step.stage}
                        </span>
                        <span style={{ color: 'var(--text-secondary)', flex: 1, wordBreak: 'break-all' }}>
                          {step.detail}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.68rem' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <span style={{ color: 'var(--text-muted)', minWidth: '95px' }}>
                        {selectedIncident.createdAt ? new Date(selectedIncident.createdAt).toLocaleTimeString() : '14:22:15'}
                      </span>
                      <span style={{ color: '#93c5fd', fontWeight: 700, minWidth: '150px' }}>INCIDENT_CREATED</span>
                      <span style={{ color: 'var(--text-secondary)' }}>Automated incident initialized from threat telemetry</span>
                    </div>
                    {selectedIncident.status === 'CONTAINED' && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <span style={{ color: 'var(--text-muted)', minWidth: '95px' }}>
                          {selectedIncident.updatedAt ? new Date(selectedIncident.updatedAt).toLocaleTimeString() : '14:22:16'}
                        </span>
                        <span style={{ color: '#34d399', fontWeight: 700, minWidth: '150px' }}>CONTAINMENT_ENFORCED</span>
                        <span style={{ color: 'var(--text-secondary)' }}>Host containment & file isolation playbook applied</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                onClick={() => setSelectedIncident(null)}
                className="btn-cyber-ghost"
              >
                CLOSE
              </button>
              {selectedIncident.status === 'ACTIVE' && (
                <button
                  onClick={() => {
                    handleMitigate(selectedIncident.id);
                    setSelectedIncident(null);
                  }}
                  className="btn-cyber-danger"
                >
                  ENFORCE CONTAINMENT
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}

