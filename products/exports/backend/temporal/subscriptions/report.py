"""What the email and Slack renderings of a subscription report share.

Both channels answer the same three questions — how many insights fit, how to
attribute the links, and what to say about an insight whose image never
rendered — so they answer them from one place rather than two.
"""

from dataclasses import dataclass

from products.exports.backend.models.exported_asset import ExportedAsset
from products.exports.backend.models.subscription import Subscription

UTM_TAGS_BASE = "utm_source=insights&utm_campaign=subscription_report"

# Keep in sync with MAX_INSIGHTS in
# products/subscriptions/frontend/components/Subscriptions/insightSelectorLogic.ts.
MAX_INSIGHTS = 10

ASSET_GENERATION_FAILED_MESSAGE = "Failed to generate content"

# An exporter traceback can run long; both channels cap it well under Slack's
# 3000-character block limit so the surrounding text always survives.
_MAX_ASSET_ERROR_LENGTH = 2000


def has_asset_failed(asset: ExportedAsset) -> bool:
    return (not asset.content and not asset.content_location) or asset.exception is not None


@dataclass(frozen=True, kw_only=True)
class AssetFailure:
    """Why one insight is missing from a report, in the recipient's words."""

    insight_name: str
    message: str


def describe_asset_failure(asset: ExportedAsset) -> AssetFailure:
    insight_name = (asset.insight.name or asset.insight.derived_name) if asset.insight else "Unknown insight"

    if not asset.exception:
        return AssetFailure(insight_name=insight_name, message=ASSET_GENERATION_FAILED_MESSAGE)

    message = str(asset.exception)
    if len(message) > _MAX_ASSET_ERROR_LENGTH:
        message = message[:_MAX_ASSET_ERROR_LENGTH] + "... (truncated)"
    return AssetFailure(insight_name=insight_name, message=message)


def next_delivery_date_display(subscription: Subscription) -> str:
    next_delivery_date = subscription.next_delivery_date
    return next_delivery_date.strftime("%A %B %d, %Y") if next_delivery_date is not None else "an upcoming date"
