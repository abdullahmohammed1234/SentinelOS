# SentinelOS Architecture

## Purpose
This document explains how SentinelOS components interact at runtime and why the current architecture supports fast demo workflows with clear extension points.

## Architectural Style
SentinelOS follows a modular, layered architecture:

- UI and interaction layer (React pages/components)
- Client state and transport layer (hooks/store/WebSocket+polling)
- API and orchestration layer (Express)
- Analytics and telemetry engine layer (Python)

## Runtime Topology

```text
Browser (React)
  -> REST calls (/api/*)
  -> WebSocket (/ws/stats)
Express Server (Node)
  -> Spawns Python child process (engine/main.py)
  -> Receives JSON snapshots via stdout
  -> Normalizes + caches telemetry
  -> Broadcasts updates via WebSocket
Python Engine
  -> Reads system/process metrics
  -> Computes health score, anomalies, recommendations
```

## Frontend Composition

- Routing shell in src/App.tsx
- Page modules in src/pages
- Reusable UI modules in src/components
- Domain hooks in src/hooks
- Shared telemetry store in src/lib/systemStatsStore.ts
- Background worker in src/workers/optimizationWorker.ts

## Backend Composition

Main entrypoint: server.ts

Core responsibilities:

- telemetry snapshot generation
- cache and websocket broadcast
- shell command endpoint with allowlist policy
- process action endpoint
- file intelligence and quick operation endpoints
- Vite middleware in development and static serving in production

## Python Engine Composition

Main entrypoint: engine/main.py

Modules:

- monitors/system_monitor.py: CPU, memory, disk metrics
- monitors/process_monitor.py: process discovery via /proc
- analyzers/health_analyzer.py: health score and anomaly heuristics
- services/anomaly_service.py: risk scoring service
- filesystem/scanner.py: intelligent file scanning helpers

## Data Contracts

Key frontend contract is SystemStats (src/types.ts), including:

- cpu and cpuThreads
- memory
- process tree and tasks
- disk and network
- thermal map
- battery
- timestamp

Transport envelope for websocket:

```json
{
  "type": "stats",
  "payload": { "...": "SystemStats" }
}
```

## Performance Design Decisions

- snapshots are deduplicated in frontend store to avoid unnecessary paints
- listener notifications are batched with requestAnimationFrame
- websocket is primary transport, polling is fallback
- server refresh pushes are debounced when Python emits quickly
- worker thread isolates optimization progress logic from main UI thread

## Extensibility

Short-term extension points:

- replace mock process/tasks with host-backed providers
- persist telemetry and alerts to a data store
- add auth middleware and role-based endpoint guards
- add multi-host agent ingestion and aggregate dashboards

## Failure Modes and Recovery

- Python executable not found: engine status becomes degraded, app continues with fallback data
- malformed engine output lines: ignored safely by parser
- websocket drop: frontend switches to polling and attempts reconnect
- API timeout: frontend reports error state while preserving previous snapshot
