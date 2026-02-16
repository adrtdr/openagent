import { describe, expect, it } from "vitest";
import { CORE_TOOL_CAPABILITIES, resolveToolCapability } from "./capabilities.js";

describe("control-layer capability registry", () => {
  it("includes core tools used by the embedded runtime", () => {
    const requiredTools = [
      "read",
      "write",
      "bash",
      "exec",
      "browser",
      "message",
      "sessions_send",
      "sessions_spawn",
      "web_fetch",
      "web_search",
    ] as const;

    for (const toolName of requiredTools) {
      const capability = resolveToolCapability(toolName);
      expect(capability, `expected ${toolName} to be registered`).toBeTruthy();
      expect(CORE_TOOL_CAPABILITIES.get(toolName)).toBe(capability);
    }
  });

  it("keeps unknown tools denied-by-default by returning no capability", () => {
    expect(resolveToolCapability("totally_unknown_tool")).toBeUndefined();
  });
});
