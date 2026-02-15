import { describe, expect, it, vi } from "vitest";
import { applyOpenAgentEnvAliases, resetOpenAgentAliasWarningForTests } from "./env-aliases.js";

describe("applyOpenAgentEnvAliases", () => {
  it("maps OPENAGENT_* env vars to OPENCLAW_* aliases", () => {
    const env = {
      OPENAGENT_STATE_DIR: "/tmp/openagent",
    } as NodeJS.ProcessEnv;

    applyOpenAgentEnvAliases(env);

    expect(env.OPENCLAW_STATE_DIR).toBe("/tmp/openagent");
  });

  it("warns once when OPENCLAW_* aliases are present", () => {
    const warningSpy = vi.spyOn(process, "emitWarning").mockImplementation(() => undefined);
    try {
      resetOpenAgentAliasWarningForTests();
      const env = {
        OPENCLAW_STATE_DIR: "/tmp/openclaw",
      } as NodeJS.ProcessEnv;

      applyOpenAgentEnvAliases(env);
      applyOpenAgentEnvAliases(env);

      expect(warningSpy).toHaveBeenCalledTimes(1);
    } finally {
      warningSpy.mockRestore();
      resetOpenAgentAliasWarningForTests();
    }
  });
});
