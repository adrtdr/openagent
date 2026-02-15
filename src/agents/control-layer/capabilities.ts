export type ToolRiskTier = "low" | "medium" | "high" | "critical";

export type ToolCapability = {
  toolName: string;
  riskTier: ToolRiskTier;
  scopes: string[];
  redactionRules: {
    redactArgumentPaths: string[];
  };
};

const CORE_TOOL_CAPABILITIES_LIST: ToolCapability[] = [
  {
    toolName: "read",
    riskTier: "low",
    scopes: ["fs:read"],
    redactionRules: { redactArgumentPaths: [] },
  },
  {
    toolName: "glob",
    riskTier: "low",
    scopes: ["fs:read"],
    redactionRules: { redactArgumentPaths: [] },
  },
  {
    toolName: "web_search",
    riskTier: "low",
    scopes: ["net:read"],
    redactionRules: { redactArgumentPaths: [] },
  },
  {
    toolName: "web_fetch",
    riskTier: "medium",
    scopes: ["net:read"],
    redactionRules: { redactArgumentPaths: ["headers.authorization"] },
  },
  {
    toolName: "exec",
    riskTier: "critical",
    scopes: ["process:exec"],
    redactionRules: {
      redactArgumentPaths: ["env", "justification"],
    },
  },
  {
    toolName: "write",
    riskTier: "high",
    scopes: ["fs:write"],
    redactionRules: { redactArgumentPaths: [] },
  },
  {
    toolName: "edit",
    riskTier: "high",
    scopes: ["fs:write"],
    redactionRules: { redactArgumentPaths: [] },
  },
  {
    toolName: "bash",
    riskTier: "critical",
    scopes: ["process:exec"],
    redactionRules: {
      redactArgumentPaths: ["env", "stdin"],
    },
  },
];

export const CORE_TOOL_CAPABILITIES = new Map(
  CORE_TOOL_CAPABILITIES_LIST.map((capability) => [capability.toolName, capability] as const),
);

export function resolveToolCapability(toolName: string): ToolCapability | undefined {
  return CORE_TOOL_CAPABILITIES.get(toolName);
}
