"""Feature-flag evaluation, answered by Hanzo cloud.

This deployment holds no flag definitions and runs no evaluator. Evaluation is
`POST /v1/flags` on api.hanzo.ai -- the native Go engine in `hanzoai/cloud`
(`apps/flags`), which reads its tenant off the IAM `owner` claim and refuses a
request that carries no validated principal. This view is the endpoint a signed-in
browser calls, and nothing more.

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
not the verdict shape all grant NOTHING. A flag that cannot be proven on is off.

That invariant is about what is GRANTED, not about the status code. A 403 from
cloud -- this identity may not ask -- returns an empty verdict with 200, because
"none" is the true answer and it grants exactly as little. Everything else is
502. Collapsing the two made a stable capability state look like an outage on
every page load, which is how a real outage would have gone unnoticed.

AND SAYS WHICH IT IS. Granting nothing is the right answer to a failure, but
being silent about it is not. "Evaluated, and nothing is on" and "could not
evaluate" grant exactly the same flags, so a caller reading only the flags cannot
tell a broken evaluator from a feature that is deliberately off. Every
flag-gated surface is absent in both cases, which means a failure here reads as
evidence that a feature was removed. So the verdict carries `evaluated`, and
every answer that did not come from the evaluator says so.
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
# so this bounds the network and nothing else. The frontend shows the app after
# 3s whether or not flags arrived, so the verdict must land or fail inside that
# budget — a slower answer only makes the page change under the user.
_TIMEOUT_SECONDS = 2

# The verdict, exactly as the evaluator names it. `featureFlags` maps key ->
# true | variant-string; `featureFlagPayloads` maps key -> arbitrary JSON.
_EMPTY: dict[str, Any] = {"featureFlags": {}, "featureFlagPayloads": {}}


def _unevaluated() -> dict[str, Any]:
    """Grants nothing, and says that is because nothing was evaluated.

    Distinct from an evaluator that ran and turned nothing on, which is the same
    set of flags and a completely different fact about the deployment.
    """
    return {**_EMPTY, "evaluated": False}


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
        # 403 is not a gateway fault: it is cloud saying this identity may not ask.
        # The honest answer to "which flags are on for a caller who cannot ask" is
        # NONE, and an empty verdict grants exactly as little as a 502 does — the
        # fail-closed invariant below is "grant nothing", not "return 502". Keeping
        # them distinct matters because a 502 on every page load reads as an outage
        # and buries the real one; this is a capability state, and it is stable.
        if response.status_code == 403:
            return _unevaluated()
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
        "evaluated": True,
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
            {**_unevaluated(), "detail": "Feature flags could not be evaluated."},
            status=status.HTTP_502_BAD_GATEWAY,
        )
