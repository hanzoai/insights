# ruff: noqa: T201 allow print statements

"""Route every org's events to the project the app says it owns.

THE TENANT IS THE ORG, and the app already knows which project an org owns:
`Organization.slug` is the same value the event envelope carries as `org`. A
materialized view's SELECT is evaluated inside the warehouse and fixed at
creation, so the answer has to be IN the view — which is what this command puts
there, by dropping and recreating the three projections from the app's own
records. For a view that is a metadata operation: instant, and undone by running
this again.

IT WRITES NO MAPPING, and that is the change. It used to publish rows into
`insights.org_team`, a warehouse table every projection then read `FINAL`. That
table was a SECOND COPY of a fact the app already held, and a second copy of a
fact is a second opinion about it: `admin` and `maxpower` were both mapped to
project 1, so a separate funded org's events landed in Hanzo's own project.
Deriving the copy made it right without making it stop being a copy. There is
now one place the mapping lives at rest — the org records — and the views are
COMPILED from it, so re-deriving replaces the whole artifact and cannot be
partially right the way a row-at-a-time correction can.

Deliberate, not scheduled. An org nobody has routed is simply NOT PROJECTED —
its rows stay on `event.fact`, and no project can read them — which is the safe
way to be wrong, and re-routing is the one operation here with a consequence a
schedule should not choose on its own (see RE-ROUTING below).

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
from insights.models.event.plane import (
    DROP_EVENT_MV_SQL,
    DROP_USER_ALIAS_MV_SQL,
    DROP_USER_MV_SQL,
    EVENT_MV_SQL,
    USER_ALIAS_MV_SQL,
    USER_MV_SQL,
    provisioned,
)

# The three projections, each as (drop, create). They read one source and must
# agree about whose project a row is in, or a project reads events attributed to
# users it cannot see — so they are re-derived together, from one mapping.
PROJECTIONS = (
    (DROP_EVENT_MV_SQL, EVENT_MV_SQL),
    (DROP_USER_MV_SQL, USER_MV_SQL),
    (DROP_USER_ALIAS_MV_SQL, USER_ALIAS_MV_SQL),
)


def stranded(project: int) -> int:
    """How many rows an org already wrote under `project`.

    Reads `events`, the Distributed table the app itself queries — counting the
    local `sharded_events` would report one shard's share and understate it.
    """
    return sync_execute("SELECT count() FROM events WHERE team_id = %(project)s", {"project": project})[0][0]


class Command(BaseCommand):
    help = "Route every org's events to the project the app says it owns"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Print the projections that would be created, without touching the warehouse.",
        )

    def handle(self, *args, **options):
        routing = provisioned()

        if not routing:
            print("No org owns a project yet: the plane routes nothing, and every row stays on event.fact.")
        for org, project in sorted(routing.items()):
            already = stranded(project)
            leaves = f" ({already} row(s) already under it)" if already else ""
            print(f"  {org} -> project {project}{leaves}")

        if options["dry_run"]:
            for _, create in PROJECTIONS:
                print(create(routing))
            return

        for drop, create in PROJECTIONS:
            sync_execute(drop())
            sync_execute(create(routing))
        print(f"\nRe-derived {len(PROJECTIONS)} projection(s) for {len(routing)} routed org(s).")
