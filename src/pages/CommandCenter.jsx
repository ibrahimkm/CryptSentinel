import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer.jsx';
import { ThreatScore } from '../components/dashboard/ThreatScore.jsx';
import { SystemStatus } from '../components/dashboard/SystemStatus.jsx';
import { ActivityStream } from '../components/dashboard/ActivityStream.jsx';
import { ProcessTopology } from '../components/visualizations/ProcessTopology.jsx';
import { LoadingState } from '../components/common/LoadingState.jsx';
import { ErrorState } from '../components/common/ErrorState.jsx';
import { useSecurity } from '../context/SecurityContext.jsx';
import { ShieldAlert, Laptop, Play, RotateCcw, AlertTriangle, CheckCircle2, Activity, Server, Cpu, Database, Bell, Lock, ShieldCheck, Radio } from 'lucide-react';

export function CommandCenter() {
  const {
    systemPosture,
    telemetryLogs,
    processes,
    engineHealth,
    canaryStatus,
    isWsConnected,
    isLoading,
    error,
    refreshAllData,
    triggerSyntheticAttack,
    resetSandbox,
    activeThreatMatch,
    setLocatorModalOpen
  } = useSecurity();

  const [testingScenario, setTestingScenario] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState('lockbit');

  const handleRunTest = async () => {
    setTestingScenario(true);
    try {
      await triggerSyntheticAttack(selectedFamily);
    } finally {
      setTestingScenario(false);
    }
  };

  if (isLoading) return <LoadingState message="INITIALIZING LIVE COMMAND CENTER TELEMETRY..." />;
  if (error) return <ErrorState message={error} onRetry={refreshAllData} />;

  const host = systemPosture?.host;
  const isMlOnline = engineHealth?.mlEngine === 'ONLINE';

  return (
    <PageContainer>
      {/* 1. Live Host Telemetry & Synthetic Scenario Control Bar */}
      <div style={{
        backgroundColor: 'rgba(14, 19, 32, 0.7)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        {/* Host Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '4px',
            backgroundColor: 'rgba(96, 165, 250, 0.12)',
            border: '1px solid rgba(96, 165, 250, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#60a5fa'
          }}>
            <Laptop size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-bright)' }}>
                {host ? `${host.platform} Host: ${host.hostname}` : 'macOS Host: Local Host'}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                color: isWsConnected ? 'var(--accent-safe)' : 'var(--accent-danger)',
                backgroundColor: isWsConnected ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${isWsConnected ? 'rgba(52, 211, 153, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                padding: '1px 6px',
                borderRadius: '2px'
              }}>
                {isWsConnected ? 'LIVE SENSORS ACTIVE' : 'SENSORS OFFLINE'}
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              MONITORED DIRECTORY: <span style={{ color: '#93c5fd' }}>{systemPosture?.sandboxPath || './monitored_sandbox'}</span>
            </div>
          </div>
        </div>

        {/* Synthetic Ransomware Injection Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={selectedFamily}
            onChange={(e) => setSelectedFamily(e.target.value)}
            style={{
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-default)',
              color: '#cbd5e1',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              padding: '6px 10px',
              borderRadius: '3px',
              outline: 'none'
            }}
          >
            <option value="lockbit">SYNTHETIC LOCKBIT 3.0</option>
            <option value="blackcat">SYNTHETIC BLACKCAT/ALPHV</option>
            <option value="canary">SYNTHETIC CANARY HONEYPOT ATTACK</option>
            <option value="generic">GENERIC HIGH-ENTROPY BURST</option>
          </select>

          <button
            onClick={handleRunTest}
            disabled={testingScenario}
            className="btn-cyber-danger"
            style={{ padding: '6px 14px', fontSize: '0.72rem' }}
          >
            <Play size={12} />
            <span>{testingScenario ? 'INJECTING SYNTHETIC BURST...' : 'RUN SYNTHETIC TEST'}</span>
          </button>

          <button
            onClick={resetSandbox}
            className="btn-cyber-ghost"
            style={{ padding: '6px 12px', fontSize: '0.72rem' }}
            title="Reset Sandbox Files"
          >
            <RotateCcw size={12} />
            <span>RESET</span>
          </button>

          {activeThreatMatch && (
            <button
              onClick={() => setLocatorModalOpen(true)}
              className="btn-cyber-primary"
              style={{ padding: '6px 12px', fontSize: '0.72rem' }}
            >
              <AlertTriangle size={12} style={{ color: '#f87171' }} />
              <span>LOCATE PROCESS</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. ML Engine Status & Heuristic Protection Fallback Banner */}
      <div style={{
        padding: '8px 14px',
        backgroundColor: isMlOnline ? 'rgba(52, 211, 153, 0.08)' : 'rgba(251, 191, 36, 0.08)',
        border: `1px solid ${isMlOnline ? 'rgba(52, 211, 153, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`,
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.72rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={14} style={{ color: isMlOnline ? 'var(--accent-safe)' : '#fbbf24' }} />
          <span style={{ fontWeight: 600, color: isMlOnline ? 'var(--accent-safe)' : '#fbbf24' }}>
            {isMlOnline
              ? 'ML SERVICE ONLINE — FULL AI + HEURISTIC PROTECTION ACTIVE'
              : 'ML SERVICE OFFLINE — HEURISTIC PROTECTION ACTIVE (Entropy, Velocity, Signatures & Canaries)'}
          </span>
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>
          {canaryStatus?.status === 'TRIGGERED' ? '⚠ CANARY TRIPWIRE TRIPPED' : '● ALL SENSORS ARMED'}
        </span>
      </div>

      {/* 3. Security Engine Health Matrix */}
      <div className="sentinel-card" style={{ padding: '12px 16px' }}>
        <div className="sentinel-card-header" style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={15} style={{ color: 'var(--accent-blue)' }} />
            <span className="heading-section">SECURITY ENGINE SUBSYSTEM HEALTH</span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--text-muted)' }}>
            HEARTBEAT OK
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
          gap: '10px'
        }}>
          {[
            { name: 'Backend Core', status: engineHealth?.backend || 'ONLINE', icon: Server },
            { name: 'File Watcher', status: engineHealth?.fileWatcher || 'ONLINE', icon: Radio },
            { name: 'ML Engine', status: engineHealth?.mlEngine || 'ONLINE', sub: engineHealth?.mlEngine === 'OFFLINE' ? 'HEURISTIC FALLBACK' : null, icon: Cpu },
            { name: 'Database', status: engineHealth?.database || 'ONLINE', icon: Database },
            { name: 'WebSocket', status: isWsConnected ? 'ONLINE' : 'OFFLINE', icon: Activity },
            { name: 'Notifications', status: engineHealth?.notifications || 'ONLINE', icon: Bell },
            { name: 'Quarantine', status: engineHealth?.quarantine || 'ONLINE', icon: Lock },
            { name: 'Canaries', status: canaryStatus?.status === 'ACTIVE' ? 'ONLINE' : 'TRIGGERED', icon: ShieldCheck }
          ].map((item, idx) => {
            const isOnline = item.status === 'ONLINE';
            const isTriggered = item.status === 'TRIGGERED';
            const IconComponent = item.icon;
            return (
              <div
                key={idx}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '3px',
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {item.name}
                  </span>
                  <IconComponent size={12} style={{ color: isOnline ? 'var(--accent-safe)' : (isTriggered ? 'var(--accent-critical)' : '#fbbf24') }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: isOnline ? 'var(--accent-safe)' : (isTriggered ? 'var(--accent-critical)' : '#fbbf24')
                  }} />
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: isOnline ? 'var(--accent-safe)' : (isTriggered ? 'var(--accent-critical)' : '#fbbf24')
                  }}>
                    {item.status}
                  </span>
                </div>
                {item.sub && (
                  <span style={{ fontSize: '0.58rem', fontFamily: 'var(--font-mono)', color: '#fbbf24' }}>
                    {item.sub}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Top Row: System Posture & Escalation Horizon */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '16px'
      }}>
        <ThreatScore
          status={systemPosture?.status || 'PROTECTED'}
          probability={systemPosture?.aggregateProbability ?? 0.0}
          behavioralScore={systemPosture?.behavioralScore ?? 0.0}
        />
        <SystemStatus
          horizon={systemPosture?.escalationHorizonSeconds || '18-42s'}
          description={systemPosture?.escalationDescription || 'System operates normally under sandbox endpoint monitoring.'}
          vector={systemPosture?.vector || 'SYSTEM_BASELINE'}
          confidence={systemPosture?.confidence || 'HI'}
        />
      </div>

      {/* 5. Bottom Row: Raw Telemetry Stream & Process Topology */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '16px',
        minHeight: '380px'
      }}>
        <ActivityStream logs={telemetryLogs} />
        <ProcessTopology
          activeNodes={systemPosture?.activeNodes ?? (processes?.length || 0)}
          isolatedNodes={systemPosture?.isolatedNodes ?? 0}
        />
      </div>
    </PageContainer>
  );
}
