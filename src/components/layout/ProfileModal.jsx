import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../common/Modal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { User, ShieldCheck, Key, Laptop, Globe, Clock, LogOut, Edit3, Check, X } from 'lucide-react';

export function ProfileModal({ isOpen, onClose }) {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    role: user?.role || '',
    operatorCallsign: user?.operatorCallsign || '',
    assignedStation: user?.assignedStation || ''
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!user) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    await updateProfile(formData);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/login');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="OPERATOR CREDENTIALS & SECURITY CLEARANCE"
      maxWidth="580px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* User Identity Header Card */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          {/* Avatar Graphic */}
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: '#162034',
            border: '2px solid var(--accent-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#93c5fd',
            boxShadow: '0 0 16px rgba(96, 165, 250, 0.3)',
            flexShrink: 0
          }}>
            <User size={28} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--text-bright)',
                fontFamily: 'var(--font-sans)',
                letterSpacing: '-0.01em'
              }}>
                {user.name}
              </h3>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '2px',
                backgroundColor: 'rgba(96, 165, 250, 0.15)',
                color: '#93c5fd',
                border: '1px solid rgba(96, 165, 250, 0.3)'
              }}>
                {user.operatorCallsign || 'SEC-994'}
              </span>
            </div>

            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {user.role}
            </div>

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {user.email}
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            style={{
              padding: '6px 10px',
              backgroundColor: isEditing ? 'rgba(96, 165, 250, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-default)',
              borderRadius: '3px',
              color: isEditing ? '#93c5fd' : 'var(--text-secondary)',
              fontSize: '0.72rem',
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isEditing ? <X size={13} /> : <Edit3 size={13} />}
            <span>{isEditing ? 'CANCEL' : 'EDIT'}</span>
          </button>
        </div>

        {/* Edit Profile Form */}
        {isEditing ? (
          <form onSubmit={handleSave} style={{
            backgroundColor: 'rgba(10, 15, 25, 0.6)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                FULL OPERATOR NAME
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '3px',
                  padding: '6px 10px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.76rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                OPERATIONAL ROLE
              </label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '3px',
                  padding: '6px 10px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.76rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  CALLSIGN
                </label>
                <input
                  type="text"
                  value={formData.operatorCallsign}
                  onChange={(e) => setFormData({ ...formData, operatorCallsign: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '3px',
                    padding: '6px 10px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.76rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  STATION ID
                </label>
                <input
                  type="text"
                  value={formData.assignedStation}
                  onChange={(e) => setFormData({ ...formData, assignedStation: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '3px',
                    padding: '6px 10px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.76rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="submit" className="btn-cyber-primary" style={{ padding: '6px 14px', fontSize: '0.72rem' }}>
                <Check size={13} />
                <span>SAVE PROFILE</span>
              </button>
            </div>
          </form>
        ) : null}

        {saveSuccess && (
          <div style={{
            padding: '8px 12px',
            backgroundColor: 'rgba(52, 211, 153, 0.1)',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            borderRadius: '3px',
            color: 'var(--accent-safe)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            textAlign: 'center'
          }}>
            ✓ OPERATOR PROFILE UPDATED SUCCESSFULLY
          </div>
        )}

        {/* Clearance Level Alert Bar */}
        <div style={{
          backgroundColor: 'rgba(96, 165, 250, 0.06)',
          border: '1px solid rgba(96, 165, 250, 0.25)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={20} style={{ color: '#60a5fa' }} />
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                ACTIVE CLEARANCE
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700, color: '#bfdbfe' }}>
                {user.clearanceLevel}
              </div>
            </div>
          </div>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            padding: '2px 8px',
            borderRadius: '2px',
            backgroundColor: 'rgba(52, 211, 153, 0.15)',
            color: 'var(--accent-safe)',
            border: '1px solid rgba(52, 211, 153, 0.3)'
          }}>
            AUTHENTICATED
          </span>
        </div>

        {/* Security & Session Metadata Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px'
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-default)',
            borderRadius: '3px',
            padding: '10px 12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <Laptop size={12} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>ASSIGNED STATION</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-primary)' }}>
              {user.assignedStation}
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-default)',
            borderRadius: '3px',
            padding: '10px 12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <Globe size={12} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>TERMINAL IP ADDRESS</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-primary)' }}>
              {user.ipAddress}
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-default)',
            borderRadius: '3px',
            padding: '10px 12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <Key size={12} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>MFA METHOD</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: '#93c5fd' }}>
              {user.mfaMethod}
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-default)',
            borderRadius: '3px',
            padding: '10px 12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <Clock size={12} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>SESSION ACTIVE SINCE</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-primary)' }}>
              {user.sessionStartedAt}
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          paddingTop: '14px',
          marginTop: '4px'
        }}>
          <button
            onClick={handleLogout}
            className="btn-cyber-danger"
            style={{ padding: '8px 14px', fontSize: '0.72rem' }}
          >
            <LogOut size={13} />
            <span>TERMINATE SESSION & SIGN OUT</span>
          </button>

          <button
            onClick={onClose}
            className="btn-cyber-ghost"
            style={{ padding: '8px 16px', fontSize: '0.72rem' }}
          >
            CLOSE
          </button>
        </div>
      </div>
    </Modal>
  );
}
