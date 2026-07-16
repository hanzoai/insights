"""
Drop the doubled ``insights_insights*`` table names the debrand left behind and
give the three CDP tables the clean single-``insights_`` names their models now
declare via ``Meta.db_table`` — and that the ingestion plugin's SQL already
queries (``insights_function`` / ``insights_flow`` / ``insights_function_template``).

``AlterModelTable`` is Django's first-class rename: it emits a single
``ALTER TABLE … RENAME TO …`` and rewrites dependent references. It runs LAST in
the graph, after every earlier ``RunSQL`` (0499/0730/0948/0949) has already
executed against the old ``insights_insightsfunction`` name — so a fresh
``migrate`` builds the old table, applies all hardcoded SQL, then renames, while
the live DB simply renames in place. No constraint-hash is recomputed and no
migration internal is rewritten, so both paths converge on the clean name.
"""

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("insights", "1018_rename_legacy_app_label"),
    ]

    operations = [
        migrations.AlterModelTable(name="insightsfunction", table="insights_function"),
        migrations.AlterModelTable(name="insightsflow", table="insights_flow"),
        migrations.AlterModelTable(name="insightsfunctiontemplate", table="insights_function_template"),
    ]
