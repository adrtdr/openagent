import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { resolveStateDir } from "../../config/paths.js";

export type ControlAuditEventKind =
  | "tool.proposed"
  | "policy.decision"
  | "approval.requested"
  | "approval.decided"
  | "tool.executed";

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export type ControlAuditEvent = {
  ts: number;
  kind: ControlAuditEventKind;
  data: JsonValue;
};

export type ControlAuditRecord = ControlAuditEvent & {
  prevHash: string;
  hash: string;
};

export type VerifyAuditResult = {
  ok: boolean;
  checked: number;
  error?: string;
};

function canonicalJson(value: unknown): JsonValue {
  if (
    value == null ||
    typeof value === "boolean" ||
    typeof value === "number" ||
    typeof value === "string"
  ) {
    return value ?? null;
  }
  if (Array.isArray(value)) {
    return value.map((item) => canonicalJson(item));
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).toSorted(([a], [b]) =>
      a.localeCompare(b),
    );
    return Object.fromEntries(entries.map(([key, entry]) => [key, canonicalJson(entry)]));
  }
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (typeof value === "symbol") {
    return value.toString();
  }
  if (typeof value === "function") {
    return `[function:${value.name || "anonymous"}]`;
  }
  return "[unsupported]";
}

function hashRecordFields(record: Omit<ControlAuditRecord, "hash">): string {
  const serialized = JSON.stringify(canonicalJson(record));
  return createHash("sha256").update(serialized).digest("hex");
}

export function resolveControlAuditLogPath(env: NodeJS.ProcessEnv = process.env): string {
  const explicit = env.OPENAGENT_AUDIT_LOG_PATH?.trim();
  if (explicit) {
    return path.resolve(explicit);
  }
  return path.join(resolveStateDir(env), "audit", "control-layer.jsonl");
}

export function isControlAuditLoggingEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.OPENAGENT_AUDIT_LOG === "0") {
    return false;
  }
  return env.OPENAGENT_CONTROL_LAYER === "1" || env.OPENAGENT_AUDIT_LOG === "1";
}

async function readLastRecord(filePath: string): Promise<ControlAuditRecord | null> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const lines = raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      return null;
    }
    return JSON.parse(lines.at(-1) ?? "null") as ControlAuditRecord;
  } catch {
    return null;
  }
}

export async function appendControlAuditEvent(
  kind: ControlAuditEventKind,
  data: unknown,
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  if (!isControlAuditLoggingEnabled(env)) {
    return;
  }

  const filePath = resolveControlAuditLogPath(env);
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  const previous = await readLastRecord(filePath);
  const next: Omit<ControlAuditRecord, "hash"> = {
    ts: Date.now(),
    kind,
    data: canonicalJson(data),
    prevHash: previous?.hash ?? "",
  };
  const record: ControlAuditRecord = {
    ...next,
    hash: hashRecordFields(next),
  };

  await fs.appendFile(filePath, `${JSON.stringify(record)}\n`, "utf-8");
}

export async function verifyControlAuditLog(filePath: string): Promise<VerifyAuditResult> {
  const raw = await fs.readFile(filePath, "utf-8");
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  let prevHash = "";

  for (let index = 0; index < lines.length; index += 1) {
    const parsed = JSON.parse(lines[index] ?? "null") as ControlAuditRecord;
    if (parsed.prevHash !== prevHash) {
      return {
        ok: false,
        checked: index,
        error: `Record ${index + 1} has invalid prevHash`,
      };
    }
    const computed = hashRecordFields({
      ts: parsed.ts,
      kind: parsed.kind,
      data: parsed.data,
      prevHash: parsed.prevHash,
    });
    if (computed !== parsed.hash) {
      return {
        ok: false,
        checked: index,
        error: `Record ${index + 1} hash mismatch`,
      };
    }
    prevHash = parsed.hash;
  }

  return { ok: true, checked: lines.length };
}
