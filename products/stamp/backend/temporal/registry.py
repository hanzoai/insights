"""Workflow and activity registration lists for the stamp Temporal worker.

Kept separate from ``temporal/__init__.py`` (owned elsewhere) so the worker wiring has a
stable import target: ``from products.stamp.backend.temporal.registry import WORKFLOWS, ACTIVITIES``.
"""

from __future__ import annotations

from products.stamp.backend.temporal.activities import (
    dismiss_stale_approvals,
    fetch_review_context,
    list_in_flight_reviewer_bots,
    mark_review_failed,
    post_verdict,
    run_review_in_sandbox,
    signal_review_started,
)
from products.stamp.backend.temporal.workflow import StampReviewWorkflow

WORKFLOWS = [StampReviewWorkflow]

ACTIVITIES = [
    dismiss_stale_approvals,
    signal_review_started,
    fetch_review_context,
    list_in_flight_reviewer_bots,
    run_review_in_sandbox,
    post_verdict,
    mark_review_failed,
]

__all__ = ["WORKFLOWS", "ACTIVITIES"]
