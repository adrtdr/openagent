import { getGlobalToolApprovalManager, type ToolCallPayload } from "./approvals.js";
import { appendControlAuditEvent } from "./audit-log.js";
import { resolveToolCapability } from "./capabilities.js";
import {
  evaluateToolPolicy,
  isControlLayerEnabled,
  resolveToolCallPolicy,
  type PolicyTrace,
} from "./policy.js";

export type ToolControlContext = {
  agentId?: string;
  sessionKey?: string;
  timeoutMs?: number;
};

export type ToolControlResult = {
  policy: PolicyTrace;
};

export async function enforceToolControlPolicy(args: {
  toolName: string;
  params: unknown;
  context?: ToolControlContext;
}): Promise<ToolControlResult> {
  if (!isControlLayerEnabled()) {
    return {
      policy: {
        decision: "ALLOW",
        rationale: "Control layer disabled",
      },
    };
  }

  const payload: ToolCallPayload = {
    toolName: args.toolName,
    params: args.params,
    scope: {
      agentId: args.context?.agentId,
      sessionKey: args.context?.sessionKey,
    },
  };

  const manager = getGlobalToolApprovalManager();
  await appendControlAuditEvent("tool.proposed", payload);
  const capability = resolveToolCapability(args.toolName);
  const policy = evaluateToolPolicy({
    toolName: args.toolName,
    capability,
    policy: resolveToolCallPolicy(),
    hasScopedGrant: manager.hasScopedGrant(payload),
  });

  await appendControlAuditEvent("policy.decision", {
    toolName: args.toolName,
    decision: policy.decision,
    rationale: policy.rationale,
    matchedRule: policy.matchedRule ?? null,
  });

  if (policy.decision === "DENY") {
    throw new Error(`Tool call denied by policy: ${policy.rationale}`);
  }

  if (policy.decision === "REQUIRE_CONFIRMATION") {
    await appendControlAuditEvent("approval.requested", {
      toolName: args.toolName,
      rationale: policy.rationale,
      agentId: args.context?.agentId ?? null,
      sessionKey: args.context?.sessionKey ?? null,
    });

    const decision = await manager.requestApproval(
      payload,
      policy.rationale,
      args.context?.timeoutMs ?? 60_000,
    );
    await appendControlAuditEvent("approval.decided", {
      toolName: args.toolName,
      approved: decision.approved,
      reason: decision.reason ?? null,
    });

    if (!decision.approved || !decision.token) {
      throw new Error(`Tool call was not approved: ${decision.reason ?? "approval_denied"}`);
    }
    const consumed = manager.consumeApprovalToken(decision.token, payload);
    if (!consumed) {
      throw new Error("Tool approval token validation failed (expired, replayed, or mismatched)");
    }
  }

  return { policy };
}
