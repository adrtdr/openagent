# Codex Coding Guide (KoraClaw)

## Hard constraints (do not violate)

- R3/R4 tools **must not execute** without a valid approval token bound to the exact tool call hash.
- Deny-by-default policy evaluation must be the default in all environments.
- All policy decisions must be auditable (decision + rationale).
- Never log secrets.

## Engineering conventions

- Types everywhere (TypeScript recommended).
- JSON Schema validation on every inbound WS frame.
- Canonicalization function used consistently for hashing.
- Idempotency keys for side effects.

## Deliverables expected

- WS gateway + protocol
- policy engine + DSL
- approval workflow (pending list + decision)
- tool router + at least fs.read/fs.write/system.run/http.request in sandbox mode
- audit logger with hash chain verification

See `IMPLEMENTATION_PLAN.md`.
