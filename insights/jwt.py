from datetime import UTC, datetime, timedelta
from enum import Enum
from typing import Any

from django.conf import settings

import jwt


class InsightsJwtAudience(Enum):
    UNSUBSCRIBE = "insights:unsubscribe"
    EXPORTED_ASSET = "insights:exported_asset"
    IMPERSONATED_USER = "insights:impersonted_user"  # This is used by background jobs on behalf of the user e.g. exports
    LIVESTREAM = "insights:livestream"
    SHARING_PASSWORD_PROTECTED = "insights:sharing_password_protected"


def encode_jwt(payload: dict, expiry_delta: timedelta, audience: InsightsJwtAudience) -> str:
    """
    Create a JWT ensuring that the correct audience and signing token is used
    """
    if not isinstance(audience, InsightsJwtAudience):
        raise Exception("Audience must be in the list of Insights-supported audiences")

    encoded_jwt = jwt.encode(
        {
            **payload,
            "exp": datetime.now(tz=UTC) + expiry_delta,
            "aud": audience.value,
        },
        settings.SECRET_KEY,
        algorithm="HS256",
    )

    return encoded_jwt


def decode_jwt(token: str, audience: InsightsJwtAudience) -> dict[str, Any]:
    info = jwt.decode(token, settings.SECRET_KEY, audience=audience.value, algorithms=["HS256"])

    return info
