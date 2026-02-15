# OpenAgent Implementation + Install Status (Phase 5 checkpoint)

This checkpoint follows `openagent-spec/CODEX/OPENAGENT_CODEX_MASTER_PROMPT.md` and focuses on the requested verification output:

- continue from currently implemented state
- test installability
- provide local + CI run instructions

## Current install status

As tested in this workspace:

- Package install succeeds via `pnpm install`.
- Packaging succeeds via `npm pack`.
- Tarball install succeeds via `npm install --prefix /tmp/openagent-install-test <tarball>`.
- Installed CLI binary available today is `openclaw`.
- `openagent` binary is not yet present in the packaged output.

## What this means for the roadmap

Relative to Phase 1 in the master prompt, installation mechanics are healthy, but primary CLI rename is still incomplete because only `openclaw` is shipped from `package.json#bin`.

## Local run instructions

### 1) Install dependencies

```bash
pnpm install
```

### 2) Run from source (dev)

```bash
pnpm dev -- --help
```

Or call the CLI script directly:

```bash
node openclaw.mjs --help
```

### 3) Build + run built output

```bash
pnpm build
node dist/index.js --help
```

### 4) Verify installable package artifact

```bash
npm pack --silent
mkdir -p /tmp/openagent-install-test
npm install --prefix /tmp/openagent-install-test ./openclaw-<version>.tgz
/tmp/openagent-install-test/node_modules/.bin/openclaw --help
```

Optional compatibility check for future rename work:

```bash
test -x /tmp/openagent-install-test/node_modules/.bin/openagent
```

## CI run instructions

Use a Node 22+ environment with pnpm available.

### Minimal CI gate (fast)

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm check
pnpm test
```

### Installability gate (pack + smoke)

```bash
pnpm install --frozen-lockfile
npm pack --silent
mkdir -p /tmp/openagent-install-test
npm install --prefix /tmp/openagent-install-test ./openclaw-*.tgz
/tmp/openagent-install-test/node_modules/.bin/openclaw --help
```

Recommended follow-up assertion when Phase 1 rename lands:

```bash
/tmp/openagent-install-test/node_modules/.bin/openagent --help
```
