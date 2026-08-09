"""Facade re-export for the dedicated Stamp GitHub App webhook view.

Core routes a standalone URL at this view; it stays out of the unified
``insights.urls.github_webhook`` fan-out because Stamp is its own GitHub App.
"""

from products.stamp.backend.presentation.webhooks import stamp_github_webhook

__all__ = ["stamp_github_webhook"]
