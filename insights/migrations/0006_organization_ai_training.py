from django.db import migrations

# The one column session replay's ingester reads that this release line never
# modelled. Plugin 0.1.40 (built from insights main) resolves each org's project
# for recordings with
#
#   SELECT DISTINCT ON (o.slug) ..., COALESCE(o.is_ai_training_opted_in, false)
#   FROM insights_team t JOIN insights_organization o ...
#
# (nodejs/src/ingestion/pipelines/sessionreplay/shared/teams/team-service.ts), and
# a column that does not exist is an error COALESCE cannot catch: the consumer
# exits on its first batch and no recording is kept.
#
# Nullable with no default, the shape main declares, so adding it rewrites no
# rows and takes no long lock; the reader treats NULL as false. IF NOT EXISTS, so
# a database that already holds it applies this as a no-op.
SCHEMA = """
ALTER TABLE insights_organization
    ADD COLUMN IF NOT EXISTS is_ai_training_opted_in boolean NULL;
"""


class Migration(migrations.Migration):
    dependencies = [
        ("insights", "0005_ingestion_plugin_schema"),
    ]

    # Reversing leaves the column: the ingester still reads it.
    operations = [
        migrations.RunSQL(SCHEMA, reverse_sql=migrations.RunSQL.noop),
    ]
