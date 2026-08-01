"""Column schemas of the raw GitHub warehouse snapshots the curated views read.

These mirror what the GitHub warehouse source actually lands: scalar columns plus
the nested API objects (``user``, ``head``, ``base``, ``labels``, ``repository``,
``pull_requests``) stored verbatim as JSON strings, and timestamps as strings.

**Every column is ``Nullable`` — the data-imports pipeline lands the whole GitHub
snapshot as nullable, with no exceptions** (verified against the real connected
source). The curated builders therefore parse timestamps with
``parseDateTimeBestEffort`` (NULL-safe) and ``ifNull``-unwrap any Nullable column
before an array function (``JSONExtractArrayRaw`` / ``splitByChar``), because
Datastore rejects an Array nested inside a Nullable.

This file is the single source of truth for the table shape, shared by the seed
command and the warehouse tests. It must stay a faithful replica of prod: the
original idealized shape (non-null scalars, ``DateTime64`` timestamps) passed every
local test while production 500'd on the real nullable table. Keeping it exactly as
nullable as prod is what makes the warehouse tests catch a Nullable-handling
regression locally / in CI instead of only after deploy. If you add a column here,
type it ``Nullable(...)`` unless you have confirmed the pipeline lands it non-null.
"""

PULL_REQUESTS_COLUMNS: dict[str, dict[str, str]] = {
    "id": {"datastore": "Nullable(Int64)", "insightsql": "IntegerDatabaseField"},
    "number": {"datastore": "Nullable(Int64)", "insightsql": "IntegerDatabaseField"},
    "title": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
    "state": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
    "draft": {"datastore": "Nullable(Bool)", "insightsql": "BooleanDatabaseField"},
    "created_at": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
    "updated_at": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
    "merged_at": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
    "closed_at": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
    # The commit the merge produced on the base branch: the key that resolves a default-branch push
    # run back to the PR that landed it. GitHub also populates it on OPEN PRs, where it is a
    # throwaway test-merge SHA, so every read of it must gate on the PR being merged.
    "merge_commit_sha": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
    "user": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
    "head": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
    "base": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
    "labels": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
}

WORKFLOW_RUNS_COLUMNS: dict[str, dict[str, str]] = {
    "id": {"datastore": "Nullable(Int64)", "insightsql": "IntegerDatabaseField"},
    "name": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
    "head_sha": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
    "head_branch": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
    "status": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
    "conclusion": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
    "created_at": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
    "run_started_at": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
    "updated_at": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
    "run_attempt": {"datastore": "Nullable(Int64)", "insightsql": "IntegerDatabaseField"},
    "pull_requests": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
    "repository": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
    # The run's head commit object (author, message, id) verbatim as JSON. Carries the commit
    # attribution the ci_job_history view extracts; a push run's PR number rides its squash-merge
    # message when the pull_requests association is empty (master pushes). Nullable like every column.
    "head_commit": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
}

# Contract for the incoming ``github_workflow_jobs`` warehouse source (job-level CI: queue
# time, per-job duration, runner tier, retries) — the substrate per-PR Depot cost wires to.
# The source must land exactly this shape; ``run_id`` joins back to ``github_workflow_runs``
# for per-PR attribution, ``labels`` carries the runner tier the cost model parses. Same
# Nullable/string discipline as above — timestamps are strings, ``labels``/``steps`` are JSON.
WORKFLOW_JOBS_COLUMNS: dict[str, dict[str, str]] = {
    "id": {"datastore": "Nullable(Int64)", "insightsql": "IntegerDatabaseField"},
    "run_id": {"datastore": "Nullable(Int64)", "insightsql": "IntegerDatabaseField"},
    "run_attempt": {"datastore": "Nullable(Int64)", "insightsql": "IntegerDatabaseField"},
    "name": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
    "workflow_name": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
    "status": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
    "conclusion": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
    "head_sha": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
    "head_branch": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
    "labels": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
    "runner_name": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
    "runner_group_name": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
    "created_at": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
    "started_at": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
    "completed_at": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
    "steps": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
}

# Contract for the ``github_team_members`` warehouse source (org team membership). Member rows
# are GitHub user objects with the parent team's identity injected by the source fan-out
# (``team_id`` / ``team_slug`` / ``team_name``); ``login`` + ``team_slug`` are the join keys the
# membership-based merge timing reads. Same Nullable discipline as above.
TEAM_MEMBERS_COLUMNS: dict[str, dict[str, str]] = {
    "id": {"datastore": "Nullable(Int64)", "insightsql": "IntegerDatabaseField"},
    "login": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
    "team_id": {"datastore": "Nullable(Int64)", "insightsql": "IntegerDatabaseField"},
    "team_slug": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
    "team_name": {"datastore": "Nullable(String)", "insightsql": "StringDatabaseField"},
}
