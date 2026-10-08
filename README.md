# 🛡️ CryptSentinel

> **Advanced AI-Powered Real-Time Anti-Ransomware & Threat Defense System**  
> *AICS (Artificial Intelligence for Cyber Security) Final Project*

---

## 📌 Overview

**CryptSentinel** is an enterprise-grade, real-time ransomware detection, monitoring, and automated response platform. It integrates kernel/system telemetry, live Shannon entropy mutation analysis, pattern-matching against known ransomware families (such as *LockBit 3.0*, *BlackCat/ALPHV*, and *WannaCry*), and a cyber threat intelligence UI.

The platform continuously monitors file system operations inside dedicated sandboxes, computes Shannon entropy on mutated files, analyzes running system processes, and streams real-time telemetry over WebSockets to a cyber defense dashboard.

---

## ✨ Key Features

- **⚡ Real-Time File System Watchdog & Entropy Engine**:
  - Live monitoring of monitored directories/sandboxes for rapid mutations.
  - Shannon Entropy calculation to catch encryption spikes in real time ($H(X) \ge 7.5$).
  - Instant tripwire and canary file trigger alerts.

- **🔍 Ransomware Family Pattern Matcher**:
  - Signatures and behavioral heuristics for *LockBit 3.0*, *BlackCat / ALPHV*, *WannaCry*, and *Generic High-Entropy Mutation Waves*.
  - MITRE ATT&CK tactic mapping (e.g., `T1486 Data Encrypted for Impact`, `T1490 Inhibit System Recovery`).
  - Cross-platform process command & terminal hook detection (macOS / Linux / Windows).

- **📊 Cyber Defense Command Center**:
  - **Command Center & Threat Radar**: Real-time risk probability gauge, threat vector analysis, and active host status.
  - **Process Observatory**: Live process list with PID inspection, memory/CPU telemetry, and one-click quarantine/kill actions.
  - **File Protection & Canary Shield**: Visual file mutation rate, entropy baseline vs peak tracker, and quarantine status.
  - **AI Observatory & Prediction Models**: AI-driven escalation horizon forecasting and attack vector classification.
  - **Attack Graph & Investigation Workbench**: Relationship mapping between malicious processes, affected files, and network activity.

- **🧪 Built-in Safe Attack Simulation Suite**:
  - Simulated synthetic ransomware detonation inside `monitored_sandbox/` to test detection logic and threat escalation workflows safely.
  - One-click sandbox reset and restoration.

---

## 🏗️ Architecture

```
AICS_final_project/
├── server/                         # Backend Telemetry & Detection Engine
│   ├── server.js                   # Express REST API & WebSocket Telemetry Server
│   ├── fileWatcher.js              # File System Watchdog & Shannon Entropy Analyzer
│   ├── patternMatcher.js           # Ransomware Signature & Behavioral Heuristics Engine
│   ├── systemMonitor.js            # Process & System Telemetry Collector
│   ├── testRunner.js               # Safe Synthetic Ransomware Attack Simulation
│   └── syntheticRansomwareData.json# Threat Signatures & MITRE ATT&CK Mapping
│
├── src/                            # Frontend Cyber Dashboard (React 19 + Vite)
│   ├── components/                 # Reusable UI & Security Modules
│   │   ├── common/                 # Buttons, Modals, Tooltips, Badges
│   │   ├── dashboard/              # Metrics, Status Cards, Live Feeds
│   │   ├── layout/                 # TopNav, Sidebar, Header
│   │   ├── processes/              # Process Table & Process Kill Modals
│   │   └── security/               # Risk Indicators, Incident Cards, Quarantine
│   ├── context/                    # SecurityContext & Global State
│   ├── pages/                      # 18+ Security & Telemetry Pages
│   │   ├── CommandCenter.jsx       # Main SOC Control Dashboard
│   │   ├── ProcessObservatory.jsx  # Live Process Inspector & Kill Switch
│   │   ├── FileProtection.jsx      # Entropy & Mutation Rate Monitor
│   │   ├── ThreatRadar.jsx         # Real-time Threat Radar
│   │   ├── AttackGraph.jsx         # Interactive Attack Path Graph
│   │   ├── AIObservatory.jsx       # AI Risk & Forecasting Model
│   │   ├── Incidents.jsx           # Active Incident Triage & Alerts
│   │   └── SecurityAnalytics.jsx   # Telemetry & Trend Analytics
│   └── services/                   # REST API & WebSocket Client
│
├── monitored_sandbox/              # Monitored directory for safe attack simulations
└── package.json                    # Project configuration & scripts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18.0.0 or higher recommended)
- **npm** (v9.0.0 or higher)

### 1. Installation

Clone the repository and install the dependencies:

```bash
git clone <repository-url>
cd AICS_final_project
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Default configuration in `.env`:
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000/ws/telemetry
VITE_ENABLE_SIMULATION=true
```

---

## 🏃 Running the Application

For full functionality (live monitoring + dashboard), run both the backend server and frontend client.

### Step 1: Start Backend Telemetry Server
Starts the Express REST API and WebSocket stream at `http://localhost:8000`:
```bash
npm run server
```

### Step 2: Start Frontend Development Server
In a separate terminal, launch the Vite dev server at `http://localhost:5173`:
```bash
npm run dev
```

Open your browser at [http://localhost:5173](http://localhost:5173) to access the CryptSentinel Dashboard.

---

## 📡 API Reference

### System & Threat Telemetry

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/system/status` | Current system protection state, risk score, host metrics |
| `GET` | `/api/processes` | List active processes with CPU, memory, and status |
| `GET` | `/api/processes/:pid` | Detailed inspection for a specific PID |
| `POST` | `/api/processes/:pid/kill` | Terminate suspicious or quarantined process |
| `GET` | `/api/files/protection-stats` | Shannon entropy ratings, mutation rate, canary status |

### Synthetic Simulation & Datasets

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/synthetic/patterns` | Known ransomware dataset and signature database |
| `POST` | `/api/synthetic/test` | Trigger safe synthetic attack scenario (`lockbit`, `blackcat`, `wannacry`) |
| `POST` | `/api/synthetic/reset` | Restore sandbox to a clean state |

### WebSocket Streams (`/ws/telemetry`)
- `FILE_EVENT`: Emitted on file creation, alteration, and Shannon entropy computation.
- `THREAT_MATCH`: Emitted immediately when ransomware signatures or high-entropy bursts are detected.
- `PROCESS_UPDATE_BATCH`: Periodic broadcast of active running processes and resource utilization.
- `ALERT` / `RISK_UPDATE`: Real-time incident triggers and aggregate risk adjustments.

---

## 🛡️ Synthetic Attack Scenarios

You can safely trigger simulated attacks via the UI or API:

```bash
# Trigger a simulated LockBit 3.0 encryption burst
curl -X POST http://localhost:8000/api/synthetic/test \
  -H "Content-Type: application/json" \
  -d '{"scenario": "lockbit"}'

# Reset the sandbox environment
curl -X POST http://localhost:8000/api/synthetic/reset
```

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, React Router 7, Lucide Icons, Vanilla CSS Design System
- **Backend**: Node.js, Express.js, `ws` (WebSockets), Node `fs`/`child_process`
- **Security & Analytics**: Shannon Entropy Formula ($H(X) = -\sum P(x)\log_2 P(x)$), File Watchers, Process Telemetry, MITRE ATT&CK Heuristics

---

## 📄 License

This project is developed for academic and educational research under the **AICS (Artificial Intelligence for Cyber Security)** program.
