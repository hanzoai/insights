from datetime import timedelta

from django.utils import timezone

from insights.api.advanced_activity_logs.utils import get_activity_log_lookback_restriction
from insights.constants import AvailableFeature
from insights.models.organization import Organization


def _org_with(feature: dict | None) -> Organization:
    """An unsaved organization carrying exactly one feature entry, or none."""
    return Organization(name="test", available_product_features=[feature] if feature else [])


class TestActivityLogLookbackRestriction:
    def test_the_build_reads_its_whole_activity_log(self):
        """The regression guard: what `PRODUCT_FEATURES` grants must not shorten the window.

        `audit_logs` is granted with no limit, and this asserts the pair — the grant and the
        reading of it — leaves the log unrestricted. It fails if a limit is ever added to the
        granted entry, or if the helper goes back to inferring one.
        """
        organization = Organization(name="test")
        organization.update_available_product_features()

        assert organization.is_feature_available(AvailableFeature.AUDIT_LOGS)
        assert get_activity_log_lookback_restriction(organization) is None

    def test_a_feature_without_a_limit_restricts_nothing(self):
        # Rather than falling back to the smallest window billing used to sell, which cut the
        # log to 60 days for anyone holding the feature.
        organization = _org_with({"key": AvailableFeature.AUDIT_LOGS, "name": "audit_logs"})

        assert get_activity_log_lookback_restriction(organization) is None

    def test_no_feature_restricts_nothing(self):
        assert get_activity_log_lookback_restriction(_org_with(None)) is None

    def test_a_stated_limit_is_still_honoured(self):
        # The only way a window narrows is by being named outright.
        organization = _org_with(
            {"key": AvailableFeature.AUDIT_LOGS, "name": "audit_logs", "limit": 2, "unit": "months"}
        )

        restriction = get_activity_log_lookback_restriction(organization)

        assert restriction is not None
        assert abs(restriction - (timezone.now() - timedelta(days=60))) < timedelta(minutes=1)
