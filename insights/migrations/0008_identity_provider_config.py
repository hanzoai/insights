import django.contrib.postgres.fields
import django.db.models.deletion
from django.db import migrations, models

import insights.uuidt


class Migration(migrations.Migration):
    """Declare the IdP config models, and the four OrganizationDomain columns nothing creates.

    Signing in was impossible. /complete/oidc/ answered 500 with

        column insights_organizationdomain.id_jag_issuer_url does not exist

    The OIDC callback resolves an email domain to an organization, so it selects
    OrganizationDomain rows; Django puts every local field in that SELECT, and
    four of them have no column. Every sign-in died there — the site served its
    signed-out pages the whole time, which is why it looked up.

    Same cause as [0007]: the fields arrived on the models during an upstream
    rebase and no migration came with them. `insights` was squashed to a small
    initial set, so nothing in history creates these and running the backlog
    would not either. Confirmed by grepping every migration in the tree for
    `id_jag_issuer_url` and for `IdentityProviderConfig`: zero hits, and both
    tables report `exists=False` against the live database.

    Do NOT reach for `makemigrations` here. The database still carries ~900
    pre-squash migration records that the squashed tree does not contain, so
    Django reads the difference as deletions and offers 179 RemoveField and 72
    DeleteModel operations. That would drop live tables. This migration is
    written to the four columns and two tables actually missing, and nothing
    else.

    All of it is additive. The three id_jag columns are NULL-able, the FK is
    SET_NULL, and both tables are new, so no existing row is rewritten and there
    is nothing to backfill.
    """

    dependencies = [
        ("insights", "0007_user_onboarding_and_ui_state"),
    ]

    operations = [
        migrations.CreateModel(
            name="IdentityProviderConfig",
            fields=[
                ("id", models.UUIDField(default=insights.uuidt.uuid7, editable=False, primary_key=True, serialize=False)),
                (
                    "name",
                    models.CharField(
                        blank=True,
                        default="",
                        help_text="Display name for this IdP configuration (e.g. 'Okta production').",
                        max_length=255,
                    ),
                ),
                (
                    "domain_scope",
                    models.CharField(
                        blank=True, choices=[("all", "All"), ("selected", "Selected")], max_length=8, null=True
                    ),
                ),
                (
                    "config_scope",
                    models.CharField(
                        blank=True,
                        choices=[("saml", "Saml"), ("scim", "Scim"), ("xaa", "Xaa")],
                        max_length=4,
                        null=True,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("saml_entity_id", models.CharField(blank=True, max_length=512, null=True)),
                ("saml_acs_url", models.CharField(blank=True, max_length=512, null=True)),
                ("saml_x509_cert", models.TextField(blank=True, null=True)),
                ("saml_relay_state", models.CharField(blank=True, max_length=36, null=True)),
                ("scim_slug", models.CharField(blank=True, max_length=36, null=True, unique=True)),
                ("scim_enabled", models.BooleanField(default=False)),
                (
                    "scim_bearer_token",
                    models.CharField(
                        blank=True,
                        help_text="Hashed bearer token for SCIM authentication",
                        max_length=255,
                        null=True,
                    ),
                ),
                (
                    "id_jag_issuer_url",
                    models.CharField(
                        blank=True,
                        help_text="Trusted IdP issuer URL for ID-JAG. Required to enable ID-JAG.",
                        max_length=512,
                        null=True,
                    ),
                ),
                (
                    "id_jag_jwks_url",
                    models.CharField(
                        blank=True,
                        help_text="Override JWKS URL. Defaults to OIDC discovery on the issuer URL.",
                        max_length=512,
                        null=True,
                    ),
                ),
                (
                    "id_jag_allowed_clients",
                    django.contrib.postgres.fields.ArrayField(
                        base_field=models.CharField(max_length=256),
                        blank=True,
                        default=list,
                        help_text="Allowed ID-JAG client IDs. Empty list allows any client_id.",
                        null=True,
                        size=None,
                    ),
                ),
                (
                    "organization",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="identity_provider_configs",
                        to="insights.organization",
                    ),
                ),
            ],
            options={
                "verbose_name": "identity provider config",
            },
        ),
        migrations.CreateModel(
            name="LinkedIdentityProviderConfig",
            fields=[
                ("id", models.UUIDField(default=insights.uuidt.uuid7, editable=False, primary_key=True, serialize=False)),
                (
                    "identity_provider_config",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="linked_identity_provider_configs",
                        to="insights.identityproviderconfig",
                    ),
                ),
                (
                    "organization_domain",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="linked_identity_provider_configs",
                        to="insights.organizationdomain",
                    ),
                ),
            ],
        ),
        migrations.AddConstraint(
            model_name="linkedidentityproviderconfig",
            constraint=models.UniqueConstraint(
                fields=("organization_domain", "identity_provider_config"),
                name="unique_linked_identity_provider_config",
            ),
        ),
        # db_column is carried explicitly: the attributes are underscore-prefixed
        # because reads go through the linked config, but the columns the SELECT
        # names are unprefixed, and those are what is missing.
        migrations.AddField(
            model_name="organizationdomain",
            name="_id_jag_issuer_url",
            field=models.CharField(
                blank=True,
                db_column="id_jag_issuer_url",
                help_text="Trusted IdP issuer URL for ID-JAG. Required to enable ID-JAG on this domain.",
                max_length=512,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="organizationdomain",
            name="_id_jag_jwks_url",
            field=models.CharField(
                blank=True,
                db_column="id_jag_jwks_url",
                help_text="Override JWKS URL. Defaults to OIDC discovery on the issuer URL.",
                max_length=512,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="organizationdomain",
            name="_id_jag_allowed_clients",
            field=django.contrib.postgres.fields.ArrayField(
                base_field=models.CharField(max_length=256),
                blank=True,
                db_column="id_jag_allowed_clients",
                default=list,
                help_text="Allowed ID-JAG client IDs. Empty list allows any client_id.",
                null=True,
                size=None,
            ),
        ),
        migrations.AddField(
            model_name="organizationdomain",
            name="identity_provider_config",
            field=models.ForeignKey(
                blank=True,
                help_text="IdP configuration (SAML/SCIM/XAA) backing this domain.",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="domains",
                to="insights.identityproviderconfig",
            ),
        ),
    ]
