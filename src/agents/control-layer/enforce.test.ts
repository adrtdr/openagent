import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getGlobalToolApprovalManager } from "./approvals.js";
import { verifyControlAuditLog } from "./audit-log.js";
import { enforceToolControlPolicy } from "./enforce.js";

const originalEnv = { ...process.env };
let tempDir: string | null = null;

afterEach(async () => {
  process.env = { ...originalEnv };
  getGlobalToolApprovalManager().resetForTests();
  vi.restoreAllMocks();
  if (tempDir) {
    await fs.rm(tempDir, { recursive: true, force: true });
    tempDir = null;
  }
});

describe("enforceToolControlPolicy", () => {
  it("blocks until approval is received", async () => {
    process.env.OPENAGENT_CONTROL_LAYER = "1";
    process.env.OPENAGENT_AUDIT_LOG = "0";
    process.env.OPENAGENT_CONTROL_POLICY_CONFIRM = "exec";

    const manager = getGlobalToolApprovalManager();
    let requested = false;
    manager.once("approval.requested", (request) => {
      requested = true;
      manager.decideApproval({ requestId: request.requestId, approved: true });
    });

    const result = await enforceToolControlPolicy({
      toolName: "exec",
      params: { cmd: "echo hi" },
      context: { agentId: "main", sessionKey: "agent:main:main" },
    });

    expect(requested).toBe(true);
    expect(result.policy.decision).toBe("REQUIRE_CONFIRMATION");
  });

  it("throws when approval is denied", async () => {
    process.env.OPENAGENT_CONTROL_LAYER = "1";
    process.env.OPENAGENT_AUDIT_LOG = "0";
    process.env.OPENAGENT_CONTROL_POLICY_CONFIRM = "exec";

    const manager = getGlobalToolApprovalManager();
    manager.once("approval.requested", (request) => {
      manager.decideApproval({ requestId: request.requestId, approved: false, reason: "nope" });
    });

    await expect(
      enforceToolControlPolicy({
        toolName: "exec",
        params: { cmd: "echo hi" },
      }),
    ).rejects.toThrow(/not approved/);
  });

  it("emits audit events for proposed, decision, and approval lifecycle", async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "openagent-enforce-audit-"));
    const auditPath = path.join(tempDir, "audit.jsonl");

    process.env.OPENAGENT_CONTROL_LAYER = "1";
    process.env.OPENAGENT_AUDIT_LOG = "1";
    process.env.OPENAGENT_AUDIT_LOG_PATH = auditPath;
    process.env.OPENAGENT_CONTROL_POLICY_CONFIRM = "exec";

    const manager = getGlobalToolApprovalManager();
    manager.once("approval.requested", (request) => {
      manager.decideApproval({ requestId: request.requestId, approved: true });
    });

    await enforceToolControlPolicy({
      toolName: "exec",
      params: { cmd: "echo hi" },
      context: { agentId: "main", sessionKey: "agent:main:main" },
    });

    const raw = await fs.readFile(auditPath, "utf-8");
    const records = raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line));

    expect(records.map((record) => record.kind)).toEqual([
      "tool.proposed",
      "policy.decision",
      "approval.requested",
      "approval.decided",
    ]);

    const verifyResult = await verifyControlAuditLog(auditPath);
    expect(verifyResult.ok).toBe(true);
  });
});
