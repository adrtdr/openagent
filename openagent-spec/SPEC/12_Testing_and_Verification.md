# Testing & Verification

## Testing layers

1. Unit tests
- Policy evaluation (allow/deny/confirm)
- Canonicalization + hashing
- Approval token validation
- Redaction filters

2. Integration tests
- WS connect + pairing flow
- Approval flow end-to-end
- Tool execution pipeline in sandbox
- Audit chain verification

3. Security regression tests
- Prompt injection attempts must not trigger tool execution without approval
- Malicious skill attempts to register undeclared tool must fail

4. Formal models (optional)
- TLA+/Alloy models for:
  - approval token single-use
  - pairing + pending expiry
  - session lane serialization

## Acceptance tests (must pass)

- “No R3+ without approval” property:
  - simulate tool proposal; ensure execution blocked until approved.
- Replay attempt:
  - reuse approval token; must fail and audit.
- Modified args attempt:
  - approval for `{cmd:"ls"}` must not authorize `{cmd:"rm -rf /"}`.

See:
- `CODEX/UNIT_TEST_MATRIX.md`
- `CODEX/INTEGRATION_TEST_MATRIX.md`
