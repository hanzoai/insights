from django.db import migrations


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("notebooks", "0004_resourcenotebook_account"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "insights_resourcenotebook_account_id_idx"
                ON "insights_resourcenotebook" ("account_id");
            """,
            reverse_sql="""
                DROP INDEX IF EXISTS "insights_resourcenotebook_account_id_idx";
            """,
        ),
        migrations.RunSQL(
            sql="""
                CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "unique_notebook_account"
                ON "insights_resourcenotebook" ("notebook_id", "account_id")
                WHERE "account_id" IS NOT NULL; -- not-null-ignore
            """,
            reverse_sql="""
                DROP INDEX IF EXISTS "unique_notebook_account";
            """,
        ),
        migrations.RunSQL(
            sql="""
                CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "insights_resourcenotebook_notebook_id_group_id_acc_7a017f67_uniq"
                ON "insights_resourcenotebook" (
                    "notebook_id",
                    "group_id",
                    "account_id"
                );
            """,
            reverse_sql="""
                CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "insights_resourcenotebook_notebook_id_group_id_88c0a30b_uniq"
                ON "insights_resourcenotebook" (
                    "notebook_id",
                    "group_id"
                );
            """,
        ),
    ]
