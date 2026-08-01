from django.db import migrations


class Migration(migrations.Migration):
    """Create index on ticket.email_config_id concurrently (non-blocking)."""

    atomic = False

    dependencies = [
        ("conversations", "0028_multi_email_channel"),
    ]

    operations = [
        migrations.RunSQL(
            sql='CREATE INDEX CONCURRENTLY IF NOT EXISTS "insights_conversations_ticket_email_config_id_aa259d61" ON "insights_conversations_ticket" ("email_config_id");',
            reverse_sql='DROP INDEX CONCURRENTLY IF EXISTS "insights_conversations_ticket_email_config_id_aa259d61";',
        ),
    ]
