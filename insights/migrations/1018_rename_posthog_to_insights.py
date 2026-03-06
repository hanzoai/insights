"""
Rename app_label from 'posthog' to 'insights' in django_content_type
and django_migrations tables. Also drops the 206 bridge views that
mapped posthog_* → insights_* table names.
"""

from django.db import migrations


def rename_app_label(apps, schema_editor):
    """Update content types and migration records from posthog → insights."""
    db = schema_editor.connection.alias
    with schema_editor.connection.cursor() as cursor:
        # Update django_content_type
        cursor.execute(
            "UPDATE django_content_type SET app_label = 'insights' WHERE app_label = 'posthog'"
        )

        # Update django_migrations
        cursor.execute(
            "UPDATE django_migrations SET app = 'insights' WHERE app = 'posthog'"
        )

        # Also update posthog_ai → insights_ai
        cursor.execute(
            "UPDATE django_content_type SET app_label = 'insights_ai' WHERE app_label = 'posthog_ai'"
        )
        cursor.execute(
            "UPDATE django_migrations SET app = 'insights_ai' WHERE app = 'posthog_ai'"
        )

        # Drop the 206 bridge views (posthog_* → insights_*)
        cursor.execute("""
            SELECT viewname FROM pg_views
            WHERE schemaname = 'public' AND viewname LIKE 'posthog\\_%'
        """)
        views = cursor.fetchall()
        for (view_name,) in views:
            cursor.execute(f'DROP VIEW IF EXISTS "{view_name}" CASCADE')


def reverse_rename(apps, schema_editor):
    """Reverse: update content types from insights → posthog."""
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            "UPDATE django_content_type SET app_label = 'posthog' WHERE app_label = 'insights'"
        )
        cursor.execute(
            "UPDATE django_migrations SET app = 'posthog' WHERE app = 'insights'"
        )
        cursor.execute(
            "UPDATE django_content_type SET app_label = 'posthog_ai' WHERE app_label = 'insights_ai'"
        )
        cursor.execute(
            "UPDATE django_migrations SET app = 'posthog_ai' WHERE app = 'insights_ai'"
        )


class Migration(migrations.Migration):
    dependencies = [
        ("insights", "1017_survey_form_content"),
    ]

    operations = [
        migrations.RunPython(rename_app_label, reverse_rename),
    ]
