from django.utils.html import format_html

from django_admin_inline_paginator.admin import TabularInlinePaginated

from insights.admin.admins.project_admin import ProjectAdmin
from insights.models import Project


class ProjectInline(TabularInlinePaginated):
    extra = 0
    model = Project
    per_page = 20
    pagination_key = "page-project"
    show_change_link = True

    fields = (
        "id",
        "displayed_name",
        "created_at",
    )
    readonly_fields = [*ProjectAdmin.readonly_fields, "displayed_name"]

    def displayed_name(self, project: Project):
        return format_html(
            '<a href="/admin/insights/project/{}/change/">{}.&nbsp;{}</a>',
            project.pk,
            project.pk,
            project.name,
        )
