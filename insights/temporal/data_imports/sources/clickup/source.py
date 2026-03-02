from typing import cast

from insights.schema import (
    ExternalDataSourceType as SchemaExternalDataSourceType,
    SourceConfig,
)

from insights.temporal.data_imports.sources.common.base import FieldType, SimpleSource
from insights.temporal.data_imports.sources.common.registry import SourceRegistry
from insights.temporal.data_imports.sources.generated_configs import ClickUpSourceConfig

from products.data_warehouse.backend.types import ExternalDataSourceType


@SourceRegistry.register
class ClickUpSource(SimpleSource[ClickUpSourceConfig]):
    @property
    def source_type(self) -> ExternalDataSourceType:
        return ExternalDataSourceType.CLICKUP

    @property
    def get_source_config(self) -> SourceConfig:
        return SourceConfig(
            name=SchemaExternalDataSourceType.CLICK_UP,
            label="ClickUp",
            iconPath="/static/services/clickup.png",
            fields=cast(list[FieldType], []),
            unreleasedSource=True,
        )
