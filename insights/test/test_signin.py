"""People sign in to Insights on hanzo.ai, with this deployment's own request.

`/login` and `/signup` draw no form: they start python-social-auth's OIDC request
(client, `/complete/oidc/`, a state and a nonce kept in the session, `next`) and
send the browser to hanzo.ai's sign-in page carrying it. The page a sign-out lands
on, and a sign-in that failed, wait to be asked again. IAM is asked at the API, and
no source names the issuer's host.
"""

import re
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from insights.test.base import APIBaseTest

from django.test import Client, override_settings

ROOT = Path(__file__).resolve().parents[2]

IAM = "https://api.hanzo.ai/v1/iam"
SSO = {
    "SOCIAL_AUTH_OIDC_OIDC_ENDPOINT": IAM,
    "SOCIAL_AUTH_OIDC_KEY": "hanzo-insights",
    "SOCIAL_AUTH_OIDC_SECRET": "secret",
    "SOCIAL_AUTH_OIDC_REDIRECT_URI": "https://insights.hanzo.ai/complete/oidc/",
    "SOCIAL_AUTH_OIDC_ID_TOKEN_ISSUER": "https://hanzo.id",
    "SOCIAL_AUTH_OIDC_AUTHORIZATION_URL": "https://hanzo.ai/login",
    "SOCIAL_AUTH_OIDC_ACCESS_TOKEN_URL": f"{IAM}/oauth/token",
    "SOCIAL_AUTH_OIDC_USERINFO_URL": f"{IAM}/oauth/userinfo",
    "SOCIAL_AUTH_OIDC_REVOKE_TOKEN_URL": f"{IAM}/oauth/revoke",
    "SOCIAL_AUTH_OIDC_JWKS_URI": f"{IAM}/.well-known/jwks",
}


def _asked(response, path: str) -> dict[str, str]:
    assert response.status_code == 302, response.status_code
    to = urlparse(response["Location"])
    assert f"{to.scheme}://{to.netloc}{to.path}" == f"https://hanzo.ai{path}", response["Location"]
    return {k: v[0] for k, v in parse_qs(to.query).items()}


@override_settings(**SSO)
class TestSignin(APIBaseTest):
    def test_login_leaves_for_hanzo_ai_with_this_request(self):
        client = Client()
        q = _asked(client.get("/login?next=/project/1/dashboard"), "/login")
        assert q["client_id"] == "hanzo-insights"
        assert q["redirect_uri"] == "https://insights.hanzo.ai/complete/oidc/"
        assert q["response_type"] == "code"
        assert q["state"] and q["nonce"]
        assert client.session.get("next") == "/project/1/dashboard"

    def test_signup_leaves_for_hanzo_ai_signup(self):
        q = _asked(Client().get("/signup"), "/signup")
        assert q["client_id"] == "hanzo-insights"

    def test_a_signed_out_page_waits_to_be_asked(self):
        response = Client().get("/login?from=logout")
        assert response.status_code == 200
        body = response.content.decode()
        assert "You are signed out" in body
        assert 'href="/login"' in body

    def test_a_failed_sign_in_says_so_and_waits(self):
        response = Client().get("/login?error_code=oauth_cancelled&next=/insights")
        assert response.status_code == 400
        assert "Sign-in did not finish" in response.content.decode()
        assert 'href="/login?next=%2Finsights"' in response.content.decode()

    def test_signed_in_goes_on(self):
        response = self.client.get("/login?next=/insights")
        assert response.status_code == 302 and response["Location"] == "/insights"

    def test_sign_out_lands_on_the_page_that_waits(self):
        response = self.client.get("/logout")
        assert response.status_code == 302
        assert response["Location"] == "/login?from=logout"


def test_no_source_names_the_issuers_host():
    """The issuer `https://hanzo.id` is configuration (`SOCIAL_AUTH_OIDC_ID_TOKEN_ISSUER`),
    never a host the app calls or a page it links."""
    hits = []
    for base in ("insights", "frontend/src"):
        for p in (ROOT / base).rglob("*"):
            if p.suffix not in {".py", ".html", ".ts", ".tsx"} or any(
                part in {"node_modules", "migrations", "__pycache__"} for part in p.parts
            ):
                continue
            if p.name == "test_signin.py":
                continue
            for i, line in enumerate(p.read_text(errors="ignore").splitlines(), 1):
                if re.search(r"hanzo\.id(?![a-z])", line):
                    hits.append(f"{p.relative_to(ROOT)}:{i}")
    assert hits == []


class TestANewPerson(APIBaseTest):
    """Hanzo IAM decides where a person belongs, so one new to Insights is created
    for `iam_org_assign` to place, rather than refused for want of an organization."""

    def test_is_created_in_no_organization_for_iam_to_place(self):
        from unittest.mock import MagicMock

        from django.contrib.auth.models import AnonymousUser

        from insights.api.signup import social_create_user

        strategy = MagicMock()
        strategy.session_get.return_value = None
        backend = MagicMock()
        backend.name = "oidc"
        request = MagicMock()
        request.user = AnonymousUser()
        out = social_create_user.__wrapped__(
            strategy, {"email": "new@iam.example", "fullname": "New Person"}, backend, request, user=None, response={}
        )
        assert out["is_new"] is True
        user = out["user"]
        assert user.email == "new@iam.example"
        assert user.organization is None
        assert not user.has_usable_password()
