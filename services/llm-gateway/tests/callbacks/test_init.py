from unittest.mock import patch

import litellm

from llm_gateway.callbacks import init_callbacks
from llm_gateway.callbacks.insights import InsightsCallback
from llm_gateway.config import Settings


def test_init_callbacks_forwards_the_ai_lane_setting() -> None:
    # The env knob is only as real as this wiring: if init_callbacks stops forwarding
    # insights_ai_lane_capture, the callback silently falls back to its default (True) and the
    # setting goes dead. False is asserted because it is the only value that can catch that.
    settings = Settings(insights_project_token="test-token", insights_ai_lane_capture=False)
    original_callbacks = litellm.callbacks
    try:
        with patch("llm_gateway.callbacks.get_settings", return_value=settings):
            init_callbacks()
        insights_callbacks = [cb for cb in litellm.callbacks if isinstance(cb, InsightsCallback)]
        assert len(insights_callbacks) == 1
        assert insights_callbacks[0]._ai_lane_capture is False
    finally:
        litellm.callbacks = original_callbacks
