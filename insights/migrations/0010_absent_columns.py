"""Adopt the fifty-six columns that never got a migration.

Every one of these is on production and no migration in the tree adds any of them: they
were added by hand and the migration was never written. `schema_drift` is what sees it --
it reads the schema, where `migrate`, `migrate --check` and `showmigrations` all read the
ledger and agree that there is nothing to do. A fresh install simply gets a table without
the column, and every query naming it fails.

State-only AddFields paired with `AddColumnIfNotExists`, so both directions work: production
has the columns and a plain AddField would fail there with `column ... already exists`,
while a fresh install has none. The field comes from state rather than from a transcribed
definition, which is what keeps the repair identical to what a fresh install gets.

Only the adds: `makemigrations` also wants seventy-two DeleteModels for the models the
product moves left behind in `insights` state, and writing those would drop live tables.
"""

import django.db.models.deletion
import django.contrib.postgres.fields
from django.conf import settings
from django.db import migrations, models

from insights.migration_helpers import AddColumnIfNotExists


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("insights", "0009_absent_models"),
        # Five of these columns are foreign keys out of the app, and state has to carry the
        # model on the other end before the field can be resolved at all.
        ("conversations", "0001_initial"),
        ("customer_analytics", "0005_account"),
        ("endpoints", "0001_initial_migration"),
        ("notebooks", "0001_migrate_notebooks_models"),
        ("user_interviews", "0003_intervieweecontext"),
    ]

    state_operations = [
        migrations.AddField(
            model_name="activitylog",
            name="client",
            field=models.CharField(blank=True, max_length=32, null=True),
        ),
        migrations.AddField(
            model_name="activitylog",
            name="ip_address",
            field=models.GenericIPAddressField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="columnconfiguration",
            name="order_by",
            field=django.contrib.postgres.fields.ArrayField(
                base_field=models.TextField(), blank=True, default=None, null=True, size=None
            ),
        ),
        migrations.AddField(
            model_name="columnconfiguration",
            name="properties",
            field=models.JSONField(blank=True, default=dict, null=True),
        ),
        migrations.AddField(
            model_name="comment",
            name="completed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="comment",
            name="completed_by",
            field=models.ForeignKey(
                blank=True,
                db_index=False,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="comment",
            name="is_task",
            field=models.BooleanField(blank=True, default=False, null=True),
        ),
        migrations.AddField(
            model_name="eventingestionrestrictionconfig",
            name="args",
            field=models.JSONField(
                blank=True,
                help_text='Extra arguments for the restriction type (e.g., {"topic": "my_topic"} for redirect_to_topic)',
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="filesystem",
            name="surface",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name="filesystemshortcut",
            name="order",
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name="filesystemshortcut",
            name="surface",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name="filesystemviewlog",
            name="surface",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name="groupusagemetric",
            name="math",
            field=models.CharField(choices=[("count", "count"), ("sum", "sum")], default="count", max_length=16),
        ),
        migrations.AddField(
            model_name="groupusagemetric",
            name="math_property",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name="integration",
            name="repository_cache",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="integration",
            name="repository_cache_updated_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="materializedcolumnslot",
            name="backfill_temporal_run_id",
            field=models.CharField(blank=True, max_length=400, null=True),
        ),
        migrations.AddField(
            model_name="oauthaccesstoken",
            name="impersonated_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="oauthaccesstoken",
            name="label",
            field=models.CharField(
                blank=True,
                db_default="",
                default="",
                help_text="Optional user-facing label so a user can identify a token (per-device, per-IP, or by purpose).",
                max_length=40,
            ),
        ),
        migrations.AddField(
            model_name="oauthapplication",
            name="_provisioning_config",
            field=models.JSONField(
                blank=True,
                db_column="provisioning_config",
                db_default={},
                default=dict,
                help_text="Provisioning capabilities and per-endpoint rate limits. Every capability is off unless explicitly granted.",
            ),
        ),
        migrations.AddField(
            model_name="oauthapplication",
            name="cimd_metadata_last_fetched",
            field=models.DateTimeField(
                blank=True, help_text="When the CIMD metadata was last successfully fetched", null=True
            ),
        ),
        migrations.AddField(
            model_name="oauthapplication",
            name="cimd_metadata_url",
            field=models.URLField(
                blank=True,
                help_text="The URL used as client_id for CIMD clients. Must match the client_id in the metadata document.",
                max_length=2048,
                null=True,
                unique=True,
            ),
        ),
        migrations.AddField(
            model_name="oauthapplication",
            name="is_cimd_client",
            field=models.BooleanField(
                default=False,
                help_text="True if this client was registered via Client ID Metadata Document (CIMD)",
                verbose_name="Is CIMD client",
            ),
        ),
        migrations.AddField(
            model_name="oauthapplication",
            name="is_provisioning_partner",
            field=models.BooleanField(
                db_default=False,
                default=False,
                help_text="Whether this app may act as an agentic provisioning partner. How it authenticates follows from client_type, so there is no separate provisioning auth method.",
            ),
        ),
        migrations.AddField(
            model_name="oauthapplication",
            name="jwks_uri",
            field=models.URLField(
                blank=True,
                help_text="HTTPS URL serving the client's public keys as a JWK Set. Setting this on a confidential client switches it to private_key_jwt authentication (RFC 7523): it signs an assertion we verify against these keys instead of holding a shared secret.",
                max_length=2048,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="oauthapplication",
            name="logo_uri",
            field=models.URLField(blank=True, help_text="URL to the client's logo image", max_length=2048, null=True),
        ),
        migrations.AddField(
            model_name="oauthapplication",
            name="optional_scopes",
            field=django.contrib.postgres.fields.ArrayField(
                base_field=models.CharField(max_length=100),
                blank=True,
                db_default=[],
                default=list,
                help_text="Additive declinable scopes layered on top of the required `scopes` base — the user may decline these at consent. Requires a non-empty `scopes` (an app with optional extras must have a required base).",
                size=None,
            ),
        ),
        migrations.AddField(
            model_name="oauthapplication",
            name="scopes",
            field=django.contrib.postgres.fields.ArrayField(
                base_field=models.CharField(max_length=100),
                blank=True,
                db_default=[],
                default=list,
                help_text="Required scope ceiling — strings tokens issued for this app may carry, all required and locked on the consent screen. Empty list means a broad/deferred request (the user picks freely).",
                size=None,
            ),
        ),
        migrations.AddField(
            model_name="oauthapplication",
            name="sessions_revoked_at",
            field=models.DateTimeField(
                blank=True,
                help_text="When an admin last force-revoked every session for this app. Tokens issued before this are rejected on refresh, forcing re-authorization.",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="oauthgrant",
            name="impersonated_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="oauthrefreshtoken",
            name="impersonated_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="organization",
            name="enforce_verified_domains",
            field=models.BooleanField(
                blank=True,
                help_text="When True, logins, signups, and invites for this organization are restricted to email addresses on its verified domains.",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="organization",
            name="is_ai_training_cta_shown",
            field=models.BooleanField(
                blank=True,
                default=True,
                help_text="When True, in-app callouts inviting members to enable AI training are shown.",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="organization",
            name="is_ai_training_locked",
            field=models.BooleanField(
                blank=True,
                default=False,
                help_text="When True, the AI training opt-out setting cannot be modified through the UI or API.",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="organization",
            name="is_ai_training_opted_in",
            field=models.BooleanField(
                blank=True,
                default=True,
                help_text="When True, this organization allows its data to be used to train Insights AI models.",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="organization",
            name="is_pending_deletion",
            field=models.BooleanField(
                blank=True,
                default=False,
                help_text="Set to True when org deletion has been initiated. Blocks all UI access until the async task completes.",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="organization",
            name="members_can_create_projects",
            field=models.BooleanField(
                blank=True,
                default=False,
                help_text="When True, organization members (below admin) are allowed to create new projects. Admins and owners can always create projects.",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="organization",
            name="members_can_see_org_members",
            field=models.BooleanField(
                db_default=True,
                default=True,
                help_text="When False, members (below admin) only see themselves in the members list and only project members in access control.",
            ),
        ),
        migrations.AddField(
            model_name="organizationinvite",
            name="is_setup_delegation",
            field=models.BooleanField(
                default=False,
                help_text="True when this invite was created via the onboarding delegation flow. Downstream logic routes the delegate through full onboarding on accept.",
            ),
        ),
        migrations.AddField(
            model_name="organizationmembership",
            name="invited_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="persistedfolder",
            name="surface",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name="personalapikey",
            name="description",
            field=models.TextField(blank=True, max_length=1000, null=True),
        ),
        migrations.AddField(
            model_name="project",
            name="is_pending_deletion",
            field=models.BooleanField(
                blank=True,
                default=False,
                help_text="Set to True when project deletion has been initiated. Blocks UI access to this project until the async task completes.",
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="project",
            name="updated_at",
            field=models.DateTimeField(auto_now=True, null=True),
        ),
        migrations.AddField(
            model_name="sharingconfiguration",
            name="interviewee_context",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="sharing_configurations",
                to="user_interviews.intervieweecontext",
            ),
        ),
        migrations.AddField(
            model_name="sharingconfiguration",
            name="notebook",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="sharing_configurations",
                to="notebooks.notebook",
            ),
        ),
        migrations.AddField(
            model_name="taggeditem",
            name="account",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="tagged_items",
                to="customer_analytics.account",
            ),
        ),
        migrations.AddField(
            model_name="taggeditem",
            name="endpoint",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="tagged_items",
                to="endpoints.endpoint",
            ),
        ),
        migrations.AddField(
            model_name="taggeditem",
            name="ticket",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="tagged_items",
                to="conversations.ticket",
            ),
        ),
        migrations.AddField(
            model_name="team",
            name="event_retention_months",
            field=models.PositiveSmallIntegerField(db_default=84, default=84),
        ),
        migrations.AddField(
            model_name="team",
            name="ingested_production_event",
            field=models.BooleanField(db_default=False, default=False),
        ),
        migrations.AddField(
            model_name="team",
            name="ingested_production_event_last_checked_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="team",
            name="llm_gateway_enabled_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="team",
            name="llm_gateway_overspend_allowance_usd",
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=20, null=True),
        ),
        migrations.AddField(
            model_name="team",
            name="llm_gateway_revoked_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="team",
            name="session_recording_trigger_groups",
            field=models.JSONField(
                blank=True,
                help_text="V2 trigger groups configuration for session recording. If present, takes precedence over legacy trigger fields.",
                null=True,
            ),
        ),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(state_operations=state_operations),
        migrations.SeparateDatabaseAndState(
            database_operations=[
                AddColumnIfNotExists(model_name="activitylog", name="client"),
                AddColumnIfNotExists(model_name="activitylog", name="ip_address"),
                AddColumnIfNotExists(model_name="columnconfiguration", name="order_by"),
                AddColumnIfNotExists(model_name="columnconfiguration", name="properties"),
                AddColumnIfNotExists(model_name="comment", name="completed_at"),
                AddColumnIfNotExists(model_name="comment", name="completed_by"),
                AddColumnIfNotExists(model_name="comment", name="is_task"),
                AddColumnIfNotExists(model_name="eventingestionrestrictionconfig", name="args"),
                AddColumnIfNotExists(model_name="filesystem", name="surface"),
                AddColumnIfNotExists(model_name="filesystemshortcut", name="order"),
                AddColumnIfNotExists(model_name="filesystemshortcut", name="surface"),
                AddColumnIfNotExists(model_name="filesystemviewlog", name="surface"),
                AddColumnIfNotExists(model_name="groupusagemetric", name="math"),
                AddColumnIfNotExists(model_name="groupusagemetric", name="math_property"),
                AddColumnIfNotExists(model_name="integration", name="repository_cache"),
                AddColumnIfNotExists(model_name="integration", name="repository_cache_updated_at"),
                AddColumnIfNotExists(model_name="materializedcolumnslot", name="backfill_temporal_run_id"),
                AddColumnIfNotExists(model_name="oauthaccesstoken", name="impersonated_by"),
                AddColumnIfNotExists(model_name="oauthaccesstoken", name="label"),
                AddColumnIfNotExists(model_name="oauthapplication", name="_provisioning_config"),
                AddColumnIfNotExists(model_name="oauthapplication", name="cimd_metadata_last_fetched"),
                AddColumnIfNotExists(model_name="oauthapplication", name="cimd_metadata_url"),
                AddColumnIfNotExists(model_name="oauthapplication", name="is_cimd_client"),
                AddColumnIfNotExists(model_name="oauthapplication", name="is_provisioning_partner"),
                AddColumnIfNotExists(model_name="oauthapplication", name="jwks_uri"),
                AddColumnIfNotExists(model_name="oauthapplication", name="logo_uri"),
                AddColumnIfNotExists(model_name="oauthapplication", name="optional_scopes"),
                AddColumnIfNotExists(model_name="oauthapplication", name="scopes"),
                AddColumnIfNotExists(model_name="oauthapplication", name="sessions_revoked_at"),
                AddColumnIfNotExists(model_name="oauthgrant", name="impersonated_by"),
                AddColumnIfNotExists(model_name="oauthrefreshtoken", name="impersonated_by"),
                AddColumnIfNotExists(model_name="organization", name="enforce_verified_domains"),
                AddColumnIfNotExists(model_name="organization", name="is_ai_training_cta_shown"),
                AddColumnIfNotExists(model_name="organization", name="is_ai_training_locked"),
                AddColumnIfNotExists(model_name="organization", name="is_ai_training_opted_in"),
                AddColumnIfNotExists(model_name="organization", name="is_pending_deletion"),
                AddColumnIfNotExists(model_name="organization", name="members_can_create_projects"),
                AddColumnIfNotExists(model_name="organization", name="members_can_see_org_members"),
                AddColumnIfNotExists(model_name="organizationinvite", name="is_setup_delegation"),
                AddColumnIfNotExists(model_name="organizationmembership", name="invited_by"),
                AddColumnIfNotExists(model_name="persistedfolder", name="surface"),
                AddColumnIfNotExists(model_name="personalapikey", name="description"),
                AddColumnIfNotExists(model_name="project", name="is_pending_deletion"),
                AddColumnIfNotExists(model_name="project", name="updated_at"),
                AddColumnIfNotExists(model_name="sharingconfiguration", name="interviewee_context"),
                AddColumnIfNotExists(model_name="sharingconfiguration", name="notebook"),
                AddColumnIfNotExists(model_name="taggeditem", name="account"),
                AddColumnIfNotExists(model_name="taggeditem", name="endpoint"),
                AddColumnIfNotExists(model_name="taggeditem", name="ticket"),
                AddColumnIfNotExists(model_name="team", name="event_retention_months"),
                AddColumnIfNotExists(model_name="team", name="ingested_production_event"),
                AddColumnIfNotExists(model_name="team", name="ingested_production_event_last_checked_at"),
                AddColumnIfNotExists(model_name="team", name="llm_gateway_enabled_at"),
                AddColumnIfNotExists(model_name="team", name="llm_gateway_overspend_allowance_usd"),
                AddColumnIfNotExists(model_name="team", name="llm_gateway_revoked_at"),
                AddColumnIfNotExists(model_name="team", name="session_recording_trigger_groups"),
            ],
        ),
    ]
