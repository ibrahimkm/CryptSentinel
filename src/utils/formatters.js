export function formatTimestamp(date = new Date()) {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  const seconds = String(d.getUTCSeconds()).padStart(2, '0');
  const millis = String(d.getUTCMilliseconds()).padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${millis}`;
}

export function formatTimeAgo(timestamp) {
  if (!timestamp) return 'just now';
  const diff = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatPercent(value, decimals = 2) {
  if (value === undefined || value === null) return '0%';
  return `${Number(value).toFixed(decimals)}%`;
}

export function truncateHash(hash, length = 8) {
  if (!hash) return '';
  if (hash.length <= length * 2) return hash;
  return `${hash.substring(0, length)}...${hash.substring(hash.length - length)}`;
}

export function getRiskLevel(score) {
  if (score >= 80) return { label: 'CRITICAL', color: 'var(--accent-critical)', class: 'badge-critical' };
  if (score >= 50) return { label: 'HIGH', color: 'var(--accent-danger)', class: 'badge-danger' };
  if (score >= 25) return { label: 'ELEVATED', color: 'var(--accent-warning)', class: 'badge-warning' };
  return { label: 'NORMAL', color: 'var(--accent-safe)', class: 'badge-protected' };
}
