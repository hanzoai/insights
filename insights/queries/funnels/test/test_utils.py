from insights.test.base import BaseTest

from insights.constants import FunnelOrderType
from insights.models.filters import Filter
from insights.queries.funnels import ClickhouseFunnel, ClickhouseFunnelStrict, ClickhouseFunnelUnordered
from insights.queries.funnels.utils import get_funnel_order_class


class TestGetFunnelOrderClass(BaseTest):
    def test_filter_missing_order(self):
        filter = Filter({"foo": "bar"})
        self.assertEqual(get_funnel_order_class(filter), ClickhouseFunnel)

    def test_unordered(self):
        filter = Filter({"funnel_order_type": FunnelOrderType.UNORDERED})
        self.assertEqual(get_funnel_order_class(filter), ClickhouseFunnelUnordered)

    def test_strict(self):
        filter = Filter({"funnel_order_type": FunnelOrderType.STRICT})
        self.assertEqual(get_funnel_order_class(filter), ClickhouseFunnelStrict)

    def test_ordered(self):
        filter = Filter({"funnel_order_type": FunnelOrderType.ORDERED})
        self.assertEqual(get_funnel_order_class(filter), ClickhouseFunnel)
