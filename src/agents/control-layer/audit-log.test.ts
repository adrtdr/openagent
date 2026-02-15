import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  appendControlAuditEvent,
  resolveControlAuditLogPath,
  verifyControlAuditLog,
} from "./audit-log.js";

const originalEnv = { ...process.env };
let tempDir: string | null = null;

afterEach(async () => {
  process.env = { ...originalEnv };
  if (tempDir) {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
  tempDir = null;
});

describe("control-layer audit log", () => {
  it("writes append-only hash-chained jsonl and verifies successfully", async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "openagent-audit-"));
    process.env.OPENAGENT_AUDIT_LOG = "1";
    process.env.OPENAGENT_AUDIT_LOG_PATH = path.join(tempDir, "audit.jsonl");

    await appendControlAuditEvent("tool.proposed", { toolName: "exec" }, process.env);
    await appendControlAuditEvent(
      "policy.decision",
      { toolName: "exec", decision: "REQUIRE_CONFIRMATION" },
      process.env,
    );

    const result = await verifyControlAuditLog(resolveControlAuditLogPath(process.env));
    expect(result.ok).toBe(true);
    expect(result.checked).toBe(2);
  });

  it("detects tampering", async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "openagent-audit-"));
    process.env.OPENAGENT_AUDIT_LOG = "1";
    const auditPath = path.join(tempDir, "audit.jsonl");
    process.env.OPENAGENT_AUDIT_LOG_PATH = auditPath;

    await appendControlAuditEvent("tool.proposed", { toolName: "exec" }, process.env);
    await appendControlAuditEvent("tool.executed", { toolName: "exec", ok: true }, process.env);

    const raw = await fs.readFile(auditPath, "utf-8");
    const lines = raw.split("\n").filter(Boolean);
    const second = JSON.parse(lines[1] ?? "{}");
    second.data.ok = false;
    lines[1] = JSON.stringify(second);
    await fs.writeFile(auditPath, `${lines.join("\n")}\n`, "utf-8");

    const result = await verifyControlAuditLog(auditPath);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/hash mismatch/i);
  });
});
