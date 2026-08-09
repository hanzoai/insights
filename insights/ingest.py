"""A project's ingest key, which Hanzo cloud mints.

WHY CLOUD AND NOT HERE. The ingress diverts every SDK wire path on this
deployment's hosts to cloud's `POST /v1/event`, and that door resolves the key it
is handed to an (org, project) before it accepts anything -- cloud stamps the
project onto every row it writes. So the key is not a random string this
deployment gets to choose; it is the name cloud gave a project it created. A
locally invented `pk-` is refused with `ingest_key_unknown`, which is a team that
looks configured and drops every event. `Team.api_token` holds cloud's key and
nothing else.

THE ORG IS NOT AN INPUT. Cloud reads the tenant off the bearer's validated IAM
`owner` claim, the same rule the rest of the estate's data plane runs on. What
travels is a name and a slug, so a caller cannot ask for a project in somebody
else's org -- there is nothing to ask with. That also means the bearer has to be
the acting person's, which is what `_bearer` is for.

THE SLUG IS CLOUD'S TO REFUSE. Cloud enforces `^[a-z0-9]([a-z0-9-]{0,38}[a-z0-9])?$`
and rejects reserved subdomains, which every brand-named team lands on: a team
called Hanzo slugifies to `hanzo`, and cloud answers 400. That refusal is
surfaced in cloud's own words so a person picks a real slug. Mangling it here
would name the project something nobody chose and hide that it happened.

ASKING TWICE IS ASKING ONCE. A slug already taken in the caller's own org is a
409, answered by reading that project's key back rather than by making a second
project. The login pipeline re-runs on every sign-in, so it has to land on the
same key every time.
"""

import time
from typing import Optional

from django.conf import settings
from django.utils.text import slugify

import jwt
import requests
import structlog

from insights.iam import REFRESH_MARGIN_SECONDS

logger = structlog.get_logger(__name__)

# Creating a project writes a row and mints a key on the other side, so this is
# wider than the budget for a read. It still has to bound the call: this runs
# inside a login, and an unbounded wait is a login that neither fails nor lands.
_TIMEOUT_SECONDS = 10

# Cloud's rule is 1 to 40 characters. This only proposes a candidate.
_SLUG_MAX = 40


class IngestKeyUnavailable(Exception):
    """No key could be obtained. Callers must fail, never mint one locally."""


def _slug(name: str) -> str:
    """A slug candidate for `name`. Cloud decides whether it is one.

    `slugify` keeps underscores, which cloud's alphabet does not have, so they
    become the hyphen they already mean. Truncating can leave a trailing hyphen,
    so the strip comes after it.
    """
    return slugify(name.replace("_", "-"))[:_SLUG_MAX].strip("-")


def _stale(token: str) -> bool:
    """Whether `token` is too close to its own `exp` to send.

    The signature is not checked -- cloud does that, and this only has to decide
    whether it is worth asking. Anything unreadable counts as stale, so a token
    of an unexpected shape gets refreshed rather than sent and refused.
    """
    try:
        expires_at = jwt.decode(token, options={"verify_signature": False})["exp"]
    except Exception:
        return True
    return time.time() + REFRESH_MARGIN_SECONDS >= float(expires_at)


def _bearer(user, *, fresh: Optional[str] = None) -> str:
    """The acting user's current IAM access token.

    A login already holds one, and passes it as `fresh` -- that path touches
    neither the database nor IAM a second time. Everywhere else reads the token
    python-social-auth stored at sign-in, which is usually expired: these live
    hours, and a person creates their second project days later.

    So an expired one is REFRESHED, using the refresh token stored beside it and
    social-auth's own machinery, which writes the new token back where it found
    the old one. It is deliberately not backfilled from this deployment's service
    identity: that token carries a different `owner`, so the project would land in
    the wrong org, and two ways to authorize one call is the thing being removed.
    """
    if fresh:
        return fresh

    from social_django.utils import load_strategy  # noqa: PLC0415 — needs configured settings

    social = user.social_auth.filter(provider="oidc").first()
    if social is None:
        raise IngestKeyUnavailable("this account has no Hanzo IAM login; sign in again")

    token = (social.extra_data or {}).get("access_token")
    if token and not _stale(token):
        return token

    try:
        social.refresh_token(load_strategy())
    except Exception as e:
        raise IngestKeyUnavailable(
            f"the Hanzo IAM login could not be refreshed ({type(e).__name__}); sign in again"
        ) from e

    # Re-read rather than trust the call: `refresh_token` is a no-op when there is
    # no refresh token to spend, and a silent no-op would send the stale one.
    token = (social.extra_data or {}).get("access_token")
    if not token or _stale(token):
        raise IngestKeyUnavailable("the Hanzo IAM login could not be refreshed; sign in again")

    logger.info("ingest.bearer_refreshed", user_id=str(user.uuid))
    return token


def _body(response) -> dict:
    """Cloud's JSON object, or an empty one if it did not send a readable body."""
    try:
        body = response.json()
    except Exception:
        return {}
    return body if isinstance(body, dict) else {}


def key(*, name: str, user, fresh: Optional[str] = None) -> str:
    """The ingest key for this org's project called `name`, created if it is new."""
    bearer = _bearer(user, fresh=fresh)
    slug = _slug(name)
    headers = {"Authorization": f"Bearer {bearer}", "Content-Type": "application/json"}
    projects = f"{settings.HANZO_API_URL}/v1/projects"

    try:
        response = requests.post(
            projects,
            headers=headers,
            json={"name": name, "slug": slug},
            timeout=_TIMEOUT_SECONDS,
        )
        if response.status_code == 409:
            response = requests.get(f"{projects}/{slug}", headers=headers, timeout=_TIMEOUT_SECONDS)
    except Exception as e:
        # Deliberately does not include the response body: a gateway error can
        # echo back the request, and the request carried a bearer.
        raise IngestKeyUnavailable(f"cloud did not answer: {type(e).__name__}") from e

    if response.status_code == 400:
        # Cloud's own words. This is its error shape rather than a gateway echo,
        # and it is the one refusal a person can act on.
        raise IngestKeyUnavailable(f"cloud refused the slug {slug!r}: {_body(response).get('error') or 'no reason'}")
    if response.status_code == 403:
        # Cloud has no validated principal to read an org off, so it will not say
        # which org this is. A bearer that survived the freshness check and still
        # gets this is one IAM will not vouch for.
        raise IngestKeyUnavailable("cloud did not accept the IAM token; sign in again")
    if response.status_code >= 400:
        raise IngestKeyUnavailable(f"cloud answered {response.status_code}")

    minted = _body(response).get("key")
    if not minted:
        raise IngestKeyUnavailable("cloud answered without a key")

    logger.info("ingest.key_obtained", slug=slug, created=response.status_code == 201)
    return minted
