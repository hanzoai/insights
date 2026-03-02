import dataclasses
from typing import TYPE_CHECKING, Literal, Optional

from posthog.api.custom_function_template import CustomFunctionTemplateSerializer
from posthog.models.custom_function_template import CustomFunctionTemplate

if TYPE_CHECKING:
    from posthog.models.plugin import PluginConfig
else:
    PluginConfig = None


SubTemplateId = Literal[
    "activity-log",
    "discussion-mention",
    "error-tracking-issue-created",
    "error-tracking-issue-reopened",
    "error-tracking-issue-spiking",
    "insight-alert-firing",
]


# Keep in sync with CustomFunctionType
CustomFunctionTemplateType = Literal[
    "destination",
    "site_destination",
    "internal_destination",
    "source_webhook",
    "warehouse_source_webhook",
    "site_app",
    "transformation",
]


@dataclasses.dataclass(frozen=True)
class CustomFunctionMapping:
    name: Optional[str] = None
    filters: Optional[dict] = None
    inputs: Optional[dict] = None
    inputs_schema: Optional[list[dict]] = None


@dataclasses.dataclass(frozen=True)
class CustomFunctionMappingTemplate:
    name: str
    include_by_default: Optional[bool] = None
    filters: Optional[dict] = None
    inputs: Optional[dict] = None
    inputs_schema: Optional[list[dict]] = None


@dataclasses.dataclass(frozen=True)
class CustomFunctionTemplateDC:
    status: Literal["alpha", "beta", "stable", "deprecated", "coming_soon", "hidden"]
    free: bool
    type: CustomFunctionTemplateType
    id: str
    name: str
    code: str
    code_language: Literal["javascript", "hog"]
    inputs_schema: list[dict]
    category: list[str]
    description: Optional[str] = None
    filters: Optional[dict] = None
    mapping_templates: Optional[list[CustomFunctionMappingTemplate]] = None
    masking: Optional[dict] = None
    icon_url: Optional[str] = None


class CustomFunctionTemplateMigrator:
    plugin_url: str

    @classmethod
    def migrate(cls, obj: PluginConfig) -> dict:
        # Return a dict for the template of a new CustomFunction
        raise NotImplementedError()


def sync_template_to_db(template_data: dict | CustomFunctionTemplateDC) -> CustomFunctionTemplate:
    if isinstance(template_data, CustomFunctionTemplateDC):
        template_data = dataclasses.asdict(template_data)

    template = CustomFunctionTemplate.get_template(template_data["id"])
    if template:
        serializer = CustomFunctionTemplateSerializer(template, data=template_data)
    else:
        serializer = CustomFunctionTemplateSerializer(data=template_data)

    serializer.is_valid(raise_exception=True)
    return serializer.save()
