from django.contrib import admin, messages
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.auth.forms import UserChangeForm as DjangoUserChangeForm
from django.core.exceptions import ValidationError
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

from insights.admin.inlines.organization_member_inline import OrganizationMemberForUserInline
from insights.admin.inlines.personal_api_key_inline import PersonalAPIKeyInline
from insights.admin.inlines.user_social_auth_inline import UserSocialAuthInline
from insights.models import User
from insights.session.activity import revoke_other_sessions


class UserChangeForm(DjangoUserChangeForm):
    def clean_is_staff(self):
        is_staff = bool(self.cleaned_data.get("is_staff", False))
        enabled_is_staff = is_staff and (not getattr(self.instance, "is_staff", False))
        if enabled_is_staff and not self.instance.email.endswith("@hanzo.ai"):
            raise ValidationError("Only users with a hanzo.ai email address may be promoted to staff.")

        return is_staff


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    """Define admin model for custom User model with no email field."""

    form = UserChangeForm
    change_password_form = None  # This view is not exposed in our subclass of UserChangeForm
    change_form_template = "admin/insights/user/change_form.html"

    inlines = [
        OrganizationMemberForUserInline,
        PersonalAPIKeyInline,
        UserSocialAuthInline,
    ]
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "id",
                    "distinct_id",
                    "email",
                    "current_organization",
                    "strapi_id",
                    "revoke_sessions_link",
                    "allow_impersonation",
                )
            },
        ),
        (_("Personal info"), {"fields": ("first_name", "last_name")}),
        (_("Permissions"), {"fields": ("is_active", "is_staff", "groups")}),
        (_("Important dates"), {"fields": ("last_login", "date_joined")}),
    )
    list_display = (
        "id",
        "email",
        "first_name",
        "last_name",
        "current_team_link",
        "current_organization_link",
        "is_staff",
    )
    list_display_links = ("id", "email")
    list_filter = ("is_staff", "is_active", "groups")
    list_select_related = ("current_team", "current_organization")
    search_fields = ("email", "first_name", "last_name", "distinct_id")
    readonly_fields = [
        "id",
        "distinct_id",
        "email",
        "current_team",
        "current_organization",
        "revoke_sessions_link",
        "allow_impersonation",
        "last_login",
        "date_joined",
    ]
    ordering = ("email",)

    @admin.display(description="Current Team")
    def current_team_link(self, user: User):
        if not user.team:
            return "–"

        return format_html(
            '<a href="{}">{}</a>',
            reverse("admin:insights_team_change", args=[user.team.pk]),
            user.team.name,
        )

    @admin.display(description="Current Organization")
    def current_organization_link(self, user: User):
        if not user.organization:
            return "–"

        return format_html(
            '<a href="{}">{}</a>',
            reverse("admin:insights_organization_change", args=[user.organization.pk]),
            user.organization.name,
        )

    @admin.display(description="Web sessions")
    def revoke_sessions_link(self, user: User):
        return format_html('<a href="{}" class="button" id="revoke_sessions_button">{}</a>', "#", "Revoke all")

    def change_view(self, request, object_id, form_url="", extra_context=None):
        """Override change view to handle the session-revocation button."""
        user = self.get_object(request, object_id)

        if request.POST.get("revoke_sessions") == "1":
            try:
                if user:
                    num_revoked = self.delete_user_sessions(user)
                    self.log_change(request, user, f"Revoked {num_revoked} web session(s).")
                    messages.success(request, f"Revoked {num_revoked} session(s)")
                else:
                    messages.warning(request, "User not found.")
            except Exception as e:
                messages.error(request, f"Failed to revoke sessions: {str(e)}")

            # Redirect back to the change form
            return HttpResponseRedirect(reverse("admin:insights_user_change", args=[object_id]))

        return super().change_view(request, object_id, form_url, extra_context)

    def delete_user_sessions(self, user):
        return revoke_other_sessions(user, keep_session_key=None)
