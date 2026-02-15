import process from "node:process";
import {
  resolveControlAuditLogPath,
  verifyControlAuditLog,
} from "../src/agents/control-layer/audit-log.js";

async function main() {
  const filePath = process.argv[2]
    ? String(process.argv[2])
    : resolveControlAuditLogPath(process.env);
  const result = await verifyControlAuditLog(filePath);
  if (!result.ok) {
    console.error(`audit verify failed: ${result.error ?? "unknown error"}`);
    process.exitCode = 1;
    return;
  }
  console.log(`audit verify ok: ${result.checked} records (${filePath})`);
}

main().catch((err) => {
  console.error(`audit verify failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
});
