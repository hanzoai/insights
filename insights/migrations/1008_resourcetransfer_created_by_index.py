from django.db import migrations


class Migration(migrations.Migration):
    atomic = False  # Required for CREATE INDEX CONCURRENTLY

    dependencies = [
        ("insights", "1007_resourcetransfer_created_by"),
    ]

    operations = [
        migrations.RunSQL(
            """
            CREATE INDEX CONCURRENTLY IF NOT EXISTS "insights_resourcetransfer_created_by_id_cfdd93a0" ON "insights_resourcetransfer" ("created_by_id");
            """,
            reverse_sql="""
                DROP INDEX IF EXISTS "insights_resourcetransfer_created_by_id_cfdd93a0";
            """,
        ),
    ]
