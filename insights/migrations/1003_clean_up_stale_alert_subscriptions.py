from django.db import migrations


def clean_up_stale_alert_subscriptions(apps, schema_editor):
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("""
            DELETE FROM insights_alertsubscription
            WHERE id IN (
                SELECT sub.id
                FROM insights_alertsubscription sub
                JOIN insights_alertconfiguration ac ON ac.id = sub.alert_configuration_id
                JOIN insights_team t ON t.id = ac.team_id
                LEFT JOIN insights_organizationmembership om
                    ON om.user_id = sub.user_id
                    AND om.organization_id = t.organization_id
                WHERE om.id IS NULL
            )
        """)


class Migration(migrations.Migration):
    dependencies = [
        ("insights", "1002_experiment_exposure_preaggregation_enabled"),
    ]

    operations = [
        migrations.RunPython(
            clean_up_stale_alert_subscriptions,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
