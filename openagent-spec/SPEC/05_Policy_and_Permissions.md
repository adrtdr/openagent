# Policy & Permissions

## Principles (enforced)

1. **Deny by default**
2. **Least privilege**
3. **Human-in-the-loop for side effects**
4. **No hidden escalation**
5. **Explicit scoping** (who/what/where/how long)
6. **Tamper-evident logging**
7. **Explainable decisions** (why allow/deny/confirm)
8. **Safe retries** (idempotency keys)

## Policy engine output

- `ALLOW`
- `DENY`
- `REQUIRE_CONFIRMATION` with:
  - `reason`
  - `requiredLevel`: `basic | strong | 2fa`
  - `suggestedScope`: `once | session | timebound | persistent`
  - `constraints`: (editable parameters: path/domain limits, max cost, etc.)

## Policy model

### Principals
- `operator:{userId}`
- `agent:{agentId}` (session-scoped)
- `channel:{channelId}` (Telegram, WhatsApp, etc.)
- `node:{nodeId}`
- `skill:{skillId}`

### Resources
- `tool:{toolId}`
- `file:{path}`
- `url:{domain}`
- `workspace:{workspaceId}`
- `secret:{secretId}`

### Actions
- `tool.invoke`
- `skill.install`
- `skill.enable`
- `node.pair.approve`
- `message.send`
- `audit.export`

### Context
- channel trust (paired/unknown)
- session metadata
- risk tier
- time, geo (optional)
- model/provider
- rate metrics

## Permission grants

A grant is a stored decision that enables future actions without prompting, within a bounded scope:

Grant fields:
- `principal` (operator)
- `action` + `resourcePattern`
- `constraints` (path prefix, domain list, max cost)
- `scope` (once/session/timebound/persistent)
- `expiresAt` (required unless persistent)
- `createdBy` + `createdAt`
- `auditRef` (link to approval event)

**Critical rule**: Persistent grants for R3+ should be discouraged and require step-up auth.

## Workspace scopes

- Each workspace has:
  - root dir
  - allowed tools
  - skill allowlist
  - network allowlist
  - secret namespaces

Default:
- fs.write limited to workspace root.
- skills disabled unless explicitly enabled.

## Channel trust and pairing

Inbound commands from messaging channels are untrusted by default:
- Require **pairing** (explicit allowlist per sender/account) before treating as operator control.
- Even paired channels should never bypass R3/R4 confirmations.

## Policy DSL

YAML-based DSL compiled to internal rules (example in `examples/config.policy.yaml`):

Rule example:
- If `toolId == system.run` then `REQUIRE_CONFIRMATION(level=strong)`
- If `fs.write` and `path startsWith workspaceRoot` then `ALLOW` else `REQUIRE_CONFIRMATION`

Schema: `schemas/policy.schema.json`.
