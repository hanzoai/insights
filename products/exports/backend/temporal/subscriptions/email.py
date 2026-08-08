"""Delivering a subscription report to an email address.

One send per recipient, so a bounce for one subscriber never withholds the report
from the rest. The campaign key carries the delivery, which is what stops a
Temporal retry from sending the same report twice.
"""

import uuid
from typing import Optional

import structlog

from insights.email import EmailMessage, raise_if_delivery_rejected
from insights.utils import absolute_uri

from products.exports.backend.models.exported_asset import ExportedAsset
from products.exports.backend.models.subscription import Subscription, get_unsubscribe_token
from products.exports.backend.temporal.subscriptions.report import (
    UTM_TAGS_BASE,
    describe_asset_failure,
    has_asset_failed,
    next_delivery_date_display,
)

logger = structlog.get_logger(__name__)


def _asset_context(asset: ExportedAsset) -> dict:
    if has_asset_failed(asset):
        failure = describe_asset_failure(asset)
        return {
            "error": True,
            "insight_name": failure.insight_name,
            "error_message": failure.message,
        }

    return {
        "error": False,
        "image_url": asset.get_subscription_delivery_content_url(),
    }


def send_email_subscription_report(
    email: str,
    subscription: Subscription,
    assets: list[ExportedAsset],
    invite_message: Optional[str] = None,
    total_asset_count: Optional[int] = None,
    send_async: bool = True,
    change_summary: Optional[str] = None,
    summary_skipped_over_budget: bool = False,
    delivery_id: Optional[uuid.UUID] = None,
) -> None:
    utm_tags = f"{UTM_TAGS_BASE}&utm_medium=email"

    inviter = subscription.created_by
    is_invite = invite_message is not None
    self_invite = inviter and inviter.email == email

    resource_info = subscription.resource_info
    if not resource_info:
        raise NotImplementedError("This type of subscription resource is not supported")

    subject = f"Insights {resource_info.kind} report - {resource_info.name}"
    invite_summary = None

    # The delivery is what makes the key unique, so a retry of the same delivery dedups
    # while the next scheduled run does not.
    delivery_key = "unscheduled"
    if subscription.next_delivery_date is not None:
        delivery_key = subscription.next_delivery_date.isoformat()
    if delivery_id is not None:
        delivery_key = str(delivery_id)
    campaign_key = f"{resource_info.kind.lower()}_subscription_report_{subscription.pk}_{delivery_key}"

    unsubscribe_url = absolute_uri(f"/unsubscribe?token={get_unsubscribe_token(subscription, email)}&{utm_tags}")

    if is_invite:
        invite_summary = (
            f"This subscription is {subscription.summary}. "
            f"The next subscription will be sent on {next_delivery_date_display(subscription)}"
        )
        if self_invite:
            subject = f"You have been subscribed to an Insights {resource_info.kind}"
        else:
            inviter_name = (inviter.first_name if inviter else None) or "Someone"
            subject = f"{inviter_name} subscribed you to an Insights {resource_info.kind}"
        invite_delivery_key = str(delivery_id) if delivery_id is not None else str(uuid.uuid4())
        campaign_key = f"{resource_info.kind.lower()}_subscription_new_{subscription.pk}_{invite_delivery_key}"

    message = EmailMessage(
        campaign_key=campaign_key,
        subject=subject,
        template_name="subscription_report",
        template_context={
            "asset_data": [_asset_context(x) for x in assets],
            "resource_noun": resource_info.kind,
            "resource_name": resource_info.name,
            "resource_url": f"{resource_info.url}?{utm_tags}",
            "subscription_url": f"{subscription.url}?{utm_tags}",
            "unsubscribe_url": unsubscribe_url,
            "inviter": inviter if is_invite else None,
            "self_invite": self_invite,
            "invite_message": invite_message,
            "invite_summary": invite_summary,
            "total_asset_count": total_asset_count,
            "change_summary": change_summary,
            "summary_skipped_over_budget": summary_skipped_over_budget,
            "billing_url": absolute_uri(f"/organization/billing?{utm_tags}"),
        },
    )
    message.add_recipient(email=email)
    message.send(send_async=send_async)

    if not send_async:
        # A synchronous send is the delivery activity's own attempt, so a provider
        # rejection has to surface as a failure rather than a silently dropped send.
        raise_if_delivery_rejected(campaign_key, email)
