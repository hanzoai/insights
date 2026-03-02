from typing import cast

from insights.schema import (
    ExternalDataSourceType as SchemaExternalDataSourceType,
    SourceConfig,
)

from insights.temporal.data_imports.sources.common.base import FieldType, SimpleSource
from insights.temporal.data_imports.sources.common.registry import SourceRegistry
from insights.temporal.data_imports.sources.generated_configs import ServiceNowSourceConfig

from products.data_warehouse.backend.types import ExternalDataSourceType


@SourceRegistry.register
class ServiceNowSource(SimpleSource[ServiceNowSourceConfig]):
    @property
    def source_type(self) -> ExternalDataSourceType:
        return ExternalDataSourceType.SERVICENOW

    @property
    def get_source_config(self) -> SourceConfig:
        return SourceConfig(
            name=SchemaExternalDataSourceType.SERVICE_NOW,
            label="ServiceNow",
            iconPath="/static/services/servicenow.png",
            fields=cast(list[FieldType], []),
            unreleasedSource=True,
        )
