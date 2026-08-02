"""Projection of the Hanzo event plane onto the Insights event schema.

An event is the fact; a message is the container it travels in. Every product's
facts land in ONE place on the ONE warehouse — `event.fact` on the Hanzo
Datastore — one row per thing that happened, whatever sort of thing it was. A
`signal` column says which sort: `act` for something a person or a surface did,
and `clip`, `error`, `log`, `span` for the rest. It is a plain MergeTree family
table, so a materialized view over it fires on every insert: the unified stream
reaches Insights with no second capture tier, no queue and no extra process.

WHICH IS WHY EVERY VIEW BELOW NAMES ITS SIGNAL. It was four tables with an
identical envelope, so a view that named `event.event` was reading product
events by construction. With one table that is a PREDICATE, and a predicate can
be forgotten — a projection that omits it would publish every log line and every
span into the product-event stream. So the source is built in ONE place
(`EVENT_FROM_SQL`) and the three views compose it rather than writing `FROM`
themselves.

`event_mv` writes through `writable_events`, the same Distributed write-side
table the fork's own event views target (`events_json_mv`,
`events_recent_json_mv`), so rows are sharded by `sipHash64(distinct_id)`
exactly like natively captured events.

The envelope carries the columns Insights reads as first-class values — `org`,
`time`, `name`, `kind`, `product`, `session_id`, `distinct_id`, `person_id`,
`url`, `path` — and everything else in one `attributes` map, so the projection
below is a rename plus a JSON merge, not a translation layer.

The same envelope also names the USER an event belongs to, so `user_mv` and
`user_alias_mv` project the users out of it the same way — three views, one
source, one set of identity expressions. See "the USER plane" below.

Prerequisite: `event.fact` must exist. hanzoai/o11y owns its DDL and cloud owns
the write path into it; this module only reads it, and deliberately declares
neither.
"""

from insights.models.person.sql import PERSON_DISTINCT_ID_OVERRIDES_WRITABLE_TABLE, PERSONS_WRITABLE_TABLE
from insights.settings.data_stores import DATASTORE_DATABASE

from .sql import WRITABLE_EVENTS_DATA_TABLE

EVENT_TABLE = "event.fact"
EVENT_MV = "event_mv"

# The one signal Insights projects. `act` and not `event`, because `event` is the
# NAMESPACE the table lives in and a value cannot also be the set it belongs to:
# `event.fact WHERE signal = 'event'` reads as a schema nobody finished naming.
EVENT_SIGNAL = "act"

# The source clause, written ONCE. Everything that reads the plane composes this
# rather than naming the table, so the tenant-facing views cannot differ in which
# rows they consider — and a fourth view added later inherits the predicate instead
# of having to remember it.
EVENT_FROM_SQL = f"FROM {EVENT_TABLE}"
EVENT_SIGNAL_SQL = f"signal = '{EVENT_SIGNAL}'"

# ── routing: which PROJECT an org's events land in ───────────────────────────
#
# THE TENANT IS THE ORG. It is what IAM issues, what the envelope carries and
# what every question about isolation is actually about. `team` is the fork's
# word for the thing an org's events are stored under, and — like `person`
# below — it is a PHYSICAL name the query engine compiles against, not a
# choice: `team_id` sits INSIDE `sharded_events`' sort key
# `(team_id, toDate(timestamp), event, cityHash64(distinct_id), cityHash64(uuid))`,
# so renaming it is a rebuild of the events table, not an edit.
#
# THERE IS NO ROUTING TABLE, and deleting it is the point of this section.
#
# There was one — `insights.org_team`, a Replacing table read `FINAL` by every
# projection and written by a management command. It was a SECOND COPY of
# something the app already knows: `Organization.slug` IS the value the envelope
# carries as `org`, and an org's project is its first team. A second copy of a
# fact is a second opinion about it, and this one disagreed — `admin` and
# `maxpower` were both mapped to project 1, so a separate funded org's events
# were routed into Hanzo's own project. Deriving the copy instead of authoring it
# made the copy right; it did not stop it being a copy.
#
# So the views are COMPILED from the app's own records. `routing()` reads them,
# `PROJECT_SQL` writes them into the projection and `ROUTED_SQL` gates it, and
# `manage.py route_orgs` re-derives the views when the answer changes — a drop
# and a create, which for a view is metadata-only and instant. The result is a
# function of the records alone, so re-deriving is idempotent and cannot be
# PARTIALLY right the way a row-at-a-time correction can.
#
# AN ORG WITH NO PROJECT IS NOT PROJECTED — it is not defaulted into one. That is
# the second half of the same defect: routing everything unmatched into project 1
# put ~95% of the plane, and a funded org's events, into a customer's project;
# routing it into project 0 instead only moved the problem, because three
# distinct tenants ($public, admin, maxpower) then shared one bucket and nothing
# in `sharded_events` could tell them apart. Now the view considers only the orgs
# that own a project. Nothing is lost — every row is on `event.fact` either way —
# and an org becomes projectable the moment the app provisions its project.
#
# Routing stays a DELIBERATE act, run and not scheduled, because an org nobody
# has routed is invisible, and invisible is the safe way to be wrong.

# The project id the projection can never produce. `multiIf` must have a final
# branch; ROUTED_SQL makes it unreachable, because the view considers only orgs
# this expression has a branch for. It is 0 because `insights_team_id_seq` starts
# at 1 — so if the gate and the projection ever disagreed, the rows would land
# where nobody can read them rather than in somebody else's project. Of the two
# ways to be wrong, this file always takes the invisible one.
UNROUTABLE_PROJECT = 0

# An org owns ONE project, because the envelope names an org and not a project.
# The fork already answers "which one" this way everywhere a user lands somewhere
# by default (`organization.teams.order_by("id").first()`, `insights/models/user.py`),
# so this reads the org's FIRST project rather than inventing a second rule for
# the same question.
FIRST_PROJECT = "id"


def provisioned() -> dict[str, int]:
    """Which project each org's events land in, per the app's own records.

    Empty is a legitimate answer and not an error: a deployment that has
    provisioned no project routes nothing, and the plane keeps every row
    regardless. `bin/migrate` runs the datastore migrations ALONGSIDE the
    Postgres ones, so on a fresh install this is asked before the table it reads
    exists — the same answer by a different road.
    """
    from django.db import Error

    from insights.models.organization import Organization

    try:
        orgs = list(Organization.objects.prefetch_related("teams"))
    except Error:
        return {}
    return {org.slug: project.id for org in orgs if (project := org.teams.order_by(FIRST_PROJECT).first()) is not None}


def quoted(orgs) -> str:
    return ", ".join(f"'{org}'" for org in orgs)


def ROUTED_SQL(routing: dict[str, int], source: str = "") -> str:
    """The orgs this projection serves. Everything else is not projected.

    `source` qualifies the column for the one view that aliases its FROM, so the
    predicate is about the row we READ. An empty routing yields a constantly
    false predicate rather than an empty `IN ()`, which is a syntax error: a
    warehouse that routes nothing projects nothing, and says so in one token.
    """
    return f"{source}org IN ({quoted(routing)})" if routing else "0"


def PROJECT_SQL(routing: dict[str, int]) -> str:
    """The org's project — a closed `multiIf` over the orgs that own one."""
    branches = "".join(f"org = '{org}', toInt64({project}), " for org, project in sorted(routing.items()))
    return f"multiIf({branches}toInt64({UNROUTABLE_PROJECT}))"


EMPTY_JSON = "'{}'"

# ── the event's name ─────────────────────────────────────────────────────────
# The plane names a fact the way the SURFACE says it (`page_viewed`). Every
# lens the fork ships names that same fact the way ITS schema says it
# (`$pageview`). Passing `name` straight through therefore publishes rows no
# lens can find: web analytics, `sessions_mv.pageview_count` and
# `raw_sessions_v3_mv.page_screen_uniq` all key on the literal `$pageview`, so
# without this back-map every session on insights.hanzo.ai reads ZERO pageviews
# while the rows sit in the warehouse — measured on 2026-08-01, where 06:00
# through 15:00 UTC held 168 sessions and 0 counted pageviews.
#
# The map is keyed on KIND, not on the name, because kind is the plane's closed
# vocabulary: a surface that invents a new page-event name is still a page. A
# surface that already sends the reserved name keeps it — multiIf's fallback is
# the name itself.
RESERVED_KIND = {"page": "$pageview", "screen": "$screen"}

EVENT_NAME_SQL = (
    "multiIf(" + ", ".join(f"kind = '{kind}', '{name}'" for kind, name in RESERVED_KIND.items()) + ", name)"
)

# What the surface called it, kept only where the back-map above replaced it.
# An event that already arrived as its reserved name has nothing to preserve,
# and `text_json` drops the empty string.
ORIGINAL_NAME_SQL = (
    "if(kind IN (" + ", ".join(f"'{kind}'" for kind in RESERVED_KIND) + ")"
    " AND NOT (name IN (" + ", ".join(f"'{name}'" for name in RESERVED_KIND.values()) + ")), name, '')"
)

# ── the five layers of `properties`, merged in this order ────────────────────
# JSONMergePatch takes the LAST writer of a key, so each block below overrides
# the one above it: the envelope's own columns are the most authoritative
# description of an event and are merged last.

# Envelope columns, keyed by the property the Insights UI reads. The `$` keys
# populate the URL / SESSION columns of the event explorer; `product`, `tenant`
# and `kind` are the plane's own dimensions and keep their own names.
PROPERTY_COLUMN = {
    "$current_url": "url",
    # The site an event happened on. Web analytics filters by `$host`, so
    # without it every Hanzo property reads as one undifferentiated site.
    # `domain` is total over any String and returns '' for a relative or empty
    # url, which `text_json` then drops.
    "$host": "domain(url)",
    "$pathname": "path",
    "$session_id": "session_id",
    "product": "product",
    "tenant": "org",
    "kind": "kind",
    # The plane's own name for an event the projection had to rename (see
    # EVENT_NAME_SQL). Carried so renaming a name to a reserved one never loses
    # it: `$pageview` says WHICH KIND of fact this is, `$event_name` says what
    # the surface called it, and a breakdown over the second still separates
    # `page_viewed` from `docs_page_viewed`.
    "$event_name": ORIGINAL_NAME_SQL,
}

# Attributes that carry a well-known meaning get the `$` name the UI expects.
# Renamed rather than duplicated: the raw key is filtered out of the passthrough
# below, so a referrer appears exactly once, as `$referrer`.
PROPERTY_ATTRIBUTE = {
    "$referrer": "referrer",
    "$referring_domain": "referrer_domain",
    "$lib": "library",
    "$lib_version": "library_version",
}

# Attributes read as numbers. `toFloat64OrZero` is total over any String, so a
# malformed value reads 0 and is filtered out rather than throwing.
NUMBER_ATTRIBUTE = ["quantity", "revenue"]

# The @hanzo/observe AST annotation. `el` is a named Tuple, so each element is a
# real subcolumn and `el.role` reads exactly like a flat column. `$path` is the
# DOM ancestry joined into one string: a breakdown over an array explodes it
# into its elements, and the useful value is the whole path.
PROPERTY_EL = {
    "$el": "el.label",
    "$role": "el.role",
    "$testid": "el.testid",
    "$name": "el.name",
    "$component": "el.component",
    "$path": "arrayStringConcat(el.path, ' > ')",
}

# Keys the passthrough must not repeat, because a block above already named them.
CLAIMED_ATTRIBUTE = sorted(set(PROPERTY_ATTRIBUTE.values()) | set(NUMBER_ATTRIBUTE))


def literal(properties: dict[str, str]) -> str:
    return "map(" + ", ".join(f"'{key}', {column}" for key, column in properties.items()) + ")"


def text_json(properties: dict[str, str]) -> str:
    """A JSON document of the non-empty entries of `properties`."""
    return f"toJSONString(mapFilter((k, v) -> v != '', {literal(properties)}))"


NUMBER_JSON = (
    "toJSONString(mapFilter((k, v) -> v != 0, "
    + literal({key: f"toFloat64OrZero(attributes['{key}'])" for key in NUMBER_ATTRIBUTE})
    + "))"
)

CLAIMED_JSON = "[" + ", ".join(f"'{key}'" for key in CLAIMED_ATTRIBUTE) + "]"

ATTRIBUTE_JSON = f"toJSONString(mapFilter((k, v) -> v != '' AND NOT has({CLAIMED_JSON}, k), attributes))"

RENAMED_JSON = text_json({key: f"attributes['{value}']" for key, value in PROPERTY_ATTRIBUTE.items()})

PROPERTIES_SQL = (
    "JSONMergePatch("
    f"{NUMBER_JSON}, "
    f"{text_json(PROPERTY_EL)}, "
    f"{ATTRIBUTE_JSON}, "
    f"{RENAMED_JSON}, "
    f"{text_json(PROPERTY_COLUMN)})"
)

# ── identity ────────────────────────────────────────────────────────────────
#
# `user` is the Hanzo word (IAM vocabulary: user / org / project); `person` is
# the fork's, and it is a PHYSICAL column name in tables the query engine
# compiles against. The two meet HERE, in the projection, which is the one place
# a rename belongs: every expression below is named for what it means to us and
# is written into the column the fork reads. Nothing above this file says
# "person".
#
# `event.event.person_id` carries the IAM SUBJECT (the `sub` claim — the stable
# opaque user id) whenever the writer was signed in, and is empty otherwise;
# `anonymous_id` is the browser-minted id the same visitor carried BEFORE they
# signed in. So the plane already holds both halves of a user's history, and the
# only question is how to key them.
#
# MD5 is a total function over any String, so the uuid is deterministic: a
# replay or a re-run of the backfill produces the same key and the
# ReplacingMergeTree collapses it.
UUID_SQL = "reinterpretAsUUID(MD5(id))"
DISTINCT_SQL = "if(distinct_id != '', distinct_id, anonymous_id)"

# Whether a row names a signed-in user. Every expression that has to agree about
# identity derives from THIS one predicate, so they cannot disagree.
IDENTIFIED_SQL = "person_id != ''"

# The user key: the IAM subject when we have one, else the visitor's own id.
# Signed-in rows therefore key on the IAM user, and anonymous rows key on the
# browser — two keys for one human until an alias joins them (USER_ALIAS below).
USER_SQL = f"reinterpretAsUUID(MD5(if({IDENTIFIED_SQL}, person_id, {DISTINCT_SQL})))"


def EVENT_COLUMNS(routing: dict[str, int], historical: bool) -> list[tuple[str, str]]:
    return [
        ("uuid", UUID_SQL),
        ("event", EVENT_NAME_SQL),
        ("properties", PROPERTIES_SQL),
        ("timestamp", "toDateTime64(time, 6, 'UTC')"),
        ("team_id", PROJECT_SQL(routing)),
        ("distinct_id", DISTINCT_SQL),
        ("elements_chain", "''"),
        ("created_at", "toDateTime64(ingested_at, 6, 'UTC')"),
        ("person_id", USER_SQL),
        # The plane carries no person profile, so person properties are read
        # from the person tables rather than off the event.
        ("person_mode", "'propertyless'"),
        ("historical_migration", "true" if historical else "false"),
    ]


def EVENT_SELECT_SQL(routing: dict[str, int], historical: bool) -> str:
    projection = ",\n    ".join(f"{expression} AS {name}" for name, expression in EVENT_COLUMNS(routing, historical))
    return f"SELECT\n    {projection}\n{EVENT_FROM_SQL}\nWHERE {EVENT_SIGNAL_SQL} AND {ROUTED_SQL(routing)}"


def EVENT_MV_SQL(routing: dict[str, int]) -> str:
    return f"""
CREATE MATERIALIZED VIEW IF NOT EXISTS `{DATASTORE_DATABASE}`.`{EVENT_MV}`
TO `{DATASTORE_DATABASE}`.`{WRITABLE_EVENTS_DATA_TABLE()}`
AS {EVENT_SELECT_SQL(routing, historical=False)}
"""


def DROP_EVENT_MV_SQL() -> str:
    return f"DROP TABLE IF EXISTS `{DATASTORE_DATABASE}`.`{EVENT_MV}`"


def EVENT_BACKFILL_SQL(routing: dict[str, int]) -> str:
    # INSERT ... SELECT binds by position, so the column list is explicit.
    names = ", ".join(name for name, _ in EVENT_COLUMNS(routing, historical=True))
    return f"""
INSERT INTO `{DATASTORE_DATABASE}`.`{WRITABLE_EVENTS_DATA_TABLE()}` ({names})
{EVENT_SELECT_SQL(routing, historical=True)}
"""


# ── the USER plane ──────────────────────────────────────────────────────────
#
# The events projection above answers "which user did this", but a user is a
# ROW somewhere, and the People list, every actor drill-down and every cohort
# read it from `person` — which nothing on this plane was writing, so the fork
# reported zero users against a warehouse full of their events.
#
# So two more views over the SAME source, deriving identity from the SAME
# expressions. Each states ONE fact:
#
#   user_mv        — this user exists.
#   user_alias_mv  — this anonymous visitor turned out to be that user.
#
# WHY A BACKFILL IS SAFE HERE, WHERE IT IS NOT FOR EVENTS. `0220` explains that
# re-projecting `sharded_events` DOUBLE-COUNTS: its collapse key includes
# `team_id`, so a row written under a corrected team does not replace the row it
# corrects. Neither target below has that shape. `person` collapses on
# `(team_id, id)` and `person_distinct_id_overrides` on `(team_id, distinct_id)`
# — and both keys are FUNCTIONS of the same event columns the projection reads,
# so re-running it produces the identical key and merges into the identical row.
# Running the backfill twice is indistinguishable from running it once.

USER_TABLE = PERSONS_WRITABLE_TABLE
USER_ALIAS_TABLE = PERSON_DISTINCT_ID_OVERRIDES_WRITABLE_TABLE

USER_MV = "user_mv"
USER_ALIAS_MV = "user_alias_mv"


# ── precedence ──────────────────────────────────────────────────────────────
#
# A ReplacingMergeTree keeps the row with the LARGEST `version`, so a version is
# a PRECEDENCE, not a clock. Two independent things decide it, so they get
# independent bits instead of one number that quietly means both:
#
#   BAND   who is speaking. An identified row outranks an anonymous one, and an
#          OVERRIDE outranks the plane entirely.
#   CLOCK  when the SERVER learned it, inverted where the FIRST sighting should
#          win and left alone where the LAST should.
#
# WHY THE SERVER'S CLOCK. `time` is the CALLER's — `clampTS` only pulls the
# future back to now, so a caller may back-date within its own org, and under a
# first-wins rule a back-dated row would outrank every genuine one forever.
# `ingested_at` is a column DEFAULT (`now64(3)`) that nothing on the wire can
# reach — cloud omits it from every INSERT — so precedence is never the
# caller's to choose. Precedence and `created_at` read the same clock, because
# a row that wins on one and reports the other is two facts pretending to be
# one.
# `greatest(0, …)` is what makes the band decomposition TOTAL rather than
# merely true of the values we expect. A clock below zero would carry a row
# ACROSS a band boundary — `BAND - 1 - ms` exceeds `BAND` for any negative ms —
# and an anonymous row would land in the identified band. The column's DEFAULT
# cannot produce that and no writer sets the column, so this is not a live hole;
# it is the difference between a partition that holds and one that happens to.
# The upper end needs no clamp: DateTime64(3) tops out around 9.2e12 ms, three
# orders below one band.
def clock(column: str) -> str:
    return f"greatest(0, toUnixTimestamp64Milli({column}))"


INGESTED_MS = clock("ingested_at")
NOW_MS = clock("now64(3)")

# 2^61, so three bands fit in Int64 (the alias column's type) with the arithmetic
# never leaving it, and a millisecond (~1.8e12) is nine orders below one band.
BAND = 1 << 61

BAND_ANONYMOUS = 0
BAND_IDENTIFIED = 1

# The band the plane NEVER writes: the room left above it for a decision the
# plane does not get to make — a deletion, or a source that knows more than we
# do. Without it a projected row is IMMORTAL, because its version is a function
# of the event that made it and nothing outside the projection can bid higher.
# That is not a hypothetical: the first cut of this plane anchored versions at
# the top of the UInt64, and the only way to retire those rows was to delete
# them (`0222`).
BAND_OVERRIDE = 2


def precedence(band: str, clock: str, first: bool) -> str:
    """The version that makes `band` outrank every lower one, `first`-wins within it."""
    return f"{band} * {BAND} + " + (f"({BAND} - 1 - {clock})" if first else clock)


# Identification DOMINATES time for a user, which is what makes `is_identified`
# monotone: a row that names a subject always outranks one that does not, so no
# anonymous row — however early, however crafted — can flip a known user back to
# unknown. It can only ever ADD the user before we learn their name.
USER_BAND = f"if({IDENTIFIED_SQL}, {BAND_IDENTIFIED}, {BAND_ANONYMOUS})"

# First ingest wins, because `created_at` means first seen.
FIRST_SEEN_VERSION = f"toUInt64({precedence(USER_BAND, INGESTED_MS, first=True)})"

# The alias's newest claim wins: a shared browser belongs to whoever signed in
# last, which is the same rule a merge has always followed. Every alias row
# names a subject by construction (see USER_ALIAS_WHERE), so it is always in the
# identified band. Signed, because `person_distinct_id_overrides.version` is
# Int64 where `person.version` is UInt64 — each expression is typed for the
# column it is written into, so neither insert relies on a coercion.
LAST_SEEN_VERSION = f"toInt64({precedence(str(BAND_IDENTIFIED), INGESTED_MS, first=False)})"

# What an authority ABOVE the plane writes to retire a row: the reserved band,
# stamped with the server's clock so a later decision outranks an earlier one.
# It beats every projected row, so it survives a re-run of the backfill — which
# is what makes a deletion here durable rather than a race against the next
# deploy.
OVERRIDE_VERSION = precedence(str(BAND_OVERRIDE), NOW_MS, first=False)


def USER_COLUMNS(routing: dict[str, int]) -> list[tuple[str, str]]:
    return [
        ("id", USER_SQL),
        # When the PLANE first saw this user, on the server's clock — the same
        # clock that decides which row survives, so the surviving row's
        # `created_at` is the one its version was earned with.
        ("created_at", "toDateTime64(ingested_at, 3, 'UTC')"),
        ("team_id", PROJECT_SQL(routing)),
        # The plane carries no user profile — `event_mv` writes events as
        # `propertyless` for exactly this reason — so the row claims none.
        # Traits belong to IAM, and inventing them here would put a second,
        # weaker source under a name the UI reads as authoritative.
        ("properties", EMPTY_JSON),
        # True iff the row named an IAM subject. Per row this is the SAME
        # predicate the key and the band are derived from; ACROSS rows it is the
        # band that keeps it honest. Two rows CAN share a key and disagree here
        # — the reduced ingest lane stamps the subject into `distinct_id` and
        # leaves `person_id` empty, and a caller may send any `distinct_id` it
        # likes — so the flag cannot be a per-row invariant. Making
        # identification outrank time is what settles the disagreement the one
        # way that is true: a user we have ever known by name stays known.
        ("is_identified", f"toInt8({IDENTIFIED_SQL})"),
        ("is_deleted", "toInt8(0)"),
        ("version", FIRST_SEEN_VERSION),
    ]


def USER_ALIAS_COLUMNS(routing: dict[str, int]) -> list[tuple[str, str]]:
    return [
        ("team_id", PROJECT_SQL(routing)),
        # The id the visitor carried BEFORE signing in — the one every earlier
        # event of theirs was written under.
        ("distinct_id", "anonymous_id"),
        # …resolves to the user those events actually belong to.
        ("person_id", USER_SQL),
        ("is_deleted", "toInt8(0)"),
        ("version", LAST_SEEN_VERSION),
    ]


# An alias is only a fact when the event knows BOTH halves and they differ:
# signed in (so there is a user to alias to) and carrying a distinct anonymous
# id (so there is a history to attach). Anything else would alias a user to
# themselves.
#
# The predicate is QUALIFIED because this projection writes a column called
# `person_id` and ClickHouse resolves a WHERE against the SELECT's aliases
# before the table's columns: unqualified, `person_id != ''` compares the
# projected UUID to a string and the view fails to create at all. Naming the
# source says which row the filter is about — the one we READ, never the one we
# write.
EVENT_SOURCE = "e"
USER_ALIAS_WHERE = (
    f"{EVENT_SOURCE}.person_id != ''"
    f" AND {EVENT_SOURCE}.anonymous_id != ''"
    f" AND {EVENT_SOURCE}.anonymous_id != {EVENT_SOURCE}.person_id"
)


def USER_SELECT_SQL(routing: dict[str, int]) -> str:
    projection = ",\n    ".join(f"{expression} AS {name}" for name, expression in USER_COLUMNS(routing))
    return f"SELECT\n    {projection}\n{EVENT_FROM_SQL}\nWHERE {EVENT_SIGNAL_SQL} AND {ROUTED_SQL(routing)}"


def USER_ALIAS_SELECT_SQL(routing: dict[str, int]) -> str:
    projection = ",\n    ".join(f"{expression} AS {name}" for name, expression in USER_ALIAS_COLUMNS(routing))
    return (
        f"SELECT\n    {projection}\n{EVENT_FROM_SQL} AS {EVENT_SOURCE}"
        f"\nWHERE {EVENT_SOURCE}.{EVENT_SIGNAL_SQL} AND {ROUTED_SQL(routing, EVENT_SOURCE + '.')}"
        f" AND {USER_ALIAS_WHERE}"
    )


def USER_MV_SQL(routing: dict[str, int]) -> str:
    return f"""
CREATE MATERIALIZED VIEW IF NOT EXISTS `{DATASTORE_DATABASE}`.`{USER_MV}`
TO `{DATASTORE_DATABASE}`.`{USER_TABLE}`
AS {USER_SELECT_SQL(routing)}
"""


def USER_ALIAS_MV_SQL(routing: dict[str, int]) -> str:
    return f"""
CREATE MATERIALIZED VIEW IF NOT EXISTS `{DATASTORE_DATABASE}`.`{USER_ALIAS_MV}`
TO `{DATASTORE_DATABASE}`.`{USER_ALIAS_TABLE}`
AS {USER_ALIAS_SELECT_SQL(routing)}
"""


def DROP_USER_MV_SQL() -> str:
    return f"DROP TABLE IF EXISTS `{DATASTORE_DATABASE}`.`{USER_MV}`"


def DROP_USER_ALIAS_MV_SQL() -> str:
    return f"DROP TABLE IF EXISTS `{DATASTORE_DATABASE}`.`{USER_ALIAS_MV}`"


def USER_BACKFILL_SQL(routing: dict[str, int]) -> str:
    # INSERT ... SELECT binds by position, so the column list is explicit.
    names = ", ".join(name for name, _ in USER_COLUMNS(routing))
    return f"""
INSERT INTO `{DATASTORE_DATABASE}`.`{USER_TABLE}` ({names})
{USER_SELECT_SQL(routing)}
"""


def USER_ALIAS_BACKFILL_SQL(routing: dict[str, int]) -> str:
    names = ", ".join(name for name, _ in USER_ALIAS_COLUMNS(routing))
    return f"""
INSERT INTO `{DATASTORE_DATABASE}`.`{USER_ALIAS_TABLE}` ({names})
{USER_ALIAS_SELECT_SQL(routing)}
"""


# ── retiring a user the plane projected ─────────────────────────────────────
#
# The plane writes `person` rows that have no Postgres counterpart, so the
# fork's delete path cannot see them: it builds its queryset from Postgres, and
# its tombstone travels by Kafka, which this deployment does not run. A row the
# plane creates is therefore a row only the plane can retire.
#
# Both statements read the CURRENT row so they only ever tombstone something
# that exists — which is also what lets the caller answer "how many did I
# actually delete" with a number rather than a shrug.

USER_READ_TABLE = "person"
USER_ALIAS_READ_TABLE = "person_distinct_id_overrides"


def PLANE_USER_IDS_SQL() -> str:
    """Which of `ids` the warehouse actually holds a live user row for."""
    return f"""
SELECT DISTINCT id FROM `{DATASTORE_DATABASE}`.`{USER_READ_TABLE}`
WHERE team_id = %(team_id)s AND id IN %(ids)s
"""


def USER_IDS_FOR_DISTINCT_SQL() -> str:
    """The users these visitor ids resolve to — the alias read, in the alias's own direction."""
    return f"""
SELECT DISTINCT person_id FROM `{DATASTORE_DATABASE}`.`{USER_ALIAS_READ_TABLE}`
WHERE team_id = %(team_id)s AND distinct_id IN %(distinct_ids)s
"""


def USER_TOMBSTONE_SQL() -> str:
    return f"""
INSERT INTO `{DATASTORE_DATABASE}`.`{USER_TABLE}`
    (id, created_at, team_id, properties, is_identified, is_deleted, version)
SELECT DISTINCT
    id, now64(3, 'UTC'), team_id, {EMPTY_JSON}, toInt8(0), toInt8(1),
    toUInt64({OVERRIDE_VERSION})
FROM `{DATASTORE_DATABASE}`.`{USER_READ_TABLE}`
WHERE team_id = %(team_id)s AND id IN %(ids)s
"""


def USER_ALIAS_TOMBSTONE_SQL() -> str:
    """Retire every alias pointing at these users, so no visitor still resolves to one."""
    return f"""
INSERT INTO `{DATASTORE_DATABASE}`.`{USER_ALIAS_TABLE}`
    (team_id, distinct_id, person_id, is_deleted, version)
SELECT DISTINCT
    team_id, distinct_id, person_id, toInt8(1), toInt64({OVERRIDE_VERSION})
FROM `{DATASTORE_DATABASE}`.`{USER_ALIAS_READ_TABLE}`
WHERE team_id = %(team_id)s AND person_id IN %(ids)s
"""
