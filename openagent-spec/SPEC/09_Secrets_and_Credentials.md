# Secrets & Credentials

## Requirements

- Secrets are never exposed to the model unless absolutely required.
- Access to secrets is gated (R3+).
- Minimize long-lived tokens.

## Secret store

- Local encrypted store (OS keychain if available; else libsodium sealed box).
- Namespaces:
  - `workspace/<id>/...`
  - `global/...`

## Secret access patterns

Preferred:
- Tool uses secret internally (server-side) and returns only non-sensitive result.
Avoid:
- returning secret values to agent text
- putting secrets in prompt

## Rotations / revocations

- Provide `secrets.rotate`, `secrets.revoke` flows.
- On uninstall, provide “revoke all integrations” checklist.

## Audit

- Log secret access events (what secret ID, which tool) but never the secret value.

## Remote access

- If you expose Gateway remotely, use:
  - tailnet-only HTTPS (Tailscale Serve)
  - device pairing + per-client tokens
  - short-lived OIDC tokens (optional)
