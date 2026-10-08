import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/layout/PageContainer.jsx';
import { RadarScan } from '../components/visualizations/RadarScan.jsx';
import { Radio, Crosshair, Filter, ShieldAlert } from 'lucide-react';
import { ThreatBadge } from '../components/security/ThreatBadge.jsx';
import { useSecurity } from '../context/SecurityContext.jsx';
import { incidentService } from '../services/incidentService.js';

export function ThreatRadar() {
  const { incidents: contextIncidents, isWsConnected } = useSecurity();
  const [selectedVector, setSelectedVector] = useState('ALL');
  const [liveIncidents, setLiveIncidents] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await incidentService.getIncidents('ALL');
        if (Array.isArray(data) && data.length > 0) {
          setLiveIncidents(data);
        } else if (contextIncidents) {
          setLiveIncidents(contextIncidents);
        }
      } catch {
        if (contextIncidents) setLiveIncidents(contextIncidents);
      }
    }
    load();
  }, [contextIncidents]);

  const threats = liveIncidents.map((inc, idx) => ({
    id: inc.id,
    name: inc.matched_family || inc.matchedFamily || inc.title,
    pid: null,
    severity: inc.severity || 'CRITICAL',
    angle: (idx * 1.5 + 0.8) % (Math.PI * 2),
    distance: Math.min(0.85, Math.max(0.3, ((inc.risk_score || inc.riskScore || 80) / 100))),
    vector: inc.mitreTactics?.[0] || 'T1486 Data Encrypted for Impact',
    velocity: `Risk ${Math.round(inc.risk_score || inc.riskScore || 80)}%`
  }));

  const filteredThreats = selectedVector === 'ALL'
    ? threats
    : threats.filter(t => t.severity === selectedVector);

  return (
    <PageContainer
      title="Threat Radar & Vector Spatial Intelligence"
      subtitle="Real-time 360° behavioral anomaly scan and spatial proximity mapping across monitored sandbox endpoints."
      breadcrumbs={['Root', 'Telemetry', 'Threat Radar']}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', minHeight: '520px' }}>
        {/* Radar Scanner View */}
        <div className="sentinel-card sentinel-dense-grid" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="sentinel-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={16} style={{ color: 'var(--accent-blue)' }} />
              <span className="heading-section">Active Sector Sweep</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: isWsConnected ? 'var(--accent-safe)' : 'var(--accent-danger)' }}>
              {isWsConnected ? 'SWEEP ACTIVE (60 RPM)' : 'SWEEP OFFLINE'}
            </span>
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RadarScan threats={filteredThreats} />
          </div>
        </div>

        {/* Vector Feed & Spatial Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="sentinel-card" style={{ flex: 1 }}>
            <div className="sentinel-card-header">
              <span className="heading-section">Detected Threat Vectors</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['ALL', 'CRITICAL', 'HIGH'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setSelectedVector(tab)}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.66rem',
                      padding: '2px 8px',
                      borderRadius: '2px',
                      backgroundColor: selectedVector === tab ? 'rgba(96, 165, 250, 0.15)' : 'transparent',
                      color: selectedVector === tab ? '#93c5fd' : 'var(--text-muted)',
                      border: selectedVector === tab ? '1px solid #3b82f6' : '1px solid transparent'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredThreats.length === 0 ? (
                <div style={{
                  padding: '30px 14px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem'
                }}>
                  No active threat vectors detected in sandbox
                </div>
              ) : (
                filteredThreats.map((threat) => (
                  <div
                    key={threat.id}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-default)',
                      borderRadius: '3px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ThreatBadge label={threat.severity} />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-bright)', fontWeight: 600 }}>
                          {threat.name}
                        </span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#fb923c' }}>
                        {threat.velocity}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      <span>VECTOR: {threat.vector}</span>
                      <span>PROXIMITY: {(threat.distance * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
