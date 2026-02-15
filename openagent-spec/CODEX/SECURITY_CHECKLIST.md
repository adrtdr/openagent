# Security Checklist

- [ ] Gateway binds loopback by default
- [ ] Remote access requires tailnet/SSH/mTLS (no public exposure by default)
- [ ] Frame validation on all inbound WS frames
- [ ] Idempotency keys for side-effecting methods
- [ ] Policy deny-by-default enforced
- [ ] R3/R4 confirmations enforced with token binding
- [ ] Sandboxed tool execution
- [ ] Network allowlists and payload limits
- [ ] Dependency lockfiles pinned; supply-chain scanning enabled
- [ ] Audit chain verification tool included
