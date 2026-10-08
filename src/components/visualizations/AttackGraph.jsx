import React, { useState } from 'react';
import { ShieldAlert, Terminal, FileCode, Monitor, Activity } from 'lucide-react';

export function AttackGraph({
  processes = [],
  selectedNode = null,
  onSelectNode,
  depth = 3
}) {
  const [activeId, setActiveId] = useState(selectedNode || (processes[0]?.name || 'Endpoint Monitoring'));

  // Build graph nodes from live processes or clean sandbox monitoring topology
  const defaultNodes = processes.length > 0
    ? processes.slice(0, 4).map((p, idx) => {
        const positions = [
          { x: 260, y: 180, type: 'parent', icon: Monitor },
          { x: 440, y: 180, type: 'dir', icon: FileCode },
          { x: 350, y: 280, type: 'target', icon: ShieldAlert },
          { x: 440, y: 380, type: 'payload', icon: Terminal }
        ];
        const pos = positions[idx] || { x: 300, y: 200, type: 'process', icon: Activity };
        const isCritical = (p.riskScore || 0) >= 70;
        return {
          id: p.name || `proc-${p.pid}`,
          label: p.name || `PID ${p.pid}`,
          pid: p.pid ? String(p.pid) : 'SBOX',
          type: pos.type,
          x: pos.x,
          y: pos.y,
          icon: pos.icon,
          status: isCritical ? 'CRITICAL' : 'NORMAL'
        };
      })
    : [
        { id: 'sentinel-core', label: 'Sentinel Core', pid: 'LIVE', type: 'parent', x: 260, y: 180, icon: Monitor, status: 'NORMAL' },
        { id: 'monitored_sandbox', label: 'monitored_sandbox', pid: 'DIR', type: 'dir', x: 440, y: 180, icon: FileCode, status: 'NORMAL' },
        { id: 'sandbox-watchdog', label: 'Sandbox Watchdog', pid: 'WATCH', type: 'target', x: 350, y: 280, icon: Activity, status: 'NORMAL' },
        { id: 'quarantine-vault', label: 'Quarantine Vault', pid: 'ISOLATED', type: 'payload', x: 440, y: 380, icon: ShieldAlert, status: 'NORMAL' }
      ];

  const handleNodeClick = (node) => {
    setActiveId(node.id);
    if (onSelectNode) onSelectNode(node);
  };

  return (
    <div className="sentinel-card sentinel-dense-grid" style={{ height: '100%', minHeight: '440px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <div className="sentinel-card-header" style={{ zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#fb923c', fontSize: '0.9rem' }}>☊</span>
          <span className="heading-section">Execution Graph</span>
        </div>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.68rem',
          color: 'var(--text-muted)'
        }}>
          DEPTH: {depth}
        </span>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <svg viewBox="0 0 600 480" style={{ width: '100%', height: '100%' }}>
          {/* Subtle grid lines */}
          <line x1="0" y1="120" x2="600" y2="120" stroke="rgba(30, 42, 66, 0.3)" strokeDasharray="2 2" />
          <line x1="0" y1="240" x2="600" y2="240" stroke="rgba(30, 42, 66, 0.3)" strokeDasharray="2 2" />
          <line x1="0" y1="360" x2="600" y2="360" stroke="rgba(30, 42, 66, 0.3)" strokeDasharray="2 2" />
          <line x1="300" y1="0" x2="300" y2="480" stroke="rgba(30, 42, 66, 0.3)" strokeDasharray="2 2" />

          {/* Connectors */}
          <line x1="260" y1="180" x2="350" y2="280" stroke="rgba(96, 165, 250, 0.4)" strokeWidth="1.5" />
          <line x1="440" y1="180" x2="350" y2="280" stroke="rgba(100, 116, 139, 0.3)" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="350" y1="280" x2="440" y2="380" stroke="rgba(251, 146, 60, 0.5)" strokeWidth="1.5" strokeDasharray="4 4" />

          {/* Dotted tracer lines from background origin */}
          <line x1="120" y1="80" x2="460" y2="230" stroke="rgba(100, 116, 139, 0.25)" strokeWidth="1" />
          <circle cx="460" cy="230" r="3" fill="#fb923c" opacity="0.7" />

          {/* Nodes */}
          {defaultNodes.map((node) => {
            const isSelected = activeId === node.id;
            const isCritical = node.status === 'CRITICAL' || node.status === 'INJECTED';

            return (
              <g
                key={node.id}
                onClick={() => handleNodeClick(node)}
                style={{ cursor: 'pointer' }}
              >
                {/* Diamond or Hex Shape for node */}
                <polygon
                  points={`${node.x},${node.y - 24} ${node.x + 24},${node.y} ${node.x},${node.y + 24} ${node.x - 24},${node.y}`}
                  fill={isCritical ? 'rgba(248, 113, 113, 0.15)' : 'rgba(15, 23, 42, 0.9)'}
                  stroke={isCritical ? '#f87171' : isSelected ? '#60a5fa' : '#2a3b5c'}
                  strokeWidth={isSelected || isCritical ? 2 : 1}
                />

                {/* Node Label Text */}
                <text
                  x={node.x}
                  y={node.y + 40}
                  textAnchor="middle"
                  fill={isCritical ? '#fca5a5' : '#cbd5e1'}
                  fontFamily="var(--font-mono)"
                  fontSize="11"
                  fontWeight="600"
                >
                  {node.label}
                </text>

                <text
                  x={node.x}
                  y={node.y + 53}
                  textAnchor="middle"
                  fill="#64748b"
                  fontFamily="var(--font-mono)"
                  fontSize="9"
                >
                  {node.pid === 'INJECTED' ? 'INJECTED' : `PID: ${node.pid}`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

