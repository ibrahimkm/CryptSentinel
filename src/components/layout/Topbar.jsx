import React, { useState, useEffect } from 'react';
import { Clock, Bell, Shield, User, Circle } from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Drawer } from '../common/Drawer.jsx';
import { ProfileModal } from './ProfileModal.jsx';

export function Topbar() {
  const { systemPosture, alerts, isWsConnected, notificationDrawerOpen, setNotificationDrawerOpen } = useSecurity();
  const { user } = useAuth();
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [timeUtc, setTimeUtc] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      setTimeUtc(`${hours}:${minutes}:${seconds} UTC`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const unreadAlertsCount = alerts.filter(a => !a.read).length;
  const statusLabel = systemPosture?.status || 'PROTECTED';
  const threatProb = systemPosture?.aggregateProbability ?? (systemPosture?.threatProbability ?? 12);

  return (
    <>
      <header
        style={{
          height: 'var(--topbar-height)',
          backgroundColor: 'var(--bg-topbar)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          zIndex: 900
        }}
      >
        {/* Left Status Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: statusLabel === 'CRITICAL' ? 'var(--accent-critical)' : statusLabel === 'ELEVATED' ? 'var(--accent-warning)' : 'var(--text-primary)'
            }}>
              SYSTEM ARMED / {statusLabel}
            </span>
          </div>

          <div style={{
            height: '14px',
            width: '1px',
            backgroundColor: 'var(--border-medium)'
          }} />

          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            letterSpacing: '0.08em',
            color: 'var(--text-secondary)'
          }}>
            THREAT PROBABILITY:{' '}
            <span style={{
              fontWeight: 700,
              color: threatProb > 50 ? 'var(--accent-critical)' : threatProb > 25 ? 'var(--accent-warning)' : '#93c5fd'
            }}>
              {Math.round(threatProb)}%
            </span>
          </div>
        </div>

        {/* Right Tools & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Connection Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.68rem',
            letterSpacing: '0.08em',
            color: isWsConnected ? 'var(--accent-safe)' : 'var(--text-muted)'
          }}>
            <Circle
              size={7}
              fill={isWsConnected ? 'var(--accent-safe)' : 'transparent'}
              color={isWsConnected ? 'var(--accent-safe)' : 'var(--text-muted)'}
            />
            <span>{isWsConnected ? 'LIVE' : 'DISCONNECTED'}</span>
          </div>

          {/* Clock */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            color: 'var(--text-secondary)'
          }}>
            <Clock size={14} style={{ color: 'var(--text-muted)' }} />
            <span>{timeUtc}</span>
          </div>

          {/* Alert Bell */}
          <button
            onClick={() => setNotificationDrawerOpen(true)}
            style={{
              position: 'relative',
              padding: '6px',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '3px'
            }}
            aria-label="Alerts"
          >
            <Bell size={16} />
            {unreadAlertsCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                backgroundColor: 'var(--accent-critical)',
                color: '#fff',
                fontSize: '0.55rem',
                fontWeight: 700,
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-mono)'
              }}>
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* User Profile Avatar & Callout Button */}
          <button
            onClick={() => setProfileModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '3px 8px 3px 4px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-default)',
              borderRadius: '20px',
              transition: 'all 0.15s ease'
            }}
            className="hover:border-blue-500"
            title="View Operator Profile & Clearance"
            aria-label="Operator Profile"
          >
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#1a2438',
              border: '1px solid var(--border-medium)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-blue)'
            }}>
              <User size={13} />
            </div>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: '#cbd5e1',
              fontWeight: 500
            }}>
              {user?.operatorCallsign || user?.name || 'SEC-994'}
            </span>
          </button>
        </div>
      </header>

      {/* Notifications Drawer */}
      <Drawer
        isOpen={notificationDrawerOpen}
        onClose={() => setNotificationDrawerOpen(false)}
        title="LIVE ALERT FEED & TELEMETRY"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {alerts.map((alert) => (
            <div
              key={alert.id}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px',
                borderLeft: alert.severity === 'CRITICAL' ? '3px solid var(--accent-critical)' : alert.severity === 'HIGH' ? '3px solid var(--accent-danger)' : '3px solid var(--accent-warning)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: alert.severity === 'CRITICAL' ? 'var(--accent-critical)' : alert.severity === 'HIGH' ? 'var(--accent-danger)' : 'var(--accent-warning)'
                }}>
                  {alert.severity}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  {alert.time}
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                {alert.title}
              </p>
            </div>
          ))}
        </div>
      </Drawer>

      {/* Profile Details Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </>
  );
}
