"""
EE RBAC models restored from the deleted ee/ directory.

These models use app_label="insights" (the main app) with managed=False
and explicit db_table to point at existing ee_* database tables.

This module must NOT be imported at Django startup time — only at
request time (after the app registry is ready). All consuming code
should use lazy imports.
"""

from django.db import models

from insights.models.utils import UUIDTModel, sane_repr


class AccessControl(UUIDTModel):
    team = models.ForeignKey(
        "insights.Team", on_delete=models.CASCADE,
        related_name="access_controls", related_query_name="access_controls",
    )
    access_level = models.CharField(max_length=32)
    resource = models.CharField(max_length=32)
    resource_id = models.CharField(max_length=36, null=True)
    organization_member = models.ForeignKey(
        "insights.OrganizationMembership", on_delete=models.CASCADE,
        related_name="access_controls", related_query_name="access_controls", null=True,
    )
    role = models.ForeignKey(
        "insights.Role", on_delete=models.CASCADE,
        related_name="access_controls", related_query_name="access_controls", null=True,
    )
    created_by = models.ForeignKey("insights.User", on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "insights"
        db_table = "ee_accesscontrol"
        managed = False


class DashboardPrivilege(UUIDTModel):
    dashboard = models.ForeignKey(
        "insights.Dashboard", on_delete=models.CASCADE,
        related_name="privileges", related_query_name="privilege",
    )
    user = models.ForeignKey(
        "insights.User", on_delete=models.CASCADE,
        related_name="explicit_dashboard_privileges",
        related_query_name="explicit_dashboard_privilege",
    )
    level = models.PositiveSmallIntegerField(
        choices=[(21, "Can view dashboard"), (37, "Can edit dashboard")]
    )
    added_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "insights"
        db_table = "ee_dashboardprivilege"
        managed = False

    __repr__ = sane_repr("dashboard", "user", "level")


class Role(UUIDTModel):
    name = models.CharField(max_length=200)
    organization = models.ForeignKey(
        "insights.Organization", on_delete=models.CASCADE,
        related_name="roles", related_query_name="role",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        "insights.User", on_delete=models.SET_NULL,
        related_name="roles", related_query_name="role", null=True,
    )
    feature_flags_access_level = models.PositiveSmallIntegerField(
        default=37, choices=[(21, "Can only view"), (37, "Can always edit")],
    )

    class Meta:
        app_label = "insights"
        db_table = "ee_role"
        managed = False


class RoleMembership(UUIDTModel):
    role = models.ForeignKey("insights.Role", on_delete=models.CASCADE, related_name="roles", related_query_name="role")
    user = models.ForeignKey(
        "insights.User", on_delete=models.CASCADE,
        related_name="role_memberships", related_query_name="role_membership",
    )
    organization_member = models.ForeignKey(
        "insights.OrganizationMembership", on_delete=models.CASCADE,
        related_name="role_memberships", related_query_name="role_membership", null=True,
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "insights"
        db_table = "ee_rolemembership"
        managed = False
