import React from 'react';
import { PageContainer } from '../components/layout/PageContainer.jsx';
import { FileText, Download, CheckCircle2, ShieldCheck, Award } from 'lucide-react';

export function SecurityReport() {
  const compliance = [
    { standard: 'NIST CSF v2.0', score: 98, status: 'AUDIT_READY', controls: '108 / 108 Verified' },
    { standard: 'ISO / IEC 27001:2022', score: 96, status: 'COMPLIANT', controls: '93 / 93 Verified' },
    { standard: 'SOC 2 Type II (Security & Confidentiality)', score: 99, status: 'CERTIFIED', controls: '64 / 64 Verified' },
    { standard: 'HIPAA Security Rule (Ransomware Resilience)', score: 100, status: 'MAX_RESILIENCE', controls: '42 / 42 Verified' }
  ];

  const handleDownloadReport = () => {
    const content = `CryptSentinel AI Security Audit & Compliance Assessment\nGenerated: ${new Date().toISOString()}\nAggregate System Posture: PROTECTED\nThreat Mitigation Rate: 99.8%\nAll ransomware tripwires active.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CryptSentinel-Executive-Security-Report-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageContainer
      title="Executive Security Posture & Compliance Report"
      subtitle="Automated regulatory audit validation, ransomware resilience index, and compliance assessment certificates."
      breadcrumbs={['Root', 'Compliance', 'Security Report']}
      actions={
        <button onClick={handleDownloadReport} className="btn-cyber-primary" style={{ padding: '6px 12px' }}>
          <Download size={13} />
          <span>GENERATE AUDIT REPORT</span>
        </button>
      }
    >
      {/* Executive Summary Card */}
      <div className="sentinel-card" style={{ padding: '24px' }}>
        <div className="sentinel-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} style={{ color: 'var(--accent-safe)' }} />
            <span className="heading-section">EXECUTIVE POSTURE SUMMARY</span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-safe)' }}>
            STATUS: MAXIMUM DEFENSE RESILIENCE
          </span>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '8px' }}>
          During the current operational cycle, CryptSentinel intercepted and autonomously neutralized 100% of malicious encryption vectors with a mean dwell time of <strong>1.4 minutes</strong>. Autonomous process quarantine and write-rate limiting prevented any unauthorized irreversible data mutation across protected volume zones.
        </p>
      </div>

      {/* Compliance Standards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {compliance.map((item) => (
          <div key={item.standard} className="sentinel-card">
            <div className="sentinel-card-header">
              <span className="heading-section">{item.standard}</span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.66rem',
                color: 'var(--accent-safe)',
                backgroundColor: 'rgba(52, 211, 153, 0.1)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                padding: '2px 6px',
                borderRadius: '2px'
              }}>
                {item.status}
              </span>
            </div>

            <div style={{ margin: '12px 0' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '2.2rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-safe)', fontWeight: 600 }}>
                  {item.score}
                </span>
                <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>%</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                {item.controls}
              </div>
            </div>

            <div style={{ height: '4px', width: '100%', backgroundColor: '#141c2c', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${item.score}%`, backgroundColor: 'var(--accent-safe)' }} />
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
