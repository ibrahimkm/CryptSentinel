export const DEFAULT_RESPONSE_POLICIES = {
  CRITICAL: {
    createIncident: true,
    quarantine: true,
    desktopNotification: true,
    terminateProcess: false
  },
  HIGH: {
    createIncident: true,
    desktopNotification: true,
    quarantine: false,
    terminateProcess: false
  },
  MEDIUM: {
    createIncident: true,
    desktopNotification: false,
    quarantine: false,
    terminateProcess: false
  }
};

export class PolicyService {
  constructor() {
    this.policies = JSON.parse(JSON.stringify(DEFAULT_RESPONSE_POLICIES));
  }

  getPolicies() {
    return JSON.parse(JSON.stringify(this.policies));
  }

  updatePolicies(newPolicies) {
    if (!newPolicies) return this.getPolicies();
    const source = newPolicies.policies || newPolicies;
    
    ['CRITICAL', 'HIGH', 'MEDIUM'].forEach(tier => {
      if (source[tier]) {
        this.policies[tier] = {
          ...this.policies[tier],
          ...source[tier]
        };
      }
    });

    return this.getPolicies();
  }

  evaluatePolicy(severity) {
    const tier = (severity || 'MEDIUM').toUpperCase();
    return this.policies[tier] || this.policies.MEDIUM;
  }

  resetDefaults() {
    this.policies = JSON.parse(JSON.stringify(DEFAULT_RESPONSE_POLICIES));
    return this.getPolicies();
  }
}

export const policyService = new PolicyService();
