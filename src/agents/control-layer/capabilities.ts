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
  {
    toolName: "process",
    riskTier: "critical",
    scopes: ["process:exec"],
    redactionRules: {
      redactArgumentPaths: ["env", "stdin"],
    },
  },
  {
    toolName: "browser",
    riskTier: "medium",
    scopes: ["browser:control", "net:read"],
    redactionRules: { redactArgumentPaths: ["headers.authorization", "cookies"] },
  },
  {
    toolName: "canvas",
    riskTier: "medium",
    scopes: ["canvas:render"],
    redactionRules: { redactArgumentPaths: [] },
  },
  {
    toolName: "nodes",
    riskTier: "medium",
    scopes: ["cluster:read", "cluster:write"],
    redactionRules: { redactArgumentPaths: ["auth.token"] },
  },
  {
    toolName: "cron",
    riskTier: "high",
    scopes: ["scheduler:write"],
    redactionRules: { redactArgumentPaths: [] },
  },
  {
    toolName: "message",
    riskTier: "high",
    scopes: ["messages:send"],
    redactionRules: { redactArgumentPaths: ["authorization", "headers.authorization"] },
  },
  {
    toolName: "tts",
    riskTier: "medium",
    scopes: ["audio:write"],
    redactionRules: { redactArgumentPaths: [] },
  },
  {
    toolName: "gateway",
    riskTier: "high",
    scopes: ["gateway:admin"],
    redactionRules: { redactArgumentPaths: ["token", "authorization"] },
  },
  {
    toolName: "agents_list",
    riskTier: "low",
    scopes: ["agents:read"],
    redactionRules: { redactArgumentPaths: [] },
  },
  {
    toolName: "sessions_list",
    riskTier: "low",
    scopes: ["sessions:read"],
    redactionRules: { redactArgumentPaths: [] },
  },
  {
    toolName: "sessions_history",
    riskTier: "low",
    scopes: ["sessions:read"],
    redactionRules: { redactArgumentPaths: [] },
  },
  {
    toolName: "sessions_send",
    riskTier: "high",
    scopes: ["sessions:write", "messages:send"],
    redactionRules: { redactArgumentPaths: ["authorization", "headers.authorization"] },
  },
  {
    toolName: "sessions_spawn",
    riskTier: "high",
    scopes: ["sessions:write"],
    redactionRules: { redactArgumentPaths: ["env", "authorization"] },
  },
  {
    toolName: "session_status",
    riskTier: "low",
    scopes: ["sessions:read"],
    redactionRules: { redactArgumentPaths: [] },
  },
  {
    toolName: "image",
    riskTier: "medium",
    scopes: ["media:read", "media:write"],
    redactionRules: { redactArgumentPaths: [] },
  },
  {
    toolName: "memory_search",
    riskTier: "low",
    scopes: ["memory:read"],
    redactionRules: { redactArgumentPaths: [] },
  },
  {
    toolName: "memory_get",
    riskTier: "medium",
    scopes: ["memory:read"],
    redactionRules: { redactArgumentPaths: [] },
  },
];

export const CORE_TOOL_CAPABILITIES = new Map(
  CORE_TOOL_CAPABILITIES_LIST.map((capability) => [capability.toolName, capability] as const),
);

export function resolveToolCapability(toolName: string): ToolCapability | undefined {
  return CORE_TOOL_CAPABILITIES.get(toolName);
}
