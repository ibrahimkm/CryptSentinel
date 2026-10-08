import React, { useEffect, useRef } from 'react';

export function RadarScan({ threats = [] }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let sweepAngle = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.min(centerX, centerY) * 0.88;

      ctx.clearRect(0, 0, width, height);

      // Radar Concentric Grid Rings
      [0.25, 0.5, 0.75, 1.0].forEach((ratio) => {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(30, 42, 66, 0.5)';
        ctx.lineWidth = 1;
        ctx.arc(centerX, centerY, maxRadius * ratio, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Crosshairs
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(30, 42, 66, 0.4)';
      ctx.moveTo(centerX - maxRadius, centerY);
      ctx.lineTo(centerX + maxRadius, centerY);
      ctx.moveTo(centerX, centerY - maxRadius);
      ctx.lineTo(centerX, centerY + maxRadius);
      ctx.stroke();

      // Sweeping cone
      sweepAngle = (sweepAngle + 0.025) % (Math.PI * 2);

      const gradient = ctx.createConicGradient(sweepAngle, centerX, centerY);
      gradient.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
      gradient.addColorStop(0.15, 'rgba(56, 189, 248, 0.02)');
      gradient.addColorStop(0.2, 'transparent');
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
      ctx.fill();

      // Blips
      const blipList = threats.length > 0 ? threats : [
        { angle: 0.8, distance: 0.65, severity: 'CRITICAL', label: 'PID 8944' },
        { angle: 2.4, distance: 0.45, severity: 'HIGH', label: 'PID 2044' },
        { angle: 4.2, distance: 0.8, severity: 'LOW', label: 'PID 5128' }
      ];

      blipList.forEach((blip) => {
        const bx = centerX + Math.cos(blip.angle) * (maxRadius * blip.distance);
        const by = centerY + Math.sin(blip.angle) * (maxRadius * blip.distance);
        const isCritical = blip.severity === 'CRITICAL';

        // Blip point
        ctx.beginPath();
        ctx.fillStyle = isCritical ? '#f87171' : '#60a5fa';
        ctx.arc(bx, by, isCritical ? 5 : 4, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing ring
        ctx.beginPath();
        ctx.strokeStyle = isCritical ? 'rgba(248, 113, 113, 0.6)' : 'rgba(96, 165, 250, 0.5)';
        ctx.arc(bx, by, 8, 0, Math.PI * 2);
        ctx.stroke();

        // Label
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px "JetBrains Mono"';
        ctx.fillText(blip.label, bx + 10, by + 3);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [threats]);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <canvas
        ref={canvasRef}
        width={420}
        height={420}
        style={{ maxWidth: '100%', maxHeight: '420px' }}
      />
    </div>
  );
}
