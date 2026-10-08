import { WS_EVENTS } from '../utils/constants.js';

function getWebSocketUrl() {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // If running in Vite standalone dev mode on port 3010
    if (window.location.port === '3010') {
      return `${protocol}//${window.location.hostname}:8000/ws/telemetry`;
    }
    return `${protocol}//${window.location.host}/ws/telemetry`;
  }
  return 'ws://localhost:8000/ws/telemetry';
}

class TelemetryWebSocket {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.statusListeners = new Set();
    this.isConnected = false;
    this.reconnectTimer = null;
    this.simulationTimer = null;
    this.isSimulationMode = import.meta.env.VITE_ENABLE_SIMULATION === 'true';
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const url = getWebSocketUrl();
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.notifyStatus(true);
        this.stopSimulation();
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.type) {
            this.emit(parsed.type, parsed.payload || parsed.data);
          }
        } catch (err) {
          console.warn('[TelemetryWebSocket] Failed to parse message:', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.notifyStatus(false);
        this.scheduleReconnect();
        if (this.isSimulationMode) {
          this.startSimulation();
        }
      };

      this.ws.onerror = () => {
        this.isConnected = false;
        this.notifyStatus(false);
      };
    } catch {
      this.isConnected = false;
      this.notifyStatus(false);
      if (this.isSimulationMode) {
        this.startSimulation();
      }
    }
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.simulationTimer) clearInterval(this.simulationTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.notifyStatus(false);
  }

  setSimulationMode(enabled) {
    this.isSimulationMode = enabled;
    if (enabled && !this.isConnected) {
      this.startSimulation();
    } else if (!enabled && !this.isConnected) {
      this.stopSimulation();
    }
  }

  startSimulation() {
    if (this.simulationTimer || !this.isSimulationMode) return;

    // Synthetic demonstration events inside sandbox
    const mockMessages = [
      () => ({
        type: WS_EVENTS.FILE_EVENT,
        payload: {
          timestamp: new Date().toISOString(),
          pid: null,
          process: 'Sandbox Endpoint Monitoring',
          action: 'HIGH_ENTROPY_WRITE',
          path: `monitored_sandbox/sim_doc_${Math.floor(Math.random() * 9000 + 1000)}.docx.lockbit`,
          entropy: parseFloat((7.85 + Math.random() * 0.1).toFixed(3))
        }
      }),
      () => ({
        type: WS_EVENTS.RISK_UPDATE,
        payload: {
          status: 'GUARDED',
          aggregateProbability: parseFloat((28.5 + Math.random() * 2).toFixed(1)),
          escalationHorizonSeconds: '18-42s'
        }
      })
    ];

    this.simulationTimer = setInterval(() => {
      const generator = mockMessages[Math.floor(Math.random() * mockMessages.length)];
      const msg = generator();
      this.emit(msg.type, msg.payload);
    }, 4000);
  }

  stopSimulation() {
    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
      this.simulationTimer = null;
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 4000);
  }

  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);

    return () => {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  onStatusChange(callback) {
    this.statusListeners.add(callback);
    callback(this.isConnected);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  notifyStatus(status) {
    this.statusListeners.forEach(cb => cb(status));
  }

  emit(eventType, data) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb(data);
        } catch (e) {
          console.error('[TelemetryWebSocket] Callback error:', e);
        }
      });
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
      return true;
    }
    return false;
  }
}

export const telemetryWS = new TelemetryWebSocket();
