# SentinelOS

Futuristic system command center for live telemetry, process intelligence, AI-assisted terminal workflows, and optimization simulation.

SentinelOS combines a React single-page interface, an Express orchestration server, and a Python analysis engine to deliver a high-density monitoring dashboard with interactive operations and security-focused UX.

## Project Overview

SentinelOS is built as a full-stack WebOS-style interface that visualizes runtime health in near real time and exposes operational controls through themed modules:

- Live system telemetry (CPU, memory, disk, thermal, network, battery)
- Process lifecycle controls (terminate, suspend, resume)
- AI-assisted GhostShell command interpretation
- File intelligence scans and cleanup workflow
- Optimization flow powered by a dedicated web worker
- Alerting and notification orchestration with cooldown logic

This project is optimized for hackathon demoability while preserving clean modular architecture suitable for iterative hardening.

## Architecture

### High-Level Flow

1. The Express server boots on port 3000 and acts as the system orchestration layer.
2. The server spawns the Python engine (`engine/main.py`) for metric collection and health analysis.
3. Python emits JSON snapshots over stdout; Node ingests and merges the data.
4. Node builds a normalized `StatsSnapshot`, caches it, and pushes deltas over WebSocket (`/ws/stats`).
5. Frontend store (`src/lib/systemStatsStore.ts`) consumes WebSocket events with polling fallback (`/api/stats`).
6. React pages render telemetry, alerts, process operations, shell outputs, and optimization states.

### Layered Design

- Presentation Layer: React + Router + Tailwind UI modules
- State and Domain Layer: hooks and shared store abstractions
- Transport Layer: REST APIs + WebSocket stream
- Orchestration Layer: Express server and task/action APIs
- Analysis Layer: Python engine monitors + anomaly/health analyzers

### Runtime Components

- Frontend SPA: route-driven dashboards and control panels
- Backend API: telemetry, shell execution, process operations, intelligence and operations endpoints
- WebSocket broadcaster: low-latency stats distribution
- Python engine: system/process metrics and recommendation generation

## Technology Stack

### Frontend

- React 19
- TypeScript
- Vite 6
- React Router 7
- Tailwind CSS 4
- Motion (Framer Motion runtime)
- Recharts + D3
- Lucide React

### Backend

- Node.js
- Express 4
- WebSocket server (`ws`)
- Child process integration for Python engine

### AI and Intelligent Features

- Google GenAI SDK (`@google/genai`) for GhostShell natural-language interpretation and AI recommendations

### Python Engine

- Python 3 runtime
- Zero-dependency monitor strategy via `/proc` (Linux-style metric reads)

## Installation Instructions

### Prerequisites

- Node.js 20+
- npm 10+
- Python 3.10+ (recommended)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd SentinelOS
npm install
```

### 2. Configure environment (optional but recommended)

- Optional AI key for GhostShell and recommendation features:
	- `GEMINI_API_KEY` or `VITE_GEMINI_API_KEY`
- Optional Python override if needed:
	- `PYTHON_EXECUTABLE` (absolute path to Python binary)

Example (PowerShell):

```powershell
$env:GEMINI_API_KEY="your_key_here"
$env:PYTHON_EXECUTABLE="C:\Python311\python.exe"
```

### 3. Run development server

```bash
npm run dev
```

Open: `http://localhost:3000`

### 4. Build for production

```bash
npm run build
npm run start
```

## Usage Guide

### Main Navigation

- Dashboard: live telemetry, trends, and health summary
- Security Alerts: generated alerts and system warning history
- Process Manager: filter/search tasks and apply process actions
- GhostShell: command execution and AI intent interpretation
- File Intelligence: scan project tree and cleanup simulation
- Optimization: run scan + optimization simulation workflow
- Visualization: data-centric visual output mode
- Settings: runtime preferences and control toggles

### Typical Demo Flow

1. Open Dashboard and verify live data updates.
2. Trigger a deep scan from quick operations.
3. Open Process Manager and perform a suspend/resume action.
4. Use GhostShell with both direct command and natural language.
5. Run File Intelligence scan, inspect large/duplicate/temp findings.
6. Execute optimization scan and deploy optimization.

## Feature Descriptions

### 1. Live System Telemetry

- Real-time data transport over WebSocket with requestAnimationFrame-batched UI updates
- Polling fallback when socket transport degrades
- Snapshot deduplication to avoid redundant re-renders

### 2. Alert Engine

- Monitors CPU, RAM, disk thresholds
- Detects suspicious process names
- Applies cooldown windows to prevent alert storms

### 3. GhostShell (AI Terminal)

- Supports direct command execution via `/api/shell/exec`
- Restricted command surface for safer execution
- Optional natural-language interpretation to command JSON schema

### 4. File Intelligence

- Filesystem traversal with depth guards
- Category bucketing by extension
- Large file, temp file, and duplicate detection heuristics
- Cleanup simulation endpoint for reclaim messaging

### 5. Optimization Core

- Dedicated web worker for long-running progress simulation
- Two phases: scan and optimize
- Returns performance deltas and reclaimed resources

### 6. Process Manager

- Action endpoint for terminate/suspend/resume
- Client-side risk scoring and filtering controls

## Screenshots (Placeholders)

Replace these with real captures before submission.

```md
![Dashboard](docs/screenshots/dashboard-overview.png)
![Security Alerts](docs/screenshots/security-alerts.png)
![Process Manager](docs/screenshots/process-manager.png)
![GhostShell](docs/screenshots/ghostshell-ai.png)
![File Intelligence](docs/screenshots/file-intelligence.png)
![Optimization Core](docs/screenshots/optimization-core.png)
![System Visualization](docs/screenshots/system-visualization.png)
```

## API Explanation

### Health and Telemetry

- `GET /api/health`
	- Returns backend health and environment mode
- `GET /api/stats`
	- Returns cached normalized system snapshot
- `WS /ws/stats`
	- Pushes live stats envelopes `{ type: "stats", payload }`

### Shell

- `POST /api/shell/exec`
	- Executes restricted command set
	- Supports `cd` with persisted session directory
	- Supports `src <filename>` file reader utility

Request example:

```json
{
	"command": "ls"
}
```

Response example:

```json
{
	"output": "...",
	"error": null,
	"cwd": "..."
}
```

### Process Actions

- `POST /api/processes/:id/action`
	- Body action: `terminate | suspend | resume`

### File Intelligence

- `GET /api/files`
	- Returns demo tree structure
- `GET /api/intelligence/scan`
	- Returns scan result payload with file stats and heuristics
- `POST /api/intelligence/cleanup`
	- Returns cleanup simulation result

### Operations

- `POST /api/operations/deep-scan`
- `POST /api/operations/clear-logs`
- `POST /api/operations/reboot`

## Folder Structure

```text
SentinelOS/
|- engine/
|  |- main.py
|  |- analyzers/
|  |  |- health_analyzer.py
|  |- filesystem/
|  |  |- scanner.py
|  |- monitors/
|  |  |- process_monitor.py
|  |  |- system_monitor.py
|  |- services/
|  |  |- anomaly_service.py
|  |- shell/
|     |- shell_manager.py
|- src/
|  |- components/
|  |- hooks/
|  |- lib/
|  |- pages/
|  |- styles/
|  |- workers/
|  |- App.tsx
|  |- index.css
|  |- main.tsx
|  |- types.ts
|- server.ts
|- package.json
|- vite.config.ts
|- tsconfig.json
|- metadata.json
`- README.md
```

## Optimization Details

SentinelOS includes both build-time and runtime optimization strategies.

### Build-Time

- Manual chunk splitting in Vite config:
	- `react-vendor`
	- `motion-vendor`
	- `visualization-vendor`
	- `icons`
	- `vendor`
- Goal: smaller app shell and faster initial route hydration

### Runtime

- Snapshot deduplication before store commits
- requestAnimationFrame-scheduled listener flushes
- Debounced backend refresh on rapid Python updates (150ms)
- WebSocket-first transport with resilient polling fallback
- Web worker for optimization computation/progress to keep UI thread responsive

## Scalability Discussion

### Current Strengths

- Modular service boundaries (monitoring, analysis, APIs, UI domains)
- Push transport architecture (WebSocket) reduces repetitive polling load
- Cached stat snapshots and dedupe logic reduce unnecessary serialization/render overhead

### Growth Path

- Replace in-memory task state with persistent process/session store
- Add multi-node telemetry ingestion and aggregate stream processor
- Introduce RBAC, tenant context, and scoped command policy layers
- Add queue-backed job orchestration for deep scans and cleanup workflows
- Add horizontal API scaling with shared websocket broker (Redis pub/sub pattern)

## Security Considerations

- Shell endpoint enforces allowlist-restricted command base
- Non-allowlisted commands return restricted error path
- File scan walker skips high-risk or bulky directories (`node_modules`, `.git`, `dist`, `.next`)
- Frontend transport includes timeout and fallback controls for resilience

Recommended hardening before production:

- Add authentication and role-based authorization for all action endpoints
- Add CSRF protection, rate limiting, request validation and audit logging
- Sanitize shell command parsing to prevent bypass edge cases
- Isolate shell execution in sandbox/container with strict resource limits
- Move secrets to managed secret store and remove any client-exposed key paths

## Technical Challenges Solved

### 1. Real-Time Data Without UI Thrash

Challenge: high-frequency telemetry can trigger excessive React re-renders.
Solution: deduped snapshots + animation-frame batched store notifications.

### 2. Cross-Language Runtime Bridging

Challenge: integrating Python metric analysis with Node API lifecycle.
Solution: child-process orchestration with structured JSON IPC over stdout.

### 3. Transport Resilience

Challenge: WebSocket reliability under intermittent failures.
Solution: automatic reconnect strategy plus polling fallback path.

### 4. Long-Running UX Responsiveness

Challenge: optimization simulation should not block the main thread.
Solution: moved scan/optimize progress workflow to a dedicated web worker.

### 5. Security-Usable Terminal Experience

Challenge: provide command utility without exposing unrestricted shell risk.
Solution: command allowlist, controlled helpers, and simulated high-risk operations.

## Future Improvements

- Replace simulated optimization metrics with real host-level analyzers
- Add persistent alert history, acknowledgments, and export
- Add historical telemetry storage and time-window replay charts
- Add anomaly model training pipeline for adaptive thresholds
- Add localization and accessibility upgrades (keyboard map, screen reader support)
- Add test matrix (unit, integration, e2e, load) with CI quality gates

## Additional Documentation

- Architecture details: `docs/ARCHITECTURE.md`
- API reference: `docs/API_REFERENCE.md`
- Security and scalability notes: `docs/SECURITY_AND_SCALABILITY.md`

## Hackathon Positioning

SentinelOS is demo-ready for hackathon environments because it provides:

- Strong visual identity and polished interaction model
- End-to-end architecture (UI, APIs, analytics engine)
- Real-time data transport and operational controls
- AI-assisted command workflows and intelligence narratives
- Clear roadmap from prototype to production-hardened platform
