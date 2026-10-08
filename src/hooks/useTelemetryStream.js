import { useSecurity } from '../context/SecurityContext.jsx';

export function useTelemetryStream(filter = 'ALL') {
  const { telemetryLogs } = useSecurity();

  if (filter === 'ALL') {
    return telemetryLogs;
  }

  return telemetryLogs.filter(log => log.level === filter);
}
