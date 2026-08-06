"""Which PROJECT an org's data lands in.

THE TENANT IS THE ORG. It is what IAM issues, what the envelope carries and
what every question about isolation is actually about. `team` is the fork's
word for the thing an org's data is stored under, and it is a PHYSICAL name the
query engine compiles against, not a choice: `team_id` sits INSIDE
`sharded_events`' sort key, so renaming it is a rebuild of the events table,
not an edit.

So the two words meet HERE, and only here. Everything above this line is named
for what it means to us — org, project — and is written into the name the fork
reads. The fork's word is spelled exactly twice, immediately below.

This lives in `insights.datastore` rather than beside the event projection
because BOTH planes need it and they sit on opposite sides of the app registry:
the event plane is a `insights.models` module (Django models loaded), while the
log plane is read through `insightsql`'s schema, which is imported while the
app registry is still loading. A leaf module both can import is what keeps the
routing to ONE definition instead of two that can disagree.
"""

from insights.settings.data_stores import DATASTORE_DATABASE

ORG_PROJECT_TABLE = "org_team"
ORG_PROJECT_COLUMN = "team"

# Traffic that belongs to no provisioned tenant: the anonymous `$public` org,
# and any org that has not been routed yet.
#
# Project ids are handed out by `insights_team_id_seq`, which starts at 1, so 0
# is a project that cannot exist and therefore one nobody can read. That is the
# point: an org is only ever readable once it is deliberately routed, so a
# tenant that appears on the plane tomorrow cannot land in another tenant's
# project by default. Defaulting this to a real project is what commingled ~95%
# of traffic — every anonymous pageview, plus every org nobody had mapped —
# into project 1, which belongs to an actual customer.
#
# Nothing is lost: the rows are in the warehouse under project 0, and routing
# them to a real project later is the same one write as any other org.
UNATTRIBUTED_PROJECT = 0

# THE ROUTING IS DERIVED, NEVER AUTHORED. There is no list of orgs in this file
# and there must not be one: the app already knows which project an org owns —
# `Organization.slug` is the same value the envelope carries as `org` — so a
# second copy written by hand can only ever be a chance to disagree with it, and
# it did. `admin` and `maxpower` were both mapped to project 1 once, so a
# separate funded org's data was routed into Hanzo's own project.
#
# `manage.py route_orgs` publishes that mapping from the app's own org records
# and is the ONLY writer of this table. Routing is still a deliberate act — the
# command is run, not scheduled — because an org that nobody has routed is
# invisible, which is the safe way to be wrong.

# Both arrays come from the identical subquery, so they are ordered alike and
# element i of one names element i of the other. An empty table yields empty
# arrays and `transform` returns the default, so the lookup cannot throw — an
# unrouted warehouse attributes nothing rather than failing to project.
#
# The SELECT names the PHYSICAL column, unaliased. Our vocabulary is carried by
# the names in this file; aliasing it to `project` in the emitted text would
# only make the SQL describe a column the warehouse does not have, and would
# rewrite every view that embeds this expression to say so.
ORG_PROJECT_SQL = (
    f"SELECT org, {ORG_PROJECT_COLUMN} FROM `{DATASTORE_DATABASE}`.`{ORG_PROJECT_TABLE}` FINAL ORDER BY org"
)
PROJECT_SQL = (
    "transform(org"
    f", (SELECT groupArray(org) FROM ({ORG_PROJECT_SQL}))"
    f", (SELECT groupArray({ORG_PROJECT_COLUMN}) FROM ({ORG_PROJECT_SQL}))"
    f", toInt64({UNATTRIBUTED_PROJECT}))"
)
