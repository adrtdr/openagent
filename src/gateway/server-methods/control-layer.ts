import fs from "node:fs/promises";
import type { GatewayRequestHandlers } from "./types.js";
import {
  getGlobalToolApprovalManager,
  type ApprovalRequest,
} from "../../agents/control-layer/approvals.js";
import {
  resolveControlAuditLogPath,
  verifyControlAuditLog,
  type ControlAuditRecord,
} from "../../agents/control-layer/audit-log.js";
import {
  CORE_TOOL_CAPABILITIES,
  resolveToolCapability,
} from "../../agents/control-layer/capabilities.js";
import {
  parseConfigJson5,
  readConfigFileSnapshot,
  validateConfigObjectWithPlugins,
} from "../../config/config.js";
import { redactConfigObject } from "../../config/redact-snapshot.js";
import {
  ErrorCodes,
  errorShape,
  formatValidationErrors,
  validateApprovalsDecideParams,
  validateApprovalsGetParams,
  validateApprovalsListParams,
  validateApprovalsRevokeGrantParams,
  validateAuditExportParams,
  validateAuditGetParams,
  validateAuditQueryParams,
  validateAuditVerifyParams,
  validateCapabilitiesGetParams,
  validateCapabilitiesListParams,
  validateCapabilitiesReloadParams,
  validateConfigValidateParams,
  validateRuntimeLogsStopParams,
  validateRuntimeLogsTailParams,
  validateRuntimeSnapshotParams,
} from "../protocol/index.js";

const SECRET_KEY_RE = /(secret|token|password|authorization|api[-_]?key|cookie)/i;

function redactSecretLike(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => redactSecretLike(entry));
  }
  if (!value || typeof value !== "object") {
    return value;
  }
  const record = value as Record<string, unknown>;
  const next: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(record)) {
    if (SECRET_KEY_RE.test(key)) {
      next[key] = "[REDACTED]";
      continue;
    }
    next[key] = redactSecretLike(entry);
  }
  return next;
}

function redactApprovalRequest(request: ApprovalRequest): ApprovalRequest {
  const capability = resolveToolCapability(request.payload.toolName);
  const redactedParams = redactSecretLike(request.payload.params);
  const scrubbed =
    capability?.redactionRules.redactArgumentPaths.length &&
    redactedParams &&
    typeof redactedParams === "object" &&
    !Array.isArray(redactedParams)
      ? ({ ...(redactedParams as Record<string, unknown>) } as Record<string, unknown>)
      : redactedParams;

  for (const path of capability?.redactionRules.redactArgumentPaths ?? []) {
    const [topLevel] = path.split(".");
    if (!topLevel || !scrubbed || Array.isArray(scrubbed) || typeof scrubbed !== "object") {
      continue;
    }
    const scrubbedRecord = scrubbed as Record<string, unknown>;
    if (topLevel in scrubbedRecord) {
      scrubbedRecord[topLevel] = "[REDACTED]";
    }
  }

  return {
    ...request,
    payload: {
      ...request.payload,
      params: scrubbed,
    },
  };
}

async function readAuditRecords(): Promise<ControlAuditRecord[]> {
  const logPath = resolveControlAuditLogPath();
  const raw = await fs.readFile(logPath, "utf-8").catch(() => "");
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as ControlAuditRecord);
}

export const controlLayerHandlers: GatewayRequestHandlers = {
  "config.validate": async ({ params, respond }) => {
    if (!validateConfigValidateParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid config.validate params: ${formatValidationErrors(validateConfigValidateParams.errors)}`,
        ),
      );
      return;
    }
    const typed = params as { raw: string };
    const raw = typed.raw;
    const parsed = parseConfigJson5(raw);
    if (!parsed.ok) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, parsed.error));
      return;
    }
    const validated = validateConfigObjectWithPlugins(parsed.parsed);
    if (!validated.ok) {
      respond(
        false,
        undefined,
        errorShape(ErrorCodes.INVALID_REQUEST, "invalid config", {
          details: { issues: validated.issues },
        }),
      );
      return;
    }
    respond(true, { ok: true, config: redactConfigObject(validated.config) }, undefined);
  },

  "approvals.list": ({ params, respond }) => {
    if (!validateApprovalsListParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid approvals.list params: ${formatValidationErrors(validateApprovalsListParams.errors)}`,
        ),
      );
      return;
    }
    const manager = getGlobalToolApprovalManager();
    respond(
      true,
      {
        pending: manager.listPendingApprovals().map((entry) => redactApprovalRequest(entry)),
        grants: manager.listScopedGrants(),
      },
      undefined,
    );
  },

  "approvals.get": ({ params, respond }) => {
    if (!validateApprovalsGetParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid approvals.get params: ${formatValidationErrors(validateApprovalsGetParams.errors)}`,
        ),
      );
      return;
    }
    const typed = params as { requestId: string };
    const requestId = typed.requestId.trim();
    const entry = getGlobalToolApprovalManager().getPendingApproval(requestId);
    if (!entry) {
      respond(
        false,
        undefined,
        errorShape(ErrorCodes.INVALID_REQUEST, "approval request not found"),
      );
      return;
    }
    respond(true, { request: redactApprovalRequest(entry) }, undefined);
  },

  "approvals.decide": ({ params, respond, context }) => {
    if (!validateApprovalsDecideParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid approvals.decide params: ${formatValidationErrors(validateApprovalsDecideParams.errors)}`,
        ),
      );
      return;
    }

    const typed = params as { requestId: string; decision: "approve" | "deny"; reason?: string };
    const requestId = typed.requestId.trim();
    const decision = typed.decision;

    const manager = getGlobalToolApprovalManager();
    const decided = manager.decideApproval({
      requestId,
      approved: decision === "approve",
      reason: typed.reason,
    });

    if (!decided) {
      respond(
        false,
        undefined,
        errorShape(ErrorCodes.INVALID_REQUEST, "approval request not found"),
      );
      return;
    }
    const payload = { requestId, decision };
    context.broadcast("approvals", payload, { dropIfSlow: true });
    respond(true, { ok: true }, undefined);
  },

  "approvals.revokeGrant": ({ params, respond, context }) => {
    if (!validateApprovalsRevokeGrantParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid approvals.revokeGrant params: ${formatValidationErrors(validateApprovalsRevokeGrantParams.errors)}`,
        ),
      );
      return;
    }
    const typed = params as { grantId: string };
    const grantId = typed.grantId.trim();
    const revoked = getGlobalToolApprovalManager().revokeScopedGrant(grantId);
    if (!revoked) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "grant not found"));
      return;
    }
    context.broadcast("approvals", { grantId, action: "revoked" }, { dropIfSlow: true });
    respond(true, { ok: true }, undefined);
  },

  "audit.query": async ({ params, respond }) => {
    if (!validateAuditQueryParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid audit.query params: ${formatValidationErrors(validateAuditQueryParams.errors)}`,
        ),
      );
      return;
    }
    const typed = params as { limit?: number; offset?: number; kind?: string };
    const limit = typed.limit ?? 100;
    const offset = typed.offset ?? 0;
    const kind = typed.kind?.trim() ?? "";
    const records = await readAuditRecords();
    const filtered = kind ? records.filter((entry) => entry.kind === kind) : records;
    const rows = filtered
      .slice(offset, offset + Math.min(limit, 500))
      .map((entry) => redactSecretLike(entry));
    respond(
      true,
      {
        total: filtered.length,
        offset,
        limit: Math.min(limit, 500),
        records: rows,
      },
      undefined,
    );
  },

  "audit.get": async ({ params, respond }) => {
    if (!validateAuditGetParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid audit.get params: ${formatValidationErrors(validateAuditGetParams.errors)}`,
        ),
      );
      return;
    }
    const typed = params as { index: number };
    const index = typed.index;
    const records = await readAuditRecords();
    const record = records[index];
    if (!record) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "audit record not found"));
      return;
    }
    respond(true, { index, record: redactSecretLike(record) }, undefined);
  },

  "audit.export": async ({ params, respond }) => {
    if (!validateAuditExportParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid audit.export params: ${formatValidationErrors(validateAuditExportParams.errors)}`,
        ),
      );
      return;
    }
    const logPath = resolveControlAuditLogPath();
    const raw = await fs.readFile(logPath, "utf-8").catch(() => "");
    respond(true, { path: logPath, format: "jsonl", data: raw }, undefined);
  },

  "audit.verify": async ({ params, respond, context }) => {
    if (!validateAuditVerifyParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid audit.verify params: ${formatValidationErrors(validateAuditVerifyParams.errors)}`,
        ),
      );
      return;
    }
    const logPath = resolveControlAuditLogPath();
    const verified = await verifyControlAuditLog(logPath).catch((err) => ({
      ok: false,
      checked: 0,
      error: String(err),
    }));
    context.broadcast("audit", { action: "verify", ...verified }, { dropIfSlow: true });
    respond(true, { path: logPath, ...verified }, undefined);
  },

  "capabilities.list": ({ params, respond }) => {
    if (!validateCapabilitiesListParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid capabilities.list params: ${formatValidationErrors(validateCapabilitiesListParams.errors)}`,
        ),
      );
      return;
    }
    respond(true, { capabilities: Array.from(CORE_TOOL_CAPABILITIES.values()) }, undefined);
  },

  "capabilities.get": ({ params, respond }) => {
    if (!validateCapabilitiesGetParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid capabilities.get params: ${formatValidationErrors(validateCapabilitiesGetParams.errors)}`,
        ),
      );
      return;
    }
    const typed = params as { toolName: string };
    const toolName = typed.toolName.trim();
    const capability = resolveToolCapability(toolName);
    if (!capability) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "capability not found"));
      return;
    }
    respond(true, capability, undefined);
  },

  "capabilities.reload": ({ params, respond }) => {
    if (!validateCapabilitiesReloadParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid capabilities.reload params: ${formatValidationErrors(validateCapabilitiesReloadParams.errors)}`,
        ),
      );
      return;
    }
    // Capabilities are static today; keep an explicit method so Studio can treat
    // this endpoint uniformly across static + dynamic capability sources.
    respond(true, { ok: true, reloadedAt: Date.now() }, undefined);
  },

  "runtime.snapshot": async ({ params, context, respond }) => {
    if (!validateRuntimeSnapshotParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid runtime.snapshot params: ${formatValidationErrors(validateRuntimeSnapshotParams.errors)}`,
        ),
      );
      return;
    }
    const config = await readConfigFileSnapshot();
    respond(
      true,
      {
        channels: context.getRuntimeSnapshot(),
        configPath: config.path,
        configValid: config.valid,
      },
      undefined,
    );
  },

  "runtime.logs.tail": async ({ params, respond }) => {
    if (!validateRuntimeLogsTailParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid runtime.logs.tail params: ${formatValidationErrors(validateRuntimeLogsTailParams.errors)}`,
        ),
      );
      return;
    }
    const typed = params as { limit?: number; cursor?: number; maxBytes?: number };
    const proxyLimit = typed.limit ?? 200;
    const proxyCursor = typed.cursor;
    const proxyMaxBytes = typed.maxBytes ?? 250_000;

    const configured = await (async () => {
      const out: { ok: boolean; payload?: unknown; error?: unknown } = { ok: false };
      const handlers = await import("./logs.js");
      await handlers.logsHandlers["logs.tail"]({
        req: { id: "runtime-logs-tail", type: "req", method: "runtime.logs.tail" },
        params: { limit: proxyLimit, cursor: proxyCursor, maxBytes: proxyMaxBytes },
        client: null,
        isWebchatConnect: () => false,
        respond: (ok, payload, error) => {
          out.ok = ok;
          out.payload = payload;
          out.error = error;
        },
        context: {} as never,
      });
      return out;
    })();

    if (!configured.ok) {
      respond(false, undefined, configured.error as never);
      return;
    }
    respond(true, configured.payload, undefined);
  },

  "runtime.logs.stop": ({ params, respond }) => {
    if (!validateRuntimeLogsStopParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid runtime.logs.stop params: ${formatValidationErrors(validateRuntimeLogsStopParams.errors)}`,
        ),
      );
      return;
    }
    respond(true, { ok: true }, undefined);
  },
};
