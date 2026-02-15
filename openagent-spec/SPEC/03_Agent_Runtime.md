# Agent Runtime

## Objectives

- Deterministic, auditable agent loop.
- Single serialized run per session lane to prevent tool/session races.
- Clear hook points for policy and logging.

## Agent loop phases

1. Intake
   - Receive normalized message(s), resolve session.
2. Context assembly
   - Session history, workspace bootstrap, skill prompts, prior approvals.
3. Model inference
   - Call Model Adapter; stream assistant deltas.
4. Tool proposal
   - Parse tool calls; attach metadata (risk tier, resource targets).
5. Authorization
   - Policy Engine evaluates each tool call.
6. Confirmation (if required)
   - Create Approval Request; pause run; resume with approval token or denial.
7. Tool execution
   - Execute via Tool Router; stream tool lifecycle events.
8. Persistence
   - Store transcript, tool results (sanitized), audit events.
9. Completion
   - Emit lifecycle end, usage metrics, summary.

## Tool call representation

Canonical tool call object (used for hashing/approval binding):

```
ToolCall {
  toolId: string,
  args: object,              // must be canonicalized (stable key order)
  target: { kind, id },      // optional (nodeId, workspace, etc.)
  riskTier: "R0".."R4",
  requestedBy: { sessionId, runId, principalId },
  context: { channel, model, timestamp }
}
```

## Queues / lanes

- **Per-session lane**: strict serialization for all runs in a session.
- **Global lane** (optional): for high-risk tools to avoid parallel destructive ops.
- **Tool lanes**: low-risk read-only tools can run in parallel if explicitly allowed.

Rules:
- R3/R4 tools always go through the global lane unless explicitly opted out by policy.

## Hooks (mandatory)

- `before_agent_start`
- `before_tool_call` (policy pre-check + enrichment)
- `after_tool_call` (sanitize + persistence)
- `tool_result_persist` (redaction rules)
- `agent_end`

Each hook must emit an audit event when it blocks/changes execution.
