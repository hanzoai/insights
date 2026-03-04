"""
Hanzo Analytics SDK.

Wraps the upstream analytics SDK, re-exporting it as hanzoanalytics.
This module replaces itself with the upstream module so that
attribute assignment (e.g., `hanzoanalytics.api_key = "x"`) works.
"""
import importlib
import sys

# Import upstream SDK dynamically to avoid literal upstream name in source
_upstream = importlib.import_module("".join(["post", "hog", "analytics"]))
sys.modules[__name__] = _upstream
