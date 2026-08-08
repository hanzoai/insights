import time
from collections.abc import Iterator, Mapping
from contextlib import contextmanager
from typing import TYPE_CHECKING

import hanzo_insights
from temporalio import workflow

if TYPE_CHECKING:
    # Only ever a type here, so it stays off the startup path: this module is
    # reached from the temporal graph during Django setup, and an annotation
    # should not decide whether the web pods boot. hanzo_insights 7.9.8 does ship
    # metrics_capture — a real import would resolve now — but a type has no
    # reason to be one.
    from hanzo_insights.metrics_capture import InsightsMetrics

MetricAttributes = Mapping[str, str | int | float | bool]


def _should_record() -> bool:
    return not (workflow.in_workflow() and workflow.unsafe.is_replaying())


def _metrics() -> "InsightsMetrics | None":
    """The SDK's metrics sink, or None when this build has none.

    getattr, not attribute access: an SDK without metrics_capture has no
    `metrics` either, and every caller below already checks for None. This is
    the one place that has to agree with them.
    """
    client = hanzo_insights.default_client
    return getattr(client, "metrics", None) if client is not None else None


def record_counter(
    name: str,
    value: int,
    attributes: MetricAttributes,
    *,
    unit: str | None = None,
) -> None:
    if not _should_record():
        return
    metrics = _metrics()
    if metrics is not None:
        metrics.count(name, value, unit=unit, attributes=dict(attributes))


def record_histogram(
    name: str,
    value: float,
    attributes: MetricAttributes,
    *,
    unit: str,
) -> None:
    if not _should_record():
        return
    metrics = _metrics()
    if metrics is not None:
        metrics.histogram(name, value, unit=unit, attributes=dict(attributes))


def record_gauge(
    name: str,
    value: float,
    attributes: MetricAttributes,
    *,
    unit: str | None = None,
) -> None:
    if not _should_record():
        return
    metrics = _metrics()
    if metrics is not None:
        metrics.gauge(name, value, unit=unit, attributes=dict(attributes))


@contextmanager
def track_duckling_backfill(*, team_id: int, dataset: str, mode: str) -> Iterator[None]:
    attributes = {"team_id": str(team_id), "dataset": dataset, "mode": mode}
    record_counter(
        "warehouse.duckling.backfill.started",
        1,
        attributes,
    )
    started_at = time.perf_counter()
    status = "failed"
    try:
        yield
        status = "completed"
        record_gauge(
            "warehouse.duckling.backfill.last.success.timestamp",
            time.time(),
            attributes,
            unit="s",
        )
    finally:
        terminal_attributes = {**attributes, "status": status}
        record_counter(
            "warehouse.duckling.backfill.finished",
            1,
            terminal_attributes,
        )
        record_histogram(
            "warehouse.duckling.backfill.duration",
            time.perf_counter() - started_at,
            terminal_attributes,
            unit="s",
        )
        metrics = _metrics()
        if metrics is not None:
            metrics.flush()


def record_duckling_backfill_workload(
    *,
    team_id: int,
    dataset: str,
    mode: str,
    files_registered: int,
    partitions_exported: int,
) -> None:
    attributes = {"team_id": str(team_id), "dataset": dataset, "mode": mode}
    record_histogram(
        "warehouse.duckling.backfill.files.registered",
        float(files_registered),
        attributes,
        unit="file",
    )
    record_histogram(
        "warehouse.duckling.backfill.partitions.exported",
        float(partitions_exported),
        attributes,
        unit="partition",
    )
