import dataclasses
from typing import TYPE_CHECKING, Literal, Optional

from products.cdp.backend.api.insights_function_template import InsightsFunctionTemplateSerializer
from products.cdp.backend.models.insights_function_template import InsightsFunctionTemplate

if TYPE_CHECKING:
    from products.cdp.backend.models.plugin import PluginConfig
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


# Keep in sync with InsightsFunctionType
InsightsFunctionTemplateType = Literal[
    "destination",
    "site_destination",
    "internal_destination",
    "source_webhook",
    "warehouse_source_webhook",
    "site_app",
    "transformation",
    "transformation_log",
]


@dataclasses.dataclass(frozen=True)
class InsightsFunctionMapping:
    name: Optional[str] = None
    filters: Optional[dict] = None
    inputs: Optional[dict] = None
    inputs_schema: Optional[list[dict]] = None


@dataclasses.dataclass(frozen=True)
class InsightsFunctionMappingTemplate:
    name: str
    include_by_default: Optional[bool] = None
    use_all_events_by_default: Optional[bool] = None
    filters: Optional[dict] = None
    inputs: Optional[dict] = None
    inputs_schema: Optional[list[dict]] = None


@dataclasses.dataclass(frozen=True)
class InsightsFunctionTemplateDC:
    status: Literal["alpha", "beta", "stable", "deprecated", "coming_soon", "hidden"]
    free: bool
    type: InsightsFunctionTemplateType
    id: str
    name: str
    code: str
    code_language: Literal["javascript", "script"]
    inputs_schema: list[dict]
    category: list[str]
    description: Optional[str] = None
    filters: Optional[dict] = None
    mapping_templates: Optional[list[InsightsFunctionMappingTemplate]] = None
    masking: Optional[dict] = None
    icon_url: Optional[str] = None


class InsightsFunctionTemplateMigrator:
    plugin_url: str

    @classmethod
    def migrate(cls, obj: PluginConfig) -> dict:
        # Return a dict for the template of a new InsightsFunction
        raise NotImplementedError()


def sync_template_to_db(template_data: dict | InsightsFunctionTemplateDC) -> InsightsFunctionTemplate:
    if isinstance(template_data, InsightsFunctionTemplateDC):
        template_data = dataclasses.asdict(template_data)

    template = InsightsFunctionTemplate.get_template(template_data["id"])
    if template:
        serializer = InsightsFunctionTemplateSerializer(template, data=template_data)
    else:
        serializer = InsightsFunctionTemplateSerializer(data=template_data)

    serializer.is_valid(raise_exception=True)
    return serializer.save()
