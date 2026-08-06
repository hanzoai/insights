import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import insights.models.utils
import insights.helpers.encrypted_fields


class Migration(migrations.Migration):
    dependencies = [
        ("insights", "1266_comment_convo_content_trgm"),
        ("cdp", "0002_alter_hogfunction_batch_export"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="hogfunction",
            name="draft",
            field=models.JSONField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="hogfunction",
            name="draft_updated_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="hogfunction",
            name="draft_encrypted_inputs",
            field=insights.helpers.encrypted_fields.EncryptedJSONStringField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="hogfunction",
            name="version",
            field=models.IntegerField(db_default=1, default=1),
        ),
        migrations.CreateModel(
            name="InsightsFunctionRevision",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=insights.models.utils.uuid7,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "version",
                    models.IntegerField(help_text="Function version this snapshot was published as."),
                ),
                (
                    "content",
                    models.JSONField(
                        help_text="Full snapshot of the function's config fields (script, inputs_schema, inputs, filters, mappings, masking) at this version."
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        db_constraint=False,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "insights_function",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="revisions",
                        to="cdp.hogfunction",
                    ),
                ),
                (
                    "team",
                    models.ForeignKey(
                        db_constraint=False,
                        on_delete=django.db.models.deletion.CASCADE,
                        to="insights.team",
                    ),
                ),
            ],
            options={
                "constraints": [
                    models.UniqueConstraint(
                        fields=("insights_function", "version"),
                        name="unique_hogfunction_revision_version",
                    )
                ],
            },
        ),
    ]
