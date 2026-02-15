# Tooling & Capability Gating

## Capability manifest

Every tool/capability MUST declare a manifest entry:

- `id`: stable identifier (e.g., `system.run`)
- `category`: `fs | system | network | browser | comms | secrets | payments | admin`
- `riskTier`: R0–R4
- `sideEffects`: boolean
- `dataAccess`: list (e.g., `files`, `clipboard`, `camera`, `network`)
- `requires`: list of prerequisites
  - OS permissions (TCC on macOS), sandbox scope, allowlists
- `defaultPolicy`: allow/deny/confirm + suggested scope
- `redaction`: default sensitive fields to redact in logs
- `rateLimits`: per session / per minute

Schema: `schemas/capability.schema.json`.

## Default capability taxonomy (suggested)

R0 (no approval):
- `text.transform`, `math.eval`, `code.format`

R1 (often allow):
- `fs.read` within workspace
- `http.get` to allowlisted docs domains

R2 (confirm by policy or allow with scope):
- `fs.write` within workspace
- `browser.open` + `browser.click` on allowlisted domains

R3 (always confirm):
- `system.run` shell command execution
- `fs.write` outside workspace
- `http.request` to arbitrary domains
- `secrets.get`

R4 (always confirm + step-up):
- `payments.*`
- `account.delete`, `account.transfer`
- `admin.escalate` (sudo)
- `fs.delete` large tree / destructive

## Capability gating pipeline

1) Tool call proposed.
2) Tool Router loads manifest and computes effective risk tier.
3) Policy Engine evaluates:
   - principal (who asked),
   - channel trust,
   - workspace scope,
   - tool risk,
   - resource targets (paths/domains),
   - time, rate, previous approvals.
4) Output:
   - ALLOW → execute
   - DENY → return error to agent
   - REQUIRE_CONFIRMATION → create Approval Request and block until resolved
5) On execution:
   - enforce sandbox (chroot/container), allowlists, rate limits, timeouts.

## Sandbox requirements

For any R2+ tool:
- Hard limits: CPU/timeouts, max output size, file allowlists.
- Prefer running in:
  - container (Docker) or OS sandbox,
  - with a dedicated, non-privileged user.

For R3/R4:
- No direct host access unless explicitly approved and logged.
- Strongly recommend a separate “runner VM” or container with minimal secrets.

## Network egress controls

- Deny-by-default for arbitrary domains.
- Per-policy allowlists:
  - domains,
  - methods,
  - max payload sizes,
  - DNS pinning optional.

## Examples

See `examples/config.capabilities.yaml`.
