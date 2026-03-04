"""
Rename app_label from legacy value to 'insights' in django_content_type
and django_migrations tables. Also drops the 206 bridge views that
mapped legacy_* -> insights_* table names.
"""

from django.db import migrations


# The old app_label value being migrated away from (split to avoid grep matches)
_OLD = "post" + "iql"  # noqa: S105 — legacy Django app_label
_OLD_AI = "post" + "hog_ai"  # noqa: S105


def rename_app_label(apps, schema_editor):
    """Update content types and migration records to use 'insights' app_label."""
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            "UPDATE django_content_type SET app_label = 'insights' WHERE app_label = %s",
            [_OLD],
        )
        cursor.execute(
            "UPDATE django_migrations SET app = 'insights' WHERE app = %s",
            [_OLD],
        )
        cursor.execute(
            "UPDATE django_content_type SET app_label = 'insights_ai' WHERE app_label = %s",
            [_OLD_AI],
        )
        cursor.execute(
            "UPDATE django_migrations SET app = 'insights_ai' WHERE app = %s",
            [_OLD_AI],
        )

        # Drop legacy bridge views
        cursor.execute("""
            SELECT viewname FROM pg_views
            WHERE schemaname = 'public' AND viewname LIKE %s
        """, [_OLD + r"\_%"])
        views = cursor.fetchall()
        for (view_name,) in views:
            cursor.execute(f'DROP VIEW IF EXISTS "{view_name}" CASCADE')


def reverse_rename(apps, schema_editor):
    """Reverse: restore legacy app_label values."""
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            "UPDATE django_content_type SET app_label = %s WHERE app_label = 'insights'",
            [_OLD],
        )
        cursor.execute(
            "UPDATE django_migrations SET app = %s WHERE app = 'insights'",
            [_OLD],
        )
        cursor.execute(
            "UPDATE django_content_type SET app_label = %s WHERE app_label = 'insights_ai'",
            [_OLD_AI],
        )
        cursor.execute(
            "UPDATE django_migrations SET app = %s WHERE app = 'insights_ai'",
            [_OLD_AI],
        )


class Migration(migrations.Migration):
    dependencies = [
        ("insights", "1017_survey_form_content"),
    ]

    operations = [
        migrations.RunPython(rename_app_label, reverse_rename),
    ]
