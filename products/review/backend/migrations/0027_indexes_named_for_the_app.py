from django.db import migrations

# The app is `review`; nine of its indexes were still called `reviewhog_`.
# models.py has said `review_` since the app was renamed, so this closes a
# drift rather than opening one: until now `makemigrations` wanted to drop
# nine indexes and build nine more, which is a rebuild of every index on the
# report tables to change nine strings.
#
# The database side is a rename because that is all it is -- ALTER INDEX
# RENAME rewrites a catalogue row and touches no pages. It is written as a
# loop over the catalogue rather than nine statements so it converges from
# any starting point: a fresh database built after the app rename never had
# the old names and the loop finds nothing, and a database already renamed by
# hand is likewise a no-op. Nine statements would fail on both.
RENAME = """
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT indexname AS old_name,
               'review_' || substring(indexname from length('reviewhog_') + 1) AS new_name
        FROM pg_indexes
        WHERE schemaname = current_schema()
          AND tablename IN (
              'review_reviewreport',
              'review_reviewreportartefact',
              'review_reviewskillconfig'
          )
          AND left(indexname, length('reviewhog_')) = 'reviewhog_'
    LOOP
        EXECUTE format('ALTER INDEX %I RENAME TO %I', r.old_name, r.new_name);
    END LOOP;
END $$;
"""


class Migration(migrations.Migration):
    dependencies = [("review", "0026_reviewreport_review_initial_permission_mode_and_more")]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[migrations.RunSQL(RENAME, migrations.RunSQL.noop)],
            state_operations=[
                migrations.RenameIndex(
                    model_name="reviewreport",
                    old_name="reviewhog_rpt_team_status_idx",
                    new_name="review_rpt_team_status_idx",
                ),
                migrations.RenameIndex(
                    model_name="reviewreport",
                    old_name="reviewhog_rpt_signal_rpt_idx",
                    new_name="review_rpt_signal_rpt_idx",
                ),
                migrations.RenameIndex(
                    model_name="reviewreport",
                    old_name="reviewhog_rpt_recent_idx",
                    new_name="review_rpt_recent_idx",
                ),
                migrations.RenameIndex(
                    model_name="reviewreport",
                    old_name="reviewhog_rpt_team_recent_idx",
                    new_name="review_rpt_team_recent_idx",
                ),
                migrations.RenameIndex(
                    model_name="reviewreport",
                    old_name="reviewhog_rpt_unclassified_idx",
                    new_name="review_rpt_unclassified_idx",
                ),
                migrations.RenameIndex(
                    model_name="reviewreportartefact",
                    old_name="reviewhog_art_report_idx",
                    new_name="review_art_report_idx",
                ),
                migrations.RenameIndex(
                    model_name="reviewreportartefact",
                    old_name="reviewhog_art_rpt_type_idx",
                    new_name="review_art_rpt_type_idx",
                ),
                migrations.RenameIndex(
                    model_name="reviewreportartefact",
                    old_name="reviewhog_art_rpt_type_ct_idx",
                    new_name="review_art_rpt_type_ct_idx",
                ),
                migrations.RenameIndex(
                    model_name="reviewskillconfig",
                    old_name="reviewhog_skillcfg_lookup_idx",
                    new_name="review_skillcfg_lookup_idx",
                ),
            ],
        )
    ]
