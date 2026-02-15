import type { ToolCapability } from "./capabilities.js";

export type PolicyDecision = "ALLOW" | "DENY" | "REQUIRE_CONFIRMATION";

export type PolicyTrace = {
  decision: PolicyDecision;
  rationale: string;
  matchedRule?: string;
};

export type ToolCallPolicy = {
  allowTools: string[];
  denyTools: string[];
  requireConfirmationTools: string[];
};

export type PolicyInput = {
  toolName: string;
  capability?: ToolCapability;
  policy: ToolCallPolicy;
  hasScopedGrant: boolean;
};

function matchesRule(toolName: string, rule: string): boolean {
  if (rule === "*") {
    return true;
  }
  return rule === toolName;
}

function findMatchingRule(toolName: string, rules: string[]): string | undefined {
  return rules.find((rule) => matchesRule(toolName, rule));
}

export function evaluateToolPolicy(input: PolicyInput): PolicyTrace {
  const denyRule = findMatchingRule(input.toolName, input.policy.denyTools);
  if (denyRule) {
    return {
      decision: "DENY",
      rationale: `Denied by policy rule '${denyRule}'`,
      matchedRule: denyRule,
    };
  }

  if (!input.capability) {
    return {
      decision: "DENY",
      rationale: `Tool '${input.toolName}' has no registered capability (deny-by-default)`,
    };
  }

  if (input.hasScopedGrant) {
    return {
      decision: "ALLOW",
      rationale: "Allowed by active scoped grant",
      matchedRule: "scoped-grant",
    };
  }

  const allowRule = findMatchingRule(input.toolName, input.policy.allowTools);
  if (allowRule) {
    return {
      decision: "ALLOW",
      rationale: `Allowed by policy rule '${allowRule}'`,
      matchedRule: allowRule,
    };
  }

  const confirmRule = findMatchingRule(input.toolName, input.policy.requireConfirmationTools);
  if (confirmRule) {
    return {
      decision: "REQUIRE_CONFIRMATION",
      rationale: `Confirmation required by policy rule '${confirmRule}'`,
      matchedRule: confirmRule,
    };
  }

  if (input.capability.riskTier === "high" || input.capability.riskTier === "critical") {
    return {
      decision: "REQUIRE_CONFIRMATION",
      rationale: `Confirmation required for ${input.capability.riskTier}-risk capability`,
    };
  }

  return {
    decision: "DENY",
    rationale: "No allow rule matched (deny-by-default)",
  };
}

function parseRules(raw: string | undefined): string[] {
  if (!raw) {
    return [];
  }
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function resolveToolCallPolicy(env: NodeJS.ProcessEnv = process.env): ToolCallPolicy {
  return {
    allowTools: parseRules(env.OPENAGENT_CONTROL_POLICY_ALLOW),
    denyTools: parseRules(env.OPENAGENT_CONTROL_POLICY_DENY),
    requireConfirmationTools: parseRules(env.OPENAGENT_CONTROL_POLICY_CONFIRM),
  };
}

export function isControlLayerEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.OPENAGENT_CONTROL_LAYER === "1";
}
