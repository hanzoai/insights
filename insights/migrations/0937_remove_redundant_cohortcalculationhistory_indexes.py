from django.db import migrations


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("insights", "0936_survey_headline_response_count_and_more"),
    ]

    operations = [
        migrations.RunSQL(
            sql="DROP INDEX CONCURRENTLY IF EXISTS insights_cohortcalculationhistory_cohort_id_9f2adaad",
            reverse_sql="CREATE INDEX CONCURRENTLY IF NOT EXISTS insights_cohortcalculationhistory_cohort_id_9f2adaad ON insights_cohortcalculationhistory (cohort_id)",
        ),
        migrations.RunSQL(
            sql="DROP INDEX CONCURRENTLY IF EXISTS insights_cohortcalculationhistory_team_id_da962ae8",
            reverse_sql="CREATE INDEX CONCURRENTLY IF NOT EXISTS insights_cohortcalculationhistory_team_id_da962ae8 ON insights_cohortcalculationhistory (team_id)",
        ),
    ]
