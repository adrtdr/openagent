import { afterEach, describe, expect, it, vi } from "vitest";
import { getGlobalToolApprovalManager } from "../../agents/control-layer/approvals.js";
import { controlLayerHandlers } from "./control-layer.js";

const noop = () => false;

afterEach(() => {
  getGlobalToolApprovalManager().resetForTests();
});

describe("controlLayerHandlers", () => {
  it("redacts sensitive approval params in approvals.list", async () => {
    const manager = getGlobalToolApprovalManager();
    const requestPromise = manager.requestApproval(
      {
        toolName: "bash",
        params: { env: { OPENAI_API_KEY: "secret-key" }, stdin: "hello" },
      },
      "needs confirmation",
      5_000,
    );

    const respond = vi.fn();
    await controlLayerHandlers["approvals.list"]({
      req: { id: "1", type: "req", method: "approvals.list" },
      params: {},
      client: null,
      isWebchatConnect: noop,
      respond,
      context: {} as never,
    });

    expect(respond).toHaveBeenCalledWith(
      true,
      expect.objectContaining({
        pending: [
          expect.objectContaining({
            payload: expect.objectContaining({
              params: expect.objectContaining({
                env: "[REDACTED]",
                stdin: "[REDACTED]",
              }),
            }),
          }),
        ],
      }),
      undefined,
    );

    const pending = manager.listPendingApprovals();
    const firstPending = pending[0];
    if (!firstPending) {
      throw new Error("expected a pending approval");
    }
    manager.decideApproval({ requestId: firstPending.requestId, approved: false, reason: "done" });
    await requestPromise;
  });

  it("rejects config.validate without raw", async () => {
    const respond = vi.fn();
    await controlLayerHandlers["config.validate"]({
      req: { id: "2", type: "req", method: "config.validate" },
      params: {},
      client: null,
      isWebchatConnect: noop,
      respond,
      context: {} as never,
    });

    expect(respond).toHaveBeenCalledWith(false, undefined, expect.any(Object));
  });

  it("rejects approvals.list with unexpected params", async () => {
    const respond = vi.fn();
    await controlLayerHandlers["approvals.list"]({
      req: { id: "4", type: "req", method: "approvals.list" },
      params: { extra: true },
      client: null,
      isWebchatConnect: noop,
      respond,
      context: {} as never,
    });

    expect(respond).toHaveBeenCalledWith(false, undefined, expect.any(Object));
  });

  it("rejects runtime.logs.stop with unexpected params", async () => {
    const respond = vi.fn();
    await controlLayerHandlers["runtime.logs.stop"]({
      req: { id: "5", type: "req", method: "runtime.logs.stop" },
      params: { bad: "value" },
      client: null,
      isWebchatConnect: noop,
      respond,
      context: {} as never,
    });

    expect(respond).toHaveBeenCalledWith(false, undefined, expect.any(Object));
  });

  it("returns runtime snapshot", async () => {
    const respond = vi.fn();
    await controlLayerHandlers["runtime.snapshot"]({
      req: { id: "3", type: "req", method: "runtime.snapshot" },
      params: {},
      client: null,
      isWebchatConnect: noop,
      respond,
      context: {
        getRuntimeSnapshot: () => ({}) as never,
      } as never,
    });

    expect(respond).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ channels: {} }),
      undefined,
    );
  });
});
