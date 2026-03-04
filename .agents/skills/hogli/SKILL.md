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

`insightscli dev:setup --log` enables file logging for all mprocs processes. Logs go to `/tmp/insights-<process>.log` where `<process>` matches the mprocs process key (see `bin/mprocs.yaml`).

## Key references

- `common/insightscli/manifest.yaml` — command definitions (source of truth)
- `common/insightscli/commands.py` — extension point for custom Click commands
- `common/insightscli/README.md` — full developer and architecture docs
