# Confirmation UX & Approval Protocol

## When confirmations trigger

A confirmation triggers when:
- policy result == REQUIRE_CONFIRMATION
- tool is R3/R4 by default policy
- action exceeds configured thresholds (rate/cost/output size)
- the tool target is outside approved scope (path/domain drift)

## Approval request object

ApprovalRequest:
- `approvalId`
- `sessionId`, `runId`
- `toolCallCanonical` (canonical JSON)
- `humanSummary` (generated, but MUST be verified against canonical)
- `riskTier`
- `requestedAt`
- `expiresAt` (default 5 minutes)
- `diff` (if modifying an existing plan)
- `suggestedAlternatives` (optional)

Schema: `schemas/approval.schema.json`.

## Operator decision options

- **Approve once** (single-use token)
- **Approve with scope**
  - `for session`
  - `for 15 minutes`
  - `always for workspace` (discouraged for R3+)
- **Approve with modifications**
  - operator edits args (e.g., restrict path/domain)
  - system re-canonicalizes and re-hashes
- **Deny** (with optional reason)

## Approval token

Minted only on approval. Properties:
- `tokenId` (UUID)
- `approvalId`
- `toolCallHash` (SHA-256 over canonical JSON)
- `expiresAt`
- `singleUse` = true
- `scope` metadata (if any)
- `issuedToClientDeviceId`

Execution requires:
- token valid + unexpired
- toolCallHash matches current proposed call
- token not used before
- client device identity matches (optional but recommended)

## UX requirements (operator)

Every approval prompt MUST show:
- exact command / action parameters (not only natural language)
- risk tier + why it is risky
- predicted side effects (best-effort)
- rollback / safety notes
- allow/deny + optionally edit args
- “dry run” button when feasible

## UX requirements (agent)

When blocked:
- agent is informed with a structured denial or pending state:
  - `TOOL_BLOCKED_PENDING_APPROVAL`
  - `TOOL_DENIED` + reason
Agent must re-plan if denied.

## Rate limiting and batching

- If multiple similar approvals occur, UI can batch.
- But tokens remain per-tool-call (no blanket approval without explicit scope grant).

## Sequence diagrams

See `diagrams/sequence.confirmation.mmd`.
