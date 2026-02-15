# OpenAgent Studio — ChatGPT-like Control UI Specification

## Objectives

OpenAgent Studio is a **browser UI** (ChatGPT-like) that provides:

1. **Chat** with live streaming responses and tool cards.
2. **Full transparency** into what the agent is doing (plans, tool proposals, executions, errors).
3. **Owner control**: approvals inbox, policy/capability gating visibility, and one-click deny/allow flows.
4. **Operability**: runtime status, sessions, nodes, providers, logs, export.

This UI is **not optional**. It is the primary operator surface.

## Information architecture

### Layout (desktop)

- **Left sidebar**
  - Search
  - Conversation list (sessions)
  - “New chat” / “Reset session”
  - Quick toggles: model, thinking level, verbose, “safe mode”

- **Main panel**
  - Chat transcript (streaming)
  - Tool cards (proposal → awaiting approval → executing → done)
  - Inline references to audit event ids

- **Right inspector (tabbed)**
  1. **Run State**
     - gateway: version, bind, auth mode, uptime, health, reload mode
     - agent: model/provider, tool policy mode, sandbox on/off, workspace path
     - active nodes: paired/connected, capabilities, permission status
  2. **Approvals**
     - pending approvals queue
     - approval detail: tool name, args (redacted where secret), risk score, policy trace
     - actions: approve once, approve for N minutes (scoped grant), deny (with reason)
  3. **Policy & Capabilities**
     - capability registry (tool → risk tier → required scopes)
     - effective policy rules and their precedence
     - “why” trace explorer for the selected tool call
  4. **Audit Log**
     - filterable timeline (by session, actor, tool, outcome, risk tier)
     - detail view for a single audit event
     - verify hash-chain status + export bundle
  5. **Settings**
     - schema-driven config editor for gateway + agents + channels + plugins
     - shows: **effective config**, with overlays (defaults → file → env → runtime)
     - secrets: stored but redacted in UI; reveal only via explicit owner action
  6. **System**
     - log tails (gateway + agent + channel adapters), with redaction
     - background jobs, cron, webhooks, queue depth
     - emergency controls (disable tools, lock down channels, safe shutdown)

### Mobile

- Same primitives, but collapsed:
  - bottom tabs: Chat / Approvals / Status / Logs / Settings

## Data sources and protocol (Gateway WS)

Studio connects via the existing Gateway WebSocket and MUST use only **documented WS methods/events**.

### Required methods (existing in OpenAgent docs)

- `connect` (handshake; includes auth)
- `health` (full snapshot)
- `status` (summary)
- `system-presence`
- `chat.history`, `chat.send`, `chat.abort`, `chat.inject`
- `agent` (run an agent turn; streams `agent` events)

(These are described in OpenAgent Gateway runbook and Control UI docs.)

### OpenAgent-required extensions

Add these WS methods:

#### Config / settings

- `config.get` → returns:
  - `effective` (merged)
  - `sources` (defaults/file/env/runtime overrides)
  - `schema` (JSON Schema + uiHints)
- `config.patch` → applies a JSON Patch (RFC 6902) against the config file section(s)
  - writes to config file (JSON5)
  - triggers hot reload (or restart-required response)
- `config.validate` → validates a candidate config without applying

#### Approvals

- `approvals.list` (filters, pagination)
- `approvals.get` (by id)
- `approvals.decide` (approve/deny + optional scoped grant)
- `approvals.revokeGrant` (revoke a time-bound grant)

#### Audit

- `audit.query` (filters + pagination; returns event summaries)
- `audit.get` (full event)
- `audit.export` (creates an export bundle; returns handle)
- `audit.verify` (verifies hash chain; returns verification report)

#### Capability registry

- `capabilities.list`
- `capabilities.get`
- `capabilities.reload` (admin-only)

#### Runtime introspection

- `runtime.snapshot` (single snapshot combining health + sessions + nodes + tool queue)
- `runtime.logs.tail` (stream last N lines with subscription token)
- `runtime.logs.stop`

### Required events

Studio must subscribe and render:

- `presence` (client/node presence)
- `agent` (streamed tool/output events)
- `approvals` (approval queue changes)
- `audit` (new audit events)
- `config` (hot reload applied/restart required)
- `runtime` (optional: periodic state deltas)

## UI state model (authoritative keys)

Studio maintains an in-memory state graph:

- `connection`: { connected, latencyMs, authMode, clientId }
- `sessions`: list + selectedSessionId
- `chat`: per-session transcript + streaming cursor
- `pendingApprovals`: list + selectedApprovalId
- `capabilities`: registry + per-tool metadata
- `policy`: effective policy + evaluation traces cache
- `audit`: query results + selectedEventId + verificationStatus
- `config`: effective + sources + dirtyDraft + validationErrors
- `runtime`: health snapshot + logs tail buffers

The exact JSON shapes are defined by the schemas in `schemas/ui.*.schema.json`.

## Security requirements

- Studio must **never** send secrets back to the browser unless the owner explicitly requests reveal.
- All state and logs MUST support **redaction** at the gateway boundary.
- Approval actions MUST require:
  - owner authentication (token/password + device identity)
  - replay-safe CSRF mechanism for browser context (same-origin WS constraints)
- Studio must show a visible warning when:
  - gateway is bound beyond loopback
  - auth is weak/disabled
  - any “dangerous bypass” flags are set

## Implementation approach

Preferred approach (min-risk):

1. Keep the existing Control UI for compatibility.
2. Add **OpenAgent Studio** as a new SPA served by the gateway at `/studio`:
   - tech: Vite + React (or Lit if matching upstream UI), TypeScript, zod/typebox schema sync.
3. Implement WS client with strong typed frames.
4. Render schema-driven settings forms using JSON Schema + uiHints (same concept as OpenAgent plugin UI hints).

## Acceptance criteria

- Studio can run against a local gateway and:
  - chat + stream tool calls
  - block execution pending approval
  - approve/deny and see effects in real time
  - browse audit logs and export + verify a log bundle
  - view and edit config, with validation and hot-reload feedback
