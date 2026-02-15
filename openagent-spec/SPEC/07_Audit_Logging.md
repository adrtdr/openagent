# Audit Logging (Tamper-Evident)

## Requirements

- Capture every security-relevant event:
  - connect/auth/pairing
  - message received/sent
  - tool proposed / allowed / denied / approved / executed
  - policy evaluations (decision + rationale)
  - grant creation and revocation
  - skill install/enable/disable
  - secret access
- Logs must be:
  - **append-only**
  - **tamper-evident**
  - **exportable** (JSONL)
  - **queryable** (local DB index)

## Event format

AuditEvent:
- `eventId` (UUID)
- `ts` (RFC3339)
- `type` (enum)
- `principal` (operator/agent/node/channel)
- `sessionId` / `runId` (optional)
- `action` (e.g., `tool.invoke`)
- `resource` (e.g., `tool:system.run`, `file:/etc/hosts`)
- `decision` (allow/deny/confirm/approved/executed)
- `reason` (policy rationale)
- `payload` (structured details; secrets redacted)
- `prevHash` (hash chain)
- `hash` (current hash)

Schema: `schemas/audit_event.schema.json`.

## Hash chain

For each event:
- Canonicalize event JSON (stable key order, no whitespace)
- Compute `hash = SHA256(prevHash || canonicalEventBytes)`
- Store `prevHash` and `hash` with each record

Anchoring (optional but recommended):
- Periodically write the head hash to:
  - a local signed file (ed25519),
  - or a remote append-only store (e.g., S3 object lock),
  - or a Git commit (private repo).

## Storage

Minimum:
- SQLite tables:
  - `audit_events` (indexed by ts, type, sessionId)
  - `approvals`, `grants`, `pairing`
- JSONL export file for portability.

## Redaction

- Secrets never logged.
- Tool args/results sanitized:
  - truncate large stdout/stderr
  - strip binary blobs
  - redact tokens/password fields by key name + regex patterns
- Keep full raw payloads behind a secondary encrypted store if needed (optional).

## Review UX

Provide:
- “What happened?” timeline per session/run.
- “Why allowed?” policy rationale trace.
- Filters: risk tier, tool, domain, path, denied events.

Example export: `examples/audit.example.jsonl`.

Utilities:
- `scripts/audit_hashchain.py` verifies chain integrity.
