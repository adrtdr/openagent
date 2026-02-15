# Deployment

## Modes

1) Local-only (recommended default)
- Gateway binds to 127.0.0.1
- Web UI served locally
- No inbound internet exposure

2) Tailnet remote
- Gateway still binds loopback
- Exposed via tailnet reverse proxy (Tailscale Serve / SSH tunnel)
- Device pairing required

3) Private VPS / homelab
- Use mTLS or OIDC + strict firewall
- Strongly discourage public exposure

## Config

See:
- `examples/config.gateway.yaml`
- `examples/config.channels.yaml`

## State directory

- Stores:
  - sessions
  - pairing state
  - policy grants
  - audit index
Treat as sensitive.

## Backups

- Encrypt backups.
- Include audit log anchoring proofs.

## Uninstall / revoke checklist

- Remove state dir.
- Revoke OAuth tokens.
- Rotate API keys.
- Clear browser profiles if used.
