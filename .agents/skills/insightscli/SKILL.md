---
name: insightscli
description: >
  Insights developer CLI and repo tooling reference. Use when the user mentions
  insightscli, asks about repo CLI tools, bin scripts, Makefiles, how to run/build/test/lint,
  or any dev environment commands.
---

# insightscli - Insights Developer CLI

Unified CLI for Insights development. Wraps all repo scripts, bin commands, and tooling behind a single entry point. There is no Makefile — insightscli is the equivalent.

Run `insightscli --help` to get the full, current command list. Run `insightscli <command> --help` for any subcommand.

## Process logging (for agents/debugging)

Where logs land depends on how the stack was launched:

**Detached (`insightscli up -d`)** — phrocs writes files under `.insights/.generated/logs/` on every boot:

- `phrocs.log` — the daemon's own stdio; the place to look when phrocs died at startup and the phrocs MCP tools are unreachable.
- `<process>.log` — per-process output (truncated on each start), where `<process>` matches the phrocs process key (see `bin/mprocs.yaml`).
- `insightscli doctor:report` prints the `phrocs.log` path and tails its last lines.

**TUI with `insightscli dev:setup --log`, then `insightscli start`** — adds a tee wrap per process:

- `/tmp/insights-<process>.log` — full stdout+stderr; persists in the generated config until `dev:setup` is re-run without `--log`.

When the phrocs MCP is reachable, prefer `mcp__phrocs__get_process_logs` over grepping files.

## Key references

- `insightscli.yaml` — command definitions (source of truth)
- `tools/insightscli-commands/insightscli_commands/` — Insights-specific lazy Click command modules
- `tools/insightscli/README.md` — framework documentation
- `tools/insightscli-commands/README.md` — Insights commands documentation
