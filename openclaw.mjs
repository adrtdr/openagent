#!/usr/bin/env node

process.emitWarning("'openclaw' CLI is deprecated; please use 'openagent'.", "DeprecationWarning");

await import("./openagent.mjs");
