import { describe, expect, it, vi } from "vitest";
import { handleGatewayRequest } from "./server-methods.js";

describe("gateway control-layer method authorization", () => {
  it("allows read-scoped operator to call approvals.list", async () => {
    const respond = vi.fn();
    const handler = vi.fn(({ respond: send }: { respond: typeof respond }) => {
      send(true, { ok: true }, undefined);
    });

    await handleGatewayRequest({
      req: { id: "1", type: "req", method: "approvals.list", params: {} },
      client: {
        connect: { role: "operator", scopes: ["operator.read"] },
      } as never,
      isWebchatConnect: () => false,
      respond,
      context: {} as never,
      extraHandlers: { "approvals.list": handler } as never,
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(respond).toHaveBeenCalledWith(true, { ok: true }, undefined);
  });

  it("rejects approvals.decide without approvals scope", async () => {
    const respond = vi.fn();
    const handler = vi.fn();

    await handleGatewayRequest({
      req: {
        id: "2",
        type: "req",
        method: "approvals.decide",
        params: { requestId: "r1", decision: "approve" },
      },
      client: {
        connect: { role: "operator", scopes: ["operator.read"] },
      } as never,
      isWebchatConnect: () => false,
      respond,
      context: {} as never,
      extraHandlers: { "approvals.decide": handler } as never,
    });

    expect(handler).not.toHaveBeenCalled();
    expect(respond.mock.calls[0]?.[2]?.message).toContain("missing scope: operator.approvals");
  });

  it("allows approvals.decide with approvals scope", async () => {
    const respond = vi.fn();
    const handler = vi.fn(({ respond: send }: { respond: typeof respond }) => {
      send(true, { ok: true }, undefined);
    });

    await handleGatewayRequest({
      req: {
        id: "3",
        type: "req",
        method: "approvals.decide",
        params: { requestId: "r1", decision: "approve" },
      },
      client: {
        connect: { role: "operator", scopes: ["operator.approvals"] },
      } as never,
      isWebchatConnect: () => false,
      respond,
      context: {} as never,
      extraHandlers: { "approvals.decide": handler } as never,
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(respond).toHaveBeenCalledWith(true, { ok: true }, undefined);
  });

  it("requires write scope for runtime.logs.stop", async () => {
    const respond = vi.fn();
    const handler = vi.fn();

    await handleGatewayRequest({
      req: { id: "4", type: "req", method: "runtime.logs.stop", params: {} },
      client: {
        connect: { role: "operator", scopes: ["operator.read"] },
      } as never,
      isWebchatConnect: () => false,
      respond,
      context: {} as never,
      extraHandlers: { "runtime.logs.stop": handler } as never,
    });

    expect(handler).not.toHaveBeenCalled();
    expect(respond.mock.calls[0]?.[2]?.message).toContain("missing scope: operator.write");
  });
});
