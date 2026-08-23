"""A project's ingest key, which Hanzo cloud mints.

WHY CLOUD AND NOT HERE. The ingress diverts every SDK wire path on this
deployment's hosts to cloud's `POST /v1/event`, and that endpoint resolves the key it
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

from typing import Optional

from django.conf import settings
from django.utils.text import slugify

import requests
import structlog

from insights import iam

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


def _bearer(user, *, fresh: Optional[str] = None) -> str:
    """The acting user's current IAM access token.

    Identity has one home — `insights.iam` — so an ingest key and an LLM call
    prove who is asking the same way. Only the failure type changes here, to the
    one this module's callers already handle; the message is IAM's own.
    """
    try:
        return iam.user_token(user, fresh=fresh)
    except iam.IamUnavailable as e:
        raise IngestKeyUnavailable(str(e)) from e


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
