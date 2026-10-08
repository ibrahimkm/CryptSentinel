import React from 'react';
import { AlertTriangle, Clock, ShieldCheck, ChevronRight, Activity, FileText, Cpu, ShieldAlert } from 'lucide-react';
import { ThreatBadge } from './ThreatBadge.jsx';

export function IncidentCard({ incident, onSelect, onMitigate }) {
  const isCritical = incident.severity === 'CRITICAL';
  const raw = incident.rawData || {};
  const filesAffected = raw.filesAffected || (raw.affectedFiles ? raw.affectedFiles.length : 1);
  const mutationRate = raw.mutationRate || (raw.features?.mutations_per_second ? parseFloat(raw.features.mutations_per_second.toFixed(1)) : 1.0);
  const isCanary = raw.canaryTriggered;
  const processInfo = raw.processInfo || {};
  const processAttribution = processInfo.processAttribution || (raw.features?.processAttribution) || 'Process attribution unavailable';

  return (
    <div
      className="sentinel-card"
      style={{
        borderLeft: isCritical ? '3px solid var(--accent-critical)' : '3px solid var(--accent-danger)',
        padding: '16px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {incident.id}
            </span>
            <ThreatBadge label={incident.severity} />
            {isCanary && (
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.66rem',
                padding: '1px 6px',
                borderRadius: '2px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#fca5a5',
                fontWeight: 700
              }}>
                CANARY TRIGGERED
              </span>
            )}
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.66rem',
              padding: '1px 6px',
              borderRadius: '2px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)'
            }}>
              {incident.status}
            </span>
          </div>

          <h3 style={{
            fontSize: '0.92rem',
            fontWeight: 600,
            color: 'var(--text-bright)',
            lineHeight: 1.3
          }}>
            {incident.title}
          </h3>
        </div>

        <div style={{
          textAlign: 'right',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.68rem',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
            <Clock size={12} />
            <span>{incident.timestamp ? new Date(incident.timestamp).toLocaleTimeString('en-GB') + ' UTC' : (incident.createdAt || 'LIVE')}</span>
          </div>
          <div style={{ marginTop: '2px', color: '#fb923c', fontWeight: 600 }}>
            RISK: {incident.risk_score || incident.riskScore || 85}/100
          </div>
        </div>
      </div>

      {/* Correlated Metrics Strip */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        margin: '10px 0',
        padding: '8px 10px',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-default)',
        borderRadius: '3px',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FileText size={13} style={{ color: '#93c5fd' }} />
          <span style={{ color: 'var(--text-muted)' }}>FILES AFFECTED:</span>
          <span style={{ color: '#fff', fontWeight: 600 }}>{filesAffected}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Activity size={13} style={{ color: '#f87171' }} />
          <span style={{ color: 'var(--text-muted)' }}>MUTATION RATE:</span>
          <span style={{ color: '#fca5a5', fontWeight: 600 }}>{mutationRate} ops/s</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Cpu size={13} style={{ color: '#fbbf24' }} />
          <span style={{ color: 'var(--text-muted)' }}>ATTRIBUTION:</span>
          <span style={{ color: processInfo.attributed ? '#fbbf24' : 'var(--text-muted)' }}>
            {processAttribution}
          </span>
        </div>
      </div>

      {/* MITRE Tactics Tags */}
      {incident.mitreTactics && incident.mitreTactics.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '8px 0' }}>
          {incident.mitreTactics.map((tac, idx) => (
            <span
              key={idx}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                backgroundColor: 'rgba(96, 165, 250, 0.08)',
                border: '1px solid rgba(96, 165, 250, 0.2)',
                color: '#bfdbfe',
                padding: '2px 6px',
                borderRadius: '2px'
              }}
            >
              {tac}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '12px',
        paddingTop: '10px',
        borderTop: '1px solid rgba(255, 255, 255, 0.04)'
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
          FAMILY: {incident.matched_family || incident.matchedFamily || 'Autonomous Ransomware Pattern'}
        </span>

        <div style={{ display: 'flex', gap: '8px' }}>
          {incident.status === 'OPEN' && (
            <button
              onClick={() => onMitigate && onMitigate(incident.id)}
              className="btn-cyber-danger"
              style={{ padding: '4px 10px', fontSize: '0.68rem' }}
            >
              ENFORCE CONTAINMENT
            </button>
          )}
          <button
            onClick={() => onSelect && onSelect(incident)}
            className="btn-cyber-ghost"
            style={{ padding: '4px 10px', fontSize: '0.68rem' }}
          >
            <span>DOSSIER & TIMELINE</span>
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
