from __future__ import annotations

from django.conf import settings

from prometheus_client import Counter


def get_client_name() -> str:
    return getattr(settings, "OTEL_SERVICE_NAME", None) or "insights-django"


PERSONFN_ROUTING_TOTAL = Counter(
    "personinsights_routing_total",
    "Tracks which data source was used for each personinsights-eligible operation",
    labelnames=["operation", "source", "client_name"],
)

PERSONFN_ROUTING_ERRORS_TOTAL = Counter(
    "personinsights_routing_errors_total",
    "Errors encountered during personinsights routing",
    labelnames=["operation", "source", "error_type", "client_name"],
)

PERSONFN_TEAM_MISMATCH_TOTAL = Counter(
    "personinsights_team_mismatch_total",
    "Persons dropped because personinsights returned a mismatched team_id",
    labelnames=["operation", "client_name"],
)

PERSONFN_ERRORS_TOTAL = Counter(
    "personinsights_errors_total",
    "Total PersonHog gRPC errors — every failed gRPC attempt",
    labelnames=["method", "client", "error_type"],
)

PERSONFN_RETRIES_TOTAL = Counter(
    "personinsights_retries_total",
    "Total PersonHog gRPC retries before success or exhaustion",
    labelnames=["method", "client", "error_type"],
)

PERSONFN_TERMINAL_ERRORS_TOTAL = Counter(
    "personinsights_terminal_errors_total",
    "PersonHog gRPC errors after retry exhaustion — the request was not fulfilled",
    labelnames=["method", "client", "error_type"],
)
