"""The gate on warehouse table names, and the proof that it can see them.

`bin/tables` is the guard. This is what makes it a guard rather than a script
nobody runs, and what keeps it honest in the one way that matters: a rule that
cannot see the names it forbids is indistinguishable from no rule at all.

The guard this replaces had exactly that failure. It scanned `os.ReadDir(".")`
over one directory of Go files, and every name it was written to stop — nine of
them — lived in Python, in a migration, or only in the database. Its own comment
named `raw_sessions_v3` as the thing it existed to prevent, and it could not see
`raw_sessions_v3`. So the tests below check REACH first and the verdict second.

These are pure: no Django, no warehouse, no services. The warehouse half of the
guard (`bin/tables --live`) needs credentials and belongs to the operator, not to
CI — see `.hanzo/workflows/names.yml`.
"""

import sys
import textwrap
import subprocess
from pathlib import Path

import pytest

TABLES = Path(__file__).resolve().parents[3] / "bin" / "tables"
TREE = TABLES.parent.parent


def run(*args: str, root: Path | None = None) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(TABLES), "--root", str(root or TREE), *args],
        capture_output=True,
        text=True,
    )


def test_the_tree_passes_its_own_gate():
    """The property that keeps this repository deployable.

    insights self-deploys: main builds an image and cd.hanzo.ai rolls it. A name
    rule that fails on a clean checkout does not clean anything up — it stops
    every deploy until someone deletes the rule. So the gate must be GREEN on the
    tree as it stands, with the inherited names carried in the ledger, and go red
    only for a name that is genuinely new.
    """
    r = run("--check")
    assert r.returncode == 0, (
        f"bin/tables --check fails on a clean tree, which would block every deploy:\n{r.stdout}{r.stderr}"
    )


@pytest.mark.parametrize(
    "name,body",
    [
        # Every shape a table name takes in this tree. Each one is a place the
        # previous guard could not look.
        ("a Python constant", 'SESSION_TABLE = "session_v2"'),
        ("literal DDL", 'SQL = """CREATE TABLE IF NOT EXISTS widget_v2 (a UInt64) ENGINE = MergeTree"""'),
        (
            "templated DDL",
            'SQL = "CREATE MATERIALIZED VIEW IF NOT EXISTS {table}_v4_mv TO insights.x AS SELECT 1"',
        ),
        ("a keyword argument", 'X = BASE.format(table_name=f"kafka_{THING}_v9")'),
        (
            "a function that returns a name",
            "def SHARDED_THING_TABLE_V5():\n    return 'sharded_thing_v5'",
        ),
    ],
)
def test_a_new_versioned_name_fails_the_gate(tmp_path, name, body):
    """The half that was missing. A guard nobody can trip is not a guard."""
    pkg = tmp_path / "insights" / "datastore"
    pkg.mkdir(parents=True)
    (pkg / "new.py").write_text(textwrap.dedent(body) + "\n")

    r = run("--check", root=tmp_path)
    assert r.returncode == 1, f"{name} passed the gate:\n{r.stdout}"
    assert "namespace" in r.stdout, "the failure does not say what to do instead"


def test_go_ddl_is_scanned(tmp_path):
    """Table names are also minted in Go, in o11y's DDL.

    The `event.*` namespace is clean today, and this is what keeps a versioned
    name from arriving there unseen — the gate is not Python-only, because the
    warehouse it guards is not written to from Python only.
    """
    (tmp_path / "pkg").mkdir()
    (tmp_path / "pkg" / "schema.go").write_text(
        "const ddl = `CREATE TABLE event.rollup_v7 (a UInt64) ENGINE = MergeTree`\n"
    )
    r = run("--check", root=tmp_path)
    assert r.returncode == 1, f"a versioned name in Go DDL passed:\n{r.stdout}"
    assert "rollup_v7" in r.stdout


def test_a_drop_is_the_remedy_not_the_offence(tmp_path):
    """Retiring a bad name must not be the thing that turns the build red.

    Migration 0201 drops eleven versioned tables and 0230 drops two more. If a
    DROP counted, the only way to stay green would be to never write the cleanup
    down — the gate would protect the rot it exists to remove.
    """
    pkg = tmp_path / "insights" / "datastore" / "migrations"
    pkg.mkdir(parents=True)
    (pkg / "0999_retire.py").write_text(
        "operations = [\n"
        '    "DROP TABLE IF EXISTS kafka_log_entries_v3",\n'
        '    "DROP TABLE IF EXISTS session_replay_events_v2_test",\n'
        '    "RENAME TABLE IF EXISTS query_log_archive_v2 TO retired.query_log_archive",\n'
        "]\n"
    )
    r = run("--check", root=pkg.parents[2])
    # The exit code in an isolated fixture also reflects the ratchet — the ledger
    # names are absent from a tmp tree by construction — so the property under
    # test is the narrower one: retiring a name reports no VIOLATION.
    assert "a version suffix means" not in r.stdout, (
        f"a migration that RETIRES versioned names was read as declaring them:\n{r.stdout}"
    )


def test_the_ledger_is_an_argument_not_a_list():
    """Every held name carries a reason, because the ledger is the escape hatch.

    Adding a row is how someone would defeat this gate. That is deliberate — it
    is one line in one file that a reviewer sees — but it is only reviewable if
    the row says why, so a bare name is rejected here rather than at read time.
    """
    ledger = _ledger()
    assert ledger, "the ledger is empty; the gate has nothing to hold"
    for name, (where, disposition, why) in ledger.items():
        assert where in {"source", "warehouse", "both"}, f"{name}: unknown place {where!r}"
        assert disposition in {"rename", "keep"}, f"{name}: unknown disposition {disposition!r}"
        assert len(why) > 30, f"{name} is held with no reason a reader can act on: {why!r}"


def test_every_ledger_name_is_actually_versioned():
    """The ledger may only hold names the rule would otherwise refuse.

    Without this it becomes a general-purpose allowlist, and the next unrelated
    exemption lands in it because that is where exemptions go.
    """
    import re

    for name in _ledger():
        assert re.search(r"_v[0-9]+(?:_|$)", name), f"{name} is not a versioned name"


def _ledger() -> dict:
    """LEDGER, read out of bin/tables without importing it as a module.

    `bin/tables` has no .py suffix on purpose — it is a command, and commands in
    bin/ are run, not imported.
    """
    ns: dict = {}
    src = TABLES.read_text()
    body = src[src.index("RENAME, KEEP =") : src.index("# --- what counts as a version suffix")]
    exec(body, ns)  # noqa: S102 — our own file, read from disk next to this test
    return ns["LEDGER"]
