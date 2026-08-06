---
name: setting-up-devbox
description: Guide a Insights engineer through spinning up, connecting to, running commands on, and mirroring local code to a remote devbox (a Coder workspace running the full Insights stack). Use when asked to set up a devbox, start or connect to a devbox, configure remote dev, get gh CLI / Claude Code authed on a devbox, run a command on a devbox, sync a local checkout so you can edit locally while the stack runs remotely (devbox:sync), or diagnose why a devbox command fails. Covers the tailnet prerequisite, insightscli devbox commands, Coder user secrets for auth, one-way local->remote sync via mutagen, and verifying with devbox:exec. How each dev personalizes their box is left to them.
---

# Setting up a Insights devbox

A devbox is a Coder workspace running the full Insights stack on an EC2 instance, managed through `insightscli devbox:*` (the only supported interface — drive those commands, don't reimplement them). It ships ready to use: the repo cloned at `~/insights`, the stack pre-warmed, and Claude Code installed. This skill gets a dev connected and working; how they personalize beyond that is their choice, not something to push.

## Prerequisite: tailnet access (the thing people miss)

The devbox control plane lives inside a private VPC reachable only over Tailscale. The ACL that grants the route is [`tailnet-policy.hujson`](https://github.com/Insights/insights-cloud-infra/blob/main/tailnet-policy.hujson) in `insights-cloud-infra`: your email must be in **`group:engineering`**. Without that grant, the Coder control plane (`10.70.0.1:443`) is simply unroutable and _every_ `insightscli devbox:*` command dies at the reachability check — not an auth or install problem, and no amount of re-running `devbox:setup` fixes it.

If `insightscli devbox:doctor` reports the control plane unreachable, the fix is a PR adding the user to `group:engineering` in `tailnet-policy.hujson` (then ask Team DevEx if still blocked). Diagnose this before touching anything else.

### Control plane unreachable with a DNS cause? Check the exit node first

When doctor shows `[ok] Tailscale connected` but fails reachability with a **DNS** cause (`DNS lookup for coder.dev.insights.dev failed`), that's usually not the grant: the client's split-DNS routes don't cover `dev.insights.dev`, so the name never reaches the internal resolver.
The fix is selecting a Tailscale **exit node** — it routes DNS through infra that resolves `*.dev.insights.dev`.
Check available exit nodes and select one via the Tailscale menu bar app (Exit Node) or CLI:

```bash
tailscale exit-node list                            # list available exit nodes
tailscale set --exit-node=<name>                    # enable one (use the Name from the list)
# on macOS when `tailscale` isn't on PATH:
/Applications/Tailscale.app/Contents/MacOS/Tailscale exit-node list
/Applications/Tailscale.app/Contents/MacOS/Tailscale set --exit-node=<name>
```

Do not suggest `/etc/hosts` or `/etc/resolver` workarounds — they hardcode internal ELB IPs that rotate, and the exit node is the supported path.
To confirm it's resolution rather than the grant: `dig coder.dev.insights.dev @10.90.0.2` answering while the system resolver fails proves the name exists and only the resolution path is missing.

## Workflow

### 1. Check state — `insightscli devbox:doctor`

```bash
insightscli devbox:doctor          # read-only: tailnet access, reachability, auth, ssh config, saved setup
```

A safe probe — it never prompts or mutates host config (unlike `devbox:setup`). If it flags the control plane unreachable, resolve the tailnet grant before anything else. For more detail: `insightscli devbox:list` (your boxes), `insightscli devbox:status` (state, template freshness), `insightscli devbox:secret:list` (secret names only).

### 2. One-time local setup — `insightscli devbox:setup`

Interactive: checks Tailscale + Coder reachability, installs and authenticates the `coder` CLI (plus the pinned mutagen binary that backs `devbox:sync`), and writes the SSH host entries that `devbox:ssh`/`devbox:exec` rely on. It then _offers_ git identity, git signing, a dotfiles repo, and your Claude token — all optional; `--skip-*` anything you don't want. Re-run one step with its flag, e.g. `insightscli devbox:setup --configure-git-signing`.

### 3. Start and connect — `insightscli devbox:start`

```bash
insightscli devbox:start           # create or resume your box
insightscli devbox:ssh             # shell in
insightscli devbox:open --vscode   # or --cursor / --web
insightscli devbox:stop            # when done — preserves disk, stops billing
```

### 4. Auth, if you want it (optional)

To have `gh` or Claude Code authenticated on the box, store the token once as a Coder user secret. It's injected as an env var into every box you start, so you set it once rather than per box:

```bash
insightscli devbox:secret:set GH_TOKEN --env GH_TOKEN
insightscli devbox:secret:set CLAUDE_CODE_OAUTH_TOKEN --env CLAUDE_CODE_OAUTH_TOKEN
# also supported: ANTHROPIC_API_KEY, OPENAI_API_KEY, OP_SERVICE_ACCOUNT_TOKEN, AWS_CREDENTIALS (--file)
```

Authing `gh` / Claude on a devbox is fine — that's what these are for. Set the value from `--file` or the hidden prompt; never paste a token into a command line or into this conversation. Restart a running box to pick up a newly set secret.

### 5. Make it yours — your call

The box is usable as shipped; personalize it however suits you, or not at all. Two supported paths, neither required, don't push one over the other:

- **Tweak the box directly** — `devbox:ssh` in and install tools, add aliases, clone repos. Changes under `/home` survive stop/start and template updates, but a `devbox:destroy` (or a brand-new box) starts fresh.
- **A dotfiles repo** — if you'd rather keep portable, version-controlled config that re-applies to every box: `insightscli devbox:setup --configure-dotfiles` points the box at your `dotfiles_uri`, and Coder clones it (running an executable `~/dotfiles/install.sh` if present) on each start.

### 6. Run commands on the box — `insightscli devbox:exec`

`devbox:exec` runs one command over SSH and propagates its exit code — handy for scripts, agents, and quick checks without opening a shell:

```bash
insightscli devbox:exec -- bash -lc 'gh auth status'
insightscli devbox:exec -- bash -lc 'cd ~/insights && git status'
insightscli devbox:exec -n api -- bash -lc 'uname -a'    # -n targets a labeled box
```

Wrap commands in `bash -lc '...'`: a non-login shell doesn't reliably source `~/.bashrc`/`~/.zshrc`, so a bare `gh auth status` can report "command not found" for anything on a login-shell `PATH` (e.g. `~/.local/bin`) — a false negative. The login shell also keeps the exit code trustworthy, so `&&` chaining and `if` checks work. Use `--` to separate insightscli's flags from the command's own.

`devbox:exec` is not side-effect-free: like every `devbox:*` command it runs the reachability check first, which on Linux may `sudo tailscale set --accept-routes` and prompt for a password. Run `insightscli devbox:setup` once interactively so routes and SSH config are in place before an agent drives `devbox:exec` unattended.

## Editing locally, running on the box — `insightscli devbox:sync`

When you want your fast local checkout to stay the place you edit but the heavy stack (`insightscli up`) to run on the box, `insightscli devbox:sync` mirrors your repo onto the box over [mutagen](https://mutagen.io), one-way: local is the source of truth, nothing comes back. Reach for this in an agentic loop — edit with your normal local tools, let the mirror carry each change, and drive the remote stack with `devbox:exec` — instead of committing and pushing every iteration or editing over Remote-SSH.

```bash
insightscli devbox:start                                   # the box must be running first
insightscli devbox:sync                                    # create the mirror (idempotent: re-run just reports status)
# edit files locally — changes propagate within seconds
insightscli devbox:exec -- bash -lc 'cd ~/insights && pnpm --filter=@hanzo/frontend typescript:check'
insightscli devbox:sync --status                           # watching / paused / conflicts
insightscli devbox:sync --terminate                        # tear the mirror down when done
```

The non-obvious parts:

- **It runs on your machine and pushes to the box — not the reverse.** Don't invoke it through `devbox:exec`. It mirrors whichever checkout you run it from (it walks up from the cwd for `insightscli.yaml` + `.git`), so run it from the repo root you are editing — including a `/wt` worktree.
- **`one-way-safe` preserves remote-only files.** The AMI's prewarmed `node_modules`, venv, and `target/` are never deleted — they aren't in your local checkout and the mode leaves remote-only content alone. Lockfiles _do_ sync, so the box reconciles deps on its next start.
- **The first sync of a feature branch conflicts per diverged file.** The AMI is always on `master`; every file your branch changed relative to the box's `master` surfaces as a conflict in `--status`. That is expected one-way-safe behavior, and it is per-path — non-conflicting files (including brand-new ones) still sync. Resolve a path, or check the matching branch out on the box, only if you specifically need that file mirrored.
- **Don't also edit those files on the box.** Editing over Remote-SSH while the mirror is live fights the local source of truth; `devbox:open --vscode|--cursor` warns when a sync is active for exactly this reason.

The packaged ignore defaults are seeded once to `~/.insightscli/mutagen.yml` and never overwritten — it is yours to tweak. If a newer insightscli ships updated ignore defaults, `rm ~/.insightscli/mutagen.yml` and re-run `devbox:setup` to pick them up.

## Persistence & multiple boxes

- `devbox:stop` → `devbox:start` and template/AMI updates preserve `/home` (the instance is stopped, not terminated). A `devbox:destroy` wipes it — intentional, so don't keep anything irreplaceable only inside a box.
- You can run more than one box. Box-local changes don't carry between them; user secrets do (user-scoped), and a dotfiles repo does if you use one. That's the practical reason to reach for those if you find yourself re-doing setup — but it's a choice, not a requirement.

## Gotchas

- **Never echo secret values** into the transcript, logs, a PR, or a command line. `devbox:secret:set` reads from a hidden prompt or `--file`; `secret:list` shows names only. Keep it that way.
- **Secrets need a restart.** A new or changed secret only reaches boxes started afterward — `insightscli devbox:restart` to pick it up on a running box.
- **`devbox:exec`/`devbox:ssh` need `devbox:setup` to have run** (it writes the `coder.*` SSH host config). Without it they fail at connection; `devbox:doctor` shows whether SSH access is configured.
- **`code-server` (browser IDE) has no SSH agent forwarding**, so commit signing via a forwarded key won't work there — use VS Code Desktop / Cursor / JetBrains (SSH-based) when you need to sign.
