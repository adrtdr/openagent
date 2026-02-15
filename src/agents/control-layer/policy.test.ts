import { describe, expect, it } from "vitest";
import { resolveToolCapability } from "./capabilities.js";
import { evaluateToolPolicy } from "./policy.js";

describe("tool control policy", () => {
  it("denies unknown tools by default", () => {
    const decision = evaluateToolPolicy({
      toolName: "unknown_tool",
      capability: undefined,
      hasScopedGrant: false,
      policy: {
        allowTools: [],
        denyTools: [],
        requireConfirmationTools: [],
      },
    });
    expect(decision.decision).toBe("DENY");
  });

  it("allows explicitly allowlisted tools", () => {
    const decision = evaluateToolPolicy({
      toolName: "read",
      capability: resolveToolCapability("read"),
      hasScopedGrant: false,
      policy: {
        allowTools: ["read"],
        denyTools: [],
        requireConfirmationTools: [],
      },
    });
    expect(decision.decision).toBe("ALLOW");
  });

  it("requires confirmation for critical tools", () => {
    const decision = evaluateToolPolicy({
      toolName: "exec",
      capability: resolveToolCapability("exec"),
      hasScopedGrant: false,
      policy: {
        allowTools: [],
        denyTools: [],
        requireConfirmationTools: [],
      },
    });
    expect(decision.decision).toBe("REQUIRE_CONFIRMATION");
  });
});
