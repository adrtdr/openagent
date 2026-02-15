import { createHash, randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export type ToolCallPayload = {
  toolName: string;
  params: unknown;
  scope?: {
    agentId?: string;
    sessionKey?: string;
  };
};

export type ApprovalRequest = {
  requestId: string;
  createdAt: number;
  payload: ToolCallPayload;
  payloadHash: string;
  rationale: string;
};

export type ApprovalDecisionResult = {
  approved: boolean;
  token?: string;
  reason?: string;
};

type PendingApproval = {
  request: ApprovalRequest;
  resolve: (value: ApprovalDecisionResult) => void;
  timer: NodeJS.Timeout;
};

type ApprovalTokenRecord = {
  token: string;
  payloadHash: string;
  expiresAt: number;
  used: boolean;
};

export type ScopedGrant = {
  grantId: string;
  toolNames: string[];
  agentId?: string;
  sessionKey?: string;
  expiresAt: number;
};

function toCanonicalJson(value: unknown): JsonValue {
  if (
    value == null ||
    typeof value === "boolean" ||
    typeof value === "number" ||
    typeof value === "string"
  ) {
    return value ?? null;
  }
  if (Array.isArray(value)) {
    return value.map((item) => toCanonicalJson(item));
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const sorted = Object.keys(record)
      .toSorted()
      .reduce<{ [key: string]: JsonValue }>((acc, key) => {
        acc[key] = toCanonicalJson(record[key]);
        return acc;
      }, {});
    return sorted;
  }
  return String(value);
}

function hashPayload(payload: ToolCallPayload): string {
  const canonical = JSON.stringify(toCanonicalJson(payload));
  return createHash("sha256").update(canonical).digest("hex");
}

export class ToolApprovalManager extends EventEmitter {
  private pending = new Map<string, PendingApproval>();

  private tokens = new Map<string, ApprovalTokenRecord>();

  private scopedGrants = new Map<string, ScopedGrant>();

  requestApproval(
    payload: ToolCallPayload,
    rationale: string,
    timeoutMs = 60_000,
  ): Promise<ApprovalDecisionResult> {
    const requestId = randomUUID();
    const request: ApprovalRequest = {
      requestId,
      createdAt: Date.now(),
      payload,
      payloadHash: hashPayload(payload),
      rationale,
    };

    return new Promise<ApprovalDecisionResult>((resolve) => {
      const timer = setTimeout(() => {
        this.pending.delete(requestId);
        const denied = { approved: false, reason: "approval_timeout" };
        this.emit("approval.decided", { requestId, ...denied });
        resolve(denied);
      }, timeoutMs);

      this.pending.set(requestId, { request, resolve, timer });
      this.emit("approval.requested", request);
    });
  }

  decideApproval(args: {
    requestId: string;
    approved: boolean;
    reason?: string;
    tokenTtlMs?: number;
    scopedGrant?: {
      toolNames: string[];
      ttlMs: number;
      agentId?: string;
      sessionKey?: string;
    };
  }): boolean {
    const entry = this.pending.get(args.requestId);
    if (!entry) {
      return false;
    }

    clearTimeout(entry.timer);
    this.pending.delete(args.requestId);

    if (args.scopedGrant) {
      const grantId = randomUUID();
      this.scopedGrants.set(grantId, {
        grantId,
        toolNames: args.scopedGrant.toolNames,
        agentId: args.scopedGrant.agentId,
        sessionKey: args.scopedGrant.sessionKey,
        expiresAt: Date.now() + args.scopedGrant.ttlMs,
      });
    }

    const decision: ApprovalDecisionResult = args.approved
      ? {
          approved: true,
          token: this.issueToken(entry.request.payloadHash, args.tokenTtlMs ?? 60_000),
        }
      : {
          approved: false,
          reason: args.reason ?? "approval_denied",
        };

    entry.resolve(decision);
    this.emit("approval.decided", { requestId: args.requestId, ...decision });
    return true;
  }

  hasScopedGrant(payload: ToolCallPayload): boolean {
    const now = Date.now();
    for (const [grantId, grant] of this.scopedGrants.entries()) {
      if (grant.expiresAt <= now) {
        this.scopedGrants.delete(grantId);
        continue;
      }
      if (!grant.toolNames.includes(payload.toolName)) {
        continue;
      }
      if (grant.agentId && grant.agentId !== payload.scope?.agentId) {
        continue;
      }
      if (grant.sessionKey && grant.sessionKey !== payload.scope?.sessionKey) {
        continue;
      }
      return true;
    }
    return false;
  }

  consumeApprovalToken(token: string, payload: ToolCallPayload): boolean {
    const record = this.tokens.get(token);
    if (!record) {
      return false;
    }
    if (record.used || record.expiresAt <= Date.now()) {
      this.tokens.delete(token);
      return false;
    }
    if (record.payloadHash !== hashPayload(payload)) {
      return false;
    }
    record.used = true;
    return true;
  }

  listPendingApprovals(): ApprovalRequest[] {
    return Array.from(this.pending.values(), (entry) => entry.request).toSorted(
      (a, b) => a.createdAt - b.createdAt,
    );
  }

  getPendingApproval(requestId: string): ApprovalRequest | null {
    return this.pending.get(requestId)?.request ?? null;
  }

  listScopedGrants(): ScopedGrant[] {
    const now = Date.now();
    const grants: ScopedGrant[] = [];
    for (const [grantId, grant] of this.scopedGrants.entries()) {
      if (grant.expiresAt <= now) {
        this.scopedGrants.delete(grantId);
        continue;
      }
      grants.push({ ...grant, toolNames: [...grant.toolNames] });
    }
    return grants.toSorted((a, b) => a.expiresAt - b.expiresAt);
  }

  revokeScopedGrant(grantId: string): boolean {
    return this.scopedGrants.delete(grantId);
  }

  resetForTests(): void {
    for (const entry of this.pending.values()) {
      clearTimeout(entry.timer);
    }
    this.pending.clear();
    this.tokens.clear();
    this.scopedGrants.clear();
  }

  private issueToken(payloadHash: string, ttlMs: number): string {
    const token = createHash("sha256")
      .update(`${payloadHash}:${randomUUID()}:${Date.now()}`)
      .digest("hex");
    this.tokens.set(token, {
      token,
      payloadHash,
      expiresAt: Date.now() + ttlMs,
      used: false,
    });
    return token;
  }
}

const globalApprovalManager = new ToolApprovalManager();

export function getGlobalToolApprovalManager(): ToolApprovalManager {
  return globalApprovalManager;
}
