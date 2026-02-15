# Threat Model

## Assets

- Operator identity & approvals
- Local files
- Credentials (API keys, OAuth tokens)
- Messaging accounts
- Browser sessions / cookies
- Audit logs (integrity matters)

## Adversaries

- Prompt injection via inbound messages / web content
- Malicious skills/extensions
- Untrusted remote client attempting to connect
- Local malware reading state directory
- Supply chain compromise (npm packages)

## Primary attack surfaces

- WS Gateway endpoint exposure
- Tool execution surfaces (shell, fs.write, browser automation)
- Skill install/update mechanisms
- Remote access tunnels and tokens
- Logs that accidentally capture secrets

## Core mitigations

- Pairing & device identity for all clients/nodes
- Deny-by-default policies; explicit approvals
- Risk-tier-based gating and step-up auth
- Sandboxed execution for tools/skills
- Network egress allowlists
- Strong redaction in logs
- Tamper-evident audit chain and periodic anchoring
- Dependency scanning + lockfile pinning

## Security invariants (testable)

1. R3/R4 tool never executes without valid approval token bound to tool call hash.
2. Approval tokens are single-use and expire quickly.
3. Unpaired device cannot execute node.invoke.
4. Skills cannot register tools beyond declared manifest.
5. Secrets cannot be returned in tool results unless explicitly allowed by policy.

## Formal modeling (optional but recommended)

Model:
- pairing state machine
- approval token state machine
- per-session lane serialization
See `SPEC/12_Testing_and_Verification.md`.
