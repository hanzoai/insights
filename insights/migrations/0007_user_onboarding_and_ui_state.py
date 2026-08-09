import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    """Declare the eight User columns the model has and the database does not.

    Signing in was impossible: /complete/oidc/ answered 500 with

        column insights_user.hide_mcp_hints does not exist

    Authentication reads the user row, so every scene behind login was
    unreachable — the site served its signed-out pages the whole time, which is
    why it looked up.

    The columns were never declared anywhere. `insights` was squashed to a small
    initial set that captured the tables as they stood, and these fields landed
    on the model afterwards without a migration to carry them, so no history
    creates them and no amount of running the backlog would. Confirmed by
    grepping every migration in the tree for each name: zero hits.

    All eight are additive and safe on a populated table — seven are NULL-able
    and hide_mcp_hints carries a db_default, so no row needs rewriting and there
    is nothing to backfill. The FK is db_index=False, matching the model, so this
    does not build an index over the user table either.

    Fields are Django's own deconstruction of the live model rather than
    hand-written, so the column types are what the ORM will actually query for.
    """

    dependencies = [
        ("insights", "0006_user_credentials_reviewed_at"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="hide_mcp_hints",
            field=models.BooleanField(
                db_default=False,
                default=False,
                help_text="When true, the user has opted out of in-app hints promoting the Insights MCP integration after taking actions.",
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="ui_configuration",
            field=models.JSONField(
                blank=True,
                help_text="Per-user UI customization (currently sidebar element visibility), shaped like the UserUIConfiguration schema. NULL means the user has no customization and every element shows.",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="onboarding_skipped_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="user",
            name="onboarding_skipped_reason",
            field=models.CharField(
                blank=True,
                choices=[
                    ("delegated", "Delegated to teammate"),
                    ("later", "Skipped for later"),
                    ("other", "Other"),
                    ("provisioned", "Account provisioned by a partner"),
                ],
                max_length=32,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="onboarding_skipped_organization_id",
            field=models.UUIDField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="user",
            name="onboarding_delegated_to_invite",
            field=models.ForeignKey(
                blank=True,
                db_index=False,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="delegating_users",
                to="insights.organizationinvite",
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="onboarding_delegated_to_organization_id",
            field=models.UUIDField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="user",
            name="onboarding_delegation_accepted_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
