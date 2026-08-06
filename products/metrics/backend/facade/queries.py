"""Query-runner wiring facade for metrics.

Core dispatch (`insights/insightsql_queries/query_runner.py`) imports the runner
through this module so internal modules stay behind the facade seam. Import
lazily at the dispatch site — this module pulls in InsightsQL machinery that must
stay off the `django.setup()` path.
"""

from products.metrics.backend.insightsql_queries.metrics_query_runner import MetricsQueryRunner

__all__ = ["MetricsQueryRunner"]
