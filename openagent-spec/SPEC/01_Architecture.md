# Architecture

## Goals

1. **OpenAgent-class UX**: talk from chat surfaces; the agent can plan and act using tools.
2. **Operator-grade control (Kora-style)**: the operator remains the ultimate authority for risky actions.
3. **Local-first**: run on your machine or private infra; minimize cloud dependence.
4. **Auditable**: every relevant decision and side effect is logged and reviewable.
5. **Extensible**: skills/extensions can be added, but are permission-gated.

## Non-goals

- “Full autonomy” with unlimited privileges.
- Implicit approvals, hidden background actions, or non-audited execution.

## High-level components

### Gateway (daemon, control plane)

Responsibilities:

- Terminates **WebSocket** connections from clients, channel adapters, and nodes.
- Owns **state**: sessions, pairing, policy grants, audit logs.
- Runs agent loops via the **Agent Runner**.
- Brokers tool execution via **Tool Router** and **Policy Engine**.
- Emits event streams: agent output, tool proposals, approvals, audit.

### Agent Runner

Responsibilities:

- Assemble context (session history + workspace bootstrap + skill prompts).
- Call the model via a **Model Adapter**.
- Parse tool call proposals; forward to Tool Router.
- Serialize runs per session via a **lane/queue** system (to avoid races).

### Policy Engine (authorizer)

Responsibilities:

- Evaluate proposed actions against:
  - operator policies (deny/allow rules),
  - workspace/session scope,
  - identity context (who asked, from which channel),
  - risk tier & sensitivity classification.
- Output: **ALLOW | DENY | REQUIRE_CONFIRMATION** (with rationale).

### Confirmation Service

Responsibilities:

- Convert REQUIRE_CONFIRMATION decisions into Approval Requests.
- Present to operator via client(s) (web/CLI/mobile).
- Mint single-use **approval tokens** bound to canonical tool call.

### Tool Router / Executors

Responsibilities:

- Execute capabilities (filesystem, shell, browser automation, HTTP, integrations).
- Enforce sandboxing and resource controls.
- Emit structured tool results and audit events.

### Nodes (device endpoints)

Responsibilities:

- Advertise capabilities (and OS permission state).
- Execute device-local actions when invoked (camera, screen, local shell).
- Use pairing + device identity.

### Channel Adapters

Responsibilities:

- Inbound messages (DMs/groups) → normalized Gateway events.
- Outbound assistant messages → channel sends.
- Basic allowlists and pairing flows to avoid untrusted inbound control.

## Data flows

1. **Inbound message**

- Channel Adapter → Gateway: `message.received`.
- Gateway resolves session routing and creates an Agent Run.

2. **Agent loop**

- Agent Runner calls model.
- Model may emit tool proposals.
- Tool Router evaluates policy.
- If ALLOW: execute tool.
- If REQUIRE_CONFIRMATION: create Approval Request; await operator decision.
- If DENY: return denial to agent; agent must re-plan.

3. **Streaming**

- Agent output and tool lifecycle events are streamed to clients.

## Trust boundaries

- **Inbound DMs** are untrusted input.
- **Skills/extensions** are untrusted code unless pinned, signed, and reviewed.
- **LLM output** is untrusted: tool calls must be authorized _outside_ the model.

## Minimal recommended stack (reference, not mandatory)

- Gateway/runner/router: Node.js + TypeScript
- Web UI: Next.js (or any WS-capable SPA)
- Storage: SQLite (local) + JSONL audit log export
- Policy DSL: YAML (compiled to internal AST) or Cedar/OPA (optional)

## Diagrams

See `diagrams/architecture.mmd`.
