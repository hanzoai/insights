import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import insights.models.utils


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("conversations", "0050_alter_ticket_priority"),
    ]

    operations = [
        migrations.CreateModel(
            name="TicketViewFavorite",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=insights.models.utils.uuid7, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "team",
                    models.ForeignKey(
                        db_constraint=False, on_delete=django.db.models.deletion.CASCADE, to="insights.team"
                    ),
                ),
                (
                    "ticket_view",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="favorites",
                        to="conversations.ticketview",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        db_constraint=False,
                        on_delete=django.db.models.deletion.CASCADE,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "insights_conversations_ticket_view_favorites",
                "unique_together": {("ticket_view", "user")},
                "indexes": [models.Index(fields=["team_id", "user"], name="conv_ticket_view_fav_idx")],
            },
        ),
    ]
