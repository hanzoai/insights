# ruff: noqa: T201 allow print statements

"""Publish which project each org's events land in.

THE TENANT IS THE ORG, and the app already knows which project an org owns:
`Organization.slug` is the same value the event envelope carries as `org`. The
warehouse cannot read that record — a materialized view's SELECT is evaluated
inside the warehouse, so `event_mv` needs the answer in a table it can join —
so this command copies it there, and is the ONLY writer of that table.

That is the whole point. The mapping was previously written by hand, which made
it a second source of truth that could disagree with the first, and it did:
`admin` and `maxpower` were both routed to project 1, so a separate funded org's
events landed in Hanzo's own project. A derived mapping cannot be wrong about
who owns what, because it is not an opinion.

Deliberate, not scheduled. An org nobody has routed is UNATTRIBUTED — its events
are kept, and no project can read them — which is the safe way to be wrong, and
re-routing is the one operation here with a consequence a schedule should not
choose on its own (see RE-ROUTING below).

RE-ROUTING LEAVES HISTORY BEHIND. `sharded_events` is ordered by
`(team_id, toDate(timestamp), event, cityHash64(distinct_id), cityHash64(uuid))`
and collapses on that key, so re-projecting an event under a corrected project
does NOT replace the row it corrects — it writes a second copy and double-counts.
Routing therefore only ever decides where events land FROM NOW ON; rows already
written keep the project they were captured under. Moving them means deleting
the old copies, which is a separate and deliberate operation. This command
reports how many rows an org leaves behind so that decision is made with the
number in hand.
"""

from django.core.management.base import BaseCommand

from insights.datastore.client import sync_execute
from insights.models.event.plane import ORG_PROJECT_ROWS_SQL, ORG_PROJECT_SQL, UNATTRIBUTED_PROJECT
from insights.models.organization import Organization

# An org owns one project on the plane, because the envelope names an org and
# not a project. The fork already answers "which one" the same way everywhere a
# user lands somewhere by default — `organization.teams.order_by("id").first()`,
# `insights/models/user.py` — so this reads the org's FIRST project rather than
# inventing a second rule for the same question.
FIRST_PROJECT = "id"


def routing() -> dict[str, int]:
    """Which project each org's events belong in, per the app's own records."""
    return {
        org.slug: project.id
        for org in Organization.objects.prefetch_related("teams")
        if (project := org.teams.order_by(FIRST_PROJECT).first()) is not None
    }


def published() -> dict[str, int]:
    """What the warehouse currently routes — the live row per org."""
    return dict(sync_execute(ORG_PROJECT_SQL))


def changes(live: dict[str, int], intended: dict[str, int]) -> dict[str, int]:
    """The rows worth writing: every org whose project is not already correct.

    An org the warehouse routes but the app no longer resolves is routed to
    UNATTRIBUTED rather than dropped. Leaving its row alone would keep sending a
    deleted org's events into a project that no longer belongs to it, and
    deleting the row is not available — the table keeps the NEWEST row per org,
    so the way to say "no longer routed" is to write it.
    """
    unresolved = {org: UNATTRIBUTED_PROJECT for org in live if org not in intended}
    return {org: project for org, project in {**intended, **unresolved}.items() if live.get(org) != project}


class Command(BaseCommand):
    help = "Route every org's events to the project the app says it owns"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report what would change without writing it.",
        )

    def handle(self, *args, **options):
        live = published()
        pending = changes(live, routing())

        if not pending:
            print(f"Routing is current: {len(live)} org(s), nothing to publish.")
            return

        for org, project in sorted(pending.items()):
            was = live.get(org)
            print(f"  {org}: {'unrouted' if was is None else was} -> {project}")
            if was is not None and was != UNATTRIBUTED_PROJECT:
                # `events`, the Distributed read table the app itself queries —
                # counting the local `sharded_events` would report one shard's
                # share of what an org leaves behind and understate the answer.
                stranded = sync_execute(
                    "SELECT count() FROM events WHERE team_id = %(project)s",
                    {"project": was},
                )[0][0]
                if stranded:
                    print(
                        f"    {stranded} row(s) stay under project {was}: routing decides where"
                        " events land from now on, never where they already landed."
                    )

        if options["dry_run"]:
            print(f"\nDry run: {len(pending)} org(s) would be routed.")
            return

        sync_execute(ORG_PROJECT_ROWS_SQL(sorted(pending.items())))
        print(f"\nRouted {len(pending)} org(s).")
