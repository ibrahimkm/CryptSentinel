import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout.jsx';
import { SecurityProvider } from './context/SecurityContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

// Pages
import { CommandCenter } from './pages/CommandCenter.jsx';
import { ThreatRadar } from './pages/ThreatRadar.jsx';
import { AIPrediction } from './pages/AIPrediction.jsx';
import { FileProtection } from './pages/FileProtection.jsx';
import { ProcessObservatory } from './pages/ProcessObservatory.jsx';
import { AttackGraph } from './pages/AttackGraph.jsx';
import { Incidents } from './pages/Incidents.jsx';
import { Investigation } from './pages/Investigation.jsx';
import { SecurityAnalytics } from './pages/SecurityAnalytics.jsx';
import { ThreatHistory } from './pages/ThreatHistory.jsx';
import { AIObservatory } from './pages/AIObservatory.jsx';
import { CyberPulse } from './pages/CyberPulse.jsx';
import { Protection } from './pages/Protection.jsx';
import { ProtectedZones } from './pages/ProtectedZones.jsx';
import { Alerts } from './pages/Alerts.jsx';
import { SecurityReport } from './pages/SecurityReport.jsx';
import { Settings } from './pages/Settings.jsx';
import { Auth } from './pages/Auth.jsx';

export default function App() {
  return (
    <AuthProvider>
      <SecurityProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Auth initialMode="login" />} />
          <Route path="/signin" element={<Auth initialMode="login" />} />
          <Route path="/signup" element={<Auth initialMode="signup" />} />
          <Route path="/register" element={<Auth initialMode="signup" />} />

          {/* Protected Application Routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/command-center" replace />} />
            <Route path="/command-center" element={<CommandCenter />} />
            <Route path="/threat-radar" element={<ThreatRadar />} />
            <Route path="/ai-prediction" element={<AIPrediction />} />
            <Route path="/file-protection" element={<FileProtection />} />
            <Route path="/process-observatory" element={<ProcessObservatory />} />
            <Route path="/attack-graph" element={<AttackGraph />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/investigation" element={<Investigation />} />
            <Route path="/security-analytics" element={<SecurityAnalytics />} />
            <Route path="/threat-history" element={<ThreatHistory />} />
            <Route path="/ai-observatory" element={<AIObservatory />} />
            <Route path="/cyberpulse" element={<CyberPulse />} />
            <Route path="/protection" element={<Protection />} />
            <Route path="/protected-zones" element={<ProtectedZones />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/security-report" element={<SecurityReport />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/command-center" replace />} />
          </Route>
        </Routes>
      </SecurityProvider>
    </AuthProvider>
  );
}
