# Implementation Plan (Codex-ready) — OpenAgent (OpenClaw fork)

This plan assumes OpenAgent is a **fork of OpenClaw** with additional operator-control features.

## Phase 0 — Pin upstream baseline + keep fork mergeable

- Clone your fork (`adrtdr/openagent`) and add upstream remote (`openclaw/openclaw`).
- Pin a stable upstream tag (recommended: `v2026.2.12` or newer).
- Create a clean baseline branch from the tag, then merge/cherry-pick your existing fork changes.
- Run baseline tests and record commit hash.

Acceptance:

- Baseline builds/tests pass (or failures are documented as upstream).

## Phase 1 — Rename + compatibility (OpenClaw → OpenAgent)

- Introduce `openagent` as the primary CLI.
- Keep (optional) `openclaw` shim for compatibility.
- Change default state/config root to `~/.openagent/`.
- Implement migration from `~/.openclaw/` → `~/.openagent/` (idempotent).
- Accept legacy env vars `OPENCLAW_*` as aliases (warn once).

Acceptance:

- `openagent gateway` works.
- Existing `~/.openclaw/` users can upgrade without data loss.

## Phase 2 — Capability registry + deny-by-default policy

- Define capability metadata for all tools/executors.
- Implement policy evaluator:
  - ALLOW / DENY / REQUIRE_CONFIRMATION
  - trace/rationale for UI display

Acceptance:

- Unit tests for policy precedence and default-deny.
- Policy trace is stable and serializable.

## Phase 3 — Owner confirmations (approvals + scoped grants)

- Approval request lifecycle:
  - request → pending → approve/deny → finalize
- Token binding:
  - canonical tool call → SHA-256 hash → single-use token
- Optional “scoped grant”:
  - approve for N minutes / N uses / within scope

Acceptance:

- Replay fails.
- Arg change requires new approval.
- Expired tokens fail.

## Phase 4 — Audit logging (tamper-evident)

- Write audit events for:
  - tool proposed
  - approval requested/decided
  - tool executed outcome
  - policy decision + rationale
- Append-only JSONL with hash chain + index.
- Verification command/script.

Acceptance:

- Hash-chain verifier passes for normal logs.
- Any modification is detected.

## Phase 5 — Gateway WS extensions for Studio

- Implement methods/events listed in `SPEC/14_OpenAgent_UI_ChatGPT_Like.md`.
- Ensure redaction and auth enforcement.

Acceptance:

- WS API contract tests pass.

## Phase 6 — OpenAgent Studio UI

- Build `/studio` UI:
  - chat + tool cards
  - approvals inbox
  - audit browser + export/verify
  - config editor (effective + sources) with validation
  - runtime status panels

Acceptance:

- End-to-end approval cycle demonstrable in UI.

## Phase 7 — Regression + parity

- Regression tests to ensure OpenClaw baseline features remain functional.
- Add a “parity matrix” checklist (features supported, degraded, or intentionally changed).

Acceptance:

- Parity matrix is complete and signed off.
- CI green.
