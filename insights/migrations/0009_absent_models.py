"""Adopt the eleven models that never got a migration.

Every one of these tables is in production, and no migration in the tree creates any of
them: they were built by hand and the migration was never written. `makemigrations` cannot
see that -- it compares models to migration state, and these models are absent from state,
so it reports them as a pending change forever while `migrate` reports nothing to do.
A fresh install gets no table at all, which is what `schema_drift` catches and the ledger
does not.

The creates are state-only, paired with `CreateTableIfNotExists`, because both directions
have to work: production has the tables and would fail a plain `CreateModel` with
`already exists`, while a fresh install has none and needs them built. Taking the shape
from state rather than from a transcribed field list is what keeps the repair identical to
what a fresh install gets.

Indexes and constraints ride along in the state operations, so a fresh install gets them
when the table is created here. An existing table keeps whatever it was built with; this
migration will not alter it, which is the price of never failing on a database it did not
create.
"""

import django.utils.timezone
import django.db.models.deletion
import django.contrib.postgres.fields
import django.db.models.functions.text
from django.conf import settings
from django.db import migrations, models

import insights.uuidt
from insights.migration_helpers import CreateTableIfNotExists


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("insights", "0008_identity_provider_config"),
    ]

    state_operations = [
        migrations.CreateModel(
            name="CIMDBlocklistEntry",
            fields=[
                (
                    "id",
                    models.UUIDField(default=insights.uuidt.UUIDT, editable=False, primary_key=True, serialize=False),
                ),
                ("cimd_url", models.URLField(max_length=2048, unique=True)),
                ("reason", models.CharField(blank=True, default="", max_length=200)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
            ],
            options={
                "verbose_name": "CIMD Blocklist Entry",
                "verbose_name_plural": "CIMD Blocklist Entries",
            },
        ),
        migrations.CreateModel(
            name="CIMDVerificationToken",
            fields=[
                (
                    "id",
                    models.UUIDField(default=insights.uuidt.UUIDT, editable=False, primary_key=True, serialize=False),
                ),
                ("label", models.CharField(max_length=40)),
                ("mask_value", models.CharField(editable=False, max_length=11, null=True)),
                ("secure_value", models.CharField(editable=False, max_length=300, unique=True)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("last_used_at", models.DateTimeField(blank=True, null=True)),
            ],
            options={
                "verbose_name": "CIMD Verification Token",
                "verbose_name_plural": "CIMD Verification Tokens",
            },
        ),
        migrations.CreateModel(
            name="DataDeletionRequest",
            fields=[
                (
                    "id",
                    models.UUIDField(default=insights.uuidt.uuid7, editable=False, primary_key=True, serialize=False),
                ),
                ("team_id", models.IntegerField()),
                (
                    "request_type",
                    models.CharField(
                        choices=[
                            ("property_removal", "Property Removal"),
                            ("event_removal", "Event Removal"),
                            ("person_removal", "Person Removal"),
                        ],
                        help_text="property_removal: remove specific properties from matching events. event_removal: delete entire events matching the criteria.",
                        max_length=40,
                    ),
                ),
                ("start_time", models.DateTimeField(blank=True, null=True)),
                ("end_time", models.DateTimeField(blank=True, null=True)),
                (
                    "events",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.CharField(max_length=1024),
                        blank=True,
                        default=list,
                        help_text="Event names to match. May be empty only when delete_all_events is true.",
                        size=None,
                    ),
                ),
                (
                    "delete_all_events",
                    models.BooleanField(
                        default=False,
                        help_text="Opt in to matching every event for the team in the given time range. For event_removal this deletes every event; for property_removal it removes the property from every event. Not valid for person_removal. Requires events to be empty.",
                    ),
                ),
                (
                    "insightsql_predicate",
                    models.TextField(
                        blank=True,
                        default="",
                        help_text="Optional InsightsQL boolean expression to further narrow matching events. Validated against the events table at save time. Combined with the other filters (team/timestamp/events) via AND. Example: properties.$browser = 'Chrome'.",
                    ),
                ),
                (
                    "properties",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.CharField(max_length=1024),
                        blank=True,
                        default=list,
                        help_text="Property names to remove from events.properties. Required for property_removal requests when person_properties is empty.",
                        size=None,
                    ),
                ),
                (
                    "person_properties",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.CharField(max_length=1024),
                        blank=True,
                        default=list,
                        help_text="Property names to remove from events.person_properties. Required for property_removal requests when properties is empty.",
                        null=True,
                        size=None,
                    ),
                ),
                (
                    "person_uuids",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.UUIDField(),
                        blank=True,
                        default=list,
                        help_text="Person UUIDs to target. Mutually exclusive with person_distinct_ids; max 1000.",
                        size=None,
                    ),
                ),
                (
                    "person_distinct_ids",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.CharField(max_length=400),
                        blank=True,
                        default=list,
                        help_text="Person distinct IDs to target. Mutually exclusive with person_uuids; max 1000.",
                        size=None,
                    ),
                ),
                (
                    "person_drop_profiles",
                    models.BooleanField(
                        blank=True,
                        default=None,
                        help_text="Drop person profiles (Postgres + Datastore tombstone). NULL when not a person_removal request.",
                        null=True,
                    ),
                ),
                (
                    "person_drop_events",
                    models.BooleanField(
                        blank=True,
                        default=None,
                        help_text="Drop event records linked to these persons. NULL when not a person_removal request.",
                        null=True,
                    ),
                ),
                (
                    "person_drop_recordings",
                    models.BooleanField(
                        blank=True,
                        default=None,
                        help_text="Drop session recordings linked to these persons. NULL when not a person_removal request.",
                        null=True,
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("draft", "Draft"),
                            ("pending", "Pending"),
                            ("approved", "Approved"),
                            ("in_progress", "In Progress"),
                            ("queued", "Queued"),
                            ("completed", "Completed"),
                            ("failed", "Failed"),
                        ],
                        default="draft",
                        max_length=40,
                    ),
                ),
                (
                    "count",
                    models.BigIntegerField(blank=True, help_text="Number of events matching criteria", null=True),
                ),
                ("part_count", models.IntegerField(blank=True, help_text="Number of Datastore parts", null=True)),
                ("parts_size", models.BigIntegerField(blank=True, null=True)),
                ("parts_row_count", models.BigIntegerField(blank=True, null=True)),
                (
                    "min_timestamp",
                    models.DateTimeField(blank=True, help_text="Earliest timestamp of matching events.", null=True),
                ),
                (
                    "max_timestamp",
                    models.DateTimeField(blank=True, help_text="Latest timestamp of matching events.", null=True),
                ),
                ("stats_calculated_at", models.DateTimeField(blank=True, null=True)),
                ("notes", models.TextField(blank=True, default="")),
                (
                    "created_by_staff",
                    models.BooleanField(blank=True, help_text="Was this created by instance operator.", null=True),
                ),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "criteria_updated_at",
                    models.DateTimeField(blank=True, help_text="When deletion criteria were last changed.", null=True),
                ),
                (
                    "requires_approval",
                    models.BooleanField(
                        default=True,
                        help_text="Force manual Datastore Team approval, opting out of auto-approval. Datastore deletes are heavyweight mutations that can degrade query performance and increase disk usage while running, so approval ensures they are scheduled during low-traffic windows. Small event_removal requests are cheap enough to skip that review, so the auto-approval sweep job approves them unless this is set. Written by the submit page only.",
                    ),
                ),
                ("approved", models.BooleanField(default=False)),
                (
                    "approved_automatically",
                    models.BooleanField(
                        default=False,
                        help_text="Approved by the auto-approval sweep job rather than a person. approved_by is NULL for these.",
                    ),
                ),
                ("approved_at", models.DateTimeField(blank=True, null=True)),
                (
                    "execution_mode",
                    models.CharField(
                        choices=[("immediate", "Immediate"), ("deferred", "Deferred")],
                        default="immediate",
                        help_text="Picked by Datastore Team at approval time. Immediate: run a dedicated delete mutation now. Deferred: queue event UUIDs into adhoc_events_deletion so the scheduled deletes_job drains them. Only honored for event_removal.",
                        max_length=20,
                    ),
                ),
                (
                    "attempt_count",
                    models.PositiveIntegerField(
                        default=0,
                        help_text="Number of times execution has been attempted. Incremented when a load_* op transitions the request to IN_PROGRESS.",
                    ),
                ),
                (
                    "first_executed_at",
                    models.DateTimeField(
                        blank=True,
                        help_text="When execution was first attempted (set on the first APPROVED → IN_PROGRESS transition).",
                        null=True,
                    ),
                ),
                (
                    "last_executed_at",
                    models.DateTimeField(
                        blank=True,
                        help_text="When execution was most recently attempted (updated on every APPROVED → IN_PROGRESS transition).",
                        null=True,
                    ),
                ),
                (
                    "last_dagster_run_id",
                    models.CharField(
                        blank=True,
                        help_text="Dagster run ID of the most recent execution attempt (set on every APPROVED → IN_PROGRESS transition). Rendered as a link to the Dagster run in the admin.",
                        max_length=255,
                        null=True,
                    ),
                ),
                (
                    "property_removal_marker",
                    models.DateTimeField(
                        blank=True,
                        help_text="inserted_at/_timestamp stamp applied to cleaned re-inserts of this property_removal request. Set once on the first execution attempt and reused by every retry so re-runs recognize already-cleaned rows and never insert a second copy. Cleared when deletion criteria change.",
                        null=True,
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="EventFilterConfig",
            fields=[
                (
                    "id",
                    models.UUIDField(default=insights.uuidt.UUIDT, editable=False, primary_key=True, serialize=False),
                ),
                (
                    "mode",
                    models.CharField(
                        choices=[("disabled", "Disabled"), ("dry_run", "Dry Run"), ("live", "Live")],
                        default="disabled",
                        max_length=20,
                    ),
                ),
                (
                    "filter_tree",
                    models.JSONField(
                        blank=True,
                        default=None,
                        help_text='Boolean expression tree. Nodes: {"type": "and"|"or", "children": [...]}, {"type": "not", "child": {...}}, {"type": "condition", "field": "event_name"|"distinct_id", "operator": "exact"|"contains", "value": "<string>"}',
                        null=True,
                    ),
                ),
                (
                    "test_cases",
                    models.JSONField(
                        blank=True,
                        default=list,
                        help_text='Test events to validate the filter. Each: {"event_name": "...", "distinct_id": "...", "expected_result": "drop"|"ingest"}',
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="GlobalRateLimitThresholdConfig",
            fields=[
                (
                    "id",
                    models.UUIDField(default=insights.uuidt.uuid7, editable=False, primary_key=True, serialize=False),
                ),
                ("token", models.CharField(max_length=200)),
                (
                    "distinct_id",
                    models.CharField(
                        blank=True,
                        default="",
                        help_text="Optional. Empty applies the threshold to the whole token; set applies it only to this token and distinct_id.",
                        max_length=450,
                    ),
                ),
                (
                    "threshold",
                    models.PositiveBigIntegerField(
                        help_text="Max events allowed per rate-limit window for this key. 0 rate-limits the key to zero, but the limiter is cache-based so an isolated event may still pass on a cold cache miss; to block a key permanently use an EventRestriction in the Django admin."
                    ),
                ),
                (
                    "note",
                    models.TextField(
                        blank=True, help_text="Optional note explaining why this override exists", null=True
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name="IntegrationRepositoryCacheEntry",
            fields=[
                (
                    "id",
                    models.UUIDField(default=insights.uuidt.uuid7, editable=False, primary_key=True, serialize=False),
                ),
                ("full_name", models.TextField()),
                ("description", models.TextField(blank=True, null=True)),
                ("topics", models.JSONField(blank=True, default=list)),
                ("archived", models.BooleanField(default=False)),
                ("fork", models.BooleanField(default=False)),
                ("primary_language", models.TextField(blank=True, null=True)),
                ("default_branch", models.TextField()),
                ("default_branch_sha", models.TextField()),
                ("readme", models.TextField(blank=True, default="")),
                ("tree_paths", models.TextField(blank=True, default="")),
                ("tree_truncated", models.BooleanField(default=False)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name="RepoRoutingRule",
            fields=[
                (
                    "id",
                    models.UUIDField(default=insights.uuidt.uuid7, editable=False, primary_key=True, serialize=False),
                ),
                ("rule_text", models.TextField()),
                ("repository", models.CharField(max_length=255)),
                ("priority", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["priority", "id"],
            },
        ),
        migrations.CreateModel(
            name="RoleExternalReference",
            fields=[
                (
                    "id",
                    models.UUIDField(default=insights.uuidt.uuid7, editable=False, primary_key=True, serialize=False),
                ),
                ("provider", models.CharField(max_length=32)),
                ("provider_organization_id", models.CharField(max_length=255)),
                ("provider_role_id", models.CharField(max_length=255)),
                ("provider_role_slug", models.CharField(blank=True, max_length=255, null=True)),
                ("provider_role_name", models.CharField(max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name="TeamJsSnippetConfig",
            fields=[
                (
                    "team",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        primary_key=True,
                        serialize=False,
                        to="insights.team",
                    ),
                ),
                ("js_snippet_version", models.CharField(blank=True, default=None, max_length=50, null=True)),
            ],
        ),
        migrations.CreateModel(
            name="TeamProvisioningConfig",
            fields=[
                (
                    "team",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        primary_key=True,
                        serialize=False,
                        to="insights.team",
                    ),
                ),
                ("stripe_project_id", models.CharField(blank=True, max_length=255, null=True, unique=True)),
                ("service_id", models.CharField(default="analytics", max_length=255)),
            ],
        ),
        migrations.CreateModel(
            name="UserRepoPreference",
            fields=[
                (
                    "id",
                    models.UUIDField(default=insights.uuidt.uuid7, editable=False, primary_key=True, serialize=False),
                ),
                ("scope_type", models.CharField(choices=[("slack_channel", "Slack Channel")], max_length=32)),
                ("scope_id", models.CharField(blank=True, default="", max_length=128)),
                ("repository", models.CharField(max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.AddField(
            model_name="cimdblocklistentry",
            name="created_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="cimdverificationtoken",
            name="created_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="cimdverificationtoken",
            name="organization",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="cimd_verification_tokens",
                to="insights.organization",
            ),
        ),
        migrations.AddField(
            model_name="datadeletionrequest",
            name="approved_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="data_deletion_requests_approved",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="datadeletionrequest",
            name="created_by",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="data_deletion_requests_created",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="datadeletionrequest",
            name="criteria_updated_by",
            field=models.ForeignKey(
                blank=True,
                help_text="Last user who changed deletion criteria (events, properties, time range, or request type).",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="data_deletion_requests_criteria_updated",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="eventfilterconfig",
            name="created_by",
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL
            ),
        ),
        migrations.AddField(
            model_name="eventfilterconfig",
            name="team",
            field=models.OneToOneField(
                on_delete=django.db.models.deletion.CASCADE, related_name="event_filter", to="insights.team"
            ),
        ),
        migrations.AddField(
            model_name="integrationrepositorycacheentry",
            name="integration",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="repository_cache_entries",
                to="insights.integration",
            ),
        ),
        migrations.AddField(
            model_name="integrationrepositorycacheentry",
            name="team",
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="insights.team"),
        ),
        migrations.AddField(
            model_name="integrationrepositorycacheentry",
            name="user_integration",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="repository_cache_entries",
                to="insights.userintegration",
            ),
        ),
        migrations.AddField(
            model_name="reporoutingrule",
            name="created_by",
            field=models.ForeignKey(
                null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL
            ),
        ),
        migrations.AddField(
            model_name="reporoutingrule",
            name="team",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, related_name="repo_routing_rules", to="insights.team"
            ),
        ),
        migrations.AddField(
            model_name="roleexternalreference",
            name="created_by",
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL
            ),
        ),
        migrations.AddField(
            model_name="roleexternalreference",
            name="organization",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="role_external_references",
                to="insights.organization",
            ),
        ),
        migrations.AddField(
            model_name="roleexternalreference",
            name="role",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, related_name="role_external_references", to="insights.role"
            ),
        ),
        migrations.AddField(
            model_name="teamprovisioningconfig",
            name="application",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="provisioned_team_configs",
                to=settings.OAUTH2_PROVIDER_APPLICATION_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="userrepopreference",
            name="team",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE, related_name="user_repo_preferences", to="insights.team"
            ),
        ),
        migrations.AddField(
            model_name="userrepopreference",
            name="user",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="user_repo_preferences",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddIndex(
            model_name="integrationrepositorycacheentry",
            index=models.Index(fields=["team", "updated_at"], name="insights_in_team_id_a0d10d_idx"),
        ),
        migrations.AddConstraint(
            model_name="integrationrepositorycacheentry",
            constraint=models.UniqueConstraint(
                condition=models.Q(("integration__isnull", False)),
                fields=("integration", "full_name"),
                name="integration_full_name_unique",
            ),
        ),
        migrations.AddConstraint(
            model_name="integrationrepositorycacheentry",
            constraint=models.UniqueConstraint(
                condition=models.Q(("user_integration__isnull", False)),
                fields=("user_integration", "team", "full_name"),
                name="user_integration_team_full_name_unique",
            ),
        ),
        migrations.AddConstraint(
            model_name="integrationrepositorycacheentry",
            constraint=models.CheckConstraint(
                condition=models.Q(
                    models.Q(("integration__isnull", False), ("user_integration__isnull", True)),
                    models.Q(("integration__isnull", True), ("user_integration__isnull", False)),
                    _connector="OR",
                ),
                name="integration_xor_user_integration",
            ),
        ),
        migrations.AddIndex(
            model_name="reporoutingrule",
            index=models.Index(fields=["team", "priority"], name="idx_repo_routing_rule_team"),
        ),
        migrations.AddIndex(
            model_name="roleexternalreference",
            index=models.Index(
                fields=["provider", "provider_organization_id", "provider_role_slug"],
                name="idx_role_ext_ref_slug_lookup",
            ),
        ),
        migrations.AddIndex(
            model_name="roleexternalreference",
            index=models.Index(
                fields=["provider", "provider_organization_id", "provider_role_id"], name="idx_role_ext_ref_id_lookup"
            ),
        ),
        migrations.AddConstraint(
            model_name="roleexternalreference",
            constraint=models.UniqueConstraint(
                django.db.models.functions.text.Lower("provider_organization_id"),
                django.db.models.functions.text.Lower("provider_role_slug"),
                models.F("organization"),
                models.F("provider"),
                name="unique_role_ext_ref_slug_per_org",
            ),
        ),
        migrations.AddConstraint(
            model_name="roleexternalreference",
            constraint=models.UniqueConstraint(
                django.db.models.functions.text.Lower("provider_organization_id"),
                django.db.models.functions.text.Lower("provider_role_id"),
                models.F("organization"),
                models.F("provider"),
                name="unique_role_ext_ref_id_per_org",
            ),
        ),
        migrations.AddIndex(
            model_name="teamprovisioningconfig",
            index=models.Index(fields=["application"], name="tpc_application_idx"),
        ),
        migrations.AddIndex(
            model_name="userrepopreference",
            index=models.Index(fields=["team", "user", "scope_type"], name="idx_user_repo_pref_lookup"),
        ),
        migrations.AddConstraint(
            model_name="userrepopreference",
            constraint=models.UniqueConstraint(
                fields=("team", "user", "scope_type", "scope_id"), name="uniq_user_repo_preference"
            ),
        ),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(state_operations=state_operations),
        migrations.SeparateDatabaseAndState(
            database_operations=[
                CreateTableIfNotExists(model_name="cimdblocklistentry"),
                CreateTableIfNotExists(model_name="cimdverificationtoken"),
                CreateTableIfNotExists(model_name="datadeletionrequest"),
                CreateTableIfNotExists(model_name="eventfilterconfig"),
                CreateTableIfNotExists(model_name="globalratelimitthresholdconfig"),
                CreateTableIfNotExists(model_name="integrationrepositorycacheentry"),
                CreateTableIfNotExists(model_name="reporoutingrule"),
                CreateTableIfNotExists(model_name="roleexternalreference"),
                CreateTableIfNotExists(model_name="teamjssnippetconfig"),
                CreateTableIfNotExists(model_name="teamprovisioningconfig"),
                CreateTableIfNotExists(model_name="userrepopreference"),
            ],
        ),
    ]
