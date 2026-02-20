# OpenAgent Phase 6 Parity Matrix

This matrix tracks OpenAgent behavior parity against OpenClaw after control-layer hardening.

Legend:

- **Supported**: behavior preserved at parity.
- **Degraded**: behavior remains available with constrained UX or stricter gating.
- **Removed**: behavior intentionally unavailable in OpenAgent.

| Area                                   | OpenClaw Baseline                                                       | OpenAgent Status         | Notes                                                                                                       |
| -------------------------------------- | ----------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Gateway startup                        | Gateway process starts and accepts WS clients                           | **Supported**            | Existing startup behavior remains; OpenAgent adds control/audit surfaces without changing startup contract. |
| Chat send/receive                      | Agent chat send/receive path works end-to-end                           | **Supported**            | Runtime message flow is preserved.                                                                          |
| Tool execution without policy gate     | Tools execute directly in permissive paths                              | **Degraded**             | OpenAgent policy is deny-by-default and can require confirmations before execution.                         |
| Approval replay                        | Historically caller-managed, replay prevention not guaranteed uniformly | **Supported** (hardened) | Approval tokens are single-use and hash-bound; replay attempts are rejected.                                |
| Audit trail integrity                  | Event logs existed but tamper detection varied by subsystem             | **Supported** (hardened) | Append-only JSONL with hash-chain verification provides tamper-evident integrity checks.                    |
| Legacy state directory (`~/.openclaw`) | Primary default location                                                | **Supported** (migrated) | OpenAgent migrates idempotently to `~/.openagent/` and keeps legacy compatibility paths.                    |

## Intentional changes

1. **Security-first defaults**: tool invocations now evaluate policy before execution, which can block execution pending approval.
2. **Approval strictness**: approval grants are tied to canonical payloads with expiry and single-use semantics.
3. **Audit verifiability**: exported audit logs are expected to pass hash-chain verification and fail on tampering.

## CI execution guidance

Run the OpenAgent-focused verification suite in CI in this order:

1. `pnpm test src/agents/control-layer/policy.test.ts`
2. `pnpm test src/agents/control-layer/approvals.test.ts`
3. `pnpm test src/agents/control-layer/audit-log.test.ts`
4. `pnpm test src/commands/doctor-state-migrations.test.ts`

Optional full regression:

- `pnpm test`
