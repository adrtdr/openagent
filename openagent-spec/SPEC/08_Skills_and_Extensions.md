# Skills & Extensions

## Threat model for skills

Skills are code + prompts. They can:

- exfiltrate data,
- add hidden instructions,
- widen tool access.

Therefore:

- Skills are **disabled by default**.
- Installing/enabling a skill is an R3 action: requires explicit operator approval.
- Skills must declare their tool requirements.

## Skill packaging

A skill is a directory with:

- `skill.yaml` (manifest)
- `prompts/` (system prompt fragments)
- `tools/` (tool descriptors)
- `runtime/` (code, optional)
- `tests/`

Manifest fields:

- `id`, `version`, `publisher`
- `description`
- `requiredTools` (list)
- `network` allowlist requirements
- `dataAccess` requirements
- `signature` (optional; future: sigstore/cosign)

## Skill lifecycle

- install → verify (signature/hash) → store → disabled
- enable (per workspace) → policy check → record grant (scoped)
- runtime load → tool registration

## Skill isolation

- Run skill runtime in a sandboxed process.
- Limit filesystem exposure to workspace.
- Provide only declared environment variables.
- Prohibit dynamic code download by default.

## Skill governance

- Maintain allowlists:
  - approved publishers
  - pinned versions
- Add “quarantine mode”:
  - new/unreviewed skills run with R4 confirmation on every tool call.

## Skill audit

All:

- install/enable/disable
- tool registration
- tool invocations
  must emit audit events.

## Compatibility note

This spec mirrors the _concept_ of an OpenAgent-like skills platform, but the implementation and marketplace are yours.
