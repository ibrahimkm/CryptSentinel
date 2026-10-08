import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/layout/PageContainer.jsx';
import { Network, ShieldAlert, Cpu, Layers, Radio, FileText, CheckCircle2 } from 'lucide-react';
import { ThreatBadge } from '../components/security/ThreatBadge.jsx';
import { incidentService } from '../services/incidentService.js';
import { useSecurity } from '../context/SecurityContext.jsx';

export function AttackGraph() {
  const { incidents: contextIncidents, isWsConnected } = useSecurity();
  const [liveIncidents, setLiveIncidents] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await incidentService.getIncidents('ALL');
        if (Array.isArray(data) && data.length > 0) {
          setLiveIncidents(data);
        } else if (contextIncidents && contextIncidents.length > 0) {
          setLiveIncidents(contextIncidents);
        }
      } catch {
        if (contextIncidents) setLiveIncidents(contextIncidents);
      }
    }
    load();
  }, [contextIncidents]);

  const activeIncident = liveIncidents.length > 0 ? liveIncidents[0] : null;

  // Build dynamic correlated graph nodes from actual incident telemetry
  const graphNodes = activeIncident ? [
    {
      id: 'NODE-PROC',
      type: 'PROCESS',
      title: 'Endpoint Watchdog',
      subtitle: 'Sandbox Scope',
      risk: Math.round(activeIncident.risk_score || activeIncident.riskScore || 75),
      x: 80,
      y: 220,
      color: '#60a5fa'
    },
    {
      id: 'NODE-FILE',
      type: 'FILE_MUTATION',
      title: activeIncident.rawData?.fileLocation ? activeIncident.rawData.fileLocation.split('/').pop() : 'sandbox_target.lockbit',
      subtitle: `H(X) = ${activeIncident.rawData?.features?.average_entropy || '7.85'}`,
      risk: 88,
      x: 230,
      y: 150,
      color: '#fbbf24'
    },
    {
      id: 'NODE-DET',
      type: 'DETECTION',
      title: 'Entropy Gradient Spike',
      subtitle: activeIncident.matched_family || activeIncident.matchedFamily || 'LockBit 3.0',
      risk: 94,
      x: 380,
      y: 280,
      color: '#f87171'
    },
    {
      id: 'NODE-INC',
      type: 'INCIDENT',
      title: activeIncident.title || 'High Entropy Wave',
      subtitle: `Status: ${activeIncident.status || 'OPEN'}`,
      risk: Math.round(activeIncident.risk_score || activeIncident.riskScore || 90),
      x: 520,
      y: 160,
      color: '#fb923c'
    },
    {
      id: 'NODE-TECH',
      type: 'MITRE_ATTACK',
      title: activeIncident.mitreTactics?.[0] || 'T1486 Data Encrypted for Impact',
      subtitle: 'Impact & Inhibit Recovery',
      risk: 98,
      x: 630,
      y: 220,
      color: '#f43f5e'
    }
  ] : [
    { id: 'NODE-1', type: 'PROCESS', title: 'Sandbox Watchdog', subtitle: 'Monitoring Scope', risk: 10, x: 100, y: 220, color: '#34d399' },
    { id: 'NODE-2', type: 'FILE', title: 'Clean File System', subtitle: 'Baseline H=4.2', risk: 10, x: 260, y: 160, color: '#60a5fa' },
    { id: 'NODE-3', type: 'AI_MODEL', title: 'RandomForest Evaluator', subtitle: 'P(Ransomware)=0.0', risk: 10, x: 420, y: 280, color: '#34d399' },
    { id: 'NODE-4', type: 'STATUS', title: 'Sandbox Protected', subtitle: 'No Active Threats', risk: 10, x: 580, y: 220, color: '#34d399' }
  ];

  return (
    <PageContainer
      title="Causal Threat Dependency & Attack Graph"
      subtitle="Correlated dependency topology mapping live process events, high-entropy file mutations, SQLite incidents, and MITRE ATT&CK tactics."
      breadcrumbs={['Root', 'Investigation', 'Attack Graph']}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '16px', minHeight: '520px' }}>
        {/* Visual Graph View */}
        <div className="sentinel-card sentinel-dense-grid" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="sentinel-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Network size={16} style={{ color: 'var(--accent-blue)' }} />
              <span className="heading-section">Live Correlated Graph Topology</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: activeIncident ? '#f87171' : 'var(--accent-safe)' }}>
              {activeIncident ? `${graphNodes.length} CORRELATED HOPS` : 'ALL SYSTEMS NOMINAL'}
            </span>
          </div>

          <div style={{ flex: 1, position: 'relative' }}>
            <svg viewBox="0 0 700 440" style={{ width: '100%', height: '100%' }}>
              {/* Connecting Attack Path Line */}
              {graphNodes.length >= 4 && (
                <path
                  d={`M ${graphNodes[0].x} ${graphNodes[0].y} C ${graphNodes[1].x} ${graphNodes[1].y - 40}, ${graphNodes[2].x} ${graphNodes[2].y + 40}, ${graphNodes[3].x} ${graphNodes[3].y}`}
                  fill="none"
                  stroke={activeIncident ? "rgba(248, 113, 113, 0.4)" : "rgba(52, 211, 153, 0.4)"}
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              )}

              {graphNodes.map((n, idx) => (
                <g
                  key={n.id}
                  transform={`translate(${n.x}, ${n.y})`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedNode(n)}
                >
                  <circle
                    r={selectedNode?.id === n.id ? 26 : 22}
                    fill="#111827"
                    stroke={n.color}
                    strokeWidth={selectedNode?.id === n.id ? 3 : 2}
                  />
                  <text textAnchor="middle" y="4" fill={n.color} fontFamily="var(--font-mono)" fontSize="10" fontWeight="bold">
                    0{idx + 1}
                  </text>
                  <text textAnchor="middle" y="38" fill="#cbd5e1" fontFamily="var(--font-mono)" fontSize="9.5" fontWeight="500">
                    {n.title.length > 18 ? n.title.slice(0, 16) + '...' : n.title}
                  </text>
                  <text textAnchor="middle" y="50" fill="var(--text-muted)" fontFamily="var(--font-mono)" fontSize="8">
                    {n.subtitle}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Attack Stages Detail List */}
        <div className="sentinel-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="sentinel-card-header">
            <span className="heading-section">Correlated Telemetry Records</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: isWsConnected ? 'var(--accent-safe)' : 'var(--accent-danger)' }}>
              {isWsConnected ? 'WS LIVE' : 'WS OFFLINE'}
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {graphNodes.map((node, idx) => (
              <div
                key={node.id}
                onClick={() => setSelectedNode(node)}
                style={{
                  backgroundColor: selectedNode?.id === node.id ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: selectedNode?.id === node.id ? '1px solid var(--accent-blue)' : '1px solid var(--border-default)',
                  borderRadius: '3px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: node.color, fontWeight: 600 }}>
                    STAGE 0{idx + 1} — {node.type}
                  </span>
                  <ThreatBadge score={node.risk} />
                </div>

                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-bright)', fontWeight: 500 }}>
                  {node.title}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                  <span>{node.subtitle}</span>
                  <span>{activeIncident?.timestamp ? new Date(activeIncident.timestamp).toLocaleTimeString() : 'Nominal'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
