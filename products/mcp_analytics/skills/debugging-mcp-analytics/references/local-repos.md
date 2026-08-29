# Local repo registry

MCP analytics spans this monorepo plus `insights-js` (the TypeScript SDK), `insights-python`
(the Python SDK), `hanzo.ai` (docs), and — for the install flow — `context-mill`, `wizard`,
and `wizard-workbench`. Different maintainers keep their clones in different places, so this
registry records where each maintainer's checkouts live and a repo is found once and reused
instead of re-cloned every session.

GitHub stays the source of truth for _where the code lives_ (see the Repos table in SKILL.md).
The registry is purely a local cache of _where this maintainer cloned it_.

## Repo keys

Keys match the GitHub repo names under the `Insights` org:

| Key                | Why you'd need it                                                                               |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| `insights`         | The monorepo: the product, `services/mcp`, the skills. Usually the checkout you are already in. |
| `insights-js`      | The TypeScript SDK, at `packages/mcp/`. The event-vocabulary source of truth.                   |
| `insights-python`  | The Python SDK, at `insights/mcp/`.                                                             |
| `hanzo.ai`         | Docs under `contents/docs/mcp-analytics/`, plus the product-data and tools entries.             |
| `context-mill`     | The `wizard mcp-analytics` install codemod.                                                     |
| `wizard`           | The wizard CLI that registers the command.                                                      |
| `wizard-workbench` | Local harness and fixtures for exercising the install flow.                                     |

`context-mill`, `wizard`, and `wizard-workbench` are internal repos — expect them to be absent
on a machine that has only ever worked on the public SDKs, and say so rather than guessing a
path.

## Resolving a repo

Follow this order, and write the answer back so later sessions skip the search:

1. **Check the registry.** A JSON map of repo key -> absolute path at
   `~/.config/insights-mcp-analytics/repos.json`. If the repo is listed and the path exists,
   use it.

   ```json
   {
     "insights": "/Users/me/src/insights",
     "insights-js": "/Users/me/src/insights-js",
     "insights-python": "/Users/me/src/insights-python"
   }
   ```

2. **Scan the conventional code roots** — the current checkout's parent directories, and
   `~/src`, `~/code`, `~/dev`, `~/projects`, `~/repos`, `~/work`, `~/git` — for a git checkout
   whose `git remote get-url origin` points at `github.com/Insights/<repo>`. Match on the
   remote, not the directory name: worktrees and topic clones are routinely named things like
   `insights-<topic>`. There is no global git config listing clone locations, so the filesystem
   plus the `origin` remote is the only reliable signal.
3. **Ask, or clone.** If it is still not found, ask the maintainer where it is, or offer to
   `git clone https://github.com/Insights/<repo>` into a default location (`~/src/<repo>`).
4. **Record the resolved path** in the registry.

The `debugging-surveys` skill ships a `scripts/repos.py` implementing this same algorithm
(`init` / `ensure` / `get` / `set` / `list`), and it is worth reading as a reference. **Do not
expect it to work for this skill as-is:** it matches remotes only against its own
surveys-specific `KNOWN_REPOS`, which excludes `insights-python`, `context-mill`, `wizard`, and
`wizard-workbench`, and it reads and writes `~/.config/insights-surveys/repos.json` rather than
the registry described above. So its `init` and `ensure` cannot discover most of what this
skill needs. Either follow the manual steps above, or adapt a copy with this skill's repo list
and registry path.

## Before quoting code from a resolved checkout

- Confirm the branch. A topic branch or a stale worktree is not what the reader means by
  "current", and several of these repos have long-lived unmerged branches. When you need the
  shipped state, read it explicitly from the remote ref — `git show origin/main:<path>` or
  `git show origin/master:<path>` — rather than whatever the working tree happens to be on.
  Trunk is `master` for `insights` and `hanzo.ai`, `main` for the others.
- Never modify a checkout you were only asked to read, and never switch its branch: these are
  working checkouts that frequently hold uncommitted work.
- Grep for symbols rather than trusting remembered line numbers; this area moves fast.
