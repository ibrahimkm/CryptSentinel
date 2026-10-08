import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Shield, Lock, Mail, User, ShieldCheck, Key, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export function Auth({ initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup'
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Threat Intelligence Analyst',
    clearanceLevel: 'LEVEL 4 — RESTRICTED SOC'
  });
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (mode === 'signup') {
      if (formData.password !== formData.confirmPassword) {
        setError('Encryption passwords do not match');
        return;
      }
      if (!formData.name || !formData.email || !formData.password) {
        setError('Please complete all mandatory credential fields');
        return;
      }

      const res = await register(formData);
      if (res.success) {
        navigate('/command-center');
      } else {
        setError(res.error);
      }
    } else {
      if (!formData.email || !formData.password) {
        setError('Please enter your operator email and master password');
        return;
      }

      const res = await login({ email: formData.email, password: formData.password });
      if (res.success) {
        navigate('/command-center');
      } else {
        setError(res.error);
      }
    }
  };

  const handleQuickDemo = async () => {
    const res = await login({ email: 'a.vance@sentinel.defense.org', password: 'demo-password-994' });
    if (res.success) {
      navigate('/command-center');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#07090e',
      backgroundImage: `
        radial-gradient(circle at 50% 15%, rgba(30, 58, 138, 0.25) 0%, transparent 60%),
        linear-gradient(to right, rgba(30, 42, 66, 0.3) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(30, 42, 66, 0.3) 1px, transparent 1px)
      `,
      backgroundSize: '100% 100%, 28px 28px, 28px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        backgroundColor: '#0e1320',
        border: '1px solid #1e2a42',
        borderRadius: '6px',
        boxShadow: '0 12px 50px rgba(0, 0, 0, 0.8), 0 0 20px rgba(96, 165, 250, 0.1)',
        padding: '28px',
        position: 'relative'
      }}>
        {/* Brand Banner */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '6px',
            border: '2px solid var(--accent-blue)',
            margin: '0 auto 10px auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-blue)',
            boxShadow: '0 0 16px rgba(96, 165, 250, 0.3)'
          }}>
            <Shield size={24} />
          </div>
          <h1 style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--text-bright)'
          }}>
            CryptSentinel
          </h1>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.66rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginTop: '2px'
          }}>
            SECURITY OPERATIONS GATEWAY
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4px',
          backgroundColor: '#070a10',
          padding: '4px',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #182236'
        }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            style={{
              padding: '8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              borderRadius: '3px',
              backgroundColor: mode === 'login' ? '#1e2a42' : 'transparent',
              color: mode === 'login' ? '#93c5fd' : 'var(--text-muted)',
              border: mode === 'login' ? '1px solid #3b82f6' : '1px solid transparent',
              transition: 'all 0.15s ease'
            }}
          >
            SIGN IN
          </button>

          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); }}
            style={{
              padding: '8px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              borderRadius: '3px',
              backgroundColor: mode === 'signup' ? '#1e2a42' : 'transparent',
              color: mode === 'signup' ? '#93c5fd' : 'var(--text-muted)',
              border: mode === 'signup' ? '1px solid #3b82f6' : '1px solid transparent',
              transition: 'all 0.15s ease'
            }}
          >
            SIGN UP
          </button>
        </div>

        {/* Error Callout */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            backgroundColor: 'rgba(248, 113, 113, 0.1)',
            border: '1px solid rgba(248, 113, 113, 0.35)',
            borderRadius: '3px',
            color: '#fca5a5',
            fontSize: '0.74rem',
            fontFamily: 'var(--font-mono)',
            marginBottom: '16px'
          }}>
            <AlertCircle size={14} style={{ color: '#f87171', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === 'signup' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                OPERATOR FULL NAME
              </label>
              <div style={{ position: 'relative' }}>
                <User size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Vance"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '3px',
                    padding: '8px 12px 8px 32px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.76rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              OPERATOR EMAIL ADDRESS
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                required
                placeholder="operator@sentinel.defense.org"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '3px',
                  padding: '8px 12px 8px 32px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.76rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                SECURITY CLEARANCE LEVEL
              </label>
              <select
                value={formData.clearanceLevel}
                onChange={(e) => setFormData({ ...formData, clearanceLevel: e.target.value })}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '3px',
                  padding: '8px 12px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.76rem',
                  outline: 'none'
                }}
              >
                <option value="LEVEL 4 — RESTRICTED SOC & KERNEL">LEVEL 4 — RESTRICTED SOC & KERNEL</option>
                <option value="LEVEL 3 — ELEVATED INCIDENT RESPONSE">LEVEL 3 — ELEVATED INCIDENT RESPONSE</option>
                <option value="LEVEL 2 — ENDPOINT MONITORING & TRIAGE">LEVEL 2 — ENDPOINT MONITORING & TRIAGE</option>
                <option value="LEVEL 1 — READ-ONLY TELEMETRY OBSERVER">LEVEL 1 — READ-ONLY TELEMETRY OBSERVER</option>
              </select>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              MASTER ENCRYPTION KEY / PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '3px',
                  padding: '8px 12px 8px 32px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.76rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                CONFIRM PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '3px',
                    padding: '8px 12px 8px 32px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.76rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-cyber-primary"
            style={{ width: '100%', padding: '10px', fontSize: '0.78rem', marginTop: '6px' }}
          >
            <span>{loading ? 'AUTHENTICATING...' : mode === 'signup' ? 'PROVISION OPERATOR ACCOUNT' : 'AUTHENTICATE & ENTER'}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        {/* Demo Fast-Track Button */}
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          textAlign: 'center'
        }}>
          <button
            type="button"
            onClick={handleQuickDemo}
            style={{
              padding: '6px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-default)',
              borderRadius: '3px',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Key size={12} style={{ color: 'var(--accent-blue)' }} />
            <span>QUICK-FILL DEMO OPERATOR (SEC-994)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
