# SentinelOS Security and Scalability Notes

## Security Considerations

Current safeguards:

- command-base allowlist for shell endpoint
- controlled command simulation for unsupported operations
- directory skip lists in file scanning logic
- resilient frontend timeout handling for transport failures

Current limitations:

- no authentication or authorization middleware on sensitive endpoints
- shell execution still uses child process exec for allowed commands
- no endpoint rate limiting
- no persistent audit logs for security actions

Recommended hardening roadmap:

1. Add authentication and role-based access control.
2. Add schema validation for all request bodies.
3. Add rate limits and anti-automation controls.
4. Replace raw command execution with sandboxed command runner.
5. Add immutable audit trail for command and process actions.
6. Integrate secret management and environment isolation.

## Scalability Discussion

Current strengths:

- WebSocket push architecture minimizes repeated client polling
- modular frontend and backend boundaries support parallel development
- deduped snapshots and batched UI updates reduce render pressure

Current bottlenecks:

- in-memory process/task state does not scale across instances
- single-node websocket broadcast model
- CPU and file intelligence operations can become heavy on large hosts

Scaling strategy:

1. Introduce a shared state layer (Redis/Postgres) for distributed backend instances.
2. Move deep scans and cleanup to background job workers.
3. Add broker-backed websocket fanout for multi-instance deployments.
4. Persist telemetry to time-series storage for historical analytics.
5. Add host-agent model for multi-machine monitoring and tenancy.

## Technical Challenges Solved

- Real-time UI consistency under frequent telemetry updates
- Safe-enough terminal behavior while preserving interactivity
- Cross-language integration (Node + Python) using stdout JSON IPC
- Degraded-mode behavior when Python runtime is unavailable
- Responsive optimization UX through worker-based off-main-thread processing

## Future Improvements

- replace simulated values with host-native metric providers per platform
- define typed API schemas and generate client SDK
- add test suites: unit, integration, end-to-end, load
- add observability stack (metrics, traces, structured logs)
- add policy engine for command permissions by role and context
