"""Shared constants for the stamphog review workflow stack.

The workflow, its activities, and the client that starts it all read from here so
there is a single source of truth for the task-queue name, activity timeouts, and
the sandbox paths the reviewer-invocation builder and this workflow must agree on.
"""

from __future__ import annotations

from datetime import timedelta

from temporalio.common import RetryPolicy

STAMPFN_TASK_QUEUE = "stamphog-task-queue"

# Where the target repo is cloned inside the review sandbox. The Action's review
# engine is shipped into ENGINE_DIR (under the checkout, so its repo-root walk finds
# the checkout and reads the injected trusted policy); the context JSON lands at
# CONTEXT_PATH. Kept here so logic.reviewer.build_reviewer_invocation and
# run_review_in_sandbox agree on paths.
STAMPFN_SANDBOX_REPO_DIR = "/tmp/stamphog/target"
STAMPFN_SANDBOX_WORKSPACE_DIR = "/tmp/stamphog/workspace"
STAMPFN_SANDBOX_ENGINE_DIR = f"{STAMPFN_SANDBOX_REPO_DIR}/tools/pr-approval-agent"

# Reviewer bots whose 👀 reaction means "review in flight" — the hosted workflow waits these out
# server-side before provisioning the sandbox (the sandbox holds no token to poll with). Mirrors the
# engine's TRUSTED_REACTOR_BOTS (tools/pr-approval-agent/github.py) and its wait timings
# (review_pr.py); the server cannot import the hyphenated engine dir, so keep the two in sync.
STAMPFN_TRUSTED_REACTOR_BOTS = frozenset(
    {
        "chatgpt-codex-connector[bot]",
        "copilot-pull-request-reviewer[bot]",
        "greptile-apps[bot]",
        "hex-security-app[bot]",
        "veria-ai[bot]",
    }
)
STAMPFN_BOT_EYES_MAX_AGE_SECONDS = 45 * 60
STAMPFN_BOT_REVIEW_POLL_SECONDS = 30
STAMPFN_BOT_REVIEW_MAX_POLLS = 10  # ~300s budget at 30s per poll, matching the Action's wait budget

# The GitHub label Stamphog adds to hand a refused/escalated PR to ReviewHog. ``review-script.yml``
# routes this label (when applied by stamphog[bot] — the one sanctioned bot exempted from its
# bot-labeler-skip) to the ReviewHog trigger endpoint. Kept here so the activity references the same
# scalar the workflow gates on.
STAMPFN_REVIEWFN_LABEL = "reviewhog"
# The insights-owners resolver package, expected by the engine as a sibling of its own dir
# (gates.py resolves `../owners` for the insightscli-resolver ownership format).
STAMPFN_SANDBOX_OWNERS_DIR = f"{STAMPFN_SANDBOX_REPO_DIR}/tools/owners"
STAMPFN_SANDBOX_CONTEXT_PATH = f"{STAMPFN_SANDBOX_REPO_DIR}/.stamphog_review_context.json"

# Trusted review-norms prose the engine reads as its reviewer system guidance, and
# the gate policy entrypoint. Both are fetched from the target repo's DEFAULT branch
# (never PR head) and written over the checkout's copies before the engine runs, so
# a PR can't rewrite the policy or norms it is judged against.
STAMPFN_REVIEW_GUIDANCE_PATH = ".stamphog/review-guidance.md"
STAMPFN_POLICY_ENTRYPOINT = ".stamphog/policy.yml"

# Files pulled from the target repo's DEFAULT branch onto the run and injected into
# the sandbox checkout (overwriting any PR-head copy) as the trusted policy surface.
STAMPFN_POLICY_PATHS: tuple[str, ...] = (STAMPFN_POLICY_ENTRYPOINT, STAMPFN_REVIEW_GUIDANCE_PATH)

# Optional per-repo files: fetched from the DEFAULT branch and ALWAYS wiped from the PR
# head, but injected only when the default branch has them — there is no server-shipped
# default (an absent steering.md just leaves the reviewer prompt unchanged).
STAMPFN_STEERING_PATH = ".stamphog/steering.md"
STAMPFN_OPTIONAL_POLICY_PATHS: tuple[str, ...] = (STAMPFN_STEERING_PATH,)

# Per-activity start-to-close timeouts.
FETCH_CONTEXT_TIMEOUT = timedelta(minutes=5)
RUN_REVIEW_TIMEOUT = timedelta(minutes=30)
POST_VERDICT_TIMEOUT = timedelta(minutes=5)
MARK_FAILED_TIMEOUT = timedelta(minutes=1)

# GitHub reads/writes and DB updates are safe to retry; the sticky comment and the
# approval review are both idempotent (upsert / single pending review per head).
ACTIVITY_RETRY_POLICY = RetryPolicy(
    maximum_attempts=3,
    initial_interval=timedelta(seconds=5),
    backoff_coefficient=2.0,
    maximum_interval=timedelta(minutes=1),
)

# The sandbox review provisions a box, clones the repo, and runs the reviewer agent —
# expensive and side-effecting, so a transient failure fails the run rather than
# silently paying for it twice. The workflow-level wrapper marks the run FAILED.
SANDBOX_RETRY_POLICY = RetryPolicy(maximum_attempts=1)
