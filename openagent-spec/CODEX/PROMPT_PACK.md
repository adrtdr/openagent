# Codex Prompt Pack — OpenAgent (OpenClaw fork)

Use these prompts sequentially. They assume you are working in a local clone of **your fork** (`adrtdr/openagent`) with an upstream remote to `openclaw/openclaw`.

---

## Prompt 0 — Sync fork to a pinned upstream tag (baseline)

You are in an empty folder. Do the following:

1. `git clone https://github.com/adrtdr/openagent.git openagent`
2. `cd openagent`
3. `git remote add upstream https://github.com/openclaw/openclaw.git`
4. `git fetch upstream --tags`
5. Check out a stable tag at/after **v2026.2.12** (or the latest stable tag) as a clean baseline branch:
   - `git checkout -b baseline/<TAG> <TAG>`
6. Create/refresh your long-lived integration branch:
   - `git checkout -B openagent/main`
   - bring in your existing fork commits intentionally:
     - `git merge origin/main` (or cherry-pick)
7. Run baseline checks: `pnpm install` then `pnpm test`.

Output:

- the pinned tag/commit hash
- the commands that passed
- any failing tests (if upstream baseline is failing, stop and report)

Constraints:

- Do not implement control-layer features yet.
- Only resolve what’s required to get to a green baseline (prefer minimal, upstream-compatible fixes).

---

## Prompt 1 — Rename/rebrand: OpenClaw → OpenAgent (compat preserved)

Implement a systematic rename with backward compatibility:

A) Primary naming:

- Repo/product: OpenAgent
- Primary CLI: `openagent`
- Primary state/config dir: `~/.openagent/`

B) Compatibility:

- Accept legacy state/config dir `~/.openclaw/` and auto-migrate to `~/.openagent/` if missing.
- Accept legacy env vars `OPENCLAW_*` as aliases of `OPENAGENT_*` (warn once).
- Optionally keep an `openclaw` CLI shim that forwards to `openagent` and prints a deprecation warning.

Implementation notes:

- Upstream CLI entry point is `openclaw.mjs`. Add a parallel `openagent.mjs` and make it the primary bin.
- Update `package.json#bin` mapping accordingly.
- Update docs strings and UI titles, but DO NOT rename protocol method names yet.

Deliverables:

- README/docs updated for OpenAgent branding
- migration code + tests for `~/.openclaw/` → `~/.openagent/`
- `openagent --help` works; `openclaw` shim works if kept

---

## Prompt 2 — OpenAgent Control Layer: capability gating + approvals + audit (no loss of features)

Add an operator-control layer to tool execution:

1. Capability registry

- Define a canonical capability model (already specified in `openagent-spec/schemas/capability.schema.json`).
- Register each tool/executor with:
  - risk tier (low/med/high/critical)
  - required scopes
  - redaction rules for args/results
  - default confirmation requirement per tier

2. Policy evaluation

- Implement deny-by-default evaluation (see `openagent-spec/SPEC/05_Policy_and_Permissions.md`).
- Decision: ALLOW / DENY / REQUIRE_CONFIRMATION + rationale trace.

3. Approval workflow

- When a tool call is REQUIRE_CONFIRMATION:
  - emit an approval request event
  - block execution until approved or timed out
- Approval token must be:
  - bound to SHA-256 of canonical tool call JSON (see `openagent-spec/scripts/canonicalize_toolcall.py`)
  - single-use
  - expiry-based
  - optionally grant-based (approve for N minutes for a scope + tool)

4. Audit logs

- Emit an audit event for:
  - tool proposed
  - approval requested / approved / denied
  - tool executed + outcome
  - policy decision + rationale
- Store in append-only JSONL + tamper-evident hash chain (see `openagent-spec/scripts/audit_hashchain.py`).

Integration points:

- Intercept tool calls **before execution** in the agent runtime tool execution path (see upstream `src/agents/piembeddedrunner.ts` and related runner code).
- Do not break message routing or streaming behavior.

Constraints:

- Preserve existing tool functionality and streaming behavior.
- Default behavior: safe actions proceed; risky actions require approval.

---

## Prompt 3 — Gateway WS extensions for Studio (config, approvals, audit, runtime)

Implement the WS methods/events required by `openagent-spec/SPEC/14_OpenAgent_UI_ChatGPT_Like.md`.

Add/extend TypeBox schemas (OpenClaw uses TypeBox for protocol schemas) and export JSON Schema for the web UI.

Required methods to implement:

- config.get / config.patch / config.validate
- approvals.list / approvals.get / approvals.decide / approvals.revokeGrant
- audit.query / audit.get / audit.export / audit.verify
- capabilities.list / capabilities.get / capabilities.reload
- runtime.snapshot / runtime.logs.tail / runtime.logs.stop

Required events:

- approvals
- audit
- config
- runtime (optional deltas)

Constraints:

- Enforce auth (token/password/device identity) for all mutating methods.
- Secrets must be redacted in responses by default.

---

## Prompt 4 — OpenAgent Studio (ChatGPT-like UI)

Create a ChatGPT-like web UI served by the gateway at `/studio`:

Features:

- chat with streaming tool cards
- approvals inbox (approve/deny with reason; scoped grant)
- audit log browser + export + verify
- settings/config UI (effective config + sources; schema-driven forms)
- run state inspector (gateway/agents/sessions/nodes/providers)

Implementation:

- Prefer Vite + React + TypeScript (or keep upstream UI stack if already close).
- WS client must be fully typed and validate frames.
- Reuse JSON Schema + uiHints to auto-render settings forms.

Acceptance:

- Studio can complete a full “tool requires approval” cycle end-to-end.

---

## Prompt 5 — Verification + parity tests

Add integration tests to ensure OpenAgent retains OpenClaw functionality while enforcing control:

- Baseline smoke tests:
  - gateway starts and serves UI
  - chat send/receive works
  - at least one channel adapter still initializes (mock)
- Control tests:
  - high-risk tool call triggers approval; cannot execute without approval
  - approval replay fails
  - audit hash chain verifies and detects tampering
- Migration tests:
  - `~/.openclaw/` → `~/.openagent/` migration

Output:

- test matrix updates
- instructions for running locally and in CI
