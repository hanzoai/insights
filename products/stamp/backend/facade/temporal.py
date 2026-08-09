"""Facade re-export for the stamp Temporal surface.

The worker registers ``WORKFLOWS``/``ACTIVITIES`` for the stamp task queue. Isolated
from ``facade/api.py`` so ``temporalio`` never lands on the light data-surface import path.
"""

from products.stamp.backend.temporal.registry import ACTIVITIES, WORKFLOWS

__all__ = ["ACTIVITIES", "WORKFLOWS"]
