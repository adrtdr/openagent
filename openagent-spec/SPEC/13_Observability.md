# Observability

## Metrics

- agent runs: count, duration, timeouts
- tool calls: count, failures by toolId
- approvals: pending count, time-to-approve, deny rate
- policy decisions: allow/deny/confirm ratios
- queue depth: per-session lane backlog

## Logs

- Structured logs (JSON) for:
  - gateway lifecycle
  - WS connections
  - tool execution lifecycle
- Do NOT mix audit logs with debug logs.

## Traces

- Optional OpenTelemetry tracing:
  - span per agent run
  - nested spans for tool calls and policy evaluations

## Health endpoints (local)

- `/health` (ready/live)
- `ws` heartbeat
