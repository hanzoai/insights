from typing import cast

from insights.schema import (
    ExternalDataSourceType as SchemaExternalDataSourceType,
    SourceConfig,
)

from insights.temporal.data_imports.sources.common.base import FieldType, SimpleSource
from insights.temporal.data_imports.sources.common.registry import SourceRegistry
from insights.temporal.data_imports.sources.generated_configs import OmnisendSourceConfig

from products.data_warehouse.backend.types import ExternalDataSourceType


@SourceRegistry.register
class OmnisendSource(SimpleSource[OmnisendSourceConfig]):
    @property
    def source_type(self) -> ExternalDataSourceType:
        return ExternalDataSourceType.OMNISEND

    @property
    def get_source_config(self) -> SourceConfig:
        return SourceConfig(
            name=SchemaExternalDataSourceType.OMNISEND,
            label="Omnisend",
            iconPath="/static/services/omnisend.png",
            fields=cast(list[FieldType], []),
            unreleasedSource=True,
        )
