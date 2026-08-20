import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import insights.helpers.encrypted_fields
import insights.models.utils


class Migration(migrations.Migration):
    """Create the two `insights` models that had models but never had a migration.

    `UserIntegration` and `UserPushToken` are declared in insights/models/ and used
    in anger — products.tasks carries FKs to both — but no migration ever created
    them, so `insights.userintegration` and `insights.userpushtoken` were absent from
    migration state and those FKs could not resolve. That failed the whole project
    state, which is what stopped `migrate` from running at all.

    Neither table exists in any database (checked against production before writing
    this), so these are ordinary CreateModels rather than an adoption of something
    already there.

    Both FKs to insights_user carry `db_constraint=False`. That table is read on
    virtually every request, and creating an FK constraint against it takes a
    SHARE ROW EXCLUSIVE lock that conflicts with every write; without the
    constraint there is no lock at all. `on_delete=CASCADE` still holds — Django's
    collector performs it.
    """

    dependencies = [
        ("insights", "0004_heatmaps_on_by_default"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="UserIntegration",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=insights.models.utils.uuid7, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("kind", models.CharField(choices=[("github", "Github"), ("slack", "Slack")], max_length=32)),
                ("integration_id", models.TextField()),
                ("config", models.JSONField(default=dict)),
                ("sensitive_config", insights.helpers.encrypted_fields.EncryptedJSONField(default=dict)),
                ("repository_cache", models.JSONField(blank=True, default=list)),
                ("repository_cache_updated_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.ForeignKey(
                        db_constraint=False,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="integrations",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "insights_user_integration",
                "indexes": [
                    models.Index(fields=["kind", "integration_id"], name="user_integration_kind_extid")
                ],
                "unique_together": {("user", "kind", "integration_id")},
            },
        ),
        migrations.CreateModel(
            name="UserPushToken",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=insights.models.utils.uuid7, editable=False, primary_key=True, serialize=False
                    ),
                ),
                (
                    "token",
                    models.TextField(
                        help_text="Opaque push token issued by the platform push service (e.g. Expo push token)."
                    ),
                ),
                (
                    "platform",
                    models.CharField(
                        choices=[("ios", "iOS"), ("android", "Android"), ("web", "Web")],
                        help_text="Device platform the token was issued for.",
                        max_length=16,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "last_seen_at",
                    models.DateTimeField(
                        auto_now=True,
                        help_text="Last time the mobile app re-registered this token. Bumped on every save.",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        db_constraint=False,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="push_tokens",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "insights_user_push_token",
                "unique_together": {("user", "token")},
            },
        ),
    ]
