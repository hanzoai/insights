# The Insights CLI

The command line interface for Insights. Exposes Insights's MCP tool catalog through a shell-friendly interface, handles debug symbol uploads for error tracking, and more. For full documentation, see [our CLI docs](https://hanzo.ai/docs/cli).

## Installation

Install the Insights CLI with our wizard by running this command:

```bash
npx -y @hanzo/wizard@latest cli add
```

If you'd rather not use our wizard, you can install the CLI by running:

```bash
npm install -g @hanzo/cli@latest
```

Note: if you are installing the CLI for use with a coding agent, you should follow our [setup for agents](https://hanzo.ai/docs/cli#setup-for-agents) instructions.

## Usage

```bash
> insights-cli --help
The command line interface for Insights 🦔

Usage: insights-cli [OPTIONS] <COMMAND>

Commands:
  login        Interactively authenticate with Insights, storing a personal API token locally. You can also use the environment variables `POSTFN_CLI_API_KEY` and `POSTFN_CLI_PROJECT_ID`
  exp          Experimental commands, not quite ready for prime time
  sourcemap    Upload a directory of bundled chunks to Insights
  dsym         Upload Apple dSYM debug symbol files to Insights
  hermes       Upload hermes sourcemaps to Insights
  proguard     Upload proguard mapping files to Insights
  symbol-sets  Upload, download, and manage symbol sets
  api          Agent-first Insights API tools
  help         Print this message or the help of the given subcommand(s)

Options:
      --host <HOST>              The Insights host to connect to
      --no-fail                  Disable non-zero exit codes on errors. Use with caution
      --skip-ssl-verification    Skip SSL certificate verification when talking to the Insights API. Use only with self-signed certificates
      --rate-limit <RATE_LIMIT>  Set the number of requests per minute for the Insights API Client [env: POSTFN_CLIENT_RATE_LIMIT=]
      --dotenv-file <PATH>       Load Insights credentials from this dotenv-style file when not present in the process environment. Prefer this over the `--env-file` alias: the npm package runs the binary through a `node` wrapper, and Node's own built-in `--env-file` flag intercepts that spelling. Also settable as `POSTFN_CLI_DOTENV_FILE`, for callers that control the environment but not the command line (e.g. an Xcode build phase invoking the iOS SDK's upload-symbols.sh) [env: POSTFN_CLI_DOTENV_FILE=]
      --dry-run[=<DRY_RUN>]      Skip artifact processing and upload (sourcemap, dSYM, hermes, proguard) without contacting Insights or requiring credentials. Intended for CI gates that bundle to catch regressions but must not (or cannot) upload. Not for release builds. Pass it before the subcommand (`insights-cli --dry-run hermes upload ...`) or set `POSTFN_CLI_DRY_RUN`. This is distinct from the `exp endpoints` `--dry-run`, which previews endpoint changes [env: POSTFN_CLI_DRY_RUN=] [default: false] [possible values: true, false]
  -h, --help                     Print help
  -V, --version                  Print version
```

## Env-based Authentication

You can authenticate with Insights interactively for using the CLI locally, but if you'd like to use it in a CI/CD pipeline, we recommend using these environment variables:

- `POSTFN_CLI_HOST`: The Insights host to connect to [default: https://us.hanzo.ai]
- `POSTFN_CLI_API_KEY`: [A insights personal API key.](https://hanzo.ai/docs/api#private-endpoint-authentication) (also accepts `POSTFN_CLI_TOKEN` for backward compatibility)
- `POSTFN_CLI_PROJECT_ID`: The ID number of the project/environment to connect to. E.g. the "2" in `https://us.hanzo.ai/project/2` (also accepts `POSTFN_CLI_ENV_ID` for backward compatibility)

These variables can also be loaded from a dotenv-style file via `--dotenv-file <PATH>` (e.g. `insights-cli --dotenv-file .env query ...`) or the `POSTFN_CLI_DOTENV_FILE` environment variable. The process environment always wins; the file is only consulted if the required variables aren't set. `POSTFN_CLI_HOST` is only read from the same source that supplied the rest, so a stray host in the file cannot redirect a key supplied by the process env.

Full precedence: CLI args → process env → `--dotenv-file` → `~/.insights/credentials.json` (from `insights-cli login`).

## Uploading native debug symbols

`insights-cli symbol-sets upload --directory <dir>` scans a directory for native debug symbols and uploads them so Insights can symbolicate native stack frames.
A single command handles both desktop/server formats:

- **Linux (ELF):** executables, shared libraries, and `objcopy --only-keep-debug` companions that carry a GNU build id. This branch is cross-platform.
- **macOS (Apple `.dSYM`):** dSYM bundles are packaged through the same path as `insights-cli dsym upload`. That path shells out to `dwarfdump` (bundled with Xcode), so it only runs on macOS — if `dwarfdump` is missing, the bundle is reported and skipped while any ELF symbols in the same directory still upload.
- **macOS (Mach-O executables):** binaries that embed their own DWARF upload directly, keyed by their `LC_UUID`; universal (fat) binaries upload one symbol set per architecture slice. This branch is cross-platform. It exists mainly for Go, which never produces a dSYM (`dsymutil` reports "no debug symbols in executable") — but note Go compresses the embedded DWARF by default, which symbolication can't read yet, so build with `-ldflags=-compressdwarf=false`. C/Swift/Rust executables normally carry no embedded DWARF; upload their dSYMs instead.

Pass `--include-source` to bundle the referenced source files for richer context around frames.

The standalone `insights-cli dsym upload` command is unchanged and still recommended for dSYM-only Xcode build phases, where it also reads release and version metadata from each bundle's `Info.plist`.

## Configuring sourcemap upload concurrency

Sourcemap uploads run up to 10 file uploads at a time by default. Set a different positive value with `--concurrency` on `sourcemap upload` or `sourcemap process`:

```bash
insights-cli sourcemap process --directory ./dist --concurrency 32
```

For build integrations such as `@hanzo/nextjs-config`, set `POSTFN_CLI_SOURCEMAP_UPLOAD_CONCURRENCY` in the build environment instead:

```bash
POSTFN_CLI_SOURCEMAP_UPLOAD_CONCURRENCY=32 npm run build
```

The CLI flag takes precedence over the environment variable. Both require a value greater than zero. This setting applies only to plain sourcemap uploads; other CLI concurrency remains unchanged.

## Skipping uploads (dry run)

Pass `--dry-run` before the subcommand (`insights-cli --dry-run hermes upload ...`), or set `POSTFN_CLI_DRY_RUN=true`, to turn the upload commands — `sourcemap`, `dsym`, `hermes`, and `proguard` — into a no-op.
The CLI logs that it skipped the upload and exits `0` without contacting Insights or requiring credentials.
(This top-level flag is separate from the `exp endpoints` `--dry-run`, which previews endpoint changes.)

This is meant for CI gates that still want to run the bundling step (to catch Metro/Hermes or sourcemap regressions) but must not — or cannot — upload artifacts, for example pull-request checks that don't have Insights credentials.
Do not use it for release builds, since no symbols are uploaded.

The env var accepts the usual truthy/falsy values (`true`/`false`, `1`/`0`, `yes`/`no`, `on`/`off`).

### Personal API key scopes

Commands require different API scopes. Make sure to set these scopes on your personal API key:

| Command                       | Required Scopes                            |
| ----------------------------- | ------------------------------------------ |
| `query`                       | `query:read`                               |
| `sourcemap`                   | `error_tracking:write`                     |
| `symbol-sets`                 | `error_tracking:write`                     |
| `dsym`                        | `error_tracking:write`                     |
| `exp endpoints list/get/pull` | `endpoint:read`                            |
| `exp endpoints push`          | `endpoint:write`, `insight_variable:write` |
| `exp endpoints run`           | `query:read`                               |
| `exp tasks`                   | `task:read`                                |

## Agent-first API tools

`insights-cli api` exposes Insights's MCP tool catalog through a shell-friendly interface for coding agents:

```bash
insights-cli api --agent-help
insights-cli api search feature-flag
insights-cli api info feature-flag-get-all
insights-cli api schema query-trends series
insights-cli api call --json feature-flag-get-all '{"limit":5}'
insights-cli api call --dry-run feature-flags-bulk-delete-create '{"ids":[123]}'
insights-cli api skill list
insights-cli api skill install audit
insights-cli api agents-md install
```

Destructive tools require `--confirm` when executed. Use `--dry-run` before mutations.

`insights-cli api --agent-help` prints the full agent-facing guide — the same exec tool reference the Insights MCP server serves, rewritten for CLI invocation — so agents can load it into context before interacting with Insights APIs.

### Agent steering instructions

Install the Insights CLI steering instructions into the agent instructions file for your project:

```bash
insights-cli api agents-md install
```

By default this updates `AGENTS.md` in the current directory. If your agent reads a different instructions file, pass it explicitly:

```bash
insights-cli api agents-md install --path path/to/AGENTS.md
```

The installed instructions come from the shared snippet at [`services/mcp/src/cli/agents-md-snippet.md`](../services/mcp/src/cli/agents-md-snippet.md), so the installer and this README point at the same source of truth.

The snippet is written as a `<insights>...</insights>` block. Rerunning the install replaces the existing block in place, so upgrading the CLI and reinstalling refreshes stale instructions without duplicating them.
