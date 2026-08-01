"""
Model-class wiring for cdp.

Re-exports the InsightsFunction model surface cross-product consumers dispatch on. Light.
"""

from products.cdp.backend.models.insights_functions.insights_function import InsightsFunction, InsightsFunctionState, InsightsFunctionType

__all__ = ["InsightsFunction", "InsightsFunctionState", "InsightsFunctionType"]
