# SentinelOS API Reference

Base URL: http://localhost:3000

## Health

### GET /api/health
Checks backend health.

Response:

```json
{
  "status": "ok",
  "environment": "development"
}
```

## Telemetry

### GET /api/stats
Returns latest normalized telemetry snapshot.

Notes:

- response uses no-store cache policy
- source can include Python engine metrics and simulated fallback values

Response (truncated):

```json
{
  "cpu": 23.4,
  "memory": { "used": 7400, "total": 16000, "percentage": 46.2 },
  "tasks": [],
  "disk": { "used": 48, "total": 512, "percentage": 9.5 },
  "network": { "upload": 12, "download": 145 },
  "timestamp": 1714400000000
}
```

### WS /ws/stats
Push stream for real-time telemetry envelopes.

Payload:

```json
{
  "type": "stats",
  "payload": { "...": "SystemStats" }
}
```

## Shell

### POST /api/shell/exec
Executes allowed shell command.

Request:

```json
{
  "command": "ls"
}
```

Response:

```json
{
  "output": "...",
  "error": null,
  "cwd": "..."
}
```

Allowed command bases:

- ls
- pwd
- whoami
- uname
- uptime
- free
- df
- top
- ps
- du
- cd
- cat
- src

Special simulated commands:

- clean temp
- network status

## Process Controls

### POST /api/processes/:id/action
Applies action to a process/task.

Request:

```json
{
  "action": "terminate"
}
```

Action options:

- terminate
- suspend
- resume

## File Intelligence

### GET /api/files
Returns base file tree payload for explorer/demo view.

### GET /api/intelligence/scan
Runs server-side scan and returns aggregate file intelligence.

Response fields:

- files
- stats.totalSize
- stats.fileCount
- stats.categories
- stats.largeFiles
- stats.duplicates
- stats.tempFiles

### POST /api/intelligence/cleanup
Returns cleanup simulation summary.

Response:

```json
{
  "success": true,
  "message": "Temporary files cleared.",
  "reclaimed": "2.4 MB"
}
```

## Operations

### POST /api/operations/deep-scan
Simulated deep scan operation.

### POST /api/operations/clear-logs
Simulated system log truncation and archive operation.

### POST /api/operations/reboot
Acknowledges reboot sequence initiation for frontend flow.

## Error Handling Notes

- restricted shell command returns error text in JSON response
- missing process id for action returns 404
- file scanning gracefully skips permission and access failures
