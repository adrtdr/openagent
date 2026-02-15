# OpenAgent (OpenClaw fork + Operator Control Layer) — Technical Specification Pack

**Target repo:** `https://github.com/adrtdr/openagent/` (a fork of `openclaw/openclaw`)

This archive is **Codex-ready** and is intended to produce an **OpenAgent** system built on top of **OpenClaw** with additional **owner/operator-control** features:

- capability registry + risk tiers
- deny-by-default tool policy
- explicit approval workflow for high-risk actions
- tamper-evident audit logs (hash-chained JSONL)
- a **ChatGPT-like “Studio” UI** for chat + approvals + audit + settings (`/studio`)

## How to use this pack

1. Start from a pinned upstream OpenClaw tag (recommended: `v2026.2.12` or newer).
2. Apply **rename/rebrand** (OpenClaw → OpenAgent) with **backward compatibility**.
3. Implement the control layer + WS API + Studio UI per the SPEC and CODEX prompts.

See:
- `SPEC/15_Upstream_Sync_and_Rename_Divergence.md` (upstream sync policy + rename divergence)
- `CODEX/OPENAGENT_CODEX_MASTER_PROMPT.md` (single phased prompt)
- `CODEX/WORK_ITEMS.yaml` (backlog)
- `SPEC/` for the normative requirements

## What “rename” means (canonical)

- Product name: **OpenAgent**
- Primary CLI: `openagent`
- Primary state/config root: `~/.openagent/`
- Compatibility:
  - accept legacy `openclaw` CLI (shim) (optional)
  - migrate legacy state/config from `~/.openclaw/`
  - accept legacy `OPENCLAW_*` env vars as aliases (warn once)

## Contents

See `FILE_TREE.md`.
