# OpenAgent — Codex Master Prompt (Single Prompt, Phased Execution)

You must execute the phases in this document sequentially (Phase 0 → Phase N) and follow ALL rules below.

## EXECUTION RULES (MANDATORY)

1. Execute phases strictly in order. Do not skip or reorder.
2. At the end of EACH phase:
   - run the phase’s required checks/tests,
   - print the phase’s required “Output/Deliverables”,
   - start the next phase and continue.
3. If a phase indicates “stop and report”, stop and report.
4. Do not merge phases. Do not batch changes across phases.
5. Respect each phase’s constraints.
6. **Commit rule (MANDATORY):** At the end of each successful phase, create a git commit with message:
   - `OpenAgent: Phase X`
   Then print:
   - `git status`
   - `git --no-pager log -1 --oneline`
   - `git --no-pager show --stat`
7. Security/branding constraints:
   - Do not log secrets. Redact by default in API and UI.
   - If branding references a “sexy assistant”, it must be **adult**, **non-explicit**, **no nudity**, **fully clothed**.

---

# Phase 0 — Sync fork to pinned upstream baseline

You are in an empty folder.

1. Clone the fork:
   - `git clone https://github.com/adrtdr/openagent.git openagent`
   - `cd openagent`
2. Add upstream and fetch tags:
   - `git remote add upstream https://github.com/openclaw/openclaw.git`
   - `git fetch upstream --tags`
3. Pin to a stable tag at/after **v2026.2.12** (or the latest stable tag):
   - `git checkout -b baseline/<TAG> <TAG>`
4. Create/refresh the integration branch:
   - `git checkout -B openagent/main`
   - merge or cherry-pick your fork’s existing changes intentionally:
     - `git merge origin/main`  (or cherry-pick)
5. Run baseline checks:
   - `pnpm install`
   - `pnpm test` (or repo equivalent)

Output/Deliverables:

- pinned `<TAG>` and commit hash
- test commands executed and results
- if upstream baseline fails, FIX and report

Constraints:

- Prefer minimal, upstream-compatible fixes only if absolutely required to reach a green baseline.

---

# Phase 1 — Rename/rebrand: OpenClaw → OpenAgent (compat preserved)

Implement a systematic rename with backward compatibility.

## Primary naming

- Product: **OpenAgent**
- Primary CLI: `openagent`
- Primary state/config root: `~/.openagent/`

## Compatibility

- Migrate legacy state/config from `~/.openclaw/` → `~/.openagent/` (idempotent).
- Accept legacy env vars `OPENCLAW_*` as aliases of `OPENAGENT_*` (warn once per process).
- Optionally keep an `openclaw` CLI shim that forwards to `openagent` and prints a deprecation warning.

## Implementation notes

- Upstream CLI entry point is `openclaw.mjs`. Add `openagent.mjs` and map it in `package.json#bin`.
- Update docs strings and UI titles, but DO NOT rename protocol method names yet.
- Keep protocol method names stable; add new control-plane methods under `openagent.*`.

Checks:

- `pnpm test`

Output/Deliverables:

- `openagent --help` works
- migration tests for `~/.openclaw/` → `~/.openagent/`
- docs updated for OpenAgent branding

---

# Phase 2 — OpenAgent Control Layer: capabilities + policy + approvals (no feature loss)

Implement control-layer primitives per:

- `openagent-spec/SPEC/04_Tooling_and_Capabilities.md`
- `openagent-spec/SPEC/05_Policy_and_Permissions.md`
- `openagent-spec/SPEC/06_Confirmation_UX.md`

Requirements:

1. Capability registry (risk tier + scopes + redaction rules).
2. Deny-by-default policy evaluation with trace/rationale:
   - ALLOW / DENY / REQUIRE_CONFIRMATION.
3. Approval lifecycle:
   - approval request emitted as event
   - execution blocks until approved/denied/timeout
   - approval tokens:
     - SHA-256 bound to canonical tool call JSON
     - single-use
     - expiry-based
     - optional scoped grants

Integration:

- Intercept tool calls **before execution** in the agent runtime tool path (e.g. `src/agents/piembeddedrunner.ts` and related runner code).

Checks:

- unit tests for policy + approvals + token replay protection

Output/Deliverables:

- capability registry populated for core tools
- policy engine wired into tool execution path
- approval requests emitted and enforce blocking behavior

---

# Phase 3 — Audit logging (tamper-evident)

Implement audit events + storage per `openagent-spec/SPEC/07_Audit_Logging.md`.

Requirements:

- Append-only JSONL log
- Hash chain (tamper evident)
- Verifier command/script
- Emit events for:
  - tool proposed
  - policy decision
  - approval requested/decided
  - tool executed outcome

Checks:

- verifier passes on normal logs
- verifier detects tampering

Output/Deliverables:

- audit storage + verifier + tests

---

# Phase 4 — Gateway WS API extensions for Studio

Implement the WS methods/events required by:

- `openagent-spec/SPEC/14_OpenAgent_UI_ChatGPT_Like.md`
- `openagent-spec/SPEC/02_Gateway_Protocol.md`

Required methods:

- config.get / config.patch / config.validate
- approvals.list / approvals.get / approvals.decide / approvals.revokeGrant
- audit.query / audit.get / audit.export / audit.verify
- capabilities.list / capabilities.get / capabilities.reload
- runtime.snapshot / runtime.logs.tail / runtime.logs.stop

Required events:

- approvals
- audit
- config
- runtime (optional)

Constraints:

- Auth required for mutating methods.
- Redact secrets by default.

Checks:

- protocol contract tests (typed frames + schema validation)

Output/Deliverables:

- WS methods + events working end-to-end with unit/integration coverage

---

# Phase 5 — OpenAgent Studio UI (/studio)

Create a ChatGPT-like operator UI served by the gateway at `/studio`.

Must include:

- chat with streaming + tool cards
- approvals inbox (approve/deny + scoped grant)
- audit explorer + export + verify
- settings/config editor (schema-driven forms)
- runtime status inspector

Checks:

- end-to-end approval cycle in UI
- no secret leaks by default

Output/Deliverables:

- `/studio` shipped and reachable
- UI wiring to WS is fully typed

---

# Phase 6 — Verification + parity matrix

Add integration tests to ensure OpenAgent retains OpenClaw functionality while enforcing control:

- gateway starts and serves UI
- chat send/receive works
- approval gating blocks execution until approved
- approval replay fails
- audit hash chain verifies + detects tampering
- migration (`~/.openclaw/` → `~/.openagent/`) works

Maintain a parity matrix (supported / degraded / removed) and document intentional changes.

Output/Deliverables:

- updated test matrix + parity matrix
- CI instructions
