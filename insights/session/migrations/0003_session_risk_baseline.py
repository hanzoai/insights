from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("insights_session", "0002_session_user_id_index"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            # Same adoption shape as 0001, for the same reason: these columns may already
            # be on `django_session` before this migration first runs. Plain AddField
            # would fail with "column already exists" against such a database, and the
            # usual escape — `migrate --fake` — is wrong here, because it would also skip
            # the columns on a database that does NOT have them. Guarded DDL is one code
            # path that is correct on both, so the deploy has nothing to remember.
            state_operations=[
                migrations.AddField(
                    model_name="session",
                    name="country_code",
                    field=models.CharField(max_length=2, null=True),
                ),
                migrations.AddField(
                    model_name="session",
                    name="latitude",
                    field=models.FloatField(null=True),
                ),
                migrations.AddField(
                    model_name="session",
                    name="longitude",
                    field=models.FloatField(null=True),
                ),
                migrations.AddField(
                    model_name="session",
                    name="ua_signature",
                    field=models.CharField(max_length=255, null=True),
                ),
                migrations.AddField(
                    model_name="session",
                    name="baseline_at",
                    field=models.DateTimeField(null=True),
                ),
            ],
            database_operations=[
                migrations.RunSQL(
                    sql="""
                    ALTER TABLE django_session ADD COLUMN IF NOT EXISTS country_code varchar(2) NULL;
                    ALTER TABLE django_session ADD COLUMN IF NOT EXISTS latitude double precision NULL;
                    ALTER TABLE django_session ADD COLUMN IF NOT EXISTS longitude double precision NULL;
                    ALTER TABLE django_session ADD COLUMN IF NOT EXISTS ua_signature varchar(255) NULL;
                    ALTER TABLE django_session ADD COLUMN IF NOT EXISTS baseline_at timestamptz NULL;
                    """,
                    reverse_sql=migrations.RunSQL.noop,
                ),
            ],
        ),
    ]
