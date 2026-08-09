import time

import pytest
from unittest.mock import patch

from django.test import override_settings

import jwt

from insights import ingest

HANZO_API_URL = "https://api.hanzo.ai"

configured = override_settings(HANZO_API_URL=HANZO_API_URL)

# A key of the shape cloud actually mints: `pk-` and 43 base64url characters.
CLOUD_KEY = "pk-gUZp6ZVfhJzSwK-rb4oLbVkpCnMBx5uSCpxf_5yEhQk"


def _token(seconds_from_now: float) -> str:
    return jwt.encode({"exp": time.time() + seconds_from_now, "owner": "hanzo"}, "irrelevant")


FRESH = _token(3600)
EXPIRED = _token(-3600)
# Inside the refresh margin: not expired yet, but too close to be worth sending.
NEARLY_EXPIRED = _token(60)


def _response(payload, code=200):
    class Response:
        status_code = code

        def json(self):
            if payload is None:
                raise ValueError("not JSON")
            return payload

    return Response()


class _Social:
    """The social-auth login row, with a refresh that behaves like the real one.

    `UserSocialAuth.refresh_token` writes the new token back into `extra_data` and
    is a silent no-op when there is nothing to spend, so both are modelled here.
    """

    def __init__(self, access_token=EXPIRED, refreshes_to=FRESH):
        self.extra_data = {"access_token": access_token, "refresh_token": "rt-stored"}
        self.refreshes_to = refreshes_to
        self.refresh_count = 0

    def refresh_token(self, _strategy):
        self.refresh_count += 1
        if self.refreshes_to is not None:
            self.extra_data["access_token"] = self.refreshes_to


class _User:
    uuid = "01890000-0000-0000-0000-000000000001"

    def __init__(self, social=None):
        self._social = social

    @property
    def social_auth(self):
        rows = [self._social] if self._social is not None else []

        class Manager:
            def filter(self, **_kwargs):
                return self

            def first(self):
                return rows[0] if rows else None

        return Manager()


def _load_strategy():
    return patch("social_django.utils.load_strategy", return_value=object())


class TestSlug:
    """A candidate for cloud to accept or refuse, never a mangling of a refusal."""

    def test_lowercases_and_hyphenates(self):
        assert ingest._slug("Hanzo Default") == "hanzo-default"

    def test_underscores_become_the_hyphen_they_already_mean(self):
        # Cloud's alphabet has no underscore, so leaving one guarantees a 400.
        assert ingest._slug("my_team") == "my-team"

    def test_fits_cloud_s_length_and_never_ends_on_a_hyphen(self):
        slug = ingest._slug("a" * 30 + " " + "b" * 30)
        assert len(slug) <= 40
        assert not slug.endswith("-")

    def test_a_brand_name_lands_on_a_reserved_word_rather_than_dodging_it(self):
        # Cloud refuses this, which is the point: a person picks the real slug.
        assert ingest._slug("Hanzo") == "hanzo"


class TestBearer:
    """Whose token travels, and how it is kept current."""

    def test_a_login_s_own_token_is_used_untouched(self):
        user = _User(social=_Social())
        assert ingest._bearer(user, fresh=FRESH) == FRESH
        # Never reached the database or IAM: the login already has the token.
        assert user._social.refresh_count == 0

    def test_a_stored_token_that_is_still_good_is_used_as_is(self):
        social = _Social(access_token=FRESH)
        assert ingest._bearer(_User(social=social)) == FRESH
        assert social.refresh_count == 0

    def test_an_expired_stored_token_is_refreshed_exactly_once(self):
        # Measured in production: three of four stored tokens were expired by
        # 6-10 days, so this is the ordinary path, not the edge case.
        social = _Social(access_token=EXPIRED, refreshes_to=FRESH)
        with _load_strategy():
            assert ingest._bearer(_User(social=social)) == FRESH
        assert social.refresh_count == 1

    def test_a_token_inside_the_refresh_margin_is_refreshed_before_it_goes_stale(self):
        social = _Social(access_token=NEARLY_EXPIRED, refreshes_to=FRESH)
        with _load_strategy():
            assert ingest._bearer(_User(social=social)) == FRESH
        assert social.refresh_count == 1

    def test_a_refresh_that_silently_changes_nothing_is_a_failure(self):
        # `refresh_token` returns cleanly when there is no refresh token to spend.
        # Trusting the call rather than the result would send the expired one.
        social = _Social(access_token=EXPIRED, refreshes_to=None)
        with _load_strategy():
            with pytest.raises(ingest.IngestKeyUnavailable, match="sign in again"):
                ingest._bearer(_User(social=social))

    def test_a_refresh_that_raises_is_a_failure(self):
        social = _Social()
        social.refresh_token = lambda _strategy: (_ for _ in ()).throw(OSError("IAM unreachable"))
        with _load_strategy():
            with pytest.raises(ingest.IngestKeyUnavailable, match="sign in again"):
                ingest._bearer(_User(social=social))

    def test_an_account_with_no_iam_login_is_a_failure(self):
        with pytest.raises(ingest.IngestKeyUnavailable, match="sign in again"):
            ingest._bearer(_User(social=None))

    def test_there_is_no_service_identity_to_fall_back_to(self):
        # This deployment's own token carries a different `owner`, so a fallback
        # would put the project in the wrong org. There must be exactly one way.
        with patch("insights.iam.service_token") as service_token:
            with pytest.raises(ingest.IngestKeyUnavailable):
                ingest._bearer(_User(social=None))
        assert service_token.call_count == 0


class TestKey:
    """What is asked of cloud, and what is done with each answer."""

    @configured
    def test_creates_the_project_and_takes_the_key_cloud_minted(self):
        with patch("insights.ingest.requests.post") as post:
            post.return_value = _response({"id": "p1", "org": "hanzo", "slug": "acme", "key": CLOUD_KEY}, code=201)
            assert ingest.key(name="Acme", user=_User(), fresh=FRESH) == CLOUD_KEY

        url = post.call_args[0][0]
        assert url == f"{HANZO_API_URL}/v1/projects"
        assert "/api/" not in url
        assert post.call_args[1]["headers"]["Authorization"] == f"Bearer {FRESH}"
        assert post.call_args[1]["timeout"] == ingest._TIMEOUT_SECONDS

    @configured
    def test_never_names_an_org(self):
        # Cloud reads the tenant off the bearer's `owner` claim. A field for it
        # would be a field for asking about somebody else's org.
        with patch("insights.ingest.requests.post") as post:
            post.return_value = _response({"key": CLOUD_KEY}, code=201)
            ingest.key(name="Acme", user=_User(), fresh=FRESH)

        assert post.call_args[1]["json"] == {"name": "Acme", "slug": "acme"}

    @configured
    def test_a_slug_already_taken_reads_that_project_s_key_back(self):
        # The login pipeline re-runs on every sign-in, so asking twice has to land
        # on the same key rather than make a second project.
        with patch("insights.ingest.requests.post") as post:
            with patch("insights.ingest.requests.get") as get:
                post.return_value = _response({"error": "slug already in use"}, code=409)
                get.return_value = _response({"slug": "acme", "key": CLOUD_KEY})
                assert ingest.key(name="Acme", user=_User(), fresh=FRESH) == CLOUD_KEY

        assert get.call_args[0][0] == f"{HANZO_API_URL}/v1/projects/acme"
        assert get.call_args[1]["headers"]["Authorization"] == f"Bearer {FRESH}"

    @configured
    def test_a_refused_slug_is_surfaced_in_cloud_s_own_words(self):
        # Every brand-named team lands here: "Hanzo" slugifies onto a reserved
        # subdomain. The message has to say so, so a person picks a real slug.
        with patch("insights.ingest.requests.post") as post:
            post.return_value = _response(
                {"status": 400, "error": "slug is a reserved subdomain and cannot be used"}, code=400
            )
            with pytest.raises(ingest.IngestKeyUnavailable) as raised:
                ingest.key(name="Hanzo", user=_User(), fresh=FRESH)

        assert "reserved subdomain" in str(raised.value)
        assert "'hanzo'" in str(raised.value)

    @configured
    def test_a_bearer_cloud_will_not_vouch_for_says_to_sign_in_again(self):
        with patch("insights.ingest.requests.post") as post:
            post.return_value = _response({"status": 403, "code": "forbidden", "error": "X-Org-Id required"}, code=403)
            with pytest.raises(ingest.IngestKeyUnavailable, match="sign in again"):
                ingest.key(name="Acme", user=_User(), fresh=FRESH)

    @configured
    def test_an_unreachable_cloud_is_a_failure_not_a_local_key(self):
        with patch("insights.ingest.requests.post", side_effect=OSError("connection refused")):
            with pytest.raises(ingest.IngestKeyUnavailable):
                ingest.key(name="Acme", user=_User(), fresh=FRESH)

    @configured
    @pytest.mark.parametrize(
        "payload",
        [
            pytest.param({"id": "p1", "slug": "acme"}, id="no-key"),
            pytest.param({"key": ""}, id="empty-key"),
            pytest.param(None, id="not-json"),
            pytest.param([], id="not-an-object"),
        ],
    )
    def test_an_answer_carrying_no_key_is_a_failure(self, payload):
        with patch("insights.ingest.requests.post") as post:
            post.return_value = _response(payload, code=201)
            with pytest.raises(ingest.IngestKeyUnavailable):
                ingest.key(name="Acme", user=_User(), fresh=FRESH)

    @configured
    def test_a_failure_never_carries_the_bearer(self):
        secret = _token(3600) + "-sup3rs3cret"
        with patch("insights.ingest.requests.post", side_effect=OSError(f"Bearer {secret}")):
            with pytest.raises(ingest.IngestKeyUnavailable) as raised:
                ingest.key(name="Acme", user=_User(), fresh=secret)

        assert "sup3rs3cret" not in str(raised.value)

    @configured
    def test_a_stale_stored_token_is_refreshed_before_cloud_is_asked(self):
        social = _Social(access_token=EXPIRED, refreshes_to=FRESH)
        with _load_strategy():
            with patch("insights.ingest.requests.post") as post:
                post.return_value = _response({"key": CLOUD_KEY}, code=201)
                assert ingest.key(name="Acme", user=_User(social=social)) == CLOUD_KEY

        assert social.refresh_count == 1
        assert post.call_args[1]["headers"]["Authorization"] == f"Bearer {FRESH}"
