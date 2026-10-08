import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Radio,
  BrainCircuit,
  ShieldAlert,
  Eye,
  Network,
  AlertOctagon,
  Search,
  BarChart3,
  History,
  Cpu,
  Activity,
  Shield,
  FolderLock,
  Bell,
  FileText,
  Settings,
  Flame,
  Menu,
  X
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext.jsx';
import { useResponsive } from '../../hooks/useResponsive.js';

const iconMap = {
  '/command-center': LayoutDashboard,
  '/threat-radar': Radio,
  '/ai-prediction': BrainCircuit,
  '/file-protection': ShieldAlert,
  '/process-observatory': Eye,
  '/attack-graph': Network,
  '/incidents': AlertOctagon,
  '/investigation': Search,
  '/security-analytics': BarChart3,
  '/threat-history': History,
  '/ai-observatory': Cpu,
  '/cyberpulse': Activity,
  '/protection': Shield,
  '/protected-zones': FolderLock,
  '/alerts': Bell,
  '/security-report': FileText,
  '/settings': Settings
};

const navItems = [
  { path: '/command-center', label: 'Command Center' },
  { path: '/threat-radar', label: 'Threat Radar' },
  { path: '/ai-prediction', label: 'AI Prediction' },
  { path: '/file-protection', label: 'File Protection' },
  { path: '/process-observatory', label: 'Process Observatory' },
  { path: '/attack-graph', label: 'Attack Graph' },
  { path: '/incidents', label: 'Incidents' },
  { path: '/investigation', label: 'Investigation' },
  { path: '/security-analytics', label: 'Security Analytics' },
  { path: '/threat-history', label: 'Threat History' },
  { path: '/ai-observatory', label: 'AI Observatory' },
  { path: '/cyberpulse', label: 'CyberPulse' },
  { path: '/protection', label: 'Protection' },
  { path: '/protected-zones', label: 'Protected Zones' },
  { path: '/alerts', label: 'Alerts' },
  { path: '/security-report', label: 'Security Report' },
  { path: '/settings', label: 'Settings' }
];

export function Sidebar() {
  const { isSimulationMode, toggleSimulationMode } = useSecurity();
  const { isMobile } = useResponsive();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMobile = () => setMobileMenuOpen(prev => !prev);
  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <>
      {/* Mobile Trigger Button */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          top: '10px',
          left: '12px',
          zIndex: 10001,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <button
            onClick={toggleMobile}
            style={{
              padding: '6px',
              backgroundColor: 'var(--bg-topbar)',
              border: '1px solid var(--border-default)',
              borderRadius: '4px',
              color: 'var(--text-primary)'
            }}
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      )}

      {/* Main Sidebar */}
      <aside
        style={{
          width: 'var(--sidebar-width)',
          height: '100vh',
          backgroundColor: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9990,
          transition: 'transform 0.25s ease',
          position: isMobile ? 'fixed' : 'relative',
          transform: isMobile && !mobileMenuOpen ? 'translateX(-100%)' : 'translateX(0)',
          top: 0,
          left: 0
        }}
      >
        {/* Brand Header */}
        <div style={{
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.03)'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '4px',
            border: '1.5px solid var(--accent-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-blue)',
            boxShadow: '0 0 10px rgba(96, 165, 250, 0.25)'
          }}>
            <Shield size={16} />
          </div>
          <div>
            <h1 style={{
              fontSize: '0.95rem',
              fontWeight: 700,
              letterSpacing: '-0.01em',
              color: 'var(--text-bright)',
              lineHeight: 1.1
            }}>
              CryptSentinel
            </h1>
            <span style={{
              fontSize: '0.62rem',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)'
            }}>
              AI MONITORING
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
          {navItems.map((item) => {
            const Icon = iconMap[item.path] || LayoutDashboard;
            const isActive = location.pathname === item.path || (item.path === '/command-center' && location.pathname === '/');

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMobile}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '7px 12px',
                  borderRadius: '3px',
                  textDecoration: 'none',
                  fontSize: '0.78rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#60a5fa' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'rgba(30, 42, 66, 0.85)' : 'transparent',
                  borderLeft: isActive ? '3px solid #60a5fa' : '3px solid transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={15} style={{ opacity: isActive ? 1 : 0.7, color: isActive ? '#60a5fa' : 'inherit' }} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div style={{
          padding: '14px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <button
            onClick={toggleSimulationMode}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '9px 12px',
              borderRadius: '3px',
              backgroundColor: isSimulationMode ? 'rgba(96, 165, 250, 0.25)' : 'rgba(255, 255, 255, 0.04)',
              border: isSimulationMode ? '1px solid #60a5fa' : '1px solid var(--border-default)',
              color: isSimulationMode ? '#bfdbfe' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              transition: 'all 0.2s ease',
              boxShadow: isSimulationMode ? '0 0 12px rgba(96, 165, 250, 0.2)' : 'none'
            }}
          >
            <Flame size={14} style={{ color: isSimulationMode ? '#60a5fa' : 'inherit' }} />
            <span>{isSimulationMode ? 'SIMULATION MODE' : 'LIVE ENGINE'}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {isMobile && mobileMenuOpen && (
        <div
          onClick={closeMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(2px)',
            zIndex: 9980
          }}
        />
      )}
    </>
  );
}
