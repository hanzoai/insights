"""
Derive the event and property taxonomy from the warehouse.

Upstream populated `insights_eventdefinition` and `insights_propertydefinition`
as a side effect of ingestion. Analytics ingest is native now and writes events
straight to the warehouse, so nothing has written these tables since -- live
`/api/projects/1/events/` returns rows while `/api/projects/1/event_definitions/`
returns count 0. That empties Data Management, and with it the taxonomy behind
every autocomplete, property picker and filter used to build an insight.

So derive them instead of writing them at ingest. The warehouse already holds
what was actually sent, which makes it the honest source: a definition table
written at ingest drifts the moment a backfill, a retention drop or a rename
lands, while a derived one converges on the next pass. It also keeps the
ingestion path free of a Postgres write per event.

Names only, plus the numbers the UI shows. Inferring a property's TYPE is a
separate problem -- a key's values are not homogeneous across events -- and
guessing it wrong is worse than leaving it unset, which the model allows.
"""

from datetime import timedelta

from django.utils import timezone

import structlog
from celery import shared_task

from insights.datastore.client import sync_execute
from insights.datastore.client.connection import Workload
from insights.models import Team
from insights.models.event_definition import EventDefinition
from products.event_definitions.backend.models.property_definition import PropertyDefinition

logger = structlog.get_logger(__name__)

# The window the UI reports on (`volume_30_day`). A definition that stops being
# sent keeps its row -- people still filter on events they no longer emit -- so
# this bounds the scan, not the taxonomy.
WINDOW = timedelta(days=30)

# Properties are unbounded in a way event names are not: one malformed producer
# can mint a key per request. Cap what a single pass will adopt so a runaway
# producer cannot turn this into an unbounded write.
MAX_PROPERTIES = 5_000


def _events(team_id: int, since) -> list[tuple[str, int, object]]:
    return sync_execute(
        """
        SELECT event, count() AS volume, max(timestamp) AS last_seen
        FROM events
        WHERE team_id = %(team_id)s AND timestamp >= %(since)s
        GROUP BY event
        """,
        {"team_id": team_id, "since": since},
        workload=Workload.OFFLINE,
    )


def _property_keys(team_id: int, since) -> list[tuple[str]]:
    return sync_execute(
        """
        SELECT DISTINCT arrayJoin(JSONExtractKeys(properties)) AS key
        FROM events
        WHERE team_id = %(team_id)s AND timestamp >= %(since)s
        LIMIT %(limit)s
        """,
        {"team_id": team_id, "since": since, "limit": MAX_PROPERTIES},
        workload=Workload.OFFLINE,
    )


def sync_team_definitions(team: Team) -> tuple[int, int]:
    """Returns (events adopted, properties adopted) for this team."""
    since = timezone.now() - WINDOW

    rows = _events(team.id, since)
    known = {name: pk for pk, name in EventDefinition.objects.filter(team=team).values_list("id", "name")}
    # ignore_conflicts rather than a pre-check: the unique constraint is on
    # (coalesce(project_id, team_id), name), so two passes racing -- or a name
    # this team already has under a different project -- must be a no-op, not
    # an IntegrityError that loses the whole batch.
    EventDefinition.objects.bulk_create(
        [
            EventDefinition(
                team=team, project_id=team.project_id, name=name, volume_30_day=volume, last_seen_at=last_seen
            )
            for name, volume, last_seen in rows
            if name and name not in known
        ],
        ignore_conflicts=True,
        batch_size=1000,
    )

    # Refresh the counters on the ones that already existed. Without this the
    # numbers freeze at whatever the first pass saw.
    existing = [
        EventDefinition(id=known[name], volume_30_day=volume, last_seen_at=last_seen)
        for name, volume, last_seen in rows
        if name in known
    ]
    if existing:
        EventDefinition.objects.bulk_update(existing, ["volume_30_day", "last_seen_at"], batch_size=1000)

    keys = [k for (k,) in _property_keys(team.id, since) if k]
    seen = set(
        PropertyDefinition.objects.filter(team=team, type=PropertyDefinition.Type.EVENT).values_list("name", flat=True)
    )
    PropertyDefinition.objects.bulk_create(
        [
            PropertyDefinition(team=team, project_id=team.project_id, name=key, type=PropertyDefinition.Type.EVENT)
            for key in keys
            if key not in seen
        ],
        ignore_conflicts=True,
        batch_size=1000,
    )

    return len(rows), len(keys)


@shared_task(ignore_result=True)
def sync_definitions() -> None:
    for team in Team.objects.all().only("id", "project_id"):
        try:
            events, properties = sync_team_definitions(team)
            logger.info("synced_definitions", team_id=team.id, events=events, properties=properties)
        except Exception:
            # One team's warehouse hiccup must not stop the others -- this is a
            # convergent pass, so the next run picks up whatever this one missed.
            logger.exception("sync_definitions_failed", team_id=team.id)
