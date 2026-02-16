import { describe, expect, it } from "vitest";
import { ToolApprovalManager } from "./approvals.js";

describe("tool approval manager", () => {
  it("emits request events and approves with a single-use token", async () => {
    const manager = new ToolApprovalManager();
    const payload = { toolName: "exec", params: { cmd: "echo test" } };

    let requestId = "";
    manager.once("approval.requested", (request) => {
      requestId = request.requestId;
      manager.decideApproval({ requestId: request.requestId, approved: true, tokenTtlMs: 1_000 });
    });

    const result = await manager.requestApproval(payload, "needs approval", 2_000);
    expect(requestId.length).toBeGreaterThan(0);
    expect(result.approved).toBe(true);
    expect(result.token).toBeTruthy();

    const token = result.token ?? "";
    expect(manager.consumeApprovalToken(token, payload)).toBe(true);
    expect(manager.consumeApprovalToken(token, payload)).toBe(false);
  });

  it("binds token to canonical payload hash", async () => {
    const manager = new ToolApprovalManager();
    const payload = { toolName: "exec", params: { cmd: "echo test" } };

    manager.once("approval.requested", (request) => {
      manager.decideApproval({ requestId: request.requestId, approved: true });
    });

    const result = await manager.requestApproval(payload, "needs approval", 2_000);
    const token = result.token ?? "";

    expect(
      manager.consumeApprovalToken(token, { toolName: "exec", params: { cmd: "echo other" } }),
    ).toBe(false);
  });

  it("keeps the request pending until an operator decision arrives", async () => {
    const manager = new ToolApprovalManager();
    const payload = { toolName: "exec", params: { cmd: "echo wait" } };

    const pending = manager.requestApproval(payload, "needs approval", 2_000);
    const [request] = manager.listPendingApprovals();
    expect(request?.payload.toolName).toBe("exec");

    setTimeout(() => {
      manager.decideApproval({ requestId: request.requestId, approved: true });
    }, 20);

    await expect(pending).resolves.toMatchObject({ approved: true });
  });

  it("times out when no decision is provided", async () => {
    const manager = new ToolApprovalManager();
    const payload = { toolName: "exec", params: { cmd: "echo timeout" } };

    const result = await manager.requestApproval(payload, "needs approval", 10);
    expect(result).toEqual({ approved: false, reason: "approval_timeout" });
  });
});
