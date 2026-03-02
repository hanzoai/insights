from django import forms
from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html

from posthog.models.insights_functions.insights_function import InsightsFunction, InsightsFunctionState


class InsightsFunctionAdminForm(forms.ModelForm):
    state = forms.ChoiceField(choices=[], required=False)  # Initially empty

    class Meta:
        model = InsightsFunction
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        instance: InsightsFunction = kwargs["instance"]
        self.fields["state"].choices = [(ex.value, ex.name) for ex in InsightsFunctionState]  # type: ignore
        self.fields["state"].initial = instance.status["state"]


class InsightsFunctionAdmin(admin.ModelAdmin):
    form = InsightsFunctionAdminForm
    list_select_related = ("team",)
    list_display = ("id", "name", "enabled")
    list_filter = (
        ("enabled", admin.BooleanFieldListFilter),
        ("deleted", admin.BooleanFieldListFilter),
        ("updated_at", admin.DateFieldListFilter),
    )
    list_select_related = ("team",)
    search_fields = ("team__name", "team__organization__name")
    ordering = ("-created_at",)
    readonly_fields = (
        "inputs",
        "inputs_schema",
        "filters",
        "bytecode",
        "hog",
        "team",
        "created_by",
        "team_link",
    )
    fields = (
        "name",
        "description",
        "enabled",
        "deleted",
        "state",
        "created_by",
        "icon_url",
        "hog",
        "bytecode",
        "inputs_schema",
        "inputs",
        "filters",
        "template_id",
    )

    @admin.display(description="Team")
    def team_link(self, insights_function):
        return format_html(
            '<a href="{}">{}</a>',
            reverse("admin:posthog_team_change", args=[insights_function.team.pk]),
            insights_function.team.name,
        )

    def save_model(self, request, obj: InsightsFunction, form, change):
        super().save_model(request, obj, form, change)
        # Make an API request if 'state' is set
        if "state" in form.changed_data:
            state = int(form.cleaned_data["state"])
            obj.set_function_status(state)
