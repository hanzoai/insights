"""
Hanzo Analytics SDK.

Wraps posthoganalytics until a native Hanzo SDK is published.
This module replaces itself with the upstream module so that
attribute assignment (e.g., `hanzoanalytics.api_key = "x"`) works.
"""
import posthoganalytics as _ph
import sys

sys.modules[__name__] = _ph
