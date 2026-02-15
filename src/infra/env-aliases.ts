const OPENAGENT_PREFIX = "OPENAGENT_";
const OPENCLAW_PREFIX = "OPENCLAW_";

let didWarnOpenClawAlias = false;

export function applyOpenAgentEnvAliases(env: NodeJS.ProcessEnv = process.env): void {
  for (const [key, value] of Object.entries(env)) {
    if (!key.startsWith(OPENAGENT_PREFIX) || value == null) {
      continue;
    }
    const legacyKey = `${OPENCLAW_PREFIX}${key.slice(OPENAGENT_PREFIX.length)}`;
    if (env[legacyKey] == null) {
      env[legacyKey] = value;
    }
  }

  if (didWarnOpenClawAlias) {
    return;
  }
  const usesLegacyAlias = Object.keys(env).some((key) => key.startsWith(OPENCLAW_PREFIX));
  if (!usesLegacyAlias) {
    return;
  }
  didWarnOpenClawAlias = true;
  process.emitWarning(
    "OPENCLAW_* env vars are deprecated; prefer OPENAGENT_*.",
    "DeprecationWarning",
  );
}

export function resetOpenAgentAliasWarningForTests(): void {
  didWarnOpenClawAlias = false;
}
