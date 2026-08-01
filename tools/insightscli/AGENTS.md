# insightscli — framework boundary and conventions

`tools/insightscli/` is the **generic** developer-CLI framework published on PyPI as `insightscli`. It is not Insights-specific. Insights happens to be its primary consumer today, but the framework must remain usable by any project that wants a YAML-driven dev CLI.

The Insights-specific extension layer lives in `tools/insightscli-commands/insightscli_commands/` and is wired in via `config.commands_dir` + `config.boot_modules` in `insightscli.yaml`.

## What belongs where

| Concern                                                                    | `tools/insightscli/` (core, PyPI) | `tools/insightscli-commands/` (Insights extension)  |
| -------------------------------------------------------------------------- | --------------------------- | -------------------------------------------- |
| Command discovery (manifest schema, lazy click, extends)                   | ✅                          | ❌                                           |
| Categorized help output                                                    | ✅                          | ❌                                           |
| Telemetry framework (hook registration)                                    | ✅                          | ❌                                           |
| Generic env file loading (`config.env.files`)                              | ✅                          | ❌                                           |
| Generic secret-wrapper hook (`config.env.secrets` — file, marker, wrap)    | ✅                          | ❌                                           |
| Insights command implementations (`migrations:run`, `test`, `doctor`…)      | ❌                          | ✅                                           |
| Insights precheck handlers / telemetry properties / hint hooks              | ❌                          | ✅                                           |
| Knowledge of `1Password` / `op` / `op://` specifically                     | ❌                          | ❌ — _neither._ Use the generic wrap config  |
| Knowledge of `.env.development` / `.env.services` / `.env.local` filenames | ❌                          | ❌ — _neither._ Declare them in `insightscli.yaml` |

## Reviewer checklist for PRs touching `tools/insightscli/`

- [ ] Is the change generic, or does it bake in knowledge of a specific consumer (Insights, a specific secrets tool, a specific filename)?
- [ ] If it's specific, does it need to be in core, or can it move to `tools/insightscli-commands/` (or be declared in `insightscli.yaml` config)?
- [ ] If new config schema, does it follow the existing pattern (`config.scripts_dir`, `config.commands_dir`, `config.boot_modules`)?
- [ ] Tests live in `tools/insightscli/tests/` and use temp configs/files — they don't depend on Insights's `insightscli.yaml`.

## Prior art (env files + secrets)

Researched 2026-05-20 before committing to the `config.env` schema. Summary, so the next contributor doesn't have to re-derive this:

| Tool                                                            | Generic env files in core?                                              | Secret resolution in core?                                                                                                                        |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [just](https://just.systems/man/en/settings.html)               | ✅ (`dotenv-load`, `dotenv-filename`, `dotenv-path`, `dotenv-override`) | ❌ — wrap with `op run`/`doppler run`                                                                                                             |
| [mise](https://mise.jdx.dev/environments/)                      | ✅ (`[env] _.file`, list, formats, redact)                              | ❌ — [maintainer explicitly excluded](https://github.com/jdx/mise/discussions/3712), built [fnox](https://github.com/jdx/fnox) as a separate tool |
| [task](https://taskfile.dev/docs/guide)                         | ✅ (`dotenv: [...]`, global + per-task)                                 | ❌                                                                                                                                                |
| `op run` / `doppler run` / `infisical run` / `dotenvx` / `fnox` | ❌ (they wrap your command)                                             | ✅ — _this is their whole product_                                                                                                                |
| [varlock](https://varlock.dev/)                                 | ✅ + typed schema                                                       | ✅ via _provider plugins_ — but varlock is itself a dedicated secrets product, not a task runner                                                  |

**The pattern that emerged:** generic env-file loading is a normal CLI framework feature with a small contract. Specific secret resolution (1Password, Vault, Doppler…) is its own product, invoked as a wrapper via `<secret-cli> run -- <your-command>`. mise's maintainer puts it best:

> "mise reloads its environment too often and because secrets often rely on remote calls to things like kms or 1Password, it would make it too slow to be helpful."

Even 1Password's own docs don't recommend a "task runner integration" — they just say to invoke `op run --` directly.

## How insightscli applies the pattern

**In core (generic):**

- `config.env.files: [...]` — list of dotenv files, loaded in order, first wins, shell env always wins.
- `config.env.secrets.{file, marker, wrap}` — optional generic wrapper hook. Re-execs the invocation under `wrap` when (1) the invoked subcommand opts in via `needs_secrets: true`, (2) the file contains `marker`, and (3) `wrap[0]` is on PATH. Otherwise loads the file directly with marker-matching lines skipped, so literals don't leak as garbage strings.
- `HOGLI_SECRETS_WRAPPED=1` sentinel — set before the wrap re-exec, inherited by subprocesses so composite/steps chains don't re-prompt for auth on every step.
- Per-command `needs_secrets: true` — opt-in gate for the wrap. Without it the wrap never fires; the built-in `insightscli run` is the one framework command that always opts in.

**Not in core:**

- `op` / `op://` / 1Password as concepts — _declare them in `config.env.secrets`_.
- Any specific file names (`.env.local`, `.env.development`, …) — _declare them in `config.env.files`_.

Insights declares its setup in the root `insightscli.yaml`:

```yaml
config:
  env:
    files:
      - .env.development
      - .env.services
    secrets:
      file: .env.local
      marker: 'op://'
      wrap: [op, run, --env-file, '{file}', --]
```

Same primitive works for Doppler (`wrap: [doppler, run, --]`), Infisical (`wrap: [infisical, run, --]`), Vault, dotenvx, fnox, or anything else that follows the wrap-and-exec convention.

## How not to evolve insightscli

Anti-patterns flagged during PR review (don't re-introduce):

- Hardcoded filenames in `insightscli/cli.py`. Always read from manifest.
- `if shutil.which("op"):` or any tool-specific binary check in core. The wrap config makes the binary configurable; use `shutil.which(wrap[0])` so any wrap tool the user declared works the same way.
- Provider-specific helpful error messages ("install brew install 1password-cli"). Core's error message should be tool-agnostic ("the configured wrap binary `<x>` is not on PATH"). The Insights-side extension can layer richer messaging via the hooks API if needed.
- Adding behavior to `tools/insightscli/src/insightscli/cli.py` that's only useful to Insights. Move it to `tools/insightscli-commands/` and register via `boot_modules`.

## When in doubt

If you're about to add code to `tools/insightscli/` and you're not sure whether it's generic enough: it probably isn't. Ask first, or write it in `tools/insightscli-commands/` and we can promote it later if multiple consumers want it.

## HOGLI\_\* environment variable namespace

Core and consumers share the `HOGLI_` env prefix; check both lists before minting a new name.

Core-reserved (defined in `tools/insightscli/src/insightscli/`): `HOGLI_DEBUG`, `HOGLI_MANIFEST`, `HOGLI_SECRETS_WRAPPED`, `HOGLI_NESTED_INVOCATION`.

Consumer-owned (defined in `tools/insightscli-commands/`): `HOGLI_ENVIRONMENT`, `HOGLI_AGENT`, `HOGLI_PROCESS_MANAGER` (telemetry self-declaration), `HOGLI_NO_HINTS`, `HOGLI_MPROCS_PATH`, `HOGLI_DEVBOX_CODER_URL`, `HOGLI_DEVBOX_CODER_VERSION`.

If core needs a name a consumer already uses (or vice versa), rename rather than overload — bootstraps in other repos export these and silently changing semantics breaks them.
