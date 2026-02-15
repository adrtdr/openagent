# Upstream Sync + Rename Divergence (OpenClaw → OpenAgent)

This repository (`adrtdr/openagent`) is **already** a fork of **OpenClaw** (`openclaw/openclaw`).  
This document defines **how we keep upstream in sync** and the **intentional deltas** that implement the OpenAgent identity and your custom specs.

## Git remotes (one-time setup)

```bash
git remote -v

# If upstream is missing:
git remote add upstream https://github.com/openclaw/openclaw.git
git fetch upstream --tags
```

Recommended convention:

- `origin`   → `adrtdr/openagent` (your repo)
- `upstream` → `openclaw/openclaw` (source of truth for baseline)

## Baseline pinning

We track OpenClaw via **pinned tags** (preferred) or pinned commits.

Policy:

- Pick an upstream tag (e.g. `v2026.2.12` or newer).
- Record the chosen baseline in the changelog / release notes.
- Upgrade by moving the pin to a newer tag, then resolving conflicts.

Why pin?

- Deterministic builds and Codex runs
- Controlled upgrades (security fixes without surprise regressions)
- Clear provenance when debugging issues

## Upstream sync workflow

### Option A: Merge-based sync (simplest for long-lived forks)

```bash
git checkout main
git fetch upstream --tags
git merge upstream/main
git push origin main
```

### Option B: Rebase-based sync (cleaner history, more friction)

```bash
git checkout main
git fetch upstream --tags
git rebase upstream/main
git push --force-with-lease origin main
```

**Rule:** choose one strategy and keep it consistent across contributors.

## Intentional divergence (OpenAgent requirements)

These changes are **deliberate** and should be preserved across upstream merges:

### 1) CLI identity

- Primary CLI command: `openagent`
- Entry point: `openagent.mjs`
- `package.json#bin` maps `openagent` → `openagent.mjs`

Optional compatibility shim (if desired):

- Keep `openclaw` as an alias command that forwards to `openagent` with a one-time warning.

### 2) State & config root

- OpenClaw: `~/.openclaw/…`
- OpenAgent: `~/.openagent/…`

Migration rule:

- If `~/.openagent/` is missing but `~/.openclaw/` exists, migrate (copy or move) on first run.
- Preserve file permissions; never downgrade secrets handling.

### 3) Environment variables

- Primary: `OPENAGENT_*`
- Compatibility: accept `OPENCLAW_*` as aliases of `OPENAGENT_*` (warn once, then proceed).

### 4) Branding & documentation

- Replace “OpenClaw” with “OpenAgent” wherever the fork is user-facing:
  - CLI help text
  - README / docs
  - logs and error messages
- Keep upstream attribution (license notices, provenance) intact.

## Conflict handling rules

When upstream changes collide with OpenAgent deltas:

1. Prefer **adapter layers** over invasive edits:
   - wrappers, extension hooks, config translators
2. Keep “rename” changes centralized:
   - a single module that owns path/env defaults and migration logic
3. Add regression tests for each preserved delta:
   - CLI alias behavior (if enabled)
   - config/state migration
   - env var alias mapping

## Pulling upstream regularly

Do not let the fork drift for months.

Suggested cadence:

- **Weekly**: check upstream tags/releases; merge/rebase if low risk
- **Immediately**: sync when upstream publishes security fixes or critical bugfixes

## What not to do

- Don’t rewrite history on shared branches unless you explicitly standardize on rebase.
- Don’t “rename everywhere” in a way that breaks upstream merges repeatedly—centralize the identity layer instead.
