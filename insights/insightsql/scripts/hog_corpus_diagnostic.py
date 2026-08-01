# ruff: noqa: T201, E402
"""Script-program corpus parser-parity diagnostic.

Pulls real Script program source from the `insights_hogfunction` table on
Aurora Postgres (the `script` column — destinations, transformations and
other CDP functions), runs both the oracle and candidate parsers over
each, and reports where they disagree.

Sibling of `log_corpus_diagnostic.py`: that runs over real InsightsQL
*queries* from Datastore `system.query_log`; this runs over real Script
*programs* (the `program` grammar rule — let / if / while / for / fn /
try-catch / return / blocks) from Postgres. Both are real-usage
complements to `pbt_diagnostic.py`'s grammar-generated surface, and the
shared machinery lives in `_diagnostic_common.py`.

## Pipeline

1. **Auto-discover the Aurora Postgres database id** via
   `insightscli metabase:databases` (engine `postgres`, name containing
   `aurora`).
2. **Download a redacted dump** via `insightscli metabase:query` to the
   gitignored `insights/insightsql/scripts/.local/hog_corpus.json`. The
   embedded SQL applies the same `regexp_replace` redaction chain the
   InsightsQL corpus uses (emails, UUIDs, IPv4/6, tokens, hex catch-all),
   server-side, so raw source never reaches the dump.
3. **Skip the download** with `--skip-download` to reuse an existing
   dump when iterating on a candidate parser locally.
4. **For each unique program**: parse with `--oracle` (default
   `cpp-json`); oracle reject → skipped. Otherwise parse with
   `--candidate` — reject, crash, AST mismatch, or pass. ASTs are
   compared with per-node `start` / `end` positions by default
   (`CLEAR_LOCATIONS=1` strips them for structural-only comparison).

Only Script functions belonging to organisations that have opted into AI
data processing (`insights_organization.is_ai_data_processing_approved`)
are sampled — the Postgres equivalent of the InsightsQL corpus's
`log_comment.ai_data_processing_approved` gate.

## Usage

    # Default — auto-discover, download, run cpp-vs-rust parity:
    PYTHONPATH=. python insights/insightsql/scripts/hog_corpus_diagnostic.py

    # Iterate on a candidate parser without re-pulling the corpus:
    PYTHONPATH=. python insights/insightsql/scripts/hog_corpus_diagnostic.py \\
        --skip-download \\
        --candidate rust-allstar-json \\
        --write-failures /tmp/script-fails.script
"""

from __future__ import annotations

import os
import sys
import argparse
import traceback
import subprocess
from pathlib import Path

# Skip django.setup(): parser core only reads settings.TEST, so settings alone avoids ready()-hook DB/redis init.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "insights.settings")

from insights.insightsql.scripts._diagnostic_common import (
    _probe_backend,
    discover_metabase_db,
    download_corpus,
    load_corpus_rows,
    print_corpus_summary,
    repo_relative,
    run_corpus_parity,
    shrink_failures,
    write_failures,
)

REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_DUMP = REPO_ROOT / "insights" / "insightsql" / "scripts" / ".local" / "hog_corpus.json"

# Script functions are heavily template-instantiated, so unique `script`
# sources number only a few thousand — well under any page ceiling.
_DEFAULT_SQL_LIMIT = 10000


# ---------------------------------------------------------------------------
# Embedded SQL — keep the source of the corpus reproducible from the script
# ---------------------------------------------------------------------------

# Redaction passes over the Script source, applied in list order (each wraps
# the previous). Mirrors `log_corpus_diagnostic._REDACTION_PASSES` but in
# Postgres regex dialect — `\y` is the word boundary (Postgres has no
# `\b`); `\d`, char classes and the `\1` replacement backreference carry
# over unchanged.
_REDACTION_PASSES: list[tuple[str, str]] = [
    (r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", "<email>"),
    (
        r"[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}",
        "<uuid>",
    ),
    (r"\yph[a-z]_[A-Za-z0-9]{10,}", "<ph_token>"),
    (r"\yeyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]+", "<jwt>"),
    (r"\y[sprk]k_(live|test)_[A-Za-z0-9]{10,}", "<stripe_key>"),
    (r"\y(AKIA|ASIA)[A-Z0-9]{16}\y", "<aws_key>"),
    (r"\ygh[posru]_[A-Za-z0-9]{30,}", "<gh_token>"),
    (r"\ygithub_pat_[A-Za-z0-9_]{20,}", "<gh_token>"),
    (r"\yxox[bpoars]-[A-Za-z0-9-]{10,}", "<slack_token>"),
    (r"([0-9a-fA-F]{1,4}:){3,7}[0-9a-fA-F]{1,4}", "<ipv6>"),
    (r"(^|[^.0-9])(\d{1,3}\.){3}\d{1,3}\y", r"\1<ipv4>"),
    (r"\y[a-fA-F0-9]{32,}\y", "<hex>"),
]


def _sql_str_literal(s: str) -> str:
    """Escape a string for a Postgres single-quoted literal."""
    return s.replace("\\", "\\\\").replace("'", "''")


def _build_redaction_expr() -> str:
    """Nest `_REDACTION_PASSES` into one `regexp_replace(…, 'g')` chain
    over the `script` column."""
    expr = "hf.script"
    for pattern, replacement in _REDACTION_PASSES:
        expr = f"regexp_replace({expr}, '{_sql_str_literal(pattern)}', '{_sql_str_literal(replacement)}', 'g')"
    return expr


def _build_corpus_sql(limit: int, offset: int = 0) -> str:
    """Build the corpus query. `limit`/`offset` page the scan; the
    `ORDER BY` carries `script` as a tiebreaker so pagination is a stable
    total order. Only non-deleted functions from AI-data-processing
    consenting organisations are sampled."""
    return f"""
SELECT
    {_build_redaction_expr()} AS script,
    count(*) AS n_occurrences
FROM insights_hogfunction hf
JOIN insights_team t          ON t.id = hf.team_id
JOIN insights_organization o  ON o.id = t.organization_id
WHERE hf.deleted = false
  AND o.is_ai_data_processing_approved
  AND length(hf.script) > 0
GROUP BY script
ORDER BY n_occurrences DESC, script
LIMIT {int(limit)} OFFSET {int(offset)}
"""


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--region", choices=("us", "eu", "dev"), default="us", help="Metabase region (default: us)")
    p.add_argument(
        "--database-id",
        type=int,
        default=None,
        help="Aurora Postgres Metabase DB id. Default: auto-discover (engine postgres, name ~ 'aurora').",
    )
    p.add_argument(
        "--input",
        type=Path,
        default=DEFAULT_DUMP,
        help=f"Path to the redacted JSON dump (default: {repo_relative(DEFAULT_DUMP, REPO_ROOT)})",
    )
    p.add_argument(
        "--skip-download",
        action="store_true",
        help="Reuse the existing JSON dump at --input rather than re-running the Metabase query",
    )
    p.add_argument(
        "--oracle",
        default=os.environ.get("ORACLE_BACKEND", "cpp-json"),
        help="Source-of-truth backend (default: cpp-json)",
    )
    p.add_argument(
        "--candidate",
        default=os.environ.get("CANDIDATE_BACKEND", "rust-json"),
        help="Backend under test (default: rust-json; override for forks)",
    )
    p.add_argument(
        "--write-failures",
        metavar="PATH",
        default=None,
        help="Output file for failing programs (default: <dump>.failures.script alongside the dump)",
    )
    p.add_argument(
        "--shrink-failures",
        action="store_true",
        help=(
            "Reduce each failing program to a minimal repro via shrinkray before "
            "writing it out. Needs the optional `insightsql-parser-parity` group "
            "(`uv sync --group insightsql-parser-parity`)."
        ),
    )
    p.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Cap to first N unique programs (also caps the SQL scan for a fast Metabase round-trip).",
    )
    p.add_argument("--verbose", action="store_true", help="Print one line per AST mismatch")
    args = p.parse_args()
    if args.limit is not None and args.limit <= 0:
        p.error("--limit must be a positive integer")

    # Fail fast on a bad backend name (the `program` rule, since that's
    # what Script source parses as).
    for label, backend in (("oracle", args.oracle), ("candidate", args.candidate)):
        err = _probe_backend("program", backend)
        if err is not None:
            print(f"ERROR: {label} backend {backend!r} unavailable: {err}")
            return 1
    if args.oracle == args.candidate:
        print(
            f"WARNING: --oracle and --candidate are both {args.oracle!r} — "
            f"this is not a parity check; every program will trivially 'pass'."
        )

    print(f"=== Script-program corpus diagnostic: oracle={args.oracle} candidate={args.candidate} ===")
    print()

    # 1. Acquire the dump.
    if args.skip_download:
        if not args.input.exists():
            print(f"ERROR: --skip-download but no dump at {args.input}")
            return 1
        print(f"Reusing existing dump: {args.input}")
    else:
        print(f"Region: {args.region}")
        if args.database_id is None:
            print("Auto-discovering Aurora Postgres DB id …")
            try:
                args.database_id = discover_metabase_db(
                    args.region, "postgres", REPO_ROOT, prefer_name_substring="aurora"
                )
            except subprocess.CalledProcessError as e:
                print(f"ERROR: `insightscli metabase:databases` failed (exit {e.returncode})")
                print(f"  hint: run `./bin/insightscli metabase:login --region {args.region}` first")
                return 1
            except subprocess.TimeoutExpired:
                print("ERROR: `insightscli metabase:databases` timed out after 60s")
                return 1
        else:
            print(f"Using --database-id {args.database_id}")
        sql_limit = args.limit if args.limit and args.limit < _DEFAULT_SQL_LIMIT else _DEFAULT_SQL_LIMIT
        try:
            download_corpus(args.region, args.database_id, args.input, sql_limit, _build_corpus_sql, REPO_ROOT)
        except subprocess.CalledProcessError as e:
            print(f"ERROR: `insightscli metabase:query` failed (exit {e.returncode})")
            return 1
        except subprocess.TimeoutExpired:
            print("ERROR: `insightscli metabase:query` timed out — narrow with --limit, or retry")
            return 1

    # 2. Load.
    rows = load_corpus_rows(args.input, text_col="script", count_col="n_occurrences")
    print(f"Loaded {len(rows)} unique programs from {repo_relative(args.input, REPO_ROOT)}")
    if args.limit is not None and args.limit < len(rows):
        rows = rows[: args.limit]
        print(f"  (capped to first {args.limit} via --limit)")

    # 3. Parity grind.
    print()
    print("Running parity check (oracle then candidate per program)…")
    print()
    result = run_corpus_parity(
        rows,
        rule="program",
        oracle=args.oracle,
        candidate=args.candidate,
        verbose=args.verbose,
        noun="program",
    )
    print_corpus_summary(result, oracle=args.oracle, candidate=args.candidate)

    # 4. Failure dump.
    failures = result.failures
    if failures and args.shrink_failures:
        print()
        print(f"Shrinking {len(failures)} failing programs via shrinkray…")
        failures = shrink_failures(failures, rule="program", oracle=args.oracle, candidate=args.candidate)
    if failures:
        out_path = Path(args.write_failures) if args.write_failures else args.input.with_suffix(".failures.script")
        write_failures(out_path, failures, REPO_ROOT, title="hog_corpus_failures")
        print()
        print(f"Wrote {len(failures)} failing programs to {repo_relative(out_path, REPO_ROOT)}")

    return 130 if result.interrupted else 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("\nInterrupted.", file=sys.stderr)
        sys.exit(130)
    except Exception:
        traceback.print_exc()
        sys.exit(1)
