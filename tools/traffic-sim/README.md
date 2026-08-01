# traffic-sim

Drive a real browser at a URL and verify that Insights instrumentation is firing
correctly. Useful right after `npx @hanzo/wizard`, after a deploy that touches
tracking code, or any time you need an answer to _"is my Insights instrumentation
actually working?"_.

Three scenarios:

- **`new-user`** — each visit uses a fresh browser context (no cookies). Matches
  a stream of unique visitors.
- **`returning-user`** — all page views share the same context. Matches one
  visitor browsing several pages in a session.
- **`check-loading`** — inspects the Insights snippet across multiple URLs:
  load method, init config, runtime state. Catches pages where the snippet is
  missing or pointing at the wrong project.

The same three operations are exposed as MCP tools (see [Use from Claude Code](#use-from-claude-code))
and as Claude Code skills (see [`skills/`](./skills/)).

## Install

The tool runs from the Insights monorepo and shares its Python environment.
First time:

```sh
uv sync
uv run playwright install chromium
```

For `--cloud` (BrowserStack) runs, install the optional extras:

```sh
uv pip install browserstack-sdk pyyaml
```

…and either set `BROWSERSTACK_USERNAME` / `BROWSERSTACK_ACCESS_KEY` in your
shell, or copy `browserstack.yml.example` to `browserstack.yml`.

## Use from the CLI

```sh
# Confirm the snippet loads on every URL you care about
uv run python tools/traffic-sim/cli.py check-loading \
  --url https://example.com/ \
  --url https://example.com/pricing \
  --url https://example.com/blog

# Send 3 fresh-browser visits, 5s apart
uv run python tools/traffic-sim/cli.py new-user \
  --url https://example.com/ --visits 3 --interval 5

# Send 5 page views from a single returning user
uv run python tools/traffic-sim/cli.py returning-user \
  --url https://example.com/ --page-views 5 --interval 5
```

Or via the Makefile (from inside `tools/traffic-sim/`):

```sh
make check-loading URL=https://example.com/
make new-user URL=https://example.com/ VISITS=3 INTERVAL=5
make returning-user URL=https://example.com/ PAGE_VIEWS=5 INTERVAL=5
```

### Common options

- `--insights-host https://eu.i.hanzo.ai` — for the EU cloud.
- `--insights-host https://ph.example.com` — for self-hosted reverse proxies.
- `--urls-file urls.json` — load a list of URLs from a JSON file
  (flat list or `{base_url, categories}` shape; see [`urls.example.json`](./urls.example.json)).
- `--headed` — show the browser window. Useful for live-debugging.
- `--verbose` — print every Insights request and console line.
- `--cloud` — run on BrowserStack instead of locally (requires the cloud extras).

## Use from Claude Code

The MCP server is registered in the monorepo's `.mcp.json` and exposes three
tools:

| Tool                      | Purpose                                                            |
| ------------------------- | ------------------------------------------------------------------ |
| `simulate_new_user`       | Send N fresh-browser visits and report which Insights events fired. |
| `simulate_returning_user` | Send N page views in one session and report events.                |
| `check_insights_loading`   | Inspect how Insights is loaded across one or more URLs.             |

Each tool returns a structured summary including `verified: true|false`,
event counts, and any errors. See [`skills/`](./skills/) for orchestration
patterns including the headline `verify-insights-instrumentation` skill.

## Output

Run reports are saved as JSON under `results/` in this directory. The
filename embeds the scenario, run id, and timestamp, e.g.
`results/check-loading_a1b2c3d4_20260428_143000.json`.

## What this tool does NOT do

- Send your own events to Insights. The tool _observes_ what the customer's
  Insights snippet emits — it does not inject any test traffic into your
  Insights project beyond what your site naturally fires.
- Validate session recordings. We report whether session recording is
  enabled in the init config, but we don't watch the recording itself.
- Drive custom user flows (e.g. signup). Add per-flow scripts on top.

## Layout

```text
tools/traffic-sim/
├── cli.py                  Three subcommands: new-user, returning-user, check-loading.
├── mcp_server.py           FastMCP server exposing the same operations as MCP tools.
├── console-snippet.js      Paste-into-DevTools helper for one-off manual inspection.
├── browserstack.yml.example Template for --cloud credentials.
├── urls.example.json       Example URL list for --urls-file.
├── skills/                 Claude Code skills wrapping the MCP tools.
└── tests/                  Unit tests + a Playwright integration smoke test.
```
