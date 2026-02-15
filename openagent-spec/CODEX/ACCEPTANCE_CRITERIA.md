# Acceptance Criteria (Non-negotiable)

## Fork integrity + parity

1. **Baseline functionality retained**
   - OpenAgent must preserve **OpenClaw baseline** capabilities (gateway, chat, channels, tools) unless explicitly documented as an intentional change.
   - A parity matrix MUST be maintained (features: supported / degraded / removed).

2. **Upstream update path**
   - OpenAgent changes must be isolated enough to allow regular upstream merges/rebases from `openclaw/openclaw`.
   - Any upstream merge conflicts in control-layer seams must be documented and tested.

## Safety invariants (OpenAgent control layer)

3. **High-risk actions require explicit owner approval**
   - Any capability marked `high` or `critical` requires approval unless policy explicitly grants a scoped exception.
   - No silent approvals. No “trusted by default”.

4. **Approval tokens are bound to the exact tool call**
   - Canonical tool call JSON → SHA-256 hash → token binding.
   - Any argument change invalidates the approval.

5. **Approval tokens are single-use & expire**
   - Replay attempts must fail and be audited.

6. **Deny-by-default**
   - Unknown tools/skills/capabilities are denied until explicitly configured.

7. **Audit is complete and tamper-evident**
   - Every proposed and executed action is logged (including approvals and policy decisions).
   - Hash chain verification must detect tampering.

## Studio UI (ChatGPT-like) requirements

8. **Full transparency**
   - UI shows: tool proposals, pending approvals, executions, results, errors, and audit event ids.

9. **Full control surface**
   - UI can approve/deny, manage scoped grants, and edit policy/config (with validation + reload feedback).

10. **Config + secrets hygiene**
   - Secrets are redacted by default.
   - Revealing secrets requires explicit owner action, and is audited.
