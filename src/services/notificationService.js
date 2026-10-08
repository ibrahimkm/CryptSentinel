/**
 * CryptSentinel Unified Notification Service
 * Manages OS Desktop Notifications (Web Notification API), Audio Synthesis,
 * Preference Persistence, and Incident Notification Deduplication / Anti-Spam.
 */

const STORAGE_KEY = 'cryptsentinel_notification_preferences';

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  desktopNotifications: true,
  criticalThreats: true,
  highThreats: true,
  quarantine: true,
  processTermination: true,
  sound: true
};

class NotificationService {
  constructor() {
    this.preferences = this._loadPreferences();
    this.listeners = new Set();
    this.audioContext = null;
    
    // In-memory deduplication state: Map<incidentId, { firstNotified: number, lastNotified: number, count: number, severity: string, status: string, riskScore: number }>
    this.incidentNotificationState = new Map();
    
    // Cleanup timer to prevent memory growth (every 10 mins, prune entries older than 30 mins)
    if (typeof window !== 'undefined') {
      this._cleanupInterval = setInterval(() => this.pruneOldEntries(), 10 * 60 * 1000);
      
      // Listen for window focus to trigger permission updates if changed externally
      window.addEventListener('focus', () => {
        this._notifyListeners();
      });
    }
  }

  // --- 1. Notification API Support & Permission ---

  /**
   * Check if the browser environment supports the Notification API
   */
  isSupported() {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Get the current OS/Browser notification permission state
   * @returns {'granted' | 'denied' | 'default' | 'unsupported'}
   */
  getPermissionStatus() {
    if (!this.isSupported()) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  /**
   * Explicitly request permission from the user
   * @returns {Promise<'granted' | 'denied' | 'default' | 'unsupported'>}
   */
  async requestPermission() {
    if (!this.isSupported()) {
      return 'unsupported';
    }

    if (Notification.permission === 'granted' || Notification.permission === 'denied') {
      return Notification.permission;
    }

    try {
      const permission = await Notification.requestPermission();
      this._notifyListeners();
      return permission;
    } catch (err) {
      console.warn('[NotificationService] Permission request error:', err);
      return Notification.permission || 'denied';
    }
  }

  // --- 2. Preference Management ---

  _loadPreferences() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return { ...DEFAULT_NOTIFICATION_PREFERENCES };
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { ...DEFAULT_NOTIFICATION_PREFERENCES };
      }
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...parsed
      };
    } catch {
      return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    }
  }

  getPreferences() {
    return { ...this.preferences };
  }

  savePreferences(newPreferences) {
    this.preferences = {
      ...this.preferences,
      ...newPreferences
    };

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.preferences));
      }
    } catch (err) {
      console.warn('[NotificationService] Failed to persist preferences:', err);
    }

    this._notifyListeners();
    return this.getPreferences();
  }

  onPreferencesChange(callback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  _notifyListeners() {
    const currentPrefs = this.getPreferences();
    const perm = this.getPermissionStatus();
    this.listeners.forEach((cb) => {
      try {
        cb(currentPrefs, perm);
      } catch (err) {
        console.error('[NotificationService] Listener callback error:', err);
      }
    });
  }

  // --- 3. Deduplication & Anti-Spam Engine ---

  /**
   * Determines if a notification should be presented or suppressed due to spam/repetition.
   * @param {string} incidentId
   * @param {Object} threatData { severity, status, riskScore }
   * @returns {{ shouldNotify: boolean, isEscalation: boolean, count: number }}
   */
  shouldNotifyIncident(incidentId, threatData = {}) {
    if (!incidentId) {
      // If no incident ID provided, treat as single unindexed event
      return { shouldNotify: true, isEscalation: false, count: 1 };
    }

    const now = Date.now();
    const state = this.incidentNotificationState.get(incidentId);

    if (!state) {
      // First time seeing this incident -> always notify
      this.incidentNotificationState.set(incidentId, {
        firstNotified: now,
        lastNotified: now,
        count: 1,
        severity: threatData.severity || 'HIGH',
        status: threatData.status || 'OPEN',
        riskScore: Number(threatData.riskScore) || 0
      });
      return { shouldNotify: true, isEscalation: false, count: 1 };
    }

    // Increment mutation count observed for this incident
    state.count += 1;

    // Check for meaningful escalation:
    // 1. Severity escalated from HIGH/MEDIUM to CRITICAL
    const isSeverityEscalated =
      (state.severity === 'HIGH' || state.severity === 'MEDIUM' || state.severity === 'LOW') &&
      threatData.severity === 'CRITICAL';

    // 2. Significant risk score increase (>= 15 points)
    const currentScore = Number(threatData.riskScore) || state.riskScore;
    const isRiskEscalated = currentScore - state.riskScore >= 15;

    // 3. Status transition to CONTAINMENT_FAILED or similar critical state
    const isStatusEscalated =
      threatData.status &&
      threatData.status !== state.status &&
      threatData.status === 'CONTAINMENT_FAILED';

    const isEscalation = isSeverityEscalated || isRiskEscalated || isStatusEscalated;

    // Cooldown check: do not spam even escalations within 3 seconds
    const timeSinceLast = now - state.lastNotified;
    if (isEscalation && timeSinceLast > 3000) {
      state.lastNotified = now;
      state.severity = threatData.severity || state.severity;
      state.status = threatData.status || state.status;
      state.riskScore = Math.max(state.riskScore, currentScore);
      return { shouldNotify: true, isEscalation: true, count: state.count };
    }

    // Otherwise, suppress duplicate desktop notification spam
    return { shouldNotify: false, isEscalation: false, count: state.count };
  }

  /**
   * Prune entries older than 30 minutes to prevent unbounded memory growth
   */
  pruneOldEntries(maxAgeMs = 30 * 60 * 1000) {
    const now = Date.now();
    for (const [id, entry] of this.incidentNotificationState.entries()) {
      if (now - entry.lastNotified >= maxAgeMs) {
        this.incidentNotificationState.delete(id);
      }
    }

    // Cap total size at 500 entries (LRU-like eviction of oldest)
    if (this.incidentNotificationState.size > 500) {
      const sorted = Array.from(this.incidentNotificationState.entries()).sort(
        (a, b) => a[1].lastNotified - b[1].lastNotified
      );
      const toDelete = sorted.slice(0, this.incidentNotificationState.size - 500);
      for (const [id] of toDelete) {
        this.incidentNotificationState.delete(id);
      }
    }
  }

  resetDeduplicationState() {
    this.incidentNotificationState.clear();
  }

  // --- 4. Audio Alert Synthesis (Web Audio API) ---

  playNotificationSound(severity = 'INFO') {
    if (!this.preferences.sound) return;
    if (typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new AudioCtx();
      }

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      const ctx = this.audioContext;
      const now = ctx.currentTime;

      if (severity === 'CRITICAL') {
        // High-urgency dual-tone alert chime (880Hz -> 660Hz)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(880, now);
        osc1.frequency.exponentialRampToValueAtTime(440, now + 0.18);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(660, now + 0.2);
        osc2.frequency.exponentialRampToValueAtTime(880, now + 0.38);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc1.stop(now + 0.2);
        osc2.start(now + 0.2);
        osc2.stop(now + 0.4);
      } else if (severity === 'HIGH') {
        // Warning chime (587Hz -> 440Hz)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.25);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
      } else {
        // Subtle informative blip
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now);
        osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.15);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
      }
    } catch (err) {
      // Gracefully handle browser autoplay blocks without throwing
      // console.debug('[NotificationService] Audio playback skipped:', err.message);
    }
  }

  // --- 5. Desktop OS Notification Dispatchers ---

  /**
   * Dispatch a real OS desktop notification if permissions and settings allow
   * @param {string} title
   * @param {Object} options Notification options
   * @param {Function} onClickCallback
   * @returns {Notification|null}
   */
  _showDesktopNotification(title, options = {}, onClickCallback = null) {
    if (!this.preferences.desktopNotifications) {
      return null;
    }

    if (this.getPermissionStatus() !== 'granted') {
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: options.severity === 'CRITICAL',
        silent: true, // We handle audio explicitly via playNotificationSound for consistent cross-platform control
        ...options
      });

      notification.onclick = (event) => {
        event.preventDefault();
        try {
          if (typeof window !== 'undefined') {
            window.focus();
          }
        } catch {}

        if (typeof onClickCallback === 'function') {
          onClickCallback();
        } else if (options.data && options.data.incidentId) {
          // Default: dispatch navigation event to open incident dossier
          this._dispatchNavigation('/incidents', options.data.incidentId);
        }
        notification.close();
      };

      return notification;
    } catch (err) {
      console.warn('[NotificationService] Error creating OS notification:', err);
      return null;
    }
  }

  _dispatchNavigation(path, incidentId = null) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('cryptsentinel:navigate', {
          detail: { path, incidentId }
        })
      );
    }
  }

  /**
   * Main handler for Threat Alerts (CRITICAL / HIGH)
   */
  notifyThreat(threat) {
    if (!threat) return null;

    const severity = (threat.severity || 'HIGH').toUpperCase();
    const riskScore = threat.riskScore || threat.risk_score || 80;
    const incidentId = threat.incidentId || threat.id || null;
    const threatFamily = threat.threatFamily || threat.matchedFamily || 'Ransomware';
    const filePath = threat.filePath || threat.location?.modifiedFilePath || threat.location?.targetFilename || '';
    const action = threat.action || 'MONITORED';

    // 1. Check user preference filters for severity
    if (severity === 'CRITICAL' && !this.preferences.criticalThreats) {
      return null;
    }
    if (severity === 'HIGH' && !this.preferences.highThreats) {
      return null;
    }
    if (severity !== 'CRITICAL' && severity !== 'HIGH' && !this.preferences.desktopNotifications) {
      return null;
    }

    // 2. Deduplication check
    const { shouldNotify, isEscalation, count } = this.shouldNotifyIncident(incidentId, {
      severity,
      status: threat.status || 'OPEN',
      riskScore
    });

    if (!shouldNotify) {
      // Suppress repeated desktop notification spam
      return null;
    }

    // 3. Play audio chime
    this.playNotificationSound(severity);

    // 4. Construct Real OS Notification Payload
    let title = 'CryptSentinel — HIGH RISK THREAT';
    let body = '';

    if (severity === 'CRITICAL') {
      title = isEscalation
        ? `CryptSentinel — ESCALATED CRITICAL THREAT: ${threatFamily}`
        : `CryptSentinel — CRITICAL THREAT`;

      if (count > 1) {
        body = `CRITICAL RANSOMWARE ACTIVITY\n${count} suspicious file modifications detected.\nRisk: ${riskScore}/100.\n${action === 'QUARANTINED' ? 'Files quarantined automatically.' : 'Containment active.'}`;
      } else {
        body = `Ransomware activity detected (${threatFamily}).\nRisk: ${riskScore}/100.\n${action === 'QUARANTINED' ? 'File quarantined automatically.' : filePath ? `Target: ${filePath}` : 'Investigation recommended.'}`;
      }
    } else {
      title = isEscalation
        ? `CryptSentinel — HIGH RISK ESCALATION: ${threatFamily}`
        : `CryptSentinel — HIGH RISK THREAT`;

      body = `Suspicious ransomware behavior detected.\nRisk: ${riskScore}/100.\nInvestigation recommended.`;
    }

    return this._showDesktopNotification(title, {
      body,
      tag: incidentId || `threat-${Date.now()}`,
      severity,
      data: {
        incidentId,
        filePath,
        riskScore,
        threatFamily
      }
    });
  }

  /**
   * Quarantine action notification
   */
  notifyQuarantine(result) {
    if (!this.preferences.quarantine) return null;
    if (!result) return null;

    this.playNotificationSound('INFO');

    const filename = result.originalFilename || result.filename || (result.originalPath ? result.originalPath.split('/').pop() : 'Suspicious file');
    const title = 'CryptSentinel — File Quarantined';
    const body = `Safely isolated ${filename} to secure vault.\nReason: ${result.reason || 'High-entropy ransomware mutation wave'}`;

    return this._showDesktopNotification(title, {
      body,
      tag: `quarantine-${result.id || Date.now()}`,
      severity: 'INFO',
      data: {
        incidentId: result.incidentId || null,
        quarantineId: result.id
      }
    });
  }

  /**
   * Process termination notification
   */
  notifyProcessTermination(result) {
    if (!this.preferences.processTermination) return null;
    if (!result) return null;

    this.playNotificationSound('INFO');

    const pid = result.pid || result.details?.pid || 'UNKNOWN';
    const name = result.name || result.details?.name || 'Suspicious Process';
    const title = 'CryptSentinel — Process Terminated';
    const body = `Process ${name} (PID: ${pid}) was safely terminated by security response.`;

    return this._showDesktopNotification(title, {
      body,
      tag: `process-kill-${pid}-${Date.now()}`,
      severity: 'INFO',
      data: { pid }
    });
  }

  /**
   * Unified entry point for WebSocket SECURITY_NOTIFICATION events
   */
  notifySecurityEvent(eventPayload) {
    if (!eventPayload) return null;

    if (eventPayload.action === 'QUARANTINED' && eventPayload.quarantineItem) {
      this.notifyQuarantine(eventPayload.quarantineItem);
    } else if (eventPayload.action === 'TERMINATED' && eventPayload.processInfo) {
      this.notifyProcessTermination(eventPayload.processInfo);
    }

    // Always evaluate threat alert for the security event
    return this.notifyThreat(eventPayload);
  }
}

export const notificationService = new NotificationService();
