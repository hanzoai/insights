from insights.test.base import APIBaseTest
from unittest import mock
from unittest.mock import MagicMock

from insights.utils import get_context_for_template


class TestGetContextForTemplate(APIBaseTest):
    def test_get_context_for_template(self):
        with self.settings(STRIPE_PUBLIC_KEY=None, PERSISTED_FEATURE_FLAGS=["the_persisted_flags"], DEBUG=False):
            actual = get_context_for_template(
                "layout",
                MagicMock(),
            )

        # Outside DEBUG nothing resolves this instance's own key, and the
        # upstream placeholder the client holds is no team's token: the browser
        # gets no SDK key at all rather than one whose remote config 404s.
        assert actual == {
            "git_rev": mock.ANY,
            "js_capture_time_to_see_data": False,
            "js_url": "http://localhost:8234",
            "opt_out_capture": False,
            "insights_app_context": '{"persisted_feature_flags": ["the_persisted_flags"], "anonymous": false}',
            "insights_bootstrap": "{}",
            "insights_js_uuid_version": "v7",
            "region": None,
            "self_capture": True,
        }

    def test_self_capture_key_reaches_the_browser_only_in_debug(self):
        with mock.patch("insights.utils.hanzo_insights.api_key", self.team.api_token), self.settings(DEBUG=True):
            actual = get_context_for_template("layout", MagicMock())

        assert actual["js_insights_api_key"] == self.team.api_token
        assert actual["js_insights_host"] == ""

    def test_picks_up_stripe_public_key_from_environment(self):
        with self.settings(STRIPE_PUBLIC_KEY="pk_test_12345"):
            actual = get_context_for_template(
                "layout",
                MagicMock(),
            )

        assert actual["stripe_public_key"] == "pk_test_12345"
