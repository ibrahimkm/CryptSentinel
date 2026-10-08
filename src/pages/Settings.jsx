import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/layout/PageContainer.jsx';
import { Settings as SettingsIcon, Save, Server, Bell, Sliders, Shield, Volume2, AlertTriangle, CheckCircle2, XCircle, Play } from 'lucide-react';
import { useSecurity } from '../context/SecurityContext.jsx';
import { notificationService, DEFAULT_NOTIFICATION_PREFERENCES } from '../services/notificationService.js';

export function Settings() {
  const { isSimulationMode, toggleSimulationMode } = useSecurity();
  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api');
  const [wsUrl, setWsUrl] = useState(import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/telemetry');
  const [sensitivity, setSensitivity] = useState(85);
  const [entropyThreshold, setEntropyThreshold] = useState(7.85);
  const [saved, setSaved] = useState(false);

  // Notification Preferences & Permission State
  const [notifPrefs, setNotifPrefs] = useState(notificationService.getPreferences());
  const [permissionStatus, setPermissionStatus] = useState(notificationService.getPermissionStatus());
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    const unsub = notificationService.onPreferencesChange((prefs, perm) => {
      setNotifPrefs(prefs);
      setPermissionStatus(perm);
    });
    return unsub;
  }, []);

  const handleTogglePref = (key) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    notificationService.savePreferences(updated);
  };

  const handleRequestPermission = async () => {
    const perm = await notificationService.requestPermission();
    setPermissionStatus(perm);
  };

  const handleTestNotification = () => {
    notificationService.notifyThreat({
      incidentId: `TEST-${Date.now()}`,
      severity: 'CRITICAL',
      riskScore: 96,
      threatFamily: 'Synthetic Ransomware Test',
      filePath: 'monitored_sandbox/test_doc.locked',
      action: 'QUARANTINED',
      timestamp: new Date().toISOString()
    });
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleSave = (e) => {
    e.preventDefault();
    notificationService.savePreferences(notifPrefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <PageContainer
      title="Engine Configuration & Telemetry Settings"
      subtitle="Manage backend API connections, WebSocket endpoints, entropy thresholds, heuristic model sensitivity, and OS desktop notification rules."
      breadcrumbs={['Root', 'System', 'Settings']}
      actions={
        saved ? (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-safe)' }}>
            ✓ CONFIGURATION SAVED
          </span>
        ) : null
      }
    >
      <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        
        {/* 1. Desktop Notification Preferences */}
        <div className="sentinel-card" style={{ gridColumn: '1 / -1' }}>
          <div className="sentinel-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={16} style={{ color: '#fbbf24' }} />
              <span className="heading-section">NOTIFICATIONS & OS ALERTS</span>
            </div>

            {/* Permission Status Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {permissionStatus === 'granted' && (
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem',
                  color: 'var(--accent-safe)',
                  backgroundColor: 'rgba(52, 211, 153, 0.1)',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  padding: '3px 8px',
                  borderRadius: '3px'
                }}>
                  <CheckCircle2 size={12} />
                  OS PERMISSION: GRANTED
                </span>
              )}
              {permissionStatus === 'denied' && (
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem',
                  color: 'var(--accent-critical)',
                  backgroundColor: 'rgba(248, 113, 113, 0.1)',
                  border: '1px solid rgba(248, 113, 113, 0.3)',
                  padding: '3px 8px',
                  borderRadius: '3px'
                }}>
                  <XCircle size={12} />
                  OS PERMISSION: BLOCKED
                </span>
              )}
              {permissionStatus === 'default' && (
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="btn-cyber-primary"
                  style={{ padding: '4px 10px', fontSize: '0.68rem' }}
                >
                  ENABLE DESKTOP NOTIFICATIONS
                </button>
              )}
              {permissionStatus === 'unsupported' && (
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem',
                  color: 'var(--text-muted)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  padding: '3px 8px',
                  borderRadius: '3px'
                }}>
                  NOTIFICATION API UNSUPPORTED
                </span>
              )}
            </div>
          </div>

          {/* Blocked Permission Warning Message */}
          {permissionStatus === 'denied' && (
            <div style={{
              margin: '0 0 16px 0',
              padding: '10px 14px',
              backgroundColor: 'rgba(248, 113, 113, 0.1)',
              border: '1px solid rgba(248, 113, 113, 0.3)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.78rem',
              color: '#fca5a5'
            }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, color: '#f87171' }} />
              <span>Desktop notifications are blocked. Enable them in browser/system settings.</span>
            </div>
          )}

          {/* Settings Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            
            {/* Desktop Notifications Main Toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-default)',
              borderRadius: '3px'
            }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  Desktop Notifications
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Deliver native OS desktop banner alerts
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleTogglePref('desktopNotifications')}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '2px',
                  backgroundColor: notifPrefs.desktopNotifications ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  color: notifPrefs.desktopNotifications ? 'var(--accent-safe)' : 'var(--text-muted)',
                  border: notifPrefs.desktopNotifications ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid var(--border-default)'
                }}
              >
                {notifPrefs.desktopNotifications ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Critical Threat Alerts */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-default)',
              borderRadius: '3px'
            }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  Critical Threat Alerts
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Notify on confirmed ransomware & high entropy waves
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleTogglePref('criticalThreats')}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '2px',
                  backgroundColor: notifPrefs.criticalThreats ? 'rgba(248, 113, 113, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  color: notifPrefs.criticalThreats ? '#fca5a5' : 'var(--text-muted)',
                  border: notifPrefs.criticalThreats ? '1px solid rgba(248, 113, 113, 0.4)' : '1px solid var(--border-default)'
                }}
              >
                {notifPrefs.criticalThreats ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* High Threat Alerts */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-default)',
              borderRadius: '3px'
            }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  High Threat Alerts
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Notify on suspicious mutation patterns & anomalies
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleTogglePref('highThreats')}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '2px',
                  backgroundColor: notifPrefs.highThreats ? 'rgba(251, 146, 60, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  color: notifPrefs.highThreats ? '#fdba74' : 'var(--text-muted)',
                  border: notifPrefs.highThreats ? '1px solid rgba(251, 146, 60, 0.4)' : '1px solid var(--border-default)'
                }}
              >
                {notifPrefs.highThreats ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Quarantine Notifications */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-default)',
              borderRadius: '3px'
            }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  Quarantine Notifications
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Notify when infected files are moved to vault
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleTogglePref('quarantine')}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '2px',
                  backgroundColor: notifPrefs.quarantine ? 'rgba(96, 165, 250, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  color: notifPrefs.quarantine ? '#93c5fd' : 'var(--text-muted)',
                  border: notifPrefs.quarantine ? '1px solid rgba(96, 165, 250, 0.4)' : '1px solid var(--border-default)'
                }}
              >
                {notifPrefs.quarantine ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Process Termination Alerts */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-default)',
              borderRadius: '3px'
            }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  Process Termination Alerts
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Notify on automated/manual process kills
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleTogglePref('processTermination')}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '2px',
                  backgroundColor: notifPrefs.processTermination ? 'rgba(96, 165, 250, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  color: notifPrefs.processTermination ? '#93c5fd' : 'var(--text-muted)',
                  border: notifPrefs.processTermination ? '1px solid rgba(96, 165, 250, 0.4)' : '1px solid var(--border-default)'
                }}
              >
                {notifPrefs.processTermination ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Notification Sound */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-default)',
              borderRadius: '3px'
            }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  Notification Sound
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Play synthesized audio alert chime on events
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleTogglePref('sound')}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '2px',
                  backgroundColor: notifPrefs.sound ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  color: notifPrefs.sound ? 'var(--accent-safe)' : 'var(--text-muted)',
                  border: notifPrefs.sound ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid var(--border-default)'
                }}
              >
                {notifPrefs.sound ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Test Notification Trigger */}
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleTestNotification}
              className="btn-cyber-ghost"
              style={{ padding: '6px 14px', fontSize: '0.72rem' }}
            >
              <Play size={13} />
              <span>TEST OS NOTIFICATION & SOUND</span>
            </button>
            {testSent && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-safe)' }}>
                ✓ Test notification triggered
              </span>
            )}
          </div>
        </div>

        {/* 2. Connection Endpoints */}
        <div className="sentinel-card">
          <div className="sentinel-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server size={16} style={{ color: 'var(--accent-blue)' }} />
              <span className="heading-section">Backend Telemetry Endpoints</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                REST API BASE URL
              </label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '3px',
                  padding: '8px 12px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.74rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                WEBSOCKET TELEMETRY URL
              </label>
              <input
                type="text"
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '3px',
                  padding: '8px 12px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.74rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        </div>

        {/* 3. Engine Heuristic Tuning */}
        <div className="sentinel-card">
          <div className="sentinel-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={16} style={{ color: '#fb923c' }} />
              <span className="heading-section">Autonomous Threshold Tuning</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>HEURISTIC SENSITIVITY INDEX</span>
                <span style={{ color: '#fb923c', fontWeight: 600 }}>{sensitivity}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="99"
                value={sensitivity}
                onChange={(e) => setSensitivity(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#fb923c' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>CRITICAL ENTROPY LOCK THRESHOLD</span>
                <span style={{ color: '#f87171', fontWeight: 600 }}>{entropyThreshold}</span>
              </div>
              <input
                type="range"
                min="6.00"
                max="8.00"
                step="0.05"
                value={entropyThreshold}
                onChange={(e) => setEntropyThreshold(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#f87171' }}
              />
            </div>
          </div>
        </div>

        {/* Action button */}
        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="submit" className="btn-cyber-primary" style={{ padding: '8px 20px' }}>
            <Save size={14} />
            <span>SAVE SETTINGS</span>
          </button>
        </div>
      </form>
    </PageContainer>
  );
}
