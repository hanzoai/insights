from insights.test.base import BaseTest

from insights.models.filters import PathFilter


class TestPathFilter(BaseTest):
    def test_to_dict(self):
        filter = PathFilter(
            data={
                "date_from": "-14d",
                "exclude_events": [],
                "include_custom_events": ["potato"],
                "filter_test_accounts": False,
                "include_event_types": ["$pageview", "$screen", "custom_event"],
                "insight": "PATHS",
                "start_point": "https://www.random.com/pricing/",
                "step_limit": 3,
                "sampling_factor": 0.1,
            }
        )

        self.assertEqual(
            filter.to_dict(),
            filter.to_dict()
            | {
                "date_from": "-14d",
                "include_event_types": ["$pageview", "$screen", "custom_event"],
                "insight": "PATHS",
                "start_point": "https://www.random.com/pricing",
                "step_limit": 3,
                "include_custom_events": ["potato"],
                # always included defaults
                "breakdown_attribution_type": "first_touch",
                "breakdown_normalize_url": False,
                "interval": "day",
                "sampling_factor": 0.1,
            },
        )

    def test_to_dict_insightsql(self):
        filter = PathFilter(
            data={
                "date_from": "-14d",
                "exclude_events": [],
                "include_custom_events": ["potato"],
                "filter_test_accounts": False,
                "include_event_types": ["$pageview", "insightsql"],
                "insight": "PATHS",
                "start_point": "https://www.random.com/pricing/",
                "step_limit": 3,
                "sampling_factor": 0.1,
            }
        )

        self.assertEqual(
            filter.to_dict(),
            filter.to_dict()
            | {
                "date_from": "-14d",
                "include_event_types": ["$pageview", "insightsql"],
                "insight": "PATHS",
                "start_point": "https://www.random.com/pricing",
                "step_limit": 3,
                "include_custom_events": ["potato"],
                # always included defaults
                "breakdown_attribution_type": "first_touch",
                "breakdown_normalize_url": False,
                "interval": "day",
                "sampling_factor": 0.1,
                "paths_insightsql_expression": "event",
            },
        )
