from django.db import migrations

# Schema the ingestion plugin reads and writes but this release line never
# modelled. The plugin (hanzoai/insights-plugin, built from insights main) loads
# every team's event filter and feature-flag settings, and tombstones persons
# instead of deleting them. None of these have a Django model here, so the
# migration carries SQL only and records no model state.
#
# Every statement is IF NOT EXISTS: a database that already holds this schema
# applies it as a no-op, and a fresh one ends up with the same tables.
#
# The DDL mirrors insights main: products/feature_flags 0008 (TeamFeatureFlagsConfig,
# no FK constraint on team so the migration takes no lock on insights_team),
# insights 0009 (EventFilterConfig), and rust/persons_migrations
# 20260727000002 (is_deleted, a constant default, so no table rewrite).
SCHEMA = """
CREATE TABLE IF NOT EXISTS feature_flags_teamfeatureflagsconfig (
    team_id integer PRIMARY KEY,
    minimal_flag_called_events boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS insights_eventfilterconfig (
    id uuid PRIMARY KEY,
    mode varchar(20) NOT NULL DEFAULT 'disabled',
    filter_tree jsonb,
    test_cases jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by_id integer,
    team_id integer NOT NULL UNIQUE
);

ALTER TABLE insights_person
    ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

ALTER TABLE insights_persondistinctid
    ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;
"""


class Migration(migrations.Migration):
    dependencies = [
        ("insights", "0004_heatmaps_on_by_default"),
    ]

    # Reversing leaves the schema in place: the plugin still reads it, and
    # dropping it would lose its rows.
    operations = [
        migrations.RunSQL(SCHEMA, reverse_sql=migrations.RunSQL.noop),
    ]
