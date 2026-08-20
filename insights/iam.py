"""Hanzo IAM — this deployment's own identity, for calls to internal services.

WHY THIS EXISTS. The recording API and the CDP API on insights-plugin used to be
gated by INTERNAL_API_SECRET: one static string, held by both processes, compared
per request. That is a password, not an identity. It cannot say who is calling or
which org they may touch, so it could not have stopped one org's recordings being
deleted through another org's request even on the day it worked; and it could not
expire, be revoked for one caller, or appear in an audit trail.

So insights-web now presents what it actually is: a principal minted by Hanzo
IAM. The token carries `owner` — the org this deployment belongs to — signed, so
the service on the other end reads the tenant off a claim instead of off the URL
it was handed. That is the same rule the rest of the estate's data plane runs on.

NO NEW CREDENTIAL. This uses the IAM application insights-web already has for
SSO (SOCIAL_AUTH_OIDC_KEY / _SECRET, delivered from KMS at hanzo//insights-secrets).
One deployment, one identity. Minting a second set of credentials for the same
process would mean two identities for one thing to keep in step and two things to
rotate.
"""

import time
import threading
from typing import Optional

from django.conf import settings

import requests
import structlog

logger = structlog.get_logger(__name__)

# Refresh this far before expiry, so a token never goes stale mid-flight on a
# call that has already been dispatched. `insights.ingest` decides the same thing
# about a user's token, and one margin means one answer to "is this worth
# sending" wherever it is asked.
REFRESH_MARGIN_SECONDS = 300

# IAM is the identity authority for every request behind this, so a slow IAM must
# surface as a failed call rather than a stuck worker.
_TIMEOUT_SECONDS = 10

_lock = threading.Lock()
_token: Optional[str] = None
_expires_at: float = 0.0


class IamUnavailable(Exception):
    """No token could be obtained. Callers must fail, never proceed unauthenticated."""


def _token_endpoint() -> str:
    endpoint = (settings.SOCIAL_AUTH_OIDC_OIDC_ENDPOINT or "").rstrip("/")
    if not endpoint:
        raise IamUnavailable("SOCIAL_AUTH_OIDC_OIDC_ENDPOINT is not configured")
    return f"{endpoint}/oauth/token"


def _mint() -> tuple[str, float]:
    client_id = settings.SOCIAL_AUTH_OIDC_KEY
    client_secret = settings.SOCIAL_AUTH_OIDC_SECRET
    if not client_id or not client_secret:
        raise IamUnavailable("IAM client credentials are not configured")

    try:
        response = requests.post(
            _token_endpoint(),
            data={
                "grant_type": "client_credentials",
                "client_id": client_id,
                "client_secret": client_secret,
                "scope": "openid",
            },
            timeout=_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        body = response.json()
    except Exception as e:
        # Deliberately does not include the response body: an IAM error can echo
        # back what was sent to it.
        raise IamUnavailable(f"IAM did not issue a token: {type(e).__name__}") from e

    token = body.get("access_token")
    if not token:
        raise IamUnavailable("IAM response carried no access_token")

    # expires_in is advisory; a short floor keeps a broken value from making us
    # re-mint on every single call.
    lifetime = max(int(body.get("expires_in") or 0), 60)
    return token, time.monotonic() + lifetime


def service_token(force_refresh: bool = False) -> str:
    """This deployment's IAM access token, cached until shortly before it expires.

    Raises IamUnavailable rather than returning an empty string: a caller that
    receives "" would send an unauthenticated request, which is the failure mode
    being removed.
    """
    global _token, _expires_at

    with _lock:
        if not force_refresh and _token and time.monotonic() < _expires_at - REFRESH_MARGIN_SECONDS:
            return _token
        _token, _expires_at = _mint()
        logger.info("iam.service_token_minted")
        return _token


def authorization() -> dict[str, str]:
    """The Authorization header for a call to an internal Hanzo service."""
    return {"Authorization": f"Bearer {service_token()}"}


def _stale(token: str) -> bool:
    """Whether `token` is too close to its own `exp` to be worth sending.

    The signature is not checked — the service on the other end does that, and
    this only decides whether to ask. Anything unreadable counts as stale, so a
    token of an unexpected shape gets refreshed rather than sent and refused.
    """
    import jwt  # noqa: PLC0415 — keeps the import off the service-token path

    try:
        expires_at = jwt.decode(token, options={"verify_signature": False})["exp"]
    except Exception:
        return True
    return time.time() + REFRESH_MARGIN_SECONDS >= float(expires_at)


def user_token(user, *, fresh: Optional[str] = None) -> str:
    """The ACTING PERSON's IAM access token — not this deployment's.

    Which one a call carries decides which org is billed and whose data it may
    touch, so the two never substitute for each other: the service token names
    insights, and would attribute a person's work, and their spend, to us.

    A login already holds a token and passes it as `fresh`, touching neither the
    database nor IAM again. Everywhere else reads what python-social-auth stored
    at sign-in, which is usually expired — those live hours, and a person comes
    back days later — so a stale one is refreshed with the refresh token stored
    beside it, through social-auth's own machinery, which writes the new token
    back where it found the old one.
    """
    if fresh:
        return fresh

    from social_django.utils import load_strategy  # noqa: PLC0415 — needs configured settings

    social = user.social_auth.filter(provider="oidc").first()
    if social is None:
        raise IamUnavailable("this account has no Hanzo IAM login; sign in again")

    token = (social.extra_data or {}).get("access_token")
    if token and not _stale(token):
        return token

    try:
        social.refresh_token(load_strategy())
    except Exception as e:
        raise IamUnavailable(
            f"the Hanzo IAM login could not be refreshed ({type(e).__name__}); sign in again"
        ) from e

    # Re-read rather than trust the call: `refresh_token` is a no-op when there is
    # no refresh token to spend, and a silent no-op would send the stale one.
    token = (social.extra_data or {}).get("access_token")
    if not token or _stale(token):
        raise IamUnavailable("the Hanzo IAM login could not be refreshed; sign in again")

    logger.info("iam.user_token_refreshed", user_id=str(user.uuid))
    return token
