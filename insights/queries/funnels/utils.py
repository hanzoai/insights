from insights.constants import FunnelOrderType
from insights.models.filters import Filter
from insights.queries.funnels import DatastoreFunnelBase


def get_funnel_order_class(filter: Filter) -> type[DatastoreFunnelBase]:
    from insights.queries.funnels import DatastoreFunnel, DatastoreFunnelStrict, DatastoreFunnelUnordered

    if filter.funnel_order_type == FunnelOrderType.UNORDERED:
        return DatastoreFunnelUnordered
    elif filter.funnel_order_type == FunnelOrderType.STRICT:
        return DatastoreFunnelStrict
    return DatastoreFunnel


def get_funnel_order_actor_class(filter: Filter):
    from insights.queries.funnels import (
        DatastoreFunnelActors,
        DatastoreFunnelStrictActors,
        DatastoreFunnelUnorderedActors,
    )

    if filter.funnel_order_type == FunnelOrderType.UNORDERED:
        return DatastoreFunnelUnorderedActors
    elif filter.funnel_order_type == FunnelOrderType.STRICT:
        return DatastoreFunnelStrictActors
    return DatastoreFunnelActors
