import React from 'react';
import { getRiskLevel } from '../../utils/formatters.js';

export function ThreatBadge({ score, label, className = '' }) {
  const risk = label
    ? { label, class: label === 'CRITICAL' ? 'badge-critical' : label === 'HIGH' ? 'badge-danger' : label === 'ELEVATED' || label === 'WARN' ? 'badge-warning' : 'badge-protected' }
    : getRiskLevel(score || 0);

  return (
    <span className={`badge-tag ${risk.class} ${className}`}>
      {risk.label}
    </span>
  );
}
