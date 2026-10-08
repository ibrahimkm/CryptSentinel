import React, { useState } from 'react';
import { PageContainer } from '../components/layout/PageContainer.jsx';
import { Shield, ShieldAlert, Cpu, Lock, ToggleLeft, ToggleRight, Check, AlertTriangle, RotateCcw, CheckCircle2, FileText, Bell, Zap, Save } from 'lucide-react';
import { useSecurity } from '../context/SecurityContext.jsx';

export function Protection() {
  const { canaryStatus, resetCanaryTripwires, policies, updateResponsePolicies } = useSecurity();
  const [currentPolicies, setCurrentPolicies] = useState(policies || {
    CRITICAL: { createIncident: true, quarantine: true, desktopNotification: true, terminateProcess: false },
    HIGH: { createIncident: true, desktopNotification: true, quarantine: false, terminateProcess: false },
    MEDIUM: { createIncident: true, desktopNotification: false, quarantine: false, terminateProcess: false }
  });
  const [policySaved, setPolicySaved] = useState(false);

  const [kernelPolicies, setKernelPolicies] = useState([
    { id: 'pol-1', name: 'Kernel-Level Direct I/O Interceptor', desc: 'Hooks filesystem minifilter layer to intercept high-frequency file rename/write bursts', active: true, level: 'STRICT' },
    { id: 'pol-2', name: 'Shadow Copy & VSS Immutability Guard', desc: 'Denies vssadmin delete shadows and WMI shadow copy drops unconditionally', active: true, level: 'ENFORCED' },
    { id: 'pol-3', name: 'Autonomous Process Memory Freezing', desc: 'Instantly suspends thread execution upon VirtualAllocEx non-standard memory allocation', active: true, level: 'ENFORCED' },
    { id: 'pol-4', name: 'Honeypot Decoy Canary Trap Deployment', desc: 'Deploys authentic decoy files across sandbox folders to trip encryption waves early', active: true, level: 'ACTIVE' },
    { id: 'pol-5', name: 'Automatic Volume Rollback Snapshot', desc: 'Creates lightweight instant differential snapshots before elevated process execution', active: false, level: 'PASSIVE' }
  ]);

  const toggleKernelPolicy = (id) => {
    setKernelPolicies(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  const handlePolicyToggle = (tier, action) => {
    const updated = {
      ...currentPolicies,
      [tier]: {
        ...currentPolicies[tier],
        [action]: !currentPolicies[tier][action]
      }
    };
    setCurrentPolicies(updated);
    if (updateResponsePolicies) {
      updateResponsePolicies(updated);
    }
    setPolicySaved(true);
    setTimeout(() => setPolicySaved(false), 2000);
  };

  const isCanaryTriggered = canaryStatus?.status === 'TRIGGERED';

  return (
    <PageContainer
      title="Autonomous Protection Policies & Honeypot Decoy Tripwires"
      subtitle="Configure low-level heuristic defense policies, canary honeypot files, automated quarantine playbooks, and process termination rules."
      breadcrumbs={['Root', 'Engine', 'Protection Policies']}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* 1. Canary / Honeypot Protection Status Banner & Decoy Registry */}
        <div className="sentinel-card" style={{ borderLeft: isCanaryTriggered ? '3px solid var(--accent-critical)' : '3px solid var(--accent-safe)' }}>
          <div className="sentinel-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={16} style={{ color: isCanaryTriggered ? 'var(--accent-critical)' : 'var(--accent-safe)' }} />
              <span className="heading-section">CANARY / HONEYPOT DECOY PROTECTION</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: isCanaryTriggered ? 'var(--accent-critical)' : 'var(--accent-safe)',
                backgroundColor: isCanaryTriggered ? 'rgba(239, 68, 68, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                border: `1px solid ${isCanaryTriggered ? 'rgba(239, 68, 68, 0.4)' : 'rgba(52, 211, 153, 0.4)'}`,
                padding: '3px 10px',
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                {isCanaryTriggered ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                CANARY PROTECTION: {isCanaryTriggered ? '⚠ TRIGGERED' : '● ACTIVE'}
              </span>

              <button
                onClick={resetCanaryTripwires}
                className="btn-cyber-ghost"
                style={{ padding: '4px 10px', fontSize: '0.68rem' }}
                title="Restore and re-arm all honeypot decoy files"
              >
                <RotateCcw size={12} />
                <span>RE-ARM CANARIES</span>
              </button>
            </div>
          </div>

          {isCanaryTriggered && canaryStatus?.lastTriggered && (
            <div style={{
              margin: '0 0 12px 0',
              padding: '10px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '3px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.74rem',
              color: '#fca5a5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <strong>CANARY TRIGGERED:</strong> Decoy file <code style={{ color: '#fff' }}>{canaryStatus.lastTriggered.canary}</code> was modified by a high-entropy burst.
              </div>
              <span style={{ color: '#fb923c', fontWeight: 600 }}>RISK: {canaryStatus.lastTriggered.riskScore}/100</span>
            </div>
          )}

          {/* List of 5 Deployed Honeypot Canary Decoys */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '10px',
            marginTop: '8px'
          }}>
            {[
              { name: 'payroll.xlsx', desc: 'HR Corporate Salary Matrix' },
              { name: 'financial_report.xlsx', desc: 'Q4 Corporate Financial Audit' },
              { name: 'employee_database.sql', desc: 'Relational User Authentication Dump' },
              { name: 'customer_records.csv', desc: 'PII Customer Account Registry' },
              { name: 'company_strategy.docx', desc: 'Confidential Strategic Architecture Roadmap' }
            ].map((canary, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '3px',
                  padding: '8px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: '#93c5fd', fontWeight: 600 }}>
                    {canary.name}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.62rem',
                    color: isCanaryTriggered && canaryStatus?.lastTriggered?.canary?.includes(canary.name) ? '#f87171' : 'var(--accent-safe)'
                  }}>
                    {isCanaryTriggered && canaryStatus?.lastTriggered?.canary?.includes(canary.name) ? 'COMPROMISED' : 'ARMED'}
                  </span>
                </div>
                <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                  {canary.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Automated Response Policy Configuration Matrix */}
        <div className="sentinel-card">
          <div className="sentinel-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={16} style={{ color: '#60a5fa' }} />
              <span className="heading-section">AUTOMATED RESPONSE PLAYBOOK POLICIES</span>
            </div>

            {policySaved && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--accent-safe)' }}>
                ✓ PLAYBOOK POLICIES UPDATED
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {/* CRITICAL Playbook */}
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.03)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '4px',
              padding: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', fontWeight: 700, color: 'var(--accent-critical)' }}>
                  CRITICAL SEVERITY
                </span>
                <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>High Entropy / Canaries</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { key: 'createIncident', label: 'Create Incident Record' },
                  { key: 'quarantine', label: 'Automated Quarantine File' },
                  { key: 'desktopNotification', label: 'Send OS Desktop Notification' },
                  { key: 'terminateProcess', label: 'Terminate Originating Process' }
                ].map(action => (
                  <label
                    key={action.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    <span>{action.label}</span>
                    <input
                      type="checkbox"
                      checked={!!currentPolicies.CRITICAL[action.key]}
                      onChange={() => handlePolicyToggle('CRITICAL', action.key)}
                      style={{ accentColor: 'var(--accent-critical)' }}
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* HIGH Playbook */}
            <div style={{
              backgroundColor: 'rgba(251, 146, 60, 0.03)',
              border: '1px solid rgba(251, 146, 60, 0.25)',
              borderRadius: '4px',
              padding: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', fontWeight: 700, color: '#fb923c' }}>
                  HIGH SEVERITY
                </span>
                <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>Suspicious Heuristics</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { key: 'createIncident', label: 'Create Incident Record' },
                  { key: 'desktopNotification', label: 'Send OS Desktop Notification' },
                  { key: 'quarantine', label: 'Automated Quarantine File' },
                  { key: 'terminateProcess', label: 'Terminate Originating Process' }
                ].map(action => (
                  <label
                    key={action.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    <span>{action.label}</span>
                    <input
                      type="checkbox"
                      checked={!!currentPolicies.HIGH[action.key]}
                      onChange={() => handlePolicyToggle('HIGH', action.key)}
                      style={{ accentColor: '#fb923c' }}
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* MEDIUM Playbook */}
            <div style={{
              backgroundColor: 'rgba(96, 165, 250, 0.03)',
              border: '1px solid rgba(96, 165, 250, 0.25)',
              borderRadius: '4px',
              padding: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', fontWeight: 700, color: '#93c5fd' }}>
                  MEDIUM SEVERITY
                </span>
                <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>Mutation Anomalies</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { key: 'createIncident', label: 'Create Incident Record' },
                  { key: 'desktopNotification', label: 'Send OS Desktop Notification' },
                  { key: 'quarantine', label: 'Automated Quarantine File' },
                  { key: 'terminateProcess', label: 'Terminate Originating Process' }
                ].map(action => (
                  <label
                    key={action.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    <span>{action.label}</span>
                    <input
                      type="checkbox"
                      checked={!!currentPolicies.MEDIUM[action.key]}
                      onChange={() => handlePolicyToggle('MEDIUM', action.key)}
                      style={{ accentColor: '#60a5fa' }}
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Kernel-Level Interceptors & Guardrails */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {kernelPolicies.map((pol) => (
            <div key={pol.id} className="sentinel-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="sentinel-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={16} style={{ color: pol.active ? 'var(--accent-safe)' : 'var(--text-muted)' }} />
                    <span className="heading-section">{pol.name}</span>
                  </div>

                  <button onClick={() => toggleKernelPolicy(pol.id)} style={{ color: pol.active ? 'var(--accent-safe)' : 'var(--text-muted)' }}>
                    {pol.active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </button>
                </div>

                <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '8px 0 16px 0' }}>
                  {pol.desc}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: '10px' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.66rem',
                  color: pol.active ? 'var(--accent-safe)' : 'var(--text-muted)',
                  backgroundColor: pol.active ? 'rgba(52, 211, 153, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-default)',
                  padding: '2px 8px',
                  borderRadius: '2px'
                }}>
                  LEVEL: {pol.level}
                </span>

                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  STATUS: {pol.active ? 'ARMED' : 'DISABLED'}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </PageContainer>
  );
}
