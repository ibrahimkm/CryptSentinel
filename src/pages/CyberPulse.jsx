import React from 'react';
import { PageContainer } from '../components/layout/PageContainer.jsx';
import { ThreatTimeline } from '../components/visualizations/ThreatTimeline.jsx';
import { BehavioralField } from '../components/visualizations/BehavioralField.jsx';
import { initialCyberPulse } from '../data/mockData.js';

export function CyberPulse() {
  return (
    <PageContainer>
      <div style={{
        display: 'flex',
        gap: '16px',
        height: 'calc(100vh - 110px)',
        minHeight: '520px'
      }}>
        {/* Left: Threat Trajectory Large Visualization */}
        <ThreatTimeline
          status={initialCyberPulse.threatTrajectoryStatus}
          currentScore={initialCyberPulse.currentRiskScore}
        />

        {/* Right: Live Telemetry & Initiate Containment Button */}
        <BehavioralField
          entropyRate={initialCyberPulse.fileEntropyRate}
          baseEntropy={initialCyberPulse.fileEntropyBase}
          entropyChange={initialCyberPulse.fileEntropyChange}
          diskWriteRate={initialCyberPulse.abnormalDiskWrite}
          diskTarget={initialCyberPulse.abnormalDiskWriteTarget}
          diskChange={initialCyberPulse.abnormalDiskWriteChange}
          processes={initialCyberPulse.monitoredProcesses}
        />
      </div>
    </PageContainer>
  );
}
