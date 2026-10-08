import React, { useState, useEffect } from 'react';
import { PageContainer } from '../components/layout/PageContainer.jsx';
import { protectedZoneService } from '../services/protectedZoneService.js';
import { FolderLock, Lock, Unlock, Plus, ShieldCheck, AlertTriangle } from 'lucide-react';
import { LoadingState } from '../components/common/LoadingState.jsx';
import { Modal } from '../components/common/Modal.jsx';

export function ProtectedZones() {
  const [zones, setZones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZonePath, setNewZonePath] = useState('');

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await protectedZoneService.getProtectedZones();
        setZones(res);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const toggleLock = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'LOCKED' ? 'ARMED' : 'LOCKED';
    await protectedZoneService.toggleZoneLock(id, nextStatus === 'LOCKED');
    setZones(prev => prev.map(z => z.id === id ? { ...z, status: nextStatus } : z));
  };

  const handleAddZone = async (e) => {
    e.preventDefault();
    if (!newZoneName || !newZonePath) return;
    const created = await protectedZoneService.addProtectedZone({
      name: newZoneName,
      path: newZonePath,
      immutability: 'ENFORCED'
    });
    setZones(prev => [...prev, created]);
    setNewZoneName('');
    setNewZonePath('');
    setAddModalOpen(false);
  };

  if (isLoading) return <LoadingState message="AUDITING PROTECTED DIRECTORY VAULTS..." />;

  return (
    <PageContainer
      title="Protected Storage Zones & Immutability Vaults"
      subtitle="Define zero-trust directory isolation, hardware canary deployment, and write-once-read-many (WORM) storage locks."
      breadcrumbs={['Root', 'Storage', 'Protected Zones']}
      actions={
        <button onClick={() => setAddModalOpen(true)} className="btn-cyber-primary" style={{ padding: '6px 12px' }}>
          <Plus size={13} />
          <span>ADD PROTECTED ZONE</span>
        </button>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {zones.map((zone) => {
          const isLocked = zone.status === 'LOCKED';
          return (
            <div key={zone.id} className="sentinel-card">
              <div className="sentinel-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FolderLock size={16} style={{ color: isLocked ? '#f87171' : 'var(--accent-blue)' }} />
                  <span className="heading-section">{zone.name}</span>
                </div>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.66rem',
                  color: isLocked ? '#f87171' : 'var(--accent-safe)',
                  backgroundColor: isLocked ? 'rgba(248, 113, 113, 0.1)' : 'rgba(52, 211, 153, 0.1)',
                  border: isLocked ? '1px solid rgba(248, 113, 113, 0.3)' : '1px solid rgba(52, 211, 153, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '2px'
                }}>
                  {zone.status}
                </span>
              </div>

              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--text-bright)', backgroundColor: 'var(--bg-input)', padding: '6px 10px', borderRadius: '3px', border: '1px solid var(--border-default)', margin: '8px 0 14px 0' }}>
                {zone.path}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: '10px', marginBottom: '14px' }}>
                <div>
                  <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>CANARIES</span>
                  <div style={{ fontSize: '1rem', fontFamily: 'var(--font-mono)', color: 'var(--text-bright)', fontWeight: 600 }}>{zone.canaryCount} Active</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>VIOLATIONS (24H)</span>
                  <div style={{ fontSize: '1rem', fontFamily: 'var(--font-mono)', color: zone.violations24h > 0 ? '#fb923c' : 'var(--accent-safe)', fontWeight: 600 }}>{zone.violations24h}</div>
                </div>
              </div>

              <button
                onClick={() => toggleLock(zone.id, zone.status)}
                className={isLocked ? "btn-cyber-primary" : "btn-cyber-danger"}
                style={{ width: '100%', padding: '8px', fontSize: '0.74rem' }}
              >
                {isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                <span>{isLocked ? 'UNLOCK DIRECTORY' : 'ENFORCE HARD LOCK'}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Zone Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="ARM NEW PROTECTED STORAGE ZONE"
      >
        <form onSubmit={handleAddZone} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              ZONE NAME
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Legal Contracts Vault"
              value={newZoneName}
              onChange={(e) => setNewZoneName(e.target.value)}
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
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              TARGET DIRECTORY PATH (WILDCARDS ALLOWED)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. D:\Corporate\Contracts\*"
              value={newZonePath}
              onChange={(e) => setNewZonePath(e.target.value)}
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
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <button type="button" onClick={() => setAddModalOpen(false)} className="btn-cyber-ghost">
              CANCEL
            </button>
            <button type="submit" className="btn-cyber-primary">
              DEPLOY ZONE PROTECTION
            </button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
