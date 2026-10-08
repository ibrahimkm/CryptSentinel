import React, { useEffect, useRef } from 'react';

export function ProcessTopology({ activeNodes = 0, isolatedNodes = 0 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let angle = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(centerX, centerY) * 0.75;

      ctx.clearRect(0, 0, width, height);

      // Background subtle circular rings
      ctx.strokeStyle = 'rgba(30, 42, 66, 0.4)';
      ctx.lineWidth = 1;

      // Outer dashed ring
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Middle ring
      ctx.beginPath();
      ctx.setLineDash([2, 2]);
      ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
      ctx.stroke();

      // Inner ring
      ctx.beginPath();
      ctx.setLineDash([]);
      ctx.arc(centerX, centerY, radius * 0.25, 0, Math.PI * 2);
      ctx.stroke();

      // Rotating radar line
      angle += 0.012;
      const lineX = centerX + Math.cos(angle) * radius;
      const lineY = centerY + Math.sin(angle) * radius;

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.2)';
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(lineX, lineY);
      ctx.stroke();

      // Connected nodes
      const nodes = [
        { x: centerX - radius * 0.5, y: centerY, color: '#64748b', size: 4 },
        { x: centerX + radius * 0.5, y: centerY, color: '#64748b', size: 4 },
        { x: centerX, y: centerY - radius * 0.6, color: '#fb923c', size: 5 }, // Anomaly node
        { x: centerX, y: centerY, color: '#93c5fd', size: 6 } // Core root
      ];

      // Lines between nodes
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.moveTo(nodes[3].x, nodes[3].y);
      ctx.lineTo(nodes[2].x, nodes[2].y);
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
      ctx.lineWidth = 1;
      ctx.moveTo(nodes[0].x, nodes[0].y);
      ctx.lineTo(nodes[1].x, nodes[1].y);
      ctx.stroke();

      // Draw nodes
      nodes.forEach((node) => {
        ctx.beginPath();
        ctx.fillStyle = node.color;
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        ctx.fill();

        if (node.color === '#fb923c') {
          // Glow for anomaly
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(251, 146, 60, 0.5)';
          ctx.arc(node.x, node.y, node.size + 4, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="sentinel-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="sentinel-card-header">
        <span className="heading-section">PROCESS TOPOLOGY</span>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        minHeight: '220px'
      }}>
        <canvas
          ref={canvasRef}
          width={280}
          height={220}
          style={{ width: '100%', height: '100%', maxHeight: '240px' }}
        />
      </div>

      {/* Bottom Node Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginTop: '12px',
        borderTop: '1px solid rgba(255, 255, 255, 0.04)',
        paddingTop: '12px'
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-default)',
          borderRadius: '3px',
          padding: '10px 12px'
        }}>
          <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            ACTIVE NODES
          </span>
          <div style={{
            fontSize: '1.25rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color: 'var(--text-bright)',
            marginTop: '2px'
          }}>
            {activeNodes.toLocaleString()}
          </div>
        </div>

        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-default)',
          borderRadius: '3px',
          padding: '10px 12px'
        }}>
          <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            ISOLATED
          </span>
          <div style={{
            fontSize: '1.25rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            color: '#fb923c',
            marginTop: '2px'
          }}>
            {isolatedNodes}
          </div>
        </div>
      </div>
    </div>
  );
}
