"""Shared test fixtures for insightscli framework tests."""

import pytest

from insightscli import telemetry


@pytest.fixture(autouse=True)
def _opt_out_of_real_telemetry(monkeypatch):
    # CliRunner tests otherwise run the live path against the developer's real
    # ~/.config/insights config and POST real events with the committed api_key.
    # Suites that exercise telemetry itself (test_telemetry.py) delete this var
    # in their own fixture and substitute an isolated tmp config.
    monkeypatch.setenv("POSTFN_TELEMETRY_OPT_OUT", "1")


@pytest.fixture(autouse=True)
def _clear_telemetry_state():
    with telemetry._client._lock:
        telemetry._client._queue.clear()
        telemetry._client._inflight.clear()
    yield
    with telemetry._client._lock:
        telemetry._client._queue.clear()
        telemetry._client._inflight.clear()
