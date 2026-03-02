from typing import cast

from insights.schema import (
    ExternalDataSourceType as SchemaExternalDataSourceType,
    SourceConfig,
)

from insights.temporal.data_imports.sources.common.base import FieldType, SimpleSource
from insights.temporal.data_imports.sources.common.registry import SourceRegistry
from insights.temporal.data_imports.sources.generated_configs import AppsFlyerSourceConfig

from products.data_warehouse.backend.types import ExternalDataSourceType


@SourceRegistry.register
class AppsFlyerSource(SimpleSource[AppsFlyerSourceConfig]):
    @property
    def source_type(self) -> ExternalDataSourceType:
        return ExternalDataSourceType.APPSFLYER

    @property
    def get_source_config(self) -> SourceConfig:
        return SourceConfig(
            name=SchemaExternalDataSourceType.APPS_FLYER,
            label="AppsFlyer",
            iconPath="/static/services/appsflyer.png",
            fields=cast(list[FieldType], []),
            unreleasedSource=True,
        )
