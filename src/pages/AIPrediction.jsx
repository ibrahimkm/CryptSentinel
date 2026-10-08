import React from 'react';
import { PageContainer } from '../components/layout/PageContainer.jsx';
import { RiskChart } from '../components/visualizations/RiskChart.jsx';
import { FeatureImportance } from '../components/visualizations/FeatureImportance.jsx';
import { TrendingUp } from 'lucide-react';
import { useSecurity } from '../context/SecurityContext.jsx';
import { LoadingState } from '../components/common/LoadingState.jsx';

export function AIPrediction() {
  const { prediction, isLoading } = useSecurity();

  if (isLoading || !prediction) {
    return <LoadingState message="COMPUTING HEURISTIC ENSEMBLE PREDICTIONS..." />;
  }

  return (
    <PageContainer>
      {/* Top Prediction Summary Grid matching Screenshot 2 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '16px'
      }}>
        {/* Ransomware Prediction Probability Main Card */}
        <div className="sentinel-card">
          <div className="sentinel-card-header">
            <div>
              <span className="heading-section">RANSOMWARE PREDICTION PROBABILITY</span>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                color: '#f87171',
                fontWeight: 600,
                marginTop: '2px',
                letterSpacing: '0.08em'
              }}>
                {prediction.status}
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'rgba(248, 113, 113, 0.1)',
              border: '1px solid rgba(248, 113, 113, 0.3)',
              color: '#fca5a5',
              padding: '3px 8px',
              borderRadius: '2px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              fontWeight: 600
            }}>
              <TrendingUp size={12} />
              <span>+{prediction.trendPercent}% in {prediction.trendSeconds}s</span>
            </div>
          </div>

          <div style={{ margin: '18px 0 14px 0' }}>
            <div style={{
              fontSize: '4.5rem',
              fontWeight: 300,
              fontFamily: 'var(--font-sans)',
              color: '#fca5a5',
              lineHeight: 1,
              display: 'flex',
              alignItems: 'baseline'
            }}>
              <span>{prediction.ransomwareProbability}</span>
              <span style={{ fontSize: '2rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginLeft: '4px' }}>%</span>
            </div>
          </div>

          {/* Underline Progress Bar */}
          <div style={{
            height: '4px',
            width: '100%',
            backgroundColor: '#161e2e',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${prediction.ransomwareProbability}%`,
              backgroundColor: '#f87171',
              borderRadius: '2px'
            }} />
          </div>
        </div>

        {/* Right Stack: Prediction Horizon & Confidence Score */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Prediction Horizon */}
          <div className="sentinel-card" style={{ flex: 1 }}>
            <div className="sentinel-card-header">
              <span className="heading-section">PREDICTION HORIZON</span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '2.5rem', fontFamily: 'var(--font-mono)', fontWeight: 500, color: '#fb923c', lineHeight: 1 }}>
                  {prediction.predictionHorizonMinutes}
                </span>
                <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  MINUTES
                </span>
              </div>
              <p style={{
                fontSize: '0.68rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginTop: '6px'
              }}>
                {prediction.predictionHorizonLabel}
              </p>
            </div>
          </div>

          {/* Confidence Score */}
          <div className="sentinel-card" style={{ flex: 1 }}>
            <div className="sentinel-card-header">
              <span className="heading-section">CONFIDENCE SCORE</span>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '2.2rem', fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--text-bright)', lineHeight: 1 }}>
                  {prediction.confidenceScore}
                </span>
                <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  %
                </span>
              </div>

              {/* Segmented confidence bars */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '10px' }}>
                {[1, 2, 3, 4].map((bar) => (
                  <div
                    key={bar}
                    style={{
                      height: '5px',
                      backgroundColor: bar <= 3 ? '#93c5fd' : '#334155',
                      borderRadius: '2px'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Probability Trajectory (T-60s) & Attribution Breakdown matching Screenshot 2 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '16px',
        marginTop: '16px'
      }}>
        <RiskChart
          data={prediction.trajectoryHistory}
          modelName={prediction.modelName}
          currentScore={prediction.ransomwareProbability}
        />
        <FeatureImportance attributions={prediction.attributions} />
      </div>
    </PageContainer>
  );
}
