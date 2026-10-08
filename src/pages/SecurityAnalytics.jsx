import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/layout/PageContainer.jsx';
import { analyticsService } from '../services/analyticsService.js';
import { BarChart3, TrendingDown, ShieldCheck, Activity } from 'lucide-react';
import { LoadingState } from '../components/common/LoadingState.jsx';

export function SecurityAnalytics() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await analyticsService.getSecurityAnalytics();
        setData(res);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading || !data) return <LoadingState message="COMPILING SECURITY METRICS & ATT&CK COVERAGE..." />;

  return (
    <PageContainer
      title="Security Posture Analytics & MITRE ATT&CK Matrix"
      subtitle="Autonomous defense metrics, dwell time benchmarks, and coverage across adversary tactical domains."
      breadcrumbs={['Root', 'Analytics', 'Security Overview']}
    >
      {/* Top Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div className="sentinel-card">
          <span className="heading-section">AVG DWELL TIME</span>
          <div style={{ fontSize: '2.2rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-safe)', fontWeight: 600, margin: '4px 0' }}>
            {data.dwellTimeAvgMinutes} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>min</span>
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            -82% REDUCTION FROM INDUSTRY AVG
          </span>
        </div>

        <div className="sentinel-card">
          <span className="heading-section">THREATS INTERCEPTED</span>
          <div style={{ fontSize: '2.2rem', fontFamily: 'var(--font-mono)', color: '#93c5fd', fontWeight: 600, margin: '4px 0' }}>
            {data.threatsPrevented30d}
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            PAST 30 DAYS CLUSTER VOLUME
          </span>
        </div>

        <div className="sentinel-card">
          <span className="heading-section">AUTONOMOUS CONTAINMENT</span>
          <div style={{ fontSize: '2.2rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-safe)', fontWeight: 600, margin: '4px 0' }}>
            {data.autonomousContainmentRate}%
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            ZERO MANUAL INTERVENTION REQUIRED
          </span>
        </div>

        <div className="sentinel-card">
          <span className="heading-section">MITRE COVERAGE</span>
          <div style={{ fontSize: '2.2rem', fontFamily: 'var(--font-mono)', color: '#fb923c', fontWeight: 600, margin: '4px 0' }}>
            {data.mitreCoverageScore}%
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            ENTERPRISE ATT&CK MATRIX
          </span>
        </div>
      </div>

      {/* MITRE Coverage Heatmap & Vector Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px', minHeight: '400px' }}>
        {/* MITRE Coverage List */}
        <div className="sentinel-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="sentinel-card-header">
            <span className="heading-section">Tactical MITRE ATT&CK Coverage</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.mitreTactics.map((tac) => (
              <div key={tac.name} style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '10px 12px', borderRadius: '3px', border: '1px solid var(--border-default)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.74rem' }}>
                  <span style={{ color: 'var(--text-bright)', fontWeight: 500 }}>{tac.name}</span>
                  <span style={{ color: '#93c5fd' }}>{tac.coverage}% ({tac.detections} detections)</span>
                </div>

                <div style={{ height: '4px', width: '100%', backgroundColor: '#141c2c', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${tac.coverage}%`, backgroundColor: tac.coverage > 90 ? 'var(--accent-safe)' : '#fb923c' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vector Distribution */}
        <div className="sentinel-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="sentinel-card-header">
            <span className="heading-section">Attack Vector Distribution</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
            {data.vectorDistribution.map((vec) => (
              <div key={vec.name} style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '3px', border: '1px solid var(--border-default)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.74rem' }}>
                  <span style={{ color: 'var(--text-bright)' }}>{vec.name}</span>
                  <span style={{ color: '#fb923c', fontWeight: 600 }}>{vec.percentage}%</span>
                </div>

                <div style={{ height: '4px', width: '100%', backgroundColor: '#141c2c', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${vec.percentage}%`, backgroundColor: '#f87171' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
