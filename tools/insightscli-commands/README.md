# Insights Custom Commands

Custom Python commands for the Insights monorepo. They extend insightscli with Insights-specific functionality that's too complex for YAML definitions.

## How It Works

Each command module is imported **on first use**, not at insightscli startup. The insightscli framework reads `config.commands_dir` from `/insightscli.yaml`; manifest entries with a `click:` field are resolved by Click when the user invokes the command or runs per-command `--help`.

Boot-time registrations (precheck handlers, telemetry hooks, post-command hooks) live in their own modules listed under `config.boot_modules:` in `insightscli.yaml`. Those modules **must** be cheap to import — keep heavy dependencies behind deferred imports inside handler bodies.

## Adding a Command

1. Create or edit a module with a plain `@click.command(...)` decorator (no need to import or reference insightscli's `cli` group):

```python
# myfeature.py
import click

@click.command(name="my:command")
@click.option("--verbose", "-v", is_flag=True)
def my_command(verbose: bool) -> None:
    """One-line description shown in insightscli --help."""
    click.echo("Done!")
```

2. Add an entry to `insightscli.yaml` in the appropriate category section:

```yaml
tools:
  my:command:
    click: insightscli_commands.myfeature:my_command
    description: One-line summary shown in `insightscli --help`.
```

The Click command name must match the manifest key — drift surfaces as a `ClickException` on resolution. The insightscli test suite parametrizes a `--help` invocation over every `click:` entry, which is Click's recommended sanity check.

Mark a command hidden by setting `hidden: true` on the manifest entry. Don't use `@click.command(hidden=True)`; the manifest is the only source of truth.

3. Test it:

```bash
insightscli my:command --help
insightscli my:command -v
```

That's it. No side-effect imports, no central registration list to maintain.

## Boot Modules

`config.boot_modules` in `insightscli.yaml` lists modules imported once at startup. They register hooks via `insightscli.hooks`:

- `insightscli_commands.prechecks` — declares the `migrations` precheck (used by `dev:start`).
- `insightscli_commands.telemetry_props` — adds Insights environment props (`environment`, `agent`, `is_agent`, `in_flox`, `is_worktree`, `is_insights_dev`, `process_manager`, `has_devenv_config`, `repo_sha`, `repo_commit_date`) to every `command_started` / `command_completed` event.
- `insightscli_commands.hint_hook` — shows a contextual hint after successful commands.

Add a new boot module by creating a file that calls one of the `register_*` helpers from `insightscli.hooks` at import time, then list it under `config.boot_modules:`. Keep these modules import-light: the precheck handler in `prechecks.py` is the canonical example of deferring its heavy import until the handler actually fires.

## When to Use Python vs YAML

| Use Python here when...            | Use YAML (`insightscli.yaml`) when...  |
| ---------------------------------- | -------------------------------- |
| Complex logic, loops, conditionals | Simple shell one-liners          |
| Need Click's argument parsing      | Delegating to bin/ scripts       |
| Interactive prompts or menus       | Chaining existing insightscli commands |
| Accessing Python libraries         | Quick prototypes                 |

## File Structure

```text
tools/insightscli-commands/
└── insightscli_commands/
    ├── __init__.py       # Only the common/ sys.path workaround
    ├── prechecks.py      # Boot module — registers the migrations precheck
    ├── telemetry_props.py# Boot module — registers Insights telemetry props
    ├── hint_hook.py      # Boot module — registers the post-command hint hook
    ├── build.py          # Lazy: insightscli build
    ├── doctor.py         # Lazy: insightscli doctor / doctor:disk / doctor:zombies / doctor:report
    ├── ...               # Other lazy command modules
    ├── devbox/           # Devbox subpackage (lazy)
    ├── devenv/           # Intent-based dev environment subpackage (lazy)
    └── product/          # Product scaffolding subpackage (lazy)
```

This directory is not packaged or installed — the insightscli framework loads `insightscli_commands` from disk at runtime via `config.commands_dir` in `/insightscli.yaml`. Runtime dependencies (`click`, `pyyaml`, `pydantic`, `requests`) are declared in the root `/pyproject.toml` alongside the rest of the monorepo.

## Tips

- Use `click.echo()` for output, not `print()`
- Use `click.secho(msg, fg="green")` for colored output
- Add `@click.option("--yes", "-y", is_flag=True)` for destructive commands
- Keep commands focused — compose via YAML `steps:` if needed

## See Also

- `/insightscli.yaml` — manifest with category placement, lazy `click:` import paths, and `boot_modules:` list
- `/tools/insightscli/README.md` — framework documentation (command registry, hooks API)
- `/bin/` — shell scripts (referenced via `bin_script:` in YAML)
