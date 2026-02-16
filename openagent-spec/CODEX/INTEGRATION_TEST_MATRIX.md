# Integration Test Matrix

## Runtime + Gateway

- Gateway starts and serves WS endpoints.
- Gateway serves Studio UI at `/studio`.
- WS connect handshake succeeds for valid clients.
- Unpaired node is denied before invocation.
- Pairing request -> approve -> `node.invoke` succeeds with valid approvals.

## Control Layer

- Tool proposal -> policy decision -> approval request -> approve -> execution.
- Tool proposal -> policy decision -> approval request -> deny -> structured error.
- Approval gating blocks execution until approved/denied/timeout.
- Approval replay with already-used token fails.
- Approval token with modified canonical tool JSON fails.

## Audit + Integrity

- Audit events are emitted for proposed/decision/approval/execution lifecycle.
- Audit export produces append-only JSONL.
- Audit hash-chain verifier passes on untampered logs.
- Audit hash-chain verifier fails on tampered logs.

## Config + Migration

- Config read/patch/validate methods enforce redaction defaults.
- Legacy state migration from `~/.openclaw/` to `~/.openagent/` is idempotent.

## CI instructions

Recommended CI command set for parity verification:

1. `pnpm test src/agents/control-layer/policy.test.ts`
2. `pnpm test src/agents/control-layer/approvals.test.ts`
3. `pnpm test src/agents/control-layer/audit-log.test.ts`
4. `pnpm test src/commands/doctor-state-migrations.test.ts`

Full suite before release:

- `pnpm test`
