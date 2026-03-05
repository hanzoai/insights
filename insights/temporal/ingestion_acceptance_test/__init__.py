"""Ingestion acceptance test Temporal workflow.

This workflow runs acceptance tests against the Insights ingestion pipeline
to verify that events can be captured and queried successfully.
"""

from insights.temporal.ingestion_acceptance_test.activities import run_ingestion_acceptance_tests
from insights.temporal.ingestion_acceptance_test.workflows import IngestionAcceptanceTestWorkflow

WORKFLOWS = [IngestionAcceptanceTestWorkflow]
ACTIVITIES = [run_ingestion_acceptance_tests]

__all__ = [
    "ACTIVITIES",
    "WORKFLOWS",
]
