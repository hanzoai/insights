"""Command-line entry point for running acceptance tests."""

import sys
import logging
from concurrent.futures import ThreadPoolExecutor

import hanzo_insights

from insights.temporal.ingestion_acceptance_test.client import InsightsClient
from insights.temporal.ingestion_acceptance_test.config import Config
from insights.temporal.ingestion_acceptance_test.runner import RunningTests, run_tests
from insights.temporal.ingestion_acceptance_test.terminal_report import format_terminal_report
from insights.temporal.ingestion_acceptance_test.test_cases_discovery import discover_tests

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    logger = logging.getLogger(__name__)
    config = Config()

    insights_sdk = hanzo_insights.Insights(
        config.project_api_key,
        host=config.api_host,
        debug=True,
        sync_mode=True,
    )

    tests = discover_tests()
    client = InsightsClient(config, insights_sdk)
    with ThreadPoolExecutor() as executor:
        result = run_tests(config, tests, client, executor, RunningTests())
    logger.info(format_terminal_report(result))
    sys.exit(0 if result.success else 1)
