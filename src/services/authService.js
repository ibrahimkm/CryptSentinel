const USER_STORAGE_KEY = 'cryptsentinel_user';
const TOKEN_STORAGE_KEY = 'cryptsentinel_token';

const defaultDemoUser = {
  id: 'USR-SEC-994',
  name: 'Alex Vance',
  operatorCallsign: 'SEC-994',
  email: 'a.vance@sentinel.defense.org',
  role: 'Lead Threat Intelligence Analyst',
  clearanceLevel: 'LEVEL 4 — RESTRICTED SOC',
  assignedStation: 'Endpoint-WIN-AX9 (SOC Primary Console)',
  ipAddress: '192.168.1.104',
  mfaMethod: 'Hardware Token (YubiKey 5 FIPS)',
  tokenFingerprint: '0x8F94...42E1B809',
  sessionStartedAt: '13:58:00 UTC',
  avatarUrl: null
};

export const authService = {
  getCurrentUser() {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return defaultDemoUser;
  },

  getToken() {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || 'demo-bearer-token-sec994';
  },

  async login({ email, password }) {
    // Simulated auth delay
    await new Promise(resolve => setTimeout(resolve, 600));

    // Check if matching registered user or demo
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    let user = stored ? JSON.parse(stored) : defaultDemoUser;

    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      // Create user profile for this email
      user = {
        ...defaultDemoUser,
        id: `USR-${Math.floor(Math.random() * 9000 + 1000)}`,
        name: email.split('@')[0].replace('.', ' ').toUpperCase(),
        operatorCallsign: `SEC-${Math.floor(Math.random() * 900 + 100)}`,
        email
      };
    }

    const token = `sentinel-jwt-${Date.now()}`;
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_STORAGE_KEY, token);

    return { user, token };
  },

  async register({ name, email, password, clearanceLevel, role }) {
    await new Promise(resolve => setTimeout(resolve, 700));

    const newUser = {
      id: `USR-${Math.floor(Math.random() * 9000 + 1000)}`,
      name: name || 'Operator',
      operatorCallsign: `SEC-${Math.floor(Math.random() * 900 + 100)}`,
      email,
      role: role || 'Security Operations Specialist',
      clearanceLevel: clearanceLevel || 'LEVEL 3 — ELEVATED INCIDENT RESPONSE',
      assignedStation: 'Endpoint-WIN-AX9 (SOC Station 01)',
      ipAddress: '192.168.1.104',
      mfaMethod: 'Authenticator App (TOTP Active)',
      tokenFingerprint: `0x${Math.random().toString(16).substring(2, 10).toUpperCase()}...${Math.random().toString(16).substring(2, 6).toUpperCase()}`,
      sessionStartedAt: new Date().toLocaleTimeString('en-GB') + ' UTC',
      avatarUrl: null
    };

    const token = `sentinel-jwt-${Date.now()}`;
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    localStorage.setItem(TOKEN_STORAGE_KEY, token);

    return { user: newUser, token };
  },

  async updateProfile(updates) {
    const current = this.getCurrentUser();
    const updated = { ...current, ...updates };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  logout() {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    return true;
  }
};
