"""One experiment, fetched for a team and rendered for a model to read.

The summary tool has two ways in — metrics the frontend already computed, or
metrics fetched from the query runners — and both end here, so an experiment
reads the same either way.

TENANCY. The lookup is filtered by team. An id names an experiment; it never
asserts the right to see one.
"""

from __future__ import annotations

from typing import Any

from insights.sync import database_sync_to_async

from products.experiments.backend.models.experiment import Experiment

# A prompt is a budget. Ten metrics of each kind is a long report already.
MAX_METRICS = 10


def _percent(value: float) -> str:
    return f"{value * 100:.2f}%"


def _interval(bounds: list[float] | None) -> str:
    if not bounds or len(bounds) != 2:
        return "not available"
    return f"[{_percent(bounds[0])}, {_percent(bounds[1])}]"


def _variant(result: Any) -> str:
    """One variant's line, in whichever statistics the experiment was run with."""
    parts = [f"  - **{result.key}**"]
    if getattr(result, "chance_to_win", None) is not None:
        parts.append(f"chance to win {_percent(result.chance_to_win)}")
        parts.append(f"95% credible interval {_interval(getattr(result, 'credible_interval', None))}")
    else:
        p_value = getattr(result, "p_value", None)
        parts.append(f"p-value {p_value:.4f}" if p_value is not None else "p-value not available")
        parts.append(f"95% confidence interval {_interval(getattr(result, 'confidence_interval', None))}")
    if getattr(result, "delta", None) is not None:
        parts.append(f"delta {_percent(result.delta)}")
    parts.append("significant" if result.significant else "not significant")
    return ", ".join(parts)


def _metrics(title: str, results: list[Any]) -> list[str]:
    lines = [f"\n## {title}"]
    for result in results[:MAX_METRICS]:
        goal = getattr(result.goal, "value", result.goal)
        lines.append(f"\n### {result.name}" + (f" (goal: {goal})" if goal else ""))
        lines.extend(_variant(variant) for variant in result.variant_results or [])
    if len(results) > MAX_METRICS:
        lines.append(f"\n_{len(results) - MAX_METRICS} further metrics not shown._")
    return lines


class ExperimentContext:
    def __init__(self, team, experiment_id: int | None = None, feature_flag_key: str | None = None):
        self._team = team
        self._experiment_id = experiment_id
        self._feature_flag_key = feature_flag_key

    async def aget_experiment(self) -> Experiment | None:
        """This team's experiment, or None — including when it is another team's."""
        queryset = Experiment.objects.filter(team=self._team, deleted=False).select_related("feature_flag")
        if self._experiment_id is not None:
            queryset = queryset.filter(id=self._experiment_id)
        elif self._feature_flag_key:
            queryset = queryset.filter(feature_flag__key=self._feature_flag_key)
        else:
            return None
        return await queryset.afirst()

    @database_sync_to_async
    def format_experiment_results_data(
        self,
        experiment: Experiment,
        exposures: dict[str, Any] | None = None,
        primary_metrics_results: list[Any] | None = None,
        secondary_metrics_results: list[Any] | None = None,
    ) -> str:
        """The experiment and its results as Markdown.

        Runs through the sync-to-async seam because rendering walks the
        experiment's feature flag, which is a related row.
        """
        method = experiment.get_stats_config("method") or "bayesian"
        lines = [
            f"# {experiment.name}",
            f"ID: {experiment.id}",
            f"Statistics: {method}",
        ]
        if experiment.description:
            lines.append(f"\n{experiment.description}")

        if exposures:
            lines.append("\n## Exposures")
            total = sum(count for count in exposures.values() if isinstance(count, int | float)) or 0
            for variant, count in exposures.items():
                share = f" ({_percent(count / total)})" if total and isinstance(count, int | float) else ""
                lines.append(f"  - **{variant}**: {count}{share}")

        primary = primary_metrics_results or []
        secondary = secondary_metrics_results or []
        if not primary and not secondary:
            lines.append("\nNo metrics results available yet.")
        if primary:
            lines.extend(_metrics("Primary metrics", primary))
        if secondary:
            lines.extend(_metrics("Secondary metrics", secondary))

        return "\n".join(lines)
