import React from 'react';

export function RiskChart({
  data = [],
  modelName = 'HEURISTIC-B v4.2',
  currentScore = 74
}) {
  const points = data.length > 0 ? data : [
    { t: 0, val: 18 },
    { t: 10, val: 20 },
    { t: 20, val: 22 },
    { t: 25, val: 19 },
    { t: 30, val: 34 },
    { t: 35, val: 36 },
    { t: 40, val: 58 },
    { t: 45, val: 60 },
    { t: 50, val: 78 },
    { t: 55, val: 71 },
    { t: 60, val: 74 }
  ];

  // SVG Chart Dimensions
  const width = 600;
  const height = 260;
  const paddingLeft = 40;
  const paddingRight = 30;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxT = 60;
  const maxVal = 100;

  // Convert points to SVG coordinates
  const svgPoints = points.map(p => {
    const x = paddingLeft + (p.t / maxT) * chartWidth;
    const y = paddingTop + chartHeight - (p.val / maxVal) * chartHeight;
    return { x, y, ...p };
  });

  const pathD = svgPoints.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  const lastPoint = svgPoints[svgPoints.length - 1] || { x: width - paddingRight, y: paddingTop };

  return (
    <div className="sentinel-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="sentinel-card-header">
        <span className="heading-section">PROBABILITY TRAJECTORY (T-60s)</span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.68rem',
          color: 'var(--text-muted)',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-default)',
          padding: '2px 8px',
          borderRadius: '2px'
        }}>
          MODEL: {modelName}
        </span>
      </div>

      <div style={{ width: '100%', height: '260px', position: 'relative' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%' }}>
          {/* Y Axis Grid Lines & Labels */}
          {[100, 75, 50, 25, 0].map((val) => {
            const y = paddingTop + chartHeight - (val / 100) * chartHeight;
            return (
              <g key={val}>
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="#64748b"
                  fontFamily="var(--font-mono)"
                  fontSize="11"
                >
                  {val}
                </text>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="rgba(30, 42, 66, 0.6)"
                  strokeDasharray="2 2"
                  strokeWidth="1"
                />
              </g>
            );
          })}

          {/* Area fill */}
          <path
            d={`${pathD} L ${lastPoint.x} ${paddingTop + chartHeight} L ${paddingLeft} ${paddingTop + chartHeight} Z`}
            fill="url(#riskGradient)"
            opacity="0.25"
          />

          {/* Line Chart */}
          <path
            d={pathD}
            fill="none"
            stroke="#93c5fd"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Dotted vertical line to endpoint */}
          <line
            x1={lastPoint.x}
            y1={lastPoint.y}
            x2={lastPoint.x}
            y2={paddingTop + chartHeight}
            stroke="#f87171"
            strokeDasharray="3 3"
            strokeWidth="1"
          />

          {/* Endpoint marker */}
          <circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r="4"
            fill="#f87171"
            stroke="#0b0d13"
            strokeWidth="2"
          />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="riskGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
