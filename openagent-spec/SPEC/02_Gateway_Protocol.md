# Gateway Protocol (WebSocket)

## Transport

- WebSocket, UTF-8 JSON frames.
- First frame MUST be `connect`.
- After connect:
  - Requests: `{ "type":"req", "id":"...", "method":"...", "params":{...} }`
  - Responses: `{ "type":"res", "id":"...", "ok":true, "payload":{...} }`
  - Errors: `{ "type":"res", "id":"...", "ok":false, "error":{ "code":"...", "message":"...", "details":{...} } }`
  - Events (server push): `{ "type":"event", "event":"...", "payload":{...}, "seq":123 }`

## Roles

`connect.params.role` ∈:
- `client` (web UI, CLI)
- `channel` (messaging adapters)
- `node` (device endpoints)

## Authentication

Two layers:

1) **Gateway access auth**
- Shared token (local) or OIDC (remote) depending on deployment.
- `connect.params.auth` may include `{ token }` or `{ oidc:{...} }`.

2) **Device identity + pairing**
- `connect.params.device` includes:
  - `deviceId` (stable per install),
  - `publicKey` (ed25519),
  - `signature` over gateway challenge.

Pairing:
- Unpaired deviceIds are denied or placed in `pending` with an event for operator approval.

## Idempotency

Side-effecting methods MUST include `idempotencyKey`.
Gateway stores a short-lived dedupe cache per method+key to enable safe retries.

## Core methods (minimum)

### Session / agent
- `session.create`
- `session.get`
- `session.patch`
- `agent.run`
- `agent.wait`
- `agent.cancel`

### Messaging
- `message.send` (channel adapter emits actual send)
- `message.list`

### Node management
- `node.pair.request`
- `node.pair.list`
- `node.pair.approve`
- `node.pair.reject`
- `node.invoke`
- `node.list`
- `node.describe`

### Policy / approvals
- `policy.get`
- `policy.set`
- `approval.request.list`
- `approval.decide` (approve/deny/modify)
- `approval.token.verify` (internal use)

### Audit
- `audit.query`
- `audit.export`

## Events

- `presence.changed`
- `message.received`
- `message.sent`
- `agent.stream` (assistant/tool/lifecycle)
- `tool.proposed`
- `tool.executed`
- `approval.requested`
- `approval.resolved`
- `node.pair.requested`
- `node.pair.resolved`
- `health.heartbeat`

## Frame validation

All inbound frames MUST validate against JSON Schema prior to handling.
Schemas are in `schemas/gateway.*.schema.json`.

## Security invariants

- Tool execution endpoints (`node.invoke`, `tool.execute`) are NEVER callable directly from untrusted channels.
- `approval.decide` only accepted from operator-authenticated clients.
- A `tool.execute` request must reference a valid, unexpired approval token if policy demands it.
