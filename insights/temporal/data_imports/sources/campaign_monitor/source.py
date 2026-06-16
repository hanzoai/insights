from typing import cast

from insights.schema import (
    ExternalDataSourceType as SchemaExternalDataSourceType,
    SourceConfig,
)

from insights.temporal.data_imports.sources.common.base import FieldType, SimpleSource
from insights.temporal.data_imports.sources.common.registry import SourceRegistry
from insights.temporal.data_imports.sources.generated_configs import CampaignMonitorSourceConfig

from products.data_warehouse.backend.types import ExternalDataSourceType


@SourceRegistry.register
class CampaignMonitorSource(SimpleSource[CampaignMonitorSourceConfig]):
    @property
    def source_type(self) -> ExternalDataSourceType:
        return ExternalDataSourceType.CAMPAIGNMONITOR

    @property
    def get_source_config(self) -> SourceConfig:
        return SourceConfig(
            name=SchemaExternalDataSourceType.CAMPAIGN_MONITOR,
            label="Campaign Monitor",
            iconPath="/static/services/campaign_monitor.png",
            fields=cast(list[FieldType], []),
            unreleasedSource=True,
        )
