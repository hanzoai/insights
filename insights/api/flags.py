"""Feature-flag evaluation, answered by Hanzo cloud.

This deployment holds no flag definitions and runs no evaluator. Evaluation is
`POST /v1/flags` on api.hanzo.ai -- the native Go engine in `hanzoai/cloud`
(`apps/flags`), which reads its tenant off the IAM `owner` claim and refuses a
request that carries no validated principal. This view is the door a signed-in
browser knocks on, and nothing more.

WHY THE BROWSER DOES NOT CALL CLOUD DIRECTLY. `/v1/flags` is org-scoped off a
signed claim, so the only credential that opens it is an org credential -- and a
credential the browser holds is a credential every visitor holds. Cloud is
explicit about this: a publishable `pk-` key is resolvable to an org but is
refused as a principal, and no org-scoped READ in the estate is authenticated by
one. So the session the browser already has is the authority for "who is
asking", and the org is read server-side off a claim, exactly as the rest of the
estate does it.

THE IDENTITY IS NOT AN INPUT. The identity evaluated is the signed-in user's,
taken from the session. There is deliberately no request field naming it: a
caller cannot ask what somebody else's flags are, because there is nothing to
ask with.

NO CAPTURE. This is a plain authenticated read over the session cookie the
browser already sends. The browser SDK stays opted out and initialised with no
usable token; nothing here turns analytics capture back on.

FAILS CLOSED. No IAM token, an unreachable gateway, a non-200 or a body that is
not the verdict shape all raise 502 and grant NOTHING. A flag that cannot be
proven on is off.
"""

from typing import Any

from django.conf import settings
from django.views.decorators.cache import never_cache

import requests
import structlog
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from insights import iam

logger = structlog.get_logger(__name__)

# Evaluation is an in-process SQLite read plus a pure function on the other side,
# so this bounds the network and nothing else. It is deliberately shorter than
# the IAM mint timeout: the frontend shows the app after 3s whether or not flags
# arrived, and a verdict that lands after that only makes the page change under
# the user.
_TIMEOUT_SECONDS = 5

# The verdict, exactly as the evaluator names it. `featureFlags` maps key ->
# true | variant-string; `featureFlagPayloads` maps key -> arbitrary JSON.
_EMPTY: dict[str, Any] = {"featureFlags": {}, "featureFlagPayloads": {}}


class EvaluationUnavailable(Exception):
    """The verdict could not be obtained. Callers grant no flags, never a guess."""


def _identity(user) -> str:
    """The stable identity this user is evaluated as.

    Rollout buckets are a hash of this, so it must not change between requests
    for the same user -- a value that moved would reshuffle which users are in a
    percentage rollout on every page load.
    """
    return user.distinct_id or str(user.uuid)


def _evaluate(user) -> dict[str, Any]:
    """Ask cloud for this user's verdict.

    `person_properties` is the evaluator's wire field name, which is the cloud
    contract and not ours to rename. What travels in it is the org's own view of
    its own user -- the same identity IAM already federated this session from.
    """
    payload = {
        "distinct_id": _identity(user),
        "person_properties": {
            "email": user.email,
            "user_id": str(user.uuid),
        },
    }

    try:
        # Raises IamUnavailable rather than sending an unauthenticated request.
        headers = {**iam.authorization(), "Content-Type": "application/json"}
        response = requests.post(
            f"{settings.HANZO_API_URL}/v1/flags",
            headers=headers,
            json=payload,
            timeout=_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        verdict = response.json()
    except iam.IamUnavailable as e:
        raise EvaluationUnavailable(f"no IAM identity to evaluate with: {e}") from e
    except Exception as e:
        # Deliberately does not include the response body: a gateway error can
        # echo back the request, and the request carried a bearer.
        raise EvaluationUnavailable(f"cloud did not answer: {type(e).__name__}") from e

    if not isinstance(verdict, dict) or not isinstance(verdict.get("featureFlags"), dict):
        raise EvaluationUnavailable("cloud answered something that is not a verdict")

    payloads = verdict.get("featureFlagPayloads")
    return {
        "featureFlags": verdict["featureFlags"],
        "featureFlagPayloads": payloads if isinstance(payloads, dict) else {},
    }


@never_cache
@api_view(["GET"])
def flags(request: Request) -> Response:
    """This user's feature flags, as Hanzo cloud evaluated them.

    Session-authenticated (DRF's default), so an anonymous caller gets 403 and no
    verdict at all.
    """
    try:
        return Response(_evaluate(request.user))
    except EvaluationUnavailable as e:
        logger.warning("flags.unavailable", reason=str(e))
        return Response(
            {**_EMPTY, "detail": "Feature flags could not be evaluated."},
            status=status.HTTP_502_BAD_GATEWAY,
        )
