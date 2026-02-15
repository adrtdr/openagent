import type { AgentTool } from "@mariozechner/pi-agent-core";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { toToolDefinitions } from "./pi-tool-definition-adapter.js";

const originalEnv = { ...process.env };
let tempDir: string | null = null;

afterEach(async () => {
  process.env = { ...originalEnv };
  if (tempDir) {
    await fs.rm(tempDir, { recursive: true, force: true });
    tempDir = null;
  }
});

describe("pi tool definition adapter", () => {
  it("wraps tool errors into a tool result", async () => {
    const tool = {
      name: "boom",
      label: "Boom",
      description: "throws",
      parameters: {},
      execute: async () => {
        throw new Error("nope");
      },
    } satisfies AgentTool<unknown, unknown>;

    const defs = toToolDefinitions([tool]);
    const result = await defs[0].execute("call1", {}, undefined, undefined);

    expect(result.details).toMatchObject({
      status: "error",
      tool: "boom",
    });
    expect(result.details).toMatchObject({ error: "nope" });
    expect(JSON.stringify(result.details)).not.toContain("\n    at ");
  });

  it("normalizes exec tool aliases in error results", async () => {
    const tool = {
      name: "bash",
      label: "Bash",
      description: "throws",
      parameters: {},
      execute: async () => {
        throw new Error("nope");
      },
    } satisfies AgentTool<unknown, unknown>;

    const defs = toToolDefinitions([tool]);
    const result = await defs[0].execute("call2", {}, undefined, undefined);

    expect(result.details).toMatchObject({
      status: "error",
      tool: "exec",
      error: "nope",
    });
  });

  it("emits tool.executed audit outcome", async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "openagent-tool-audit-"));
    const auditPath = path.join(tempDir, "audit.jsonl");
    process.env.OPENAGENT_AUDIT_LOG = "1";
    process.env.OPENAGENT_AUDIT_LOG_PATH = auditPath;

    const tool = {
      name: "read",
      label: "Read",
      description: "returns ok",
      parameters: {},
      execute: async () => ({
        text: "ok",
        details: { ok: true },
      }),
    } satisfies AgentTool<unknown, unknown>;

    const defs = toToolDefinitions([tool]);
    await defs[0].execute("call3", {}, undefined, undefined);

    const raw = await fs.readFile(auditPath, "utf-8");
    const kinds = raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line).kind);
    expect(kinds).toContain("tool.executed");
  });
});
