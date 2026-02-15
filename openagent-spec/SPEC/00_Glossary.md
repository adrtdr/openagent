# Glossary

- **Gateway**: Local daemon that terminates client connections, owns state, routes messages to agents, executes tools, and emits events.
- **Client**: Operator UI (web), CLI, or channel adapter that connects to the Gateway.
- **Channel Adapter**: Connector to WhatsApp/Telegram/Slack/etc. Translates inbound/outbound messages to Gateway events.
- **Node**: A device-local endpoint that exposes device capabilities (camera, screen recording, local command execution) through the Gateway.
- **Session**: A durable conversation/work unit, with associated context, policies, and history.
- **Agent Run**: A single serialized execution of the agent loop for a session; produces streamed output and optional tool calls.
- **Tool / Capability**: An executable action surface (system.run, fs.write, browser.click, http.request).
- **Skill / Extension**: Packaged set of tools + prompts + code that can be installed/loaded into a workspace.
- **Policy Engine**: Evaluates proposed actions. Outputs: ALLOW, DENY, or REQUIRE_CONFIRMATION.
- **Confirmation / Approval**: Human-in-the-loop step to authorize a specific action (or bounded scope).
- **Approval Token**: Single-use, time-bound token binding the operator’s approval to a canonical tool call.
- **Audit Event**: Immutable record of a security-relevant event, written append-only and chained for tamper evidence.

Risk tiers (default):
- **R0**: No side effects (pure computation, formatting).
- **R1**: Low risk (read-only, small local scope).
- **R2**: Medium (writes within sandbox; safe network calls to allowlisted domains).
- **R3**: High (writes outside sandbox; shell; network to arbitrary domains; credential access).
- **R4**: Critical (payments, account actions, destructive ops, privilege escalation).

Owner control invariant (must always hold):
> No R3+ capability executes without an explicit operator approval bound to the exact action.
